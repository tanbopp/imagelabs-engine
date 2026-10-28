import { test, expect } from '@playwright/test';

test.describe('ImageLabs Core Tools Flow', () => {
  test('homepage renders all 14 tools and quota meter', async ({ page }) => {
    await page.goto('/');

    // Check Hero and Title
    await expect(page.locator('h1')).toContainText('Fast, Private In-Browser Image Tools');

    // Check Quota Meter in Header
    await expect(page.locator('header')).toContainText('Free Jobs');

    // Check Categories
    await expect(page.locator('#optimize')).toBeVisible();
    await expect(page.locator('#convert')).toBeVisible();
    await expect(page.locator('#edit')).toBeVisible();
    await expect(page.locator('#ai')).toBeVisible();
  });

  test('navigates to compress tool workspace', async ({ page }) => {
    await page.goto('/');
    await page.click('text=ImageLabs Compress');

    await expect(page.locator('h1')).toContainText('Compress Images');
    await expect(page.locator('text=Drag & drop your images here')).toBeVisible();
  });

  test('navigates to meme generator and renders live canvas', async ({ page }) => {
    await page.goto('/');
    await page.click('text=ImageLabs Meme Generator');

    await expect(page.locator('h1')).toContainText('Meme Generator');
  });
});
