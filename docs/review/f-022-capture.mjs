// Local review evidence only. Run from root: node docs/review/f-022-capture.mjs
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { measure } from './f-021-capture.mjs';
const dir='docs/review/f-022-captures';
await mkdir(dir); // Refuse to overwrite an earlier review.
const server=await createServer({server:{host:'127.0.0.1',port:0}}); await server.listen();
const browser=await chromium.launch();
const results={browser:browser.version(),sourceHashes:{},cases:[]};
for(const path of ['src/styles.css','src/about-typesetter.js','index.html']) results.sourceHashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
try {
  for(const [name,width,height,scale,js,baseline=false] of [
    ['mobile-375',375,844,100,true],['mobile-390',390,844,100,true],['mobile-414',414,896,100,true],
    ['narrow',320,844,100,true],['enlarged-nojs',320,844,200,false],['short',390,640,100,true],
    ['desktop',1440,900,100,true],['desktop-accepted',1440,900,100,true,true],
    ['heading-enlarged',1101,900,200,true],['heading-enlarged-accepted',1101,900,200,true,true],
  ]) {
    const context=await browser.newContext({viewport:{width,height},javaScriptEnabled:js});
    const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',async route=>{
      const path=new URL(route.request().url()).pathname;
      if(baseline && ['/src/styles.css','/src/about-typesetter.js'].includes(path)) {
        let body=execFileSync('git',['show',`725f3221194346581151b0688f2306b464d98bb2:${path.slice(1)}`],{encoding:'utf8'});
        if(path.endsWith('.js')) {
          // Use Vite's resolved dependency URL, not a browser-invalid bare import.
          const transformed=await (await route.fetch()).text();
          const dependency=transformed.match(/import\("([^"\n]*pretext[^"\n]*)"\)/);
          if(!dependency) throw Error('Pretext dependency URL not found');
          body=body.replace("'@chenglou/pretext'",JSON.stringify(dependency[1]));
        }
        return route.fulfill({contentType:path.endsWith('.css')?'text/css':'text/javascript',body});
      }
      if(route.request().resourceType()==='document') {
        const response=await route.fetch();return route.fulfill({response,body:(await response.text()).replace('</head>',`<style>html{font-size:${scale}%;scroll-behavior:auto}</style></head>`)});
      }
      return route.continue();
    });
    await page.goto(`${server.resolvedUrls.local[0]}#about`); await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(500);
    results.cases.push({name,errors,...await measure(page)});
    await page.screenshot({path:`${dir}/${name}-entry.png`});
    await page.locator('#about').screenshot({path:`${dir}/${name}-full.png`,style:'.chapter-index,.reading-progress{visibility:hidden!important}'});
    await context.close();
  }
  await writeFile(`${dir}/measurements.json`,JSON.stringify(results,null,2)+'\n');
} finally {await browser.close(); await server.close();}
