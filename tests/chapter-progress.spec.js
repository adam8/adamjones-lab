import { expect, test } from '@playwright/test';

const keys = ['introduction', 'work', 'outside', 'about', 'elsewhere'];

async function nextPaint(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function measure(page) {
  return page.evaluate((chapterKeys) => {
    const range = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    let previous = 0;
    const starts = chapterKeys.map((key) => {
      const element = document.getElementById(key);
      const arrival = element.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(element).scrollMarginBlockStart);
      previous = Math.max(previous, Math.min(range, Math.max(0, arrival)));
      return previous;
    });
    return { starts, range };
  }, keys);
}

async function readProgress(page) {
  return page.evaluate(() => {
    const nav = innerWidth <= 800 ? document.querySelector('#mobile-chapters') : document.querySelector('.chapter-index');
    return {
      y: scrollY,
      fills: [...nav.querySelectorAll('[data-chapter-progress]')].map((track) =>
        track.querySelector('[data-chapter-fill]').getBoundingClientRect().width / track.getBoundingClientRect().width),
      current: document.querySelector(innerWidth <= 800 ? '[data-mobile-chapter][aria-current]' : '[data-chapter-item][aria-current]')?.hash,
    };
  });
}

async function expectProgress(page, geometry) {
  const actual = await readProgress(page);
  const terminal = actual.y >= geometry.range;
  let current;

  geometry.starts.forEach((start, index) => {
    if (actual.y + 0.5 >= start) current = `#${keys[index]}`;
    const end = geometry.starts[index + 1] ?? geometry.range;
    const expected = terminal ? 1 : actual.y < start ? 0 : end <= start ? 1 : Math.min(1, (actual.y - start) / (end - start));
    expect(actual.fills[index]).toBeCloseTo(expected, 3);
  });

  expect(actual.current).toBe(terminal ? '#elsewhere' : current);
}

for (const [width, height, enlarged] of [
  [1440, 900, false],
  [961, 641, true],
  [800, 900, false],
  [390, 844, false],
  [320, 800, true],
  [844, 390, false],
]) {
  test(`chapter progress follows measured boundaries at ${width}x${height}${enlarged ? ' with enlarged text' : ''}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.evaluate((useLargeText) => {
      document.documentElement.style.scrollBehavior = 'auto';
      if (useLargeText) document.documentElement.style.fontSize = '200%';
    }, enlarged);
    await nextPaint(page);
    await page.waitForTimeout(500);

    const geometry = await measure(page);
    const midpoints = geometry.starts.map((start, index) => (start + (geometry.starts[index + 1] ?? geometry.range)) / 2);
    const samples = [0, ...midpoints, geometry.range, ...midpoints.slice().reverse(), 0];

    for (const y of samples) {
      await page.evaluate((top) => scrollTo(0, top), y);
      await nextPaint(page);
      await expectProgress(page, geometry);
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('horizontal chapter scrolling does not alter document geometry, URL, or focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#work');
  await nextPaint(page);
  await page.waitForTimeout(500);

  const geometry = await measure(page);
  const y = await page.evaluate(() => scrollY);
  const link = page.locator('[data-mobile-chapter="work"]');
  await link.focus();
  const url = page.url();
  await page.locator('#mobile-chapters').evaluate((element) => element.scrollTo({ left: element.scrollWidth, behavior: 'auto' }));
  await nextPaint(page);

  expect(await measure(page)).toEqual(geometry);
  expect(Math.abs(await page.evaluate(() => scrollY) - y)).toBeLessThan(16);
  expect(page.url()).toBe(url);
  await expect(link).toBeFocused();
  await expectProgress(page, geometry);
});

for (const width of [1440, 390]) {
  test(`project and chapter history keep progress synchronized at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#project-agents');
    await nextPaint(page);
    await expectProgress(page, await measure(page));

    await page.evaluate(() => { location.hash = '#about'; });
    await nextPaint(page);
    await expectProgress(page, await measure(page));
    await page.goBack();
    await nextPaint(page);
    await expectProgress(page, await measure(page));
    await page.goForward();
    await nextPaint(page);
    await expectProgress(page, await measure(page));
  });
}

test('scroll-only progress uses cached chapter geometry and the scheduler becomes idle', async ({ page }) => {
  await page.addInitScript(() => {
    window.rafCount = 0;
    const request = requestAnimationFrame;
    window.requestAnimationFrame = (callback) => {
      window.rafCount++;
      return request(callback);
    };
    window.chapterReads = 0;
    const rect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (...args) {
      if (['introduction', 'work', 'outside', 'about', 'elsewhere'].includes(this.id)) window.chapterReads++;
      return rect.apply(this, args);
    };
  });
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await nextPaint(page);
  await page.waitForTimeout(600);

  const reads = await page.evaluate(() => window.chapterReads);
  for (const y of [100, 300, 500]) {
    await page.evaluate((top) => scrollTo(0, top), y);
    await nextPaint(page);
  }
  expect(await page.evaluate(() => window.chapterReads)).toBe(reads);

  const frames = await page.evaluate(() => window.rafCount);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.rafCount)).toBe(frames);
});

for (const state of ['no JavaScript', 'failed entry script']) {
  test(`${state} hides progress while native mobile links remain usable`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: state !== 'no JavaScript', viewport: { width: 320, height: 800 } });
    const page = await context.newPage();
    if (state === 'failed entry script') await page.route('**/src/main.js', (route) => route.abort());

    await page.goto(baseURL);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expect(page.locator('#mobile-chapters [data-chapter-progress]').first()).toHaveCSS('visibility', 'hidden');
    await page.locator('[data-mobile-chapter="elsewhere"]').click();
    await expect(page.locator('#elsewhere h2')).toBeInViewport();
    await context.close();
  });
}
