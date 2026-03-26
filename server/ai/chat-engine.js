/**
 * Chat Engine - DeckWing AI
 *
 * Manages Claude API calls and per-session conversation history.
 * Supports two auth modes:
 *   1. Direct API (ANTHROPIC_API_KEY set) — fastest, standard
 *   2. Claude Agent SDK (no key) — uses local Claude Code OAuth session
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { SYSTEM_PROMPT } from './system-prompt.js';
import { validateSlide } from '../../shared/schema/slide-schema.js';
import { findClaudeBinary } from './find-claude.js';
import { DEFAULT_MODEL } from '../../shared/models.js';

/**
 * Find Git Bash on Windows — required by Claude Code.
 */
function findGitBash() {
  if (process.platform !== 'win32') return null;
  if (process.env.CLAUDE_CODE_GIT_BASH_PATH) return process.env.CLAUDE_CODE_GIT_BASH_PATH;

  const candidates = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
    join(process.env.LOCALAPPDATA || '', 'Programs', 'Git', 'bin', 'bash.exe'),
    join(process.env.ProgramFiles || '', 'Git', 'bin', 'bash.exe'),
  ];

  for (const p of candidates) {
    if (p && existsSync(p)) return p;
  }
  return null;
}

const MAX_TOKENS = 8192;

// Determine auth mode at startup
const HAS_API_KEY = !!process.env.ANTHROPIC_API_KEY;
let directClient = null;
let claudePath = null;

if (HAS_API_KEY) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  directClient = new Anthropic();
  console.log('  AI ready (API key)');
} else {
  claudePath = findClaudeBinary();
  if (claudePath) {
    // On Windows, Claude Code needs Git Bash — set env var so it can find it
    const gitBash = findGitBash();
    if (gitBash) {
      process.env.CLAUDE_CODE_GIT_BASH_PATH = gitBash;
    }
    console.log(`  AI ready (Claude Code at ${claudePath})`);
  } else {
    console.log('  AI not available — Claude Code not found');
  }
}

/**
 * In-memory conversation history keyed by session ID.
 */
const sessions = new Map();
const SESSION_TTL_MS = 60 * 60 * 1000;

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { messages: [], lastActivity: new Date() });
  }
  const session = sessions.get(sessionId);
  session.lastActivity = new Date();
  return session;
}

export function cleanStaleSessions() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, session] of sessions.entries()) {
    if (session.lastActivity.getTime() < cutoff) {
      sessions.delete(id);
    }
  }
}

export function resetSession(sessionId) {
  sessions.delete(sessionId);
}

/**
 * Validate slides in an action's data.
 */
function validateActionSlides(action) {
  const errors = [];
  if (!action?.data) return errors;

  const slidesToCheck = [];

  if (action.type === 'create_deck' && Array.isArray(action.data.slides)) {
    action.data.slides.forEach((slide, i) => {
      slidesToCheck.push({ slide, label: `Slide ${i + 1}` });
    });
  } else if (action.type === 'add_slide' && action.data.slide) {
    slidesToCheck.push({ slide: action.data.slide, label: 'New slide' });
  } else if (action.type === 'update_slide' && action.data.changes) {
    const changes = action.data.changes;

    if (changes.type) {
      const result = validateSlide({ ...changes });
      result.errors.forEach(e => errors.push(`Update changes: ${e}`));
    }

    if (Array.isArray(changes.blocks)) {
      changes.blocks.forEach((block, i) => {
        if (!block.kind) {
          errors.push(`Block ${i}: missing required field "kind"`);
        }
        if (!block.slot) {
          errors.push(`Block ${i}: missing required field "slot"`);
        }
      });
    }

    return errors;
  }

  for (const { slide, label } of slidesToCheck) {
    const result = validateSlide(slide);
    result.errors.forEach(e => errors.push(`${label}: ${e}`));
  }

  return errors;
}

/**
 * Extract the first balanced JSON object from a string.
 */
function extractJsonObject(text) {
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') { depth--; if (depth === 0) return text.substring(start, i + 1); }
  }
  return null;
}

/**
 * Parse Claude's response text into { reply, action }.
 */
function parseClaudeResponse(rawText) {
  let text = rawText.trim();

  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (parseError) {
    const extracted = extractJsonObject(text);
    if (extracted) {
      try {
        parsed = JSON.parse(extracted);
      } catch {
        throw new Error(`Claude returned malformed JSON: ${parseError.message}`);
      }
    } else {
      throw new Error(`Claude returned no JSON: ${parseError.message}`);
    }
  }

  if (typeof parsed.reply !== 'string') {
    throw new Error('Claude response missing required "reply" string field');
  }

  return {
    reply: parsed.reply,
    action: parsed.action ?? null,
  };
}

function buildUserMessage(message, deck, currentSlideIndex) {
  if (!deck) return message;
  const context = { currentDeck: deck, currentSlideIndex: currentSlideIndex ?? 0 };
  return `${message}\n\n<deck_state>\n${JSON.stringify(context, null, 2)}\n</deck_state>`;
}

/**
 * Call Claude via direct API (fast path when API key is available).
 */
async function callDirectAPI(messages, model = DEFAULT_MODEL) {
  const response = await directClient.messages.create({
    model,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages,
  });

  const text = response.content[0]?.text;
  if (!text) throw new Error('Claude returned an empty response');
  return text;
}

/**
 * Call Claude via Agent SDK (uses local Claude Code binary with its own auth).
 */
async function callAgentSDK(messages, model = DEFAULT_MODEL) {
  const { query } = await import('@anthropic-ai/claude-agent-sdk');

  const lastMessage = messages[messages.length - 1];
  const history = messages.slice(0, -1);
  const historyContext = history.length > 0
    ? '\n\n<conversation_history>\n' +
      history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n') +
      '\n</conversation_history>\n\n'
    : '';

  const fullPrompt = historyContext + lastMessage.content;
  let fullResponse = '';

  const sdkOptions = {
    model,
    systemPrompt: SYSTEM_PROMPT,
    allowedTools: ['WebSearch', 'WebFetch'],
    maxTurns: 3,
  };

  if (claudePath) {
    sdkOptions.pathToClaudeCodeExecutable = claudePath;
  }

  for await (const message of query({
    prompt: fullPrompt,
    options: sdkOptions,
  })) {
    if (message.type === 'assistant' && message.message?.content) {
      for (const block of message.message.content) {
        if (block.type === 'text') {
          fullResponse += block.text;
        }
      }
    }
  }

  if (!fullResponse) throw new Error('Claude Agent SDK returned an empty response');
  return fullResponse;
}


/**
 * Send a message to Claude and return the parsed response.
 */
export async function chat({ sessionId, message, deck, currentSlideIndex, model }) {
  const session = getSession(sessionId);

  const userContent = buildUserMessage(message, deck, currentSlideIndex);
  session.messages.push({ role: 'user', content: userContent });

  const selectedModel = typeof model === 'string' && model.trim() ? model : DEFAULT_MODEL;

  let rawResponse;
  try {
    if (!directClient) {
      // Try to pick up credentials that were written after startup (e.g. user just signed in)
      // Try to find claude binary that may have been installed after startup
      claudePath = findClaudeBinary({ skipCache: true });
      if (!claudePath) {
        throw new Error('Not authenticated. Please sign in with Claude first.');
      }
    }
    rawResponse = directClient
      ? await callDirectAPI(session.messages, selectedModel)
      : await callAgentSDK(session.messages, selectedModel);
  } catch (apiError) {
    session.messages.pop();
    throw new Error(`Claude API call failed: ${apiError.message}`);
  }

  let parsed;
  try {
    parsed = parseClaudeResponse(rawResponse);
  } catch (parseError) {
    console.error('  [parse error]', parseError.message);
    const fallbackReply = "I had trouble formatting my response. Could you try rephrasing your request?";
    session.messages.push({ role: 'assistant', content: JSON.stringify({ reply: fallbackReply, action: null }) });
    return { reply: fallbackReply, action: null };
  }

  session.messages.push({ role: 'assistant', content: rawResponse });

  if (parsed.action) {
    const validationErrors = validateActionSlides(parsed.action);
    if (validationErrors.length > 0) {
      console.error('  [validation]', validationErrors.join('; '));
      return {
        reply: `I generated slides that didn't pass validation: ${validationErrors.join('; ')}. Please try again.`,
        action: null,
      };
    }
  }

  return parsed;
}
