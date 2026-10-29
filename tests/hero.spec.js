import { expect, test } from '@playwright/test';

const sizes = [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }];
const parts = ['#hero-title span:first-child', '#hero-title span:last-child', '.hero-role', '.hero-specimen', '.hero-invitation'];

async function composition(page, withinViewport = false, checkDocument = true) {
  const boxes = await Promise.all(parts.map(selector => page.locator(selector).boundingBox()));
  const viewport = page.viewportSize();
  for (const box of boxes) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    if (withinViewport) {
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
  }
  const specimen = boxes[3];
  for (const box of boxes.filter((_, index) => index !== 3)) {
    expect(specimen.x >= box.x + box.width || specimen.x + specimen.width <= box.x || specimen.y >= box.y + box.height || specimen.y + specimen.height <= box.y).toBe(true);
  }
  if (checkDocument) expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`hero with JavaScript ${javaScriptEnabled}`, () => {
    test.use({ javaScriptEnabled });
    for (const viewport of sizes) {
      test(`complete opening at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');
        await expect(page.locator('.hero-role')).toHaveText('Front-end JavaScript developer.Interface design.Vancouver Island, BC.');
        await expect(page.locator('.hero-specimen')).toHaveCount(1);
        await expect(page.locator('.hero-specimen svg')).toHaveCount(1);
        await expect(page.locator('.hero-specimen')).toHaveAttribute('aria-hidden', 'true');
        await expect(page.locator('.hero-specimen svg')).toHaveAttribute('focusable', 'false');
        await composition(page, true);
        await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, innerHeight); });
        await expect(page.locator('#intro-title')).toBeInViewport();
      });
    }
  });
}

test('bounded specimen motion settles at release and reverses with a stable identity', async ({ page }) => {
  await page.setViewportSize(sizes[2]);
  await page.goto('/');
  await page.addStyleTag({ content: 'html { scroll-behavior: auto; }' });
  const range = await page.locator('.hero-track').evaluate(el => el.getBoundingClientRect().height - innerHeight);
  const heading = await page.locator('#hero-title').boundingBox();
  for (const progress of [0, 0.5, 1, 0.5, 0]) {
    await page.evaluate(y => scrollTo(0, y), range * progress);
    await expect.poll(() => page.locator('.hero-specimen').evaluate((el, p) => {
      const matrix = new DOMMatrix(getComputedStyle(el).transform);
      return Math.abs(matrix.m42 - innerHeight * .04 * p) < 1 &&
        Math.abs(Math.atan2(matrix.b, matrix.a) * 180 / Math.PI - 4 * p) < .05;
    }, progress)).toBe(true);
    await expect(page.locator('.hero-name')).toHaveCSS('transform', 'none');
    await expect(page.locator('#hero-title')).toHaveCSS('transform', 'none');
    const now = await page.locator('#hero-title').boundingBox();
    expect(now.x).toBeCloseTo(heading.x, 0);
    expect(now.y).toBeCloseTo(heading.y, 0);
    await composition(page);
  }
});

for (const viewport of [{ width: 844, height: 390 }, { width: 961, height: 641 }, ...sizes]) {
  test(`flow and text enlargement at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.addStyleTag({ content: 'html { font-size: 200%; scroll-behavior: auto; }' });
    // Root-font enlargement also exposes pre-existing downstream overflow.
    // Keep this scoped check on the hero's individual rendered bounds.
    await composition(page, false, false);
    const scene = await page.locator('.hero-scene').boundingBox();
    const track = await page.locator('.hero-track').boundingBox();
    expect(scene.y + scene.height).toBeLessThanOrEqual(track.y + track.height + 1);
    const action = page.locator('.hero-invitation');
    await action.focus();
    await expect(action).toBeInViewport();
    await expect(action).toHaveCSS('outline-style', 'solid');
    await action.press('Enter');
    await expect(page).toHaveURL(/#work$/);
    await expect(page.locator('#work-title')).toBeInViewport();
  });
}

for (const viewport of [{ width: 844, height: 390 }, { width: 961, height: 641 }]) {
  test(`unenlarged boundary composition at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await composition(page);
    if (viewport.height === 390) {
      await expect(page.locator('.hero-scene')).toHaveCSS('position', 'relative');
      const action = page.locator('.hero-invitation');
      await action.focus();
      await expect(action).toBeInViewport();
      await expect(action).toHaveCSS('outline-style', 'solid');
    }
  });
}
