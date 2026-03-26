import { useState, useCallback, useEffect, useRef } from 'react';

export function AuthGate({ children }) {
  const [authState, setAuthState] = useState(null);
  const [loginMessage, setLoginMessage] = useState(null);
  const [oauthUrl, setOauthUrl] = useState(null);
  const [polling, setPolling] = useState(false);
  const authPollIntervalRef = useRef(null);
  const authPollTimeoutRef = useRef(null);

  const refreshHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setAuthState(data.auth);
      return data.auth;
    } catch {
      const fallback = { authenticated: false, error: 'Cannot reach server' };
      setAuthState(fallback);
      return fallback;
    }
  }, []);

  const stopAuthPolling = useCallback(() => {
    if (authPollIntervalRef.current) {
      clearInterval(authPollIntervalRef.current);
      authPollIntervalRef.current = null;
    }

    if (authPollTimeoutRef.current) {
      clearTimeout(authPollTimeoutRef.current);
      authPollTimeoutRef.current = null;
    }

    setPolling(false);
  }, []);

  const startLogin = useCallback(async () => {
    stopAuthPolling();
    setLoginMessage('Preparing Claude sign-in...');
    setOauthUrl(null);

    try {
      const response = await fetch('/api/auth/start', { method: 'POST' });
      const data = await response.json();

      if (!response.ok || !data.ok || !data.state || !data.oauthUrl) {
        setLoginMessage(data.error || 'Could not start login. Is the server running?');
        return;
      }

      setOauthUrl(data.oauthUrl);
      setLoginMessage('Open the Claude sign-in page, then complete sign-in in your browser.');
      setPolling(true);

      authPollIntervalRef.current = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/auth/status/${encodeURIComponent(data.state)}`);
          const statusData = await statusResponse.json();

          if (!statusData.ok) {
            stopAuthPolling();
            setOauthUrl(null);
            setLoginMessage(statusData.error || 'Could not check Claude sign-in status.');
            return;
          }

          if (statusData.status === 'pending') {
            return;
          }

          stopAuthPolling();

          if (statusData.status === 'error') {
            setOauthUrl(null);
            setLoginMessage(statusData.error || 'Claude sign-in did not complete.');
            return;
          }

          setLoginMessage('Claude sign-in completed. Verifying session...');
          const auth = await refreshHealth();
          if (auth && auth.authenticated) {
            setOauthUrl(null);
            setLoginMessage(null);
            return;
          }

          setOauthUrl(null);
          setLoginMessage('Claude sign-in completed, but DeckWing could not verify the local session yet. Click Check Again.');
        } catch {
          stopAuthPolling();
          setOauthUrl(null);
          setLoginMessage('Lost connection while checking Claude sign-in status.');
        }
      }, 2000);

      authPollTimeoutRef.current = setTimeout(() => {
        stopAuthPolling();
        setOauthUrl(null);
        setLoginMessage('Claude sign-in timed out. Please try again.');
      }, 125000);
    } catch {
      stopAuthPolling();
      setOauthUrl(null);
      setLoginMessage('Could not start login. Is the server running?');
    }
  }, [refreshHealth, stopAuthPolling]);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  useEffect(() => () => {
    stopAuthPolling();
  }, [stopAuthPolling]);

  if (authState && !authState.authenticated) {
    const hasClaude = authState.claudeInstalled || !authState.error?.includes('not found');

    return (
      <div className="w-screen h-screen bg-ops-indigo-950 flex items-center justify-center">
        <div className="bg-ops-indigo-900 border border-ops-indigo-700/50 rounded-xl p-8 max-w-md text-center space-y-5">
          <h1 className="font-display font-bold text-white text-2xl">DeckWing</h1>
          <p className="text-cloud-gray-300 text-sm">
            Sign in with your Claude account to start building presentations.
          </p>

          {hasClaude ? (
            <>
              {oauthUrl ? (
                <>
                  <a
                    href={oauthUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm px-8 py-3 w-full block text-center"
                  >
                    Open Claude sign-in page
                  </a>
                  <p className="text-bot-teal-400 text-xs animate-pulse">
                    Sign in on the Claude page. This screen will update automatically when you're done.
                  </p>
                </>
              ) : polling ? (
                <>
                  <button className="btn-primary text-sm px-8 py-3 w-full opacity-80" disabled>
                    Waiting for sign in...
                  </button>
                  <p className="text-bot-teal-400 text-xs animate-pulse">
                    Complete the sign-in in your browser, then come back here.
                  </p>
                </>
              ) : (
                <button
                  className="btn-primary text-sm px-8 py-3 w-full"
                  onClick={startLogin}
                >
                  Sign in with Claude
                </button>
              )}

              {loginMessage ? (
                <p className="text-cloud-gray-300 text-xs">{loginMessage}</p>
              ) : null}
            </>
          ) : (
            <>
              <div className="bg-ops-indigo-950 rounded-lg p-4 text-left space-y-2">
                <p className="text-cloud-gray-400 text-xs">Claude Code is required. Install it first:</p>
                <code className="text-bot-teal-400 text-sm font-mono block">
                  curl -fsSL https://claude.ai/install.sh | sh
                </code>
              </div>
              <button
                className="btn-primary text-sm px-6 py-2"
                onClick={async () => {
                  stopAuthPolling();
                  setLoginMessage(null);
                  setOauthUrl(null);
                  setAuthState(null);
                  await refreshHealth();
                }}
              >
                Check Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return children;
}

export default AuthGate;
