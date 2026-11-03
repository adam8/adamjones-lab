// Local matched evidence: node docs/review/f-016-capture.mjs [baseline|after]
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { chromium } from '@playwright/test';
const baseline = 'cbf6cda37f1a05d9a3252e816c3a6d608fd2e93c';
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
  for (const [label,width,height,scale] of [['desktop',1440,900,100],['mobile',390,844,100],['narrow',320,800,100],['short',844,390,100],['enlarged',1440,900,200]]) {
    const page = await browser.newPage({viewport:{width,height}});
    await page.route('**/', async route => {
      const response = await route.fetch();
      await route.fulfill({response,body:(await response.text()).replace('</head>',`<style>html{font-size:${scale}%;scroll-behavior:auto}</style></head>`)});
    });
    await page.addInitScript(() => {
      const native = window.requestAnimationFrame;
      window.__reviewFrames = 0;
      window.requestAnimationFrame = callback => native.call(window, time => { window.__reviewFrames++; callback(time); });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/#outside`);
    await page.waitForTimeout(500);
    await page.screenshot({path:`docs/review/f-016-${mode}-${label}-viewport.png`});
    const clip = await page.locator('#outside').evaluate(el => { const r=el.getBoundingClientRect(); return {x:0,y:r.top+scrollY,width:innerWidth,height:r.height+500}; });
    await page.evaluate(()=>scrollTo({top:0,behavior:"instant"}));
    await page.waitForTimeout(200);
    await page.screenshot({path:`docs/review/f-016-${mode}-${label}.png`,fullPage:true,clip});
    await page.locator("#outside").evaluate(el=>el.scrollIntoView({behavior:"instant"}));
    if (mode === 'after' && label === 'desktop') {
      const client = await page.context().newCDPSession(page);
      await client.send('Tracing.start',{categories:'devtools.timeline',transferMode:'ReturnAsStream'});
      const positions = [];
      for (const delta of [40,40,40,650,-450,-160,80]) {
        await page.mouse.wheel(0,delta); await page.waitForTimeout(180);
        positions.push({delta,y:await page.evaluate(()=>scrollY)});
      }
      for (const key of ['PageDown','PageUp','ArrowDown','ArrowUp']) {
        await page.keyboard.press(key); await page.waitForTimeout(250);
        positions.push({key,y:await page.evaluate(()=>scrollY)});
      }
      await page.waitForTimeout(1200);
      const beforeIdle = await page.evaluate(()=>window.__reviewFrames);
      await page.waitForTimeout(600);
      const settledFrameDelta = await page.evaluate(before=>window.__reviewFrames-before,beforeIdle);
      const complete = new Promise(resolve=>client.once('Tracing.tracingComplete',resolve));
      await client.send('Tracing.end');
      const {stream}=await complete;
      let trace='';
      while(true) {const chunk=await client.send('IO.read',{handle:stream}); trace+=chunk.data; if(chunk.eof) break;}
      await client.send('IO.close',{handle:stream});
      await writeFile('docs/review/f-016-scroll-trace.json.gz',gzipSync(trace));
      const events=JSON.parse(trace).traceEvents;
      const frames=events.filter(e=>e.name==='FireAnimationFrame' && e.ph==='X');
      await writeFile('docs/review/f-016-scroll-evidence.json',JSON.stringify({positions,animationFrameCallbacks:frames.length,maxCallbackMs:Math.max(0,...frames.map(e=>e.dur/1000)),settledSampleMs:600,settledFrameDelta},null,2)+'\n');
    }
    await page.close();
  }
} finally {await browser.close();server.close();}
