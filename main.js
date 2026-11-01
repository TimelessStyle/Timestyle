/* Timestyle_Gravur – Interaktion. Reines JavaScript, keine Bibliotheken, keine Cookies, keine Tracker. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* Navigation */
  var nav = $('.nav');
  var onScrollNav = function () { if (nav) nav.classList.toggle('scrolled', window.scrollY > 10); };
  onScrollNav();
  var btn = $('.menu-btn');
  if (btn) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('menu-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { nav.classList.remove('menu-open'); btn.setAttribute('aria-expanded', 'false'); } });
    $$('.nav-links a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('menu-open'); btn.setAttribute('aria-expanded', 'false'); }); });
  }

  /* Reveal beim Scrollen */
  var rev = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    rev.forEach(function (el) { io.observe(el); });
  } else { rev.forEach(function (el) { el.classList.add('in'); }); }

  /* Parallax + Scroll-Effekte (ein rAF-Loop) */
  var parts = $$('[data-speed]');
  var hero = $('.hero');
  var heroIn = $('.hero-in');
  var board = $('.board');
  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    onScrollNav();
    if (!reduce) {
      parts.forEach(function (el) {
        var host = el.closest('.section, .hero, .page-hero') || el.parentElement;
        var r = host.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var s = parseFloat(el.getAttribute('data-speed')) || 0;
        el.style.transform = 'translate3d(0,' + (-(r.top) * s).toFixed(1) + 'px,0)';
      });
      if (hero && heroIn) {
        var p = Math.min(1, Math.max(0, y / (vh * .7)));
        heroIn.style.opacity = String(1 - p * .9);
        heroIn.style.transform = 'translate3d(0,' + (p * -40).toFixed(1) + 'px,0) scale(' + (1 - p * .05).toFixed(3) + ')';
        if (board) { var q = Math.min(1, Math.max(0, y / (vh * .55))); board.style.setProperty('--p', q.toFixed(3)); }
      }
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  frame();
  if (board && reduce) board.style.setProperty('--p', '1');
  else if (board) board.style.setProperty('--p', '0');

  /* 3D-Neigung der Kacheln (nur Maus) */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    $$('.tile').forEach(function (t) {
      t.addEventListener('pointermove', function (e) {
        var r = t.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        t.style.setProperty('--ry', (x * 6).toFixed(2) + 'deg');
        t.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg');
      });
      t.addEventListener('pointerleave', function () { t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); });
    });
  }

  /* Story: aktiver Schritt */
  var steps = $$('.step'), glyphs = $$('.story-card .glyph'), numEl = $('.story-card .num');
  if (steps.length && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          var i = steps.indexOf(e.target);
          steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
          glyphs.forEach(function (g, k) { g.classList.toggle('on', k === i); });
          if (numEl) numEl.textContent = '0' + (i + 1);
        }
      });
    }, { rootMargin: '-42% 0px -42% 0px' });
    steps.forEach(function (s) { so.observe(s); });
    steps[0].classList.add('on'); if (glyphs[0]) glyphs[0].classList.add('on');
  } else { steps.forEach(function (s) { s.classList.add('on'); }); glyphs.forEach(function (g, k) { g.classList.toggle('on', k === 0); }); }

  /* Zahlen hochzählen */
  $$('[data-count]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10), suffix = el.getAttribute('data-suffix') || '';
    var start = parseInt(el.getAttribute('data-from') || '0', 10);
    if (reduce || !('IntersectionObserver' in window)) { el.textContent = target + suffix; return; }
    var o = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; o.disconnect();
      var t0 = performance.now(), dur = 1400;
      (function tick(t) {
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
        el.textContent = Math.round(start + (target - start) * e) + suffix;
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: .6 });
    o.observe(el);
  });

  /* Geöffnet / Geschlossen (Zeitzone Wien) */
  var openEl = $('.open-now');
  if (openEl) {
    try {
      var hours = JSON.parse(openEl.getAttribute('data-hours'));
      var parts2 = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Vienna', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }, wd = 0, hh = 0, mm = 0;
      parts2.forEach(function (p) { if (p.type === 'weekday') wd = map[p.value]; if (p.type === 'hour') hh = parseInt(p.value, 10) % 24; if (p.type === 'minute') mm = parseInt(p.value, 10); });
      var now = hh * 60 + mm, h = hours[wd], isOpen = h && now >= h[0] && now < h[1];
      var fmt = function (m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
      openEl.setAttribute('data-open', isOpen ? 'true' : 'false');
      openEl.textContent = isOpen ? 'Jetzt geöffnet – bis ' + fmt(h[1]) + ' Uhr' : 'Derzeit geschlossen';
      $$('.hours tr').forEach(function (tr) { var d = (tr.getAttribute('data-days') || '').split(','); if (d.indexOf(String(wd)) > -1) tr.classList.add('today'); });
    } catch (err) { /* Anzeige bleibt neutral */ }
  }

  /* ---------- Warenkorb (lokal im Browser, localStorage) ---------- */
  var KEY = 'tsg-cart-v2';
  var eur = function (n) { return n.toFixed(2).replace('.', ',') + ' €'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* privater Modus */ } syncBadge(list); }
  function count(list) { return list.reduce(function (n, i) { return n + i.qty; }, 0); }
  function syncBadge(list) {
    var n = count(list || load());
    $$('[data-cart-count]').forEach(function (b) { b.textContent = n; b.setAttribute('data-empty', n ? 'false' : 'true'); });
  }
  syncBadge();

  $$('.add').forEach(function (b) {
    b.addEventListener('click', function () {
      var card = b.closest('.pcard'), sel = card && card.querySelector('select.var');
      var id = b.getAttribute('data-id'), name = b.getAttribute('data-name'), price = parseFloat(b.getAttribute('data-price')), variant = '';
      if (sel) { var o = sel.options[sel.selectedIndex]; variant = o.getAttribute('data-label'); price = parseFloat(o.getAttribute('data-price')); }
      var list = load(), key = id + '|' + variant, it = list.filter(function (x) { return x.key === key; })[0];
      if (it) it.qty += 1; else list.push({ key: key, id: id, name: name, variant: variant, price: price, unit: b.getAttribute('data-unit') || '', qty: 1 });
      save(list);
      var old = b.textContent; b.textContent = 'Im Warenkorb ✓'; b.classList.add('done');
      setTimeout(function () { b.textContent = old; b.classList.remove('done'); }, 1500);
    });
  });
  $$('select.var').forEach(function (sel) {
    sel.addEventListener('change', function () {
      var o = sel.options[sel.selectedIndex], p = sel.closest('.pcard').querySelector('.pprice');
      if (p) p.textContent = eur(parseFloat(o.getAttribute('data-price')));
    });
  });

  /* ---------- Versand von Formularen: Formular-Dienst oder E-Mail-Programm ---------- */
  function sendMessage(conf, p, ok, fail) {
    if (conf.endpoint) {
      var fd = new FormData();
      fd.append('subject', p.subject); fd.append('name', p.name); fd.append('email', p.email); fd.append('message', p.message);
      if (conf.key) fd.append('access_key', conf.key);
      fetch(conf.endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: fd })
        .then(function (r) { if (!r.ok) throw new Error('http'); return r.json().catch(function () { return {}; }); })
        .then(function (j) { if (j && j.success === false) throw new Error('rejected'); ok('service'); })
        .catch(function () { fail(); });
    } else {
      window.location.href = 'mailto:' + conf.email + '?subject=' + encodeURIComponent(p.subject) + '&body=' + encodeURIComponent(p.message);
      ok('mailto');
    }
  }
  function copyText(txt, done, fail) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fail);
    else { var ta = doc.createElement('textarea'); ta.value = txt; doc.body.appendChild(ta); ta.select(); try { doc.execCommand('copy'); done(); } catch (er) { fail(); } ta.remove(); }
  }

  /* ---------- Warenkorbseite + Bestellung ---------- */
  var cartRoot = $('#cart-root');
  if (cartRoot) {
    var CONF = JSON.parse(cartRoot.getAttribute('data-conf'));
    var listEl = $('#cart-items'), emptyEl = $('#cart-empty'), formEl = $('#order-form'), sumEl = $('#cart-sum'), status = $('#order-status'), doneEl = $('#order-done');
    var shipRadios = $$('input[name="lieferart"]', formEl), addrBox = $('#addr-box'), payCash = $('#pay-cash');
    function shipMode() { var c = shipRadios.filter(function (r) { return r.checked; })[0]; return c ? c.value : 'abholung'; }
    function totals() {
      var list = load(), sub = list.reduce(function (n, i) { return n + i.price * i.qty; }, 0);
      var ship = (shipMode() === 'versand' && CONF.versand != null) ? CONF.versand : 0;
      return { list: list, sub: sub, ship: ship, total: sub + ship };
    }
    function render() {
      var t = totals(), has = t.list.length > 0;
      emptyEl.hidden = has; formEl.hidden = !has; listEl.hidden = !has; sumEl.hidden = !has;
      listEl.innerHTML = t.list.map(function (i) {
        return '<li class="cart-item"><div><b>' + esc(i.name) + '</b><small>' + (i.variant ? esc(i.variant) + ' · ' : '') + eur(i.price) + (i.unit ? ' ' + esc(i.unit) : '') + '</small></div>' +
          '<div class="qty" role="group" aria-label="Menge für ' + esc(i.name) + '"><button type="button" data-act="dec" data-key="' + esc(i.key) + '" aria-label="Menge verringern">−</button><span aria-live="polite">' + i.qty + '</span><button type="button" data-act="inc" data-key="' + esc(i.key) + '" aria-label="Menge erhöhen">+</button></div>' +
          '<button type="button" class="rm" data-act="rm" data-key="' + esc(i.key) + '">Entfernen</button></li>';
      }).join('');
      sumEl.innerHTML = '<div><span>Zwischensumme</span><span>' + eur(t.sub) + '</span></div>' +
        '<div><span>' + (shipMode() === 'versand' ? 'Versand (Österreich)' : 'Abholung vor Ort') + '</span><span>' + (t.ship ? eur(t.ship) : 'kostenlos') + '</span></div>' +
        '<div class="grand"><span>Gesamtbetrag</span><span>' + eur(t.total) + '</span></div>' +
        (CONF.klein ? '<p class="note-s">Umsatzsteuerbefreit aufgrund der Kleinunternehmerregelung (§ 6 Abs. 1 Z 27 UStG).</p>' : '<p class="note-s">Alle Preise inkl. gesetzlicher Umsatzsteuer.</p>');
      var v = shipMode() === 'versand';
      addrBox.hidden = !v; $$('input', addrBox).forEach(function (i) { i.required = v; });
      if (payCash) { payCash.disabled = v; if (v && payCash.checked) $('#pay-pre').checked = true; }
    }
    listEl.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]'); if (!t) return;
      var key = t.getAttribute('data-key'), act = t.getAttribute('data-act');
      var list = load().map(function (i) { if (i.key === key) { if (act === 'inc') i.qty += 1; if (act === 'dec') i.qty -= 1; if (act === 'rm') i.qty = 0; } return i; }).filter(function (i) { return i.qty > 0; });
      save(list); render();
    });
    shipRadios.forEach(function (r) { r.addEventListener('change', render); });

    function orderText(no) {
      var f = new FormData(formEl), t = totals(), L = [];
      L.push('BESTELLUNG ' + no, '');
      t.list.forEach(function (i) { L.push(i.qty + ' × ' + i.name + (i.variant ? ' (' + i.variant + ')' : '') + ' – ' + eur(i.price) + (i.unit ? ' ' + i.unit : '') + ' = ' + eur(i.price * i.qty)); });
      L.push('', 'Zwischensumme: ' + eur(t.sub), (shipMode() === 'versand' ? 'Versand Österreich: ' + eur(t.ship) : 'Abholung vor Ort: kostenlos'), 'Gesamtbetrag: ' + eur(t.total));
      L.push('', 'Zahlungsart: ' + (f.get('zahlung') === 'bar' ? 'Barzahlung bei Abholung' : 'Vorkasse per Überweisung'));
      L.push('', 'KUNDE', 'Name: ' + f.get('vorname') + ' ' + f.get('nachname'), 'E-Mail: ' + f.get('email'), 'Telefon: ' + (f.get('telefon') || '–'));
      if (shipMode() === 'versand') L.push('Lieferadresse: ' + f.get('strasse') + ', ' + f.get('plz') + ' ' + f.get('ort') + ', ' + CONF.land);
      if (f.get('nachricht')) L.push('', 'Anmerkung: ' + f.get('nachricht'));
      L.push('', 'AGB, Datenschutzerklärung und Widerrufsbelehrung wurden akzeptiert bzw. zur Kenntnis genommen.');
      return L.join('\n');
    }
    function newNo() { var d = new Date(); return 'TSG-' + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + Math.floor(1000 + Math.random() * 9000); }
    var lastText = '';
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!formEl.reportValidity()) return;
      if (formEl.querySelector('[name="website"]').value) return; // Honeypot
      var f = new FormData(formEl), no = newNo(); lastText = orderText(no);
      var btn = $('#order-btn'); btn.disabled = true; status.textContent = 'Bestellung wird übermittelt …';
      sendMessage(CONF, { subject: 'Bestellung ' + no, name: f.get('vorname') + ' ' + f.get('nachname'), email: f.get('email'), message: lastText }, function (mode) {
        btn.disabled = false;
        if (mode === 'mailto') { status.textContent = 'Das E-Mail-Programm wurde geöffnet. Die Bestellung gilt erst, wenn die E-Mail abgeschickt ist. Falls nichts passiert, „Bestelltext kopieren“ wählen und an ' + CONF.email + ' senden.'; }
        else { save([]); formEl.hidden = true; listEl.hidden = true; sumEl.hidden = true; emptyEl.hidden = true; doneEl.hidden = false; $('#order-no').textContent = no; window.scrollTo({ top: 0 }); }
      }, function () { btn.disabled = false; status.textContent = 'Die Bestellung konnte nicht übermittelt werden. Bitte „Bestelltext kopieren“ wählen und per E-Mail an ' + CONF.email + ' senden.'; lastText = lastText || orderText(no); });
    });
    $('#order-copy').addEventListener('click', function () {
      var txt = lastText || orderText(newNo());
      copyText(txt, function () { status.textContent = 'Bestelltext kopiert. In eine E-Mail an ' + CONF.email + ' einfügen.'; }, function () { status.textContent = 'Kopieren nicht möglich.'; });
    });
    $('#cart-clear').addEventListener('click', function () { save([]); render(); status.textContent = ''; });
    render();
  }

  /* ---------- Kontaktformular ---------- */
  var cf = $('#contact-form');
  if (cf) {
    var CC = JSON.parse(cf.getAttribute('data-conf')), cs = $('#contact-status');
    function contactText() { var f = new FormData(cf); return ['Thema: ' + f.get('thema'), 'Name: ' + f.get('name'), 'E-Mail: ' + f.get('email'), 'Telefon: ' + (f.get('telefon') || '–'), '', f.get('nachricht')].join('\n'); }
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!cf.reportValidity() || cf.querySelector('[name="website"]').value) return;
      var f = new FormData(cf), btn = $('button[type="submit"]', cf); btn.disabled = true; cs.textContent = 'Wird gesendet …';
      sendMessage(CC, { subject: 'Anfrage: ' + f.get('thema'), name: f.get('name'), email: f.get('email'), message: contactText() }, function (mode) {
        btn.disabled = false;
        cs.textContent = mode === 'mailto' ? 'Das E-Mail-Programm wurde geöffnet. Bitte dort auf „Senden“ klicken. Falls nichts passiert: „Text kopieren“ und an ' + CC.email + ' senden.' : 'Danke, die Nachricht ist angekommen. Die Antwort kommt per E-Mail.';
        if (mode !== 'mailto') cf.reset();
      }, function () { btn.disabled = false; cs.textContent = 'Senden war nicht möglich. Bitte „Text kopieren“ wählen und per E-Mail an ' + CC.email + ' schicken.'; });
    });
    $('#contact-copy').addEventListener('click', function () {
      copyText(contactText(), function () { cs.textContent = 'Text kopiert. In eine E-Mail an ' + CC.email + ' einfügen.'; }, function () { cs.textContent = 'Kopieren nicht möglich.'; });
    });
  }

  /* ---------- Karussell (Sortiment) ---------- */
  $$('.carousel').forEach(function (car) {
    var track = $('.chips-scroll', car), prev = $('.car-btn.prev', car), next = $('.car-btn.next', car);
    function upd() {
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2; next.disabled = track.scrollLeft >= max;
      car.classList.toggle('can-prev', !prev.disabled); car.classList.toggle('can-next', !next.disabled);
    }
    var step = function () { return Math.max(240, track.clientWidth * .8); };
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
    track.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
    track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { track.scrollBy({ left: 220, behavior: 'smooth' }); } if (e.key === 'ArrowLeft') { track.scrollBy({ left: -220, behavior: 'smooth' }); } });
    // Ziehen mit der Maus
    var down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; track.classList.add('drag'); });
    window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; track.scrollLeft = sl - dx; });
    window.addEventListener('pointerup', function () { if (!down) return; down = false; track.classList.remove('drag'); });
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  });

  /* Shop: Filter + Suche */
  var shop = $('#shop');
  if (shop) {
    var blocks = $$('.cat-block', shop), cards = $$('.pcard', shop), fbtns = $$('.filters button'), q = $('#shop-search'), none = $('#shop-none');
    var cat = 'alle';
    function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    function apply() {
      var term = norm(q.value.trim()), total = 0;
      cards.forEach(function (c) {
        var ok = (cat === 'alle' || c.getAttribute('data-cat') === cat) && (!term || norm(c.getAttribute('data-name')).indexOf(term) > -1);
        c.hidden = !ok; if (ok) total++;
      });
      blocks.forEach(function (b) {
        var visible = $$('.pcard', b).some(function (c) { return !c.hidden; });
        var empty = b.getAttribute('data-empty') === 'true';
        b.hidden = empty ? !(cat === 'alle' || cat === b.id) || !!term : !visible;
      });
      none.hidden = total > 0 || blocks.some(function (b) { return !b.hidden; });
    }
    fbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        cat = b.getAttribute('data-cat');
        fbtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        apply();
        if (cat !== 'alle') { var t = doc.getElementById(cat); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
      });
    });
    q.addEventListener('input', apply);
    if (location.hash) { var h = location.hash.slice(1), hb = fbtns.filter(function (b) { return b.getAttribute('data-cat') === h; })[0]; if (hb) { hb.click(); } }
  }
})();
