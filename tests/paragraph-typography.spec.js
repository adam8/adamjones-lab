import { expect, test } from '@playwright/test';

const paragraphs = '.work-header > p:last-child, .project-copy > p:not(.label), .outside .outside-copy > p:last-child';

for (const scenario of [
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
  { name: 'mobile', viewport: { width: 390, height: 844 } },
  { name: 'enlarged mobile without JavaScript', viewport: { width: 320, height: 800 }, enlarged: true, javaScriptEnabled: false },
  { name: 'mobile with blocked font', viewport: { width: 390, height: 844 }, blockedFont: true },
]) {
  test(`drafted paragraphs: ${scenario.name}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ viewport: scenario.viewport, javaScriptEnabled: scenario.javaScriptEnabled });
    try {
      if (scenario.blockedFont) await context.route('**/fonts/routed-gothic.ttf', route => route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(baseURL);
      // Test instrumentation works even when product JavaScript is disabled.
      // Root-text enlargement is not browser zoom.
      if (scenario.enlarged) {
        await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
        await expect(page.locator('html')).toHaveCSS('font-size', '32px');
      }
      await page.evaluate(() => document.fonts.ready);
      const fontStatus = await page.evaluate(() => [...document.fonts].find(face => face.family === 'Routed Gothic')?.status);
      expect(fontStatus).toBe(scenario.blockedFont ? 'error' : 'loaded');
      const targets = page.locator(paragraphs);
      await expect(targets).toHaveCount(5);
      for (const target of await targets.all()) {
        await expect(target).toBeVisible();
        await expect(target).toHaveCSS('font-family', /Routed Gothic/);
        expect((await target.textContent()).trim().length).toBeGreaterThan(30);
        const bounds = await target.evaluate(element => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const box = element.getBoundingClientRect();
          return [...range.getClientRects()].map(rect => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, boxTop: box.top, boxBottom: box.bottom }));
        });
        expect(bounds.length).toBeGreaterThan(0);
        for (const rect of bounds) {
          expect(rect.left).toBeGreaterThanOrEqual(-1);
          expect(rect.right).toBeLessThanOrEqual(scenario.viewport.width + 1);
          expect(rect.top).toBeGreaterThanOrEqual(rect.boxTop - 1);
          expect(rect.bottom).toBeLessThanOrEqual(rect.boxBottom + 1);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
