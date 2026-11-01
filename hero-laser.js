/* Hero: Lasergravur-Simulation auf Holz (Canvas 2D).
   Rasterlauf wie bei einer echten Gravur: Der Laser fährt zeilenweise hin und her, der Schriftzug wird
   verkohlt, glüht nach und kühlt ab. Dazu Funken, Rauch, Laserkopf mit Strahl. Läuft nur im sichtbaren Bereich. */
(function () {
  'use strict';
  var board = document.querySelector('.board');
  var cv = board && board.querySelector('canvas.laser');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TITLE = 'Timestyle_Gravur', SUB = 'LASERGRAVUR · LASERSCHNITT · 3D-DRUCK';

  var dpr, W, H, burnt, heatSrc, bc, bctx, hc, hctx, passes, fontFamily;
  var raf = 0, running = false, visible = false, played = false;
  var st, parts, smoke, last, slow = 0, lowPerf = false;

  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function drawSpaced(c, text, cx, y, spacing) {
    var widths = [], total = 0, i;
    for (i = 0; i < text.length; i++) { var w = c.measureText(text[i]).width; widths.push(w); total += w; }
    total += spacing * (text.length - 1);
    var x = cx - total / 2;
    c.textAlign = 'left';
    for (i = 0; i < text.length; i++) { c.fillText(text[i], x, y); x += widths[i] + spacing; }
    return total;
  }

  function setup() {
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    W = Math.round(board.clientWidth * dpr); H = Math.round(board.clientHeight * dpr);
    cv.width = W; cv.height = H;
    fontFamily = getComputedStyle(document.body).fontFamily;
    var m = mk(10, 10).getContext('2d');
    m.font = '800 100px ' + fontFamily;
    var tw100 = m.measureText(TITLE).width;
    var fp = Math.round(100 * (W * 0.72) / tw100);
    var subPx = Math.round(fp * 0.2);
    var cx = W / 2, baseY = Math.round(H * 0.52), subY = Math.round(baseY + fp * 0.62);

    // Masken zeichnen
    var tcv = mk(W, H), t = tcv.getContext('2d');
    t.textBaseline = 'alphabetic';
    t.font = '800 ' + fp + 'px ' + fontFamily; t.fillStyle = '#000'; t.textAlign = 'center';
    t.fillText(TITLE, cx, baseY);
    var tm = t.measureText(TITLE);
    var tb = { x0: cx - tm.width / 2 - 6, x1: cx + tm.width / 2 + 6, y0: baseY - tm.actualBoundingBoxAscent - 6, y1: baseY + tm.actualBoundingBoxDescent + 6 };
    t.font = '600 ' + subPx + 'px ' + fontFamily;
    var sw = drawSpaced(t, SUB, cx, subY, subPx * 0.38);
    var sb = { x0: cx - sw / 2 - 6, x1: cx + sw / 2 + 6, y0: subY - subPx * 0.85, y1: subY + subPx * 0.2 };

    // verkohlte Gravur: Randlicht (Fase), dunkler Kern mit Verlauf, Rauheit, weicher Brandhof
    burnt = mk(W, H);
    var b = burnt.getContext('2d');
    var layer = mk(W, H), l = layer.getContext('2d');
    l.drawImage(tcv, 0, 0);
    l.globalCompositeOperation = 'source-in';
    var g = l.createLinearGradient(0, tb.y0, 0, sb.y1);
    g.addColorStop(0, '#0f0703'); g.addColorStop(.55, '#1d0f06'); g.addColorStop(1, '#2a160a');
    l.fillStyle = g; l.fillRect(0, 0, W, H);
    l.globalCompositeOperation = 'source-atop';
    for (var i = 0; i < 900; i++) { l.fillStyle = 'rgba(' + (Math.random() < .5 ? '90,50,20' : '0,0,0') + ',' + rnd(.05, .22).toFixed(2) + ')'; l.fillRect(rnd(tb.x0, tb.x1), rnd(tb.y0, sb.y1), rnd(1, 3) * dpr, rnd(.6, 1.6) * dpr); }
    l.globalCompositeOperation = 'source-over';
    b.shadowColor = 'rgba(30,14,5,.55)'; b.shadowBlur = 9 * dpr;
    b.drawImage(layer, 0, 0);
    b.shadowColor = 'transparent'; b.shadowBlur = 0;
    // heller Rand unten rechts (Gravurkante)
    var rim = mk(W, H), r = rim.getContext('2d');
    r.drawImage(tcv, 0, 0); r.globalCompositeOperation = 'source-in'; r.fillStyle = 'rgba(255,214,160,.30)'; r.fillRect(0, 0, W, H);
    b.globalCompositeOperation = 'destination-over';
    b.drawImage(rim, 0.8 * dpr, 1.3 * dpr);
    b.globalCompositeOperation = 'source-over';

    // Glutlayer: Silhouette in Orange
    heatSrc = mk(W, H);
    var h = heatSrc.getContext('2d');
    h.drawImage(tcv, 0, 0); h.globalCompositeOperation = 'source-in';
    var hg = h.createLinearGradient(0, tb.y0, 0, tb.y1);
    hg.addColorStop(0, '#ffe7a0'); hg.addColorStop(.5, '#ff9a2e'); hg.addColorStop(1, '#e24a10');
    h.fillStyle = hg; h.fillRect(0, 0, W, H);

    bc = mk(W, H); bctx = bc.getContext('2d');
    hc = mk(W, H); hctx = hc.getContext('2d');

    var band = Math.max(3, Math.round(4.2 * dpr));
    passes = [
      { b: tb, band: band, rowMs: 150 },
      { b: sb, band: Math.max(2, Math.round(2.6 * dpr)), rowMs: 90 }
    ];
    passes.forEach(function (p) { p.rows = Math.ceil((p.b.y1 - p.b.y0) / p.band); p.ms = p.rows * p.rowMs; });
  }

  function reset() {
    bctx.clearRect(0, 0, W, H); hctx.clearRect(0, 0, W, H);
    st = { pass: 0, t: 0, phase: 'wait', wait: 700, row: -1, x: 0, y: 0, hx: W * .5, hy: -40 * dpr, dir: 1, done: false, doneAt: 0 };
    parts = []; smoke = []; last = 0; slow = 0;
  }

  function finalState() {
    bctx.clearRect(0, 0, W, H); bctx.drawImage(burnt, 0, 0);
    ctx.clearRect(0, 0, W, H); ctx.drawImage(bc, 0, 0);
  }

  function reveal(x0, x1, y0, h) {
    var a = Math.max(0, Math.floor(Math.min(x0, x1) - 2)), w = Math.ceil(Math.abs(x1 - x0) + 4);
    if (a + w > W) w = W - a; if (w <= 0) return;
    var yy = Math.max(0, Math.floor(y0)), hh = Math.min(H - yy, Math.ceil(h) + 1); if (hh <= 0) return;
    bctx.drawImage(burnt, a, yy, w, hh, a, yy, w, hh);
    hctx.drawImage(heatSrc, a, yy, w, hh, a, yy, w, hh);
  }

  function spawn(x, y, n) {
    for (var i = 0; i < n; i++) {
      var ang = rnd(-Math.PI * .95, -Math.PI * .05), sp = rnd(60, 360) * dpr;
      parts.push({ x: x, y: y, vx: Math.cos(ang) * sp + rnd(-60, 60) * dpr, vy: Math.sin(ang) * sp, life: 0, max: rnd(260, 820), s: rnd(.8, 2) * dpr });
    }
    if (parts.length > 260) parts.splice(0, parts.length - 260);
    if (!lowPerf && Math.random() < .55) smoke.push({ x: x + rnd(-6, 6) * dpr, y: y, vx: rnd(-14, 14) * dpr, vy: rnd(-34, -16) * dpr, life: 0, max: rnd(1500, 2800), r: rnd(5, 9) * dpr });
    if (smoke.length > 70) smoke.splice(0, smoke.length - 70);
  }

  function update(dt) {
    var p = passes[st.pass];
    if (st.phase === 'wait') {
      st.wait -= dt; if (st.wait <= 0) { st.phase = 'run'; st.t = 0; st.row = -1; }
      var tx = p.b.x0, ty = p.b.y0 - 10 * dpr;
      st.hx += (tx - st.hx) * Math.min(1, dt / 160); st.hy += (ty - st.hy) * Math.min(1, dt / 160);
      st.x = st.hx; st.y = st.hy; st.on = false; return;
    }
    if (st.phase === 'run') {
      st.t += dt;
      var rowF = st.t / p.rowMs, row = Math.floor(rowF), f = rowF - row;
      if (row >= p.rows) {
        st.on = false;
        if (st.pass + 1 < passes.length) { st.pass++; st.phase = 'wait'; st.wait = 260; }
        else { st.phase = 'cool'; st.doneAt = 0; }
        return;
      }
      var dir = (row % 2 === 0) ? 1 : -1;
      var ease = f < .08 ? f / .08 : (f > .92 ? (1 - f) / .08 : 1); // Beschleunigung an den Zeilenenden
      var span = p.b.x1 - p.b.x0, along = (dir === 1) ? f : 1 - f;
      var nx = p.b.x0 + span * along, ny = p.b.y0 + row * p.band + p.band / 2;
      var px = st.on ? st.x : nx;
      reveal(px, nx, ny - p.band / 2, p.band);
      // Spur: Funken entlang des Wegs
      spawn(nx, ny, lowPerf ? 1 : (Math.random() < .6 ? 2 : 1));
      st.x = nx; st.y = ny; st.on = ease > 0; st.hx = nx; st.hy = ny - 38 * dpr; st.row = row;
      return;
    }
    if (st.phase === 'cool') {
      st.doneAt += dt; st.on = false;
      st.hx += (W * .5 - st.hx) * Math.min(1, dt / 500); st.hy += (-60 * dpr - st.hy) * Math.min(1, dt / 500);
      if (st.doneAt > 3800) { st.done = true; }
    }
  }

  function glow(x, y, r, c0, c1) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    // Glut klingt ab
    hctx.globalCompositeOperation = 'destination-out';
    hctx.fillStyle = 'rgba(0,0,0,' + (1 - Math.exp(-dt / 330)).toFixed(3) + ')';
    hctx.fillRect(0, 0, W, H);
    hctx.globalCompositeOperation = 'source-over';

    ctx.drawImage(bc, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = .9; ctx.drawImage(hc, 0, 0); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Rauch
    for (var i = smoke.length - 1; i >= 0; i--) {
      var s = smoke[i]; s.life += dt; if (s.life > s.max) { smoke.splice(i, 1); continue; }
      s.x += s.vx * dt / 1000; s.y += s.vy * dt / 1000; s.vx *= .995;
      var k = s.life / s.max, a = Math.sin(Math.PI * k) * .16, rr = s.r * (1 + k * 3.2);
      var g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rr);
      g.addColorStop(0, 'rgba(210,200,190,' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(210,200,190,0)');
      ctx.fillStyle = g; ctx.fillRect(s.x - rr, s.y - rr, rr * 2, rr * 2);
    }

    // Funken
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (var j = parts.length - 1; j >= 0; j--) {
      var q = parts[j]; q.life += dt; if (q.life > q.max) { parts.splice(j, 1); continue; }
      var ox = q.x, oy = q.y;
      q.vy += 900 * dpr * dt / 1000; q.x += q.vx * dt / 1000; q.y += q.vy * dt / 1000;
      var kk = 1 - q.life / q.max;
      ctx.strokeStyle = kk > .55 ? 'rgba(255,236,170,' + kk.toFixed(2) + ')' : 'rgba(255,' + Math.round(110 + 140 * kk) + ',40,' + (kk * 1.1).toFixed(2) + ')';
      ctx.lineWidth = q.s * (.6 + kk);
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(q.x, q.y); ctx.stroke();
    }

    // Laserkopf, Strahl und Brennpunkt
    if (st.phase !== 'cool' || st.doneAt < 600) {
      var hx = st.hx, hy = st.hy;
      ctx.globalCompositeOperation = 'source-over';
      if (st.on) {
        ctx.globalCompositeOperation = 'lighter';
        var bg = ctx.createLinearGradient(hx, hy, st.x, st.y);
        bg.addColorStop(0, 'rgba(150,170,255,.0)'); bg.addColorStop(1, 'rgba(190,200,255,.85)');
        ctx.strokeStyle = bg; ctx.lineWidth = 1.6 * dpr;
        ctx.beginPath(); ctx.moveTo(hx, hy + 8 * dpr); ctx.lineTo(st.x, st.y); ctx.stroke();
        glow(st.x, st.y, 34 * dpr, 'rgba(255,214,140,.55)', 'rgba(255,120,30,0)');
        glow(st.x, st.y, 13 * dpr, 'rgba(255,255,240,.95)', 'rgba(255,190,90,0)');
        glow(st.x, st.y, 4.5 * dpr, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'source-over';
      }
      var hw = 15 * dpr, hh2 = 24 * dpr, hxx = hx - hw / 2, hyy = hy - hh2 + 6 * dpr;
      var mg = ctx.createLinearGradient(hxx, 0, hxx + hw, 0);
      mg.addColorStop(0, '#3a3d44'); mg.addColorStop(.35, '#d9dce2'); mg.addColorStop(.7, '#8d929b'); mg.addColorStop(1, '#2c2f35');
      ctx.fillStyle = mg; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(hxx, hyy, hw, hh2, 3 * dpr); else ctx.rect(hxx, hyy, hw, hh2);
      ctx.fill();
      ctx.fillStyle = '#16181c'; ctx.fillRect(hxx + 3 * dpr, hyy + hh2 - 5 * dpr, hw - 6 * dpr, 5 * dpr);
      if (st.on) { ctx.globalCompositeOperation = 'lighter'; glow(hx, hy + 6 * dpr, 12 * dpr, 'rgba(150,170,255,.55)', 'rgba(120,140,255,0)'); ctx.globalCompositeOperation = 'source-over'; }
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }

  function loop(ts) {
    if (!running) return;
    var raw = last ? ts - last : 16, dt = Math.min(48, raw); last = ts;
    if (!lowPerf) { slow = raw > 38 ? slow + 1 : Math.max(0, slow - 1); if (slow > 24) { lowPerf = true; smoke = []; } }
    update(dt); draw(dt);
    if (st.done && parts.length === 0 && smoke.length === 0) { running = false; played = true; finalState(); return; }
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    reset(); running = true; last = 0; raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function init() {
    setup(); board.classList.add('has-canvas');
    if (reduce) { reset(); finalState(); played = true; return; }
    reset(); ctx.clearRect(0, 0, W, H);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var v = es[0].isIntersecting;
        if (v && !visible) { visible = true; if (!running) start(); }
        if (!v && visible) { visible = false; if (running) stop(); reset(); finalState(); }
      }, { threshold: .35 }).observe(board);
    } else { start(); }
  }

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { var was = running; stop(); setup(); reset(); if (played || reduce) { finalState(); } else if (was && visible) { start(); } }, 200);
  });
  // Schrift muss geladen sein (Systemschrift: sofort), dann starten
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else init();
  window.__laser = { replay: function () { stop(); played = false; start(); }, finalState: function () { stop(); reset(); finalState(); } };
})();
