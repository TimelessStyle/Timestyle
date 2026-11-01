# Timestyle_Gravur – Website

Handgeschriebene, statische Website (HTML/CSS/JS, keine Frameworks, keine Cookies, keine externen Dienste).
Ein Build-Skript erzeugt aus den Datendateien alle Seiten.

## Struktur

| Pfad | Inhalt |
|---|---|
| `site.config.json` | Firmendaten, Adresse, Öffnungszeiten, Domain. **Hier zuerst `siteUrl` eintragen.** |
| `data/produkte.json` | alle Shop-Artikel (Name, Preis) |
| `data/preise.json` | Preislisten Leistungen & Preise |
| `data/stimmen.json` | Kundenstimmen |
| `src/assets/css/style.css` | Design (Farben/Holz/Gold/Silber stehen oben als Variablen) |
| `src/assets/js/main.js` | Animationen, Filter, Anfrageliste |
| `src/assets/img/` | Bilder (siehe unten) |
| `build.mjs` | erzeugt `dist/` (die fertige Seite) |
| `docs/inhaltsinventar.md` | Auszug der alten Google-Sites-Seite (Referenz) |
| `docs/bildnamen.txt` | Dateinamen, unter denen Produktbilder abgelegt werden |

## Lokal ansehen (optional)

```
node build.mjs
npx serve dist
```

## Veröffentlichen auf GitHub Pages

1. Auf github.com ein **öffentliches** Repository anlegen (GitHub Free bietet Pages nur für öffentliche Repos).
2. Inhalt dieses Ordners hochladen (Dateien per Drag & Drop oder per Git).
3. Repo → Settings → Pages → Source: **GitHub Actions**.
4. In `site.config.json` die `siteUrl` setzen:
   - eigene Domain: `"siteUrl": "https://www.deine-domain.at"` und `"customDomain": "www.deine-domain.at"`
   - ohne eigene Domain: `"siteUrl": "https://BENUTZERNAME.github.io"` (bei Projekt-Repo zusätzlich `"basePath": "/REPONAME"`)
5. Jede Änderung im Repo baut die Seite automatisch neu (Tab „Actions“).
6. Eigene Domain: beim Domain-Anbieter einen CNAME-Eintrag auf `BENUTZERNAME.github.io` setzen, danach in Settings → Pages „Enforce HTTPS“ aktivieren.

## Bilder einfügen

Ohne Bilder zeigt der Shop Platzhalter-Kacheln mit Symbol. So kommen echte Fotos dazu:

- Produktfotos: `src/assets/img/produkte/<name>.webp` (oder `.jpg`/`.png`). Die genauen Namen stehen in `docs/bildnamen.txt`. Empfohlen: 4:3, ca. 1200 × 900 px, WebP, unter 200 KB.
- Alt-Texte sind automatisch gesetzt („Name – Kategorie von Timestyle_Gravur“). Bessere Beschreibungen: in `data/produkte.json` als `{ "alt": "…" }` ergänzen.
- Logo: `src/assets/img/logo.svg` (oder `.png`) ablegen, ersetzt das Platzhalter-Zeichen.
- Teamfoto: `src/assets/img/team/manuel-jarc.webp`
- Galerie (Seite Kundenstimmen): Bilder in `src/assets/img/galerie/`, Alt-Texte in `data/galerie-alt.json` als `{ "dateiname.webp": "Beschreibung" }`. Ohne Bilder entfällt der Abschnitt.
- Anfahrtsbild: `src/assets/img/anfahrt.webp`
- PDF-Anleitungen (IQ Game, Autodartsring): in `src/downloads/` mit den Namen aus `data/produkte.json` ablegen, der Download-Link erscheint dann automatisch.
- Social-Vorschaubild: `src/assets/img/og-image.png` (1200 × 630) ist ein Platzhalter aus Schriftzug und Verlauf, gern durch ein Produktfoto ersetzen.

## Vor dem Livegang klären (wichtig)

1. **Impressum** ergänzen/prüfen lassen: Die alte Seite nannte keine Rechtsform, keine UID bzw. keinen Kleinunternehmer-Hinweis, keine Kammer/Behörde. Die „Nummer 359103055“ ist ohne Bezeichnung übernommen worden. Prüfung z. B. über den Rechtsservice der WKO.
2. **Datenschutzerklärung** ist ein Entwurf (Hosting GitHub Pages, keine Cookies/Tracker). Rechtlich prüfen lassen, besonders den Hosting-Abschnitt.
3. **Ortsname**: In `site.config.json` steht „Sieghartskirchen“. Die alte Seite schrieb „Sieghartkirchen“. Bitte gegen die amtliche Anschrift prüfen.
4. **Marken im Sortiment**: Artikel mit Harry Potter, Super Mario, Pokémon, Minecraft, Chanel, NASA usw. sind im Datenfeld mit `"ip": 1` markiert. Fremde Marken und Figuren können Rechte Dritter berühren. Mit `"ipArtikelAnzeigen": false` in `site.config.json` lassen sie sich komplett ausblenden.
5. **GitHub-Pages-Regeln**: GitHub schließt in seiner Dokumentation Websites aus, die vorwiegend dem Abwickeln von Geschäften dienen (Online-Shop). Diese Seite wickelt nichts ab (Anfrage per E-Mail), liegt aber nah an der Grenze. Der Build ist hostingneutral: `dist/` lässt sich ohne Änderung auch bei Cloudflare Pages oder Netlify veröffentlichen.
6. **Textentscheidungen**: Der Satz „hobbymäßig als DIY-Projekt“ aus der alten Über-uns-Seite ist weggelassen (passt nicht zur Gewerbeangabe). Anrede ist neutral gehalten. Kategorie „Weihnachten“ ist leer und zeigt einen Hinweis.
7. **Korrekturen gegenüber der alten Seite**: „Wüfellampe“ → „Würfellampe“, „Regalhacken“ → „Regalhaken“. Doppelte Namen unterscheidbar gemacht (Tischdeko mit Glas (8 €)/(6 €), IQ Game Sticks (Variante 1/2)). Alle anderen Namen und Preise unverändert.

## Nach dem Livegang (Sichtbarkeit in Google)

1. Domain in der Google Search Console als „Domain“-Property bestätigen (DNS-TXT-Eintrag), `sitemap.xml` einreichen.
2. **Google-Unternehmensprofil** anlegen bzw. Website dort eintragen. Für lokale Suchen („Lasergravur Tulln“) bringt das meist mehr als alles an der Website.
3. Die alte Google-Sites-Seite kann keine Weiterleitung setzen. Sie sollte eine Weile online bleiben und später auf die neue Adresse verweisen oder deaktiviert werden.
4. Google-Unternehmensprofil, Facebook, Instagram: überall dieselbe Schreibweise von Name, Adresse, Telefon.
5. Ergebnis prüfen: Rich-Results-Test (Schema.org-Daten) und PageSpeed Insights.

## Technische Eigenschaften

- Pro Seite eigener Title, Description, Canonical, Open-Graph/Twitter-Tags, JSON-LD (LocalBusiness, WebSite, Breadcrumbs).
- `sitemap.xml`, `robots.txt`, 404-Seite, Manifest, Favicon.
- Alt-Texte für alle Bilder, ein `<h1>` pro Seite, Tastaturbedienung, Fokusrahmen, „Zum Inhalt springen“, `prefers-reduced-motion` wird beachtet.
- Keine externen Schriften oder Skripte (DSGVO, Ladezeit). Systemschrift: SF Pro auf Apple-Geräten, Segoe UI auf Windows.
- Der Build-Lauf meldet fehlende Alt-Texte, mehrfache H1 und zu lange Titel/Descriptions.
