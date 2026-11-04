// Local matched evidence: node docs/review/f-018-capture.mjs [baseline|after]
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
const baseline = 'dbdbb722169b6850be07082928d724fc17c39050';
const mode = process.argv[2] || 'after';
if (!['baseline', 'after'].includes(mode)) throw Error('Use baseline or after');
const server = createServer(async (req,res) => {
  const file = ({'/':'index.html','/src/main.js':'src/main.js','/src/styles.css':'src/styles.css','/favicon.svg':'public/favicon.svg'})[new URL(req.url,'http://localhost').pathname];
  if (!file) return res.writeHead(404).end();
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html');
  res.end(mode === 'baseline' ? execFileSync('git',['show',`${baseline}:${file}`]) : await readFile(file));
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const browser = await chromium.launch();
try {
  const measurements=[];
  for (const [label,width,height] of [['desktop',1440,900],['mobile',390,844],['short',844,390],['narrow',320,800]]) for (const scale of [100,200]) for(const javaScriptEnabled of [true,false]) {
    const context=await browser.newContext({viewport:{width,height},javaScriptEnabled});
    const page=await context.newPage();
    await page.route('**/*',async route=>{
      if(route.request().resourceType()!=='document') return route.continue();
      const response=await route.fetch();
      await route.fulfill({response,body:(await response.text()).replace('</head>',`<style>html{font-size:${scale}%;scroll-behavior:auto}</style></head>`)});
    });
    await page.addInitScript(()=>{
      const native=requestAnimationFrame;window.__reviewFrames=0;
      window.requestAnimationFrame=callback=>native.call(window,time=>{window.__reviewFrames++;callback(time);});
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/#elsewhere`);
    await page.waitForTimeout(500);
    const name=`docs/review/f-018-${mode}-${label}-text${scale}-js${javaScriptEnabled}`;
    await page.screenshot({path:`${name}-viewport.png`});
    const dimensions=await page.locator('#elsewhere').evaluate(el=>{
      const rect = node => { const r=node.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; };
      return {height:el.getBoundingClientRect().height,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,localScrollWidth:el.scrollWidth,bands:[...el.querySelectorAll('.elsewhere-links a')].map(a=>{
        const range=document.createRange();range.selectNodeContents(a.firstElementChild);
        return {band:rect(a),label:rect(a.firstElementChild),text:[...range.getClientRects()].map(r=>({x:r.x,y:r.y,width:r.width,height:r.height})),arrow:rect(a.lastElementChild),scrollWidth:a.scrollWidth};
      })};
    });
    measurements.push({label,width,height,rootTextPercent:scale,javaScriptEnabled,...dimensions});
    // A document-coordinate crop avoids locator screenshots relocating the fixed
    // chapter index into the middle of a footer taller than the viewport.
    // Actual fixed-UI placement remains visible in viewport/focus captures.
    const scrollPosition = await page.evaluate(() => scrollY);
    const clip = await page.locator('#elsewhere').evaluate(el => {
      const r = el.getBoundingClientRect();
      return {x: r.x, y: r.y + scrollY, width: r.width, height: r.height};
    });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({path:`${name}-section.png`, fullPage: true, clip});
    await page.evaluate(y => scrollTo(0, y), scrollPosition);
    if(mode==='after') {
      await page.locator('.elsewhere-links a').first().focus();
      await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');
      for(const target of ['github','domain','top']) {
        await page.screenshot({path:`${name}-focus-${target}.png`});
        if(target!=='top') await page.keyboard.press('Tab');
      }
    }
    if(mode==='after' && label==='desktop'  && scale===100 && javaScriptEnabled) {
      const positions=[];
      for(const delta of [40,40,40,650,-450,-160,80]) {
        await page.mouse.wheel(0,delta);await page.waitForTimeout(180);
        positions.push({delta,y:await page.evaluate(()=>scrollY)});
      }
      for(const key of ['PageDown','PageUp','ArrowDown','ArrowUp','Tab']) {
        await page.keyboard.press(key);await page.waitForTimeout(250);
        positions.push({key,y:await page.evaluate(()=>scrollY)});
      }
      await page.waitForTimeout(1200);
      const before=await page.evaluate(()=>window.__reviewFrames);
      await page.waitForTimeout(600);
      const settledFrameDelta=await page.evaluate(before=>window.__reviewFrames-before,before);
      await writeFile('docs/review/f-018-scroll-evidence.json',JSON.stringify({positions,settledSampleMs:600,settledFrameDelta},null,2)+'\n');
    }
    await context.close();
  }
  await writeFile(`docs/review/f-018-${mode}-measurements.json`,JSON.stringify(measurements,null,2)+'\n');
} finally {await browser.close();server.close();}
