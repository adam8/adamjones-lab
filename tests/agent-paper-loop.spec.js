import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';

const sizes = [
  { width: 1440, height: 900 }, { width: 961, height: 641 },
  { width: 390, height: 844 }, { width: 320, height: 800 }, { width: 844, height: 390 },
];
const caption = 'Conceptual workflow sketch';

async function inspect(page) {
  return page.locator('#project-agents').evaluate(panel => {
    const svg = panel.querySelector('.agent-object');
    const figure = panel.querySelector('figure');
    const cap = figure.querySelector('figcaption');
    const copy = panel.querySelector('.project-copy');
    const rect = el => { const r = el.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height }; };
    const bounds = { left:Infinity, top:Infinity, right:-Infinity, bottom:-Infinity };
    for (const el of svg.querySelectorAll('path,polygon,rect,circle,ellipse')) {
      const b = el.getBBox();
      const s = getComputedStyle(el);
      // Conservative stroke envelope: miter-limit times half-width, including
      // the schematic's transform. Round joins/caps need only half-width.
      const pad = s.stroke === 'none' ? 0 : parseFloat(s.strokeWidth) / 2 * (s.strokeLinejoin === 'miter' ? parseFloat(s.strokeMiterlimit) : 1);
      const matrix = svg.getCTM().inverse().multiply(el.getCTM());
      for (const x of [b.x-pad, b.x+b.width+pad]) for (const y of [b.y-pad, b.y+b.height+pad]) {
        const p = new DOMPoint(x,y).matrixTransform(matrix);
        bounds.left=Math.min(bounds.left,p.x); bounds.right=Math.max(bounds.right,p.x);
        bounds.top=Math.min(bounds.top,p.y); bounds.bottom=Math.max(bounds.bottom,p.y);
      }
    }
    const vb = svg.viewBox.baseVal;
    return { panel:rect(panel), art:rect(svg), copy:rect(copy), figure:rect(figure), cap:rect(cap), bounds,
      viewBox:{left:vb.x,top:vb.y,right:vb.x+vb.width,bottom:vb.y+vb.height},
      font:parseFloat(getComputedStyle(cap).fontSize), root:parseFloat(getComputedStyle(document.documentElement).fontSize),
      family:getComputedStyle(cap).fontFamily, lineHeight:parseFloat(getComputedStyle(cap).lineHeight),
      overflow:document.documentElement.scrollWidth > innerWidth,
      nested:[panel,figure,svg,cap].some(el=>/auto|scroll/.test(getComputedStyle(el).overflowY)) };
  });
}

function checkLayout(g, width) {
  expect(g.overflow).toBe(false); expect(g.nested).toBe(false);
  for (const box of [g.copy,g.figure,g.art,g.cap]) {
    expect(box.left).toBeGreaterThanOrEqual(g.panel.left - 1);
    expect(box.right).toBeLessThanOrEqual(g.panel.right + 1);
    expect(box.bottom).toBeLessThanOrEqual(g.panel.bottom + 1);
    expect(box.top).toBeGreaterThanOrEqual(g.panel.top - 1);
  }
  expect(g.cap.top).toBeGreaterThanOrEqual(g.art.bottom + 10);
  expect(g.font / g.root).toBeCloseTo(.875);
  expect(g.lineHeight / g.font).toBeCloseTo(1.6, 1);
  expect(g.family).toMatch(/monospace/);
  for (const side of ['left','top']) expect(g.bounds[side]).toBeGreaterThan(g.viewBox[side] + 5);
  for (const side of ['right','bottom']) expect(g.bounds[side]).toBeLessThan(g.viewBox[side] - 5);
  if (width <= 960) expect(g.art.top).toBeGreaterThan(g.copy.bottom);
  else expect(g.art.left >= g.copy.right || g.art.top >= g.copy.bottom).toBe(true);
}

for (const javaScriptEnabled of [true,false]) test.describe(`paper loop JS ${javaScriptEnabled}`, () => {
  test.use({ javaScriptEnabled });
  for (const size of sizes) for (const scale of [100,200]) {
    test(`${size.width}x${size.height} root ${scale}%`, async ({page}) => {
      await page.setViewportSize(size);
      await page.route('**/', async route => {
        const response = await route.fetch();
        await route.fulfill({response,body:(await response.text()).replace('</head>',`<style>html {font-size:${scale}%}</style></head>`)});
      });
      await page.goto('/#project-agents');
      await expect(page.locator('#project-agents')).toBeInViewport();
      await expect(page.locator('#project-agents figcaption')).toHaveText(caption);
      checkLayout(await inspect(page),size.width);
      if (scale === 100 && [1440,390].includes(size.width)) expect((await inspect(page)).art.width).toBeGreaterThan(300);
    });
  }
});

test('ordered supplied artwork, semantics and original SVG drawing defaults', async ({page}) => {
  await page.goto('/#project-agents');
  const svg = page.locator('#project-agents svg');
  await expect(svg).toHaveCount(1);
  await expect(svg).toHaveAttribute('role','img');
  await expect(svg).toHaveAttribute('focusable','false');
  await expect(svg).not.toHaveAttribute('aria-hidden');
  const data = await svg.evaluate(el => ({
    artwork:[...el.querySelectorAll('*')].filter(n=>!['title','desc'].includes(n.localName)).map(n=>[n.localName,[...n.attributes].map(a=>[a.name,a.value]).sort((a,b)=>a[0].localeCompare(b[0],'en'))]),
    refs:el.getAttribute('aria-labelledby').split(' ').map(id=>({id,count:document.querySelectorAll(`[id="${id}"]`).length,text:document.getElementById(id)?.textContent})),
    shadowStroke:getComputedStyle(el.querySelector('ellipse')).stroke,
    root:['fill','stroke','strokeWidth','strokeLinecap','strokeLinejoin'].map(key=>getComputedStyle(el)[key]),
    stops:el.querySelectorAll('a,[tabindex],button').length,
  }));
  // Digest of ordered tags and sorted attributes from supplied paper-loop.svg;
  // excludes only its root and accessibility metadata. Includes every group.
  expect(createHash('sha256').update(JSON.stringify(data.artwork)).digest('hex')).toBe('0b2ad8514dd25f491e683239751a8cedfd4280bd131cc94086d6303a50d22e69');
  for (const ref of data.refs) { expect(ref.id).toMatch(/^agent-loop-/); expect(ref.count).toBe(1); expect(ref.text).toBeTruthy(); }
  expect(data.shadowStroke).toBe('none');
  expect(data.root).toEqual(['rgb(0, 0, 0)','none','1px','butt','miter']);
  expect(data.stops).toBe(0);
});

test('failed entry script leaves final HTML caption reachable', async ({page}) => {
  await page.route('**/src/main.js',route=>route.abort());
  await page.setViewportSize(sizes[2]);
  await page.goto('/#project-agents');
  await expect(page.locator('html')).not.toHaveClass(/projects-staged/);
  const cap=page.locator('#project-agents figcaption');
  await cap.scrollIntoViewIfNeeded();
  await expect(cap).toBeInViewport();
  checkLayout(await inspect(page),390);
});

test('native wheels reach final caption after live enlargement; restoration stays selected and idle', async ({page}) => {
  await page.addInitScript(() => {
    const request = requestAnimationFrame.bind(window); window.__agentFrames=0;
    window.requestAnimationFrame = cb => { window.__agentFrames++; return request(cb); };
  });
  await page.setViewportSize(sizes[0]);
  await page.goto('/#project-agents');
  const selected=page.locator('[data-project-button]').nth(1);
  await expect(selected).toHaveAttribute('aria-pressed','true');
  const history=await page.evaluate(()=>window.history.length);
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  await expect(page.locator('html')).not.toHaveClass(/projects-staged/);
  await expect(selected).toHaveAttribute('aria-pressed','true');
  const cap=page.locator('#project-agents figcaption');
  const before=await page.evaluate(()=>scrollY);
  await page.mouse.move(1000,600);
  for(let step=0;step<30;step++) {
    const b=await cap.boundingBox();
    if(b.y>=0 && b.y+b.height<=900) break;
    await page.mouse.wheel(0,160); await page.waitForTimeout(80);
  }
  await expect(cap).toBeInViewport({ratio:1});
  expect(await page.evaluate(()=>scrollY)).toBeGreaterThan(before);
  for (const [width,scale] of [[960,200],[1440,100]]) {
    await page.setViewportSize({width,height:900});
    await page.evaluate(s=>document.documentElement.style.fontSize=`${s}%`,scale);
    await page.waitForTimeout(600);
    await expect(selected).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('#project-agents')).toBeInViewport();
    expect(await page.evaluate(()=>window.history.length)).toBe(history);
    expect(await page.evaluate(()=>document.activeElement===document.body)).toBe(true);
    checkLayout(await inspect(page),width);
    const count=await page.evaluate(()=>window.__agentFrames);
    await page.waitForTimeout(250);
    expect(await page.evaluate(()=>window.__agentFrames)).toBe(count);
  }
});
