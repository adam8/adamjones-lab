import { expect, test } from '@playwright/test';

const sizes = [
  { width: 1440, height: 900 }, { width: 961, height: 641 },
  { width: 320, height: 800 }, { width: 360, height: 800 }, { width: 375, height: 812 },
  { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 844, height: 390 },
];

for (const javaScriptEnabled of [true, false]) {
  test.describe(`project content with JavaScript ${javaScriptEnabled}`, () => {
    test.use({ javaScriptEnabled });
    for (const size of sizes) for (const scale of [100, 200]) {
      test(`${size.width}x${size.height} at ${scale}% text`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.route('**/', async route => {
          const response = await route.fetch();
          await route.fulfill({ response, body: (await response.text()).replace('</head>', `<style>html {font-size:${scale}%; scroll-behavior:auto}</style></head>`) });
        });
        await page.goto('/#project-agents');
        await expect(page.locator('#project-agents')).toBeInViewport();
        const enhanced = javaScriptEnabled && size.width >= 1100 && size.height >= 641 && scale === 100;
        await expect(page.locator('.project-stage')).toHaveCSS('position', 'static');
        if (enhanced) await expect(page.locator('.project-controls')).toHaveCSS('position', 'sticky');
        const layout = await page.locator('#project-agents').evaluate(panel => {
          const rect = panel.getBoundingClientRect();
          const copy = panel.querySelector('.project-copy').getBoundingClientRect();
          const art = panel.querySelector('.project-object').getBoundingClientRect();
          const heading = panel.querySelector('h3');
          const text = heading.firstChild;
          const lines = heading.textContent.trim().split(/\s+/).map(word => {
            const start = text.textContent.indexOf(word);
            const range = document.createRange();
            range.setStart(text, start); range.setEnd(text, start + word.length);
            return [...range.getClientRects()].map(r => ({ left: r.left, right: r.right, top: r.top }));
          });
          return { bottom: rect.bottom, copyBottom: copy.bottom, artBottom: art.bottom, lines,
            width: document.documentElement.scrollWidth, viewport: innerWidth,
            nested: [panel, panel.parentElement, panel.closest('.project-stage'), panel.closest('.project-track')].some(el => /auto|scroll/.test(getComputedStyle(el).overflowY)) };
        });
        expect(layout.copyBottom).toBeLessThanOrEqual(layout.bottom + 1);
        expect(layout.artBottom).toBeLessThanOrEqual(layout.bottom + 1);
        expect(layout.nested).toBe(false);
        expect(layout.width).toBeLessThanOrEqual(layout.viewport);
        // The approved hypothesis preserves complete words at EVERY tested size.
        // In particular, narrow enlarged text must not waive word integrity.
        for (const word of layout.lines) {
          expect(word).toHaveLength(1);
          for (const fragment of word) {
            expect(fragment.left).toBeGreaterThanOrEqual(7);
            expect(fragment.right).toBeLessThanOrEqual(size.width - 7);
          }
        }
        const permalink = page.locator('#project-agents .project-permalink');
        await permalink.focus();
        const focusClear = await permalink.evaluate(el => {
          const r = el.getBoundingClientRect();
          if (r.width < 44 || r.height < 44 || r.left < 7 || r.right + 7 > innerWidth) return false;
          for (let parent = el.parentElement; parent; parent = parent.parentElement) {
            const s = getComputedStyle(parent), b = parent.getBoundingClientRect();
            if (/(clip|hidden|auto|scroll)/.test(s.overflowX) && (r.left - 7 < b.left || r.right + 7 > b.right)) return false;
            if (/(clip|hidden|auto|scroll)/.test(s.overflowY) && (r.top - 7 < b.top || r.bottom + 7 > b.bottom)) return false;
          }
          return true;
        });
        expect(focusClear).toBe(true);
      });
    }
  });
}

test('enlarged Agent uses native document wheel scrolling through its last line', async ({ page }) => {
  await page.setViewportSize(sizes[0]);
  await page.goto('/#project-agents');
  await page.addStyleTag({ content: 'html {font-size:200%; scroll-behavior:auto}' });
  await expect(page.locator('html')).not.toHaveClass(/projects-staged/);
  await page.locator('.project-controls button').nth(1).click();
  const before = await page.evaluate(() => scrollY);
  await page.mouse.move(1000, 600);
  await page.mouse.wheel(0, 240);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
  const paragraph = page.locator('#project-agents .project-copy > p:not(.label)');
  // Reach the final line with native wheels over the passage, not a DOM scroll helper.
  for (let step = 0; step < 15; step++) {
    const bounds = await paragraph.boundingBox();
    if (bounds.y + bounds.height <= 900) break;
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(80);
    await expect(page.locator('#project-agents')).not.toHaveAttribute('inert');
    await expect(page.locator('.project-controls button').nth(1)).toHaveAttribute('aria-pressed', 'true');
  }
  const box = await paragraph.boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(900);
  await expect(page.locator('#project-agents')).not.toHaveAttribute('inert');
  await expect(page.locator('.project-controls button').nth(1)).toHaveAttribute('aria-pressed', 'true');
});

async function flowDestination(page, index) {
  await expect.poll(() => page.locator('[data-project-panel]').nth(index).evaluate(el => {
    return Math.abs(el.getBoundingClientRect().top - parseFloat(getComputedStyle(el).scrollMarginBlockStart));
  })).toBeLessThan(3);
}

test('flow selectors, same hash and history retain focus and a single explicit entry', async ({ page }) => {
  await page.addInitScript(() => {
    const focus = HTMLElement.prototype.focus; window.__focusCalls = 0;
    HTMLElement.prototype.focus = function (...args) { window.__focusCalls++; return focus.apply(this, args); };
  });
  await page.setViewportSize(sizes[0]);
  await page.goto('/#project-agents');
  await page.addStyleTag({ content: 'html {font-size:200%; scroll-behavior:auto}' });
  await expect(page.locator('html')).not.toHaveClass(/projects-staged/);
  const buttons = page.locator('[data-project-button]');
  const initial = await page.evaluate(() => history.length);
  await buttons.nth(2).focus();
  await buttons.nth(2).press('Enter');
  await flowDestination(page, 2);
  await expect(buttons.nth(2)).toBeFocused();
  expect(await page.evaluate(() => history.length)).toBe(initial + 1);
  await buttons.nth(2).press('Enter');
  await flowDestination(page, 2);
  expect(await page.evaluate(() => history.length)).toBe(initial + 1);
  const calls = await page.evaluate(() => window.__focusCalls);
  await page.goBack();
  await flowDestination(page, 1);
  expect(await page.evaluate(() => window.__focusCalls)).toBe(calls);
  await page.goForward();
  await flowDestination(page, 2);
  const permalink = page.locator('#project-interface .project-permalink');
  await permalink.focus();
  await permalink.press('Enter');
  await flowDestination(page, 2);
  await expect(permalink).toBeFocused();
  expect(await page.evaluate(() => history.length)).toBe(initial + 1);
});

test('unfocused Agent survives live text enlargement and restoration without corrective navigation', async ({ page }) => {
  await page.setViewportSize(sizes[0]);
  await page.goto('/#project-agents');
  const agent = page.locator('#project-agents');
  const selected = page.locator('[data-project-button]').nth(1);
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await expect(agent).toBeInViewport();
  const historyLength = await page.evaluate(() => history.length);

  for (const scale of [200, 100, 200, 100]) {
    await page.evaluate(value => { document.documentElement.style.fontSize = `${value}%`; }, scale);
    await expect(page.locator('html')).not.toHaveClass(/projects-staged/);
    // Let ResizeObserver and scroll updates settle; do not focus or scroll to
    // Agent, since either would mask a lost reading position. With natural
    // document scrolling, live text enlargement may reflow content out of the
    // viewport; the important invariant is that the selection, URL and panel
    // visibility state stay intact.
    await page.waitForTimeout(600);
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
    await expect(agent).not.toHaveAttribute('inert');
    await expect(agent).not.toHaveAttribute('aria-hidden', 'true');
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
    await expect(page).toHaveURL(/#project-agents$/);
  }
});

test('live enlargement and boundary crossings settle with full focus clearance and idle frames', async ({ page }) => {
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window);
    window.__frames = 0;
    window.requestAnimationFrame = callback => { window.__frames++; return request(callback); };
  });
  await page.setViewportSize(sizes[0]);
  await page.goto('/#project-agents');
  const permalink = page.locator('#project-agents .project-permalink');
  await permalink.focus();
  for (const scale of [200, 100, 200]) {
    await page.evaluate(value => { document.documentElement.style.fontSize = `${value}%`; }, scale);
    await expect(page.locator('html')).not.toHaveClass(/projects-staged/);
    await expect(permalink).toBeFocused();
    await expect(permalink).not.toHaveAttribute('inert');
    await page.waitForTimeout(350);
    const count = await page.evaluate(() => window.__frames);
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.__frames)).toBe(count);
  }
  for (const width of [960, 961, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('#project-agents')).not.toHaveAttribute('inert');
    await expect(permalink).toBeFocused();
    await permalink.evaluate(el => el.scrollIntoView({block:'center', behavior:'instant'}));
    const clearance = await permalink.evaluate(el => {
      const r = el.getBoundingClientRect();
      const h = el.closest('.project-heading').querySelector('h3').getBoundingClientRect();
      if (Math.abs(h.top - r.top) > 1 || r.width < 44 || r.height < 44) return false;
      if (r.left < 7 || r.right + 7 > innerWidth || r.top < 7 || r.bottom + 7 > innerHeight) return false;
      for (let parent = el.parentElement; parent; parent = parent.parentElement) {
        const s = getComputedStyle(parent), b = parent.getBoundingClientRect();
        if (/(clip|hidden|auto|scroll)/.test(s.overflowX) && (r.left - 7 < b.left || r.right + 7 > b.right)) return false;
        if (/(clip|hidden|auto|scroll)/.test(s.overflowY) && (r.top - 7 < b.top || r.bottom + 7 > b.bottom)) return false;
      }
      const nav = document.querySelector('.chapter-index').getBoundingClientRect();
      return r.bottom + 7 < nav.top || r.top - 7 > nav.bottom || r.right + 7 < nav.left;
    });
    expect(clearance).toBe(true);
  }
});

test('flow fit probes preserve subsequent chapter reading position on resize', async ({ page }) => {
  await page.setViewportSize(sizes[0]);
  await page.goto('/#project-agents');
  await page.addStyleTag({ content: 'html {font-size:200%; scroll-behavior:auto}' });
  await expect(page.locator('html')).not.toHaveClass(/projects-staged/);
  await page.locator('[data-chapter-item="outside"]').click();
  await expect(page.locator('#outside')).toBeInViewport();
  await page.waitForTimeout(600);
  const position = () => page.evaluate(() => ({
    scrollY, top: document.querySelector('#outside').getBoundingClientRect().top,
  }));
  const before = await position();
  const historyLength = await page.evaluate(() => history.length);
  for (const width of [1439, 1440, 1439]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(600);
    await expect(page.locator('html')).not.toHaveClass(/projects-staged/);
    const after = await position();
    expect(Math.abs(after.scrollY - before.scrollY)).toBeLessThan(3);
    expect(Math.abs(after.top - before.top)).toBeLessThan(3);
    await expect(page.locator('#outside')).toBeInViewport();
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
  }
});
