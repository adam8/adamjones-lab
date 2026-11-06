import { test, expect } from '@playwright/test';

async function safety(page) {
  expect(await page.locator('#about').evaluate(section => {
    for (let el=section; el; el=el.parentElement) el.style.overflow='visible';
    const errors=[];
    for (const el of section.querySelectorAll('dt,dd')) {
      const cell=el.closest('.about-fact').getBoundingClientRect();
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()) for(const word of walker.currentNode.textContent.matchAll(/[A-Za-z]+/g)) {
        const r=document.createRange(); r.setStart(walker.currentNode,word.index); r.setEnd(walker.currentNode,word.index+word[0].length);
        const rects=[...r.getClientRects()];
        if(rects.length!==1 || rects.some(b=>b.left<Math.max(0,cell.left)-1 || b.right>Math.min(innerWidth,cell.right)+1 || b.top<cell.top-1 || b.bottom>cell.bottom+1)) errors.push(word[0]);
      }
      if(['auto','scroll','hidden','clip'].includes(getComputedStyle(el).overflowY)) errors.push('text scroller');
    }
    if(section.scrollWidth>innerWidth) errors.push('overflow');
    return errors;
  })).toEqual([]);
}

for (const width of [320,360,375,390,414,480,640,768,800]) for(const scale of [100,200]) {
  test(`mobile geometry ${width}px ${scale}%`, async({page})=>{
    await page.setViewportSize({width,height:900}); await page.goto('/#about');
    await page.evaluate(scale=>document.documentElement.style.fontSize=`${scale}%`,scale);
    const grid=width>=375 && (scale===100 || width>=640);
    await expect(page.locator('#about')).toHaveAttribute('data-layout',grid?'grid':'reading');
    expect(await page.locator('.about-work dd').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBe(16*scale/100);
    await safety(page);
    if(grid) {
      const boxes=await page.locator('.about-fact').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
      expect(boxes[0].right).toBeLessThan(boxes[2].right);
      expect(boxes[2].right).toBeCloseTo(boxes[3].x,0);
      expect(boxes[3].y).toBe(boxes[2].y);
      expect(boxes[3].bottom).toBe(boxes[4].bottom);
    }
  });
}

for(const [width,height] of [[390,640],[640,390],[800,640],[390,641]]) {
  test(`mobile height ${width}x${height}`,async({page})=>{
    await page.setViewportSize({width,height}); await page.goto('/#about');
    await expect(page.locator('#about')).toHaveAttribute('data-layout',height<=640?'reading':'grid');
    await safety(page);
  });
}

for(const state of ['nojs','blocked','measurement','evaluation']) {
  test(`mobile safe ${state}`,async({browser,baseURL})=>{
    const context=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:state!=='nojs'});
    const page=await context.newPage();
    await page.route('**/*',route=>{
      if(/@chenglou_pretext|\/@chenglou\/pretext\//.test(route.request().url())) {
        if(state==='blocked') return route.abort();
        if(state==='evaluation') return route.fulfill({contentType:'text/javascript',body:'throw Error("evaluation")'});
        if(state==='measurement') return route.fulfill({contentType:'text/javascript',body:'export const prepare=()=>{throw Error("measurement")}; export const layout=()=>{}; export const measureNaturalWidth=()=>0; export const clearCache=()=>{};'});
      }
      return route.continue();
    });
    await page.goto(`${baseURL}/#about`); await page.waitForTimeout(250);
    await expect(page.locator('#about')).not.toHaveAttribute('data-layout');
    expect(await page.locator('.about-facts').evaluate(el=>getComputedStyle(el).display)).toBe('block');
    await safety(page); await context.close();
  });
}

test('mobile live enlargement, idle, native reachability and navigation',async({page})=>{
  await page.addInitScript(()=>{
    window.aboutReads=0; window.switches=0;
    const computed=getComputedStyle;
    window.getComputedStyle=function(...args){if(new Error().stack.includes('about-typesetter')) window.aboutReads++;return computed.apply(this,args);};
    addEventListener('DOMContentLoaded',()=>new MutationObserver(records=>{window.switches+=records.length;}).observe(document.querySelector('#about'),{attributes:true,attributeFilter:['data-layout']}));
  });
  await page.setViewportSize({width:390,height:844}); await page.goto('/#about');
  await expect(page.locator('#about')).toHaveAttribute('data-layout','grid');
  for(const scale of [200,100]) {
    const focus=await page.evaluate(()=>document.activeElement.tagName);
    await page.evaluate(scale=>document.documentElement.style.fontSize=`${scale}%`,scale);
    await expect(page.locator('#about')).toHaveAttribute('data-layout',scale===200?'reading':'grid');
    expect(await page.evaluate(()=>document.activeElement.tagName)).toBe(focus);
    await safety(page);
  }
  await page.waitForTimeout(600);
  const settled=await page.evaluate(()=>[window.aboutReads,window.switches]);
  await page.waitForTimeout(400);
  expect(await page.evaluate(()=>[window.aboutReads,window.switches])).toEqual(settled);
  expect(settled[1]).toBe(3);
  await page.locator('[data-chapter-item="elsewhere"]').click();
  await page.locator('[data-chapter-item="about"]').focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#about$/);
  await page.waitForTimeout(500);
  for(let i=0;i<6;i++) {
    if(await page.locator('.about-background dd').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight;})) break;
    await page.mouse.wheel(0,120); await page.waitForTimeout(150);
  }
  await expect(page.locator('.about-background dd')).toBeInViewport();
  await page.locator('[data-chapter-item="elsewhere"]').click();
  await page.goBack(); await expect(page).toHaveURL(/#about$/);
  await page.goForward(); await expect(page).toHaveURL(/#elsewhere$/);
});

test('mobile fonts, DPR, and runtime failure settle safely',async({page})=>{
  await page.setViewportSize({width:390,height:900}); await page.goto('/#about');
  await expect(page.locator('#about')).toHaveAttribute('data-layout','grid');
  await page.locator('.about-location dt').evaluate(el=>el.style.fontSize='2rem');
  await expect(page.locator('#about')).toHaveAttribute('data-layout','reading');
  await page.locator('.about-location dt').evaluate(el=>el.style.fontSize='');
  await expect(page.locator('#about')).toHaveAttribute('data-layout','grid');
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:2,mobile:false});
  await page.waitForTimeout(300);
  await expect(page.locator('#about')).toHaveAttribute('data-layout','grid');
  await page.evaluate(()=>{
    CanvasRenderingContext2D.prototype.measureText=()=>{throw Error('later failure');};
    if(globalThis.OffscreenCanvasRenderingContext2D) OffscreenCanvasRenderingContext2D.prototype.measureText=()=>{throw Error('later failure');};
    document.querySelector('.about-location dt').style.fontFamily='monospace';
  });
  await expect(page.locator('#about')).not.toHaveAttribute('data-layout');
  await expect(page.locator('.about-font-sentinel')).toHaveCount(0);
  await safety(page);
});
