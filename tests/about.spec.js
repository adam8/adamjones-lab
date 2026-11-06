import { test, expect } from '@playwright/test';

const facts = [
  ['Location', 'Vancouver Island, British Columbia'],
  ['Day-to-day work', 'Front-end development and interface design for institutional FX and other complex, real-time information'],
  ['Tools', 'JavaScript, React, CSS, and Figma'],
  ['Current explorations', 'AI agents, practical machine learning, Raspberry Pi experiments, and WebGL/interface motion'],
  ['Background', 'Graphic design and UI/UX'],
];
const pretext = url => url.pathname.includes('@chenglou_pretext') || url.pathname.includes('/@chenglou/pretext/');

async function inspect(page) {
  await expect(page.getByRole('heading', { name: 'A short specification', exact: true })).toHaveCount(1);
  await expect(page.locator('#about dl')).toHaveCount(1);
  for (const [i, [term, definition]] of facts.entries()) {
    await expect(page.locator('.about-fact dt').nth(i)).toHaveText(term);
    await expect(page.locator('.about-fact dd').nth(i)).toHaveText(definition);
  }
  const errors = await page.locator('#about').evaluate(section => {
    // Disable ancestor clipping: hidden overflow must not disguise a failed fit.
    for (let el = section; el; el = el.parentElement) el.style.overflow = 'visible';
    const errors = [];
    for (const dd of section.querySelectorAll('dt,dd')) {
      const cell = dd.closest('.about-fact').getBoundingClientRect();
      const walker = document.createTreeWalker(dd, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        for (const match of node.textContent.matchAll(/[A-Za-z]+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
          const rects = [...range.getClientRects()];
          if (rects.length !== 1) errors.push(`split word: ${match[0]}`);
          if (rects.some(r => r.left < cell.left - 1 || r.right > cell.right + 1)) errors.push(`cell overflow: ${match[0]}`);
          if (rects.some(r => r.left < -1 || r.right > innerWidth + 1)) errors.push(`overflow: ${match[0]}`);
        }
      }
    }
    if (section.scrollWidth > innerWidth) errors.push('section overflow');
    return errors;
  });
  expect(errors).toEqual([]);
  await page.locator('.about-background dd').scrollIntoViewIfNeeded();
  await expect(page.locator('.about-background dd')).toBeInViewport();
}

for (const width of [320,360,375,390,768,801,844,961,1100,1280,1440]) {
  for (const scale of [100,200]) for (const state of ['enabled','nojs','blocked','measurement']) {
    test(`${width}px ${scale}% ${state}`, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: state !== 'nojs' });
      const page = await context.newPage();
      await page.route('**/*', async route => {
        if (route.request().resourceType() === 'document') {
          const response = await route.fetch();
          return route.fulfill({ response, body: (await response.text()).replace('</head>', `<style>html{font-size:${scale}%;scroll-behavior:auto}</style></head>`) });
        }
        if (pretext(new URL(route.request().url()))) {
          if (state === 'blocked') return route.abort();
          if (state === 'measurement') return route.fulfill({ contentType:'text/javascript', body:'export const prepare=()=>{throw Error("measurement")}; export const layout=()=>{}; export const measureNaturalWidth=()=>0; export const clearCache=()=>{};' });
        }
        return route.continue();
      });
      await page.goto(`${baseURL}/#about`);
      if (state === 'enabled') await expect(page.locator('#about')).toHaveAttribute('data-layout', /grid|reading/);
      else await expect(page.locator('#about')).not.toHaveAttribute('data-layout');
      await inspect(page);
      expect(await page.locator('.about-location dd').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBe((width <= 800 ? 18 : 42) * scale / 100);
      await context.close();
    });
  }
}

for (const [width,height] of [[844,390],[1440,640]]) for (const scale of [100,200]) {
  test(`short ${width}x${height} ${scale}%`, async ({page}) => {
    await page.setViewportSize({width,height}); await page.goto('/#about');
    await page.evaluate(scale => document.documentElement.style.fontSize = `${scale}%`, scale);
    await expect(page.locator('#about')).toHaveAttribute('data-layout','reading');
    await inspect(page);
  });
}

test('controller and library evaluation failures retain CSS and surrounding startup', async ({browser,baseURL}) => {
  for (const boundary of ['controller','library']) {
    const page = await browser.newPage();
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if ((boundary === 'controller' && url.pathname === '/src/about-typesetter.js') || (boundary === 'library' && pretext(url)))
        return route.fulfill({contentType:'text/javascript',body:'throw Error("evaluation"); export const prepare=()=>{}; export const layout=()=>{}; export const measureNaturalWidth=()=>{}; export const clearCache=()=>{};'});
      return route.continue();
    });
    await page.goto(`${baseURL}/#about`); await page.waitForTimeout(300);
    await expect(page.locator('html')).toHaveClass(/js/);
    await expect(page.locator('#about')).not.toHaveAttribute('data-layout');
    await inspect(page); await page.close();
  }
});

test('live changes settle; runtime failure releases enhancement; native navigation survives', async ({page}) => {
  await page.addInitScript(() => {
    const raf = requestAnimationFrame; window.framesRun = 0;
    window.requestAnimationFrame = cb => raf.call(window, t => { window.framesRun++; cb(t); });
  });
  await page.setViewportSize({width:1440,height:900}); await page.goto('/#about');
  await expect(page.locator('#about')).toHaveAttribute('data-layout','grid');
  for (const width of [1100,1280,961,1440]) { await page.setViewportSize({width,height:900}); await page.waitForTimeout(80); }
  await page.evaluate(() => document.documentElement.style.fontSize='200%');
  await expect(page.locator('#about')).toHaveAttribute('data-layout','reading');
  await page.evaluate(() => { document.documentElement.style.fontSize='100%'; document.querySelector('#about').style.fontFamily='serif'; });
  await expect(page.locator('#about')).toHaveAttribute('data-layout','grid');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:2,mobile:false});
  await page.waitForTimeout(500);
  const before = await page.evaluate(() => window.framesRun);
  await page.waitForTimeout(400); expect(await page.evaluate(() => window.framesRun)).toBe(before);
  await page.evaluate(() => {
    CanvasRenderingContext2D.prototype.measureText = () => {throw Error('later failure');};
    if (globalThis.OffscreenCanvasRenderingContext2D) OffscreenCanvasRenderingContext2D.prototype.measureText = () => {throw Error('later failure');};
    document.querySelector('.about-location dd').style.fontFamily='monospace';
  });
  await expect(page.locator('#about')).not.toHaveAttribute('data-layout');
  await expect(page.locator('.about-font-sentinel')).toHaveCount(0);
  await page.evaluate(() => document.querySelector('.about-location dd').style.fontFamily='Georgia');
  await page.waitForTimeout(300);
  await expect(page.locator('#about')).not.toHaveAttribute('data-layout');
  const y = await page.evaluate(() => scrollY); await page.mouse.wheel(0,300); await page.waitForTimeout(300);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(y);
  await page.keyboard.press('PageUp'); await page.waitForTimeout(300);
  await page.locator('[data-chapter-item="elsewhere"]').click(); await expect(page).toHaveURL(/#elsewhere$/);
  await page.locator('[data-chapter-item="about"]').focus(); await page.keyboard.press('Enter'); await expect(page).toHaveURL(/#about$/);
  await page.goBack(); await expect(page).toHaveURL(/#elsewhere$/);
  await page.goForward(); await expect(page).toHaveURL(/#about$/);
});

test('unrelated motion writes do not measure About; inherited and local font changes do', async ({page}) => {
  await page.addInitScript(() => {
    window.aboutReads = 0;
    const computed = window.getComputedStyle;
    window.getComputedStyle = function (...args) {
      if (new Error().stack.includes('about-typesetter')) window.aboutReads++;
      return computed.apply(this, args);
    };
    const rect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (...args) {
      if (new Error().stack.includes('about-typesetter')) window.aboutReads++;
      return rect.apply(this, args);
    };
    const width = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
    Object.defineProperty(Element.prototype, 'clientWidth', { ...width, get() {
      if (new Error().stack.includes('about-typesetter')) window.aboutReads++;
      return width.get.call(this);
    }});
  });
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/#about');
  await expect(page.locator('#about')).toHaveAttribute('data-layout','grid');
  await page.waitForTimeout(600);
  const before = await page.evaluate(() => window.aboutReads);
  await page.evaluate(async () => {
    for (let i=0; i<20; i++) {
      document.documentElement.style.setProperty('--hero-object-y', `${i}vh`);
      document.documentElement.style.setProperty('--hero-object-rotate', `${i}deg`);
      document.documentElement.style.scrollBehavior = i % 2 ? 'auto' : '';
      document.querySelector('.reading-progress').style.setProperty('transform', `scaleX(${i/20})`);
      // A sibling class/style mutation must not cause an About measurement either.
      document.querySelector('#elsewhere').style.setProperty('--test-motion', String(i));
      await new Promise(requestAnimationFrame);
    }
  });
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.aboutReads)).toBe(before);
  await page.evaluate(() => document.querySelector('.about-location dd').style.fontSize='var(--test-about-size, 42px)');
  await page.waitForTimeout(100);
  const local = await page.evaluate(() => window.aboutReads);
  expect(local).toBeGreaterThan(before);
  await page.evaluate(() => document.documentElement.style.setProperty('--test-about-size','100px'));
  await expect(page.locator('#about')).toHaveAttribute('data-layout','reading');
  expect(await page.evaluate(() => window.aboutReads)).toBeGreaterThan(local);
  await page.waitForTimeout(200);
  const settled = await page.evaluate(() => window.aboutReads);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.aboutReads)).toBe(settled);
});
