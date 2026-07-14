import { test, expect } from '@playwright/test';

const SHOTS = 'e2e/screenshots';

test.describe('trip planning flow', () => {
  test('hebrew: wizard → salzburg plan → tabs', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Trip/);
    expect(await page.evaluate(() => document.documentElement.dir)).toBe('rtl');

    await page.getByRole('button', { name: /זלצבורג/ }).click();
    await page.locator('input[type=date]').first().fill('2026-07-15');
    await page.locator('input[type=date]').nth(1).fill('2026-07-22');
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-he-wizard.png` });

    await page.getByRole('button', { name: /בניית הטיול שלי/ }).click();
    await page.waitForURL(/#\/trip\//, { timeout: 90_000 });

    // Itinerary renders day tabs and a weather strip
    await expect(page.getByRole('button', { name: /יום 1/ })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-he-itinerary.png`, fullPage: true });

    // Food tab with kosher toggle
    await page.getByRole('link', { name: 'אוכל' }).first().click();
    await expect(page.getByRole('switch')).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-he-food.png` });

    // Waze deep link present on cards
    const waze = page.locator('a[href^="https://waze.com/ul"]').first();
    await expect(waze).toBeVisible();
    expect(await waze.getAttribute('href')).toMatch(/navigate=yes/);
  });

  test('english: language toggle flips direction', async ({ page }, testInfo) => {
    await page.goto('/#/settings');
    await page.getByRole('tab', { name: 'English' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.dir)).toBe('ltr');
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-en-settings.png` });
  });
});
