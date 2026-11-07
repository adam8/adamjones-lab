import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';

const baseDir = dirname(fileURLToPath(import.meta.url));
const baseURL = process.env.BASE_URL || 'http://localhost:4173';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

async function capture(name, viewport, scrollBy = 0) {
  await page.setViewportSize(viewport);
  await page.goto(`${baseURL}/#work`);
  await page.waitForTimeout(600);
  if (scrollBy) await page.evaluate(y => scrollTo(0, y), scrollBy);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(baseDir, `${name}.png`) });
}

await capture('desktop-index-current', { width: 1440, height: 900 }, 0);
await capture('mobile-current', { width: 390, height: 844 }, 0);

const manifest = [
  { file: 'desktop-index-current.png', viewport: '1440x900', scenario: 'Desktop chapter index without left border indicator' },
  { file: 'mobile-current.png', viewport: '390x844', scenario: 'Mobile chapter list without left border indicator' },
];
writeFileSync(join(baseDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

await context.close();
await browser.close();
console.log('F-027 captures complete.');
