import {test,expect} from '@playwright/test';
const keys=['introduction','work','outside','about','elsewhere'];
test('late section layout and genuine wrapped navigation changes invalidate native boundaries',async({page})=>{
  await page.setViewportSize({width:1440,height:900}); await page.goto('/#about'); await page.waitForTimeout(600);
  await page.evaluate(()=>{
    const block=document.createElement('div'); block.style.height='300px'; document.querySelector('#outside').append(block);
    document.querySelector('.chapter-index-list').style.maxWidth='350px';
  });
  await page.waitForTimeout(600);
  await page.locator('[data-chapter-item="about"]').click(); await page.waitForTimeout(500);
  const result=await page.evaluate(()=>({
    target:document.querySelector('#about').getBoundingClientRect().top,
    nav:document.querySelector('.chapter-index').getBoundingClientRect().bottom,
    fill:document.querySelector('[data-chapter-progress="about"] [data-chapter-fill]').getBoundingClientRect().width,
    slot:document.querySelector('.chapter-index-slot').getBoundingClientRect().height,
    navHeight:document.querySelector('.chapter-index').getBoundingClientRect().height,
  }));
  expect(result.target).toBeGreaterThan(result.nav); expect(result.fill).toBeLessThan(1); expect(result.slot).toBeGreaterThan(result.navHeight);
  await expect(page.locator('[data-chapter-item="about"]')).toHaveAttribute('aria-current','location');
});
test('collapsed arrivals and zero-scroll terminal completion stay finite',async({page})=>{
  await page.setViewportSize({width:390,height:844}); await page.goto('/');
  // Real CSS layout fixture: no helper overrides or product-state injection.
  await page.addStyleTag({content:'.hero-track,.chapter-index-slot,.chapter > *,.project-track,.elsewhere > *{display:none!important} .chapter,.elsewhere{height:0!important;min-height:0!important;padding:0!important;margin:0!important}'});
  await page.waitForTimeout(600);
  const result=await page.evaluate(()=>({range:document.documentElement.scrollHeight-innerHeight,fills:[...document.querySelectorAll('.mobile-chapter-progress [data-chapter-fill]')].map(el=>el.getBoundingClientRect().width/el.parentElement.getBoundingClientRect().width)}));
  expect(result.range).toBe(0); expect(result.fills).toEqual([1,1,1,1,1]);
  await expect(page.locator('[data-mobile-chapter="elsewhere"]')).toHaveAttribute('aria-current','location');
});
test('native wheel and pageshow restoration do not alter URL or focus',async({page})=>{
  await page.setViewportSize({width:1440,height:900}); await page.goto('/#work'); await page.waitForTimeout(600);
  const link=page.locator('[data-chapter-item="work"]'); await link.focus(); const url=page.url(); const y=await page.evaluate(()=>scrollY);
  await page.mouse.wheel(0,400); await page.waitForTimeout(500);
  expect(await page.evaluate(()=>scrollY)).toBeGreaterThan(y); expect(page.url()).toBe(url); await expect(link).toBeFocused();
  await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))); await page.waitForTimeout(400);
  const value=await page.evaluate(()=>{
    const work=document.querySelector('#work'), outside=document.querySelector('#outside');
    const a=work.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(work).scrollMarginBlockStart);
    const b=outside.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(outside).scrollMarginBlockStart);
    const track=document.querySelector('.chapter-index [data-chapter-progress="work"]');
    return {expected:(scrollY-a)/(b-a),actual:track.firstElementChild.getBoundingClientRect().width/track.getBoundingClientRect().width};
  });
  expect(value.actual).toBeCloseTo(value.expected,3);
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});
