import { chapterLink } from './navigation.js';
import { expect, test } from '@playwright/test';

const chapters = [
  { key: 'introduction', text: 'Intro', href: '#introduction', heading: '#intro-title' },
  { key: 'work', text: 'Work', href: '#work', heading: '#work-title' },
  { key: 'outside', text: 'Outside', href: '#outside', heading: '#outside-title' },
  { key: 'about', text: 'About', href: '#about', heading: '#about-title' },
  { key: 'elsewhere', text: 'Elsewhere', href: '#elsewhere', heading: '#elsewhere h2' },
];

async function expectCurrentChapter(page, key) {
  await expect.poll(() => page.locator('[data-chapter-item][aria-current="location"]').count()).toBe(1);
  await expect(page.locator(`[data-chapter-item="${key}"]`)).toHaveAttribute('aria-current', 'location');
}

test('desktop chapter index has the exact native destinations', async ({ page }) => {
  await page.goto('/');
  const index = page.getByRole('navigation', { name: 'Chapter index' });
  await expect(index).toBeVisible();
  await expect(index.getByRole('link')).toHaveCount(5);
  for (const chapter of chapters) {
    await expect(index.getByRole('link', { name: chapter.text, exact: true })).toHaveAttribute('href', chapter.href);
  }
  await expect(page.locator('[aria-live]')).toHaveCount(0);
});

test('without JavaScript the desktop index remains a normal-flow native list', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(baseURL);
  await expect(page.locator('.chapter-index')).not.toHaveCSS('position', 'fixed');
  await expect(page.locator('[data-chapter-item][aria-current]')).toHaveCount(0);
  await page.locator('[data-chapter-item="about"]').click();
  await expect(page.locator('#about-title')).toBeInViewport();
  await context.close();
});

for (const viewport of [
  { width: 390, height: 844, mobile: true },
  { width: 844, height: 390, mobile: false },
]) {
  test(`chapter navigation remains usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: viewport.mobile ? 'Mobile chapters' : 'Chapter index' });
    await expect(nav).toBeVisible();
    const links = nav.getByRole('link');
    await expect(links).toHaveCount(viewport.mobile ? 6 : 5);

    for (const link of await links.all()) {
      const bounds = await link.boundingBox();
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(viewport.mobile ? 38 : 44);
    }

    const about = viewport.mobile ? nav.locator('[data-mobile-chapter="about"]') : nav.locator('[data-chapter-item="about"]');
    await about.click();
    await expect(page.locator('#about-title')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('wide chapter index persists only after its normal-flow slot passes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const slot = page.locator('.chapter-index-slot');
  const index = page.locator('.chapter-index');
  await expect(index).not.toHaveCSS('position', 'fixed');

  const slotTop = await slot.evaluate((element) => element.getBoundingClientRect().top + scrollY);
  await page.evaluate((top) => scrollTo(0, top + 24), slotTop);
  await expect(slot).toHaveClass(/is-persistent/);
  await expect(index).toHaveCSS('position', 'fixed');

  await page.evaluate(() => scrollTo(0, 0));
  await expect(slot).not.toHaveClass(/is-persistent/);
  await expect(index).not.toHaveCSS('position', 'fixed');
});

test('current chapter follows native section arrivals', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await expect(page.locator('[data-chapter-item][aria-current]')).toHaveCount(0);

  for (const chapter of chapters) {
    await page.locator(chapter.href).evaluate((element) => {
      const top = element.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(element).scrollMarginBlockStart) + 2;
      scrollTo(0, top);
    });
    await expectCurrentChapter(page, chapter.key);
  }
});

test('keyboard activation preserves focus semantics and native history', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeFocus = HTMLElement.prototype.focus;
    window.focusCalls = 0;
    HTMLElement.prototype.focus = function (...args) {
      window.focusCalls++;
      return nativeFocus.apply(this, args);
    };
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  const about = page.locator('[data-chapter-item="about"]');
  await about.focus();
  await expect(about).toBeInViewport();
  const calls = await page.evaluate(() => window.focusCalls);
  await about.press('Enter');
  await expect(page).toHaveURL(/#about$/);
  await expectCurrentChapter(page, 'about');
  expect(await page.evaluate(() => window.focusCalls)).toBe(calls);
});

test('direct chapter fragments settle with visible heading clearance', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const chapter of chapters) {
    await page.goto(`/${chapter.href}`);
    await expectCurrentChapter(page, chapter.key);
    const positions = await page.evaluate((heading) => ({
      indexBottom: document.querySelector('.chapter-index').getBoundingClientRect().bottom,
      headingTop: document.querySelector(heading).getBoundingClientRect().top,
    }), chapter.heading);
    expect(positions.headingTop).toBeGreaterThan(positions.indexBottom);
  }
});

test('Introduction supports pointer, keyboard and history', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#about');
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });

    let link = await chapterLink(page, 'introduction');
    await link.click();
    await expect(page.locator('#intro-title')).toBeInViewport();

    await page.goto('/#outside');
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    link = await chapterLink(page, 'introduction');
    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toBeInViewport();
    await link.press('Enter');
    await expect(page).toHaveURL(/#introduction$/);
    await expect(page.locator('#intro-title')).toBeInViewport();
    await expectCurrentChapter(page, 'introduction');

    await page.goBack();
    await expect(page).toHaveURL(/#outside$/);
    await expect(page.locator('#outside-title')).toBeInViewport();
});

test('chapter links add native history entries restored by Back', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await page.locator('[data-chapter-item="work"]').click();
  await page.locator('[data-chapter-item="outside"]').click();
  await page.goBack();
  await expect(page).toHaveURL(/#work$/);
  await expectCurrentChapter(page, 'work');
});
