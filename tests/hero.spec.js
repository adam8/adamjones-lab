import { chromium, expect, test } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sizes = [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }];
const parts = ['#hero-title span:first-child', '#hero-title span:last-child', '.hero-role', '.hero-specimen', '.hero-invitation'];

async function composition(page, withinViewport = false) {
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
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
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
    await composition(page);
    // Check readable downstream content directly: existing chapter clipping must
    // not conceal min-content grid overflow when text is enlarged.
    for (const selector of ['.chapter-index', '.chapter-index-item', '.project-copy', '.project-permalink', '.about-list', '.elsewhere-links']) {
      for (const box of await page.locator(selector).all()) {
        const bounds = await box.boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      }
    }
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

test('keyboard work action has clearance for its entire focus ring', async ({ page }) => {
  for (const viewport of [{ width: 844, height: 390 }, { width: 961, height: 641 }, ...sizes]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    for (let tab = 0; tab < 12; tab++) {
      await page.keyboard.press('Tab');
      if (await page.locator('.hero-invitation').evaluate(el => el === document.activeElement)) break;
    }
    const action = page.locator('.hero-invitation');
    await expect(action).toBeFocused();
    await expect(action).toHaveCSS('outline-style', 'solid');
    const bounds = await action.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(7);
    expect(bounds.x + bounds.width + 7).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y).toBeGreaterThanOrEqual(7);
    expect(bounds.y + bounds.height + 7).toBeLessThanOrEqual(viewport.height);
    expect(await action.evaluate(el => {
      const ring = el.getBoundingClientRect();
      for (let ancestor = el.parentElement; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        const box = ancestor.getBoundingClientRect();
        if (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (ring.left - 7 < box.left || ring.right + 7 > box.right)) return false;
        if (/(hidden|clip|auto|scroll)/.test(style.overflowY) && (ring.top - 7 < box.top || ring.bottom + 7 > box.bottom)) return false;
      }
      return true;
    })).toBe(true);
  }
});

// Browser-level tab zoom, not CSS zoom, device scale emulation, or pinch zoom.
test('true 200% Chromium tab zoom preserves flow, overflow and keyboard access', async ({ baseURL }) => {
  const directory = await mkdtemp(join(tmpdir(), 'f012-zoom-'));
  const extension = join(directory, 'extension');
  await mkdir(extension);
  await writeFile(join(extension, 'manifest.json'), JSON.stringify({
    manifest_version: 3, name: 'Local zoom validation', version: '1.0',
    permissions: ['tabs'], background: { service_worker: 'background.js' },
  }));
  await writeFile(join(extension, 'background.js'), 'chrome.runtime.onInstalled.addListener(() => {});');
  let context;
  try {
    context = await chromium.launchPersistentContext(join(directory, 'profile'), {
      channel: 'chromium', headless: true, viewport: { width: 1440, height: 900 },
      ignoreDefaultArgs: ['--disable-extensions'],
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    });
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    await page.goto(baseURL);
    await page.addStyleTag({ content: 'html { scroll-behavior: auto; }' });
    const zoom = await worker.evaluate(async url => {
      const tabs = await chrome.tabs.query({ url: `${url}/*` });
      await chrome.tabs.setZoom(tabs[0].id, 2);
      return chrome.tabs.getZoom(tabs[0].id);
    }, baseURL);
    expect(zoom).toBe(2);
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(720);
    expect(await page.evaluate(() => devicePixelRatio)).toBe(2);
    // Playwright viewportSize describes the unzoomed surface; layout uses 720 CSS px.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(720);
    await expect(page.locator('.hero-scene')).toHaveCSS('position', 'relative');
    for (const selector of parts) {
      const bounds = await page.locator(selector).boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(720);
    }
    for (let tab = 0; tab < 12; tab++) {
      await page.keyboard.press('Tab');
      if (await page.locator('.hero-invitation').evaluate(el => el === document.activeElement)) break;
    }
    await expect(page.locator('.hero-invitation')).toBeFocused();
    await expect(page.locator('.hero-invitation')).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#work$/);
    await expect(page.locator('#work-title')).toBeInViewport();
  } finally {
    await context?.close();
    await rm(directory, { recursive: true, force: true });
  }
});
