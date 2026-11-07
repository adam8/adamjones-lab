// Supplementary candidate-only evidence, not the independent canonical comparison.
// Start npm run dev -- --host 127.0.0.1, then run:
// node docs/review/f-024-webp/capture.mjs [http://127.0.0.1:5173]
import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const out = fileURLToPath(new URL('./',import.meta.url));
const base = process.argv[2] || 'http://127.0.0.1:5173';
const hash = async path => createHash('sha256').update(await readFile(path)).digest('hex');
const browser = await chromium.launch();
const conditions = [
  ['desktop',1440,900,100,true], ['mobile',390,844,100,true],
  ['narrow-enlarged-nojs',320,800,200,false], ['short-nojs',844,390,100,false],
];
const manifest = { created:new Date().toISOString(), browser:browser.version(), base,
  entry:'direct /#project-agents; root percentage injected into HTML response before load',
  status:'Supplementary candidate only; no accepted-side or canonical review claim', files:{}, conditions:[] };
for (const path of ['index.html','src/styles.css','src/main.js','tests/agent-paper-loop.spec.js', 'src/assets/agent-paper-loop.webp']) manifest.files[path]=await hash(path);
async function buildHashes(dir) {
  for (const e of await readdir(dir,{withFileTypes:true})) {
    const p=`${dir}/${e.name}`; if(e.isDirectory()) await buildHashes(p); else manifest.files[p]=await hash(p);
  }
}
await buildHashes('dist');
await mkdir(out,{recursive:true});
for (const [name,width,height,scale,js] of conditions) {
  const context=await browser.newContext({viewport:{width,height},javaScriptEnabled:js});
  const page=await context.newPage();
  await page.route('**/',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace('</head>',`<style>html {font-size:${scale}%}</style></head>`)});
  });
  await page.goto(`${base}/#project-agents`);
  await page.locator('.agent-object').evaluate(el=>el.decode());
  await page.waitForTimeout(850);
  const geometry = await page.evaluate(()=>{
    const panel=document.querySelector('#project-agents');
    const img=panel.querySelector('.agent-object');
    return {artifactKind:'raster',imageInfo:{src:img.currentSrc,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,width:img.width,height:img.height,complete:img.complete},scrollY,hash:location.hash,historyLength:history.length,focus:document.activeElement.tagName,
      selected:[...document.querySelectorAll('[data-project-button]')].map(el=>el.getAttribute('aria-pressed')),
      classes:document.documentElement.className,root:getComputedStyle(document.documentElement).fontSize,
      boxes:Object.fromEntries(['.project-copy','.agent-object','figcaption'].map(s=>[s,panel.querySelector(s).getBoundingClientRect().toJSON()])),panel:panel.getBoundingClientRect().toJSON(),scrollWidth:document.documentElement.scrollWidth};
  });
  const images=[];
  for (const kind of ['direct','panel']) {
    const path=`${out}${name}-${kind}.png`;
    if(kind==='direct') await page.screenshot({path});
    else {
      // Warm Chromium's offscreen raster paint before the tall panel capture.
      await page.locator('#project-agents .agent-object').scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      await page.locator('#project-agents').screenshot({path});
    }
    images.push({file:`${name}-${kind}.png`,sha256:await hash(path)});
  }
  manifest.conditions.push({name,width,height,rootPercent:scale,javaScript:js,geometry,images});
  await context.close();
}
await browser.close();
manifest.files['docs/review/f-024-webp/capture.mjs']=await hash('docs/review/f-024-webp/capture.mjs');
await writeFile(`${out}manifest.json`,JSON.stringify(manifest,null,2)+'\n');
console.log(`Captured ${manifest.conditions.length} candidate conditions with direct and complete-panel images.`);
