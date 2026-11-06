import { expect, test } from '@playwright/test';
import { chapterLink } from './navigation.js';

const keys = ['introduction', 'work', 'outside', 'about', 'elsewhere'];
test('native mobile chapters, keyboard, arrivals, history and idle scheduler', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const raf = requestAnimationFrame;
    window.framesRequested = 0;
    window.requestAnimationFrame = callback => { window.framesRequested++; return raf(callback); };
  });
  await page.goto('/');
  const menu = page.locator('#mobile-chapters');
  const summary = menu.locator(':scope > summary');
  await expect(summary).toHaveAccessibleName('Chapters');
  await expect(page.locator('.desktop-navigation')).toBeHidden();
  await expect(page.locator('.chapter-index-slot')).toBeHidden();
  await summary.focus(); await summary.press('Space');
  await expect(menu).toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(menu.locator('a[href="#introduction"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(summary).toBeFocused();
  await expect(menu).not.toHaveAttribute('open');
  for (const key of keys) {
    const link = await chapterLink(page, key);
    const box = await link.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
    await link.click();
    await expect(menu).not.toHaveAttribute('open');
    await expect(page).toHaveURL(new RegExp(`#${key}$`));
    const h = page.locator(`#${key} h2`);
    await expect(h).toBeInViewport();
    expect((await h.boundingBox()).y).toBeGreaterThan((await summary.boundingBox()).y + (await summary.boundingBox()).height);
  }
  await page.goBack(); await expect(page).toHaveURL(/#about$/);
  await expect(page.locator('#about-title')).toBeInViewport();
  await page.goForward(); await expect(page).toHaveURL(/#elsewhere$/);
  await summary.click();
  await expect(menu.locator('a[href="#elsewhere"]')).toBeInViewport();
  await page.keyboard.press('Escape');
  for (let i = 0; i < 4; i++) await summary.click();
  await page.waitForTimeout(700);
  const settled = await page.evaluate(() => window.framesRequested);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.framesRequested)).toBe(settled);
});
for (const state of ['nojs', 'failure']) test(`${state} short/enlarged native disclosure safety`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: state !== 'nojs', viewport: { width: 320, height: 800 } });
  const page = await context.newPage();
  if (state === 'failure') await page.route('**/src/main.js', route => route.abort());
  await page.goto(baseURL);
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  for (const viewport of [{ width: 320, height: 800 }, { width: 640, height: 390 }]) {
    await page.setViewportSize(viewport);
    const link = await chapterLink(page, 'elsewhere');
    await link.click();
    await expect(page.locator('#elsewhere h2')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto(baseURL);
  }
  await context.close();
});

 test('roomy mid-page opening and keyboard dismissal retain reading context', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#about');
  const menu = page.locator('#mobile-chapters');
  const summary = menu.locator(':scope > summary');
  const heading = page.locator('#about-title');
  await expect(heading).toBeInViewport();
  const before = await heading.boundingBox();
  const scrollBefore = await page.evaluate(() => scrollY);
  expect(scrollBefore).toBeGreaterThan(1000);
  await summary.click();
  await expect(menu).toHaveAttribute('open', '');
  const bounds = await summary.boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThan(844);
  await page.keyboard.press('Tab');
  const firstLink = menu.locator('a[href="#introduction"]');
  await expect(firstLink).toBeFocused();
  await expect(firstLink).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(summary).toBeFocused();
  await expect(menu).not.toHaveAttribute('open');
  await expect(heading).toBeInViewport();
  expect(Math.abs((await heading.boundingBox()).y - before.y)).toBeLessThan(2);
  expect(Math.abs(await page.evaluate(() => scrollY) - scrollBefore)).toBeLessThan(2);
  await expect(page).toHaveURL(/#about$/);
});
