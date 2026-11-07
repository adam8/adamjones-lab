import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const sizes = [
  { width: 1440, height: 900 }, { width: 961, height: 641 },
  { width: 390, height: 844 }, { width: 320, height: 800 }, { width: 844, height: 390 },
];
const caption = 'Conceptual workflow sketch';

async function inspect(page) {
  return page.locator('#project-agents').evaluate(panel => {
    const img = panel.querySelector('.agent-object');
    const figure = panel.querySelector('figure');
    const cap = figure.querySelector('figcaption');
    const copy = panel.querySelector('.project-copy');
    const rect = el => { const r = el.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height }; };
    return { panel:rect(panel), art:rect(img), copy:rect(copy), figure:rect(figure), cap:rect(cap),
      intrinsic:[img.width,img.height], natural:[img.naturalWidth,img.naturalHeight],
      rendering:{fit:getComputedStyle(img).objectFit,filter:getComputedStyle(img).filter,clip:getComputedStyle(img).clipPath,transform:getComputedStyle(img).transform},
      font:parseFloat(getComputedStyle(cap).fontSize), root:parseFloat(getComputedStyle(document.documentElement).fontSize),
      family:getComputedStyle(cap).fontFamily, lineHeight:parseFloat(getComputedStyle(cap).lineHeight),
      overflow:document.documentElement.scrollWidth > innerWidth,
      nested:[panel,figure,img,cap].some(el=>/auto|scroll/.test(getComputedStyle(el).overflowY)) };
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
  expect(g.art.width / g.art.height).toBeCloseTo(1.5, 2);
  expect(g.rendering).toEqual({fit:'fill',filter:'none',clip:'none',transform:'none'});
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
      const geometry=await inspect(page);
      expect(geometry.natural).toEqual([1536,1024]);
      checkLayout(geometry,size.width);
      if (scale === 100 && [1440,390].includes(size.width)) expect((await inspect(page)).art.width).toBeGreaterThan(300);
    });
  }
});

test('exact selected raster, decoded alpha, intrinsic framing and coherent semantics', async ({page}) => {
  const bytes=await readFile('src/assets/agent-paper-loop.webp');
  expect(bytes.length).toBe(628320);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('794c5db0764cbca63539b059ebae5dbd93784a0a97b67e53e2b71fb102b5bf38');
  await page.goto('/#project-agents');
  const img=page.locator('#project-agents img.agent-object');
  await expect(img).toHaveCount(1);
  await expect(img).toHaveAttribute('width','1536');
  await expect(img).toHaveAttribute('height','1024');
  await expect(img).toHaveAttribute('loading','eager');
  await expect(img).toHaveAttribute('decoding','async');
  await expect(img).toHaveAccessibleName('Impossible paper ribbon loop');
  await expect(img).not.toHaveAttribute('aria-hidden');
  const response=await page.request.get(await img.getAttribute('src'));
  expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(createHash('sha256').update(bytes).digest('hex'));
  const data=await img.evaluate(async el=>{
    await el.decode();
    const canvas=document.createElement('canvas'); canvas.width=el.naturalWidth; canvas.height=el.naturalHeight;
    const ctx=canvas.getContext('2d'); ctx.drawImage(el,0,0);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let left=canvas.width,top=canvas.height,right=0,bottom=0,opaque=0;
    for(let y=0;y<canvas.height;y++) for(let x=0;x<canvas.width;x++) if(pixels[(y*canvas.width+x)*4+3]) {
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);opaque++;
    }
    return {natural:[el.naturalWidth,el.naturalHeight],bounds:{left,top,right,bottom},opaque,
      corners:[0,canvas.width-1,(canvas.height-1)*canvas.width,canvas.width*canvas.height-1].map(i=>pixels[i*4+3]),
      focusable:el.tabIndex>=0};
  });
  expect(data.natural).toEqual([1536,1024]); expect(data.corners).toEqual([0,0,0,0]);
  expect(data.opaque).toBeGreaterThan(400000);
  // Include the supplied faint alpha fringe; no cropping to the solid object.
  expect(data.bounds).toEqual({left:0,top:9,right:1489,bottom:1005});
  expect(data.focusable).toBe(false);
  await expect(page.locator('#project-agents svg')).toHaveCount(0);
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

for (const [name,size,scale,js] of [
  ['desktop',sizes[0],100,true],['enlarged',sizes[0],200,true],
  ['narrow no-JS',sizes[3],200,false],['short no-JS',sizes[4],100,false],
]) test.describe(`image arrival ${name}`,()=>{
  test.use({javaScriptEnabled:js});
  for(const fail of [false,true]) test(`${fail?'failed':'delayed'} image reserves geometry and native content`,async({page})=>{
    await page.setViewportSize(size);
    await page.route('**/',async route=>{
      const response=await route.fetch();
      await route.fulfill({response,body:(await response.text()).replace('</head>',`<style>html {font-size:${scale}%}</style></head>`)});
    });
    let release; const gate=new Promise(resolve=>release=resolve);
    await page.route('**/agent-paper-loop.webp',async route=>{await gate; if(fail) await route.abort(); else await route.continue();});
    await page.goto('/#project-agents',{waitUntil:'domcontentloaded'});
    const img=page.locator('#project-agents .agent-object');
    const before=await inspect(page);
    expect(before.art.width/before.art.height).toBeCloseTo(1.5,2);
    expect(await img.evaluate(el=>el.complete)).toBe(false);
    release(); await page.waitForLoadState('load'); await page.waitForTimeout(600);
    const after=await inspect(page); checkLayout(after,size.width);
    expect(after.art.width).toBeCloseTo(before.art.width,1); expect(after.art.height).toBeCloseTo(before.art.height,1);
    expect(after.panel.height).toBeCloseTo(before.panel.height,1);
    expect(after.natural).toEqual(fail?[0,0]:[1536,1024]);
    await expect(img).toHaveAttribute('alt',/Impossible paper ribbon loop/);
    await expect(page.locator('#project-agents h3')).toHaveText('Agent experiments');
    await expect(page.locator('#project-agents .project-copy > p').last()).toHaveText('Raspberry Pi and cloud-model experiments involving persistent workflows, research tools, and personal automation.');
    const cap=page.locator('#project-agents figcaption'); await expect(cap).toHaveText(caption);
    await page.mouse.move(size.width/2,size.height/2);
    for(let step=0;step<60;step++) {
      const b=await cap.boundingBox(); if(b.y>=0 && b.y+b.height<=size.height) break;
      await page.mouse.wheel(0,160); await page.waitForTimeout(60);
    }
    await expect(cap).toBeInViewport({ratio:1});
  });
});
