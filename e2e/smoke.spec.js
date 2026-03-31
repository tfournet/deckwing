import { test, expect } from '@playwright/test';
import { mockAPIs } from './mocks.js';

test.describe('DeckWing Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    await mockAPIs(page, { authenticated: true });
    await page.addInitScript(() => {
      localStorage.setItem('deckwing-model', 'sonnet');
    });
  });

  test('app loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('text=DeckWing', { timeout: 5000 });

    expect(errors).toEqual([]);
  });

  test('slide preview renders', async ({ page }) => {
    await page.goto('/');
    // The slide counter should be visible, meaning slides loaded
    await expect(page.getByText(/^1 \/ \d+$/)).toBeVisible({ timeout: 5000 });
  });

  test('slide navigation works', async ({ page }) => {
    await page.goto('/');
    const counter = page.getByText(/^1 \/ \d+$/);
    await counter.waitFor({ timeout: 5000 });

    // Click next
    await page.locator('button:has(svg)').filter({ has: page.locator('[class*="chevron"]') }).last().click();
    await expect(page.getByText(/^2 \/ \d+$/)).toBeVisible();
  });

  test('slide outline shows all slides', async ({ page }) => {
    await page.goto('/');
    // The outline should show slide titles
    await expect(page.locator('aside').locator('text=The Hidden Cost')).toBeVisible({ timeout: 5000 });
  });

  test('editor toggle opens', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Edit Slide', { timeout: 5000 });

    await page.locator('text=Edit Slide').click();
    // Editor should show slide type dropdown
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('chat panel toggles', async ({ page }) => {
    await page.goto('/');
    const decksterButton = page.locator('button:has-text("Deckster")');
    await decksterButton.waitFor({ timeout: 5000 });

    // Chat should be visible by default — check for the panel's header text
    await expect(page.locator('aside').last().locator('text=Deckster')).toBeVisible();

    // Close it
    await decksterButton.click();
    // The chat aside should be gone
    await expect(page.locator('text=Model')).not.toBeVisible({ timeout: 3000 });

    // Reopen it
    await decksterButton.click();
    await expect(page.locator('aside').last().locator('text=Deckster')).toBeVisible();
  });

  test('export dropdown shows options', async ({ page }) => {
    await page.goto('/');
    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.waitFor({ timeout: 5000 });

    await exportButton.click();
    await expect(page.locator('text=Export as PDF')).toBeVisible();
  });

  test('presenter mode opens', async ({ page }) => {
    await page.goto('/');
    const presentButton = page.locator('button:has-text("Present")');
    await presentButton.waitFor({ timeout: 5000 });

    await presentButton.click();
    // Presenter mode should show the slide fullscreen
    // The app UI (header, sidebars) should be hidden
    await expect(page.locator('header')).not.toBeVisible({ timeout: 3000 });
  });

  test('chat sends message and gets response', async ({ page }) => {
    await mockAPIs(page, { authenticated: true, chatMode: 'reply' });
    await page.goto('/');

    // Type a message
    const input = page.locator('textarea[placeholder*="Describe"], input[placeholder*="Describe"]');
    await input.waitFor({ timeout: 5000 });
    await input.fill('Make the slides better');
    await input.press('Enter');

    // Should see the mock AI response
    await expect(page.locator('text=That looks good')).toBeVisible({ timeout: 5000 });
  });

  test('chat generates a deck', async ({ page }) => {
    await mockAPIs(page, { authenticated: true, chatMode: 'create' });
    await page.goto('/');

    const input = page.locator('textarea[placeholder*="Describe"], input[placeholder*="Describe"]');
    await input.waitFor({ timeout: 5000 });
    await input.fill('Create a deck');
    await input.press('Enter');

    // Should see the mock AI reply in chat
    await expect(page.locator('text=3-slide test deck')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Auth Flow', () => {

  test('shows sign-in when not authenticated', async ({ page }) => {
    await mockAPIs(page, { authenticated: false });
    await page.goto('/');

    await expect(page.locator('text=Sign in with Claude')).toBeVisible({ timeout: 5000 });
  });
});
