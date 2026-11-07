import {expect,test} from '@playwright/test';
import {inspectInterface} from './interface-study-geometry.js';
const sizes=[{width:1440,height:900},{width:961,height:641},{width:390,height:844},{width:320,height:800},{width:844,height:390}];
const description='An illustrative interface separated into a frame, an information grid and a coral trace.';
function layout(g) {
  expect(g.overflow).toBe(false); expect(g.nested).toBe(false);
  expect(g.scene.width/g.scene.height).toBeCloseTo(1.28,2);
  const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  const halo={left:g.focus.left-7,right:g.focus.right+7,top:g.focus.top-7,bottom:g.focus.bottom+7};
  expect(g.focus.width).toBeGreaterThanOrEqual(44); expect(g.focus.height).toBeGreaterThanOrEqual(44);
  for(const box of [...g.planes.map(p=>p.rect),...g.tethers]) {
    expect(box.left).toBeGreaterThanOrEqual(g.scene.left-1);
    expect(box.right).toBeLessThanOrEqual(g.scene.right+1);
    expect(box.top).toBeGreaterThanOrEqual(g.scene.top-1);
    expect(box.bottom).toBeLessThanOrEqual(g.scene.bottom+1);
    expect(overlap(box,g.copy)).toBe(false); expect(overlap(box,halo)).toBe(false);
  }
  // Soft shadow tails may occupy the reserved gap beneath the scene,
  // but not the caption rule, copy, focus halo, or panel boundaries.
  for(const {envelope:box,projected,rect} of g.planes) {
    // offset* dimensions round fractional CSS pixels; perspective amplifies slightly.
    for(const edge of ['left','right','top','bottom']) expect(Math.abs(projected[edge]-rect[edge])).toBeLessThan(1.5);
    expect(box.left).toBeGreaterThanOrEqual(g.panel.left-1);
    expect(box.right).toBeLessThanOrEqual(g.panel.right+1);
    expect(box.top).toBeGreaterThanOrEqual(g.panel.top-1);
    expect(box.bottom).toBeLessThan(g.caption.top);
    expect(overlap(box,g.copy)).toBe(false); expect(overlap(box,halo)).toBe(false);
  }
  expect(g.caption.top).toBeGreaterThan(g.scene.bottom);
  expect(g.caption.bottom).toBeLessThanOrEqual(g.panel.bottom+1);
  for(const p of [...g.planes,g.world]) { expect(p.transition).toBe('0s'); expect(p.animation).toBe('none'); }
}
for(const state of ['on','off','failed']) test.describe(`Interface JS ${state}`,()=>{
  test.use({javaScriptEnabled:state!=='off'});
  for(const size of sizes) for(const scale of [100,200]) test(`${size.width}x${size.height} root ${scale}%`,async({page})=>{
    await page.setViewportSize(size);
    await page.route('**/',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('</head>',`<style>html{font-size:${scale}%}</style></head>`)});});
    if(state==='failed') await page.route('**/src/main.js',route=>route.abort());
    await page.goto('/#project-interface');
    await expect(page.locator('#project-interface')).toBeInViewport();
    const scene=page.locator('.study-scene');
    await expect(scene).toHaveAccessibleName(description);
    await expect(scene).toHaveAttribute('role','img');
    await expect(page.locator('.study-plane')).toHaveCount(3);
    await expect(page.locator('.study-caption-title')).toHaveText('Illustrative interface study');
    await expect(page.locator('.study-key > span')).toHaveText(['Frame','Information','Trace']);
    await expect(page.locator('.study-world')).toHaveAttribute('aria-hidden','true');
    await expect(page.locator('.study-trace svg')).toHaveAttribute('focusable','false');
    expect(await scene.locator('a,button,input,[tabindex]').count()).toBe(0);
    await page.waitForTimeout(650); layout(await page.evaluate(inspectInterface));
    if(state!=='on'||scale===200||size.width<=960||size.height<=640) await expect(page.locator('html')).not.toHaveClass(/projects-staged/);
    await page.locator('.study-key').scrollIntoViewIfNeeded();
    await expect(page.locator('.study-key')).toBeInViewport({ratio:1});
  });
});
test('static transforms, live release/restore, native wheel reachability and idle shutdown',async({page})=>{
  await page.addInitScript(()=>{const request=requestAnimationFrame.bind(window);window.__frames=0;window.requestAnimationFrame=cb=>{window.__frames++;return request(cb);};});
  await page.setViewportSize(sizes[0]); await page.goto('/#project-interface'); await page.waitForTimeout(800);
  const transforms=async()=>page.evaluate(()=>[...document.querySelectorAll('#project-interface .study-world,#project-interface .study-plane')].map(el=>getComputedStyle(el).transform));
  const before=await transforms();
  await page.locator('.study-scene').hover(); await page.mouse.move(1100,650); await page.mouse.wheel(0,80); await page.waitForTimeout(700);
  expect(await transforms()).toEqual(before);
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  await expect(page.locator('html')).not.toHaveClass(/projects-staged/);
  const cap=page.locator('#project-interface figcaption');
  for(let i=0;i<50;i++){const b=await cap.boundingBox();if(b.y>=0&&b.y+b.height<=900)break;await page.mouse.wheel(0,160);await page.waitForTimeout(70);}
  await expect(cap).toBeInViewport({ratio:1});
  for(const size of [sizes[2],sizes[0]]) {
    await page.setViewportSize(size); await page.evaluate(()=>document.documentElement.style.fontSize='100%'); await page.waitForTimeout(800);
    layout(await page.evaluate(inspectInterface));
    const count=await page.evaluate(()=>window.__frames); await page.waitForTimeout(300); expect(await page.evaluate(()=>window.__frames)).toBe(count);
  }
});
test('keyboard selectors, same-hash permalink and Back/Forward retain native focus',async({page})=>{
  await page.setViewportSize(sizes[0]); await page.goto('/#project-agents');
  const button=page.locator('[data-project-button]').nth(2);await button.focus();await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-pressed','true');await expect(button).toBeFocused();
  await expect(page).toHaveURL(/#project-interface$/);
  const link=page.getByRole('link',{name:'Permalink to Interface studies'});await link.focus();await page.keyboard.press('Enter');await expect(link).toBeFocused();
  await page.goBack();await expect(page).toHaveURL(/#project-agents$/);await page.goForward();await expect(page).toHaveURL(/#project-interface$/);
  await expect(button).toHaveAttribute('aria-pressed','true');
});
