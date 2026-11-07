import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const out = path.join(root,'docs/review/f-026');
const hash = async file => createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
const port = await new Promise(resolve => { const server = createServer(); server.listen(0,'127.0.0.1',() => { const port = server.address().port; server.close(() => resolve(port)); }); });
const server = spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'});
let browser;
try {
  const url = `http://127.0.0.1:${port}`;
  for (let i=0;i<100;i++) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve,100)); }
  browser = await chromium.launch({headless:true});
  const cases = [
    {name:'desktop-introduction-middle',width:1440,height:900,chapter:'introduction'},
    {name:'desktop-work-middle',width:1440,height:900,chapter:'work'},
    {name:'desktop-end',width:1440,height:900,end:true},
    {name:'mobile-work-closed',width:390,height:844,chapter:'work'},
    {name:'mobile-work-open',width:390,height:844,chapter:'work',open:true},
    {name:'mobile-about-arrival',width:390,height:844,arrival:true},
    {name:'narrow-enlarged-nojs-open',width:320,height:800,nojs:true,enlarged:true,open:true},
    {name:'short-nojs-open',width:640,height:390,nojs:true,open:true},
  ];
  const captures = [];
  for (const item of cases) {
    const context = await browser.newContext({viewport:{width:item.width,height:item.height},javaScriptEnabled:!item.nojs});
    const page = await context.newPage();
    await page.goto(url,{waitUntil:'networkidle'});
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode().catch(()=>{}))); });
    if (item.enlarged) await page.evaluate(() => document.documentElement.style.fontSize='200%');
    await page.waitForTimeout(600);
    if (item.chapter || item.end) await page.evaluate(item => {
      const keys = ['introduction','work','outside','about','elsewhere'];
      const range = document.documentElement.scrollHeight-innerHeight;
      const starts = keys.map(key => { const el = document.getElementById(key); return Math.min(range,Math.max(0,el.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(el).scrollMarginBlockStart))); });
      const i = keys.indexOf(item.chapter);
      scrollTo(0,item.end ? range : (starts[i]+(starts[i+1]??range))/2);
    },item);
    if (item.arrival) { await page.locator('#mobile-chapters summary').click(); await page.locator('#mobile-chapters a[href="#about"]').click(); }
    if (item.open) {
      if (item.width <= 800) await page.locator('#mobile-chapters summary').click();
    }
    await page.waitForTimeout(600);
    const geometry = await page.evaluate(() => {
      const rect = el => { const r = el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; };
      return {scrollY,range:document.documentElement.scrollHeight-innerHeight,targets:[...document.querySelectorAll('#introduction,#work,#outside,#about,#elsewhere')].map(el=>({id:el.id,bounds:rect(el),clearance:getComputedStyle(el).scrollMarginBlockStart})),active:[...document.querySelectorAll('[aria-current]')].filter(el=>el.getClientRects().length).map(el=>el.getAttribute('href')),segments:[...document.querySelectorAll('[data-chapter-progress]')].filter(el=>el.getClientRects().length).map(el=>({key:el.dataset.chapterProgress,track:rect(el),fill:rect(el.querySelector('[data-chapter-fill]')),visibility:getComputedStyle(el).visibility}))};
    });
    const file = `${item.name}.png`; await page.screenshot({path:path.join(out,file)});
    captures.push({...item,file,sha256:await hash(`docs/review/f-026/${file}`),geometry}); await context.close();
  }
  async function files(dir) { const entries = await readdir(path.join(root,dir),{withFileTypes:true}); return (await Promise.all(entries.map(entry => entry.isDirectory()?files(`${dir}/${entry.name}`):`${dir}/${entry.name}`))).flat(); }
  const sources = ['index.html','src/main.js','src/styles.css','docs/review/f-026/capture.mjs'];
  const builds = await files('dist');
  const hashes = {}; for (const file of [...sources,...builds]) hashes[file]=await hash(file);
  await writeFile(path.join(out,'manifest.json'),JSON.stringify({rendering:'Vite preview serving built dist artifacts; run npm run build before this helper. No dev server or baseline synthesis.',environment:{node:process.version,platform:process.platform,browser:browser.version()},hashes,captures},null,2)+'\n');
} finally {
  await browser?.close(); server.kill('SIGTERM'); await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));
}
