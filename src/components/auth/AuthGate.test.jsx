/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { AuthGate } from './AuthGate.jsx';

function mockFetchResponses({ health, authStart, authStatus } = {}) {
  return vi.fn((url, opts) => {
    if (url === '/api/health') {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            health ?? { auth: { authenticated: false, claudeInstalled: true } }
          ),
      });
    }

    if (url === '/api/auth/start' && opts?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            authStart ?? {
              ok: true,
              state: 'test-state-123',
              oauthUrl: 'https://claude.ai/oauth/authorize?state=test-state-123',
            }
          ),
      });
    }

    if (typeof url === 'string' && url.startsWith('/api/auth/status/')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(authStatus ?? { ok: true, status: 'pending' }),
      });
    }

    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'unexpected' }),
    });
  });
}

describe('AuthGate', () => {
  let openSpy;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    openSpy = vi.fn(() => ({}));
    vi.stubGlobal('open', openSpy);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('opens OAuth popup with noopener,noreferrer', async () => {
    const fetchMock = mockFetchResponses();
    vi.stubGlobal('fetch', fetchMock);

    await act(async () => {
      render(
        <AuthGate>
          <p>Protected content</p>
        </AuthGate>
      );
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    const signInButton = screen.getByRole('button', {
      name: /sign in with claude/i,
    });

    await act(async () => {
      fireEvent.click(signInButton);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('claude.ai/oauth'),
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('renders children when authenticated', async () => {
    const fetchMock = mockFetchResponses({
      health: { auth: { authenticated: true } },
    });
    vi.stubGlobal('fetch', fetchMock);

    await act(async () => {
      render(
        <AuthGate>
          <p>Protected content</p>
        </AuthGate>
      );
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(screen.getByText('Protected content')).toBeTruthy();
  });

  it('shows fallback sign-in link with noopener noreferrer', async () => {
    const fetchMock = mockFetchResponses();
    vi.stubGlobal('fetch', fetchMock);

    await act(async () => {
      render(
        <AuthGate>
          <p>Protected content</p>
        </AuthGate>
      );
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    const signInButton = screen.getByRole('button', {
      name: /sign in with claude/i,
    });

    await act(async () => {
      fireEvent.click(signInButton);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    const fallbackLink = screen.getByText(/click here/i);
    expect(fallbackLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(fallbackLink.getAttribute('target')).toBe('_blank');
  });
});
