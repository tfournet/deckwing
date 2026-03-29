/**
 * API mocks for e2e tests.
 *
 * Intercepts all /api/* calls so tests run without a real server,
 * without Claude auth, and with deterministic responses.
 */

/** A minimal deck for testing */
export const MOCK_DECK = {
  id: 'test-deck-1',
  title: 'Test Presentation',
  author: 'Test User',
  defaultTheme: 'rewst',
  createdAt: '2026-03-26T00:00:00Z',
  updatedAt: '2026-03-26T00:00:00Z',
  slides: [
    {
      id: 's1',
      type: 'title',
      title: 'Test Presentation',
      subtitle: 'End-to-end smoke test',
      theme: 'rewst',
      notes: '',
    },
    {
      id: 's2',
      type: 'content',
      title: 'Key Points',
      icon: 'Zap',
      points: ['First point', 'Second point', 'Third point'],
      theme: 'rewst',
      notes: 'Speaker notes here',
    },
    {
      id: 's3',
      type: 'metric',
      title: 'Results',
      metrics: [
        { value: '42%', label: 'Improvement', color: 'text-bot-teal-400' },
        { value: '3x', label: 'Faster', color: 'text-trigger-amber-400' },
      ],
      theme: 'rewst',
      notes: '',
    },
  ],
};

/** Mock AI response for deck generation */
export const MOCK_CHAT_RESPONSE = {
  reply: 'Here is a 3-slide test deck covering the key points.',
  action: {
    type: 'create_deck',
    data: {
      title: 'AI Generated Deck',
      defaultTheme: 'rewst',
      slides: [
        { type: 'title', title: 'AI Generated Deck', subtitle: 'Created by Deckster' },
        { type: 'content', title: 'Overview', points: ['Point A', 'Point B'] },
        { type: 'section', title: 'Next Steps', theme: 'highlight' },
      ],
    },
  },
};

/** Mock AI response for conversational reply (no action) */
export const MOCK_CHAT_REPLY = {
  reply: 'That looks good! The deck has 3 slides covering the main topics. Would you like me to adjust anything?',
  action: null,
};

/**
 * Set up all API mocks on a Playwright page.
 * Call this in beforeEach or at the start of each test.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} options
 * @param {boolean} options.authenticated — whether to mock as authenticated (default: true)
 * @param {'create'|'reply'} options.chatMode — what the chat endpoint returns (default: 'reply')
 */
export async function mockAPIs(page, { authenticated = true, chatMode = 'reply' } = {}) {
  // Health check + auth
  await page.route('**/api/health', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        service: 'deckwing',
        auth: authenticated
          ? { authenticated: true, method: 'api_key' }
          : { authenticated: false, error: 'Not authenticated', loginCommand: 'claude auth login' },
      }),
    });
  });

  // Chat endpoint
  await page.route('**/api/chat', (route) => {
    const body = chatMode === 'create' ? MOCK_CHAT_RESPONSE : MOCK_CHAT_REPLY;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  // Chat reset
  await page.route('**/api/chat/reset', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  // Deck review
  await page.route('**/api/deck/review', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ suggestions: [] }),
    });
  });

  // OAuth start
  await page.route('**/api/auth/start', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        state: 'mock-state',
        oauthUrl: 'https://claude.com/cai/oauth/authorize?mock=true',
      }),
    });
  });

  // OAuth status
  await page.route('**/api/auth/status/*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, status: 'done' }),
    });
  });

  // Deck list
  await page.route('**/api/decks', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ decks: [] }),
    });
  });
}
