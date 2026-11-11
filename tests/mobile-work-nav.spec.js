import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('mobile Work controls stick below chapter nav and navigate to projects', async ({ page }) => {
  await page.goto('/');
  const controls = page.locator('.project-controls');
  const header = page.locator('.site-header');
  const target = page.locator('#project-agents');
  await expect(controls).toBeVisible();
  await page.locator('#project-boss-hog').scrollIntoViewIfNeeded();
  await expect(controls).toHaveCSS('position', 'sticky');
  await expect.poll(async () => Math.abs((await controls.boundingBox()).y - (await header.boundingBox()).y - (await header.boundingBox()).height)).toBeLessThan(3);
  await controls.locator('[data-project-button="1"]').click();
  await expect(page).toHaveURL(/#project-agents$/);
  await expect(controls.locator('[data-project-button="1"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await target.boundingBox()).y).toBeGreaterThanOrEqual((await header.boundingBox()).height + (await controls.boundingBox()).height - 3);
});

test('without JavaScript project content remains visible and controls are hidden', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL);
  await expect(page.locator('.project-controls')).toBeHidden();
  await expect(page.locator('#project-agents')).toBeVisible();
  await context.close();
});
