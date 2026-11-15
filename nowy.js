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
  (function () {
    var root = document.documentElement, pin = document.getElementById('story-pin');
    if (!pin || !root.classList.contains('anim')) return;
    var svg = document.getElementById('story-art'), hint = pin.querySelector('.story-hint'), bar = pin.querySelector('.story-bar i');
    var steps = [].slice.call(pin.querySelectorAll('.story-step'));
    // kropka jadąca po ścieżce (krok 4: wybiera "inne rozwiązanie")
    var followers = [].slice.call(svg.querySelectorAll('[data-follow]')).map(function (el) {
      var path = document.getElementById(el.dataset.follow), q = el.dataset.r.split(' ');
      return { el: el, path: path, len: path.getTotalLength(), s: +q[0], e: +q[1] };
    });
    var groups = [].slice.call(svg.querySelectorAll('g[data-s]')).map(function (g) {
      var els = [].slice.call(g.querySelectorAll('path,rect,circle')), n = els.length, dur = Math.min(1, Math.max(.22, 4 / n));
      els.forEach(function (el) { el.setAttribute('pathLength', '1'); el.style.strokeDasharray = '1 1'; el.style.strokeDashoffset = '1'; el.style.visibility = 'hidden'; });
      return { els: els, s: +g.dataset.s, e: +g.dataset.e, dur: dur, last: -1 };
    });
    var fades = [].slice.call(svg.querySelectorAll('[data-f]')).map(function (g) { var q = g.dataset.f.split(' '); return { el: g, s: +q[0], e: +q[1] }; });
    // kamera: każdy krok ma własny panel (1800 jednostek), przejazd w przerwie między tekstami
    var camKeys = [[0, 0], [.17, 0], [.21, 1800], [.37, 1800], [.41, 3600], [.57, 3600], [.61, 5400], [.77, 5400], [.81, 7200], [1, 7200]];
    function keyed(keys, p) {
      for (var i = 1; i < keys.length; i++) if (p <= keys[i][0]) {
        var a = keys[i - 1], b = keys[i], t = (p - a[0]) / (b[0] - a[0] || 1);
        return a[1] + (b[1] - a[1]) * ease(clamp(t));
      }
      return keys[keys.length - 1][1];
    }
    var narrow = false;
    function layout() {
      var ratio = innerWidth / innerHeight; narrow = ratio < 1.2;
      svg.setAttribute('preserveAspectRatio', narrow || ratio > 1.85 ? 'xMidYMax meet' : 'xMidYMax slice');
    }
    function draw(p) {
      groups.forEach(function (g) {
        var gp = clamp((p - g.s) / (g.e - g.s));
        if (gp === g.last) return; g.last = gp;
        var n = g.els.length;
        for (var i = 0; i < n; i++) {
          var st = n > 1 ? i / (n - 1) * (1 - g.dur) : 0, t = clamp((gp - st) / g.dur), el = g.els[i];
          el.style.strokeDashoffset = 1 - t; el.style.visibility = t > 0 ? 'visible' : 'hidden';
        }
      });
      fades.forEach(function (f) { f.el.style.opacity = clamp((p - f.s) / (f.e - f.s)); });
      followers.forEach(function (f) {
        var t = clamp((p - f.s) / (f.e - f.s)), q = f.path.getPointAtLength(f.len * ease(t));
        f.el.setAttribute('cx', q.x.toFixed(1)); f.el.setAttribute('cy', q.y.toFixed(1));
        f.el.style.opacity = t > 0 ? 1 : 0;
      });
      var cam = keyed(camKeys, p);
      // wąski ekran: okno 1080 jednostek na rysunek panelu (treść leży w x 640–1660)
      svg.setAttribute('viewBox', narrow ? (cam + 610).toFixed(1) + ' 0 1080 1000' : cam.toFixed(1) + ' 0 1800 1000');
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
      if (Math.abs(d) < .0006) { cur = target; draw(cur); run = false; return; }
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
