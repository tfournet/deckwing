import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the chat engine — the external AI boundary
const mockChat = vi.fn();
const mockResetSession = vi.fn();

vi.mock('./ai/chat-engine.js', () => ({
  chat: (...args) => mockChat(...args),
  resetSession: (...args) => mockResetSession(...args),
}));

// Import app after mocks are set up
const { default: app } = await import('./app.js');

let server;
let baseUrl;

beforeEach(async () => {
  mockChat.mockReset();
  mockResetSession.mockReset();

  // Start a test server on a random port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function request(method, path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

// --- Health check ---

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const { status, data } = await request('GET', '/api/health');
    expect(status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.service).toBe('rewst-deck-builder');
  });
});

// --- Chat endpoint ---

describe('POST /api/chat', () => {
  it('returns reply and action from chat engine', async () => {
    mockChat.mockResolvedValueOnce({
      reply: 'Here is your deck',
      action: { type: 'create_deck', data: { slides: [] } },
    });

    const { status, data } = await request('POST', '/api/chat', {
      message: 'Create a deck',
      sessionId: 'sess-1',
    });

    expect(status).toBe(200);
    expect(data.reply).toBe('Here is your deck');
    expect(data.action.type).toBe('create_deck');
  });

  it('passes deck and currentSlideIndex to chat engine', async () => {
    mockChat.mockResolvedValueOnce({ reply: 'Updated', action: null });

    const deck = { title: 'Test', slides: [] };
    await request('POST', '/api/chat', {
      message: 'Change title',
      sessionId: 'sess-1',
      deck,
      currentSlideIndex: 2,
    });

    expect(mockChat).toHaveBeenCalledWith({
      sessionId: 'sess-1',
      message: 'Change title',
      deck,
      currentSlideIndex: 2,
    });
  });

  it('defaults deck to null and currentSlideIndex to 0', async () => {
    mockChat.mockResolvedValueOnce({ reply: 'Hi', action: null });

    await request('POST', '/api/chat', {
      message: 'Hello',
      sessionId: 'sess-1',
    });

    expect(mockChat).toHaveBeenCalledWith({
      sessionId: 'sess-1',
      message: 'Hello',
      deck: null,
      currentSlideIndex: 0,
    });
  });

  it('coerces non-numeric currentSlideIndex to 0', async () => {
    mockChat.mockResolvedValueOnce({ reply: 'OK', action: null });

    await request('POST', '/api/chat', {
      message: 'Hello',
      sessionId: 'sess-1',
      currentSlideIndex: 'banana',
    });

    expect(mockChat.mock.calls[0][0].currentSlideIndex).toBe(0);
  });

  it('coerces negative currentSlideIndex to 0', async () => {
    mockChat.mockResolvedValueOnce({ reply: 'OK', action: null });

    await request('POST', '/api/chat', {
      message: 'Hello',
      sessionId: 'sess-1',
      currentSlideIndex: -5,
    });

    expect(mockChat.mock.calls[0][0].currentSlideIndex).toBe(0);
  });

  it('coerces float currentSlideIndex to integer', async () => {
    mockChat.mockResolvedValueOnce({ reply: 'OK', action: null });

    await request('POST', '/api/chat', {
      message: 'Hello',
      sessionId: 'sess-1',
      currentSlideIndex: 2.7,
    });

    expect(mockChat.mock.calls[0][0].currentSlideIndex).toBe(2);
  });

  it('passes valid integer currentSlideIndex through', async () => {
    mockChat.mockResolvedValueOnce({ reply: 'OK', action: null });

    await request('POST', '/api/chat', {
      message: 'Hello',
      sessionId: 'sess-1',
      currentSlideIndex: 3,
    });

    expect(mockChat.mock.calls[0][0].currentSlideIndex).toBe(3);
  });

  it('returns 400 when message is missing', async () => {
    const { status, data } = await request('POST', '/api/chat', {
      sessionId: 'sess-1',
    });
    expect(status).toBe(400);
    expect(data.error).toBe('message is required');
  });

  it('returns 400 when message is empty string', async () => {
    const { status } = await request('POST', '/api/chat', {
      message: '   ',
      sessionId: 'sess-1',
    });
    expect(status).toBe(400);
  });

  it('returns 400 when sessionId is missing', async () => {
    const { status, data } = await request('POST', '/api/chat', {
      message: 'Hello',
    });
    expect(status).toBe(400);
    expect(data.error).toBe('sessionId is required');
  });

  it('returns 500 when chat engine throws', async () => {
    mockChat.mockRejectedValueOnce(new Error('AI exploded'));

    const { status, data } = await request('POST', '/api/chat', {
      message: 'Hello',
      sessionId: 'sess-1',
    });

    expect(status).toBe(500);
    expect(data.error).toBe('Failed to process chat message');
    expect(data.reply).toBeDefined();
    expect(data.action).toBeNull();
  });

  it('trims whitespace from message', async () => {
    mockChat.mockResolvedValueOnce({ reply: 'Trimmed', action: null });

    await request('POST', '/api/chat', {
      message: '  Hello world  ',
      sessionId: 'sess-1',
    });

    expect(mockChat.mock.calls[0][0].message).toBe('Hello world');
  });
});

// --- Reset endpoint ---

describe('POST /api/chat/reset', () => {
  it('calls resetSession and returns ok', async () => {
    const { status, data } = await request('POST', '/api/chat/reset', {
      sessionId: 'sess-1',
    });

    expect(status).toBe(200);
    expect(data.ok).toBe(true);
    expect(mockResetSession).toHaveBeenCalledWith('sess-1');
  });

  it('returns 400 when sessionId is missing', async () => {
    const { status, data } = await request('POST', '/api/chat/reset', {});
    expect(status).toBe(400);
    expect(data.error).toBe('sessionId is required');
  });
});

// --- Decks endpoint ---

describe('GET /api/decks', () => {
  it('returns empty array (placeholder)', async () => {
    const { status, data } = await request('GET', '/api/decks');
    expect(status).toBe(200);
    expect(data.decks).toEqual([]);
  });
});
