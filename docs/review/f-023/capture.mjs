// Supplementary source captures only; run from repository root after npm run build.
import { chromium, expect } from '@playwright/test';
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const directory = 'docs/review/f-023';
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const sources = ['index.html', 'src/main.js', 'src/styles.css'];
const sourceHashes = Object.fromEntries(sources.map(path => [path, hash(path)]));
const url = 'http://127.0.0.1:4187';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4187', '--strictPort'], { stdio: 'inherit' });
let browser;
const records = [];
try {
  for (let i = 0; ; i++) {
    if (server.exitCode !== null) throw new Error('Preview exited');
    try { if ((await fetch(url)).ok) break; } catch {}
    if (i === 100) throw new Error('Preview timeout');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch();
  async function capture(page, file, settings) {
    await page.screenshot({ path: `${directory}/${file}`, fullPage: false });
    records.push({ file, ...settings, sha256: hash(`${directory}/${file}`), ...await page.evaluate(() => {
      const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
      return { url: location.href, scrollY, rootFont: getComputedStyle(document.documentElement).fontSize,
        open: document.querySelector('#mobile-chapters').open,
        headerPosition: getComputedStyle(document.querySelector('.site-header')).position,
        header: rect(document.querySelector('.site-header')),
        focus: document.activeElement.outerHTML.slice(0, 400) };
    }) });
  }
  const viewport = { width: 390, height: 844 };
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(url); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(700);
  const menu = page.locator('#mobile-chapters');
  const summary = menu.locator(':scope > summary');
  const settings = { viewport, javaScriptEnabled: true, rootPercent: 100 };
  await expect(summary).toBeVisible(); await expect(menu).not.toHaveAttribute('open');
  await capture(page, '390-closed.png', settings);
  await summary.click(); await expect(menu).toHaveAttribute('open', '');
  await capture(page, '390-open.png', settings);
  await menu.locator('a[href="#about"]').click();
  await expect(page).toHaveURL(/#about$/); await expect(menu).not.toHaveAttribute('open');
  await page.waitForTimeout(700);
  await expect(page.locator('#about-title')).toBeInViewport();
  const title = await page.locator('#about-title').boundingBox();
  const row = await summary.boundingBox();
  if (title.y < row.y + row.height) throw new Error('About heading obscured');
  await capture(page, '390-about-arrival.png', settings);
  await summary.click(); await page.keyboard.press('Tab');
  const first = menu.locator('a[href="#introduction"]');
  await expect(first).toBeFocused(); await expect(first).toBeInViewport();
  await expect(page.locator('.site-header')).toHaveCSS('position', 'sticky');
  await capture(page, '390-midpage-keyboard.png', settings);
  await context.close();
  for (const [width, height, rootPercent, prefix] of [[320, 800, 200, '320-enlarged-nojs'], [640, 390, 100, '640-short-nojs']]) {
    const viewport = { width, height };
    const context = await browser.newContext({ viewport, javaScriptEnabled: false });
    const page = await context.newPage(); await page.goto(url);
    if (rootPercent !== 100) await page.evaluate(percent => { document.documentElement.style.fontSize = `${percent}%`; }, rootPercent);
    await page.evaluate(() => document.fonts.ready);
    const summary = page.locator('#mobile-chapters > summary');
    await expect(summary).toBeVisible();
    await expect(page.locator('.site-header')).toHaveCSS('position', 'relative');
    const settings = { viewport, javaScriptEnabled: false, rootPercent };
    await capture(page, `${prefix}-closed.png`, settings);
    await summary.click();
    await expect(page.locator('#mobile-chapters')).toHaveAttribute('open', '');
    await expect(page.locator('#mobile-chapters a[href="#elsewhere"]')).toBeInViewport();
    await capture(page, `${prefix}-open.png`, settings);
    await context.close();
  }
  for (const path of sources) if (hash(path) !== sourceHashes[path]) throw new Error('Source changed during capture');
  const assets = ['dist/index.html', ...readdirSync('dist/assets').map(file => `dist/assets/${file}`)];
  writeFileSync(`${directory}/source-sha256.txt`, sources.map(path => `${sourceHashes[path]}  ${path}\n`).join(''));
  writeFileSync(`${directory}/capture-manifest.json`, JSON.stringify({ capturedAt: new Date().toISOString(), sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), browser: browser.version(), sourceHashes, builtAssetHashes: Object.fromEntries(assets.map(path => [path, hash(path)])), records, provenance: 'Supplementary local source captures; no independent review verdict. Baseline disclosure states unavailable.' }, null, 2) + '\n');
  console.log(`Captured and checked ${records.length} exact-source states.`);
} finally { await browser?.close(); server.kill(); }
