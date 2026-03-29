import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_MODEL, resolveModelId } from '../../shared/models.js';

// Must set API key before chat-engine.js evaluates its top-level code
const { mockCreate } = vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY = 'test-key';
  const mockCreate = vi.fn();
  return { mockCreate };
});

vi.mock('@anthropic-ai/sdk', () => ({
  default: class Anthropic {
    constructor() {
      this.messages = { create: mockCreate };
    }
  },
}));

import { chat, createSession, resetSession, cleanStaleSessions } from './chat-engine.js';

// Track snapshots of messages at call time, since session.messages is
// passed by reference and mutated after the API call returns.
let messageSnapshots = [];

function stubClaudeResponse(json) {
  mockCreate.mockImplementationOnce((args) => {
    messageSnapshots.push(args.messages.map(m => ({ ...m })));
    return Promise.resolve({ content: [{ text: JSON.stringify(json) }] });
  });
}

function stubClaudeRawText(text) {
  mockCreate.mockImplementationOnce((args) => {
    messageSnapshots.push(args.messages.map(m => ({ ...m })));
    return Promise.resolve({ content: [{ text }] });
  });
}

let testSessionId;

beforeEach(() => {
  mockCreate.mockReset();
  messageSnapshots = [];
  testSessionId = createSession();
});

// --- Basic chat flow ---

describe('chat', () => {
  it('returns reply and null action for conversational response', async () => {
    stubClaudeResponse({ reply: 'Hello! How can I help?' });

    const result = await chat({
      sessionId: testSessionId,
      message: 'Hi',
      deck: null,
      currentSlideIndex: 0,
    });

    expect(result.reply).toBe('Hello! How can I help?');
    expect(result.action).toBeNull();
  });

  it('returns reply and action for deck creation', async () => {
    const action = {
      type: 'create_deck',
      data: {
        title: 'MSP Automation',
        slides: [
          { type: 'title', title: 'MSP Automation' },
          { type: 'content', title: 'Benefits', points: ['Speed', 'Scale'] },
        ],
      },
    };
    stubClaudeResponse({ reply: 'Here is your deck!', action });

    const result = await chat({
      sessionId: testSessionId,
      message: 'Create a deck about MSP automation',
      deck: null,
      currentSlideIndex: 0,
    });

    expect(result.reply).toBe('Here is your deck!');
    expect(result.action.type).toBe('create_deck');
    expect(result.action.data.slides).toHaveLength(2);
  });

  it('passes deck context to Claude when deck is provided', async () => {
    stubClaudeResponse({ reply: 'Updated!' });

    const deck = { title: 'Test', slides: [{ type: 'title', title: 'Test' }] };
    await chat({
      sessionId: testSessionId,
      message: 'Change the title',
      deck,
      currentSlideIndex: 0,
    });

    const sentMessages = mockCreate.mock.calls[0][0].messages;
    const userContent = sentMessages[0].content;
    expect(userContent).toContain('<deck_state>');
    expect(userContent).toContain('"currentSlideIndex": 0');
  });

  it('does not include deck_state when deck is null', async () => {
    stubClaudeResponse({ reply: 'No deck yet' });

    await chat({
      sessionId: testSessionId,
      message: 'Hello',
      deck: null,
      currentSlideIndex: 0,
    });

    const userContent = mockCreate.mock.calls[0][0].messages[0].content;
    expect(userContent).toBe('Hello');
    expect(userContent).not.toContain('deck_state');
  });

  it('passes the selected model to the API client', async () => {
    stubClaudeResponse({ reply: 'Custom model response' });

    await chat({
      sessionId: testSessionId,
      message: 'Use Opus',
      deck: null,
      currentSlideIndex: 0,
      model: 'claude-opus-4-6-20250807',
    });

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'claude-opus-4-6-20250807',
    }));
  });

  it('falls back to DEFAULT_MODEL when model is not provided', async () => {
    stubClaudeResponse({ reply: 'Default model response' });

    await chat({
      sessionId: testSessionId,
      message: 'Use default',
      deck: null,
      currentSlideIndex: 0,
    });

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: resolveModelId(DEFAULT_MODEL),
    }));
  });
});

// --- JSON parsing resilience ---

describe('chat - response parsing', () => {
  it('handles markdown code fences around JSON', async () => {
    const json = JSON.stringify({ reply: 'Fenced', action: null });
    stubClaudeRawText('```json\n' + json + '\n```');

    const result = await chat({
      sessionId: testSessionId,
      message: 'test',
      deck: null,
      currentSlideIndex: 0,
    });

    expect(result.reply).toBe('Fenced');
  });

  it('extracts JSON from mixed text/JSON response', async () => {
    const json = JSON.stringify({ reply: 'Extracted', action: null });
    stubClaudeRawText('Here is the result: ' + json + ' hope that helps!');

    const result = await chat({
      sessionId: testSessionId,
      message: 'test',
      deck: null,
      currentSlideIndex: 0,
    });

    expect(result.reply).toBe('Extracted');
  });

  it('returns graceful error for completely unparseable response', async () => {
    stubClaudeRawText('This is just plain text with no JSON at all.');

    const result = await chat({
      sessionId: testSessionId,
      message: 'test',
      deck: null,
      currentSlideIndex: 0,
    });

    expect(result.reply).toContain('trouble formatting');
    expect(result.action).toBeNull();
  });

  it('returns graceful error when reply field is missing', async () => {
    stubClaudeRawText(JSON.stringify({ action: null }));

    const result = await chat({
      sessionId: testSessionId,
      message: 'test',
      deck: null,
      currentSlideIndex: 0,
    });

    expect(result.reply).toContain('trouble formatting');
  });
});

// --- Slide validation in actions ---

describe('chat - action validation', () => {
  it('rejects create_deck with invalid slides', async () => {
    stubClaudeResponse({
      reply: 'Here you go',
      action: {
        type: 'create_deck',
        data: {
          slides: [
            { type: 'content' }, // missing title and points
          ],
        },
      },
    });

    const result = await chat({
      sessionId: testSessionId,
      message: 'make a deck',
      deck: null,
      currentSlideIndex: 0,
    });

    expect(result.reply).toContain("didn't pass validation");
    expect(result.action).toBeNull();
  });

  it('rejects add_slide with invalid slide', async () => {
    stubClaudeResponse({
      reply: 'Added',
      action: {
        type: 'add_slide',
        data: {
          slide: { type: 'grid' }, // missing title and items
        },
      },
    });

    const result = await chat({
      sessionId: testSessionId,
      message: 'add a slide',
      deck: null,
      currentSlideIndex: 0,
    });

    expect(result.reply).toContain("didn't pass validation");
    expect(result.action).toBeNull();
  });

  it('passes through valid add_slide action', async () => {
    stubClaudeResponse({
      reply: 'Added a quote',
      action: {
        type: 'add_slide',
        data: {
          slide: { type: 'quote', quote: 'Test quote' },
        },
      },
    });

    const result = await chat({
      sessionId: testSessionId,
      message: 'add a quote slide',
      deck: null,
      currentSlideIndex: 0,
    });

    expect(result.action.type).toBe('add_slide');
    expect(result.action.data.slide.quote).toBe('Test quote');
  });

  it('passes through update_slide without type change', async () => {
    stubClaudeResponse({
      reply: 'Updated title',
      action: {
        type: 'update_slide',
        data: { index: 0, changes: { title: 'New Title' } },
      },
    });

    const result = await chat({
      sessionId: testSessionId,
      message: 'change the title',
      deck: null,
      currentSlideIndex: 0,
    });

    expect(result.action.type).toBe('update_slide');
    expect(result.action.data.changes.title).toBe('New Title');
  });
});

describe('chat - block validation in updates', () => {
  it('rejects update_slide with blocks missing kind', async () => {
    stubClaudeResponse({
      reply: 'Updated',
      action: {
        type: 'update_slide',
        data: {
          index: 0,
          changes: {
            blocks: [
              { slot: 'title', kind: 'heading', text: 'OK' },
              { slot: 'left', text: 'Missing kind' },
            ],
          },
        },
      },
    });

    const result = await chat({
      sessionId: testSessionId,
      message: 'update blocks',
      deck: null,
      currentSlideIndex: 0,
    });

    expect(result.reply).toContain("didn't pass validation");
    expect(result.action).toBeNull();
  });

  it('rejects update_slide with blocks missing slot', async () => {
    stubClaudeResponse({
      reply: 'Updated',
      action: {
        type: 'update_slide',
        data: {
          index: 0,
          changes: {
            blocks: [
              { kind: 'heading', text: 'No slot' },
            ],
          },
        },
      },
    });

    const result = await chat({
      sessionId: testSessionId,
      message: 'update blocks',
      deck: null,
      currentSlideIndex: 0,
    });

    expect(result.reply).toContain("didn't pass validation");
    expect(result.action).toBeNull();
  });

  it('passes update_slide with valid blocks', async () => {
    stubClaudeResponse({
      reply: 'Updated',
      action: {
        type: 'update_slide',
        data: {
          index: 0,
          changes: {
            blocks: [
              { slot: 'title', kind: 'heading', text: 'Valid' },
              { slot: 'body', kind: 'list', items: ['a', 'b'] },
            ],
          },
        },
      },
    });

    const result = await chat({
      sessionId: testSessionId,
      message: 'update blocks',
      deck: null,
      currentSlideIndex: 0,
    });

    expect(result.action).not.toBeNull();
    expect(result.action.type).toBe('update_slide');
  });
  it('rejects layout block updates that fail layout validation', async () => {
    stubClaudeResponse({
      reply: 'Updated',
      action: {
        type: 'update_slide',
        data: {
          index: 0,
          changes: {
            layout: 'single-center',
            blocks: [
              { slot: 'title', kind: 'heading', text: 'Valid title' },
              { slot: 'body', kind: 'heading', text: 'Wrong kind for body' },
            ],
          },
        },
      },
    });

    const result = await chat({
      sessionId: testSessionId,
      message: 'update layout blocks',
      deck: null,
      currentSlideIndex: 0,
    });

    expect(result.reply).toContain("didn't pass validation");
    expect(result.reply).toContain('kind "heading" not allowed in slot "body"');
    expect(result.action).toBeNull();
  });

});

// --- Session management ---

describe('session management', () => {
  // chat() pushes the user message into session history before calling the API,
  // so the messages array sent to Claude includes the current message.

  it('maintains conversation history across calls', async () => {
    const sid = createSession();
    stubClaudeResponse({ reply: 'First response' });
    await chat({ sessionId: sid, message: 'Hello', deck: null, currentSlideIndex: 0 });

    stubClaudeResponse({ reply: 'Second response' });
    await chat({ sessionId: sid, message: 'Follow up', deck: null, currentSlideIndex: 0 });

    // Second call snapshot: user1, assistant1, user2 (current)
    const msgs = messageSnapshots[1];
    expect(msgs).toHaveLength(3);
    expect(msgs[0].role).toBe('user');
    expect(msgs[1].role).toBe('assistant');
    expect(msgs[2].role).toBe('user');
  });

  it('isolates sessions from each other', async () => {
    const sidA = createSession();
    const sidB = createSession();

    stubClaudeResponse({ reply: 'A' });
    await chat({ sessionId: sidA, message: 'Hello A', deck: null, currentSlideIndex: 0 });

    stubClaudeResponse({ reply: 'B' });
    await chat({ sessionId: sidB, message: 'Hello B', deck: null, currentSlideIndex: 0 });

    // Session B snapshot should only have its own message
    const msgs = messageSnapshots[1];
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe('Hello B');
  });

  it('resetSession clears history and rejects further use', async () => {
    const sid = createSession();
    stubClaudeResponse({ reply: 'First' });
    await chat({ sessionId: sid, message: 'Hello', deck: null, currentSlideIndex: 0 });

    resetSession(sid);

    await expect(
      chat({ sessionId: sid, message: 'Fresh start', deck: null, currentSlideIndex: 0 })
    ).rejects.toThrow('Invalid or expired session');
  });

  it('removes user message from history on API error', async () => {
    const sid = createSession();
    mockCreate.mockRejectedValueOnce(new Error('API down'));

    await expect(
      chat({ sessionId: sid, message: 'Fail', deck: null, currentSlideIndex: 0 })
    ).rejects.toThrow('Claude API call failed');

    // Next call should have clean history (failed message was rolled back)
    stubClaudeResponse({ reply: 'Recovered' });
    await chat({ sessionId: sid, message: 'Try again', deck: null, currentSlideIndex: 0 });

    // messageSnapshots[0] is the recovered call (the rejected call didn't snapshot)
    const msgs = messageSnapshots[0];
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe('Try again');
  });
});

describe('cleanStaleSessions', () => {
  it('evicts sessions idle beyond TTL', async () => {
    const staleSid = createSession();
    stubClaudeResponse({ reply: 'Old message' });
    await chat({ sessionId: staleSid, message: 'Hi', deck: null, currentSlideIndex: 0 });

    // Create a "fresh" session
    const freshSid = createSession();
    stubClaudeResponse({ reply: 'New message' });
    await chat({ sessionId: freshSid, message: 'Hello', deck: null, currentSlideIndex: 0 });

    // Clean should not evict fresh sessions (lastActivity is now)
    cleanStaleSessions();

    // freshSid should still have history
    stubClaudeResponse({ reply: 'Follow up' });
    await chat({ sessionId: freshSid, message: 'Again', deck: null, currentSlideIndex: 0 });

    // Second call should have 3 messages (user, assistant, user) — history preserved
    const msgs = messageSnapshots[messageSnapshots.length - 1];
    expect(msgs).toHaveLength(3);
  });
});
