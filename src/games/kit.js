/* =====================================================================
   ARCADE KIT — shared by the Internet Arcade canvas games.
   Canvas scaling, keyboard / gamepad / touch / cabinet input, sound,
   high scores and the cabinet message protocol.
   ===================================================================== */
'use strict';
const TAU = Math.PI * 2;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + (b - a) * Math.random();
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const Kit = {
  W: 480, H: 360, scale: 1, ox: 0, oy: 0, t: 0,
  embed: /[?&]embed=1\b/.test(location.search) && window.parent !== window,
  keys: Object.create(null), prev: Object.create(null), touch: Object.create(null),
  // logical buttons -> physical keys (the cabinet sends KeyJ/KeyK/KeyL/KeyI for its four buttons)
  MAP: {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
    a: ['KeyJ', 'KeyZ', 'Space'], b: ['KeyK', 'KeyX'], c: ['KeyL', 'KeyC', 'ShiftLeft', 'ShiftRight'], d: ['KeyI', 'KeyV'],
    start: ['Enter'], pause: ['Escape', 'KeyP'],
  },
  pad: Object.create(null), padPrev: Object.create(null), stick: { x: 0, y: 0 },
  init(opts) {
    Object.assign(this, opts);
    const c = this.canvas = document.createElement('canvas');
    c.id = 'screen'; document.body.appendChild(c);
    this.ctx = c.getContext('2d');
    if (this.embed) document.documentElement.classList.add('embed');
    addEventListener('resize', () => this.resize()); this.resize();
    addEventListener('keydown', e => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      this.down(e.code);
    });
    addEventListener('keyup', e => this.up(e.code));
    addEventListener('blur', () => { for (const k in this.keys) this.keys[k] = false; });
    addEventListener('message', e => {
      if (!this.embed || e.source !== window.parent) return;
      const d = e.data; if (!d || typeof d !== 'object') return;
      if (d.type === 'hh-key' && typeof d.code === 'string' && d.code.length < 24) d.down ? this.down(d.code) : this.up(d.code);
      else if (d.type === 'hh-start') { this.audioInit(); this.onStart && this.onStart(); }
      else if (d.type === 'hh-release') for (const k in this.keys) this.keys[k] = false;
    });
    if (!this.embed && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) this.buildTouch();
    let last = performance.now(), acc = 0;
    const frame = now => {
      requestAnimationFrame(frame);
      acc = Math.min(acc + (now - last) / 1000, 0.25); last = now;
      this.pollPad();
      while (acc >= 1 / 60) { acc -= 1 / 60; this.t += 1 / 60; this.update(1 / 60); this.latch(); }
      this.render();
    };
    requestAnimationFrame(frame);
  },
  down(code) {
    if (this.keys[code]) return;
    this.keys[code] = true; this.audioInit();
    if (this.MAP.pause.includes(code)) {
      if (code === 'Escape' && this.embed && this.onTitle && this.onTitle()) { parent.postMessage({ type: 'hh-exit' }, '*'); return; }
      this.onPause && this.onPause();
    }
    if (this.MAP.start.includes(code)) this.onStart && this.onStart();
  },
  up(code) { this.keys[code] = false; },
  held(name) {
    if (this.touch[name] || this.pad[name]) return true;
    for (const k of this.MAP[name]) if (this.keys[k]) return true;
    return false;
  },
  // true only on the step the button went down
  hit(name) { return this.held(name) && !this.prev[name]; },
  latch() { for (const n in this.MAP) this.prev[n] = this.held(n); },
  axisX() { return this.stick.x || ((this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0)); },
  axisY() { return this.stick.y || ((this.held('down') ? 1 : 0) - (this.held('up') ? 1 : 0)); },
  pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const P = this.pad; for (const k in P) P[k] = false; this.stick.x = this.stick.y = 0;
    for (const p of pads) {
      if (!p) continue;
      const b = i => p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.4);
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      if (Math.abs(ax) > 0.25) this.stick.x = ax; if (Math.abs(ay) > 0.25) this.stick.y = ay;
      P.left = P.left || b(14); P.right = P.right || b(15); P.up = P.up || b(12); P.down = P.down || b(13);
      P.a = P.a || b(0); P.b = P.b || b(1); P.c = P.c || b(2); P.d = P.d || b(3);
      const st = b(9);
      if (st && !this.padPrev.start) { this.audioInit(); this.onStart && this.onStart(); }
      this.padPrev.start = st;
    }
  },
  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight, c = this.canvas;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    c.style.width = w + 'px'; c.style.height = h + 'px';
    this.scale = Math.min(w / this.W, h / this.H) * dpr;
    this.ox = (c.width - this.W * this.scale) / 2; this.oy = (c.height - this.H * this.scale) / 2;
    this.dpr = dpr;
  },
  // map a client point to logical coordinates
  toLogical(cx, cy) { return { x: (cx * this.dpr - this.ox) / this.scale, y: (cy * this.dpr - this.oy) / this.scale }; },
  begin(bg = '#000') {
    const g = this.ctx, c = this.canvas;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
    g.setTransform(this.scale, 0, 0, this.scale, this.ox, this.oy);
    g.fillStyle = bg; g.fillRect(0, 0, this.W, this.H);
    g.save(); g.beginPath(); g.rect(0, 0, this.W, this.H); g.clip();
    return g;
  },
  end() { this.ctx.restore(); },

  /* ---------- text ---------- */
  text(s, x, y, size, color = '#fff', align = 'center', opts = {}) {
    const g = this.ctx;
    g.font = `${opts.italic === false ? '' : 'italic '}900 ${size}px "Arial Black", Impact, sans-serif`;
    g.textAlign = align; g.textBaseline = 'middle';
    if (opts.glow) { g.shadowColor = opts.glow; g.shadowBlur = opts.blur || size * 0.6; }
    if (opts.stroke !== false) { g.lineWidth = Math.max(2, size * 0.14); g.strokeStyle = opts.stroke || '#1a0b02'; g.lineJoin = 'round'; g.strokeText(s, x, y); }
    g.fillStyle = color; g.fillText(s, x, y);
    g.shadowBlur = 0;
  },
  mono(s, x, y, size, color = '#fff', align = 'left') {
    const g = this.ctx; g.font = `bold ${size}px ui-monospace, "Courier New", monospace`;
    g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = color; g.fillText(s, x, y);
  },
  blink(rate = 1.6) { return Math.floor(this.t * rate * 2) % 2 === 0; },

  /* ---------- sound ---------- */
  ac: null,
  audioInit() {
    if (!this.ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; this.ac = new AC(); this.master = this.ac.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ac.destination); }
    if (this.ac.state === 'suspended') this.ac.resume();
  },
  tone(f, dur = 0.1, vol = 0.2, type = 'square', slide = 0, delay = 0) {
    const c = this.ac; if (!c) return; const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur = 0.2, vol = 0.3, freq = 1200, type = 'lowpass', delay = 0) {
    const c = this.ac; if (!c) return;
    if (!this.nbuf) { this.nbuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = this.nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t = c.currentTime + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.nbuf; f.type = type; f.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  jingle(notes, step = 0.09, type = 'square', vol = 0.12) { notes.forEach((n, i) => this.tone(n, step * 1.6, vol, type, 0, i * step)); },

  /* ---------- high scores ---------- */
  hi(key) { try { return +localStorage.getItem('ia-hi-' + key) || 0; } catch (e) { return 0; } },
  setHi(key, v) { try { if (v > this.hi(key)) { localStorage.setItem('ia-hi-' + key, v); return true; } } catch (e) { } return false; },

  /* ---------- touch controls when the game is opened on its own ---------- */
  buildTouch() {
    const box = document.createElement('div'); box.id = 'touch'; document.body.appendChild(box);
    const mk = (name, label, css) => {
      const d = document.createElement('div'); d.className = 'tbtn'; d.textContent = label; Object.assign(d.style, css); box.appendChild(d);
      const on = e => { e.preventDefault(); this.touch[name] = true; d.classList.add('on'); this.audioInit(); if (name === 'start') this.onStart && this.onStart(); };
      const off = e => { e.preventDefault(); this.touch[name] = false; d.classList.remove('on'); };
      d.addEventListener('touchstart', on, { passive: false }); d.addEventListener('touchend', off); d.addEventListener('touchcancel', off);
    };
    const L = this.touchLabels || {};
    mk('left', '◀', { left: '12px', bottom: '70px' }); mk('right', '▶', { left: '120px', bottom: '70px' });
    mk('up', '▲', { left: '66px', bottom: '124px' }); mk('down', '▼', { left: '66px', bottom: '16px' });
    if (L.a) mk('a', L.a, { right: '16px', bottom: '40px' });
    if (L.b) mk('b', L.b, { right: '90px', bottom: '20px' });
    if (L.c) mk('c', L.c, { right: '30px', bottom: '116px' });
    if (L.d) mk('d', L.d, { right: '104px', bottom: '96px' });
    mk('start', 'START', { right: '50%', top: '8px', width: '70px', height: '34px', borderRadius: '17px', transform: 'translateX(50%)', fontSize: '12px' });
  },
};

/* ---------- small helpers used by several games ---------- */
class Particles {
  constructor() { this.list = []; }
  burst(x, y, n, colors, speed = 120, life = 0.6, size = 2, grav = 0) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = speed * (0.3 + Math.random() * 0.7);
      this.list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.5 + Math.random() * 0.5), max: life, size: size * (0.6 + Math.random() * 0.8), c: pick(colors), grav });
    }
  }
  update(dt) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i]; p.life -= dt; if (p.life <= 0) { L.splice(i, 1); continue; }
      p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985; p.vy *= 0.985;
    }
  }
  draw(g) {
    for (const p of this.list) { g.globalAlpha = clamp(p.life / p.max, 0, 1); g.fillStyle = p.c; g.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); }
    g.globalAlpha = 1;
  }
  clear() { this.list.length = 0; }
}
