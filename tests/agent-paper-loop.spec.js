import { expect, test } from '@playwright/test';

const sizes = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 800 },
  { width: 844, height: 390 },
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
  const cases = javaScriptEnabled
    ? sizes.flatMap(size => [[size, 100], [size, 200]])
    : [[sizes[0], 100], [sizes[2], 200], [sizes[3], 100]];
  for (const [size, scale] of cases) {
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

test('failed entry script leaves final HTML caption reachable', async ({page}) => {
  await page.route('**/src/main.js',route=>route.abort());
  await page.setViewportSize(sizes[1]);
  await page.goto('/#project-agents');
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
  const count=await page.evaluate(()=>window.__agentFrames);
  await page.waitForTimeout(250);
  expect(await page.evaluate(()=>window.__agentFrames)).toBe(count);
});

for (const [name,size,scale,js,fail] of [
  ['desktop delayed',sizes[0],100,true,false],
  ['narrow no-JS failure',sizes[2],200,false,true],
]) test.describe(`image arrival ${name}`,()=>{
  test.use({javaScriptEnabled:js});
  test(`${fail?'failed':'delayed'} image reserves geometry and native content`,async({page})=>{
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
