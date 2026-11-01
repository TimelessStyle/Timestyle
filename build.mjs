#!/usr/bin/env node
/* Timestyle_Gravur – Static-Site-Build
   Aufruf:  node build.mjs        -> schreibt die fertige Seite nach ./dist
   Keine Abhängigkeiten, nur Node 18+. Inhalte stehen in ./data und site.config.json. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));
const preise = read('preise.json');
const stimmen = read('stimmen.json');
const produkte = read('produkte.json');

const warnings = [];
if (/BITTE|example/i.test(cfg.siteUrl)) warnings.push('siteUrl in site.config.json ist noch ein Platzhalter. Canonical, Sitemap und Social-Vorschau zeigen auf eine falsche Adresse, bis das ersetzt ist.');

/* ---------- Helfer ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (s) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const base = cfg.basePath || '';
const href = (p) => base + p;
const abs = (p) => cfg.siteUrl + base + p;
const exists = (p) => fs.existsSync(path.join(SRC, p));
const findImg = (dir, slug) => { for (const e of ['webp', 'avif', 'jpg', 'jpeg', 'png']) if (exists(`assets/img/${dir}/${slug}.${e}`)) return `/assets/img/${dir}/${slug}.${e}`; return null; };
const year = new Date().getFullYear();
const today = new Date().toISOString().slice(0, 10);
const addr = `${cfg.strasse}, ${cfg.plz} ${cfg.ort}`;
const OG = '/assets/img/og-image.png';

/* ---------- Icons ---------- */
const P = {
  cube: 'M12 2 3 7v10l9 5 9-5V7l-9-5zM3 7l9 5 9-5M12 12v10',
  laser: 'M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
  chat: 'M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-5.5A8 8 0 1 1 21 12z',
  sparkle: 'M12 3l2.4 5.6L20 9.3l-4.4 3.8L17 19l-5-3-5 3 1.4-5.9L4 9.3l5.6-.7z',
  lamp: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  toy: 'M4 4h16v16H4zM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01',
  egg: 'M12 3c3.5 0 6 5.5 6 10a6 6 0 0 1-12 0c0-4.5 2.5-10 6-10zM8 14c1.5 1 2.5-1 4 0s2.5 1 4 0',
  tree: 'M12 3l5 7h-3l4 6H6l4-6H7l5-7zM12 16v5',
  vase: 'M9 3h6M10 3v3c0 2-3 3-3 7a5 5 0 0 0 10 0c0-4-3-5-3-7V3',
  gem: 'M6 3h12l3 6-9 12L3 9l3-6zM3 9h18M9 3l3 6 3-6',
  ball: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  card: 'M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM7 10h6M7 14h4',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  heart: 'M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.5-4.5',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5h.01',
  fb: 'M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8z',
  ig: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM17.5 6.5h.01',
};
const icon = (n, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${P[n]}"/></svg>`;

/* ---------- Layout ---------- */
const NAV = [['/', 'Startseite'], ['/leistungen-preise/', 'Leistungen & Preise'], ['/shop/', 'Shop'], ['/ueber-uns/', 'Über uns'], ['/kundenstimmen/', 'Kundenstimmen'], ['/kontakt/', 'Kontakt']];
const logoFile = ['svg', 'png', 'webp'].map((e) => `assets/img/logo.${e}`).find(exists);
const mark = logoFile
  ? `<img src="${href('/' + logoFile)}" width="26" height="26" alt="Timestyle_Gravur Logo">`
  : `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="#d9b35f"/><rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="none" stroke="#fff3c4" stroke-opacity=".7"/><path d="M9.5 10.5h13M16 10.5v12" stroke="#2a1d06" stroke-width="3" stroke-linecap="round"/></svg>`;

function head({ title, desc, p, noindex, ld }) {
  const canon = abs(p);
  return `<!DOCTYPE html>
<html lang="de-AT" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
<link rel="canonical" href="${canon}">
<meta name="theme-color" content="#0a0a0c">
<meta name="author" content="${esc(cfg.inhaber)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="de_AT">
<meta property="og:site_name" content="${esc(cfg.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canon}">
<meta property="og:image" content="${abs(OG)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Timestyle_Gravur – Lasergravur, Laserschnitt und 3D-Druck">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${abs(OG)}">
<link rel="icon" href="${href('/favicon.svg')}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${href('/apple-touch-icon.png')}">
<link rel="manifest" href="${href('/site.webmanifest')}">
<link rel="stylesheet" href="${href('/assets/css/style.css')}?v=${today}">
<script>document.documentElement.className=document.documentElement.className.replace('no-js','js')</script>
${ld ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ''}
</head>`;
}

function nav(p) {
  const links = NAV.map(([u, t]) => `<li><a href="${href(u)}"${u === p ? ' aria-current="page"' : ''}>${esc(t)}</a></li>`).join('');
  return `<a class="skip" href="#main">Zum Inhalt springen</a>
<header class="nav" id="top"><div class="wrap nav-in">
<a class="brand" href="${href('/')}" aria-label="Timestyle_Gravur – zur Startseite">${mark}<span>Timestyle_Gravur</span></a>
<nav aria-label="Hauptnavigation"><ul class="nav-links" id="menu">${links}<li><a class="nav-cart" href="${href('/anfrage/')}"${p === '/anfrage/' ? ' aria-current="page"' : ''}>Anfrage <span class="badge" data-cart-count data-empty="true" aria-label="Artikel in der Anfrage">0</span></a></li></ul></nav>
<button class="menu-btn" type="button" aria-label="Menü öffnen oder schließen" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
</div></header>`;
}

function footer() {
  return `<footer class="footer"><div class="wrap">
<div class="foot-grid">
<div><a class="brand" href="${href('/')}" style="color:#f5f5f7">${mark}<span>Timestyle_Gravur</span></a>
<p style="margin-top:14px;max-width:30ch">Präzision trifft Kreativität. Dein Partner für 3D-Druck und Laserbearbeitung.</p>
<div class="social"><a href="${cfg.facebook}" target="_blank" rel="noopener" aria-label="Timestyle_Gravur auf Facebook">${icon('fb', '')}</a><a href="${cfg.instagram}" target="_blank" rel="noopener" aria-label="Timestyle_Gravur auf Instagram">${icon('ig', '')}</a></div></div>
<div><h4>Seiten</h4><ul>${NAV.map(([u, t]) => `<li><a href="${href(u)}">${esc(t)}</a></li>`).join('')}<li><a href="${href('/anfrage/')}">Anfrage</a></li></ul></div>
<div><h4>Leistungen</h4><ul><li><a href="${href('/leistungen-preise/#3d-druck')}">3D-Druck</a></li><li><a href="${href('/leistungen-preise/#laserschneiden')}">Laserschnitt</a></li><li><a href="${href('/leistungen-preise/#lasergravur')}">Lasergravur</a></li><li><a href="${href('/shop/')}">Shop</a></li></ul></div>
<div><h4>Kontakt</h4><ul><li>${esc(cfg.strasse)}<br>${esc(cfg.plz)} ${esc(cfg.ort)}</li><li><a href="tel:${cfg.telefonLink}">${esc(cfg.telefon)}</a></li><li><a href="mailto:${cfg.email}">${esc(cfg.email)}</a></li></ul></div>
</div>
<div class="foot-bottom"><span>© ${year} ${esc(cfg.name)} · ${esc(cfg.inhaber)}</span><ul><li><a href="${href('/impressum/')}">Impressum</a></li><li><a href="${href('/datenschutz/')}">Datenschutz</a></li></ul></div>
</div></footer>
<script src="${href('/assets/js/main.js')}?v=${today}" defer></script>
</body></html>`;
}

const blobs = `<div class="aurora" aria-hidden="true"><div class="layer" data-speed=".16"><div class="blob b1"></div></div><div class="layer" data-speed=".28"><div class="blob b2"></div></div><div class="layer" data-speed=".1"><div class="blob b3"></div></div><div class="layer" data-speed=".22"><div class="blob b4"></div></div></div>`;

const crumbsLd = (p, name) => ({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Startseite', item: abs('/') }, { '@type': 'ListItem', position: 2, name, item: abs(p) }] });

function pageHero(h1, lead, name, eyebrow, extra = '') {
  return `<section class="page-hero dark">${blobs}<div class="wrap">
<nav class="breadcrumb" aria-label="Brotkrumen"><a href="${href('/')}">Startseite</a> › ${esc(name)}</nav>
${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
<h1 class="display">${h1}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}${extra}</div></section>`;
}

const pages = [];
function addPage(o) { pages.push(o); }
const R = (i = 0) => `reveal" style="--d:${(i * 0.08).toFixed(2)}s`;

/* ---------- Daten aufbereiten ---------- */
const seen = new Set();
const cats = produkte.kategorien.map((c) => {
  const items = c.artikel
    .filter((a) => cfg.ipArtikelAnzeigen || !(a[2] && a[2].ip))
    .map((a) => {
      let slug = slugify(a[0]); let n = 2; while (seen.has(slug)) slug = `${slugify(a[0])}-${n++}`; seen.add(slug);
      const o = a[2] || {};
      return { slug, name: a[0], price: a[1], alt: o.alt || `${a[0]} – ${c.name} von Timestyle_Gravur`, img: findImg('produkte', slug), pdf: o.anleitung && exists(`downloads/${o.anleitung}`) ? o.anleitung : null };
    });
  return { ...c, items };
});
const totalItems = cats.reduce((n, c) => n + c.items.length, 0);

/* ---------- Startseite ---------- */
const hoursJson = (() => {
  const dayNum = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const o = {};
  cfg.oeffnungszeiten.forEach((h) => h.schema.forEach((d) => { const [a, b] = h.von.split(':').map(Number); const [c, e] = h.bis.split(':').map(Number); o[dayNum[d]] = [a * 60 + b, c * 60 + e]; }));
  return JSON.stringify(o);
})();

const homeLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': abs('/#website'), url: abs('/'), name: cfg.name, inLanguage: 'de-AT', publisher: { '@id': abs('/#business') } },
    {
      '@type': 'LocalBusiness', '@id': abs('/#business'), name: cfg.name, url: abs('/'), image: abs(OG),
      description: 'Lasergravur, Laserschnitt und 3D-Druck: individuelle Anfertigungen und Produkte von Timestyle_Gravur.',
      email: cfg.email, telephone: cfg.telefonLink, foundingDate: String(cfg.gegruendet), founder: { '@type': 'Person', name: cfg.inhaber },
      address: { '@type': 'PostalAddress', streetAddress: cfg.strasse, postalCode: cfg.plz, addressLocality: cfg.ort, addressCountry: cfg.land },
      openingHoursSpecification: cfg.oeffnungszeiten.filter((h) => h.von).map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.schema, opens: h.von, closes: h.bis })),
      sameAs: [cfg.facebook, cfg.instagram],
      hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Leistungen', itemListElement: ['3D-Druck', 'Laserschnitt', 'Lasergravur'].map((n) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: n } })) },
    },
  ],
};

const storySteps = [
  ['chat', 'Idee & Beratung', 'Die Idee besprechen. Die Beratung zu Designanpassungen, individuellen Projekten und Express-Service ist kostenlos.'],
  ['pen', 'Design', 'Designanpassungen nach persönlichem Stil, Anlass und den Anforderungen.'],
  ['cube', 'Fertigung', '3D-Druck, Laserschnitt oder Lasergravur: alles aus einer Hand.'],
  ['sparkle', 'Nachbearbeitung', 'Sorgfältige Nachbearbeitung für ein sauberes, hochwertiges Ergebnis.'],
];

addPage({
  p: '/', title: 'Lasergravur & 3D-Druck bei Tulln | Timestyle_Gravur',
  desc: 'Timestyle_Gravur aus Sieghartskirchen bei Tulln: Lasergravur, Laserschnitt und 3D-Druck, präzise, individuell und alles aus einer Hand. Jetzt anfragen.',
  ld: homeLd,
  body: `<main id="main">
<section class="hero dark">${blobs}
<div class="hero-in">
<p class="eyebrow">3D-Druck · Laserschnitt · Lasergravur</p>
<h1 class="display">Präzision trifft<br><span class="gold-text">Kreativität</span></h1>
<p class="lead">Dein Partner für 3D-Druck und Laserbearbeitung.</p>
<div class="cta-row"><a class="btn btn-gold" href="${href('/shop/')}">Zum Shop</a><a class="btn btn-ghost" href="${href('/leistungen-preise/')}">Leistungen &amp; Preise</a></div>
</div>
<div class="board wood" role="img" aria-label="Holztafel mit eingraviertem Schriftzug Timestyle_Gravur und goldener Laserlinie">
<span class="screw s1"></span><span class="screw s2"></span><span class="screw s3"></span><span class="screw s4"></span>
<div class="engrave" aria-hidden="true">Timestyle_Gravur<small>Lasergravur · Laserschnitt · 3D-Druck</small></div></div>
<div class="scroll-cue" aria-hidden="true"></div>
</section>

<section class="section" aria-labelledby="katalog">
<div class="wrap">
<div class="center ${R()}"><p class="eyebrow">Was wir machen</p><h2 class="h2" id="katalog">Unser Produktkatalog</h2>
<p class="lead">Technisch gute Lösungen mit präzisen, modernen und alltagstauglichen Designs, für Innovatives, Zeitloses oder besondere Anlässe.</p></div>
<div class="bento">
<a class="tile ink t-half ${R(0)}" href="${href('/shop/')}">${icon('cube')}<h3>3D-Druck</h3><p>Maßgeschneiderte, detailgetreue Drucke für individuelle Projekte.</p><span class="price gold-text">ab 5 €</span><span class="link-more">Zum Shop</span></a>
<a class="tile wood t-half ${R(1)}" href="${href('/leistungen-preise/#lasergravur')}">${icon('pen')}<h3>Lasergravur</h3><p>Hochwertige Gravuren für persönliche und geschäftliche Zwecke.</p><span class="price" style="color:var(--gold-1)">ab 10 €</span><span class="link-more" style="color:var(--gold-1)">Preise ansehen</span></a>
<a class="tile silver t-full ${R(2)}" href="${href('/leistungen-preise/#laserschneiden')}">${icon('laser')}<h3>Laserschnitt</h3><p>Präzise Schnitte für verschiedene Materialien und Anwendungen.</p><span class="price">ab 5 €</span><span class="link-more" style="color:var(--wood-3)">Preise ansehen</span></a>
</div></div></section>

<section class="section dark" aria-labelledby="ablauf">${blobs}
<div class="wrap" style="position:relative;z-index:2">
<div class="center ${R()}"><p class="eyebrow">So entsteht dein Unikat</p><h2 class="h2" id="ablauf">Von der Idee <span class="gold-text">zum fertigen Stück.</span></h2></div>
<div class="story" style="margin-top:50px">
<div class="story-pin"><div class="story-card wood" aria-hidden="true">${storySteps.map((s, i) => `<div class="glyph${i === 0 ? ' on' : ''}">${icon(s[0], '')}</div>`).join('')}<span class="num">01</span></div></div>
<div class="story-steps">${storySteps.map((s, i) => `<div class="step"><span class="n">Schritt ${i + 1}</span><h3>${esc(s[1])}</h3><p>${esc(s[2])}</p></div>`).join('')}</div>
</div></div></section>

<section class="section gray" aria-labelledby="sortiment" style="overflow:hidden">
<div class="wrap"><div class="${R()}"><p class="eyebrow">Sortiment</p><h2 class="h2" id="sortiment">Schon gesehen?<br><span class="muted">Mehr als ${Math.floor(totalItems / 10) * 10} Artikel im Shop.</span></h2></div></div>
<div class="wrap"><div class="chips-scroll">${cats.filter((c) => c.items.length).map((c) => `<a class="cat-card" href="${href('/shop/#' + c.id)}">${icon(c.icon, '')}<b>${esc(c.name)}</b><small>${c.items.length} Artikel</small></a>`).join('')}</div></div>
</section>

<section class="section" aria-labelledby="preise">
<div class="wrap"><div class="center ${R()}"><p class="eyebrow">Preise</p><h2 class="h2" id="preise">Startpreise auf einen Blick.</h2><p class="lead">Alle „ab“-Preise sind Richtwerte, der Endpreis hängt vom Projekt ab.</p></div>
<div class="price-strip">
<div class="price-box ${R(0)}"><small>3D-Druck, kleine Objekte</small><b>ab 5 €</b><a class="link-more" href="${href('/leistungen-preise/#3d-druck')}">Preisliste</a></div>
<div class="price-box ${R(1)}"><small>Laserschnitt, kleine Objekte</small><b>ab 5 €</b><a class="link-more" href="${href('/leistungen-preise/#laserschneiden')}">Preisliste</a></div>
<div class="price-box ${R(2)}"><small>Lasergravur, einfach &amp; klein</small><b>ab 10 €</b><a class="link-more" href="${href('/leistungen-preise/#lasergravur')}">Preisliste</a></div>
</div></div></section>

<section class="section dark" aria-labelledby="stimmen">${blobs}
<div class="wrap" style="position:relative;z-index:2">
<div class="center ${R()}"><p class="eyebrow">Kundenstimmen</p><h2 class="h2" id="stimmen">Was Kunden <span class="silver-text">sagen.</span></h2></div>
<div class="quotes">${stimmen.map((s, i) => `<figure class="quote ${R(i)}"><blockquote>${esc(s.zitat)}</blockquote><p>${esc(s.text)}</p><figcaption>${esc(s.name)}</figcaption></figure>`).join('')}</div>
<div class="facts">
<div class="fact ${R(0)}"><b class="gold-text" data-count="${cfg.gegruendet}" data-from="${cfg.gegruendet - 40}">${cfg.gegruendet}</b><span>Gegründet: aus einem kleinen Vorhaben gewachsen</span></div>
<div class="fact ${R(1)}"><b class="gold-text" data-count="${Math.floor(totalItems / 10) * 10}" data-suffix="+">${Math.floor(totalItems / 10) * 10}+</b><span>Artikel im Shop</span></div>
<div class="fact ${R(2)}"><b class="gold-text" data-count="3">3</b><span>Verfahren: 3D-Druck, Laserschnitt, Lasergravur</span></div>
</div>
<p class="center" style="margin-top:34px"><a class="link-more" href="${href('/kundenstimmen/')}">Alle Kundenstimmen</a></p>
</div></section>

<section class="section wood final-cta" aria-labelledby="cta" style="color:#fbefd8">
<div class="wrap ${R()}"><h2 class="h2" id="cta">Eine Idee im Kopf?<br>Gemeinsam umsetzen.</h2>
<p class="lead" style="margin:0 auto 28px;color:#e9d3b2">Anfrage senden oder direkt vorbeikommen: ${esc(addr)}.</p>
<div class="cta-row"><a class="btn btn-gold" href="${href('/anfrage/')}">Anfrage senden</a><a class="btn btn-ghost" href="${href('/kontakt/')}">Kontakt &amp; Anfahrt</a></div></div></section>
</main>`,
});

/* ---------- Leistungen & Preise ---------- */
const rowTbl = (rows) => rows.map(([a, b]) => `<tr><th scope="row">${esc(a)}</th>${/^ab|€/.test(b) ? `<td class="p">${esc(b)}</td>` : `<td class="ask">${esc(b)}</td>`}</tr>`).join('');
const tbl = (cap, rows) => `<div class="table-wrap"><table><caption class="sr-only">${esc(cap)}</caption><thead><tr><th scope="col">Leistung</th><th scope="col">Preis</th></tr></thead><tbody>${rowTbl(rows)}</tbody></table></div>`;
addPage({
  p: '/leistungen-preise/', title: 'Leistungen & Preise – 3D-Druck, Laser | Timestyle_Gravur',
  desc: 'Preisliste für 3D-Druck, Laserschnitt und Lasergravur von Timestyle_Gravur: transparente Startpreise nach Größe und Komplexität, Beratung kostenlos.',
  ld: { '@context': 'https://schema.org', '@graph': [crumbsLd('/leistungen-preise/', 'Leistungen & Preise')] },
  body: `<main id="main">${pageHero('Leistungen <span class="gold-text">&amp; Preise</span>', 'Maßgeschneiderte Lösungen nach persönlichem Stil, Anlass und Anforderungen, mit Liebe zum Detail, hochwertigen Materialien und moderner Technik.', 'Leistungen & Preise', 'Unsere Leistungen', '<div class="seg"><a href="#3d-druck">3D-Druck</a><a href="#laserschneiden">Laserschnitt</a><a href="#lasergravur">Lasergravur</a></div>')}
<section class="section" style="padding-top:20px"><div class="wrap">
<div class="callout ${R()}">${icon('info', '')}<p><strong>So lesen sich die Preise:</strong> „ab“-Preise sind Richtwerte bzw. Startpreise, der Endpreis hängt vom Projekt ab. Designanpassungen, individuelle Projekte, Express-Service und Langzeitprojekte werden nach einer <strong>kostenlosen Beratung</strong> kalkuliert.</p></div>

<div class="price-section ${R()}" id="3d-druck"><p class="eyebrow">01</p><h2 class="h2">3D-Druck</h2><p>Maßgeschneiderte, detailgetreue Drucke für individuelle Projekte.</p>${tbl('Preisliste 3D-Druck', preise.druck)}</div>
<div class="price-section ${R()}" id="laserschneiden"><p class="eyebrow">02</p><h2 class="h2">Laserschneiden</h2><p>Präzise Schnitte für verschiedene Materialien und Anwendungen.</p>${tbl('Preisliste Laserschneiden', preise.schnitt)}</div>
<div class="price-section ${R()}" id="lasergravur"><p class="eyebrow">03</p><h2 class="h2">Lasergravur</h2><p>Gestaffelt nach Komplexität und Größe: hochwertige Gravuren für persönliche und geschäftliche Zwecke.</p>
<div class="table-wrap"><table><caption class="sr-only">Preisliste Lasergravur nach Komplexität und Größe</caption><thead><tr><th scope="col">Komplexität</th>${preise.gravur.spalten.map((s) => `<th scope="col">${esc(s)}</th>`).join('')}</tr></thead><tbody>${preise.gravur.zeilen.map((z) => `<tr><th scope="row">${esc(z[0])}<span class="tbl-sub">${esc(z[1])}</span></th>${z.slice(2).map((x) => `<td class="p">${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
<h3 style="margin:34px 0 14px;font-size:1.3rem">Zusatzleistungen Lasergravur</h3>${tbl('Zusatzleistungen Lasergravur', preise.gravur.zusatz)}</div>

<div class="center ${R()}" style="margin-top:80px"><h2 class="h2" style="margin-bottom:18px">Passt das zu deinem Projekt?</h2><p class="lead" style="margin:0 auto 26px">Beratung ist kostenlos. Einfach Anfrage senden.</p><div class="cta-row"><a class="btn btn-dark" href="${href('/anfrage/')}">Anfrage senden</a><a class="btn btn-line" href="${href('/kontakt/')}">Kontakt</a></div></div>
</div></section></main>`,
});

/* ---------- Shop ---------- */
addPage({
  p: '/shop/', title: 'Shop – 3D-Druck Lampen, Spielzeug, Deko | Timestyle_Gravur',
  desc: `Über ${Math.floor(totalItems / 10) * 10} Artikel aus dem 3D-Drucker: Lampen, Spielzeug, Deko, Schmuck, Interior Design, Sport und mehr. Preise ab, Anfrage per E-Mail.`,
  ld: { '@context': 'https://schema.org', '@graph': [crumbsLd('/shop/', 'Shop'), { '@type': 'ItemList', name: 'Shop-Kategorien', itemListElement: cats.filter((c) => c.items.length).map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: abs('/shop/#' + c.id) })) }] },
  body: `<main id="main">${pageHero('Der <span class="gold-text">Shop</span>', 'Artikel aus dem 3D-Drucker. Alle Preise sind „ab“-Preise. Gewünschte Artikel zur Anfrage hinzufügen und per E-Mail senden.', 'Shop', 'Sortiment')}
<div class="toolbar"><div class="wrap toolbar-in">
<div class="search"><label class="sr-only" for="shop-search">Artikel suchen</label>${icon('search', '')}<input id="shop-search" type="search" placeholder="Artikel suchen …" autocomplete="off"></div>
<div class="filters" role="group" aria-label="Kategorie filtern"><button type="button" data-cat="alle" aria-pressed="true">Alle<span>${totalItems}</span></button>${cats.map((c) => `<button type="button" data-cat="${c.id}" aria-pressed="false">${esc(c.name)}<span>${c.items.length}</span></button>`).join('')}</div>
</div></div>
<section class="section" style="padding-top:0" id="shop"><div class="wrap">
${cats.map((c) => `<section class="cat-block" id="${c.id}" aria-labelledby="h-${c.id}"${c.items.length ? '' : ' data-empty="true"'}><h2 id="h-${c.id}">${esc(c.name)} <small>${c.items.length} Artikel</small></h2>
${c.items.length ? `<div class="pgrid">${c.items.map((i) => `<article class="pcard" data-cat="${c.id}" data-name="${esc(i.name)}">
<div class="pimg${i.img ? '' : ' ph'}">${i.img ? `<img src="${href(i.img)}" alt="${esc(i.alt)}" width="800" height="600" loading="lazy" decoding="async">` : icon(c.icon)}</div>
<div class="pbody"><h3>${esc(i.name)}</h3><span class="pprice">${esc(i.price)}</span><div class="pfoot"><button type="button" class="add" data-id="${i.slug}" data-name="${esc(i.name)}" data-price="${esc(i.price)}" aria-label="${esc(i.name)} zur Anfrage hinzufügen">Zur Anfrage</button>${i.pdf ? `<a class="dl" href="${href('/downloads/' + i.pdf)}" download>Anleitung (PDF)</a>` : ''}</div></div></article>`).join('')}</div>` : `<p class="empty-cat">Aktuell sind in dieser Kategorie keine Artikel eingetragen. Wünsche gern direkt <a href="${href('/anfrage/')}">anfragen</a>.</p>`}
</section>`).join('')}
<p id="shop-none" class="noresult" hidden>Keine Treffer. Anderen Suchbegriff probieren oder eine <a href="${href('/anfrage/')}">individuelle Anfrage</a> senden.</p>
</div></section></main>`,
});

/* ---------- Über uns ---------- */
const vals = [['target', 'Handwerkliche Präzision', 'Saubere Kanten, exakte Maße, sorgfältige Nachbearbeitung.'], ['bulb', 'Kreativität', 'Jede Idee ist einzigartig und verdient eine eigene Lösung.'], ['heart', 'Leidenschaft für das Handwerk', 'Aus einem kleinen Vorhaben wurde eine Leidenschaft, die geteilt werden soll.']];
const teamImg = findImg('team', 'manuel-jarc');
addPage({
  p: '/ueber-uns/', title: 'Über uns – Manuel Jarc | Timestyle_Gravur',
  desc: 'Timestyle_Gravur von Manuel Jarc: Kleinunternehmen für 3D-Druck, Laserschnitt und Lasergravur, 2020 gestartet und seitdem stetig gewachsen.',
  ld: { '@context': 'https://schema.org', '@graph': [crumbsLd('/ueber-uns/', 'Über uns'), { '@type': 'Person', name: cfg.inhaber, worksFor: { '@id': abs('/#business') } }] },
  body: `<main id="main">${pageHero('Das <span class="gold-text">Rundum-Glücklich-Paket</span>', 'Von Timestyle_Gravur.', 'Über uns', 'Über uns')}
<section class="section"><div class="wrap two">
<div class="${R()}"><p class="eyebrow">Unsere Geschichte</p><h2 class="h2" style="margin-bottom:22px">Aus einem Vorhaben wurde Leidenschaft.</h2>
<p>Timestyle_Gravur bietet Dienstleistungen in <strong>3D-Druck, Laserschnitt und Lasergravur</strong> an. Handwerkliche Präzision und Kreativität stehen im Mittelpunkt.</p>
<p>Das Projekt begann ${cfg.gegruendet} während der Covid-Pandemie und ist seitdem stetig gewachsen. Aus einem kleinen Vorhaben wurde eine Leidenschaft, die geteilt werden soll.</p>
<p>Ideen und Projekte lassen sich gemeinsam besprechen. Dabei entstehen kreative Lösungen, die genau zur Idee passen.</p>
<p><a class="btn btn-dark" href="${href('/anfrage/')}">Projekt besprechen</a></p></div>
<div class="${R(1)}"><div class="ph-photo wood">${teamImg ? `<img src="${href(teamImg)}" width="800" height="1000" alt="Manuel Jarc, Inhaber von Timestyle_Gravur, in der Werkstatt" loading="lazy">` : `<span class="ini" aria-hidden="true">MJ</span>`}</div></div>
</div></section>
<section class="section gray"><div class="wrap"><div class="center ${R()}"><p class="eyebrow">Unser Angebot</p><h2 class="h2">Drei Verfahren. Ein Ansprechpartner.</h2></div>
<div class="values">
<div class="value ${R(0)}">${icon('cube', '')}<h3>3D-Druck</h3><p>Maßgeschneiderte, detailgetreue Drucke für individuelle Projekte.</p></div>
<div class="value ${R(1)}">${icon('laser', '')}<h3>Laserschnitt</h3><p>Präzise Schnitte für verschiedene Materialien und Anwendungen.</p></div>
<div class="value ${R(2)}">${icon('pen', '')}<h3>Lasergravur</h3><p>Hochwertige Gravuren für persönliche und geschäftliche Zwecke.</p></div></div>
<div class="values">${vals.map((v, i) => `<div class="value ${R(i)}">${icon(v[0], '')}<h3>${esc(v[1])}</h3><p>${esc(v[2])}</p></div>`).join('')}</div></div></section>
<section class="section dark">${blobs}<div class="wrap center" style="position:relative;z-index:2"><p class="eyebrow ${R()}">Unser Team</p><h2 class="h2 ${R(1)}">${esc(cfg.inhaber)}</h2><p class="lead ${R(2)}">Ansprechpartner für Beratung, Design und Fertigung.</p><div class="cta-row" style="margin-top:26px"><a class="btn btn-gold" href="${href('/kontakt/')}">Kontakt aufnehmen</a></div></div></section></main>`,
});

/* ---------- Kundenstimmen ---------- */
const gal = fs.existsSync(path.join(SRC, 'assets/img/galerie')) ? fs.readdirSync(path.join(SRC, 'assets/img/galerie')).filter((f) => /\.(webp|jpe?g|png|avif)$/i.test(f)).sort() : [];
let galAlt = {}; try { galAlt = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/galerie-alt.json'), 'utf8')); } catch { /* optional */ }
gal.forEach((f) => { if (!galAlt[f]) warnings.push(`Galeriebild ${f} hat keinen Alt-Text in data/galerie-alt.json, Fallbacktext wird verwendet.`); });
addPage({
  p: '/kundenstimmen/', title: 'Kundenstimmen & Galerie | Timestyle_Gravur',
  desc: 'Was Kunden über Timestyle_Gravur sagen: Erfahrungen mit Lasergravur und 3D-Druck von Manuel Jarc, dazu eine Auswahl gefertigter Produkte.',
  ld: { '@context': 'https://schema.org', '@graph': [crumbsLd('/kundenstimmen/', 'Kundenstimmen')] },
  body: `<main id="main">${pageHero('Kundenstimmen <span class="gold-text">&amp; Galerie</span>', 'Erfahrungen von Kunden und eine Auswahl gefertigter Produkte.', 'Kundenstimmen', 'Galerie & Kundenstimmen')}
<section class="section dark" style="padding-top:20px"><div class="wrap"><h2 class="sr-only">Kundenstimmen</h2><div class="quotes" style="margin-top:0">${stimmen.map((s, i) => `<figure class="quote ${R(i)}"><blockquote>${esc(s.zitat)}</blockquote><p>${esc(s.text)}</p><figcaption>${esc(s.name)}</figcaption></figure>`).join('')}</div></div></section>
${gal.length ? `<section class="section"><div class="wrap"><div class="center ${R()}"><p class="eyebrow">Galerie</p><h2 class="h2">Unsere Produkte</h2></div><div class="pgrid" style="margin-top:44px">${gal.map((f, i) => `<figure class="pcard ${R(i % 4)}" style="margin:0"><div class="pimg"><img src="${href('/assets/img/galerie/' + f)}" alt="${esc(galAlt[f] || 'Gefertigtes Produkt von Timestyle_Gravur')}" width="800" height="600" loading="lazy" decoding="async"></div></figure>`).join('')}</div></div></section>` : ''}
<section class="section gray"><div class="wrap center ${R()}"><h2 class="h2" style="margin-bottom:16px">Als Nächstes dein Projekt.</h2><div class="cta-row" style="margin-top:22px"><a class="btn btn-dark" href="${href('/anfrage/')}">Anfrage senden</a><a class="btn btn-line" href="${href('/shop/')}">Zum Shop</a></div></div></section></main>`,
});

/* ---------- Kontakt ---------- */
const anfahrtImg = ['webp', 'jpg', 'jpeg', 'png'].map((e) => `assets/img/anfahrt.${e}`).find(exists);
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr + ', Österreich')}`;
addPage({
  p: '/kontakt/', title: 'Kontakt & Anfahrt – Öpping bei Tulln | Timestyle_Gravur',
  desc: `Kontakt zu Timestyle_Gravur: ${addr}. Öffnungszeiten, Telefon, E-Mail und Anfahrt. Bestellungen und Anfragen per E-Mail.`,
  ld: { '@context': 'https://schema.org', '@graph': [crumbsLd('/kontakt/', 'Kontakt'), { '@type': 'ContactPage', url: abs('/kontakt/'), about: { '@id': abs('/#business') } }] },
  body: `<main id="main">${pageHero('<span class="gold-text">Kontakt</span> &amp; Anfahrt', 'Bestellen Sie jetzt: per E-Mail, telefonisch oder direkt vor Ort.', 'Kontakt', 'Wir freuen uns auf dein Projekt')}
<section class="section"><div class="wrap">
<div class="contact-grid">
<div class="c-card ${R(0)}"><h3>Adresse</h3><p>${esc(cfg.name)}<br>${esc(cfg.strasse)}<br>${esc(cfg.plz)} ${esc(cfg.ort)}</p><p style="margin-top:10px"><a href="${mapsUrl}" target="_blank" rel="noopener">Route in Google Maps ↗</a></p></div>
<div class="c-card ${R(1)}"><h3>Erreichbarkeit</h3><p>Telefon: <a href="tel:${cfg.telefonLink}">${esc(cfg.telefon)}</a></p><p>E-Mail: <a href="mailto:${cfg.email}">${esc(cfg.email)}</a></p><p style="margin-top:10px">Facebook: <a href="${cfg.facebook}" target="_blank" rel="noopener">Timestyle_Gravur ↗</a><br>Instagram: <a href="${cfg.instagram}" target="_blank" rel="noopener">@timestyle_gravur ↗</a></p></div>
<div class="c-card ${R(2)}"><h3>Öffnungszeiten</h3><table class="hours"><caption class="sr-only">Öffnungszeiten</caption><tbody>${cfg.oeffnungszeiten.map((h) => `<tr data-days="${h.schema.map((d) => ({ Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }[d])).join(',') || '0'}"><th scope="row">${esc(h.tage)}</th><td>${h.von ? `${h.von.replace(/^0/, '')}–${h.bis} Uhr` : 'geschlossen'}</td></tr>`).join('')}</tbody></table><div class="open-now" data-hours='${hoursJson}' aria-live="polite"></div></div>
</div>
<div class="two" style="margin-top:clamp(50px,8vw,100px)">
<div class="${R()}"><p class="eyebrow">Bestellen Sie jetzt</p><h2 class="h2" style="margin-bottom:18px">Bestellung per <span style="white-space:nowrap">E&#8209;Mail</span>.</h2><p>Gewünschte Artikel im <a href="${href('/shop/')}">Shop</a> zur Anfrage hinzufügen und die Liste per E-Mail senden, oder direkt eine Nachricht an <a href="mailto:${cfg.email}">${esc(cfg.email)}</a> schreiben.</p><p><a class="btn btn-dark" href="${href('/anfrage/')}">Zur Anfrage</a></p></div>
<div class="${R(1)}"><p class="eyebrow">Anfahrt</p><h2 class="h2" style="margin-bottom:18px">Gern persönlich vorbeikommen.</h2><p>Besuche sind willkommen, am besten innerhalb der Öffnungszeiten.</p>${anfahrtImg ? `<img src="${href('/' + anfahrtImg)}" width="800" height="500" loading="lazy" alt="Anfahrtsskizze zu Timestyle_Gravur in ${esc(cfg.ort)}" style="border-radius:var(--radius-s)">` : ''}</div>
</div></div></section></main>`,
});

/* ---------- Anfrage ---------- */
addPage({
  p: '/anfrage/', title: 'Anfrage senden | Timestyle_Gravur', noindex: true,
  desc: 'Ausgewählte Artikel und Leistungen von Timestyle_Gravur gesammelt per E-Mail anfragen.',
  body: `<main id="main">${pageHero('Deine <span class="gold-text">Anfrage</span>', 'Die Liste bleibt in deinem Browser. Gesendet wird erst, wenn du die E-Mail abschickst.', 'Anfrage', 'Warenkorb')}
<section class="section" style="padding-top:20px"><div class="wrap" id="cart-root" data-conf='${JSON.stringify({ email: cfg.email })}'>
<noscript><p class="empty-box">Für die Anfrageliste wird JavaScript benötigt. Alternativ direkt per E-Mail an <a href="mailto:${cfg.email}">${esc(cfg.email)}</a>.</p></noscript>
<div class="cart-layout">
<div><div id="cart-empty" class="empty-box"><h2 style="font-size:1.5rem;margin-bottom:10px">Noch nichts ausgewählt.</h2><p class="muted">Im Shop Artikel zur Anfrage hinzufügen, oder unten direkt eine Nachricht schreiben.</p><a class="btn btn-dark" href="${href('/shop/')}">Zum Shop</a></div>
<ul id="cart-items" class="cart-list" hidden></ul></div>
<form id="cart-form" class="form-card" hidden>
<h2 style="font-size:1.4rem">Kontaktdaten</h2>
<div class="field"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name" required></div>
<div class="field"><label for="f-mail">E-Mail</label><input id="f-mail" name="email" type="email" autocomplete="email" required></div>
<div class="field"><label for="f-tel">Telefon (optional)</label><input id="f-tel" name="telefon" type="tel" autocomplete="tel"></div>
<div class="field"><label for="f-msg">Nachricht / Wünsche (optional)</label><textarea id="f-msg" name="nachricht" rows="4"></textarea></div>
<button class="btn btn-dark" type="submit">Anfrage per E-Mail senden</button>
<button class="btn btn-line" type="button" id="cart-copy">Text kopieren</button>
<button class="rm" type="button" id="cart-clear">Liste leeren</button>
<p class="note-s" id="cart-status" role="status" aria-live="polite"></p>
<p class="note-s">Es werden keine Daten an einen Server übertragen. Der Button öffnet das E-Mail-Programm mit einem vorbereiteten Text an ${esc(cfg.email)}. Alle Preise sind Richtwerte („ab“). Mehr dazu in der <a href="${href('/datenschutz/')}">Datenschutzerklärung</a>.</p>
</form></div></div></section></main>`,
});

/* ---------- Impressum ---------- */
addPage({
  p: '/impressum/', title: 'Impressum | Timestyle_Gravur', desc: 'Impressum und Anbieterkennzeichnung von Timestyle_Gravur, Manuel Jarc, Sieghartskirchen.',
  body: `<main id="main">${pageHero('Impressum', '', 'Impressum')}
<!-- TODO vor Livegang prüfen (siehe README): Rechtsform, UID bzw. Kleinunternehmer-Hinweis, Kammer/Behörde, Bedeutung der Nummer. -->
<section class="section" style="padding-top:20px"><div class="wrap prose">
<h2 style="margin-top:0">Angaben gemäß § 5 E-Commerce-Gesetz</h2>
<p><strong>${esc(cfg.name)}</strong><br>Inhaber: ${esc(cfg.inhaber)}<br>${esc(cfg.strasse)}<br>${esc(cfg.plz)} ${esc(cfg.ort)}<br>Österreich</p>
<h3>Kontakt</h3>
<p>Telefon: <a href="tel:${cfg.telefonLink}">${esc(cfg.telefon)}</a><br>E-Mail: <a href="mailto:${cfg.email}">${esc(cfg.email)}</a></p>
<h3>Unternehmensgegenstand</h3>
<p>Verkauf von Kleingütern und Handel mit selbsterstellten Gütern.</p>
<h3>Gewerbe</h3>
<p>Gewerberechtlicher Verweis: § 19 GewO 1994<br>Nummer: 359103055</p>
<h3>Online-Streitbeilegung</h3>
<p>Verbraucher können Beschwerden an die Online-Streitbeilegungsplattform der EU richten: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">ec.europa.eu/consumers/odr</a>.</p>
<h3>Urheberrecht</h3>
<p>Inhalte und Werke auf dieser Website unterliegen dem Urheberrecht. Vervielfältigung, Bearbeitung und Verbreitung bedürfen der schriftlichen Zustimmung.</p>
</div></section></main>`,
});

/* ---------- Datenschutz ---------- */
addPage({
  p: '/datenschutz/', title: 'Datenschutzerklärung | Timestyle_Gravur', desc: 'Datenschutzerklärung von Timestyle_Gravur: welche Daten beim Besuch der Website und bei Anfragen verarbeitet werden.',
  body: `<main id="main">${pageHero('Datenschutz&shy;erklärung', '', 'Datenschutz')}
<!-- ENTWURF: Vor Livegang rechtlich prüfen lassen (z. B. WKO-Rechtsservice). Hosting-Abschnitt anpassen, falls nicht GitHub Pages verwendet wird. -->
<section class="section" style="padding-top:20px"><div class="wrap prose">
<h2 style="margin-top:0">1. Verantwortlicher</h2>
<p>${esc(cfg.inhaber)}, ${esc(cfg.name)}, ${esc(cfg.strasse)}, ${esc(cfg.plz)} ${esc(cfg.ort)}, Österreich<br>E-Mail: <a href="mailto:${cfg.email}">${esc(cfg.email)}</a> · Telefon: ${esc(cfg.telefon)}</p>
<h2>2. Grundsatz</h2>
<p>Diese Website kommt ohne Cookies, ohne Webanalyse, ohne Werbe- oder Tracking-Dienste und ohne eingebettete Inhalte Dritter (Karten, Videos, Schriftarten-Server) aus. Personenbezogene Daten werden nur verarbeitet, soweit dies für den Betrieb der Seite oder die Bearbeitung einer Anfrage erforderlich ist.</p>
<h2>3. Hosting und Server-Logfiles</h2>
<p>Die Website wird über GitHub Pages bereitgestellt (GitHub, Inc., USA). Beim Aufruf verarbeitet der Hosting-Anbieter technisch notwendige Daten, insbesondere IP-Adresse, Datum und Uhrzeit, aufgerufene Seite sowie Browser- und Geräteinformationen, um die Seite auszuliefern und die Sicherheit zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und stabilen Betrieb). Eine Übermittlung in die USA kann dabei nicht ausgeschlossen werden; Angaben zu den Garantien stellt der Anbieter in seinen Datenschutzinformationen bereit.</p>
<h2>4. Anfrageliste und Kontaktaufnahme</h2>
<p>Artikel, die zur Anfrage hinzugefügt werden, speichert der Browser lokal auf dem Gerät (Local Storage). Diese Daten werden nicht an einen Server übertragen und können über „Liste leeren“ oder durch Löschen der Websitedaten im Browser entfernt werden.</p>
<p>Wer eine Anfrage sendet, öffnet damit das eigene E-Mail-Programm. Übermittelt werden die Angaben, die dort selbst abgeschickt werden (z. B. Name, E-Mail-Adresse, Telefonnummer, Nachricht, gewählte Artikel). Sie werden zur Bearbeitung der Anfrage und zur Vertragsanbahnung verwendet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO. Die Daten werden gelöscht, sobald sie nicht mehr benötigt werden und keine gesetzlichen Aufbewahrungspflichten entgegenstehen. Das E-Mail-Postfach wird über einen externen Anbieter (Google Gmail) betrieben.</p>
<p>Gleiches gilt für Kontaktaufnahme per Telefon oder E-Mail.</p>
<h2>5. Externe Links</h2>
<p>Die Seite enthält Links zu Facebook, Instagram und Google Maps. Es werden keine Plugins eingebunden. Erst nach einem Klick auf den Link werden Daten an den jeweiligen Anbieter übertragen, dessen Datenschutzbestimmungen dann gelten.</p>
<h2>6. Rechte der betroffenen Personen</h2>
<p>Es bestehen die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Anfragen dazu bitte an die oben genannte E-Mail-Adresse. Beschwerden können bei der österreichischen Datenschutzbehörde eingebracht werden: <a href="https://www.dsb.gv.at" target="_blank" rel="noopener">www.dsb.gv.at</a>.</p>
<p>Stand: ${new Date().toLocaleDateString('de-AT', { month: 'long', year: 'numeric' })}</p>
</div></section></main>`,
});

/* ---------- 404 ---------- */
addPage({
  p: '/404.html', file: '404.html', title: 'Seite nicht gefunden | Timestyle_Gravur', desc: 'Diese Seite existiert nicht.', noindex: true,
  body: `<main id="main"><section class="hero dark">${blobs}<div class="hero-in"><p class="eyebrow">Fehler 404</p><h1 class="display">Hier ist <span class="gold-text">nichts</span> graviert.</h1><p class="lead">Die Seite wurde nicht gefunden.</p><div class="cta-row"><a class="btn btn-gold" href="${href('/')}">Zur Startseite</a><a class="btn btn-ghost" href="${href('/shop/')}">Zum Shop</a></div></div></section></main>`,
});

/* ---------- Schreiben ---------- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(path.join(SRC, 'assets'), path.join(DIST, 'assets'), { recursive: true });
if (exists('static')) fs.cpSync(path.join(SRC, 'static'), DIST, { recursive: true });
if (exists('downloads')) fs.cpSync(path.join(SRC, 'downloads'), path.join(DIST, 'downloads'), { recursive: true });
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
if (cfg.customDomain) fs.writeFileSync(path.join(DIST, 'CNAME'), cfg.customDomain + '\n');

for (const pg of pages) {
  const html = head(pg) + `\n<body>\n${nav(pg.p)}\n${pg.body}\n${footer()}\n`;
  const out = pg.file ? path.join(DIST, pg.file) : path.join(DIST, pg.p, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
}

const indexable = pages.filter((p) => !p.noindex);
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((p) => `  <url><loc>${abs(p.p)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\n`);

/* ---------- Qualitätsprüfung ---------- */
let problems = 0;
const allImgs = [];
for (const pg of pages) {
  const f = pg.file ? path.join(DIST, pg.file) : path.join(DIST, pg.p, 'index.html');
  const h = fs.readFileSync(f, 'utf8');
  if ((h.match(/<h1[\s>]/g) || []).length !== 1) { warnings.push(`${pg.p}: genau ein <h1> erwartet`); problems++; }
  if (pg.title.length > 62) warnings.push(`${pg.p}: Title ${pg.title.length} Zeichen (empfohlen ≤ 60)`);
  if (pg.desc.length > 160) warnings.push(`${pg.p}: Description ${pg.desc.length} Zeichen (empfohlen ≤ 155)`);
  for (const m of h.matchAll(/<img\b[^>]*>/g)) { allImgs.push(m[0]); if (!/\balt="/.test(m[0])) { warnings.push(`${pg.p}: <img> ohne alt`); problems++; } }
}
const missing = cats.flatMap((c) => c.items.filter((i) => !i.img)).length;
console.log(`✔ ${pages.length} Seiten, ${totalItems} Artikel nach ${path.relative(process.cwd(), DIST) || 'dist'}`);
console.log(`  Produktbilder vorhanden: ${totalItems - missing}/${totalItems}  (fehlende werden als Platzhalter-Kachel dargestellt)`);
if (missing) console.log('  Bildnamen (in src/assets/img/produkte/ ablegen, .webp/.jpg/.png): siehe docs/bildnamen.txt');
fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs', 'bildnamen.txt'), cats.map((c) => `# ${c.name}\n` + c.items.map((i) => `${i.slug}\t${i.img ? 'vorhanden' : 'FEHLT'}\t${i.name}`).join('\n')).join('\n\n') + '\n');
warnings.forEach((w) => console.warn('  ⚠', w));
process.exit(problems ? 1 : 0);
