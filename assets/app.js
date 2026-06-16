/* Relay — interactions: nav, menu, reveal, tabs, counters, modal, interactive charts */
(function () {
  'use strict';

  /* ---------- Year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Nav blur on scroll ---------- */
  var nav = document.getElementById('nav');
  function onScroll() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 16); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var mobileMenu = document.getElementById('mobileMenu');
  var menuOpen = false;
  function toggleMenu(force) {
    menuOpen = typeof force === 'boolean' ? force : !menuOpen;
    if (mobileMenu) mobileMenu.classList.toggle('hidden', !menuOpen);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(menuOpen));
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { toggleMenu(); });
  document.querySelectorAll('[data-close-menu]').forEach(function (el) {
    el.addEventListener('click', function () { toggleMenu(false); });
  });

  /* ---------- Spline cube: decent size, no user zoom, safe watermark hide ---------- */
  var viewer = document.querySelector('spline-viewer');
  if (viewer) {
    // SAFE watermark hide — only the watermark node, NEVER the cube canvas (#spline)
    var killLogo = function () {
      var sr = viewer.shadowRoot; if (!sr) return;
      if (!sr.getElementById('relay-hide-logo')) {
        var st = document.createElement('style'); st.id = 'relay-hide-logo';
        st.textContent = '#logo, a[href*="spline.design"] { display:none !important; }';
        sr.appendChild(st);
      }
    };
    killLogo();
    var t = 0, iv = setInterval(function () { killLogo(); if (++t > 60) clearInterval(iv); }, 200);
    var ob = setInterval(function () {
      if (viewer.shadowRoot) {
        new MutationObserver(killLogo).observe(viewer.shadowRoot, { childList: true, subtree: true });
        clearInterval(ob);
      }
    }, 200);

    // The scene loads zoomed-in; pull back to a decent size. Tune CUBE_ZOOM if needed.
    var CUBE_ZOOM = 0.8;
    var applyZoom = function () {
      var app = viewer._spline;
      if (app && typeof app.setZoom === 'function') { try { app.setZoom(CUBE_ZOOM); return true; } catch (e) {} }
      return false;
    };
    viewer.addEventListener('load', applyZoom);
    [300, 700, 1200, 2000, 3200, 5000].forEach(function (ms) { setTimeout(applyZoom, ms); });

    // disable user zoom (wheel + pinch) but keep drag-rotate
    viewer.addEventListener('wheel', function (e) { e.stopPropagation(); }, { capture: true, passive: true });
    viewer.addEventListener('touchmove', function (e) {
      if (e.touches && e.touches.length > 1) e.stopPropagation();
    }, { capture: true });
  }

  /* ---------- Reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- Testimonial cards: cursor-following spotlight ---------- */
  document.querySelectorAll('.t-card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  /* ---------- Tabs (code blocks + dashboard) — smooth crossfade ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var tabs = group.querySelectorAll('[data-tab]');
    var panes = group.querySelectorAll('[data-pane]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        if (tab.classList.contains('active')) return;
        var name = tab.getAttribute('data-tab');
        tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        panes.forEach(function (p) {
          var show = p.getAttribute('data-pane') === name;
          if (show) {
            p.classList.remove('hidden');
            p.style.opacity = '0';
            // double rAF so the fade-in actually transitions
            requestAnimationFrame(function () {
              requestAnimationFrame(function () { p.style.opacity = '1'; });
            });
            p.querySelectorAll('.chart').forEach(function (c) { if (c.__draw) c.__draw(); });
            p.querySelectorAll('[data-count]').forEach(function (c) { if (c.__count) c.__count(); });
          } else {
            p.classList.add('hidden');
            p.style.opacity = '';
          }
        });
      });
    });
  });

  /* ---------- Animated counters ---------- */
  function makeCounter(el) {
    var done = false;
    return function () {
      if (done) return; done = true;
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var dec = el.getAttribute('data-dec') === '1';
      var dur = 1300, t0 = null;
      function tick(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = target * eased;
        el.textContent = (dec ? val.toFixed(2) : Math.round(val).toLocaleString()) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };
  }
  var cObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting && e.target.__count) e.target.__count(); });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (el) {
    el.__count = makeCounter(el);
    cObs.observe(el);
  });

  /* ---------- Interactive charts ---------- */
  var chartId = 0;
  function smoothPath(pts) {
    if (pts.length < 2) return '';
    var d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + p2[0] + ',' + p2[1];
    }
    return d;
  }
  function initChart(el) {
    var vals = el.getAttribute('data-points').split(',').map(Number);
    var unit = el.getAttribute('data-unit') || '';
    var color = el.getAttribute('data-color') || '#38e0a0';
    var W = 600, H = parseInt(el.getAttribute('data-h') || '160', 10), pad = 16, n = vals.length;
    var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals), range = (max - min) || 1;
    var pts = vals.map(function (v, i) {
      return [(i / (n - 1)) * W, pad + (1 - (v - min) / range) * (H - pad * 2)];
    });
    var line = smoothPath(pts);
    var area = line + ' L' + W + ',' + H + ' L0,' + H + ' Z';
    var gid = 'cg' + (chartId++);
    el.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
        '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="' + color + '" stop-opacity=".32"/>' +
          '<stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
        '<path class="chart-area" d="' + area + '" fill="url(#' + gid + ')"/>' +
        '<line class="chart-guide" x1="0" x2="0" y1="0" y2="' + H + '"/>' +
        '<path class="chart-line" d="' + line + '" style="stroke:' + color + '"/>' +
        '<circle class="chart-dot" r="4.5" style="fill:' + color + '"/>' +
      '</svg>';
    var tip = document.createElement('div');
    tip.className = 'chart-tip';
    el.appendChild(tip);

    var svg = el.querySelector('svg');
    var dot = el.querySelector('.chart-dot');
    var guide = el.querySelector('.chart-guide');
    var drawn = false;

    // clean left-to-right wipe reveal (uniform even though the svg is stretched)
    svg.style.clipPath = 'inset(0 100% 0 0)';
    svg.style.webkitClipPath = 'inset(0 100% 0 0)';

    el.__draw = function () {
      svg.style.transition = 'none';
      svg.style.clipPath = 'inset(0 100% 0 0)';
      svg.style.webkitClipPath = 'inset(0 100% 0 0)';
      void svg.getBoundingClientRect();           // reflow so the wipe replays cleanly
      requestAnimationFrame(function () {
        var ease = 'clip-path 1.5s cubic-bezier(.22,.61,.36,1), -webkit-clip-path 1.5s cubic-bezier(.22,.61,.36,1)';
        svg.style.transition = ease;
        svg.style.clipPath = 'inset(0 0 0 0)';
        svg.style.webkitClipPath = 'inset(0 0 0 0)';
        drawn = true;
      });
    };

    function move(clientX) {
      var rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      var ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      var idx = Math.round(ratio * (n - 1));
      var px = pts[idx][0], py = pts[idx][1];
      dot.setAttribute('cx', px); dot.setAttribute('cy', py);
      guide.setAttribute('x1', px); guide.setAttribute('x2', px);
      dot.style.opacity = 1; guide.style.opacity = 1;
      tip.textContent = vals[idx].toLocaleString() + unit;
      tip.style.left = (px / W * rect.width) + 'px';
      tip.style.top = (py / H * rect.height) + 'px';
      tip.style.opacity = 1;
    }
    el.addEventListener('mousemove', function (e) { move(e.clientX); });
    el.addEventListener('touchmove', function (e) {
      if (e.touches[0]) { move(e.touches[0].clientX); }
    }, { passive: true });
    function hide() { dot.style.opacity = 0; guide.style.opacity = 0; tip.style.opacity = 0; }
    el.addEventListener('mouseleave', hide);
    el.addEventListener('touchend', hide);

    // animate the draw when first scrolled into view
    var dObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { el.__draw(); dObs.unobserve(el); } });
    }, { threshold: 0.4 });
    dObs.observe(el);
  }
  document.querySelectorAll('.chart').forEach(initChart);

  /* ---------- Form modal ---------- */
  var overlay = document.getElementById('formModal');
  function openModal() {
    if (!overlay) return;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var first = overlay.querySelector('input');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('[data-open-form]').forEach(function (btn) {
    btn.addEventListener('click', function (e) { e.preventDefault(); toggleMenu(false); openModal(); });
  });
  document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
    btn.addEventListener('click', closeModal);
  });
  if (overlay) {
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  /* ---------- Contact form (demo, no backend) ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = document.getElementById('formNote');
      var email = form.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        note.textContent = 'Enter a valid work email.';
        note.style.color = '#fca5a5';
        return;
      }
      var btn = form.querySelector('button[type=submit]');
      btn.textContent = 'Sending…'; btn.disabled = true;
      setTimeout(function () {
        form.reset();
        btn.textContent = 'Request access'; btn.disabled = false;
        note.textContent = "Thanks — we'll be in touch. (Demo form: connect a backend to receive submissions.)";
        note.style.color = '#38e0a0';
      }, 700);
    });
  }
})();
