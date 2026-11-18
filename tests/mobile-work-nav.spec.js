import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('mobile Work controls stick below chapter nav and navigate to projects', async ({ page }) => {
  await page.goto('/');
  const controls = page.locator('.project-controls');
  const header = page.locator('.site-header');
  const target = page.locator('#project-agents');
  await expect(controls).toBeVisible();
  // Move past the sticky threshold even if the shorter controls let the panel
  // fit in the viewport before the controls have reached their sticky position.
  await page.locator('#project-boss-hog').evaluate(panel => {
    window.scrollTo({ top: window.scrollY + panel.getBoundingClientRect().top + 32, behavior: 'instant' });
  });
  await expect(controls).toHaveCSS('position', 'sticky');
  await expect.poll(async () => Math.abs((await controls.boundingBox()).y - (await header.boundingBox()).y - (await header.boundingBox()).height)).toBeLessThan(3);
  await controls.locator('[data-project-button="1"]').click();
  await expect(page).toHaveURL(/#project-agents$/);
  await expect(controls.locator('[data-project-button="1"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await target.boundingBox()).y).toBeGreaterThanOrEqual((await header.boundingBox()).height + (await controls.boundingBox()).height - 3);
});

for (const width of [390, 1024, 1440]) {
  test(`Work subnav matches chapter lettering at ${width}px and retains 44px targets`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#work');
    const navLink = page.locator(width <= 800 ? '[data-mobile-chapter="work"]' : '[data-chapter-item="work"]');
    const font = await navLink.evaluate(el => getComputedStyle(el).fontFamily);
    const buttons = page.locator('.project-controls button');
    await expect(buttons).toHaveCount(3);
    for (const button of await buttons.all()) {
      await expect(button).toHaveCSS('font-family', font);
      const box = await button.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
}

test('without JavaScript project content remains visible and controls are hidden', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL);
  await expect(page.locator('.project-controls')).toBeHidden();
  await expect(page.locator('#project-agents')).toBeVisible();
  await context.close();
});
