// Run from repository root, once per corresponding source state. Never overwrites evidence.
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const matrix = [
  ['desktop',1440,900,100,true], ['enlarged-desktop',1440,900,200,true],
  ['mobile',390,844,100,true], ['short-nojs',844,390,100,false],
  ['short-enlarged-nojs',844,390,200,false], ['narrow-enlarged-nojs',320,800,200,false],
  ['boundary-640',1440,640,100,true], ['boundary-641',1440,641,100,true],
];

export async function measure(page) {
  return page.evaluate(() => {
    const section = document.querySelector('#about');
    const box = el => { const r = el.getBoundingClientRect(); return { x:r.x, y:r.y + scrollY, width:r.width, height:r.height }; };
    const typography = el => { const s = getComputedStyle(el); return Object.fromEntries(['fontFamily','fontSize','fontWeight','fontStyle','letterSpacing','lineHeight','paddingTop','paddingBottom','marginTop','marginLeft'].map(k => [k,s[k]])); };
    const title = document.querySelector('#about-title');
    const canvas = document.createElement('canvas').getContext('2d');
    const glyphs = [];
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode, s = getComputedStyle(node.parentElement);
      canvas.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      for (let i=0; i<node.length; i++) {
        const range = document.createRange(); range.setStart(node,i); range.setEnd(node,i+1);
        const rects = [...range.getClientRects()].map(r => ({x:r.x,y:r.y+scrollY,width:r.width,height:r.height}));
        const m = canvas.measureText(node.data[i]);
        glyphs.push({text:node.data[i],rects, inkMetrics:{left:m.actualBoundingBoxLeft,right:m.actualBoundingBoxRight,ascent:m.actualBoundingBoxAscent,descent:m.actualBoundingBoxDescent}});
      }
    }
    const lines = [...new Set(glyphs.flatMap(g => g.rects.map(r => r.y)))].sort((a,b)=>a-b);
    const terms = [...section.querySelectorAll('dt,dd')].map(el => ({tag:el.tagName,text:el.textContent,box:box(el),typography:typography(el)}));
    const location = terms.slice(0,2).map(t => ({...t,additionalScrollToAppear:Math.max(0,t.box.y-scrollY-innerHeight)}));
    // Inspect without ancestor clipping; report rather than conceal overflow.
    const overflow = [];
    for (const el of section.querySelectorAll('h2,dt,dd')) {
      const range = document.createRange(); range.selectNodeContents(el);
      if ([...range.getClientRects()].some(r => r.left < -1 || r.right > innerWidth+1)) overflow.push(el.textContent);
    }
    const fields = [...section.querySelectorAll('dl > div')];
    const overlap = fields.some((el,i) => fields.slice(i+1).some(other => {
      const a=el.getBoundingClientRect(), b=other.getBoundingClientRect();
      return Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
    }));
    return {entryScrollY:scrollY, viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},rootFont:getComputedStyle(document.documentElement).fontSize,
      layout:section.dataset.layout || 'css',section:box(section),masthead:box(section.querySelector('.about-masthead') || section.querySelector('header')),
      title:{box:box(title),parts:[...title.children].filter(el=>el.tagName!=='BR').map(el=>({text:el.textContent,typography:typography(el),box:box(el)})),lines,glyphs},
      location,terms,overflow,factOverlap:overlap,sectionScrollWidth:section.scrollWidth};
  });
}

async function capture(phase) {
  if (!['accepted','transferred','after','after-amended'].includes(phase)) throw Error('Use accepted, transferred, after, or after-amended');
  const dir = `docs/review/f-021-${phase}`;
  try { await access(dir); throw Error(`Evidence exists: ${dir}`); } catch(e) { if(e.code !== 'ENOENT') throw e; }
  await mkdir(dir);
  const sources = ['index.html','src/styles.css','src/main.js','src/about-typesetter.js','package-lock.json','wrangler.jsonc'];
  const hashes = {};
  for (const path of sources) { try { hashes[path]=createHash('sha256').update(await readFile(path)).digest('hex'); } catch { hashes[path]=null; } }
  const server = await createServer({server:{host:'127.0.0.1',port:0}}); await server.listen();
  const url = server.resolvedUrls.local[0];
  const browser = await chromium.launch();
  const results = {phase,revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),hashes,browser:browser.version(),platform:process.platform,inkNote:'Canvas actualBoundingBox metrics per glyph plus DOM range bounds; not raster ink segmentation.',cases:[]};
  try {
    const cases = phase==='after-amended' ? [...matrix,
      ['boundary-wrap',1101,900,200,true], ['normal-grid',1280,900,100,true]] : matrix;
    for (const [name,width,height,scale,js] of cases) {
      const context = await browser.newContext({viewport:{width,height},deviceScaleFactor:1,javaScriptEnabled:js});
      const page = await context.newPage(); const errors=[],missing=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
      page.on('response',r=>{if(r.status()>=400) missing.push(`${r.status()} ${r.url()}`);});
      page.on('requestfailed',r=>missing.push(`${r.failure()?.errorText} ${r.url()}`));
      await page.route('**/*',async route=>{
        if(route.request().resourceType()==='document') {
          const response=await route.fetch();
          return route.fulfill({response,body:(await response.text()).replace('</head>',`<style>html{font-size:${scale}%;scroll-behavior:auto}</style></head>`)});
        }
        return route.continue();
      });
      await page.goto(`${url}#about`);
      await page.evaluate(()=>document.fonts.ready);
      if(js && phase!=='accepted') await page.waitForFunction(()=>!!document.querySelector('#about').dataset.layout);
      await page.waitForTimeout(900);
      const metrics = await measure(page);
      await page.screenshot({path:`${dir}/${name}-entry.png`});
      await page.locator('#about').screenshot({path:`${dir}/${name}-section.png`});
      await page.locator('#about dd').last().scrollIntoViewIfNeeded();
      metrics.lastFactReachable = await page.locator('#about dd').last().evaluate(el=>{const r=el.getBoundingClientRect();return r.bottom>0 && r.top<innerHeight;});
      results.cases.push({name,width,height,scale,js,...metrics,errors,missing});
      await context.close();
    }
    await writeFile(`${dir}/measurements.json`,JSON.stringify(results,null,2)+'\n');
  } finally {await browser.close(); await server.close();}
}
if(process.argv[1]===fileURLToPath(import.meta.url)) await capture(process.argv[2]);
