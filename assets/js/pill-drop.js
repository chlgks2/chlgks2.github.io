/* 기술 스택 알약이 떨어져 쌓이는 히어로 (2026-10-14)
   캡슐 강체 물리 — 중력 · 충돌 · 마찰 · 드래그
   되돌리려면 index.html 에서 이 스크립트와 .stage 블록만 지우면 됩니다. */
(function () {
  'use strict';

  function World(width, floor, gravity) {
    this.width = width; this.floor = floor; this.gravity = gravity || 480;
    this.bodies = []; this.time = 0; this.top = -1e9;
  }
  World.prototype.add = function (o) {
    var b = Object.assign({ vx: 0, vy: 0, angle: 0, spin: 0, active: false, turned: false }, o);
    b.radius = b.height / 2;
    b.length = (b.width - b.height) / 2;
    b.inverseInertia = 12 / (b.width * b.width + b.height * b.height);
    this.bodies.push(b); return b;
  };
  World.prototype.segment = function (b) {
    var dx = Math.cos(b.angle) * b.length, dy = Math.sin(b.angle) * b.length;
    return [{ x: b.x - dx, y: b.y - dy }, { x: b.x + dx, y: b.y + dy }];
  };
  World.prototype.closest = function (a, b) {
    var s1 = this.segment(a), s2 = this.segment(b);
    var p = s1[0], q = s1[1], r = s2[0], s = s2[1];
    var u = { x: q.x - p.x, y: q.y - p.y }, v = { x: s.x - r.x, y: s.y - r.y },
        w = { x: p.x - r.x, y: p.y - r.y };
    var dot = function (l, m) { return l.x * m.x + l.y * m.y; };
    var aa = dot(u, u), bb = dot(u, v), cc = dot(v, v), dd = dot(u, w), ee = dot(v, w);
    var cl = function (t) { return Math.max(0, Math.min(1, t)); };
    if (aa < 1e-4 && cc < 1e-4) return [p, r];
    if (aa < 1e-4) { var z0 = cl(ee / cc); return [p, { x: r.x + v.x * z0, y: r.y + v.y * z0 }]; }
    if (cc < 1e-4) { var t0 = cl(-dd / aa); return [{ x: p.x + u.x * t0, y: p.y + u.y * t0 }, r]; }
    var den = aa * cc - bb * bb;
    var t = den > 1e-4 ? cl((bb * ee - cc * dd) / den) : 0;
    var z = cc > 1e-4 ? (bb * t + ee) / cc : 0;
    if (z < 0) { z = 0; t = aa > 1e-4 ? cl(-dd / aa) : 0; }
    if (z > 1) { z = 1; t = aa > 1e-4 ? cl((bb - dd) / aa) : 0; }
    return [{ x: p.x + u.x * t, y: p.y + u.y * t }, { x: r.x + v.x * z, y: r.y + v.y * z }];
  };
  World.prototype.impulse = function (a, b, pt, nx, ny) {
    var ax = pt.x - a.x, ay = pt.y - a.y;
    var bx = b ? pt.x - b.x : 0, by = b ? pt.y - b.y : 0;
    var rel = function () {
      return { x: (b ? b.vx - b.spin * by : 0) - (a.vx - a.spin * ay),
               y: (b ? b.vy + b.spin * bx : 0) - (a.vy + a.spin * ax) };
    };
    var apply = function (amt, x, y) {
      a.vx -= amt * x; a.vy -= amt * y; a.spin -= amt * (ax * y - ay * x) * a.inverseInertia;
      if (b) { b.vx += amt * x; b.vy += amt * y; b.spin += amt * (bx * y - by * x) * b.inverseInertia; }
    };
    var vel = rel(), sp = vel.x * nx + vel.y * ny;
    if (sp >= 0) return;
    var ca = ax * ny - ay * nx, cb = bx * ny - by * nx;
    var mass = 1 + (b ? 1 : 0) + ca * ca * a.inverseInertia + (b ? cb * cb * b.inverseInertia : 0);
    var bounce = sp < -65 ? 0.12 : 0;
    var ni = (-(1 + bounce) * sp) / mass;
    apply(ni, nx, ny);
    var tg = { x: -ny, y: nx }, af = rel();
    var fs = af.x * tg.x + af.y * tg.y;
    var ta = ax * tg.y - ay * tg.x, tb = bx * tg.y - by * tg.x;
    var tm = 1 + (b ? 1 : 0) + ta * ta * a.inverseInertia + (b ? tb * tb * b.inverseInertia : 0);
    var lim = ni * 0.55;
    apply(Math.max(-lim, Math.min(lim, -fs / tm)), tg.x, tg.y);
  };
  World.prototype.bounds = function (b) {
    if (b.y - b.radius > this.top) b.contained = true;
    var seg = this.segment(b);
    for (var i = 0; i < 2; i++) {
      var pt = seg[i];
      if (b.contained && pt.y - b.radius < this.top) {
        b.y += (this.top + b.radius - pt.y) * 0.65;
        this.impulse(b, null, { x: pt.x, y: this.top }, 0, -1);
      }
      if (pt.y + b.radius > this.floor) {
        b.landed = true; b.y -= (pt.y + b.radius - this.floor) * 0.65;
        this.impulse(b, null, { x: pt.x, y: this.floor }, 0, 1);
      }
      if (pt.x - b.radius < 0) { b.x += (b.radius - pt.x) * 0.65; this.impulse(b, null, { x: 0, y: pt.y }, -1, 0); }
      if (pt.x + b.radius > this.width) { b.x -= (pt.x + b.radius - this.width) * 0.65; this.impulse(b, null, { x: this.width, y: pt.y }, 1, 0); }
    }
  };
  World.prototype.step = function (dt) {
    this.time += dt;
    var i, j, b;
    for (i = 0; i < this.bodies.length; i++) {
      b = this.bodies[i];
      if (this.time < b.release) continue;
      b.active = true;
      if (!b.turned && b.y > b.startY + (this.floor - b.startY) / 3) { b.spin = b.initialSpin; b.turned = true; }
      if (b.grab) {
        var c = Math.cos(b.angle), sn = Math.sin(b.angle);
        var rx = b.grab.lx * c - b.grab.ly * sn, ry = b.grab.lx * sn + b.grab.ly * c;
        var fx = (b.grab.x - b.x - rx) * 95 - (b.vx - b.spin * ry) * 17;
        var fy = (b.grab.y - b.y - ry) * 95 - (b.vy + b.spin * rx) * 17;
        var lm = Math.max(1, Math.hypot(fx, fy) / 7000); fx /= lm; fy /= lm;
        b.vx += fx * dt; b.vy += fy * dt;
        b.spin += (rx * fy - ry * fx) * b.inverseInertia * dt;
        b.spin = Math.max(-7, Math.min(7, b.spin));
      }
      b.vy += this.gravity * dt;
      b.vx *= Math.exp(-0.14 * dt); b.spin *= Math.exp(-0.35 * dt);
      b.x += b.vx * dt; b.y += b.vy * dt; b.angle += b.spin * dt;
    }
    for (var it = 0; it < 9; it++) {
      for (i = 0; i < this.bodies.length; i++) if (this.bodies[i].active) this.bounds(this.bodies[i]);
      for (i = 0; i < this.bodies.length; i++) {
        var a = this.bodies[i]; if (!a.active) continue;
        for (j = i + 1; j < this.bodies.length; j++) {
          b = this.bodies[j]; if (!b.active) continue;
          var cp = this.closest(a, b), p = cp[0], q = cp[1];
          var dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
          var ov = a.radius + b.radius - d; if (ov <= 0) continue;
          if (a.landed || b.landed) { a.landed = true; b.landed = true; }
          var nx = d > 1e-3 ? dx / d : 0, ny = d > 1e-3 ? dy / d : 1;
          var corr = Math.max(0, ov - 0.15) * 0.38;
          a.x -= nx * corr; a.y -= ny * corr; b.x += nx * corr; b.y += ny * corr;
          this.impulse(a, b, { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }, nx, ny);
        }
      }
    }
  };

  /* ── 구동 ──────────────────────────────── */
  function init() {
    var stage = document.querySelector('.stage');
    if (!stage) return;
    var field = stage.querySelector('.stage-field');
    var pills = Array.prototype.slice.call(field.querySelectorAll('.pill'));
    if (!pills.length) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var frame = 0, bodies = [], world = null;

    function layoutStatic() {
      // 애니메이션을 못 쓰는 환경에서도 알약이 보이도록 한 줄로 눕힌다
      pills.forEach(function (el) {
        el.style.transform = ''; el.style.left = ''; el.style.top = '';
        el.style.visibility = ''; el.style.position = ''; el.style.display = '';
      });
      field.classList.add('is-static');
    }

    function start() {
      cancelAnimationFrame(frame);
      field.classList.remove('is-static');
      var rect = field.getBoundingClientRect();
      if (rect.width < 280) { layoutStatic(); return; }
      var floor = rect.height - 4;
      world = new World(rect.width, floor, 470);
      world.top = -340;

      // 좁은 화면에서는 알약 수를 줄입니다 — 20개가 다 떨어지면 쌓일 자리가 없습니다
      var keep = rect.width < 430 ? 15 : (rect.width < 720 ? 18 : pills.length);
      pills.forEach(function (el, i) { el.style.display = i < keep ? '' : 'none'; });

      bodies = pills.slice(0, keep).map(function (el, i) {
        el.style.position = 'absolute';
        el.style.left = '0'; el.style.top = '0';
        el.style.visibility = 'hidden';
        var w = el.offsetWidth, h = el.offsetHeight;
        var x = Math.max(w / 2 + 8, Math.min(rect.width - w / 2 - 8,
                rect.width * (0.14 + Math.random() * 0.72)));
        var y = -h - 24 - Math.random() * 200;
        return world.add({
          el: el, width: w, height: h, x: x, y: y, startY: y,
          vx: (Math.random() - 0.5) * 60,
          initialSpin: (Math.random() - 0.5) * 0.9,
          release: i * 0.14 + Math.random() * 0.07
        });
      });

      var prev, acc = 0, quiet = 0;
      function render() {
        for (var i = 0; i < bodies.length; i++) {
          var b = bodies[i];
          b.el.style.visibility = b.active ? 'visible' : 'hidden';
          b.el.style.transform = 'translate(' + (b.x - b.width / 2) + 'px,' +
            (b.y - b.height / 2) + 'px) rotate(' + b.angle + 'rad)';
        }
      }
      function tick(now) {
        if (document.hidden) { prev = now; frame = requestAnimationFrame(tick); return; }
        var dt = prev === undefined ? 0 : Math.min((now - prev) / 1000, 0.05);
        prev = now; acc += dt;
        while (acc >= 1 / 120) { world.step(1 / 120); acc -= 1 / 120; }
        render();
        var moving = false;
        for (var i = 0; i < bodies.length; i++) {
          var b = bodies[i];
          if (!b.active) { moving = true; break; }
          if (Math.hypot(b.vx, b.vy) > 7 || Math.abs(b.spin) > 0.35) { moving = true; break; }
        }
        quiet = moving ? 0 : quiet + dt;
        if (quiet < 1.1 || world.time < 3) frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    }

    /* 드래그 — 알약을 집어 던질 수 있습니다 */
    function point(e) {
      var r = field.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    field.addEventListener('pointerdown', function (e) {
      if (!world || !e.target.closest) return;
      var el = e.target.closest('.pill'); if (!el) return;
      var b = bodies.find(function (x) { return x.el === el; }); if (!b || !b.active) return;
      var p = point(e), c = Math.cos(-b.angle), s = Math.sin(-b.angle);
      var dx = p.x - b.x, dy = p.y - b.y;
      b.grab = { x: p.x, y: p.y, lx: dx * c - dy * s, ly: dx * s + dy * c };
      el.setPointerCapture(e.pointerId); el.classList.add('is-grab');
      cancelAnimationFrame(frame);
      (function loop(now) {
        var dt = 1 / 120; world.step(dt);
        for (var i = 0; i < bodies.length; i++) {
          var k = bodies[i];
          k.el.style.transform = 'translate(' + (k.x - k.width / 2) + 'px,' +
            (k.y - k.height / 2) + 'px) rotate(' + k.angle + 'rad)';
        }
        frame = requestAnimationFrame(loop);
      })();
      e.preventDefault();
    });
    field.addEventListener('pointermove', function (e) {
      var el = e.target.closest && e.target.closest('.pill'); if (!el) return;
      var b = bodies.find(function (x) { return x.el === el; });
      if (b && b.grab) { var p = point(e); b.grab.x = p.x; b.grab.y = p.y; }
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      field.addEventListener(ev, function (e) {
        var el = e.target.closest && e.target.closest('.pill'); if (!el) return;
        var b = bodies.find(function (x) { return x.el === el; });
        if (b) { b.grab = null; el.classList.remove('is-grab'); }
      });
    });

    if (reduce.matches) { layoutStatic(); return; }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); start(); }
    }, { threshold: 0.25 });
    io.observe(stage);

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t); t = setTimeout(function () {
        if (reduce.matches) { layoutStatic(); return; }
        start();
      }, 220);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
