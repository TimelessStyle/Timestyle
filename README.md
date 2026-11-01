# Timestyle_Gravur – Website mit Webshop

Handgeschriebene, statische Website (HTML/CSS/JS, keine Frameworks, keine Cookies, keine Tracker, keine externen Schriften).
Ein Build-Skript (`node build.mjs`) erzeugt aus den Datendateien alle Seiten nach `dist/`.

## Seiten

Startseite (Laser-Animation, Sortiment-Karussell) · Leistungen & Preise · Shop (99 Artikel) · Warenkorb & Bestellung · Über uns · Kundenstimmen · Kontakt (mit Kontaktformular) · Versand & Zahlung · Widerruf · AGB · Impressum · Datenschutz · 404

## Struktur

| Pfad | Inhalt |
|---|---|
| `site.config.json` | Firmendaten, Öffnungszeiten, Domain, Versandpauschale, Formular-Dienst |
| `data/produkte.json` | Shop-Artikel: `[Name, Preis in €, Optionen]` |
| `data/preise.json` | Preislisten (Leistungen & Preise) |
| `data/stimmen.json` | Kundenstimmen |
| `src/assets/css/style.css` | Design (Farben, Holz, Gold, Silber als Variablen oben) |
| `src/assets/js/main.js` | Warenkorb, Bestellung, Formulare, Karussell, Filter |
| `src/assets/js/hero-laser.js` | Laser-Animation im Hero |
| `src/assets/img/` | Bilder |
| `docs/inhaltsinventar.md` | Auszug der alten Google-Sites-Seite |
| `docs/bildnamen.txt` | Dateinamen für Produktfotos (wird beim Build erzeugt) |

## Wie der Shop funktioniert

- Kunden legen Artikel in den Warenkorb (bleibt im Browser), wählen Abholung oder Versand sowie Vorkasse oder Barzahlung bei Abholung und klicken **„Zahlungspflichtig bestellen“**.
- **Es gibt keine Online-Bezahlung.** Die Bestellung kommt als Text bei dir an. Du bestätigst per E-Mail und schickst die Zahlungsdaten (so steht es in AGB und auf der Bestätigungsseite).
- Zustellung der Bestellung, zwei Wege:
  1. **Ohne Einrichtung:** Der Button öffnet das E-Mail-Programm des Kunden mit fertigem Bestelltext. Erst das Absenden löst die Bestellung aus. Schwäche: Kunden ohne eingerichtetes Mailprogramm (viele am Handy) kommen nicht weiter. Es gibt einen Knopf „Bestelltext kopieren“ als Ausweg.
  2. **Empfohlen: Formular-Dienst.** Bestellung und Kontaktformular werden direkt zugestellt, ohne Mailprogramm. Kostenloses Konto z. B. bei Web3Forms (`https://api.web3forms.com/submit`, Access-Key aus dem Konto) oder Formspree (Endpunkt-URL aus dem Konto). In `site.config.json` eintragen: `formEndpoint`, bei Web3Forms zusätzlich `formAccessKey`, und `formDienst` mit dem Namen (erscheint in der Datenschutzerklärung). Datenschutz mit dem Anbieter prüfen (Auftragsverarbeitung).
- **Versand:** `versandPauschale` (Zahl in Euro) in `site.config.json` setzen. Solange sie `null` ist, bietet der Shop nur Abholung an.
- **Preise:** Die Zahlen in `data/produkte.json` sind vorerst die bisherigen „ab“-Preise als Festpreis der Standardausführung. Anpassen: Zahl ändern, neu bauen. Varianten (z. B. Klein/Groß) über `"varianten": [["Klein", 6], ["Groß", 12]]`.
- **Kleinunternehmer:** `kleinunternehmer: true` blendet den Hinweis nach § 6 Abs. 1 Z 27 UStG im Warenkorb, in den AGB und im Impressum ein. Bei `false` erscheint „inkl. Umsatzsteuer“.

## Instagram Shop und TikTok Shop (später)

- Die Produktdaten liegen strukturiert vor (Name, fester Preis, Kategorie, Bild-Slug). Für beide Kanäle werden zusätzlich gebraucht: **Produktfotos, Beschreibungen** (`"beschreibung"` in den Optionen eines Artikels), feste Preise.
- **Instagram:** Seit Juni 2025 läuft der Kauf bei Instagram- und Facebook-Shops über die eigene Website. Dafür braucht es Business-Konto, Facebook-Seite, Commerce Manager und einen Produkt-Feed (CSV/XML). Ein Feed-Export lässt sich aus `data/produkte.json` ergänzen, sobald Fotos und Beschreibungen vorhanden sind.
- **TikTok Shop** ist seit 15. Juni 2026 in Österreich verfügbar. Registrierung im Seller Center. Dort laufen Zahlung und Abwicklung innerhalb von TikTok, das ist ein eigener Verkaufskanal neben dieser Website.
- Bei echten Online-Zahlungen und Social-Shop-Abgleich lohnt ein Shop-System (z. B. Shopify oder WooCommerce). Diese Seite ist dafür vorbereitet, ersetzt es aber nicht.

## Lokal ansehen

```
node build.mjs
npx serve dist
```
Automatischer Test (Seiten, Warenkorb, Formulare, Laser): `npm i -D playwright`, dann `node tools/qa.mjs`.

## Veröffentlichen auf GitHub Pages

1. Öffentliches Repository, Inhalt hochladen, Settings → Pages → Source: **GitHub Actions**.
2. `site.config.json`: `siteUrl` (z. B. `https://BENUTZERNAME.github.io`), `basePath` leer lassen, wenn das Repo `BENUTZERNAME.github.io` heißt, sonst `"/REPONAME"`.
3. Jede Änderung im Repo baut die Seite automatisch neu (Tab „Actions“).
4. Eigene Domain später: `customDomain` und `siteUrl` setzen, beim Domain-Anbieter einen CNAME-Eintrag auf `BENUTZERNAME.github.io` anlegen, in Settings → Pages „Enforce HTTPS“ aktivieren.

**Hinweis zu den GitHub-Regeln:** GitHub Pages ist laut Dokumentation nicht für Websites gedacht, die vorwiegend Geschäfte abwickeln. Mit Warenkorb und Bestellfunktion liegt diese Seite näher an dieser Grenze als vorher. Der Build ist hostingneutral: `dist/` lässt sich ohne Änderung auch bei Cloudflare Pages oder Netlify veröffentlichen (deren Bedingungen separat prüfen).

## Bilder

Ohne Bilder zeigt der Shop Platzhalter-Kacheln.

- Produktfotos: `src/assets/img/produkte/<name>.webp` (oder `.jpg`/`.png`), Namen siehe `docs/bildnamen.txt`. Empfohlen 4:3, ca. 1200 × 900 px, unter 200 KB. Alt-Texte setzt der Build automatisch („Name – Kategorie von Timestyle_Gravur“), bessere Texte über `"alt"` in `data/produkte.json`.
- Logo: `src/assets/img/logo.svg` (oder `.png`).
- Teamfoto: `src/assets/img/team/manuel-jarc.webp`. Anfahrtsbild: `src/assets/img/anfahrt.webp`.
- Galerie (Kundenstimmen): Bilder in `src/assets/img/galerie/`, Alt-Texte in `data/galerie-alt.json` als `{ "datei.webp": "Beschreibung" }`.
- PDF-Anleitungen (IQ Game, Autodartsring): in `src/downloads/`, Namen siehe `data/produkte.json`.
- Social-Vorschau: `src/assets/img/og-image.png` (1200 × 630) ist ein Platzhalter.

## Vor dem Livegang klären (wichtig)

1. **Rechtstexte sind Entwürfe**: Impressum, Datenschutz, AGB, Widerrufsbelehrung, Versand & Zahlung. Mit Online-Bestellung gelten für Verbraucher zusätzliche Informationspflichten (u. a. Button „zahlungspflichtig bestellen“, Widerrufsbelehrung). Bitte rechtlich prüfen lassen (z. B. WKO-Rechtsservice). Offen im Impressum: Rechtsform, Kammer/Behörde, Bedeutung der „Nummer 359103055“.
2. **Lieferzeit und Zahlungsdetails** (IBAN, Fristen) sind bewusst nicht erfunden. Die Seiten verweisen auf die Bestellbestätigung per E-Mail. Das setzt voraus, dass jede Bestellung tatsächlich bestätigt wird.
3. **Produktsicherheit:** Bei Spielwaren und Kleinteilen gelten Kennzeichnungs- und Sicherheitsvorschriften (u. a. EU-Spielzeugrichtlinie, Kennzeichnung mit Anschrift). Das ist nicht geprüft.
4. **Ortsname**: In `site.config.json` steht „Sieghartskirchen“. Die alte Seite schrieb „Sieghartkirchen“. Bitte gegen die amtliche Anschrift prüfen.
5. **Marken im Sortiment**: Artikel mit Harry Potter, Super Mario, Pokémon, Minecraft, Chanel, NASA usw. sind mit `"ip": 1` markiert. Mit `"ipArtikelAnzeigen": false` lassen sie sich ausblenden. Keine rechtliche Bewertung.
6. **Texte gegenüber der alten Seite**: „Hobby/DIY“ weggelassen, Einleitungsfrage der Startseite neu formuliert, „Würfellampe“ und „Regalhaken“ korrigiert, doppelte Artikelnamen unterscheidbar gemacht.
7. **Weihnachten**: Die Kategorie ist leer und zeigt einen Hinweis.

## Nach dem Livegang (Sichtbarkeit in Google)

1. Search Console: Property anlegen, `sitemap.xml` einreichen.
2. **Google-Unternehmensprofil** anlegen und die Website eintragen. Für lokale Suchen („Lasergravur Tulln“) meist wirksamer als alles an der Seite.
3. Die alte Google-Sites-Seite kann nicht weiterleiten: eine Weile online lassen, später auf die neue Adresse verweisen oder deaktivieren.
4. Name, Adresse, Telefon überall gleich schreiben (Website, Google, Facebook, Instagram).
5. Rich-Results-Test und PageSpeed Insights prüfen.
