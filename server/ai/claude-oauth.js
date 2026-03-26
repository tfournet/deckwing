import crypto from 'crypto';
import http from 'http';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CLAUDE_CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';
const AUTHORIZE_URL = 'https://claude.com/cai/oauth/authorize';
const TOKEN_URL = 'https://platform.claude.com/v1/oauth/token';
const SUCCESS_URL = 'https://platform.claude.com/oauth/code/success?app=claude-code';
const SCOPES = [
  'org:create_api_key',
  'user:profile',
  'user:inference',
  'user:sessions:claude_code',
  'user:mcp_servers',
  'user:file_upload',
].join(' ');
const CALLBACK_HOST = 'localhost';
const CALLBACK_PATH = '/callback';
const CALLBACK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes — users may be slow
const SESSION_RETENTION_MS = 10 * 60 * 1000;

const oauthSessions = new Map();

function toBase64Url(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function createVerifier() {
  return toBase64Url(crypto.randomBytes(32));
}

function createChallenge(verifier) {
  return toBase64Url(crypto.createHash('sha256').update(verifier).digest());
}

function createState() {
  return toBase64Url(crypto.randomBytes(32));
}

function claudeConfigDir() {
  if (process.env.CLAUDE_CONFIG_DIR) {
    return process.env.CLAUDE_CONFIG_DIR;
  }
  return join(homedir(), '.claude');
}

function credentialsPath() {
  return join(claudeConfigDir(), '.credentials.json');
}

function getScopeList(scopeValue) {
  if (Array.isArray(scopeValue)) {
    return scopeValue.filter((scope) => typeof scope === 'string' && scope);
  }
  if (typeof scopeValue === 'string') {
    return scopeValue.split(/\s+/).filter(Boolean);
  }
  return SCOPES.split(' ');
}

async function writeClaudeCredentials(tokenJson) {
  const configDir = claudeConfigDir();
  const filePath = credentialsPath();

  await fs.mkdir(configDir, { recursive: true });

  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    existing = {};
  }

  const previousOauth = existing && typeof existing === 'object' ? existing.claudeAiOauth : null;
  const expiresAt = typeof tokenJson.expires_in === 'number'
    ? Date.now() + (tokenJson.expires_in * 1000)
    : (previousOauth && typeof previousOauth.expiresAt === 'number' ? previousOauth.expiresAt : null);

  existing.claudeAiOauth = {
    accessToken: typeof tokenJson.access_token === 'string'
      ? tokenJson.access_token
      : (previousOauth && typeof previousOauth.accessToken === 'string' ? previousOauth.accessToken : null),
    refreshToken: typeof tokenJson.refresh_token === 'string'
      ? tokenJson.refresh_token
      : (previousOauth && typeof previousOauth.refreshToken === 'string' ? previousOauth.refreshToken : null),
    expiresAt,
    scopes: getScopeList(tokenJson.scope),
    subscriptionType: previousOauth && typeof previousOauth.subscriptionType === 'string'
      ? previousOauth.subscriptionType
      : null,
    rateLimitTier: previousOauth && typeof previousOauth.rateLimitTier === 'string'
      ? previousOauth.rateLimitTier
      : null,
  };

  await fs.writeFile(filePath, JSON.stringify(existing, null, 2), 'utf8');
}

function buildAuthorizeUrl(port, challenge, state) {
  const redirectUri = `http://${CALLBACK_HOST}:${port}${CALLBACK_PATH}`;
  const url = new URL(AUTHORIZE_URL);

  url.searchParams.set('code', 'true');
  url.searchParams.set('client_id', CLAUDE_CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);

  return {
    redirectUri,
    oauthUrl: url.toString(),
  };
}

function finalizeSession(state, patch) {
  const session = oauthSessions.get(state);
  if (!session) {
    return null;
  }

  Object.assign(session, patch, { updatedAt: Date.now() });

  if (session.timeoutHandle) {
    clearTimeout(session.timeoutHandle);
    session.timeoutHandle = null;
  }

  if (session.server) {
    session.server.removeAllListeners();
    session.server.close();
    session.server = null;
  }

  return session;
}

async function exchangeAuthorizationCode(session, code, returnedState) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: session.redirectUri,
      client_id: CLAUDE_CLIENT_ID,
      code_verifier: session.codeVerifier,
      state: returnedState,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status})`);
  }

  return response.json();
}

function createCallbackServer(state) {
  const session = oauthSessions.get(state);
  if (!session) {
    throw new Error('OAuth session was not initialized');
  }

  const server = http.createServer(async (req, res) => {
    console.log('  [oauth] Callback received');
    const requestUrl = new URL(req.url || '/', `http://${CALLBACK_HOST}`);

    if (requestUrl.pathname !== CALLBACK_PATH) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const returnedState = requestUrl.searchParams.get('state');
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    const errorDescription = requestUrl.searchParams.get('error_description');

    if (error) {
      finalizeSession(state, {
        status: 'error',
        error: errorDescription || error,
      });
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Claude sign-in was canceled or failed. You can close this tab.');
      return;
    }

    if (!code) {
      finalizeSession(state, {
        status: 'error',
        error: 'No authorization code received.',
      });
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Authorization code not found. You can close this tab.');
      return;
    }

    if (returnedState !== state) {
      finalizeSession(state, {
        status: 'error',
        error: 'Invalid state parameter.',
      });
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Invalid state parameter. You can close this tab.');
      return;
    }

    try {
      console.log('  [oauth] Exchanging authorization code for tokens...');
      const tokenJson = await exchangeAuthorizationCode(session, code, returnedState);
      await writeClaudeCredentials(tokenJson);
      finalizeSession(state, {
        status: 'done',
        error: null,
      });
      res.writeHead(302, { Location: SUCCESS_URL });
      res.end();
    } catch (err) {
      console.error('  [oauth] Token exchange failed');
      finalizeSession(state, {
        status: 'error',
        error: 'Token exchange failed.',
      });
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Claude sign-in failed. You can close this tab and try again.');
    }
  });

  return server;
}

async function startOAuthFlow() {
  cleanupOAuthSessions();

  const state = createState();
  const codeVerifier = createVerifier();
  const codeChallenge = createChallenge(codeVerifier);

  oauthSessions.set(state, {
    state,
    status: 'pending',
    error: null,
    codeVerifier,
    redirectUri: null,
    server: null,
    timeoutHandle: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const server = createCallbackServer(state);

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, CALLBACK_HOST, resolve);
  });

  const address = server.address();
  const port = address && typeof address === 'object' ? address.port : null;

  if (!port) {
    server.close();
    oauthSessions.delete(state);
    throw new Error('Failed to allocate a localhost callback port.');
  }

  const session = oauthSessions.get(state);
  if (!session) {
    server.close();
    throw new Error('OAuth session disappeared before initialization completed.');
  }

  const authInfo = buildAuthorizeUrl(port, codeChallenge, state);

  session.server = server;
  session.redirectUri = authInfo.redirectUri;
  console.log(`  [oauth] Callback server listening on port ${port}`);

  session.timeoutHandle = setTimeout(() => {
    console.log(`  [oauth] Callback timed out after ${CALLBACK_TIMEOUT_MS / 1000}s`);
    finalizeSession(state, {
      status: 'error',
      error: 'Claude sign-in timed out before completion.',
    });
  }, CALLBACK_TIMEOUT_MS);
  if (typeof session.timeoutHandle.unref === 'function') {
    session.timeoutHandle.unref();
  }

  return {
    state,
    oauthUrl: authInfo.oauthUrl,
  };
}

function getOAuthStatus(state) {
  cleanupOAuthSessions();

  const session = oauthSessions.get(state);
  if (!session) {
    return {
      status: 'error',
      error: 'Unknown or expired auth session.',
    };
  }

  return {
    status: session.status,
    error: session.error || undefined,
  };
}

function cleanupOAuthSessions() {
  const now = Date.now();

  for (const [state, session] of oauthSessions.entries()) {
    const isExpiredPending = session.status === 'pending' && (session.createdAt + CALLBACK_TIMEOUT_MS) <= now;
    if (isExpiredPending) {
      finalizeSession(state, {
        status: 'error',
        error: 'Claude sign-in timed out before completion.',
      });
    }

    const finalSession = oauthSessions.get(state);
    if (!finalSession) {
      continue;
    }

    const isRetainedTooLong = finalSession.status !== 'pending' && (finalSession.updatedAt + SESSION_RETENTION_MS) <= now;
    if (isRetainedTooLong) {
      oauthSessions.delete(state);
    }
  }
}

export {
  startOAuthFlow,
  getOAuthStatus,
  cleanupOAuthSessions,
};
