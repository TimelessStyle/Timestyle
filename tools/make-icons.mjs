// Erzeugt PNG-Icons und das Social-Vorschaubild (og-image) aus dem Favicon. Nur bei Designänderung nötig.
// Aufruf: npm i -D playwright && node tools/make-icons.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
const svg = fs.readFileSync('src/static/favicon.svg', 'utf8');
const b = await chromium.launch(); const ctx = await b.newContext();
const shot = async (html, w, h, out) => { const p = await ctx.newPage({ viewport: { width: w, height: h } }); await p.setContent(html); await p.screenshot({ path: out, omitBackground: false }); await p.close(); };
const icon = (s) => `<body style="margin:0;background:#0a0a0c">${svg.replace('<svg ', `<svg width="${s}" height="${s}" `)}</body>`;
await shot(icon(180), 180, 180, 'src/static/apple-touch-icon.png');
await shot(icon(192), 192, 192, 'src/static/icon-192.png');
await shot(icon(512), 512, 512, 'src/static/icon-512.png');
const og = `<body style="margin:0;width:1200px;height:630px;background:#0a0a0c;font-family:-apple-system,'Segoe UI',Inter,Arial,sans-serif;position:relative;overflow:hidden;color:#f5f5f7">
<div style="position:absolute;left:-200px;top:-260px;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,#e3b152,transparent 68%);filter:blur(60px);opacity:.6"></div>
<div style="position:absolute;right:-180px;top:-60px;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle,#8d6bd6,transparent 68%);filter:blur(60px);opacity:.38"></div>
<div style="position:absolute;right:240px;bottom:-300px;width:640px;height:640px;border-radius:50%;background:radial-gradient(circle,#d6694f,transparent 68%);filter:blur(60px);opacity:.4"></div>
<div style="position:absolute;left:80px;top:90px;display:flex;align-items:center;gap:22px"><div style="width:84px;height:84px">${svg.replace('<svg ', '<svg width="84" height="84" ')}</div><div style="font-size:40px;font-weight:700;letter-spacing:-.01em">Timestyle_Gravur</div></div>
<div style="position:absolute;left:80px;bottom:110px;font-size:104px;line-height:1.02;font-weight:800;letter-spacing:-.035em">Präzision trifft<br><span style="background:linear-gradient(120deg,#f8e9b8,#e3c071 35%,#b98a35 60%,#f1d78e);-webkit-background-clip:text;color:transparent">Kreativität</span></div>
<div style="position:absolute;left:84px;bottom:50px;font-size:28px;color:#a8a8ae;letter-spacing:.02em">3D-Druck · Laserschnitt · Lasergravur</div></body>`;
await shot(og, 1200, 630, 'src/assets/img/og-image.png');
await b.close();
