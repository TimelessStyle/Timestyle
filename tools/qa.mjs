// Sichtprüfung: Screenshots + Konsolenfehler + kaputte Anfragen. Aufruf: node tools/qa.mjs [outdir]
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const DIST = path.resolve('dist'); const OUT = path.resolve(process.argv[2] || '/tmp/shots'); fs.mkdirSync(OUT, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); let f = path.join(DIST, p); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404, { 'content-type': 'text/html' }); return r.end(fs.readFileSync(path.join(DIST, '404.html'))); } r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(4173);
const b = await chromium.launch(); const errs = [];
const pages = ['/', '/leistungen-preise/', '/shop/', '/ueber-uns/', '/kundenstimmen/', '/kontakt/', '/anfrage/', '/impressum/', '/datenschutz/', '/nichtda/'];
for (const [name, vp, mobile] of [['d', { width: 1440, height: 900 }, false], ['m', { width: 390, height: 844 }, true]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  for (const u of pages) {
    const pg = await ctx.newPage();
    pg.on('console', (m) => { if (m.type() === 'error') errs.push(`${name} ${u}: console ${m.text()}`); });
    pg.on('pageerror', (e) => errs.push(`${name} ${u}: pageerror ${e.message}`));
    pg.on('requestfailed', (r) => errs.push(`${name} ${u}: failed ${r.url()}`));
    pg.on('response', (r) => { if (r.status() >= 400 && !u.includes('nichtda')) errs.push(`${name} ${u}: HTTP ${r.status()} ${r.url()}`); });
    await pg.goto('http://localhost:4173' + u, { waitUntil: 'networkidle' });
    if (name === 'd' && u === '/') await pg.screenshot({ path: `${OUT}/home-hero-${name}.png` });
    const h = await pg.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 500) { await pg.evaluate((yy) => window.scrollTo(0, yy), y); await pg.waitForTimeout(90); }
    await pg.evaluate(() => window.scrollTo(0, 0)); await pg.waitForTimeout(500);
    const ow = await pg.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (ow) errs.push(`${name} ${u}: horizontaler Überlauf`);
    await pg.screenshot({ path: `${OUT}/${(u.replace(/\//g, '_') || '_')}-${name}.png`, fullPage: true });
    await pg.close();
  }
  await ctx.close();
}
// Funktionstest Shop + Anfrage
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const pg = await ctx.newPage();
pg.on('pageerror', (e) => errs.push('func pageerror ' + e.message));
await pg.goto('http://localhost:4173/shop/', { waitUntil: 'networkidle' });
await pg.fill('#shop-search', 'vase'); const vis = await pg.$$eval('.pcard:not([hidden])', (e) => e.length);
await pg.fill('#shop-search', ''); await pg.click('.filters button[data-cat="schmuck"]'); const vis2 = await pg.$$eval('.pcard:not([hidden])', (e) => e.length);
await pg.click('.filters button[data-cat="alle"]');
await pg.click('.pcard:not([hidden]) .add'); await pg.click('.pcard:not([hidden]) >> nth=3 >> .add');
const badge = await pg.textContent('[data-cart-count]');
await pg.goto('http://localhost:4173/anfrage/', { waitUntil: 'networkidle' });
const items = await pg.$$eval('.cart-item', (e) => e.length);
await pg.click('[data-act="inc"] >> nth=0'); await pg.fill('#f-name', 'Test'); await pg.fill('#f-mail', 'a@b.at');
await pg.screenshot({ path: `${OUT}/anfrage-filled.png`, fullPage: true });
console.log(JSON.stringify({ suche_vase: vis, filter_schmuck: vis2, badge, cartItems: items }));
await b.close(); srv.close();
console.log(errs.length ? 'PROBLEME:\n' + [...new Set(errs)].join('\n') : 'Keine Konsolenfehler, keine 404/Failed-Requests, kein Überlauf.');
