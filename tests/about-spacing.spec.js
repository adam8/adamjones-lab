import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { matrix, measure } from '../docs/review/f-021-capture.mjs';

// Compare the transferred CSS and candidate in the same browser/font environment.
// Removing this one trailing block restores the exact pinned component's spacing.
const marker = '/* F-021: shorten only the fallback title pause';
const typeKeys = ['fontFamily','fontSize','fontWeight','fontStyle','letterSpacing','lineHeight'];
const type = t => Object.fromEntries(typeKeys.map(k=>[k,t[k]]));
// Discretionary-break metadata may differ; visible glyph geometry must not.
const visibleTitle = title => ({...title, parts:title.parts.map(p=>({...p,text:p.text.replaceAll('\u00ad','')})),glyphs:title.glyphs.filter(g=>g.text!=='\u00ad')});
const glyphShape = title => visibleTitle(title).glyphs.map(g=>({text:g.text,ink:g.inkMetrics,rects:g.rects.map(r=>({x:r.x,width:r.width,height:r.height}))}));

async function compare(browser, baseURL, width, height, scale, js, state='enabled') {
  const context = await browser.newContext({viewport:{width,height},javaScriptEnabled:js,deviceScaleFactor:1});
  let page = await context.newPage();
  let baseline = true;
  await context.route('**/*',async route=>{
    const req=route.request(), path=new URL(req.url()).pathname;
    if(req.resourceType()==='document') {
      const response=await route.fetch();
      return route.fulfill({response,body:(await response.text()).replace('</head>',`<style>html{font-size:${scale}%;scroll-behavior:auto}</style></head>`)});
    }
    if(path==='/src/styles.css') {
      const body=await readFile('src/styles.css','utf8');
      expect(body).toContain(marker);
      return route.fulfill({contentType:'text/css',body:baseline ? body.slice(0,body.indexOf(marker)) : body});
    }
    if(path.includes('@chenglou_pretext') || path.includes('/@chenglou/pretext/')) {
      if(state==='blocked') return route.abort();
      if(state==='measurement') return route.fulfill({contentType:'text/javascript',body:'export const prepare=()=>{throw Error("measurement")}; export const layout=()=>{}; export const measureNaturalWidth=()=>0; export const clearCache=()=>{};'});
    }
    return route.continue();
  });
  const capture = async () => {
    await page.goto(`${baseURL}/#about`);
    await page.evaluate(()=>document.fonts.ready);
    if(js && state==='enabled') await expect(page.locator('#about')).toHaveAttribute('data-layout',/grid|reading/);
    await page.waitForTimeout(400);
    return measure(page);
  };
  try {
    const before=await capture(); baseline=false;
    await page.close(); page=await context.newPage();
    const after=await capture();
    expect(after.entryScrollY).toBe(before.entryScrollY);
    expect(after.section.y).toBe(before.section.y);
    expect(after.overflow).toEqual([]);
    expect(after.factOverlap).toBe(false);
    expect(after.terms.map(t=>t.text)).toEqual(before.terms.map(t=>t.text));
    expect(after.terms.map(t=>type(t.typography))).toEqual(before.terms.map(t=>type(t.typography)));
    expect(after.title.parts.map(t=>type(t.typography))).toEqual(before.title.parts.map(t=>type(t.typography)));
    expect(glyphShape(after.title)).toEqual(glyphShape(before.title));
    // Identical wrapping/leading inside each title part; only inter-part margin changes.
    for(const [i,part] of after.title.parts.entries()) expect(part.box.height).toBe(before.title.parts[i].box.height);
    expect(after.terms.map(t=>t.box.height)).toEqual(before.terms.map(t=>t.box.height));
    const expectedTight = height<=640 || (width>=1101 && (js && state==='enabled' ? before.layout==='reading' : before.section.width-2*Math.min(64,Math.max(20,width*.04444))-2 < 75*16*scale/100));
    if(expectedTight) {
      const delta=before.masthead.height-after.masthead.height;
      expect(delta).toBeGreaterThan(25);
      expect(before.section.height-after.section.height).toBeCloseTo(delta,3);
      for(let i=0;i<2;i++) expect(before.location[i].box.y-after.location[i].box.y).toBeCloseTo(delta,3);
      if(before.location[0].additionalScrollToAppear>0) expect(after.location[0].additionalScrollToAppear).toBeLessThan(before.location[0].additionalScrollToAppear);
    } else {
      expect(after.masthead).toEqual(before.masthead);
      expect(after.section).toEqual(before.section);
      expect(after.title).toEqual(before.title);
      expect(after.location).toEqual(before.location);
    }
    // Check all content without concealed overflow or nested text scrolling.
    const safety = await page.locator('#about').evaluate(section=>{
      for(let el=section;el;el=el.parentElement) el.style.overflow='visible';
      return [...section.querySelectorAll('h2,dt,dd')].every(el=>{
        const r=document.createRange();r.selectNodeContents(el);
        return [...r.getClientRects()].every(b=>b.left>=-1 && b.right<=innerWidth+1) && !['auto','scroll','hidden','clip'].includes(getComputedStyle(el).overflowY);
      });
    });
    expect(safety).toBe(true);
    await page.locator('.about-background dd').scrollIntoViewIfNeeded();
    await expect(page.locator('.about-background dd')).toBeInViewport();
  } finally {await context.close();}
}

for(const [name,width,height,scale,js] of matrix) {
  test(`spacing and preservation: ${name}`,async({browser,baseURL})=>compare(browser,baseURL,width,height,scale,js));
}
for(const state of ['blocked','measurement']) {
  test(`enlarged spacing survives ${state} failure`,async({browser,baseURL})=>compare(browser,baseURL,1440,900,200,true,state));
}
for(const [width,scale] of [[1100,200],[1280,200],[1440,109],[1440,110],[1280,100]]) {
  test(`content-relative guard ${width}px ${scale}%`,async({browser,baseURL})=>compare(browser,baseURL,width,900,scale,false));
}

for (const width of [1100,1101,1102,1120,1200,1280]) for (const js of [true,false]) {
  test(`heading frame bounds ${width}px 200% ${js?'enabled':'nojs'}`, async ({browser,baseURL})=>{
    const context=await browser.newContext({viewport:{width,height:900},javaScriptEnabled:js});
    const page=await context.newPage();
    await page.route('**/*',async route=>{
      if(route.request().resourceType()!=='document') return route.continue();
      const response=await route.fetch();
      return route.fulfill({response,body:(await response.text()).replace('</head>','<style>html{font-size:200%;scroll-behavior:auto}</style></head>')});
    });
    await page.goto(`${baseURL}/#about`);
    if(js) await expect(page.locator('#about')).toHaveAttribute('data-layout','reading');
    await page.evaluate(()=>document.fonts.ready);
    const result=await page.locator('#about').evaluate(section=>{
      for(let el=section;el;el=el.parentElement) el.style.overflow='visible';
      const frame=section.querySelector('.about-forme').getBoundingClientRect();
      const range=document.createRange(); range.selectNodeContents(section.querySelector('h2'));
      return {fits:[...range.getClientRects()].every(r=>r.left>=frame.left && r.right<=frame.right && r.left>=0 && r.right<=innerWidth),width:section.scrollWidth,viewport:innerWidth};
    });
    expect(result.fits).toBe(true); expect(result.width).toBeLessThanOrEqual(result.viewport);
    await context.close();
  });
}

test('normal enhanced grid keeps its title pause at 1280px',async({browser,baseURL})=>compare(browser,baseURL,1280,900,100,true));

test('CSS reading threshold is strict; exact 75rem grid keeps its pause',async({browser,baseURL})=>{
  const context=await browser.newContext({viewport:{width:1440,height:900},javaScriptEnabled:false});
  const page=await context.newPage();
  for(const width of [1200,1199]) {
    await page.route('**/*',async route=>{
      if(route.request().resourceType()!=='document') return route.continue();
      const response=await route.fetch();
      return route.fulfill({response,body:(await response.text()).replace('</head>',`<style>.about-forme{box-sizing:content-box;width:${width}px}</style></head>`)});
    });
    await page.goto(`${baseURL}/?frame=${width}#about`);
    expect(await page.locator('.about-facts').evaluate(el=>getComputedStyle(el).display)).toBe(width===1200?'grid':'block');
    expect(await page.locator('.about-masthead').evaluate(el=>getComputedStyle(el).paddingTop)).toBe(width===1200?'30px':'12px');
    await page.unroute('**/*');
  }
  await context.close();
});

// Compare actual raster pixels, not just invisible-break metadata, against the
// pinned title. Strip spacing in both variants to isolate the wrap correction.
for(const [name,width,height,scale,js] of matrix) {
  test(`optional breaks preserve existing title pixels: ${name}`,async({browser,baseURL})=>{
    const context=await browser.newContext({viewport:{width,height},javaScriptEnabled:js,deviceScaleFactor:1});
    const page=await context.newPage(); let original=true;
    await page.route('**/*',async route=>{
      if(new URL(route.request().url()).pathname==='/src/styles.css') {
        const css=await readFile('src/styles.css','utf8');
        return route.fulfill({contentType:'text/css',body:css.slice(0,css.indexOf(marker))});
      }
      if(route.request().resourceType()!=='document') return route.continue();
      const response=await route.fetch(); let html=await response.text();
      if(original) html=html.replace('spec&shy;ifi&shy;ca&shy;tion','specifi&shy;cation');
      return route.fulfill({response,body:html.replace('</head>',`<style>html{font-size:${scale}%;scroll-behavior:auto}</style></head>`)});
    });
    const capture=async()=>{
      await page.goto(`${baseURL}/?title=${original?'pinned':'corrected'}#about`); await page.evaluate(()=>document.fonts.ready);
      if(js) await expect(page.locator('#about')).toHaveAttribute('data-layout',/grid|reading/);
      await page.waitForTimeout(200);
      const metrics=await measure(page);
      // A tall title crop scrolls the page; exclude the unrelated persistent
      // chapter/progress overlays from this title-only raster comparison.
      const pixels=await page.locator('#about-title').screenshot({style:'.chapter-index,.reading-progress{visibility:hidden!important}'});
      return {metrics,pixels};
    };
    const before=await capture(); original=false; const after=await capture();
    expect(visibleTitle(after.metrics.title)).toEqual(visibleTitle(before.metrics.title));
    expect(after.pixels.equals(before.pixels)).toBe(true);
    await context.close();
  });
}
