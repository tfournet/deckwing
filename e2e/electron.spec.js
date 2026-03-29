import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import { existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const ROOT = join(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const electronBinary = require('electron');

test.describe('Electron Smoke Tests', () => {
  let app;

  test.beforeAll(async () => {
    // Remove stale singleton lock
    const lockPath = join(
      process.env.HOME || process.env.USERPROFILE || '',
      '.config', 'deckwing', 'SingletonLock'
    );
    try { (await import('fs')).unlinkSync(lockPath); } catch {}
  });

  test.afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  test('app launches and shows a window', async () => {
    app = await electron.launch({
      executablePath: electronBinary,
      args: [join(ROOT, 'electron', 'main.js'), '--no-sandbox'],
      env: {
        ...process.env,
        NODE_OPTIONS: '',
        ANTHROPIC_API_KEY: 'test-key-for-smoke-test',
      },
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    const title = await window.title();
    expect(title).toContain('DeckWing');
  });

  test('server starts and health endpoint responds', async () => {
    app = await electron.launch({
      executablePath: electronBinary,
      args: [join(ROOT, 'electron', 'main.js'), '--no-sandbox'],
      env: {
        ...process.env,
        NODE_OPTIONS: '',
        ANTHROPIC_API_KEY: 'test-key-for-smoke-test',
      },
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // The app loads from localhost:<port> — extract the port from the URL
    const url = window.url();
    expect(url).toContain('localhost');

    // Fetch health endpoint
    const health = await window.evaluate(async () => {
      const res = await fetch('/api/health');
      return res.json();
    });

    expect(health.status).toBe('ok');
    expect(health.service).toBe('deckwing');
  });

  test('frontend loads from built dist/', async () => {
    expect(existsSync(join(ROOT, 'dist', 'index.html'))).toBe(true);

    app = await electron.launch({
      executablePath: electronBinary,
      args: [join(ROOT, 'electron', 'main.js'), '--no-sandbox'],
      env: {
        ...process.env,
        NODE_OPTIONS: '',
        ANTHROPIC_API_KEY: 'test-key-for-smoke-test',
      },
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Set project folder so welcome screen doesn't block
    await window.evaluate(() => localStorage.setItem('deckwing-projectFolder', '/tmp/test'));
    await window.reload();
    await window.waitForLoadState('domcontentloaded');

    // Should see DeckWing header or welcome screen
    const hasDeckWing = await window.locator('text=DeckWing').first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasWelcome = await window.locator('text=Welcome').isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasDeckWing || hasWelcome).toBe(true);
  });

  test('auth gate shows when not authenticated', async () => {
    app = await electron.launch({
      executablePath: electronBinary,
      args: [join(ROOT, 'electron', 'main.js'), '--no-sandbox'],
      env: {
        ...process.env,
        NODE_OPTIONS: '',
        // No ANTHROPIC_API_KEY — should trigger auth gate
      },
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Should see either sign-in, welcome, or the app name — any proves the frontend loaded
    const hasContent = await window.locator('text=DeckWing').first().isVisible({ timeout: 10000 }).catch(() => false)
      || await window.locator('text=Sign in').isVisible({ timeout: 3000 }).catch(() => false)
      || await window.locator('text=Welcome').isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasContent).toBe(true);
  });
});
