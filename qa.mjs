// Funktionstest Laser-Animation, Karussell, Warenkorb, Formulare. Aufruf: node tools/qa2.mjs [dist-Ordner] [Ausgabe]
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const DIST = path.resolve(process.argv[2] || 'dist'); const OUT = path.resolve(process.argv[3] || '/tmp/shots3'); fs.mkdirSync(OUT, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); let f = path.join(DIST, p); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404); return r.end('nf'); } r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(4174);
const b = await chromium.launch(); const errs = []; const res = {};
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const pg = await ctx.newPage();
pg.on('pageerror', (e) => errs.push('pageerror ' + e.message)); pg.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text()); });
// 1) Laser
await pg.goto('http://localhost:4174/', { waitUntil: 'networkidle' });
await pg.evaluate(() => window.scrollTo(0, 330)); await pg.waitForTimeout(100);
const t0 = Date.now();
for (const t of [900, 2200, 3600, 5200, 7000, 9500, 13500]) { await pg.waitForTimeout(Math.max(0, t - (Date.now() - t0))); await pg.screenshot({ path: `${OUT}/laser-${t}.png`, clip: { x: 200, y: 120, width: 1040, height: 700 } }); }
// 2) Karussell
await pg.evaluate(() => document.querySelector('.carousel').scrollIntoView({ block: 'center' })); await pg.waitForTimeout(600);
const before = await pg.$eval('.chips-scroll', (e) => e.scrollLeft);
await pg.click('.car-btn.next'); await pg.waitForTimeout(900);
const after = await pg.$eval('.chips-scroll', (e) => e.scrollLeft);
await pg.screenshot({ path: `${OUT}/carousel.png` });
for (let i = 0; i < 6; i++) { if (await pg.$eval('.car-btn.next', (e) => e.disabled)) break; await pg.click('.car-btn.next'); await pg.waitForTimeout(700); }
const lastVisible = await pg.evaluate(() => { const t = document.querySelector('.chips-scroll'), c = [...t.querySelectorAll('.cat-card')].pop(), r = c.getBoundingClientRect(), tr = t.getBoundingClientRect(); return r.right <= tr.right + 2; });
await pg.screenshot({ path: `${OUT}/carousel-end.png` });
res.carousel = { before, after, lastCardFullyVisibleAtEnd: lastVisible };
// 3) Shop + Warenkorb
await pg.goto('http://localhost:4174/shop/', { waitUntil: 'networkidle' });
await pg.click('.filters button[data-cat="ostern"]'); await pg.waitForTimeout(800);
await pg.selectOption('.pcard[data-name="Osterhasenversteck"] select.var', { label: 'Groß · 12,00 €' });
res.variantPrice = await pg.$eval('.pcard[data-name="Osterhasenversteck"] .pprice', (e) => e.textContent);
await pg.click('.pcard[data-name="Osterhasenversteck"] .add'); await pg.click('.pcard[data-name="Hasendeko"] .add'); await pg.click('.pcard[data-name="Hasendeko"] .add');
res.badge = await pg.textContent('[data-cart-count]');
await pg.screenshot({ path: `${OUT}/shop-ostern.png` });
await pg.goto('http://localhost:4174/warenkorb/', { waitUntil: 'networkidle' });
res.sumText = await pg.$eval('#cart-sum', (e) => e.innerText.replace(/\n+/g, ' | '));
res.shipOptions = await pg.$$eval('input[name="lieferart"]', (e) => e.map((x) => x.value));
await pg.fill('#o-vn', 'Max'); await pg.fill('#o-nn', 'Muster'); await pg.fill('#o-mail', 'max@example.at');
await pg.screenshot({ path: `${OUT}/warenkorb.png`, fullPage: true });
// Absenden mit gemocktem Formular-Dienst (nur wenn Endpoint konfiguriert)
const hasEndpoint = await pg.$eval('#cart-root', (e) => !!JSON.parse(e.dataset.conf).endpoint);
res.hasEndpoint = hasEndpoint;
if (hasEndpoint) {
  let posted = null;
  await pg.route('**/submit', async (route) => { posted = route.request().postData(); await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }); });
  await pg.fill('#o-str','Teststraße 1'); await pg.fill('#o-plz','3443'); await pg.fill('#o-ort','Sieghartskirchen'); await pg.check('input[name="agb"]'); await pg.check('input[name="widerruf"]');
  await pg.click('#order-btn'); await pg.waitForTimeout(800);
  res.orderDoneVisible = await pg.$eval('#order-done', (e) => !e.hidden); res.orderNo = await pg.textContent('#order-no');
  res.posted = posted ? posted.replace(/\r?\n/g, ' ⏎ ').slice(0, 700) : null;
  res.cartAfter = await pg.textContent('[data-cart-count]');
  await pg.screenshot({ path: `${OUT}/order-done.png` });
}
// 4) Kontaktformular
await pg.goto('http://localhost:4174/kontakt/#formular', { waitUntil: 'networkidle' }); await pg.waitForTimeout(900);
await pg.fill('#c-name', 'Test'); await pg.fill('#c-mail', 'a@b.at'); await pg.fill('#c-msg', 'Hallo, ich möchte ein Schild gravieren lassen.');
await pg.screenshot({ path: `${OUT}/kontakt-form.png`, fullPage: true });
if (hasEndpoint) { await pg.check('input[name="datenschutz"]'); await pg.click('#contact-form button[type="submit"]'); await pg.waitForTimeout(700); res.contactStatus = await pg.textContent('#contact-status'); }
console.log(JSON.stringify(res, null, 1));
console.log(errs.length ? 'FEHLER:\n' + [...new Set(errs)].join('\n') : 'Keine JS-Fehler.');
await b.close(); srv.close();
