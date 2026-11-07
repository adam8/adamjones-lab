import { test, expect } from '@playwright/test';
const keys = ['introduction', 'work', 'outside', 'about', 'elsewhere'];
// Independent browser measurements, not product state. Native scrolling rounds
// fractional destinations to device pixels: allow 1 CSS px at boundaries.
async function measure(page) {
  return page.evaluate(keys => {
    const range = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    let last = 0;
    const starts = keys.map(key => {
      const el = document.getElementById(key);
      last = Math.max(last, Math.min(range, Math.max(0, el.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(el).scrollMarginBlockStart))));
      return last;
    });
    return { starts, range };
  }, keys);
}
async function verify(page, geometry) {
  const actual = await page.evaluate(() => {
    const nav = innerWidth <= 800 ? document.querySelector('.mobile-chapter-progress') : document.querySelector('.chapter-index');
    return { y: scrollY, fills: [...nav.querySelectorAll('[data-chapter-progress]')].map(el => el.querySelector('[data-chapter-fill]').getBoundingClientRect().width / el.getBoundingClientRect().width), current: document.querySelector(innerWidth <= 800 ? '[data-mobile-chapter][aria-current]' : '[data-chapter-item][aria-current]')?.getAttribute('href') };
  });
  const terminal = actual.y >= geometry.range;
  let current;
  geometry.starts.forEach((start, i) => {
    if (actual.y + .5 >= start) current = `#${keys[i]}`;
    const end = geometry.starts[i + 1] ?? geometry.range;
    const expected = terminal ? 1 : actual.y < start ? 0 : end <= start ? 1 : Math.min(1, (actual.y - start) / (end - start));
    expect(actual.fills[i]).toBeCloseTo(expected, 3);
  });
  expect(actual.current).toBe(terminal ? '#elsewhere' : current);
}
async function settle(page) { await page.waitForTimeout(500); }
for (const [width, height, enlarged] of [[1440,900],[961,641],[961,641,true],[960,640],[801,900],[800,900],[768,1024],[390,844],[320,800],[320,800,true],[844,390],[844,390,true]]) {
  test(`measured boundaries forward/reverse ${width}x${height}${enlarged ? ' 200% root' : ''}`, async ({page}) => {
    await page.setViewportSize({width,height}); await page.goto('/');
    if (enlarged) await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    await settle(page);
    const geometry = await measure(page);
    const samples = [0, ...geometry.starts.flatMap((start,i) => [start, (start + (geometry.starts[i+1] ?? geometry.range))/2]), geometry.range];
    for (const y of [...samples, ...samples.reverse()]) {
      await page.evaluate(y => scrollTo(0,y), y); await expect(async () => verify(page, geometry)).toPass({ timeout: 1500, intervals: [50, 100] });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // A whole-document fifth model must differ materially from actual Work.
    expect(Math.abs(geometry.starts[1] - geometry.range / 5)).toBeGreaterThan(20);
  });
}
test('roomy mobile menu is geometry-neutral; native arrival and keyboard retain URL/focus', async ({page}) => {
  await page.setViewportSize({width:390,height:844}); await page.goto('/#work'); await settle(page);
  const before = await measure(page); const y = await page.evaluate(() => scrollY);
  const summary = page.locator('#mobile-chapters > summary'); await summary.click(); await settle(page);
  expect(await measure(page)).toEqual(before); expect(await page.evaluate(() => scrollY)).toBe(y); await verify(page,before);
  const track = await page.locator('.mobile-chapter-progress').boundingBox();
  const nav = await page.locator('#mobile-chapters nav').boundingBox(); expect(track.y).toBeCloseTo(nav.y+nav.height,0);
  await page.locator('#mobile-chapters a[href="#about"]').click(); await settle(page);
  const header = await page.locator('.site-header').boundingBox();
  expect((await page.locator('#about').boundingBox()).y).toBeGreaterThanOrEqual(header.height);
  const url = page.url(); await summary.focus(); await page.keyboard.press('PageDown'); await settle(page);
  expect(page.url()).toBe(url); await expect(summary).toBeFocused(); await verify(page,await measure(page));
});
for (const width of [1440,390]) test(`project hash, history, resize and restored root at ${width}`, async ({page}) => {
  await page.setViewportSize({width,height:900}); await page.goto('/#project-agents'); await settle(page); await verify(page,await measure(page));
  await page.evaluate(() => location.hash = '#about'); await settle(page); await verify(page,await measure(page));
  await page.goBack(); await settle(page); await verify(page,await measure(page));
  await page.goForward(); await settle(page); await verify(page,await measure(page));
  for (const size of ['200%','']) { await page.evaluate(size => document.documentElement.style.fontSize = size,size); await settle(page); await verify(page,await measure(page)); }
  await page.setViewportSize({width:960,height:640}); await settle(page); await verify(page,await measure(page));
});
test('idle scheduler and scroll-only progress do not scan chapter geometry', async ({page}) => {
  await page.addInitScript(() => {
    window.rafCount = 0; const raf = requestAnimationFrame; window.requestAnimationFrame = cb => { window.rafCount++; return raf(cb); };
    window.chapterReads = 0; const rect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function(...args) { if (['introduction','work','outside','about','elsewhere'].includes(this.id)) window.chapterReads++; return rect.apply(this,args); };
  });
  await page.goto('/'); await page.waitForTimeout(800);
  const reads = await page.evaluate(() => window.chapterReads);
  for (const y of [100,200,300,400]) { await page.evaluate(y => scrollTo(0,y),y); await settle(page); }
  expect(await page.evaluate(() => window.chapterReads)).toBe(reads);
  const frames = await page.evaluate(() => window.rafCount); await page.waitForTimeout(350); expect(await page.evaluate(() => window.rafCount)).toBe(frames);
});
for (const state of ['nojs','failure']) test(`${state} hides meters and preserves enlarged native navigation`, async ({browser,baseURL}) => {
  const context = await browser.newContext({javaScriptEnabled:state !== 'nojs',viewport:{width:320,height:800}}); const page = await context.newPage();
  if (state === 'failure') await page.route('**/src/main.js',route => route.abort());
  await page.goto(baseURL); await page.evaluate(() => document.documentElement.style.fontSize='200%');
  await page.locator('#mobile-chapters summary').click(); await expect(page.locator('.mobile-chapter-progress [data-chapter-progress]').first()).toHaveCSS('visibility','hidden');
  await page.locator('#mobile-chapters a[href="#elsewhere"]').click(); await expect(page.locator('#elsewhere h2')).toBeInViewport(); await context.close();
});
