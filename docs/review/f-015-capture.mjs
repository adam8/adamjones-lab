// Local evidence only. Run: node docs/review/f-015-capture.mjs
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { chromium } from '@playwright/test';

const baseline = '9ec3411872ade8cffb0fc88726ae6482c9868700';
let mode = 'baseline';
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const file = ({ '/': 'index.html', '/src/main.js': 'src/main.js', '/src/styles.css': 'src/styles.css', '/favicon.svg': 'public/favicon.svg' })[path];
  if (!file) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/html');
  res.end(mode === 'baseline' ? execFileSync('git', ['show', `${baseline}:${file}`]) : await readFile(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({headless:true});
const origin = `http://127.0.0.1:${server.address().port}`;
const results = {};
try {
  for (mode of ['baseline', 'after']) {
    for (const [label, width, height, scale] of [
      ['agent',1440,900,100], ['enlarged',1440,900,200],
      ['boundary',961,641,100], ['tablet',768,1024,100],
      ['mobile',390,844,100], ['short',844,390,100],
      ['mobile-enlarged',390,844,200], ['narrow-enlarged',320,800,200],
    ]) {
      const page = await browser.newPage({viewport:{width,height}});
      await page.route('**/', async route => {
        const response = await route.fetch();
        await route.fulfill({response, body:(await response.text()).replace('</head>', `<style>html{font-size:${scale}%;scroll-behavior:auto}</style></head>`)});
      });
      await page.goto(`${origin}/#project-agents`);
      await page.waitForTimeout(400);
      const shot = suffix => page.screenshot({path:`docs/review/f-015-${mode}-${suffix}.png`});
      await shot(label);
      if (label === 'enlarged') {
        results[mode] = await page.locator('#project-agents').evaluate(el => ({
          staged: getComputedStyle(el.closest('.project-stage')).position === 'sticky',
          panelHeight: el.getBoundingClientRect().height,
          copyHeight: el.querySelector('.project-copy').getBoundingClientRect().height,
          copyContained: el.querySelector('.project-copy').getBoundingClientRect().bottom <= el.getBoundingClientRect().bottom,
        }));
        await page.locator('#project-agents .project-permalink').focus();
        await shot('enlarged-focus');
        for (const [suffix, selector] of [['middle','.project-copy > p:not(.label)'], ['end','.project-object']]) {
          await page.locator(`#project-agents ${selector}`).evaluate(el => el.scrollIntoView({block:'end',behavior:'instant'}));
          await page.waitForTimeout(200);
          await shot(`enlarged-${suffix}`);
        }
        if (mode === 'after') {
          await page.goto(`${origin}/#project-agents`);
          await page.waitForTimeout(300);
          const client = await page.context().newCDPSession(page);
          await client.send('Tracing.start', {categories:'devtools.timeline', transferMode:'ReturnAsStream'});
          const startY = await page.evaluate(() => scrollY);
          const deltas = [80,80,700,-450,-150,100];
          await page.mouse.move(1000,600);
          for (const delta of deltas) { await page.mouse.wheel(0,delta); await page.waitForTimeout(140); }
          const endY = await page.evaluate(() => scrollY);
          const complete = new Promise(resolve => client.once('Tracing.tracingComplete', resolve));
          await client.send('Tracing.end');
          const {stream} = await complete;
          let trace = '';
          while (true) { const chunk = await client.send('IO.read',{handle:stream}); trace += chunk.data; if(chunk.eof) break; }
          await client.send('IO.close',{handle:stream});
          await writeFile('docs/review/f-015-scroll-trace.json.gz',gzipSync(trace));
          const frames = JSON.parse(trace).traceEvents.filter(e => e.name === 'FireAnimationFrame' && e.ph === 'X');
          await writeFile('docs/review/f-015-trace-summary.json',JSON.stringify({wheelDeltas:deltas,startY,endY,animationFrameCallbacks:frames.length,maxCallbackMs:Math.max(0,...frames.map(e=>e.dur/1000))},null,2)+'\n');
        }
      }
      await page.close();
    }
  }
  await writeFile('docs/review/f-015-fit-evidence.json', JSON.stringify(results,null,2)+'\n');
  if (results.baseline.copyContained || !results.after.copyContained || results.after.staged) throw Error('Expected baseline overflow and after document flow');
} finally { await browser.close(); server.close(); }
