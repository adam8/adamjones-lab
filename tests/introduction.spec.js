import { expect, test } from '@playwright/test';

const paragraph = 'I’m a front-end developer with a background in graphic design. My work focuses on complex interfaces, particularly financial software. Outside of that, I build smaller projects to explore new tools and ideas.';
const viewports = [[1440,900],[961,641],[768,1024],[390,844],[844,390],[1440,640],[320,800]];

// Inspect un-clipped text ranges and individual SVG geometry, including round strokes.
async function geometry(page) {
  return page.locator('#introduction').evaluate(section => {
    const rect = el => { const r=el.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}; };
    const svg=section.querySelector('svg'), box=rect(svg), vb=svg.viewBox.baseVal;
    const painted=[...svg.querySelectorAll('path')].map(path=>{
      const b=path.getBBox(), pad=parseFloat(getComputedStyle(path).strokeWidth)/2;
      const matrix=path.getScreenCTM();
      const p=new DOMPoint(b.x-pad,b.y-pad).matrixTransform(matrix);
      const q=new DOMPoint(b.x+b.width+pad,b.y+b.height+pad).matrixTransform(matrix);
      return {x:b.x-pad,y:b.y-pad,right:b.x+b.width+pad,bottom:b.y+b.height+pad,left:p.x,top:p.y,screenRight:q.x,screenBottom:q.y};
    });
    const texts=[...section.querySelectorAll('.label,h2,p')].flatMap(el=>{
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT); const bounds=[];
      while(walker.nextNode()) { const range=document.createRange(); range.selectNodeContents(walker.currentNode); bounds.push(...[...range.getClientRects()].map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom}))); }
      return bounds;
    });
    return {section:rect(section),label:rect(section.querySelector('.label')),heading:rect(section.querySelector('h2')),p:rect(section.querySelector('p')),box,painted,texts,vb:{width:vb.width,height:vb.height},viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth};
  });
}

for (const javaScriptEnabled of [true,false]) {
  test.describe(`Introduction JS ${javaScriptEnabled}`,()=>{
    test.use({javaScriptEnabled});
    for (const [width,height] of viewports) for (const scale of [100,200]) {
      test(`${width}x${height} root text ${scale}%`,async({page})=>{
        await page.setViewportSize({width,height});
        await page.route('**/*',async route=>{
          if (route.request().resourceType() !== 'document') return route.continue();
          const response=await route.fetch();
          await route.fulfill({response,body:(await response.text()).replace('</head>',`<style>html{font-size:${scale}%;scroll-behavior:auto}</style></head>`)});
        });
        await page.goto('/#introduction');
        await expect(page.locator('#intro-title')).toHaveText('I design interfaces.And build them.');
        await expect(page.locator('#intro-title em')).toHaveText('And build them.');
        await expect(page.locator('#introduction .label')).toHaveText('01 / Introduction');
        await expect(page.locator('.intro-composition > p')).toHaveText(paragraph);
        const svg=page.locator('.intro-sheet');
        await expect(svg).toHaveAttribute('aria-hidden','true');
        await expect(svg).toHaveAttribute('focusable','false');
        await expect(svg).toHaveCSS('pointer-events','none');
        await expect(svg.locator('a,button,[tabindex],text,title')).toHaveCount(0);
        expect(await page.locator('.intro-composition').evaluate(el=>el.firstElementChild.tagName)).toBe('P');
        const g=await geometry(page);
        expect(g.scrollWidth).toBeLessThanOrEqual(width);
        if (width<=1056 || scale===200 || height<=640) expect(g.heading.top).toBeGreaterThan(g.label.bottom);
        else expect(g.heading.top).toBeGreaterThanOrEqual(g.label.top);
        expect(g.p.top).toBeGreaterThan(g.heading.bottom);
        const stacked=width<=960 || height<=640 || scale===200 || width===961;
        if(stacked) expect(g.box.top).toBeGreaterThan(g.p.bottom);
        else {expect(g.box.right).toBeLessThan(g.p.left);expect(g.p.width).toBeGreaterThanOrEqual(512);}
        expect(g.box.width/g.box.height).toBeCloseTo(600/370,2);
        for(const b of g.painted) {
          expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);
          expect(b.right).toBeLessThanOrEqual(g.vb.width);expect(b.bottom).toBeLessThanOrEqual(g.vb.height);
          expect(b.left).toBeGreaterThanOrEqual(g.box.left);expect(b.top).toBeGreaterThanOrEqual(g.box.top);
          expect(b.screenRight).toBeLessThanOrEqual(g.box.right);expect(b.screenBottom).toBeLessThanOrEqual(g.box.bottom);
          expect(b.screenBottom).toBeLessThan(g.section.bottom);
          for(const t of g.texts) expect(b.screenRight<=t.left || b.left>=t.right || b.screenBottom<=t.top || b.top>=t.bottom).toBe(true);
        }
        for(const t of g.texts) {expect(t.left).toBeGreaterThanOrEqual(-1);expect(t.right).toBeLessThanOrEqual(width+1);expect(t.bottom).toBeLessThanOrEqual(g.section.bottom);}
      });
    }
  });
}

test('enlargement after load releases columns and native enlarged navigation clears index',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/#introduction');
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%';document.documentElement.style.scrollBehavior='auto';});
  let g=await geometry(page);expect(g.box.top).toBeGreaterThan(g.p.bottom);
  await page.goto('/#outside');
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%';document.documentElement.style.scrollBehavior='auto';});
  const link=page.locator('[data-chapter-item="introduction"]');
  await link.focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');
  await expect(link).toBeFocused();await expect(link).toHaveCSS('outline-style','solid');
  await link.press('Enter');await expect(page).toHaveURL(/#introduction$/);
  await expect(link).toHaveAttribute('aria-current','location');
  g=await geometry(page);
  const indexBottom=await page.locator('.chapter-index').evaluate(el=>el.getBoundingClientRect().bottom);
  expect(g.heading.top).toBeGreaterThan(indexBottom);
  await page.goBack();await expect(page).toHaveURL(/#outside$/);
  await page.goForward();await expect(page).toHaveURL(/#introduction$/);
});
