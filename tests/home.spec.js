import { expect, test } from '@playwright/test';

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));

  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
}

test('opens with Adam Jones, his role, and Vancouver Island location', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Adam Jones/);
  await expect(page.getByRole('heading', { level: 1, name: 'Adam Jones' })).toBeVisible();
  await expect(page.getByText('Design & development.')).toBeVisible();
  await expect(page.getByText('Vancouver Island, BC.')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'I design interfaces. And build them.' })).toBeVisible();
});

test('contains the six-part story and exactly three approved project entries', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('main > section')).toHaveCount(5);
  await expect(page.locator('footer#elsewhere')).toHaveCount(1);

  const projects = page.locator('[data-project-panel]');
  await expect(projects).toHaveCount(3);
  await expect(projects.nth(0).locator('h3')).toHaveText('Boss Hog');
  await expect(projects.nth(1).locator('h3')).toHaveText('Agent experiments');
  await expect(projects.nth(2).locator('h3')).toHaveText('Interface studies');

  await expect(page.getByRole('link', { name: /View repository/ })).toHaveAttribute(
    'href',
    'https://github.com/adam8/boss-hog',
  );
  await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/adam8');
  await expect(page.getByRole('link', { name: 'adamjones.ca' })).toHaveAttribute('href', 'https://adamjones.ca');
  await expect(page.locator('a[href*="/projects/"]')).toHaveCount(0);
});

test('supports skip navigation and visible focus for primary controls and links', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS('opacity', '1');
  await skipLink.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  for (const locator of [
    page.getByRole('link', { name: 'View selected work' }),
    page.getByRole('button', { name: /01 Boss Hog/ }),
    page.getByRole('link', { name: /View repository/ }),
    page.getByRole('link', { name: 'GitHub' }),
    page.getByRole('link', { name: /Back to top/ }),
  ]) {
    await locator.focus();
    await expect(locator).toHaveCSS('outline-style', 'solid');
    await expect(locator).not.toHaveCSS('outline-width', '0px');
  }
});

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'short landscape', width: 844, height: 390 },
]) {
  test(`${viewport.name} navigation and utility links have comfortable touch targets`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    const targets = [
      ...await page.locator('.nav-list a').all(),
      page.getByRole('link', { name: 'View selected work' }),
      page.getByRole('link', { name: /View repository/ }),
      page.getByRole('link', { name: /Back to top/ }),
    ];

    for (const target of targets) {
      const bounds = await target.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
    }
  });
}

test.describe('responsive overflow', () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
    { width: 844, height: 390 },
  ]) {
    test(`has no horizontal overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.locator('main')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }
});

test('loads without browser errors, missing assets, or broken internal anchors', async ({ page }) => {
  const browserErrors = [];
  const failedRequests = [];

  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(request.url()));

  await page.goto('/');

  const missingTargets = await page.locator('a[href^="#"]').evaluateAll((links) =>
    links
      .map((link) => link.getAttribute('href'))
      .filter((href) => href && !document.querySelector(href)),
  );

  expect(browserErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
  expect(missingTargets).toEqual([]);
});

test('obsolete and unknown routes return 404 without rendering the homepage', async ({ page }) => {
  for (const path of ['/projects/adam-jones-lab/', '/not-a-real-route/']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'Adam Jones' })).toHaveCount(0);
  }
});
