// Supplementary candidate-only evidence, not the independent canonical comparison.
// Start npm run dev -- --host 127.0.0.1, then run:
// node docs/review/f-025/capture.mjs [http://127.0.0.1:5173]
import { inspectInterface } from '../../../tests/interface-study-geometry.js';
import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const out = fileURLToPath(new URL('./',import.meta.url));
const base = process.argv[2] || 'http://127.0.0.1:5173';
const hash = async path => createHash('sha256').update(await readFile(path)).digest('hex');
const referenceRoot = process.argv[3]; // Optional provenance refresh from an explicit reference directory.
const pinnedReferences = {"interface-figure.html": "1fa81e41a8f741b1ff5aa8ad11bf7f663eac35dba5f425f383e5fc9f671414e2", "interface-study.css": "9a5a32d567251b7e23253d7d13cfaddf5235e6076c26359945eea30944fd35cd"};
const browser = await chromium.launch();
const conditions = [
 ['desktop',1440,900,100,true],['mobile',390,844,100,true],
 ['narrow-enlarged-nojs',320,800,200,false],['short-nojs',844,390,100,false],
];
const manifest = { created:new Date().toISOString(), browser:browser.version(), environment:{node:process.version,platform:process.platform,browserCache:process.env.PLAYWRIGHT_BROWSERS_PATH}, base,
  entry:'direct /#project-interface; root percentage injected into HTML response before load',
  status:'Supplementary candidate only; no accepted-side or canonical review claim', files:{}, conditions:[] };
for (const path of ['index.html','src/styles.css','src/main.js','tests/interface-study.spec.js','tests/interface-study-geometry.js']) manifest.files[path]=await hash(path);
manifest.referenceProvenance = { historical:true, sha256:pinnedReferences };
if(referenceRoot) for(const [name,expected] of Object.entries(pinnedReferences)) {
  const actual=await hash(`${referenceRoot}/${name}`);
  if(actual!==expected) throw new Error(`Reference hash mismatch: ${name}`);
}
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
  await page.goto(`${base}/#project-interface`);
  await page.waitForTimeout(850);
  await page.evaluate(async()=>{await document.fonts.ready; await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));});
  const geometry = await page.evaluate(inspectInterface);
  const images=[];
  for (const kind of ['direct','panel']) {
    const path=`${out}${name}-${kind}.png`;
    if(kind==='direct') await page.screenshot({path});
    else await page.locator('#project-interface').screenshot({path});
    images.push({file:`${name}-${kind}.png`,sha256:await hash(path)});
  }
  manifest.conditions.push({name,width,height,rootPercent:scale,javaScript:js,geometry,images});
  await context.close();
}
await browser.close();
manifest.files['docs/review/f-025/capture.mjs']=await hash('docs/review/f-025/capture.mjs');
await writeFile(`${out}manifest.json`,JSON.stringify(manifest,null,2)+'\n');
console.log(`Captured ${manifest.conditions.length} candidate conditions with direct and complete-panel images.`);
