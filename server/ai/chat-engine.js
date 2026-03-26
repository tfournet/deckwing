/**
 * Chat Engine - Rewst Deck Builder AI
 *
 * Manages Claude API calls and per-session conversation history.
 * Parses and validates AI responses before returning to the caller.
 */

import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './system-prompt.js';
import { validateSlide } from '../../src/schema/slide-schema.js';

const client = new Anthropic();
const MODEL = 'claude-sonnet-4-6-20250514';
const MAX_TOKENS = 8192;

/**
 * In-memory conversation history keyed by session ID.
 * Each value: { messages: [...], lastActivity: Date }
 */
const sessions = new Map();

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get or create a session's message history.
 */
function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { messages: [], lastActivity: new Date() });
  }
  const session = sessions.get(sessionId);
  session.lastActivity = new Date();
  return session;
}

/**
 * Remove sessions that have been idle longer than SESSION_TTL_MS.
 */
export function cleanStaleSessions() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, session] of sessions.entries()) {
    if (session.lastActivity.getTime() < cutoff) {
      sessions.delete(id);
    }
  }
}

/**
 * Reset a session's conversation history.
 */
export function resetSession(sessionId) {
  sessions.delete(sessionId);
}

/**
 * Validate all slides in an action's data, if applicable.
 * Returns an array of validation error strings. Empty array means all valid.
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
    // For updates, we can only validate the changed fields partially.
    // Require the type field to be valid if present.
    const changes = action.data.changes;
    if (changes.type) {
      const result = validateSlide({ ...changes });
      result.errors.forEach(e => errors.push(`Update changes: ${e}`));
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
 * Extract and parse the JSON response from Claude.
 * Claude is instructed to return raw JSON, but may occasionally wrap it.
 *
 * Returns { reply, action } or throws on unrecoverable parse failure.
 */
function parseClaudeResponse(rawText) {
  let text = rawText.trim();

  // Strip markdown code fences if Claude includes them despite instructions
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (parseError) {
    // Attempt to extract the first JSON object from a mixed response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
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

/**
 * Build the user message content that includes deck context.
 */
function buildUserMessage(message, deck, currentSlideIndex) {
  if (!deck) {
    return message;
  }

  const context = {
    currentDeck: deck,
    currentSlideIndex: currentSlideIndex ?? 0,
  };

  return `${message}\n\n<deck_state>\n${JSON.stringify(context, null, 2)}\n</deck_state>`;
}

/**
 * Send a message to Claude and return the parsed response.
 *
 * @param {object} params
 * @param {string} params.sessionId - Unique session identifier
 * @param {string} params.message - User's message
 * @param {object|null} params.deck - Current deck state (may be null for new sessions)
 * @param {number} params.currentSlideIndex - Currently selected slide index
 * @returns {Promise<{ reply: string, action: object|null }>}
 */
export async function chat({ sessionId, message, deck, currentSlideIndex }) {
  const session = getSession(sessionId);

  const userContent = buildUserMessage(message, deck, currentSlideIndex);
  session.messages.push({ role: 'user', content: userContent });

  let rawResponse;
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: session.messages,
    });

    rawResponse = response.content[0]?.text;
    if (!rawResponse) {
      throw new Error('Claude returned an empty response');
    }
  } catch (apiError) {
    // Remove the message we added so the session stays consistent
    session.messages.pop();
    throw new Error(`Claude API call failed: ${apiError.message}`);
  }

  // Add Claude's raw response to history before parsing,
  // so conversation continuity is preserved even if parsing fails.
  session.messages.push({ role: 'assistant', content: rawResponse });

  let parsed;
  try {
    parsed = parseClaudeResponse(rawResponse);
  } catch (parseError) {
    console.error('Failed to parse Claude response:', parseError.message);
    console.error('Raw response:', rawResponse);
    // Return a graceful error reply with no action
    return {
      reply: "I had trouble formatting my response. Could you try rephrasing your request?",
      action: null,
    };
  }

  // Validate any slides in the action before returning
  if (parsed.action) {
    const validationErrors = validateActionSlides(parsed.action);
    if (validationErrors.length > 0) {
      console.error('AI generated invalid slides:', validationErrors);
      return {
        reply: `I generated slides that didn't pass validation: ${validationErrors.join('; ')}. Please try again.`,
        action: null,
      };
    }
  }

  return parsed;
}
