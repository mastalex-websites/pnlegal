/* PNLEGAL — nowy design.
   A) opowieść kreską: 1:1 z kredytyubezpieczenia (assets/site.js, blok hero-pin)
   B) ilustracje w kartach: 1:1 z akumulatory-tarnow (assets/offer-drawings.js)
   C) zakładki i podświetlanie słów: 1:1 z domino-stalowa-wola-design (site.js) */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (t) { return t * t * (3 - 2 * t); };

  /* okna budynku w karcie: osobne kształty, żeby rysowały się po kolei */
  var gen = document.querySelector('[data-gen="windows"]');
  if (gen) for (var r = 0; r < 6; r++) for (var c = 0; c < 3; c++) {
    var w = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    w.setAttribute('d', 'M' + (148 + c * 38) + ' ' + (70 + r * 36) + 'h22v20h-22z');
    gen.appendChild(w);
  }

  /* ---------- A) OPOWIEŚĆ KRESKĄ ---------- */
  // Jedna ciągła panorama: prawnik idzie przez pięć scen, kamera jedzie za nim, sceny rysują się kreską.
  // Mechanika postępu i rysowania jak w kredytyubezpieczenia (sticky + pathLength + wygładzanie .14).
  (function () {
    var root = document.documentElement, pin = document.getElementById('story-pin');
    if (!pin || !root.classList.contains('anim')) return;
    var svg = document.getElementById('story-art'), hint = pin.querySelector('.story-hint'), bar = pin.querySelector('.story-bar i');
    var steps = [].slice.call(pin.querySelectorAll('.story-step'));
    var cfg = JSON.parse(svg.getAttribute('data-cfg')), K = cfg.keys, ARM = cfg.arm, GND = cfg.gnd;
    var all = function (s) { return [].slice.call(svg.querySelectorAll(s)); };
    var J = function (el, a) { var o = JSON.parse(el.getAttribute(a)); if (!Array.isArray(o)) o.el = el; return o; };
    var groups = all('g[data-s]').map(function (g) {
      var els = [].slice.call(g.querySelectorAll('path,rect,circle,ellipse')), n = els.length;
      els.forEach(function (el) { el.setAttribute('pathLength', '1'); el.style.strokeDasharray = '1 1'; el.style.strokeDashoffset = '1'; el.style.visibility = 'hidden'; });
      return { els: els, s: +g.dataset.s, e: +g.dataset.e, dur: Math.min(1, Math.max(.22, 4 / n)), last: -1 };
    });
    var fades = all('[data-f]').map(function (el) { return { el: el, q: el.dataset.f.split(' ').map(Number) }; });
    var ops = all('[data-op]').map(function (el) { return { el: el, k: J(el, 'data-op') }; });
    var rots = all('[data-rot]').map(function (el) { return J(el, 'data-rot'); });
    var mvs = all('[data-mv]').map(function (el) { return J(el, 'data-mv'); });
    var loops = all('[data-loop]').map(function (el) { return J(el, 'data-loop'); });
    var lns = all('[data-ln]').map(function (el) { return J(el, 'data-ln'); });
    var pars = all('[data-par]').map(function (el) { return { el: el, k: +el.dataset.par }; });
    var fols = all('[data-follow]').map(function (el) {
      var o = J(el, 'data-follow'), path = document.getElementById(o.p);
      return { el: el, path: path, len: path.getTotalLength(), s: o.r[0], e: o.r[1],
        wheels: [].slice.call(el.querySelectorAll('[data-wheel]')).map(function (w) { return { el: w, c: w.dataset.wheel, r: +w.dataset.r }; }) };
    });
    var W = document.getElementById('story-walker'), bob = W.querySelector('.w-bob');
    var limb = function (c) { var el = W.querySelector('.' + c); return { el: el, b: el.dataset.b }; };
    var legA = limb('w-legA'), legB = limb('w-legB'), armF = limb('w-armF'), armB = limb('w-armB');
    var sun = document.getElementById('story-sun'), rays = document.getElementById('story-rays');

    function at(k, p, lin) { // klucze [[p, v1, v2, ...], ...] → [v1, v2, ...]
      if (p <= k[0][0]) return k[0].slice(1);
      for (var i = 1; i < k.length; i++) if (p <= k[i][0]) {
        var a = k[i - 1], b = k[i], t = (p - a[0]) / (b[0] - a[0] || 1), out = [];
        if (!lin) t = ease(t);
        for (var j = 1; j < a.length; j++) out.push(a[j] + (b[j] - a[j]) * t);
        return out;
      }
      return k[k.length - 1].slice(1);
    }
    function groundY(x) { // górna droga w kroku 4, poza nią grunt y=860
      if (x <= GND[0][0] || x >= GND[GND.length - 1][0]) return 860;
      for (var i = 1; i < GND.length; i++) if (x <= GND[i][0]) {
        var a = GND[i - 1], b = GND[i];
        return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0] || 1);
      }
      return 860;
    }
    function turn(l, a) { l.el.setAttribute('transform', 'translate(' + l.b + ') rotate(' + a.toFixed(2) + ')'); }
    var narrow = false;
    function layout() {
      var ratio = innerWidth / innerHeight; narrow = ratio < 1.2;
      svg.setAttribute('preserveAspectRatio', narrow || ratio > 1.85 ? 'xMidYMax meet' : 'xMidYMax slice');
    }
    function draw(p) {
      var v = at(K, p), x = v[0], vx = narrow ? v[2] : v[1], vw = narrow ? 1100 : 1800, i;
      svg.setAttribute('viewBox', vx.toFixed(1) + ' 0 ' + vw + ' 1000');
      groups.forEach(function (g) {
        var gp = clamp((p - g.s) / (g.e - g.s));
        if (gp === g.last) return; g.last = gp;
        var n = g.els.length;
        for (var i = 0; i < n; i++) {
          var st = n > 1 ? i / (n - 1) * (1 - g.dur) : 0, t = clamp((gp - st) / g.dur), el = g.els[i];
          el.style.strokeDashoffset = 1 - t; el.style.visibility = t > 0 ? 'visible' : 'hidden';
        }
      });
      fades.forEach(function (f) {
        var q = f.q, o = clamp((p - q[0]) / (q[1] - q[0]));
        if (q.length > 3) o = Math.min(o, 1 - clamp((p - q[2]) / (q[3] - q[2])));
        f.el.style.opacity = o;
      });
      ops.forEach(function (o) { o.el.style.opacity = at(o.k, p, 1)[0].toFixed(3); });
      rots.forEach(function (o) { o.el.setAttribute('transform', 'rotate(' + at(o.k, p, o.lin)[0].toFixed(2) + ' ' + o.c[0] + ' ' + o.c[1] + ')'); });
      mvs.forEach(function (o) { var m = at(o.k, p, o.lin); o.el.setAttribute('transform', 'translate(' + m[0].toFixed(1) + ' ' + m[1].toFixed(1) + ')'); });
      loops.forEach(function (o) { // dym: wznosi się, rośnie i gaśnie, dopóki fabryka pracuje
        if (p <= o.s || p >= o.e) { o.el.style.opacity = 0; return; }
        var t = ((p - o.s) / (o.e - o.s) * o.n + (o.ph || 0)) % 1, sc = 1 + (o.g || 0) * t;
        o.el.setAttribute('transform', 'translate(' + (o.d[0] * t + o.c[0] * (1 - sc)).toFixed(1) + ' ' + (o.d[1] * t + o.c[1] * (1 - sc)).toFixed(1) + ') scale(' + sc.toFixed(3) + ')');
        o.el.style.opacity = Math.sin(Math.PI * t).toFixed(3);
      });
      lns.forEach(function (o) { o.el.setAttribute('d', 'M' + o.x + ' ' + o.y + 'V' + at(o.k, p)[0].toFixed(1)); });
      pars.forEach(function (o) { o.el.setAttribute('transform', 'translate(' + (vx * (1 - o.k)).toFixed(1) + ' 0)'); });
      fols.forEach(function (f) { // auto zarządu: jedzie po drodze, przechyla się na rampie, koła się toczą
        var t = clamp((p - f.s) / (f.e - f.s)), d = f.len * ease(t), q = f.path.getPointAtLength(d),
          q1 = f.path.getPointAtLength(Math.max(0, d - 2)), q2 = f.path.getPointAtLength(Math.min(f.len, d + 2)),
          a = Math.atan2(q2.y - q1.y, q2.x - q1.x) * 57.2958;
        f.el.setAttribute('transform', 'translate(' + q.x.toFixed(1) + ' ' + q.y.toFixed(1) + ') rotate(' + a.toFixed(2) + ')');
        f.wheels.forEach(function (w) { w.el.setAttribute('transform', 'rotate(' + (d / w.r * 57.2958 % 360).toFixed(1) + ' ' + w.c + ')'); });
      });
      // postać: krok wynika z przebytej drogi, więc zwalnia i staje razem z kamerą
      var amp = 0;
      for (i = 1; i < K.length; i++) if (p <= K[i][0]) {
        if (K[i][1] !== K[i - 1][1]) { var t = clamp((p - K[i - 1][0]) / (K[i][0] - K[i - 1][0])); amp = Math.min(1, 6.6 * t * (1 - t)); }
        break;
      }
      var L = 26 * amp * Math.sin(x / 19), pose = at(ARM, p)[0];
      W.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + groundY(x).toFixed(1) + ') scale(1.25)');
      bob.setAttribute('transform', 'translate(0 ' + (55 * (1 - Math.cos(L / 57.2958))).toFixed(2) + ')');
      turn(legA, L); turn(legB, -L); turn(armB, .75 * L); turn(armF, pose - .75 * L);
      sun.setAttribute('transform', 'translate(' + (vx + vw - 270).toFixed(1) + ' 0)');
      rays.setAttribute('transform', 'rotate(' + (p * 240).toFixed(1) + ' 0 150)');
      hint.style.opacity = 1 - clamp(p / .03); hint.style.visibility = p < .03 ? 'visible' : 'hidden';
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      steps.forEach(function (s) {
        var b = +s.dataset.s, e = +s.dataset.e, o = Math.min(clamp((p - b) / .02), clamp((e - p) / .02));
        s.style.opacity = o; s.style.visibility = o > 0 ? 'visible' : 'hidden'; s.style.transform = 'translateY(' + ((1 - o) * 14).toFixed(1) + 'px)';
      });
    }
    var cur = -1, target = 0, run = false;
    function read() { var rc = pin.getBoundingClientRect(); target = clamp(-rc.top / (pin.offsetHeight - innerHeight)); }
    function tick() {
      var d = target - cur;
      if (Math.abs(d) < .0004) { cur = target; draw(cur); run = false; return; }
      cur += d * .14; draw(cur); requestAnimationFrame(tick);
    }
    function kick() { read(); if (!run) { run = true; requestAnimationFrame(tick); } }
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', function () { layout(); kick(); draw(cur); });
    layout(); read(); cur = target; draw(cur);
  })();

  /* ---------- B) ILUSTRACJE W KARTACH ---------- */
  (function () {
    var animated = document.documentElement.classList.contains('anim');
    var items = [].slice.call(document.querySelectorAll('.draw')).map(function (holder) {
      var groups = [].slice.call(holder.querySelectorAll('g[data-s]')).map(function (g) {
        var shapes = [].slice.call(g.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon'));
        shapes.forEach(function (s) {
          s.setAttribute('pathLength', '1'); s.style.strokeDasharray = '1 1';
          s.style.strokeDashoffset = animated ? '1' : '0'; s.style.visibility = animated ? 'hidden' : 'visible';
        });
        return { shapes: shapes, start: +g.dataset.s, end: +g.dataset.e, duration: Math.min(1, Math.max(.22, 4 / shapes.length)), last: -1 };
      });
      return { holder: holder, groups: groups, current: -1, painted: -1 };
    });
    if (!animated) return;
    function paint(item, progress) {
      if (item.painted === progress) return; item.painted = progress;
      item.groups.forEach(function (g) {
        var gp = clamp((progress - g.start) / (g.end - g.start));
        if (g.last === gp) return; g.last = gp;
        var n = g.shapes.length;
        g.shapes.forEach(function (s, i) {
          var delay = n > 1 ? i / (n - 1) * (1 - g.duration) : 0, a = clamp((gp - delay) / g.duration);
          s.style.strokeDashoffset = (1 - a).toFixed(4); s.style.visibility = a > 0 ? 'visible' : 'hidden';
        });
      });
    }
    function target(item) {
      if (reduce.matches) return 1;
      var b = item.holder.getBoundingClientRect();
      return clamp((innerHeight * .94 - b.top) / (innerHeight * .54 + b.height * .2));
    }
    var frame = 0, lastTime = 0;
    function render(time) {
      frame = 0; time = time || 0;
      var moving = false, step = 1 - Math.exp(-Math.min(time - lastTime, 200) / 90);
      lastTime = time;
      items.forEach(function (item) {
        var goal = target(item);
        if (item.current < 0 || reduce.matches) item.current = goal;
        item.current += (goal - item.current) * step;
        if (Math.abs(goal - item.current) < .0008) item.current = goal; else moving = true;
        paint(item, item.current);
      });
      if (moving) schedule();
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(render); }
    render();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
  })();

  /* ---------- C) ZAKŁADKI + PODŚWIETLANIE SŁÓW (Domino) ---------- */
  var tabs = [].slice.call(document.querySelectorAll('.approach-tabs [role="tab"]'));
  var panels = [].slice.call(document.querySelectorAll('.approach-panel'));
  function activate(tab) {
    tabs.forEach(function (t) { var s = t === tab; t.setAttribute('aria-selected', String(s)); t.tabIndex = s ? 0 : -1; });
    panels.forEach(function (p) { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { activate(tab); });
    tab.addEventListener('keydown', function (e) {
      var n;
      if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      else return;
      e.preventDefault(); activate(tabs[n]); tabs[n].focus();
    });
  });

  var storyText = document.querySelector('section.story > p');
  if (storyText) {
    var words = storyText.textContent.trim().split(/\s+/).map(function (word) {
      var s = document.createElement('span'); s.className = 'story-word'; s.textContent = word; return s;
    });
    storyText.replaceChildren.apply(storyText, words.reduce(function (a, w, i) { return i ? a.concat([' ', w]) : [w]; }, []));
    var sf = 0;
    var hl = function () {
      sf = 0;
      var b = storyText.getBoundingClientRect();
      var p = reduce.matches ? 1 : clamp((innerHeight * .8 - b.top) / (b.height + innerHeight * .35));
      words.forEach(function (w, i) { w.style.setProperty('--highlight', clamp(p * words.length - i)); });
    };
    addEventListener('scroll', function () { if (!sf) sf = requestAnimationFrame(hl); }, { passive: true });
    addEventListener('resize', hl);
    hl();
  }

  /* ---------- D) ze starej strony (assets/js/main.js): liczniki, sieroty, formularz ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduce.matches && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, end = parseInt(el.getAttribute('data-count'), 10), t0 = null;
        cio.unobserve(el);
        (function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / 1100, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { c.textContent = '0'; cio.observe(c); });
  }

  var ORPHANS = /(^|[\s(„"])([aiouwzAIOUWZ])\s+/g;
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: function (n) {
      var p = n.parentNode && n.parentNode.nodeName;
      if (p === 'SCRIPT' || p === 'STYLE' || p === 'TEXTAREA' || p === 'OPTION' || p === 'text') return NodeFilter.FILTER_REJECT;
      return /\S/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  var tn, tnodes = [];
  while ((tn = walker.nextNode())) tnodes.push(tn);
  tnodes.forEach(function (t) {
    var v = t.nodeValue.replace(ORPHANS, function (m, pre, w) { return pre + w + ' '; });
    if (v !== t.nodeValue) t.nodeValue = v;
  });

  var form = document.getElementById('kontakt-form');
  if (form) {
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (form.querySelector('[name="firma_www"]').value) return; /* honeypot */
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      var mailto = 'mailto:' + form.dataset.email +
        '?subject=' + encodeURIComponent('Zapytanie ze strony — ' + (data.get('temat') || 'kontakt')) +
        '&body=' + encodeURIComponent('Imię i nazwisko: ' + data.get('imie') + '\n' + 'E-mail: ' + data.get('email') + '\n' +
          'Telefon: ' + (data.get('telefon') || '—') + '\n' + 'Kim jestem: ' + data.get('temat') + '\n\n' + data.get('wiadomosc'));
      status.textContent = 'Wysyłam…';
      fetch(form.getAttribute('action'), { method: 'POST', body: data })
        .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function (j) { if (j && j.ok) { status.textContent = 'Dziękuję. Wiadomość została wysłana.'; form.reset(); } else throw new Error(); })
        .catch(function () { status.textContent = 'Otwieram program pocztowy z gotową wiadomością…'; location.href = mailto; });
    });
  }
})();
