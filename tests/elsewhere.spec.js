import { expect, test, chromium } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sizes = [[1440, 900], [390, 844], [320, 800], [844, 390]];
const links = '.elsewhere-links a';

async function geometry(page) {
  const result = await page.locator('#elsewhere').evaluate(footer => {
    const errors = [];
    const inside = (outer, inner, name) => {
      if (inner.left < outer.left - 1 || inner.right > outer.right + 1 || inner.top < outer.top - 1 || inner.bottom > outer.bottom + 1) errors.push(name);
    };
    const bounds = footer.getBoundingClientRect();
    for (const a of footer.querySelectorAll('a')) {
      const band = a.getBoundingClientRect();
      inside(bounds, band, 'anchor outside footer');
      if (a.scrollWidth > a.clientWidth + 1) errors.push('anchor overflow');
      if (a.matches('.elsewhere-links a')) {
        if (Math.abs(band.left) > 1 || Math.abs(band.right - innerWidth) > 1) errors.push('not full width');
        const label = a.firstElementChild, arrow = a.lastElementChild;
        const range = document.createRange(); range.selectNodeContents(label);
        for (const rect of range.getClientRects()) inside(band, rect, 'text outside band');
        inside(band, arrow.getBoundingClientRect(), 'arrow outside band');
        const l = label.getBoundingClientRect(), r = arrow.getBoundingClientRect();
        if (l.right > r.left + 1 && l.bottom > r.top + 1 && r.bottom > l.top + 1) errors.push('label/arrow overlap');
      }
    }
    return { errors, width: innerWidth, documentWidth: document.documentElement.scrollWidth, localWidth: footer.scrollWidth, height: bounds.height };
  });
  expect(result.errors).toEqual([]);
  expect(result.documentWidth).toBe(result.width);
  expect(result.localWidth).toBe(result.width);
  return result;
}

async function traversal(page) {
  const anchors = page.locator('#elsewhere a');
  // Establish the preceding tab stop without assuming other chapters' links.
  await anchors.first().focus();
  await page.keyboard.press('Shift+Tab');
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Tab');
    await expect(anchors.nth(i)).toBeFocused();
    await expect(anchors.nth(i)).toHaveCSS('outline-style', 'solid');
    const clearance = await anchors.nth(i).evaluate(a => {
      const r = a.getBoundingClientRect();
      const index = document.querySelector('.chapter-index');
      const persistent = getComputedStyle(index).position === 'fixed';
      return !persistent || r.top > index.getBoundingClientRect().bottom;
    });
    expect(clearance).toBe(true);
  }
  for (let i = 1; i >= 0; i--) {
    await page.keyboard.press('Shift+Tab');
    await expect(anchors.nth(i)).toBeFocused();
  }
}

for (const [width, height] of sizes) for (const percent of [100, 200]) for (const javaScriptEnabled of [true, false]) {
  test.describe(`${width}x${height}, root font ${percent}%, JS ${javaScriptEnabled}`, () => {
    test.use({ viewport: { width, height }, javaScriptEnabled });
    test('complete flow, native keyboard order and focus clearance', async ({ page }) => {
      await page.route('**/*', async route => {
        if (route.request().resourceType() !== 'document') return route.continue();
        const response = await route.fetch();
        await route.fulfill({ response, body: (await response.text()).replace('</head>', `<style>html{font-size:${percent}%;scroll-behavior:auto}</style></head>`) });
      });
      await page.goto('/#elsewhere');
      await geometry(page);
      // Do not depend on the shared body's horizontal clipping to pass.
      await page.evaluate(() => { document.body.style.overflowX = 'visible'; });
      await geometry(page);
      if (javaScriptEnabled) await expect(page.locator('[data-chapter-item="elsewhere"]')).toHaveAttribute('aria-current', 'location');
      else await expect(page.locator('[aria-current]')).toHaveCount(0);
      await traversal(page);
      await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/#top$/);
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await page.goBack();
      await expect(page).toHaveURL(/#elsewhere$/);
      if (javaScriptEnabled) await expect(page.locator('[data-chapter-item="elsewhere"]')).toHaveAttribute('aria-current', 'location');
      await page.goForward();
      await expect(page).toHaveURL(/#top$/);
    });
  });
}

test('semantic destinations, colors, shared enlarged scale, hover and intercepted Enter', async ({ page, context }) => {
  await page.goto('/#elsewhere');
  await expect(page.locator('footer#elsewhere ul > li')).toHaveCount(2);
  await expect(page.locator('#elsewhere h2')).toHaveText('Find meelsewhere');
  const urls = ['https://github.com/adam8', 'https://adamjones.ca'];
  for (const [i, label] of ['GitHub', 'adamjones.ca'].entries()) {
    const anchor = page.locator(links).nth(i);
    await expect(anchor.locator('span').first()).toHaveText(label);
    await expect(anchor).toHaveAttribute('href', urls[i]);
    await expect(anchor).toHaveAttribute('target', '_blank');
    await expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(anchor.locator('span').last()).toHaveAttribute('aria-hidden', 'true');
    await anchor.hover();
    await expect(anchor.locator('span').first()).toHaveCSS('text-decoration-line', 'underline');
  }
  const scales = await page.locator(links).evaluateAll(as => as.map(a => getComputedStyle(a).fontSize));
  expect(scales[0]).toBe(scales[1]);
  await expect(page.locator(links).first()).toHaveCSS('background-color', 'rgb(244, 240, 229)');
  await expect(page.locator(links).first()).toHaveCSS('color', 'rgb(41, 60, 43)');
  await expect(page.locator(links).last()).toHaveCSS('color', 'rgb(244, 240, 229)');
  await expect(page.locator('.back-to-top')).toHaveText('Back to top ↑');
  await expect(page.locator('.back-to-top')).toHaveAttribute('href', '#top');
  const intercepted = [];
  await context.route('https://github.com/**', route => { intercepted.push(route.request().url()); return route.fulfill({ body: 'Local activation check' }); });
  await context.route('https://adamjones.ca/**', route => { intercepted.push(route.request().url()); return route.fulfill({ body: 'Local activation check' }); });
  for (let i = 0; i < 2; i++) {
    await page.locator(links).nth(i).focus();
    const popup = context.waitForEvent('page');
    await page.keyboard.press('Enter');
    const external = await popup; await external.waitForLoadState(); await external.close();
  }
  expect(intercepted).toEqual(['https://github.com/adam8', 'https://adamjones.ca/']);
});

test('live root enlargement expands footer naturally', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/#elsewhere');
  const before = await geometry(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const after = await geometry(page);
  expect(after.height).toBeGreaterThan(before.height);
});

test('actual Chromium 200% tab zoom retains complete Elsewhere and keyboard access', async ({ baseURL }) => {
  const directory = await mkdtemp(join(tmpdir(), 'f018-zoom-'));
  const extension = join(directory, 'extension');
  await mkdir(extension);
  await writeFile(join(extension, 'manifest.json'), JSON.stringify({ manifest_version: 3, name: 'Local zoom check', version: '1.0', permissions: ['tabs'], background: { service_worker: 'background.js' } }));
  await writeFile(join(extension, 'background.js'), 'chrome.runtime.onInstalled.addListener(() => {});');
  let context;
  try {
    context = await chromium.launchPersistentContext(join(directory, 'profile'), { channel: 'chromium', headless: true, viewport: { width: 1440, height: 900 }, ignoreDefaultArgs: ['--disable-extensions'], args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    await page.goto(`${baseURL}/#elsewhere`);
    expect(await worker.evaluate(async url => {
      const [tab] = await chrome.tabs.query({ url: `${url}/*` });
      await chrome.tabs.setZoom(tab.id, 2); return chrome.tabs.getZoom(tab.id);
    }, baseURL)).toBe(2);
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(720);
    await geometry(page);
    await traversal(page);
    const cdp = await context.newCDPSession(page);
    // CDP screenshot clips use device-independent pixels, not zoomed layout
    // CSS pixels. Playwright's default/locator clips capture the wrong document
    // region at tab zoom. Use explicit document clips for both evidence images.
    const metrics = await cdp.send('Page.getLayoutMetrics');
    const zoom = metrics.contentSize.width / metrics.cssContentSize.width;
    expect(zoom).toBe(2);
    const capture = async (path, clip) => {
      const image = await cdp.send('Page.captureScreenshot', {
        format: 'png', captureBeyondViewport: true,
        clip: { x: clip.x * zoom, y: clip.y * zoom, width: clip.width * zoom, height: clip.height * zoom, scale: 1 },
      });
      // Check painted pixels, not only DOM bounds: reject the previously blank
      // captures and require substantial ink and paper in each evidence image.
      const colors = await page.evaluate(async data => {
        const image = new Image(); image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let green = 0, cream = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i] === 41 && pixels[i + 1] === 60 && pixels[i + 2] === 43) green++;
          if (pixels[i] === 244 && pixels[i + 1] === 240 && pixels[i + 2] === 229) cream++;
        }
        return { green: green / (pixels.length / 4), cream: cream / (pixels.length / 4) };
      }, image.data);
      expect(colors.green).toBeGreaterThan(.05);
      expect(colors.cream).toBeGreaterThan(.05);
      await writeFile(path, Buffer.from(image.data, 'base64'));
    };
    await page.locator(links).first().evaluate(a => a.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(page.locator(links).first()).toBeFocused();
    await expect(page.locator(links).first()).toHaveCSS('outline-style', 'solid');
    await capture('docs/review/f-018-after-browserzoom200-focus.png', await page.evaluate(() => ({ x: 0, y: scrollY, width: innerWidth, height: innerHeight })));
    await page.locator(links).first().evaluate(a => a.blur());
    const footer = await page.locator('#elsewhere').evaluate(el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height };
    });
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
    await capture('docs/review/f-018-after-browserzoom200-section.png', footer);
  } finally { await context?.close(); await rm(directory, { recursive: true, force: true }); }
});

for (const javaScriptEnabled of [true, false]) test.describe(`native Elsewhere navigation JS ${javaScriptEnabled}`, () => {
  test.use({ javaScriptEnabled });
  test('pointer, Enter and history retain current state', async ({ page }) => {
    await page.goto('/#about');
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    const destination = page.locator('[data-chapter-item="elsewhere"]');
    await destination.click();
    await expect(page).toHaveURL(/#elsewhere$/);
    await expect(page.locator('#elsewhere h2')).toBeInViewport();
    if (javaScriptEnabled) await expect(destination).toHaveAttribute('aria-current', 'location');
    await page.goBack(); await expect(page).toHaveURL(/#about$/);
    await destination.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
    await expect(destination).toBeFocused(); await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#elsewhere$/);
    if (javaScriptEnabled) await expect(destination).toHaveAttribute('aria-current', 'location');
    else await expect(page.locator('[aria-current]')).toHaveCount(0);
    await page.goBack(); await expect(page).toHaveURL(/#about$/);
    await page.goForward(); await expect(page).toHaveURL(/#elsewhere$/);
  });
});
