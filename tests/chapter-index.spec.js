import { expect, test } from '@playwright/test';

const chapters = [
  { key: 'introduction', text: '01 Introduction', href: '#introduction', target: '#introduction' },
  { key: 'work', text: '02 Work', href: '#work', target: '#work' },
  { key: 'outside', text: '03 Outside', href: '#outside', target: '#outside' },
  { key: 'about', text: '04 About', href: '#about', target: '#about' },
  { key: 'elsewhere', text: '05 Elsewhere', href: '#elsewhere', target: '#elsewhere' },
];

async function expectCurrentChapter(page, key) {
  await expect.poll(async () => page.locator('[data-chapter-item][aria-current="location"]').count()).toBe(1);
  await expect(page.locator(`[data-chapter-item="${key}"]`)).toHaveAttribute('aria-current', 'location');
}

test('chapter index follows the hero with its semantic label and exact destinations', async ({ page }) => {
  await page.goto('/');

  const index = page.getByRole('navigation', { name: 'Chapter index' });
  await expect(index).toBeVisible();
  await expect(page.locator('.hero-track + .chapter-index-slot .chapter-index')).toHaveCount(1);
  await expect(index.locator('li')).toHaveCount(5);
  await expect(index.getByRole('link')).toHaveCount(5);

  for (const chapter of chapters) {
    await expect(index.getByRole('link', { name: chapter.text, exact: true })).toHaveAttribute('href', chapter.href);
  }

  await expect(page.locator('[aria-live]')).toHaveCount(0);
});

test.describe('chapter index without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('remains a static usable list with no stale current state', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    await expect(page.getByRole('navigation', { name: 'Chapter index' })).toBeVisible();
    await expect(page.locator('.chapter-index')).toHaveCSS('position', 'static');
    await expect(page.locator('[data-chapter-item][aria-current]')).toHaveCount(0);
    for (const chapter of chapters) {
      await expect(page.getByRole('link', { name: chapter.text, exact: true })).toHaveAttribute('href', chapter.href);
    }
  });
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
]) {
  test(`chapter index stays in normal flow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    const index = page.getByRole('navigation', { name: 'Chapter index' });
    await expect(index).toHaveCSS('position', 'static');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
    await expect(index).toHaveCSS('position', 'static');

    for (const link of await index.locator('a').all()) {
      const bounds = await link.boundingBox();
      expect(bounds?.width).toBeGreaterThanOrEqual(44);
      expect(bounds?.height).toBeGreaterThanOrEqual(44);
    }

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  });
}

test('wide chapter index enters persistence after the hero and releases on return', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const slot = page.locator('.chapter-index-slot');
  const index = page.getByRole('navigation', { name: 'Chapter index' });
  await expect(index).toHaveCSS('position', 'static');
  await expect(slot).not.toHaveClass(/is-persistent/);

  const slotTop = await slot.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((top) => window.scrollTo(0, top + 24), slotTop);
  await expect(slot).toHaveClass(/is-persistent/);
  await expect(index).toHaveCSS('position', 'fixed');

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(slot).not.toHaveClass(/is-persistent/);
  await expect(index).toHaveCSS('position', 'static');
});

test('current chapter follows the reference line and keeps the full Work track together', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });

  await expectCurrentChapter(page, 'introduction');

  for (const chapter of chapters.slice(1)) {
    await page.locator(chapter.target).evaluate((element) => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - window.innerHeight * 0.22 + 8);
    });
    await expectCurrentChapter(page, chapter.key);
  }

  const workEnd = await page.locator('#work').evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.bottom + window.scrollY - window.innerHeight * 0.22 - 8;
  });
  await page.evaluate((top) => window.scrollTo(0, top), workEnd);
  await expectCurrentChapter(page, 'work');

  await page.evaluate((top) => window.scrollTo(0, top + 20), workEnd);
  await expectCurrentChapter(page, 'outside');
});

test('native Enter activation uses no scripted focus and clears the fixed index', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeFocus = HTMLElement.prototype.focus;
    window.__focusCalls = 0;
    HTMLElement.prototype.focus = function focus(...args) {
      window.__focusCalls += 1;
      return nativeFocus.apply(this, args);
    };
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });

  const link = page.getByRole('link', { name: '04 About', exact: true });
  await link.focus();
  await expect(link).toBeFocused();
  await expect(link).toHaveCSS('outline-style', 'solid');
  const focusCalls = await page.evaluate(() => window.__focusCalls);
  await link.press('Enter');
  await expect(page).toHaveURL(/#about$/);
  await expectCurrentChapter(page, 'about');
  expect(await page.evaluate(() => window.__focusCalls)).toBe(focusCalls);

  const clearance = await page.evaluate(() => {
    const indexBottom = document.querySelector('.chapter-index').getBoundingClientRect().bottom;
    const headingTop = document.querySelector('#about-title').getBoundingClientRect().top;
    return { indexBottom, headingTop };
  });
  expect(clearance.headingTop).toBeGreaterThan(clearance.indexBottom);
});

for (const chapter of chapters) {
  test(`direct ${chapter.key} fragment settles on its chapter with visible heading clearance`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${chapter.href}`);
    await expectCurrentChapter(page, chapter.key);

    const headingSelector = chapter.key === 'elsewhere' ? '#elsewhere h2' : `${chapter.href} h2`;
    const positions = await page.evaluate((selector) => ({
      indexBottom: document.querySelector('.chapter-index').getBoundingClientRect().bottom,
      headingTop: document.querySelector(selector).getBoundingClientRect().top,
    }), headingSelector);
    expect(positions.headingTop).toBeGreaterThan(positions.indexBottom);
  });
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`Introduction navigation with JavaScript ${javaScriptEnabled}`, () => {
    test.use({ javaScriptEnabled });
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      test(`direct, pointer, keyboard and history at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/#introduction');
        await expect(page.locator('#intro-title')).toBeInViewport();
        if (javaScriptEnabled) await expectCurrentChapter(page, 'introduction');

        await page.goto('/#about');
        await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
        const link = page.getByRole('link', { name: '01 Introduction', exact: true });
        await link.click();
        await expect(page).toHaveURL(/#introduction$/);
        await expect(page.locator('#intro-title')).toBeInViewport();
        if (javaScriptEnabled) await expectCurrentChapter(page, 'introduction');

        await page.goto('/#outside');
        await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
        await link.focus();
        // Switch from the earlier pointer interaction to actual keyboard focus.
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Tab');
        await expect(link).toBeFocused();
        await expect(link).toHaveCSS('outline-style', 'solid');
        await link.press('Enter');
        await expect(page).toHaveURL(/#introduction$/);
        await expect(page.locator('#intro-title')).toBeInViewport();
        if (javaScriptEnabled) await expectCurrentChapter(page, 'introduction');
        else await expect(page.locator('[data-chapter-item][aria-current]')).toHaveCount(0);

        const bounds = await page.evaluate(() => ({
          indexBottom: document.querySelector('.chapter-index').getBoundingClientRect().bottom,
          headingTop: document.querySelector('#intro-title').getBoundingClientRect().top,
        }));
        expect(bounds.headingTop).toBeGreaterThan(bounds.indexBottom);
        await page.goBack();
        await expect(page).toHaveURL(/#outside$/);
        await expect(page.locator('#outside-title')).toBeInViewport();
      });
    }
  });
}

test('chapter links use native history and back navigation restores current state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  await page.getByRole('link', { name: '02 Work', exact: true }).click();
  await expect(page).toHaveURL(/#work$/);
  await expectCurrentChapter(page, 'work');

  await page.getByRole('link', { name: '03 Outside', exact: true }).click();
  await expect(page).toHaveURL(/#outside$/);
  await expectCurrentChapter(page, 'outside');

  await page.goBack();
  await expect(page).toHaveURL(/#work$/);
  await expectCurrentChapter(page, 'work');
});
