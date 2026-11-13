import { expect, test } from '@playwright/test';

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

for (const javaScriptEnabled of [true, false]) {
  const cases = javaScriptEnabled
    ? sizes.flatMap(size => [[...size, 100], [...size, 200]])
    : [[390,844,100],[320,800,200],[844,390,100]];
  for (const [width, height, percent] of cases) {
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
