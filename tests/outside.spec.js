import { chapterLink } from './navigation.js';
import { test, expect } from '@playwright/test';

const paragraph = 'Life on Vancouver Island includes running, gardening, family time outdoors, and small projects around the house.';
const description = 'Imagined floating island with mountains, projecting water, and exposed garden roots.';
const sizes = [[1440,900],[961,641],[390,844],[320,800],[844,390]];

for (const javaScriptEnabled of [true,false]) {
  test.describe(`Outside work, JavaScript ${javaScriptEnabled}`, () => {
    test.use({javaScriptEnabled});
    const cases = javaScriptEnabled
      ? sizes.flatMap(size => [[...size, 100], [...size, 200]])
      : [[1440,900,100],[320,800,200],[844,390,100]];
    for (const [width,height,scale] of cases) {
      test(`complete geometry ${width}x${height}, root text ${scale}%`, async ({page}, testInfo) => {
        await page.setViewportSize({width,height});
        await page.route('**/',async route => {
          const response=await route.fetch();
          await route.fulfill({response,body:(await response.text()).replace('</head>',`<style>html{font-size:${scale}%;scroll-behavior:auto}</style></head>`)});
        });
        await page.goto('/#outside');
        await expect(page.locator('.outside-copy > .label')).toHaveText('Outside work');
        await expect(page.locator('#outside-title')).toHaveText('Islandtime');
        await expect(page.locator('.outside-copy > p:last-child')).toHaveText(paragraph);
        await expect(page.locator('.outside figcaption')).toHaveText('An imagined island landscape.');
        await expect(page.getByRole('img',{name:description,exact:true})).toHaveCount(1);
        await expect(page.locator('.outside figure :is(a,button,input,select,textarea,[tabindex])')).toHaveCount(0);
        const geometry=await page.locator('#outside').evaluate(section => {
          const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
          const copy=section.querySelector('.outside-copy'),figure=section.querySelector('figure'),svg=section.querySelector('svg');
          const image=rect(svg),bounds=rect(section),view=svg.viewBox.baseVal;
          const painted=[...svg.querySelectorAll('path,circle')].map(el=>{
            const b=el.getBBox(),style=getComputedStyle(el),stroke=style.stroke==='none'?0:parseFloat(style.strokeWidth)/2;
            const matrix=el.getScreenCTM();
            const a=new DOMPoint(b.x-stroke,b.y-stroke).matrixTransform(matrix),z=new DOMPoint(b.x+b.width+stroke,b.y+b.height+stroke).matrixTransform(matrix);
            return {left:a.x,right:z.x,top:a.y,bottom:z.y,inViewBox:b.x-stroke>=view.x && b.y-stroke>=view.y && b.x+b.width+stroke<=view.width && b.y+b.height+stroke<=view.height};
          });
          const text=[...section.querySelectorAll('p,h2,figcaption')].flatMap(el=>{
            const range=document.createRange();range.selectNodeContents(el);return [...range.getClientRects()].map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom}));
          });
          const nestedScroll=[section,...section.querySelectorAll('*')].some(el=>{
            const s=getComputedStyle(el);return /(auto|scroll|hidden|clip)/.test(s.overflowY+' '+s.overflowX) && (el.scrollHeight>el.clientHeight+1 || el.scrollWidth>el.clientWidth+1);
          });
          return {bounds,copy:rect(copy),figure:rect(figure),image,painted,text,nestedScroll,heading:rect(section.querySelector('h2')),label:rect(section.querySelector('.label')),paragraph:rect(copy.lastElementChild),caption:rect(section.querySelector('figcaption')),about:rect(document.querySelector('#about')),viewport:innerWidth};
        });
        await testInfo.attach('outside-geometry', {body: JSON.stringify(geometry, null, 2), contentType: 'application/json'});
        const {bounds,copy,figure,image,painted,text}=geometry;
        for(const r of [copy,figure,image,...painted,...text]) {
          expect(r.left).toBeGreaterThanOrEqual(bounds.left-1);
          expect(r.right).toBeLessThanOrEqual(bounds.right+1);
          expect(r.top).toBeGreaterThanOrEqual(bounds.top-1);
          expect(r.bottom).toBeLessThanOrEqual(bounds.bottom+1);
          expect(r.left).toBeGreaterThanOrEqual(-1);
          expect(r.right).toBeLessThanOrEqual(width+1);
        }
        for(const r of painted) {
          expect(r.inViewBox).toBe(true);
          expect(r.left).toBeGreaterThan(image.left);
          expect(r.right).toBeLessThan(image.right);
          expect(r.top).toBeGreaterThan(image.top);
          expect(r.bottom).toBeLessThan(image.bottom);
        }
        expect(figure.left>=copy.right+30 || figure.top>=copy.bottom+30).toBe(true);
        expect(geometry.label.bottom).toBeLessThan(geometry.heading.top);
        expect(geometry.heading.bottom).toBeLessThan(geometry.paragraph.top);
        expect(geometry.caption.top).toBeGreaterThan(image.bottom);
        expect(geometry.about.top-geometry.caption.bottom).toBeGreaterThan(50);
        expect(geometry.nestedScroll).toBe(false);
        if(width<=960 || height<=640 || scale===200) expect(figure.top).toBeGreaterThan(copy.bottom+30);
        if(width===1440 && height===900 && scale===100) expect(figure.left).toBeGreaterThan(copy.right+30);
      });
    }
    for (const [width,height] of [[1440,900],[390,844]]) {
      test(`native navigation ${width}x${height}`,async({page})=>{
        await page.setViewportSize({width,height});
        await page.goto('/#outside');
        await expect(page.locator('#outside-title')).toBeInViewport();
        await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
        const current=async()=>{
          if(javaScriptEnabled) await expect(page.locator('[data-chapter-item="outside"]')).toHaveAttribute('aria-current','location');
          else await expect(page.locator('[data-chapter-item][aria-current]')).toHaveCount(0);
        };
        await current();
        await page.goto('/#about');
        await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
        const link=await chapterLink(page, 'outside');
        await link.click();
        await expect(page).toHaveURL(/#outside$/);
        await current();
        await page.goBack();
        await expect(page).toHaveURL(/#about$/);
        await link.focus();
        await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');
        await expect(link).toBeFocused();
        await expect(link).toHaveCSS('outline-style','solid');
        await link.press('Enter');
        await expect(page).toHaveURL(/#outside$/);
        await current();
        await expect(page.locator('#outside-title')).toBeInViewport();
        const clearance=await page.evaluate(()=>({heading:document.querySelector('#outside-title').getBoundingClientRect().top,index:document.querySelector('.chapter-index').getBoundingClientRect().bottom}));
        expect(clearance.heading).toBeGreaterThan(clearance.index);
      });
    }
  });
}
