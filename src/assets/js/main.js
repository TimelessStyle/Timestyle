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

  /* Anfrage-Liste (lokal im Browser, localStorage) */
  var KEY = 'tsg-anfrage-v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* privat/blockiert */ } syncBadge(list); }
  function count(list) { return list.reduce(function (n, i) { return n + i.qty; }, 0); }
  function syncBadge(list) {
    var n = count(list || load());
    $$('[data-cart-count]').forEach(function (b) { b.textContent = n; b.setAttribute('data-empty', n ? 'false' : 'true'); });
  }
  syncBadge();

  $$('.add').forEach(function (b) {
    b.addEventListener('click', function () {
      var list = load(), id = b.getAttribute('data-id'), it = list.filter(function (x) { return x.id === id; })[0];
      if (it) it.qty += 1; else list.push({ id: id, name: b.getAttribute('data-name'), price: b.getAttribute('data-price'), qty: 1 });
      save(list);
      var old = b.textContent; b.textContent = 'Hinzugefügt ✓'; b.classList.add('done');
      setTimeout(function () { b.textContent = old; b.classList.remove('done'); }, 1500);
    });
  });

  var cartRoot = $('#cart-root');
  if (cartRoot) {
    var CONF = JSON.parse(cartRoot.getAttribute('data-conf'));
    var listEl = $('#cart-items'), emptyEl = $('#cart-empty'), formEl = $('#cart-form'), status = $('#cart-status');
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    function render() {
      var list = load();
      emptyEl.hidden = list.length > 0; formEl.hidden = list.length === 0; listEl.hidden = list.length === 0;
      listEl.innerHTML = list.map(function (i) {
        return '<li class="cart-item"><div><b>' + esc(i.name) + '</b><small>' + esc(i.price) + '</small></div>' +
          '<div class="qty" role="group" aria-label="Menge für ' + esc(i.name) + '"><button type="button" data-act="dec" data-id="' + esc(i.id) + '" aria-label="Menge verringern">−</button><span aria-live="polite">' + i.qty + '</span><button type="button" data-act="inc" data-id="' + esc(i.id) + '" aria-label="Menge erhöhen">+</button></div>' +
          '<button type="button" class="rm" data-act="rm" data-id="' + esc(i.id) + '">Entfernen</button></li>';
      }).join('');
    }
    listEl.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]'); if (!t) return;
      var list = load(), id = t.getAttribute('data-id'), act = t.getAttribute('data-act');
      list = list.map(function (i) { if (i.id === id) { if (act === 'inc') i.qty += 1; if (act === 'dec') i.qty -= 1; if (act === 'rm') i.qty = 0; } return i; }).filter(function (i) { return i.qty > 0; });
      save(list); render();
    });
    function buildText() {
      var f = new FormData(formEl), list = load();
      var lines = ['Hallo Timestyle_Gravur,', '', 'ich interessiere mich für folgende Artikel / Leistungen:', ''];
      list.forEach(function (i) { lines.push('• ' + i.qty + ' × ' + i.name + ' (' + i.price + ')'); });
      lines.push('', 'Hinweis: Alle Preise sind Richtwerte (ab-Preise).', '');
      if (f.get('nachricht')) lines.push('Nachricht / Wünsche:', f.get('nachricht'), '');
      lines.push('Name: ' + (f.get('name') || ''), 'E-Mail: ' + (f.get('email') || ''), 'Telefon: ' + (f.get('telefon') || ''), '', 'Freundliche Grüße');
      return lines.join('\n');
    }
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      var subject = 'Anfrage über die Website';
      window.location.href = 'mailto:' + CONF.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(buildText());
      status.textContent = 'Das E-Mail-Programm wird geöffnet. Falls nichts passiert: Text kopieren und manuell an ' + CONF.email + ' senden.';
    });
    $('#cart-copy').addEventListener('click', function () {
      var txt = buildText();
      var done = function () { status.textContent = 'Text kopiert. In eine E-Mail an ' + CONF.email + ' einfügen.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { status.textContent = 'Kopieren nicht möglich. Bitte Text manuell übernehmen.'; });
      else { var ta = doc.createElement('textarea'); ta.value = txt; doc.body.appendChild(ta); ta.select(); try { doc.execCommand('copy'); done(); } catch (er) { status.textContent = 'Kopieren nicht möglich.'; } ta.remove(); }
    });
    $('#cart-clear').addEventListener('click', function () { save([]); render(); status.textContent = ''; });
    render();
  }

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
