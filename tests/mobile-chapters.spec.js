import { expect, test } from '@playwright/test';

const chapters = ['introduction', 'work', 'outside', 'about', 'elsewhere'];

async function expectDestinationVisible(page, key) {
  await expect(page.locator(`#${key}`)).toBeInViewport();
}

test.use({ viewport: { width: 390, height: 844 } });

test('mobile chapter strip exposes native links and preserves history', async ({ page }) => {
  await page.goto('/');

  const nav = page.getByRole('navigation', { name: 'Mobile chapters' });
  await expect(nav).toBeVisible();
  await expect(page.locator('.chapter-index-slot')).toBeHidden();
  await expect(nav.getByRole('link')).toHaveCount(6);
  await expect(nav.getByRole('link', { name: 'Adam Jones, home' })).toHaveAttribute('href', '#top');

  for (const key of chapters) {
    const link = nav.locator(`[data-mobile-chapter="${key}"]`);
    const box = await link.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(38);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`#${key}$`));
    await expectDestinationVisible(page, key);
  }

  await page.goBack();
  await expect(page).toHaveURL(/#about$/);
  await expectDestinationVisible(page, 'about');
  await page.goForward();
  await expect(page).toHaveURL(/#elsewhere$/);
  await expectDestinationVisible(page, 'elsewhere');
});

test('active chapters remain visible in the horizontal snap strip', async ({ page }) => {
  await page.goto('/');
  const nav = page.locator('#mobile-chapters');
  const elsewhere = nav.locator('[data-mobile-chapter="elsewhere"]');

  await expect(nav).toHaveCSS('overflow-x', 'auto');
  await expect(nav).toHaveCSS('scroll-snap-type', /x/);
  expect(await nav.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);

  await elsewhere.click();
  await expect(elsewhere).toHaveAttribute('aria-current', 'location');
  await expect(elsewhere).toBeInViewport();
  expect(await nav.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);

  await nav.evaluate((element) => element.scrollTo({ left: element.scrollWidth, behavior: 'auto' }));
  await expect(nav).toHaveClass(/at-end/);
});

test('keyboard activation uses native anchors and keeps focus visible', async ({ page }) => {
  await page.goto('/#outside');
  await expect(page.locator('#outside-title')).toBeInViewport();
  await expect.poll(() => page.locator('#outside').evaluate((element) => {
    const margin = parseFloat(getComputedStyle(element).scrollMarginBlockStart);
    return Math.abs(element.getBoundingClientRect().top - margin);
  })).toBeLessThan(2);
  const about = page.locator('[data-mobile-chapter="about"]');
  await about.focus();
  await expect(about).toBeFocused();
  await expect(about).toHaveCSS('outline-style', 'solid');
  await about.press('Enter');
  await expect(page).toHaveURL(/#about$/);
  await expectDestinationVisible(page, 'about');
});

for (const state of ['no JavaScript', 'failed entry script']) {
  test(`${state} keeps every chapter link and destination available`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      javaScriptEnabled: state !== 'no JavaScript',
      viewport: { width: 320, height: 800 },
    });
    const page = await context.newPage();
    if (state === 'failed entry script') await page.route('**/src/main.js', (route) => route.abort());

    await page.goto(baseURL);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expect(page.locator('.site-header')).toHaveCSS('position', 'relative');
    await expect(page.locator('[data-chapter-progress]').first()).toHaveCSS('visibility', 'hidden');

    for (const key of chapters) {
      await page.locator(`[data-mobile-chapter="${key}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${key}$`));
      await expectDestinationVisible(page, key);
      await page.goto(baseURL);
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await context.close();
  });
}

test('anchor scrolling is instant for reduced motion and short viewports', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 844, height: 640 });
  await page.reload();
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
});
