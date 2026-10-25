import { expect, test } from '@playwright/test';

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps the full story, project copy, and links available', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Adam Jones' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'I design interfaces. And build them.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Boss Hog' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Agent experiments' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Interface studies' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Island time' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'A short specification' })).toBeVisible();
    await expect(page.getByRole('link', { name: /View repository/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'GitHub' })).toBeVisible();
  });
});

test('project buttons activate chapters, retain focus, and synchronize with native scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
  });

  const buttons = page.locator('[data-project-button]');
  const second = buttons.nth(1);
  await second.focus();
  await second.press('Enter');
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#project-agents')).not.toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#project-boss-hog')).toHaveAttribute('inert', '');

  const track = page.locator('.project-track');
  const geometry = await track.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const start = bounds.top + window.scrollY;
    return { start, range: bounds.height - window.innerHeight };
  });

  await page.evaluate(({ start, range }) => window.scrollTo(0, start + range * 0.86), geometry);
  await expect(buttons.nth(2)).toHaveAttribute('aria-pressed', 'true');

  await page.evaluate(({ start, range }) => window.scrollTo(0, start + range * 0.2), geometry);
  await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'true');
});

test('reduced motion releases sticky scenes and shows every project in normal flow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  await expect(page.locator('html')).not.toHaveClass(/motion-ok/);
  await expect(page.locator('.hero-scene')).toHaveCSS('position', 'relative');

  for (const panel of await page.locator('[data-project-panel]').all()) {
    await expect(panel).not.toHaveCSS('position', 'absolute');
    await expect(panel).toHaveCSS('opacity', '1');
    await expect(panel).not.toHaveAttribute('aria-hidden');
    await expect(panel).not.toHaveAttribute('inert');
  }

  const fallbackWidths = await page.locator('.project-stage, .project-panels').evaluateAll(([stage, panels]) => ({
    stage: stage.getBoundingClientRect().width,
    panels: panels.getBoundingClientRect().width,
  }));
  expect(fallbackWidths.panels).toBeGreaterThan(fallbackWidths.stage * 0.9);

  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
});

test('intermediate widths stack project content without clipping illustrations', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 900 });
  await page.goto('/');

  await expect(page.locator('html')).not.toHaveClass(/motion-ok/);
  await expect(page.locator('.project-stage')).toHaveCSS('grid-template-columns', /844|[7-8]\d\d/);
  await expect(page.locator('#project-boss-hog')).toHaveCSS('grid-template-columns', /\d+px/);

  const bounds = await page.locator('#project-boss-hog .project-object').evaluate((object) => {
    const objectBounds = object.getBoundingClientRect();
    const stageBounds = object.closest('.project-stage').getBoundingClientRect();
    return {
      objectLeft: objectBounds.left,
      objectRight: objectBounds.right,
      stageLeft: stageBounds.left,
      stageRight: stageBounds.right,
    };
  });
  expect(bounds.objectLeft).toBeGreaterThanOrEqual(bounds.stageLeft - 1);
  expect(bounds.objectRight).toBeLessThanOrEqual(bounds.stageRight + 1);
});

test('short viewports use normal flow rather than sticky storytelling', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');

  await expect(page.locator('html')).not.toHaveClass(/motion-ok/);
  await expect(page.locator('.project-stage')).not.toHaveCSS('position', 'sticky');
  await expect(page.locator('[data-project-panel]')).toHaveCount(3);
  await expect(page.locator('[data-project-panel]').nth(2)).toBeVisible();
});

for (const mode of [
  { name: 'reduced-motion', viewport: { width: 1440, height: 900 }, reducedMotion: true },
  { name: 'narrow', viewport: { width: 390, height: 844 }, reducedMotion: false },
  { name: 'short', viewport: { width: 844, height: 390 }, reducedMotion: false },
]) {
  test(`${mode.name} fallback does not run a scroll-linked progress transform`, async ({ page }) => {
    if (mode.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(mode.viewport);
    await page.goto('/');

    const progress = page.locator('.reading-progress');
    await expect(progress).toHaveCSS('display', 'none');
    await expect(progress).toHaveCSS('transform', 'none');

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
    await page.waitForTimeout(50);

    await expect(progress).toHaveCSS('transform', 'none');
    expect(await progress.evaluate((element) => element.style.transform)).toBe('');
  });
}

test('the requestAnimationFrame scheduler becomes idle after updates settle', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeRequest = window.requestAnimationFrame.bind(window);
    window.__rafCount = 0;
    window.requestAnimationFrame = (callback) => {
      window.__rafCount += 1;
      return nativeRequest(callback);
    };
  });
  await page.goto('/');
  await page.waitForTimeout(150);

  const settledCount = await page.evaluate(() => window.__rafCount);
  await page.waitForTimeout(250);
  const idleCount = await page.evaluate(() => window.__rafCount);
  expect(idleCount).toBe(settledCount);

  await page.evaluate(() => window.scrollBy(0, 120));
  await expect.poll(() => page.evaluate(() => window.__rafCount)).toBeGreaterThan(idleCount);
  await page.waitForTimeout(150);
  const resettledCount = await page.evaluate(() => window.__rafCount);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__rafCount)).toBe(resettledCount);
});
