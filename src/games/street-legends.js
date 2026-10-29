/* =====================================================================
   STREET LEGENDS — 2D one-on-one fighter
   Skeletal fighters (IK limbs, shaded capsules), frame-data combat,
   motion-input specials, supers, CPU ladder and two-player versus.
   ===================================================================== */
const FLOOR = 330, STAGE_W = 820, SW = 480;
const LEN = { th: 27, sh: 27, ua: 21, fa: 20, tor: 34 };
const INK = '#120d1a';

/* ---------- poses: pelvis, torso lean, head tilt, hand and foot targets (local: x forward, y up) ---------- */
const P = (px, py, tor, fh, bh, ff, bf, head = 0) => ({ px, py, tor, head, fh, bh, ff, bf });
const POSES = {
  idle: P(0, 50, 8, [24, 88], [12, 80], [17, 0], [-17, 0]),
  idle2: P(0, 48, 10, [25, 86], [13, 78], [17, 0], [-17, 0], 3),
  walk1: P(1, 50, 9, [24, 88], [12, 80], [24, 0], [-10, 4]),
  walk2: P(1, 51, 9, [23, 87], [13, 80], [8, 5], [-22, 0]),
  crouch: P(2, 30, 22, [28, 58], [16, 52], [20, 0], [-16, 0]),
  jump: P(0, 50, 4, [22, 84], [10, 78], [14, 26], [-8, 22]),
  blockH: P(-3, 50, -4, [20, 94], [16, 86], [16, 0], [-19, 0], -4),
  blockL: P(-1, 30, 14, [22, 64], [18, 56], [20, 0], [-17, 0]),
  hitH: P(-7, 50, -24, [8, 74], [-8, 70], [18, 0], [-19, 0], -16),
  hitL: P(-3, 45, 34, [14, 50], [6, 48], [16, 0], [-19, 0], 12),
  air: P(0, 50, -40, [-10, 96], [-20, 84], [20, 30], [6, 20], -20),
  down: P(-26, 9, -88, [-46, 20], [-36, 8], [24, 6], [16, 14], -6),
  getup: P(-6, 26, 30, [20, 6], [10, 8], [18, 0], [-14, 6]),
  jab0: P(1, 50, 10, [30, 88], [12, 82], [18, 0], [-16, 0]),
  jab: P(5, 50, 16, [62, 89], [12, 82], [20, 0], [-16, 0]),
  cross0: P(-3, 50, 0, [22, 90], [0, 84], [17, 0], [-17, 0]),
  cross: P(9, 48, 28, [14, 82], [70, 90], [26, 0], [-12, 0]),
  lk0: P(0, 51, 4, [22, 88], [8, 80], [16, 20], [-17, 0]),
  lk: P(-2, 51, -10, [18, 86], [4, 80], [58, 44], [-17, 0]),
  hk0: P(-3, 50, -4, [24, 88], [10, 82], [17, 0], [-4, 30]),
  hk: P(4, 53, -28, [14, 90], [-8, 84], [6, 0], [66, 94]),
  cjab: P(4, 30, 20, [54, 58], [16, 52], [20, 0], [-16, 0]),
  clk: P(0, 28, 12, [26, 56], [14, 50], [58, 4], [-18, 0]),
  chp0: P(0, 30, 24, [28, 58], [24, 44], [20, 0], [-16, 0]),
  chp: P(5, 46, 4, [20, 74], [22, 128], [20, 0], [-14, 0]),
  chk0: P(-2, 26, 30, [28, 50], [16, 44], [18, 0], [-8, 14]),
  chk: P(-6, 22, 46, [34, 10], [20, 16], [14, 0], [72, 4]),
  jpunch: P(0, 50, 26, [48, 50], [10, 74], [12, 30], [-6, 24]),
  jkick: P(0, 50, -8, [18, 84], [4, 78], [58, 24], [-8, 28]),
  throw0: P(6, 50, 16, [46, 82], [42, 74], [22, 0], [-14, 0]),
  throw: P(-2, 50, -34, [-14, 112], [-20, 104], [18, 0], [-16, 0]),
  fire0: P(-5, 48, -8, [-8, 74], [-14, 70], [22, 0], [-20, 0]),
  fire: P(9, 46, 22, [60, 80], [54, 74], [31, 0], [-22, 0]),
  upper0: P(2, 32, 18, [22, 60], [28, 50], [20, 0], [-16, 0]),
  upper: P(4, 56, 2, [20, 72], [16, 140], [18, 28], [-4, 8]),
  spin: P(0, 54, -12, [-26, 92], [24, 94], [68, 62], [-4, 28]),
  flip: P(0, 54, -20, [-10, 90], [-20, 96], [40, 120], [-6, 30]),
  win: P(0, 50, 2, [22, 70], [8, 134], [14, 0], [-14, 0], -6),
  win2: P(0, 49, 6, [26, 90], [6, 132], [16, 0], [-14, 0], -4),
  lose: P(-4, 24, 40, [18, 6], [8, 8], [22, 0], [-12, 4], 22),
  dash: P(7, 44, 32, [34, 78], [22, 70], [26, 0], [-26, 10]),
  shoulder: P(9, 46, 38, [36, 84], [20, 72], [28, 0], [-24, 0], 8),
  slide: P(-8, 14, -58, [-22, 40], [-32, 18], [56, 4], [24, 8]),
  pound0: P(0, 56, -10, [10, 132], [0, 128], [14, 0], [-14, 0]),
  pound: P(4, 26, 52, [46, 2], [38, 2], [20, 0], [-18, 0]),
  rush: P(9, 46, 24, [66, 84], [20, 76], [28, 0], [-20, 0]),
  rush2: P(9, 48, 18, [18, 80], [66, 92], [24, 0], [-18, 0]),
  intro: P(0, 50, 0, [14, 70], [2, 70], [12, 0], [-12, 0], -4),
};
function lerpPose(a, b, t) {
  const L = (x, y) => x + (y - x) * t, L2 = (x, y) => [L(x[0], y[0]), L(x[1], y[1])];
  return { px: L(a.px, b.px), py: L(a.py, b.py), tor: L(a.tor, b.tor), head: L(a.head, b.head), fh: L2(a.fh, b.fh), bh: L2(a.bh, b.bh), ff: L2(a.ff, b.ff), bf: L2(a.bf, b.bf) };
}
const clonePose = p => lerpPose(p, p, 0);

/* ---------- moves (frames at 60fps). box: [x, y, w, h] local, x forward from origin, y up ---------- */
const NORMALS = {
  LP: { s: 3, a: 3, r: 7, dmg: 40, hs: 13, bs: 9, push: 4, lvl: 'mid', box: [26, 80, 40, 18], w: 'jab0', p: 'jab', chain: ['LP', 'HP', 'LK', 'HK'] },
  HP: { s: 6, a: 4, r: 16, dmg: 95, hs: 19, bs: 14, push: 7, lvl: 'mid', box: [30, 78, 46, 20], w: 'cross0', p: 'cross', heavy: true },
  LK: { s: 5, a: 3, r: 10, dmg: 55, hs: 14, bs: 10, push: 5, lvl: 'mid', box: [30, 32, 40, 22], w: 'lk0', p: 'lk', chain: ['HP', 'HK'] },
  HK: { s: 9, a: 4, r: 19, dmg: 110, hs: 20, bs: 15, push: 9, lvl: 'mid', box: [34, 78, 44, 26], w: 'hk0', p: 'hk', heavy: true },
  cLP: { s: 3, a: 3, r: 7, dmg: 35, hs: 12, bs: 8, push: 4, lvl: 'mid', box: [24, 48, 40, 16], w: 'crouch', p: 'cjab', crouch: true, chain: ['cLP', 'cLK', 'cHP', 'cHK', 'HP'] },
  cLK: { s: 4, a: 3, r: 9, dmg: 40, hs: 12, bs: 9, push: 4, lvl: 'low', box: [26, 0, 44, 14], w: 'crouch', p: 'clk', crouch: true, chain: ['cLP', 'cLK', 'cHP', 'cHK'] },
  cHP: { s: 6, a: 5, r: 18, dmg: 90, hs: 19, bs: 14, push: 6, lvl: 'mid', box: [8, 70, 40, 66], w: 'chp0', p: 'chp', crouch: true, aa: true, heavy: true },
  cHK: { s: 9, a: 4, r: 24, dmg: 90, hs: 0, bs: 14, push: 8, lvl: 'low', box: [26, 0, 56, 16], w: 'chk0', p: 'chk', crouch: true, kd: true, heavy: true },
  jLP: { s: 4, a: 7, r: 4, dmg: 60, hs: 15, bs: 10, push: 3, lvl: 'high', box: [16, 36, 40, 34], w: 'jump', p: 'jpunch', air: true },
  jHP: { s: 6, a: 6, r: 4, dmg: 90, hs: 18, bs: 12, push: 4, lvl: 'high', box: [18, 36, 42, 34], w: 'jump', p: 'jpunch', air: true },
  jLK: { s: 4, a: 8, r: 4, dmg: 65, hs: 15, bs: 10, push: 3, lvl: 'high', box: [18, 12, 46, 30], w: 'jump', p: 'jkick', air: true },
  jHK: { s: 6, a: 7, r: 4, dmg: 95, hs: 18, bs: 12, push: 4, lvl: 'high', box: [20, 10, 48, 32], w: 'jump', p: 'jkick', air: true },
};

/* ---------- fighters ---------- */
const CHARS = [
  { id: 'kaito', name: 'KAITO', title: 'The Wandering Fist', home: 0, scale: 1.0, speed: 1.0, hp: 1000,
    skin: '#e8b48a', hair: '#1b1410', hairStyle: 'spiky', top: 'gi', topCol: '#f2efe6', trim: '#d8d2c2', pants: '#f2efe6', belt: '#1b1b1b', band: '#e0242a', glove: '#e0242a', feet: 'bare',
    specials: { qcf_p: 'kiBlast', dp_p: 'risingDragon', qcb_k: 'tornado', super: 'kiStorm' }, color: '#ff3b3b' },
  { id: 'mei', name: 'MEI', title: 'Storm Lotus', home: 3, scale: 0.94, speed: 1.15, hp: 920,
    skin: '#f0c4a0', hair: '#141022', hairStyle: 'buns', top: 'qipao', topCol: '#1f5fd6', trim: '#ffd21f', pants: '#1f3f9a', belt: '#ffd21f', band: null, glove: '#f4f0ff', feet: 'boots', bootCol: '#f4f0ff',
    specials: { qcf_p: 'spiritOrb', dp_k: 'crescent', qcb_k: 'lightningLegs', super: 'blossom' }, color: '#2f8bff' },
  { id: 'brick', name: 'BRICK', title: 'Harbor Wrecker', home: 1, scale: 1.13, speed: 0.82, hp: 1150,
    skin: '#a8714c', hair: '#ff6a00', hairStyle: 'mohawk', top: 'tank', topCol: '#3a7a3a', trim: '#2a5a2a', pants: '#3b3b4a', belt: '#7a5a2a', band: null, glove: '#2b2b2b', feet: 'boots', bootCol: '#2a1a12',
    specials: { qcf_p: 'shoulder', qcb_p: 'groundPound', dp_p: 'ironClutch', super: 'wreckingBall' }, color: '#3bc45a' },
  { id: 'vex', name: 'VEX', title: 'Alley Phantom', home: 2, scale: 0.98, speed: 1.08, hp: 960,
    skin: '#d9a07a', hair: '#e8e8f8', hairStyle: 'hood', top: 'hoodie', topCol: '#4a2a7a', trim: '#b04bff', pants: '#1e1e2a', belt: '#b04bff', band: null, glove: '#1e1e2a', feet: 'boots', bootCol: '#111',
    specials: { qcf_p: 'shuriken', qcb_k: 'shadowSlide', dp_k: 'phaseStep', super: 'nightShade' }, color: '#b04bff' },
];
const SHADOW = c => Object.assign({}, c, { name: 'SHADOW ' + c.name, title: 'Your darkest reflection', skin: '#6a5a7a', hair: '#05040a', topCol: '#1a1424', trim: '#3a2050', pants: '#1a1424', glove: '#ff2d6f', band: c.band ? '#ff2d6f' : null, bootCol: '#000', color: '#ff2d6f', shadow: true, hp: 1100 });

/* specials: type + parameters */
const SPECIALS = {
  kiBlast: { type: 'proj', s: 12, r: 28, dmg: 85, speed: 4.6, col: ['#bff6ff', '#2fe6ff'], size: 12, pose: ['fire0', 'fire'] },
  spiritOrb: { type: 'proj', s: 13, r: 26, dmg: 75, speed: 3.6, col: ['#fff', '#ff6ad5'], size: 11, wave: true, pose: ['fire0', 'fire'] },
  shuriken: { type: 'proj', s: 8, r: 20, dmg: 55, speed: 7, col: ['#fff', '#b8b8c8'], size: 7, star: true, pose: ['jab0', 'jab'] },
  risingDragon: { type: 'rise', s: 3, dmg: 70, hits: 2, vy: 11.5, vx: 2.4, r: 20, pose: ['upper0', 'upper'], box: [6, 60, 46, 90], inv: 8 },
  crescent: { type: 'rise', s: 4, dmg: 65, hits: 2, vy: 10.5, vx: 3, r: 18, pose: ['upper0', 'flip'], box: [0, 50, 56, 90], inv: 7, flip: true },
  tornado: { type: 'spin', s: 8, dmg: 45, hits: 3, dur: 32, vx: 4.2, r: 14, pose: ['hk0', 'spin'], box: [10, 50, 60, 30] },
  lightningLegs: { type: 'flurry', s: 5, dmg: 24, hits: 5, dur: 30, r: 14, pose: ['lk0', 'lk'], box: [26, 30, 48, 40] },
  shoulder: { type: 'charge', s: 9, dmg: 115, dur: 18, vx: 7.2, r: 20, pose: ['dash', 'shoulder'], box: [16, 50, 40, 50] },
  groundPound: { type: 'wave', s: 16, r: 26, dmg: 80, speed: 5, pose: ['pound0', 'pound'] },
  ironClutch: { type: 'grab', s: 6, r: 28, dmg: 190, range: 56, pose: ['throw0', 'throw'] },
  shadowSlide: { type: 'slide', s: 5, dmg: 75, dur: 20, vx: 6.4, r: 18, pose: ['crouch', 'slide'], box: [10, 0, 56, 22] },
  phaseStep: { type: 'teleport', s: 10, r: 14 },
  kiStorm: { type: 'beam', s: 18, r: 30, dmg: 46, hits: 6 },
  blossom: { type: 'rush', s: 10, r: 26, dmg: 30, hits: 8, finisher: 80, vx: 9 },
  nightShade: { type: 'rush', s: 8, r: 26, dmg: 32, hits: 7, finisher: 90, vx: 10 },
  wreckingBall: { type: 'rush', s: 12, r: 30, dmg: 70, hits: 3, finisher: 120, vx: 7.5, grab: true },
};

/* ---------- game state ---------- */
const S = {
  screen: 'title', menu: 0, cpu: 1, mode: 'arcade', sel: [0, 1], picked: [false, false], stageSel: 0,
  f: [null, null], stage: 0, round: 1, wins: [0, 0], timer: 99, phase: 'intro', phaseT: 0, hitstop: 0, slow: 0, shake: 0,
  projs: [], fx: new Particles(), sparks: [], texts: [], ladder: [], ladderI: 0, flash: 0, superFreeze: 0, camX: 170, tframe: 0,
};

/* =====================================================================
   INPUT
   ===================================================================== */
const PAD_BTNS = { lp: 2, hp: 3, lk: 0, hk: 1, sp: 5, su: 7 };
const BTNS = ['lp', 'hp', 'lk', 'hk', 'sp', 'su'];
class Controller {
  constructor(kind) { this.kind = kind; this.hist = []; this.btn = {}; this.prevBtn = {}; this.press = {}; this.dirAbs = { x: 0, y: 0 }; }
  read(face, ai) {
    let x = 0, y = 0, b = {};
    const k = c => Kit.isDown(c);
    if (this.kind === 'cpu') { x = ai.x; y = ai.y; b = ai.btn; }
    else if (this.kind === 'solo') {
      x = Kit.axisX(); y = -Kit.axisY(); x = Math.abs(x) > 0.4 ? Math.sign(x) : 0; y = Math.abs(y) > 0.4 ? Math.sign(y) : 0;
      b = { lp: Kit.held('a'), hp: Kit.held('b'), lk: Kit.held('c'), hk: Kit.held('d'), sp: Kit.held('e'), su: Kit.held('f') };
    } else {
      const p2 = this.kind === 'p2', pad = (navigator.getGamepads ? navigator.getGamepads() : [])[p2 ? 1 : 0];
      if (p2) { x = (k('ArrowRight') ? 1 : 0) - (k('ArrowLeft') ? 1 : 0); y = (k('ArrowUp') ? 1 : 0) - (k('ArrowDown') ? 1 : 0); b = { lp: k('KeyJ'), hp: k('KeyK'), lk: k('KeyL'), hk: k('KeyI'), sp: k('KeyU'), su: k('KeyO') }; }
      else { x = (k('KeyD') ? 1 : 0) - (k('KeyA') ? 1 : 0); y = (k('KeyW') ? 1 : 0) - (k('KeyS') ? 1 : 0); b = { lp: k('KeyF'), hp: k('KeyG'), lk: k('KeyR'), hk: k('KeyT'), sp: k('KeyH'), su: k('KeyY') }; }
      if (pad) {
        const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0, pb = i => pad.buttons[i] && pad.buttons[i].pressed;
        if (Math.abs(ax) > 0.4) x = Math.sign(ax); if (Math.abs(ay) > 0.4) y = -Math.sign(ay);
        if (pb(14)) x = -1; if (pb(15)) x = 1; if (pb(12)) y = 1; if (pb(13)) y = -1;
        for (const n in PAD_BTNS) b[n] = b[n] || pb(PAD_BTNS[n]);
      }
    }
    this.dirAbs = { x, y };
    const rx = x * face, num = 5 + rx + 3 * y;
    this.dir = num;
    this.hist.push(num); if (this.hist.length > 40) this.hist.shift();
    for (const n of BTNS) { this.press[n] = b[n] && !this.prevBtn[n]; this.prevBtn[n] = b[n]; this.btn[n] = b[n]; }
    if (BTNS.some(n => this.press[n])) this.lastPress = { ...this.press, age: 0 }; else if (this.lastPress) this.lastPress.age++;
  }
  // does the recent direction history contain this sequence (in order) within `win` frames?
  motion(seq, win = 18) {
    const h = this.hist.slice(-win); let i = 0;
    for (const d of h) if (d === seq[i]) { i++; if (i === seq.length) return true; }
    return false;
  }
  // the most recent held direction, ignoring a few frames of neutral
  lastDir() { for (let i = this.hist.length - 1, n = 0; i >= 0 && n < 6; i--, n++) if (this.hist[i] !== 5) return this.hist[i]; return 5; }
  doubleTap(d) {
    const h = this.hist.slice(-16); let phase = 0;
    for (const x of h) { if (phase === 0 && x === d) phase = 1; else if (phase === 1 && x === 5) phase = 2; else if (phase === 2 && x === d) return true; }
    return false;
  }
}

/* =====================================================================
   FIGHTER
   ===================================================================== */
class Fighter {
  constructor(ch, side, ctrl) {
    this.ch = ch; this.side = side; this.ctrl = ctrl; this.s = ch.scale * 1.18;
    this.reset();
  }
  reset() {
    this.x = this.side ? STAGE_W / 2 + 90 : STAGE_W / 2 - 90; this.y = 0; this.vx = 0; this.vy = 0; this.face = this.side ? -1 : 1;
    this.hp = this.ch.hp; this.dhp = this.hp; this.meter = this.meter || 0; this.st = 'intro'; this.t = 0; this.move = null;
    this.stun = 0; this.combo = 0; this.inv = 0; this.pose = clonePose(POSES.idle); this.target = POSES.idle; this.blend = 0.3;
    this.spinFlip = 1; this.alpha = 1; this.proj = null; this.ai = { x: 0, y: 0, btn: {}, think: 0, q: [] }; this.trail = [];
  }
  get grounded() { return this.y <= 0 && this.st !== 'air' && this.st !== 'airhit'; }
  get opp() { return S.f[1 - this.side]; }
  set(st, pose, blend = 0.3) { this.st = st; this.t = 0; if (pose) { this.target = POSES[pose]; this.blend = blend; } }
  actionable() { return ['idle', 'walk', 'crouch', 'block'].includes(this.st) && this.stun <= 0; }

  /* ----- per-frame logic ----- */
  update() {
    const c = this.ctrl, o = this.opp;
    this.t++; if (this.inv > 0) this.inv--;
    if (this.dhp > this.hp) this.dhp -= Math.max(2, (this.dhp - this.hp) * 0.04);
    const dir = c.dir, back = dir === 4 || dir === 1 || dir === 7, down = dir <= 3, up = dir >= 7;
    this.holdBack = back; this.holdDown = down;
    switch (this.st) {
      case 'intro': this.target = this.t < 60 ? POSES.intro : POSES.idle; break;
      case 'idle': case 'walk': case 'crouch': case 'block': {
        if (this.st === 'block') { if (--this.stun > 0) break; this.st = 'idle'; }
        if (this.tryAttack()) break;
        if (up && S.phase === 'fight') { this.set('jumpsq', 'crouch', 0.5); this.jdir = dir === 9 ? 1 : dir === 7 ? -1 : 0; break; }
        if (c.doubleTap(6) && S.phase === 'fight') { this.set('dash', 'dash', 0.4); this.dashDir = 1; Kit.noise(0.12, 0.08, 2200, 'highpass'); break; }
        if (c.doubleTap(4) && S.phase === 'fight') { this.set('dash', 'jump', 0.4); this.dashDir = -1; break; }
        if (down) { this.st = 'crouch'; this.target = POSES.crouch; this.blend = 0.35; this.vx = 0; }
        else if ((dir === 6 || dir === 4) && S.phase === 'fight') {
          this.st = 'walk'; const sp = (dir === 6 ? 2.6 : 2.1) * this.ch.speed;
          this.vx = sp * this.face * (dir === 6 ? 1 : -1);
          const ph = Math.floor(this.t / 9) % 2; this.target = POSES[ph ? 'walk2' : 'walk1']; this.blend = 0.25;
        } else { this.st = 'idle'; this.vx = 0; this.target = (Math.floor(Kit.t * 1.6) % 2) ? POSES.idle2 : POSES.idle; this.blend = 0.08; }
        break;
      }
      case 'jumpsq': this.vx = 0; if (this.t >= 3) { this.st = 'air'; this.t = 0; this.vy = 10.6; this.vx = this.jdir * 3.3 * this.face * Math.min(1.1, this.ch.speed); this.target = POSES.jump; this.blend = 0.3; this.airAtk = false; Kit.noise(0.08, 0.05, 900); } break;
      case 'air': this.physicsAir(); if (this.st === 'air' && !this.airAtk && this.tryAirAttack()) break; break;
      case 'land': this.vx *= 0.6; if (this.t >= 4) this.set('idle', 'idle'); break;
      case 'dash': { const d = this.dashDir, dur = d > 0 ? 14 : 12; this.vx = (d > 0 ? 6.2 : -5) * this.face * this.ch.speed * (1 - this.t / dur * 0.6); if (this.t >= dur) this.set('idle', 'idle'); break; }
      case 'attack': this.runAttack(); break;
      case 'special': this.runSpecial(); break;
      case 'hit': this.vx *= 0.85; if (--this.stun <= 0) { this.set(this.holdDown ? 'crouch' : 'idle', this.holdDown ? 'crouch' : 'idle', 0.3); this.combo = 0; } break;
      case 'airhit': this.physicsAir(true); break;
      case 'down': this.vx *= 0.8; if (this.t >= (this.hp <= 0 ? 9999 : 34)) { this.set('getup', 'getup', 0.2); this.inv = 18; } break;
      case 'getup': if (this.t >= 16) { this.set('idle', 'idle', 0.2); this.combo = 0; } break;
      case 'throw': this.runThrow(); break;
      case 'thrown': break;
      case 'win': this.target = Math.floor(this.t / 20) % 2 ? POSES.win2 : POSES.win; this.blend = 0.15; this.vx = 0; break;
      case 'lose': this.target = POSES.lose; this.blend = 0.08; this.vx *= 0.9; break;
    }
    if (this.grounded && this.st !== 'airhit') { this.x += this.vx; if (this.st !== 'walk' && this.st !== 'dash' && this.st !== 'special') this.vx *= 0.8; }
    // keep the pose moving toward the target
    this.pose = lerpPose(this.pose, this.target, this.blend);
    // face the opponent when free on the ground
    if (o && (this.st === 'idle' || this.st === 'walk' || this.st === 'crouch' || this.st === 'land') && Math.abs(o.x - this.x) > 4) this.face = o.x > this.x ? 1 : -1;
    if (this.st === 'attack' || this.st === 'special' || this.st === 'dash') { this.trail.push([this.x, this.y]); if (this.trail.length > 5) this.trail.shift(); } else this.trail.length = 0;
  }
  physicsAir(hurt) {
    this.vy -= hurt ? 0.5 : 0.55; this.y += this.vy; this.x += this.vx;
    if (hurt) { this.target = POSES.air; this.blend = 0.25; }
    if (this.y <= 0 && this.vy < 0) {
      this.y = 0; this.vy = 0;
      S.fx.burst(this.x, FLOOR, hurt ? 16 : 6, ['#d8c8b0', '#a89880'], hurt ? 90 : 50, 0.5, 3, 80);
      if (hurt) { this.set('down', 'down', 0.4); this.vx *= 0.4; S.shake = Math.max(S.shake, 6); Kit.noise(0.25, 0.25, 300); }
      else { this.set('land', 'crouch', 0.5); this.move = null; }
    }
  }
  /* ----- starting attacks ----- */
  tryAttack(cancelFrom) {
    const c = this.ctrl, p = c.lastPress; if (!p || p.age > 3) return false;
    const P = p.lp || p.hp, K = p.lk || p.hk, sp = this.ch.specials, last = c.lastDir();
    if (S.phase !== 'fight') return false;
    // super
    // one-button inputs: SUPER (or HP + HK together) when the bar is full, and SPECIAL with a direction
    const both = (p.hp && c.btn.hk) || (p.hk && c.btn.hp);
    if ((p.su || both) && sp.super && this.meter >= 100) return this.startSpecial(sp.super, true);
    if (p.su && !both) { c.lastPress = null; return false; }
    if (p.sp) {
      const d = c.dir, id = d <= 3 ? (sp.dp_p || sp.dp_k) : (d === 4 || d === 7) ? (sp.qcb_k || sp.qcb_p) : (sp.qcf_p || sp.qcb_p);
      if (!this.startSpecial(id)) c.lastPress = null;
      return true;
    }
    if (P && sp.super && this.meter >= 100 && (c.motion([2, 3, 6, 2, 3, 6], 34))) return this.startSpecial(sp.super, true);
    if (P && sp.dp_p && last === 3 && c.motion([6, 2, 3], 16)) return this.startSpecial(sp.dp_p);
    if (K && sp.dp_k && last === 3 && c.motion([6, 2, 3], 16)) return this.startSpecial(sp.dp_k);
    if (P && sp.qcf_p && last === 6 && c.motion([2, 3, 6], 14)) return this.startSpecial(sp.qcf_p);
    if (P && sp.qcb_p && last === 4 && c.motion([2, 1, 4], 14)) return this.startSpecial(sp.qcb_p);
    if (K && sp.qcb_k && last === 4 && c.motion([2, 1, 4], 14)) return this.startSpecial(sp.qcb_k);
    if (cancelFrom === 'special') return false;
    // throw: forward/back + HP up close
    const o = this.opp;
    if (p.hp && (c.dir === 6 || c.dir === 4) && Math.abs(o.x - this.x) < 46 * (this.s + o.s) / 2 && o.grounded && ['idle', 'walk', 'crouch', 'block', 'land', 'attack'].includes(o.st) && !(o.inv > 0) && !cancelFrom) {
      c.lastPress = null; this.set('throw', 'throw0', 0.5); this.throwBack = c.dir === 4; o.set('thrown', 'hitH', 0.4); o.vx = 0; o.thrownBy = this; return true;
    }
    const crouch = this.holdDown;
    const name = (crouch ? 'c' : '') + (p.lp ? 'LP' : p.hp ? 'HP' : p.lk ? 'LK' : 'HK');
    if (cancelFrom && !(NORMALS[cancelFrom].chain || []).includes(name)) return false;
    c.lastPress = null;
    this.startNormal(name); return true;
  }
  tryAirAttack() {
    const p = this.ctrl.lastPress; if (!p || p.age > 3) return false;
    if (!(p.lp || p.hp || p.lk || p.hk)) return false;
    this.ctrl.lastPress = null; this.airAtk = true;
    this.startNormal('j' + (p.lp ? 'LP' : p.hp ? 'HP' : p.lk ? 'LK' : 'HK')); return true;
  }
  startNormal(name) {
    const m = NORMALS[name];
    this.move = { name, m, hit: false, connected: false }; this.st = m.air ? 'air' : 'attack'; this.atkT = 0; if (!m.air) this.t = 0;
    this.target = POSES[m.w]; this.blend = 0.55; if (!m.air) this.vx = 0;
    Kit.noise(0.07, 0.06, m.heavy ? 1200 : 2400, 'bandpass');
  }
  startSpecial(id, isSuper) {
    const sp = SPECIALS[id];
    this.ctrl.lastPress = null;
    if (sp.type === 'proj' && this.proj && !this.proj.dead) return false;
    if (isSuper) { this.meter -= 100; S.superFreeze = 34; S.superBy = this; Kit.tone(220, 0.7, 0.16, 'sawtooth', 3); Kit.noise(0.6, 0.2, 3000, 'highpass'); }
    this.move = { sp, id, hits: 0, hitT: 0, connected: false, isSuper }; this.st = 'special'; this.t = 0; this.vx = 0;
    if (sp.pose) { this.target = POSES[sp.pose[0]]; this.blend = 0.5; }
    if (sp.inv) this.inv = sp.inv;
    return true;
  }
  /* ----- running normals ----- */
  runAttack() {
    const mv = this.move, m = mv.m, t = this.t;
    if (t === m.s) { this.target = POSES[m.p]; this.blend = 0.8; }
    if (t >= m.s && t < m.s + m.a && !mv.hit) this.checkHit(m.box, m, mv);
    if (t === m.s + m.a) { this.target = POSES[m.crouch ? 'crouch' : 'idle']; this.blend = 0.18; }
    // chain / special cancels on contact
    if (mv.connected && t >= m.s && t < m.s + m.a + 8) { if (this.tryAttack('special') || (m.chain && this.tryAttack(mv.name))) return; }
    if (t >= m.s + m.a + m.r) { this.move = null; this.set(m.crouch && this.holdDown ? 'crouch' : 'idle', m.crouch && this.holdDown ? 'crouch' : 'idle', 0.25); }
  }
  // air attacks run inside physicsAir via this.atkT
  airAttackTick() {
    const mv = this.move; if (!mv || !mv.m.air) return;
    const m = mv.m; this.atkT++;
    if (this.atkT === m.s) { this.target = POSES[m.p]; this.blend = 0.8; }
    if (this.atkT >= m.s && this.atkT < m.s + m.a && !mv.hit) this.checkHit(m.box, m, mv);
    if (this.atkT === m.s + m.a) { this.target = POSES.jump; this.blend = 0.2; }
  }
  /* ----- specials ----- */
  runSpecial() {
    const mv = this.move, sp = mv.sp, t = this.t, o = this.opp, f = this.face;
    const strike = () => { if (sp.pose) { this.target = POSES[sp.pose[1]]; this.blend = 0.7; } };
    switch (sp.type) {
      case 'proj':
        if (t === sp.s) { strike(); this.proj = spawnProj(this, sp); }
        if (t >= sp.s + sp.r) this.endSpecial(); break;
      case 'wave':
        if (t === sp.s) { strike(); S.shake = 8; Kit.noise(0.4, 0.4, 250); this.proj = spawnProj(this, { dmg: sp.dmg, speed: sp.speed, col: ['#ffe2a0', '#c08040'], size: 14, ground: true }); }
        if (t >= sp.s + sp.r) this.endSpecial(); break;
      case 'rise':
        if (t === sp.s) { strike(); this.vy = sp.vy; this.vx = sp.vx * f; this.y = 0.1; Kit.tone(300, 0.3, 0.12, 'sawtooth', 2.5); }
        if (t >= sp.s) {
          this.vy -= 0.55; this.y += this.vy; this.x += this.vx;
          if (sp.flip) this.flipA = (t - sp.s) / 22 * Math.PI * 2;
          if (this.vy > 0 && mv.hits < sp.hits && t - (mv.hitT || 0) > 5) this.checkHit(sp.box, { dmg: sp.dmg, hs: 26, bs: 18, push: 3, lvl: 'mid', kd: mv.hits === sp.hits - 1, launch: 9 }, mv, true);
          if (this.y <= 0 && this.vy < 0) { this.y = 0; this.vy = 0; this.flipA = 0; this.st = 'special'; mv.landT = mv.landT || t; }
          if (mv.landT && t - mv.landT >= sp.r) this.endSpecial();
        }
        break;
      case 'spin':
        if (t === sp.s) { strike(); this.vy = 3.5; this.y = 0.1; }
        if (t >= sp.s) {
          const k = t - sp.s; this.spinFlip = Math.floor(k / 5) % 2 ? -1 : 1;
          if (k < sp.dur) { this.vx = sp.vx * f; this.vy -= 0.12; this.y = Math.max(0.1, this.y + this.vy); this.x += this.vx; }
          if (k < sp.dur && k % 10 === 2) { mv.hit = false; }
          if (k < sp.dur && !mv.hit && mv.hits < sp.hits) this.checkHit(sp.box, { dmg: sp.dmg, hs: 18, bs: 12, push: 2, lvl: 'mid', kd: mv.hits === sp.hits - 1, launch: 7 }, mv);
          if (k >= sp.dur) { this.y = Math.max(0, this.y - 4); this.spinFlip = 1; this.vx = 0; this.target = POSES.idle; this.blend = 0.2; }
          if (k >= sp.dur + sp.r) { this.y = 0; this.endSpecial(); }
        }
        break;
      case 'flurry':
        if (t >= sp.s && t < sp.s + sp.dur) {
          const k = t - sp.s; this.target = POSES[k % 6 < 3 ? 'lk' : 'hk']; this.blend = 0.85;
          if (k % 6 === 0) mv.hit = false;
          if (!mv.hit && mv.hits < sp.hits) this.checkHit(sp.box, { dmg: sp.dmg, hs: 14, bs: 9, push: 1.5, lvl: 'mid' }, mv);
        }
        if (t === sp.s + sp.dur) { this.target = POSES.idle; this.blend = 0.2; }
        if (t >= sp.s + sp.dur + sp.r) this.endSpecial(); break;
      case 'charge': case 'slide':
        if (t === sp.s) { strike(); Kit.noise(0.3, 0.12, 1800, 'bandpass'); }
        if (t >= sp.s && t < sp.s + sp.dur && !mv.hit) { this.vx = sp.vx * f; this.checkHit(sp.box, { dmg: sp.dmg, hs: 20, bs: 16, push: 9, lvl: sp.type === 'slide' ? 'low' : 'mid', kd: true, launch: sp.type === 'slide' ? 5 : 7 }, mv); if (sp.type === 'charge' && Math.random() < 0.5) S.fx.burst(this.x - f * 20, FLOOR, 2, ['#cbb'], 40, 0.3, 3, 40); }
        if (t >= sp.s + sp.dur || mv.hit) { this.vx *= 0.7; this.target = POSES[sp.type === 'slide' ? 'crouch' : 'idle']; this.blend = 0.2; }
        if (t >= sp.s + sp.dur + sp.r) this.endSpecial(); break;
      case 'grab':
        if (t === sp.s) { strike(); }
        if (t === sp.s + 1) {
          if (Math.abs(o.x - this.x) < sp.range * this.s && o.grounded && !(o.inv > 0) && o.st !== 'down' && o.st !== 'getup') {
            this.set('throw', 'throw0', 0.6); this.throwBack = false; this.throwDmg = sp.dmg; this.slam = true; o.set('thrown', 'hitH', 0.4); o.thrownBy = this; return;
          }
          this.target = POSES.idle; this.blend = 0.15;
        }
        if (t >= sp.s + sp.r) this.endSpecial(); break;
      case 'teleport':
        this.alpha = t < sp.s ? 1 - t / sp.s : Math.min(1, (t - sp.s) / 8); this.inv = 2;
        if (t === 2) S.fx.burst(this.x, FLOOR - 50, 24, ['#b04bff', '#fff', '#2a1040'], 90, 0.6, 3);
        if (t === sp.s) { this.x = clamp(o.x - o.face * 60, 30, STAGE_W - 30); this.face = o.x > this.x ? 1 : -1; S.fx.burst(this.x, FLOOR - 50, 24, ['#b04bff', '#fff'], 90, 0.6, 3); Kit.tone(1200, 0.2, 0.08, 'sine', 0.3); }
        if (t >= sp.s + sp.r) { this.alpha = 1; this.endSpecial(); } break;
      case 'beam':
        if (t === 1) { this.target = POSES.fire0; this.blend = 0.5; }
        if (t === sp.s) { this.target = POSES.fire; this.blend = 0.7; this.beam = { t: 0, hits: 0 }; Kit.noise(1.2, 0.35, 700); S.shake = 10; }
        if (this.beam) {
          const b = this.beam; b.t++;
          if (b.t % 6 === 1 && b.hits < sp.hits) {
            const bx0 = this.x + f * 50, bx1 = f > 0 ? STAGE_W : 0;
            if (o.inv <= 0 && o.st !== 'down' && Math.abs((o.x - bx0) / (bx1 - bx0 || 1)) <= 1 && (o.x - bx0) * f > -20 && o.y < 100) { applyHit(this, o, { dmg: sp.dmg, hs: 16, bs: 8, push: 2, lvl: 'mid', chip: 0.35, kd: b.hits === sp.hits - 1, launch: 8, spark: [o.x - f * 12, FLOOR - o.y - 70] }); b.hits++; }
          }
          if (b.t > 44) { this.beam = null; this.target = POSES.idle; this.blend = 0.2; }
        }
        if (t >= sp.s + 44 + sp.r) this.endSpecial(); break;
      case 'rush':
        if (t === sp.s) { this.target = POSES.dash; this.blend = 0.6; }
        if (t >= sp.s && !mv.connected) {
          this.vx = sp.vx * f; if (Math.random() < 0.6) S.fx.burst(this.x - f * 16, FLOOR - 40, 2, [this.ch.color, '#fff'], 30, 0.3, 3);
          const box = [10, 30, 40, 70];
          if (this.overlapOpp(box) && !(o.inv > 0) && o.st !== 'down') {
            if (sp.grab || !o.blocking()) { mv.connected = true; mv.ct = 0; o.set('hit', o.holdDown ? 'hitL' : 'hitH', 0.5); o.stun = 999; o.vx = 0; S.flash = 6; }
            else { applyHit(this, o, { dmg: 40, hs: 0, bs: 18, push: 10, lvl: 'mid', chip: 0.4 }); this.endSpecial(); return; }
          }
          if (t > sp.s + 30 && !mv.connected) { this.target = POSES.idle; this.blend = 0.2; if (t > sp.s + 50) this.endSpecial(); }
        }
        if (mv.connected) {
          mv.ct++; const step = sp.grab ? 14 : 6; this.vx = 0;
          this.x = o.x - f * 44 * (this.s + o.s) / 2;
          if (mv.ct % step === 0 && mv.hits < sp.hits) {
            this.target = POSES[mv.hits % 2 ? 'rush' : 'rush2']; this.blend = 0.9;
            applyHit(this, o, { dmg: sp.dmg, hs: 999, bs: 0, push: 0, lvl: 'unblock', spark: [o.x - f * 10, FLOOR - 60 - (mv.hits % 3) * 14], noPush: true }); mv.hits++;
          }
          if (mv.hits >= sp.hits && !mv.fin && mv.ct % step === step - 1) {
            mv.fin = true; this.target = POSES[sp.grab ? 'pound' : 'upper']; this.blend = 0.8;
            o.stun = 0; applyHit(this, o, { dmg: sp.finisher, hs: 0, bs: 0, push: 6, lvl: 'unblock', kd: true, launch: 11, big: true });
            S.shake = 14; Kit.noise(0.6, 0.45, 500);
          }
          if (mv.fin && mv.ct > sp.hits * step + 40) this.endSpecial();
        }
        break;
    }
  }
  endSpecial() { this.move = null; this.spinFlip = 1; this.flipA = 0; this.alpha = 1; this.set(this.holdDown ? 'crouch' : 'idle', this.holdDown ? 'crouch' : 'idle', 0.25); }
  runThrow() {
    const o = this.opp, f = this.face, t = this.t;
    o.x = this.x + f * 34; o.face = -f;
    if (t === 10) { this.target = POSES.throw; this.blend = 0.4; o.target = POSES.air; o.blend = 0.4; }
    if (t > 10 && t < 22) { o.y = Math.sin((t - 10) / 12 * Math.PI) * 50; o.x = this.x + f * (34 - (t - 10) * (this.throwBack ? 0 : 6)); }
    if (t === 22) {
      const dmg = this.throwDmg || 110; this.throwDmg = 0;
      if (!this.throwBack) { o.x = this.x - f * 40; }
      o.y = 0; o.thrownBy = null; o.set('airhit', 'air', 0.5); o.y = 1; o.vy = 4; o.vx = (this.throwBack ? 1 : -1) * f * 3.2;
      applyHit(this, o, { dmg, hs: 0, bs: 0, push: 0, lvl: 'unblock', kd: true, launch: 4, noPush: true, throw: true });
      S.shake = this.slam ? 16 : 10; this.slam = false; Kit.noise(0.4, 0.4, 400);
    }
    if (t >= 40) this.set('idle', 'idle', 0.2);
  }
  blocking() { return (this.st === 'idle' || this.st === 'walk' || this.st === 'crouch' || this.st === 'block') && this.holdBack && this.grounded; }
  overlapOpp(box) {
    const o = this.opp, f = this.face, s = this.s;
    const x0 = this.x + f * box[0] * s, x1 = this.x + f * (box[0] + box[2]) * s, hx0 = Math.min(x0, x1), hx1 = Math.max(x0, x1);
    const hy0 = this.y + box[1] * s, hy1 = hy0 + box[3] * s;
    const hb = o.hurtbox(); return !(hx1 < hb[0] || hx0 > hb[2] || hy1 < hb[1] || hy0 > hb[3]);
  }
  checkHit(box, info, mv, multi) {
    const o = this.opp; if (o.inv > 0 || o.st === 'down' || o.st === 'thrown' || o.hp <= 0 && o.st !== 'airhit') return;
    if (!this.overlapOpp(box)) return;
    mv.hit = true; mv.hitT = this.t; if (mv.hits !== undefined) mv.hits++;
    const f = this.face, s = this.s;
    const sx = this.x + f * (box[0] + box[2] * 0.8) * s, sy = FLOOR - (this.y + (box[1] + box[3] / 2) * s);
    const res = applyHit(this, o, Object.assign({ spark: [sx, sy] }, info));
    mv.connected = true;
  }
  hurtbox() {
    const s = this.s, w = 17 * s;
    if (this.st === 'down') return [this.x - 40, -99, this.x + 40, -98];
    const h = (this.st === 'crouch' || this.holdDown && this.st === 'block' || this.move && this.move.m && this.move.m.crouch || this.target === POSES.slide) ? 72 : 112;
    return [this.x - w, this.y, this.x + w, this.y + h * s];
  }
}
/* air attack ticking hooks into the air state */
const _physAir = Fighter.prototype.physicsAir;
Fighter.prototype.physicsAir = function (hurt) { if (!hurt && this.move && this.move.m && this.move.m.air) this.airAttackTick(); _physAir.call(this, hurt); };

/* ---------- hits ---------- */
function applyHit(a, d, h) {
  if (d.hp <= 0 && d.st === 'down') return;
  const blockOK = h.lvl !== 'unblock' && d.blocking() && !(h.lvl === 'low' && !d.holdDown) && !(h.lvl === 'high' && d.holdDown);
  const [sx, sy] = h.spark || [d.x - a.face * 14, FLOOR - d.y - 70];
  if (blockOK) {
    d.set('block', d.holdDown ? 'blockL' : 'blockH', 0.6); d.stun = h.bs;
    const chip = Math.round(h.dmg * (h.chip || (a.st === 'special' || h.proj ? 0.15 : 0)));
    if (chip) d.hp = Math.max(a.move && a.move.isSuper ? 0 : 1, d.hp - chip);
    d.vx = a.face * (h.push || 4) * 1.1; if (!h.proj && Math.abs(d.x - a.x) < 80) a.vx = -a.face * (h.push || 4) * 0.5;
    S.hitstop = 5; spark(sx, sy, 'block'); Kit.noise(0.06, 0.25, 4000, 'highpass'); Kit.tone(1800, 0.04, 0.06, 'square');
    a.meter = Math.min(100, a.meter + 4); d.meter = Math.min(100, d.meter + 3);
    return 'block';
  }
  const scale = Math.max(0.3, 1 - 0.1 * d.combo);
  const dmg = Math.round(h.dmg * scale);
  d.hp = Math.max(0, d.hp - dmg); d.combo++;
  a.meter = Math.min(100, a.meter + dmg * 0.12); d.meter = Math.min(100, d.meter + dmg * 0.07);
  const heavy = h.dmg >= 85 || h.big;
  S.hitstop = h.noPush ? 4 : heavy ? 9 : 6; S.shake = Math.max(S.shake, heavy ? 7 : 3);
  spark(sx, sy, heavy ? 'heavy' : 'light', a.ch.color);
  Kit.noise(heavy ? 0.18 : 0.09, heavy ? 0.5 : 0.35, heavy ? 900 : 1700); Kit.tone(heavy ? 110 : 170, 0.12, heavy ? 0.22 : 0.14, 'sine', 0.5);
  if (d.combo >= 2) S.comboShow = { side: a.side, n: d.combo, t: 70 };
  const ko = d.hp <= 0;
  if (h.kd || ko || !d.grounded || d.st === 'airhit') {
    d.st = 'airhit'; d.t = 0; d.move = null; d.y = Math.max(d.y, 1); d.vy = (h.launch || 6) + (ko ? 3 : 0); d.vx = a.face * (ko ? 3.6 : 2.4); d.target = POSES.air; d.blend = 0.4; d.stun = 0;
    d.spinFlip = 1; d.flipA = 0; d.alpha = 1; d.beam = null;
  } else if (h.hs < 999) {
    d.st = 'hit'; d.t = 0; d.move = null; d.stun = h.hs; d.target = (d.holdDown || h.lvl === 'low') ? POSES.hitL : POSES.hitH; d.blend = 0.7; d.spinFlip = 1; d.beam = null;
    if (!h.noPush) d.vx = a.face * (h.push || 4);
  }
  if (ko) koStart(a, d);
  return 'hit';
}
function spawnProj(f, sp) {
  const p = { owner: f, x: f.x + f.face * 52 * f.s, y: sp.ground ? 0 : 74 * f.s, vx: sp.speed * f.face, dmg: sp.dmg, col: sp.col, size: sp.size, wave: sp.wave, star: sp.star, ground: sp.ground, t: 0, dead: false };
  S.projs.push(p); Kit.tone(sp.star ? 1500 : 300, 0.25, 0.12, sp.star ? 'square' : 'sawtooth', sp.star ? 0.6 : 2.2); return p;
}
function updateProjs() {
  for (const p of S.projs) {
    p.t++; p.x += p.vx; if (p.wave) p.y = 74 * p.owner.s + Math.sin(p.t * 0.18) * 12;
    if (p.x < -40 || p.x > STAGE_W + 40) p.dead = true;
    const d = p.owner.opp, hb = d.hurtbox();
    if (!p.dead && d.inv <= 0 && d.st !== 'down' && d.st !== 'thrown' && p.x + p.size > hb[0] && p.x - p.size < hb[2] && p.y + p.size > hb[1] && p.y - p.size < hb[3]) {
      p.dead = true; applyHit(p.owner, d, { dmg: p.dmg, hs: 20, bs: 14, push: 5, lvl: p.ground ? 'low' : 'mid', proj: true, kd: p.ground, launch: 6, spark: [p.x, FLOOR - p.y] });
    }
  }
  for (const a of S.projs) for (const b of S.projs) if (a !== b && !a.dead && !b.dead && a.owner !== b.owner && Math.abs(a.x - b.x) < a.size + b.size && Math.abs(a.y - b.y) < 30) { a.dead = b.dead = true; spark((a.x + b.x) / 2, FLOOR - a.y, 'heavy', '#fff'); Kit.noise(0.3, 0.3, 1200); }
  S.projs = S.projs.filter(p => !p.dead);
}
function spark(x, y, kind, col) {
  S.sparks.push({ x, y, kind, col: col || '#fff', t: 0, rot: Math.random() * TAU });
  const n = kind === 'heavy' ? 18 : kind === 'block' ? 8 : 10;
  S.fx.burst(x, y, n, kind === 'block' ? ['#9adfff', '#fff'] : ['#fff', '#ffd21f', col || '#ff8a1f'], kind === 'heavy' ? 220 : 150, 0.35, 2.5);
}

/* =====================================================================
   CPU
   ===================================================================== */
const CPU_LV = [{ react: 18, block: 0.25, aa: 0.15, combo: 0.25, proj: 0.008, aggr: 0.4 }, { react: 11, block: 0.55, aa: 0.45, combo: 0.55, proj: 0.014, aggr: 0.55 }, { react: 6, block: 0.82, aa: 0.75, combo: 0.85, proj: 0.02, aggr: 0.7 }];
function cpuThink(f) {
  const ai = f.ai, o = f.opp, L = CPU_LV[S.cpu], dx = (o.x - f.x) * f.face, dist = Math.abs(o.x - f.x);
  ai.btn = { lp: false, hp: false, lk: false, hk: false };
  // play queued inputs (motions, strings)
  if (ai.q.length) {
    const step = ai.q[0]; const [dirNum, btn] = step; ai.x = ((dirNum - 1) % 3 - 1) * f.face; ai.y = Math.floor((dirNum - 1) / 3) - 1; if (btn) ai.btn[btn] = true;
    step[2] = (step[2] || 1) - 1; if (step[2] <= 0) ai.q.shift();
    return;
  }
  if (S.phase !== 'fight') { ai.x = 0; ai.y = 0; return; }
  const press = (b, dir = 5, hold = 1) => ai.q.push([dir, b, hold]);
  const motion = (seq, b) => { for (const d of seq) ai.q.push([d, null, 1]); ai.q.push([seq[seq.length - 1], b, 1]); };
  const sp = f.ch.specials;
  // defend: the opponent is attacking and close
  const oAtk = (o.st === 'attack' || o.st === 'special' || o.move && o.move.m && o.move.m.air) && dist < 130;
  const incoming = S.projs.find(p => p.owner === o && (p.x - f.x) * Math.sign(p.vx) < 0 && Math.abs(p.x - f.x) < 150);
  ai.react = (ai.react || 0) - 1;
  if ((oAtk || incoming) && f.actionable()) {
    const threat = incoming || o.move || o.st;
    if (ai.decided !== threat) {
      ai.decided = threat;
      ai.willBlock = Math.random() < L.block;
      if (incoming && Math.random() < 0.3 * L.aggr && dist > 140) { ai.q.push([9, null, 1]); return; }
      if (o.st === 'air' && o.vy < 0 && dist < 110 && Math.random() < L.aa) { if (sp.dp_p || sp.dp_k) motion([6, 2, 3], sp.dp_p ? 'hp' : 'hk'); else press('hp', 2); return; }
    }
    if (ai.willBlock) { const low = o.move && o.move.m && o.move.m.lvl === 'low' || o.holdDown; ai.x = -f.face; ai.y = low ? -1 : 0; return; }
  }
  if (--ai.think > 0) return;
  ai.think = L.react + Math.floor(Math.random() * L.react);
  ai.x = 0; ai.y = 0;
  if (!f.actionable()) return;
  const r = Math.random();
  if (f.meter >= 100 && dist < 150 && r < 0.3 * L.aggr) { motion([2, 3, 6, 2, 3, 6], 'hp'); return; }
  if (dist > 210) {
    if (sp.qcf_p && SPECIALS[sp.qcf_p].type === 'proj' && r < 0.35) motion([2, 3, 6], 'lp');
    else if (r < 0.6) ai.q.push([6, null, 18]);
    else if (r < 0.7) ai.q.push([9, null, 2]);
    else ai.q.push([6, null, 2], [5, null, 2], [6, null, 2]);
  } else if (dist > 90) {
    if (r < 0.3) ai.q.push([6, null, 14]);
    else if (r < 0.45 && sp.qcf_p && SPECIALS[sp.qcf_p].type !== 'proj') motion([2, 3, 6], 'hp');
    else if (r < 0.55 && sp.qcb_k) motion([2, 1, 4], 'lk');
    else if (r < 0.7) press('hk', 6);
    else if (r < 0.78) ai.q.push([9, null, 2], [5, null, 22], [5, 'hk', 1]);
    else if (r < 0.88 && sp.qcf_p && SPECIALS[sp.qcf_p].type === 'proj') motion([2, 3, 6], 'hp');
    else ai.q.push([4, null, 12]);
  } else {
    if (r < 0.18 && dist < 50) ai.q.push([6, 'hp', 1]);
    else if (r < 0.18 + 0.4 * L.combo) {
      const strings = [[['lp', 5], ['lp', 5], ['hp', 5]], [['lk', 2], ['lk', 2], ['hk', 2]], [['lp', 2], ['hp', 2]], [['lp', 5], ['hk', 5]]];
      const s = pick(strings); for (const [b, d] of s) ai.q.push([d, b, 1], [d, null, 6]);
      if (Math.random() < L.combo && (sp.qcf_p || sp.qcb_k)) { const k = sp.qcb_k && Math.random() < 0.5; motion(k ? [2, 1, 4] : [2, 3, 6], k ? 'lk' : 'hp'); }
    } else if (r < 0.75) { ai.x = -f.face; ai.y = Math.random() < 0.4 ? -1 : 0; ai.think = 16; }
    else if (r < 0.85) press('lk', 2);
    else ai.q.push([4, null, 10]);
  }
}

/* =====================================================================
   STAGES — painted procedurally into cached canvases, plus live animation
   ===================================================================== */
const STAGES = [
  { name: 'MOUNTAIN DOJO', sky: '#000', draw: drawDojo, live: liveDojo },
  { name: 'NEON AVENUE', draw: drawStreet, live: liveStreet },
  { name: 'BACK ALLEY', draw: drawAlley, live: liveAlley },
  { name: 'SUNSET HARBOR', draw: drawHarbor, live: liveHarbor },
  { name: 'CENTRAL SUBWAY', draw: drawSubway, live: liveSubway },
];
const stageCache = {};
function stageCanvas(i) {
  if (stageCache[i]) return stageCache[i];
  const c = document.createElement('canvas'); c.width = STAGE_W; c.height = 360; const g = c.getContext('2d');
  const R = mulberry(77 + i * 13); STAGES[i].draw(g, R);
  return (stageCache[i] = c);
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
function woodFloor(g, R, y0, base, light) {
  g.fillStyle = lin(g, 0, y0, 0, 360, [[0, light], [0.25, base], [1, '#2a160c']]); g.fillRect(0, y0, STAGE_W, 360 - y0);
  for (let y = y0, i = 0; y < 360; i++) { const h = 6 + i * 2.2; g.fillStyle = `rgba(0,0,0,${0.1 + R() * 0.12})`; g.fillRect(0, y + h - 1, STAGE_W, 1.2); for (let x = R() * 120; x < STAGE_W; x += 90 + R() * 120) g.fillRect(x, y, 1, h); y += h; }
}
function drawDojo(g, R) {
  g.fillStyle = lin(g, 0, 0, 0, 260, [[0, '#4a2a14'], [1, '#8a5a30']]); g.fillRect(0, 0, STAGE_W, 270);
  // shoji panels glowing with daylight
  for (let x = 30; x < STAGE_W; x += 160) {
    g.fillStyle = lin(g, 0, 70, 0, 250, [[0, '#fff6dc'], [1, '#f0d8a8']]); g.fillRect(x, 70, 120, 180);
    g.strokeStyle = '#5a3418'; g.lineWidth = 3; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(x + k * 30, 70); g.lineTo(x + k * 30, 250); g.stroke(); }
    for (let k = 0; k <= 6; k++) { g.beginPath(); g.moveTo(x, 70 + k * 30); g.lineTo(x + 120, 70 + k * 30); g.stroke(); }
    g.lineWidth = 6; g.strokeRect(x, 70, 120, 180);
  }
  // beams and pillars
  g.fillStyle = lin(g, 0, 40, 0, 70, [[0, '#2a160a'], [1, '#5a3418']]); g.fillRect(0, 40, STAGE_W, 30);
  for (let x = 10; x < STAGE_W; x += 160) { g.fillStyle = lin(g, x, 0, x + 22, 0, [[0, '#3a1e0c'], [0.5, '#6a3e1c'], [1, '#2a1408']]); g.fillRect(x, 0, 22, 270); }
  // hanging scroll with brush strokes
  g.fillStyle = '#f4ead0'; g.fillRect(380, 84, 60, 130); g.fillStyle = '#7a1a10'; g.fillRect(376, 80, 68, 6); g.fillRect(376, 212, 68, 6);
  g.strokeStyle = '#1a1010'; g.lineCap = 'round';
  for (let k = 0; k < 6; k++) { g.lineWidth = 3 + R() * 4; g.beginPath(); const x = 392 + R() * 36, y = 96 + k * 18; g.moveTo(x, y); g.quadraticCurveTo(x + R() * 16 - 8, y + 8, x + R() * 20 - 10, y + 14); g.stroke(); }
  g.fillStyle = '#d0201a'; g.fillRect(426, 190, 10, 10);
  // weapon rack and drum
  g.fillStyle = '#4a2810'; g.fillRect(90, 180, 70, 8); g.fillRect(90, 230, 70, 8); g.fillRect(92, 170, 6, 80); g.fillRect(152, 170, 6, 80);
  for (let k = 0; k < 4; k++) { g.strokeStyle = k % 2 ? '#c8c8d0' : '#7a4a20'; g.lineWidth = 3; g.beginPath(); g.moveTo(104 + k * 14, 168); g.lineTo(104 + k * 14, 252); g.stroke(); }
  g.fillStyle = lin(g, 640, 0, 720, 0, [[0, '#6a2a10'], [0.5, '#b0602a'], [1, '#5a200c']]); g.beginPath(); g.ellipse(680, 230, 40, 30, 0, 0, TAU); g.fill();
  g.fillStyle = '#f0e0c0'; g.beginPath(); g.ellipse(680, 206, 36, 8, 0, 0, TAU); g.fill(); g.fillStyle = '#2a140a'; g.fillRect(650, 250, 6, 24); g.fillRect(704, 250, 6, 24);
  woodFloor(g, R, 268, '#7a4a24', '#c08850');
}
function liveDojo(g, cam) {
  // sun shafts and dust
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 4; k++) { const x = 60 + k * 200 - cam * 0.2; g.fillStyle = `rgba(255,230,170,${0.06 + 0.03 * Math.sin(Kit.t * 0.7 + k)})`; g.beginPath(); g.moveTo(x, 70); g.lineTo(x + 70, 70); g.lineTo(x + 200, 330); g.lineTo(x + 90, 330); g.fill(); }
  g.restore();
  for (let k = 0; k < 30; k++) { const x = ((k * 97 + Kit.t * 6 * (1 + k % 3)) % STAGE_W), y = 90 + ((k * 53 + Math.sin(Kit.t + k) * 20) % 220); g.fillStyle = 'rgba(255,240,200,.5)'; g.fillRect(x, y, 1.5, 1.5); }
  // lanterns
  for (const lx of [250, 570]) { const sw = Math.sin(Kit.t * 1.2 + lx) * 3; g.strokeStyle = '#2a140a'; g.beginPath(); g.moveTo(lx, 70); g.lineTo(lx + sw, 104); g.stroke();
    g.fillStyle = 'rgba(255,140,40,.25)'; g.beginPath(); g.arc(lx + sw, 122, 30, 0, TAU); g.fill(); g.fillStyle = lin(g, 0, 104, 0, 140, [[0, '#ff6a20'], [1, '#c02010']]); g.beginPath(); g.ellipse(lx + sw, 122, 14, 18, 0, 0, TAU); g.fill(); g.fillStyle = '#2a140a'; g.fillRect(lx + sw - 9, 102, 18, 4); g.fillRect(lx + sw - 9, 138, 18, 4); }
}
function drawStreet(g, R) {
  g.fillStyle = lin(g, 0, 0, 0, 200, [[0, '#05030f'], [1, '#2a1048']]); g.fillRect(0, 0, STAGE_W, 270);
  for (let x = 0; x < STAGE_W; x += 30 + R() * 40) { const w = 26 + R() * 50, h = 80 + R() * 140; g.fillStyle = '#120a24'; g.fillRect(x, 200 - h, w, h + 40); g.fillStyle = 'rgba(255,220,140,.5)'; for (let y = 210 - h; y < 196; y += 9) for (let wx = x + 3; wx < x + w - 4; wx += 7) if (R() < 0.35) g.fillRect(wx, y, 3, 4); }
  // storefronts
  const shops = [['RAMEN', '#ff3b3b'], ['ARCADE', '#2fe6ff'], ['24H', '#3bff4a'], ['HOTEL', '#ff3bd4'], ['KARAOKE', '#ffd21f']];
  for (let i = 0, x = 0; x < STAGE_W; i++) {
    const w = 140 + R() * 40, [, col] = shops[i % shops.length];
    g.fillStyle = ['#2a1c34', '#24203a', '#301c2a'][i % 3]; g.fillRect(x, 110, w, 160);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x + w - 4, 110, 4, 160);
    g.fillStyle = lin(g, 0, 190, 0, 262, [[0, 'rgba(255,230,180,.85)'], [1, 'rgba(255,170,90,.6)']]); g.fillRect(x + 16, 190, w - 50, 70);
    g.fillStyle = 'rgba(40,20,30,.6)'; for (let k = 0; k < 3; k++) g.fillRect(x + 22 + k * 30, 215 + (k % 2) * 6, 14, 45);
    g.fillStyle = '#1a1020'; g.fillRect(x + w - 32, 196, 22, 66);
    g.fillStyle = col; g.globalAlpha = 0.85; for (let k = 0; k < 7; k++) { g.fillStyle = k % 2 ? col : '#f4f0ff'; g.fillRect(x + 10 + k * (w - 20) / 7, 172, (w - 20) / 7, 12); } g.globalAlpha = 1;
    x += w;
  }
  g.fillStyle = '#3a3448'; g.fillRect(0, 262, STAGE_W, 14); g.fillStyle = '#6a6478'; g.fillRect(0, 262, STAGE_W, 3);
  g.fillStyle = lin(g, 0, 276, 0, 360, [[0, '#26222e'], [1, '#121018']]); g.fillRect(0, 276, STAGE_W, 84);
  g.fillStyle = '#ffd21f'; for (let x = 0; x < STAGE_W; x += 60) g.fillRect(x, 340, 32, 3);
  g.fillStyle = '#1a1820'; g.beginPath(); g.ellipse(560, 318, 24, 6, 0, 0, TAU); g.fill();
  // parked car
  g.fillStyle = '#7a1020'; g.beginPath(); g.roundRect(660, 236, 130, 32, 8); g.fill(); g.beginPath(); g.roundRect(686, 214, 76, 28, 10); g.fill();
  g.fillStyle = 'rgba(160,220,255,.5)'; g.fillRect(694, 220, 28, 18); g.fillRect(728, 220, 28, 18);
  g.fillStyle = '#111'; g.beginPath(); g.arc(690, 268, 12, 0, TAU); g.arc(762, 268, 12, 0, TAU); g.fill(); g.fillStyle = '#888'; g.beginPath(); g.arc(690, 268, 5, 0, TAU); g.arc(762, 268, 5, 0, TAU); g.fill();
  // lamp posts
  for (const lx of [120, 470]) { g.fillStyle = '#20202a'; g.fillRect(lx, 120, 6, 146); g.fillRect(lx, 120, 30, 5); }
}
function liveStreet(g, cam) {
  const signs = [[70, 'RAMEN', '#ff3b3b'], [250, 'ARCADE', '#2fe6ff'], [430, '24H', '#3bff4a'], [610, 'HOTEL', '#ff3bd4']];
  for (const [x, t, c] of signs) {
    const on = !(Math.sin(Kit.t * 9 + x) > 0.97);
    g.save(); g.font = 'italic 900 20px "Arial Black",Impact,sans-serif'; g.textAlign = 'center';
    if (on) { g.shadowColor = c; g.shadowBlur = 18; } g.fillStyle = on ? c : '#333'; g.fillText(t, x + 40, 150); g.restore();
  }
  for (const lx of [120, 470]) { g.fillStyle = 'rgba(255,220,150,.18)'; g.beginPath(); g.moveTo(lx + 22, 126); g.lineTo(lx - 30, 270); g.lineTo(lx + 80, 270); g.fill(); g.fillStyle = '#ffe9b0'; g.fillRect(lx + 18, 124, 12, 5); }
  // crowd on the sidewalk
  for (let k = 0; k < 18; k++) { const x = 20 + k * 46, b = Math.abs(Math.sin(Kit.t * 4 + k * 1.7)) * (S.phase === 'fight' ? 4 : 1); g.fillStyle = ['#0c0816', '#140c20', '#100a1a'][k % 3]; g.beginPath(); g.ellipse(x, 262 - b, 11, 20, 0, Math.PI, 0); g.fill(); g.beginPath(); g.arc(x, 236 - b, 7, 0, TAU); g.fill(); }
}
function drawAlley(g, R) {
  g.fillStyle = '#0a0a14'; g.fillRect(0, 0, STAGE_W, 360);
  // brick wall
  for (let y = 0; y < 280; y += 10) for (let x = (y / 10 % 2) * 12; x < STAGE_W; x += 24) { const v = 60 + R() * 30; g.fillStyle = `rgb(${v + 30},${v * 0.45},${v * 0.35})`; g.fillRect(x, y, 22, 8); }
  g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, STAGE_W, 280);
  g.fillStyle = lin(g, 0, 0, 0, 280, [[0, 'rgba(0,0,10,.7)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.4)']]); g.fillRect(0, 0, STAGE_W, 280);
  // graffiti
  const tags = [[120, 210, 'LEGENDS', '#ff3bd4', '#2fe6ff'], [520, 200, 'VEX', '#3bff4a', '#111'], [690, 220, 'NO MERCY', '#ffd21f', '#ff3b3b']];
  for (const [x, y, t, c, o] of tags) { g.save(); g.translate(x, y); g.rotate(-0.08); g.font = 'italic 900 30px "Arial Black",Impact,sans-serif'; g.lineWidth = 7; g.strokeStyle = o; g.strokeText(t, 0, 0); g.fillStyle = c; g.fillText(t, 0, 0); g.restore(); }
  // fire escape
  g.strokeStyle = '#2a2a34'; g.lineWidth = 3;
  for (const [x, y] of [[300, 60], [300, 140]]) { g.strokeRect(x, y, 160, 4); for (let k = 0; k <= 16; k++) { g.beginPath(); g.moveTo(x + k * 10, y); g.lineTo(x + k * 10, y - 18); g.stroke(); } g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x + 160, y - 18); g.stroke(); }
  g.beginPath(); g.moveTo(330, 64); g.lineTo(420, 136); g.stroke(); for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(330 + k * 10, 64 + k * 8); g.lineTo(344 + k * 10, 64 + k * 8); g.stroke(); }
  // door, dumpster, bags
  g.fillStyle = '#1e2a2a'; g.fillRect(40, 170, 60, 106); g.fillStyle = '#0a0f0f'; g.fillRect(46, 176, 48, 96);
  g.fillStyle = lin(g, 0, 210, 0, 280, [[0, '#2f6a3a'], [1, '#1a3a20']]); g.fillRect(600, 214, 130, 62); g.fillStyle = '#244a2c'; g.fillRect(596, 206, 138, 10);
  g.fillStyle = '#111'; for (const [x, r] of [[580, 16], [748, 18], [766, 13]]) { g.beginPath(); g.ellipse(x, 276 - r * 0.8, r, r * 0.8, 0, 0, TAU); g.fill(); }
  // wet ground
  g.fillStyle = lin(g, 0, 276, 0, 360, [[0, '#1a1a24'], [1, '#08080e']]); g.fillRect(0, 276, STAGE_W, 84);
  for (let k = 0; k < 7; k++) { g.fillStyle = 'rgba(80,120,180,.18)'; g.beginPath(); g.ellipse(60 + k * 120 + R() * 40, 300 + R() * 40, 40 + R() * 30, 5, 0, 0, TAU); g.fill(); }
}
function liveAlley(g, cam) {
  const on = Math.sin(Kit.t * 13) > -0.85 || Math.sin(Kit.t * 2) > 0;
  g.fillStyle = on ? 'rgba(255,220,140,.22)' : 'rgba(0,0,0,0)'; g.beginPath(); g.moveTo(70, 166); g.lineTo(10, 290); g.lineTo(130, 290); g.fill();
  g.fillStyle = on ? '#ffe9b0' : '#443'; g.beginPath(); g.arc(70, 162, 5, 0, TAU); g.fill();
  // steam vent
  for (let k = 0; k < 8; k++) { const t = (Kit.t * 0.5 + k / 8) % 1; g.fillStyle = `rgba(200,200,220,${0.18 * (1 - t)})`; g.beginPath(); g.arc(470 + Math.sin(t * 6 + k) * 10, 280 - t * 140, 10 + t * 30, 0, TAU); g.fill(); }
  g.fillStyle = '#333'; g.fillRect(450, 272, 40, 6);
}
function rainOverlay(g) {
  g.strokeStyle = 'rgba(170,190,230,.35)'; g.lineWidth = 1;
  for (let k = 0; k < 90; k++) { const x = (k * 53 + Kit.t * 120) % SW, y = (k * 97 + Kit.t * 520) % 380 - 20; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 10); g.stroke(); }
  for (let k = 0; k < 10; k++) { const t = (Kit.t * 1.5 + k * 0.37) % 1; g.strokeStyle = `rgba(170,190,230,${0.4 * (1 - t)})`; g.beginPath(); g.ellipse((k * 89) % SW, 300 + (k * 31) % 50, 2 + t * 10, (2 + t * 10) * 0.25, 0, 0, TAU); g.stroke(); }
}
function drawHarbor(g, R) {
  g.fillStyle = lin(g, 0, 0, 0, 220, [[0, '#2a1a5a'], [0.45, '#d8507a'], [0.75, '#ff9a4a'], [1, '#ffd08a']]); g.fillRect(0, 0, STAGE_W, 220);
  g.fillStyle = '#fff2c0'; g.beginPath(); g.arc(470, 200, 40, Math.PI, 0); g.fill();
  g.fillStyle = lin(g, 0, 200, 0, 280, [[0, '#ff8a5a'], [0.3, '#7a3a6a'], [1, '#2a1a3a']]); g.fillRect(0, 200, STAGE_W, 80);
  // cranes and ship silhouettes
  g.fillStyle = '#2a1430'; g.fillRect(120, 70, 8, 132); g.fillRect(90, 70, 110, 8); g.fillRect(186, 78, 3, 50); g.fillRect(180, 128, 16, 10);
  g.fillRect(660, 50, 8, 152); g.fillRect(610, 50, 130, 8); g.fillRect(620, 58, 3, 60);
  g.beginPath(); g.moveTo(250, 200); g.lineTo(390, 200); g.lineTo(380, 214); g.lineTo(262, 214); g.fill(); g.fillRect(290, 180, 50, 20); g.fillRect(320, 166, 8, 14);
  // containers
  const cols = ['#c0392b', '#2980b9', '#e67e22', '#16a085', '#8e44ad', '#d4ac0d'];
  for (const [x, y, w, h] of [[20, 200, 100, 36], [20, 236, 100, 40], [120, 236, 100, 40], [560, 220, 110, 56], [670, 236, 110, 40], [690, 196, 90, 40]]) {
    const c = cols[(x + y) % cols.length]; g.fillStyle = c; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(0,0,0,.25)'; for (let k = x + 4; k < x + w; k += 6) g.fillRect(k, y + 3, 2, h - 6);
    g.fillStyle = 'rgba(255,200,150,.25)'; g.fillRect(x, y, w, 3); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, y + h - 3, w, 3);
  }
  woodFloor(g, R, 276, '#5a3a2a', '#8a5a3a');
  for (const x of [250, 420, 600]) { g.fillStyle = '#2a2a32'; g.fillRect(x, 262, 16, 18); g.fillStyle = '#3a3a44'; g.fillRect(x - 3, 258, 22, 6); }
}
function liveHarbor(g, cam) {
  for (let k = 0; k < 26; k++) { const y = 206 + (k % 7) * 9, x = (k * 71 + Math.sin(Kit.t + k) * 20) % STAGE_W, w = 20 + (k % 5) * 8; g.fillStyle = `rgba(255,220,170,${0.25 + 0.2 * Math.sin(Kit.t * 2 + k)})`; g.fillRect(x, y, w, 1.5); }
  for (let k = 0; k < 4; k++) { const x = (k * 230 + Kit.t * (14 + k * 4)) % (STAGE_W + 60) - 30, y = 60 + k * 22 + Math.sin(Kit.t + k) * 6, w = Math.sin(Kit.t * 8 + k) * 4; g.strokeStyle = '#2a1430'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 7, y - w); g.quadraticCurveTo(x - 3, y - 3, x, y); g.quadraticCurveTo(x + 3, y - 3, x + 7, y - w); g.stroke(); }
  if (Math.sin(Kit.t * 3) > 0) { g.fillStyle = '#ff3b3b'; g.beginPath(); g.arc(128, 66, 3, 0, TAU); g.arc(668, 46, 3, 0, TAU); g.fill(); }
}
function drawSubway(g, R) {
  g.fillStyle = '#0c0c12'; g.fillRect(0, 0, STAGE_W, 360);
  // tiled back wall
  for (let y = 40; y < 200; y += 12) for (let x = 0; x < STAGE_W; x += 18) { const v = 205 + R() * 25; g.fillStyle = `rgb(${v},${v - 8},${v - 30})`; g.fillRect(x, y, 17, 11); }
  g.fillStyle = '#1a6a4a'; g.fillRect(0, 80, STAGE_W, 22); g.fillStyle = '#f4f0e0'; g.font = 'bold 15px Arial'; g.textAlign = 'center';
  for (let x = 120; x < STAGE_W; x += 280) g.fillText('CENTRAL', x, 96);
  for (const x of [220, 520]) { g.fillStyle = '#e8e0c0'; g.fillRect(x, 118, 70, 54); g.fillStyle = ['#ff3b3b', '#2f6bff'][x % 2]; g.fillRect(x + 6, 124, 58, 30); g.fillStyle = '#111'; g.fillRect(x + 6, 158, 40, 4); }
  g.fillStyle = lin(g, 0, 200, 0, 250, [[0, '#2a2a30'], [1, '#141418']]); g.fillRect(0, 200, STAGE_W, 50);           // track bed
  g.fillStyle = '#5a5a60'; g.fillRect(0, 236, STAGE_W, 3); g.fillRect(0, 244, STAGE_W, 3);
  for (let x = 0; x < STAGE_W; x += 140) { g.fillStyle = lin(g, x, 0, x + 18, 0, [[0, '#1a5a3a'], [0.5, '#2a8a5a'], [1, '#14402a']]); g.fillRect(x, 0, 18, 262); }
  g.fillStyle = '#9a9aa0'; g.fillRect(0, 250, STAGE_W, 110); g.fillStyle = lin(g, 0, 250, 0, 360, [[0, '#7a7a82'], [1, '#3a3a40']]); g.fillRect(0, 254, STAGE_W, 106);
  g.fillStyle = '#ffd21f'; g.fillRect(0, 254, STAGE_W, 7); g.fillStyle = 'rgba(0,0,0,.3)'; for (let x = 0; x < STAGE_W; x += 8) g.fillRect(x, 256, 3, 3);
  for (let y = 270; y < 360; y += 22) { g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(0, y, STAGE_W, 1); }
  for (const x of [80, 640]) { g.fillStyle = '#4a3020'; g.fillRect(x, 238, 70, 8); g.fillStyle = '#222'; g.fillRect(x + 6, 246, 4, 14); g.fillRect(x + 60, 246, 4, 14); }
}
function liveSubway(g, cam) {
  // a train rattles past behind the platform every so often
  const period = 9, ph = (Kit.t % period) / period;
  if (ph < 0.32) {
    const x = STAGE_W + 200 - ph / 0.32 * (STAGE_W + 1400);
    for (let car = 0; car < 4; car++) {
      const cx = x + car * 300; g.fillStyle = lin(g, 0, 150, 0, 236, [[0, '#d8dce4'], [0.5, '#a0a6b0'], [1, '#5a5e66']]); g.fillRect(cx, 150, 290, 86);
      g.fillStyle = '#c02020'; g.fillRect(cx, 196, 290, 6);
      for (let w = 0; w < 6; w++) { g.fillStyle = 'rgba(255,240,180,.9)'; g.fillRect(cx + 14 + w * 46, 162, 34, 26); }
    }
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, 150, STAGE_W, 86);
    if (Math.random() < 0.3) S.shake = Math.max(S.shake, 1.5);
  }
  for (let x = 60; x < STAGE_W; x += 140) { const on = Math.sin(Kit.t * 17 + x) > -0.95; g.fillStyle = on ? '#f8fff4' : '#666'; g.fillRect(x, 20, 60, 5); if (on) { g.fillStyle = 'rgba(240,255,240,.07)'; g.beginPath(); g.moveTo(x, 25); g.lineTo(x + 60, 25); g.lineTo(x + 110, 260); g.lineTo(x - 50, 260); g.fill(); } }
}

/* =====================================================================
   DRAWING FIGHTERS
   ===================================================================== */
function ik(ax, ay, tx, ty, l1, l2, bend) {
  let dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy); const max = (l1 + l2) * 0.999;
  if (d > max) { dx *= max / d; dy *= max / d; d = max; }
  const ux = dx / (d || 1), uy = dy / (d || 1), a = (l1 * l1 - l2 * l2 + d * d) / (2 * d || 1), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  return { j: [ax + ux * a - uy * h * bend, ay + uy * a + ux * h * bend], e: [ax + dx, ay + dy] };
}
// tapered capsule between two points
function capsule(g, a, b, r1, r2, fill) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 0.001, ang = Math.atan2(dy, dx);
  g.fillStyle = fill; g.beginPath();
  g.arc(a[0], a[1], r1, ang + Math.PI / 2, ang - Math.PI / 2); g.arc(b[0], b[1], r2, ang - Math.PI / 2, ang + Math.PI / 2); g.closePath(); g.fill();
}
function limb(g, a, b, r1, r2, col, shade) {
  capsule(g, a, b, r1 + 1.6, r2 + 1.6, INK);
  capsule(g, a, b, r1, r2, col);
  if (shade !== false) { g.globalAlpha = 0.28; capsule(g, [a[0] - 0.8, a[1] - 0.8], [b[0] - 0.8, b[1] - 0.8], r1 * 0.45, r2 * 0.45, '#fff'); g.globalAlpha = 1; }
}
function shadeCol(hex, k) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
  return `rgb(${Math.round(r * k)},${Math.round(gg * k)},${Math.round(b * k)})`;
}
function drawFighter(g, f, cam) {
  const c = f.ch, p = f.pose, s = f.s, face = f.face * (f.spinFlip || 1);
  const ox = f.x - cam, oy = FLOOR - f.y;
  // shadow
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(ox, FLOOR + 2, 30 * s * Math.max(0.4, 1 - f.y / 200), 6 * s, 0, 0, TAU); g.fill();
  // afterimages for dashes and specials
  if (f.trail.length && (f.st === 'special' || f.st === 'dash')) { g.globalAlpha = 0.18; for (const [tx, ty] of f.trail) { g.fillStyle = c.color; g.beginPath(); g.ellipse(tx - cam, FLOOR - ty - 60 * s, 16 * s, 46 * s, 0, 0, TAU); g.fill(); } g.globalAlpha = 1; }
  g.save(); g.translate(ox, oy); g.scale(face * s, -s);       // local: +x forward, +y up
  if (f.flipA) { g.translate(0, 60); g.rotate(-f.flipA); g.translate(0, -60); }
  g.globalAlpha = f.alpha;
  const lean = p.tor * Math.PI / 180;
  const pel = [p.px, p.py], sh = [p.px + Math.sin(lean) * LEN.tor, p.py + Math.cos(lean) * LEN.tor];
  const head = [sh[0] + Math.sin(lean + p.head * 0.0174) * 13, sh[1] + Math.cos(lean + p.head * 0.0174) * 13];
  const legF = ik(pel[0] + 3, pel[1], p.ff[0], p.ff[1] + 3, LEN.th, LEN.sh, 1), legB = ik(pel[0] - 3, pel[1], p.bf[0], p.bf[1] + 3, LEN.th, LEN.sh, 1);
  const shF = [sh[0] + 3, sh[1] - 2], shB = [sh[0] - 3, sh[1] - 2];
  const armF = ik(shF[0], shF[1], p.fh[0], p.fh[1], LEN.ua, LEN.fa, -1), armB = ik(shB[0], shB[1], p.bh[0], p.bh[1], LEN.ua, LEN.fa, -1);
  const dark = 0.72, skinD = shadeCol(c.skin, dark), pantsD = shadeCol(c.pants, dark), topD = shadeCol(c.topCol, dark);
  const sleeve = c.top === 'gi' || c.top === 'hoodie', armCol = sleeve ? c.topCol : c.skin, armColD = sleeve ? topD : skinD;
  const thick = c.id === 'brick' ? 1.25 : c.id === 'mei' ? 0.86 : 1;
  // --- back limbs ---
  drawArm(g, shB, armB, armColD, c.glove, 0.8, thick);
  drawLeg(g, [pel[0] - 3, pel[1]], legB, pantsD, c, 0.8, thick);
  // --- torso ---
  const hipW = 11 * thick, chestW = (c.top === 'tank' ? 15 : 13) * thick;
  limb(g, pel, sh, hipW, chestW, c.topCol);
  if (c.top === 'gi') { g.strokeStyle = c.trim; g.lineWidth = 2.5; g.beginPath(); g.moveTo(sh[0] + 9, sh[1] + 2); g.lineTo(pel[0] + 6, pel[1] + 14); g.stroke(); }
  if (c.top === 'qipao') { g.strokeStyle = c.trim; g.lineWidth = 2; g.beginPath(); g.moveTo(sh[0] + 6, sh[1] + 3); g.quadraticCurveTo(sh[0] + 12, sh[1] - 8, pel[0] + 9, pel[1] + 16); g.stroke(); }
  if (c.top === 'tank') { g.fillStyle = c.skin; g.beginPath(); g.arc(sh[0], sh[1] + 2, 9 * thick, 0, TAU); g.fill(); }
  if (c.top === 'hoodie') { g.fillStyle = c.trim; g.fillRect(pel[0] - 2, pel[1] + 4, 12, 3); }
  // belt / sash
  limb(g, [pel[0] - 9 * thick, pel[1] + 4], [pel[0] + 9 * thick, pel[1] + 4], 3, 3, c.belt, false);
  if (c.top === 'gi') { g.strokeStyle = c.belt; g.lineWidth = 3; g.lineCap = 'round'; const sw = Math.sin(Kit.t * 6) * 3; g.beginPath(); g.moveTo(pel[0] - 8, pel[1] + 4); g.lineTo(pel[0] - 16, pel[1] - 8 + sw); g.stroke(); }
  // --- head ---
  drawHead(g, c, head, lean + p.head * 0.0174, thick);
  // --- front limbs ---
  drawLeg(g, [pel[0] + 3, pel[1]], legF, c.pants, c, 1, thick);
  drawArm(g, shF, armF, armCol, c.glove, 1, thick);
  g.restore(); g.globalAlpha = 1;
}
function drawArm(g, s, a, col, glove, k, thick) {
  limb(g, s, a.j, 6.2 * thick, 5.2 * thick, col);
  limb(g, a.j, a.e, 5.2 * thick, 4.6 * thick, col);
  g.fillStyle = INK; g.beginPath(); g.arc(a.e[0], a.e[1], 6.8 * thick, 0, TAU); g.fill();
  g.fillStyle = k < 1 ? shadeCol(glove, 0.75) : glove; g.beginPath(); g.arc(a.e[0], a.e[1], 5.3 * thick, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(a.e[0] - 1.5, a.e[1] + 1.5, 2, 0, TAU); g.fill();
}
function drawLeg(g, hip, l, col, c, k, thick) {
  const wide = c.top === 'gi' ? 1.15 : 1;
  limb(g, hip, l.j, 8.4 * thick * wide, 7 * thick * wide, col);
  limb(g, l.j, l.e, 7 * thick * wide, 5.4 * thick, col);
  const toe = [l.e[0] + 10, l.e[1] - 2];
  const footCol = c.feet === 'bare' ? (k < 1 ? shadeCol(c.skin, 0.75) : c.skin) : (k < 1 ? shadeCol(c.bootCol, 0.75) : c.bootCol);
  limb(g, [l.e[0] - 2, l.e[1] - 1], toe, c.feet === 'bare' ? 3.4 : 4.6, 3, footCol, false);
}
function drawHead(g, c, h, ang, thick) {
  const r = 10.5;
  // hair behind
  g.fillStyle = INK;
  if (c.hairStyle === 'buns') { for (const [dx, dy] of [[-8, 6], [4, 10]]) { g.beginPath(); g.arc(h[0] + dx, h[1] + dy, 6.5, 0, TAU); g.fill(); g.fillStyle = c.hair; g.beginPath(); g.arc(h[0] + dx, h[1] + dy, 5, 0, TAU); g.fill(); g.fillStyle = INK; } }
  if (c.hairStyle === 'hood') { g.fillStyle = INK; g.beginPath(); g.arc(h[0] - 2, h[1] + 1, r + 4.5, 0, TAU); g.fill(); g.fillStyle = c.topCol; g.beginPath(); g.arc(h[0] - 2, h[1] + 1, r + 3, 0, TAU); g.fill(); }
  g.fillStyle = INK; g.beginPath(); g.arc(h[0], h[1], r + 1.6, 0, TAU); g.fill();
  g.fillStyle = c.skin; g.beginPath(); g.arc(h[0], h[1], r, 0, TAU); g.fill();
  // jaw / face shading
  g.fillStyle = shadeCol(c.skin, 0.82); g.beginPath(); g.arc(h[0] - 3, h[1] - 2, r * 0.7, 0, TAU); g.fill();
  g.fillStyle = c.skin; g.beginPath(); g.arc(h[0] + 1, h[1] + 0.5, r * 0.82, 0, TAU); g.fill();
  // hair
  g.fillStyle = c.hair;
  if (c.hairStyle === 'spiky') { g.beginPath(); g.moveTo(h[0] - 11, h[1] + 1); for (let k = 0; k < 6; k++) { const a = Math.PI * (0.95 - k * 0.15); g.lineTo(h[0] + Math.cos(a) * 16 - 2, h[1] + Math.sin(a) * 16 + 2); g.lineTo(h[0] + Math.cos(a - 0.08) * 9, h[1] + Math.sin(a - 0.08) * 9 + 2); } g.lineTo(h[0] + 9, h[1] + 7); g.lineTo(h[0] - 11, h[1] + 1); g.fill(); }
  else if (c.hairStyle === 'buns') { g.beginPath(); g.arc(h[0] - 1, h[1] + 3, r + 0.6, 0.15, Math.PI - 0.1); g.fill(); g.fillRect(h[0] - 11, h[1] - 2, 5, 9); }
  else if (c.hairStyle === 'mohawk') { g.beginPath(); g.moveTo(h[0] - 9, h[1] + 6); for (let k = 0; k < 5; k++) { g.lineTo(h[0] - 8 + k * 4, h[1] + 20 + (k % 2) * 3); g.lineTo(h[0] - 6 + k * 4, h[1] + 9); } g.lineTo(h[0] + 8, h[1] + 8); g.fill(); g.fillStyle = shadeCol(c.skin, 0.8); g.fillRect(h[0] - 7, h[1] + 5, 14, 2); }
  else if (c.hairStyle === 'hood') { g.fillStyle = c.topCol; g.beginPath(); g.arc(h[0] - 2, h[1] + 1, r + 3, Math.PI * 0.05, Math.PI * 0.95); g.fill(); g.fillStyle = c.hair; g.fillRect(h[0] + 1, h[1] + 3, 9, 3); g.fillStyle = INK; g.fillRect(h[0] + 2, h[1] - 6, 10, 4); }
  // eye, brow, mouth (facing +x)
  g.fillStyle = INK; g.fillRect(h[0] + 4.5, h[1] + 0.5, 2.4, 3.2); g.fillRect(h[0] + 3.5, h[1] + 5, 5, 1.4);
  g.fillRect(h[0] + 5, h[1] - 5.5, 3.5, 1.3);
  // headband with trailing tails
  if (c.band) {
    g.fillStyle = INK; g.beginPath(); g.ellipse(h[0], h[1] + 5, r + 1.6, 3.4, 0, 0, TAU); g.fill();
    g.fillStyle = c.band; g.beginPath(); g.ellipse(h[0], h[1] + 5, r + 0.8, 2.4, 0, 0, TAU); g.fill();
    const w = Math.sin(Kit.t * 8) * 3, w2 = Math.sin(Kit.t * 8 + 1) * 4;
    g.strokeStyle = c.band; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(h[0] - 10, h[1] + 5); g.quadraticCurveTo(h[0] - 18, h[1] + 6 + w, h[0] - 27, h[1] + 2 + w2); g.stroke();
    g.beginPath(); g.moveTo(h[0] - 10, h[1] + 4); g.quadraticCurveTo(h[0] - 17, h[1] + w, h[0] - 24, h[1] - 5 + w2); g.stroke();
  }
}

/* ---------- projectiles, sparks, beams ---------- */
function drawProj(g, p, cam) {
  const x = p.x - cam, y = FLOOR - p.y;
  if (p.ground) {
    for (let k = 0; k < 4; k++) { g.fillStyle = `rgba(255,${200 - k * 30},${120 - k * 20},${0.7 - k * 0.15})`; g.beginPath(); g.moveTo(x - k * 10 * Math.sign(p.vx), FLOOR); g.lineTo(x - (k * 10 + 6) * Math.sign(p.vx), FLOOR - 26 + k * 4); g.lineTo(x - (k * 10 + 12) * Math.sign(p.vx), FLOOR); g.fill(); }
    S.fx.burst(p.x, FLOOR, 1, ['#d8c8b0'], 60, 0.4, 3, 200); return;
  }
  if (p.star) { g.save(); g.translate(x, y); g.rotate(p.t * 0.5); g.fillStyle = INK; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, -9); g.lineTo(3.2, 0); g.lineTo(-3.2, 0); g.fill(); } g.fillStyle = '#d8d8e8'; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, -7.5); g.lineTo(2, 0); g.lineTo(-2, 0); g.fill(); } g.restore(); return; }
  const r = p.size, gr = g.createRadialGradient(x, y, 1, x, y, r * 2.2);
  gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, p.col[0]); gr.addColorStop(0.6, p.col[1]); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 1; k < 6; k++) { g.globalAlpha = 0.18; g.fillStyle = p.col[1]; g.beginPath(); g.arc(x - p.vx * k * 2.2, y + Math.sin(p.t * 0.6 + k) * 2, r * (1 - k * 0.12), 0, TAU); g.fill(); }
  g.globalAlpha = 1; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 2.2, 0, TAU); g.fill();
  g.restore();
}
function drawSparks(g, cam) {
  for (const s of S.sparks) {
    s.t++; const k = s.t / 12, x = s.x - cam;
    g.save(); g.translate(x, s.y); g.rotate(s.rot); g.globalCompositeOperation = 'lighter';
    const n = s.kind === 'heavy' ? 10 : 7, R = (s.kind === 'heavy' ? 34 : s.kind === 'block' ? 18 : 24) * (0.5 + k);
    g.globalAlpha = Math.max(0, 1 - k);
    g.fillStyle = s.kind === 'block' ? '#8ad8ff' : s.col;
    for (let i = 0; i < n; i++) { g.rotate(TAU / n); g.beginPath(); g.moveTo(0, -3); g.lineTo(R, 0); g.lineTo(0, 3); g.fill(); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, R * 0.32, 0, TAU); g.fill();
    g.restore();
  }
  S.sparks = S.sparks.filter(s => s.t < 12);
}
function drawBeam(g, f, cam) {
  if (!f.beam) return;
  const x0 = f.x - cam + f.face * 50 * f.s, y = FLOOR - 76 * f.s, len = 520, t = f.beam.t, w = Math.min(1, t / 6) * (1 - Math.max(0, t - 36) / 8) * (18 + Math.sin(t * 1.3) * 3);
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(0, y - w * 2, 0, y + w * 2); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.3, 'rgba(47,230,255,.7)'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(0.7, 'rgba(47,230,255,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(f.face > 0 ? x0 : x0 - len, y - w * 2, len, w * 4);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x0, y, w * 1.6, 0, TAU); g.fill(); g.restore();
}

/* =====================================================================
   MATCH FLOW
   ===================================================================== */
function startMatch(c1, c2, stage) {
  S.stage = stage; S.round = 1; S.wins = [0, 0];
  const k1 = S.mode === 'versus' ? 'p1' : 'solo', k2 = S.mode === 'versus' ? 'p2' : 'cpu';
  S.f = [new Fighter(c1, 0, new Controller(k1)), new Fighter(c2, 1, new Controller(k2))];
  S.f[0].meter = S.f[1].meter = 0;
  startRound(); S.screen = 'vs'; S.phaseT = 0;
  Kit.jingle([262, 330, 392, 523, 392, 523], 0.11, 'square', 0.12);
}
function startRound() {
  for (const f of S.f) { f.reset(); f.x = f.side ? STAGE_W / 2 + 90 : STAGE_W / 2 - 90; }
  S.projs = []; S.sparks = []; S.fx.clear(); S.timer = 99; S.phase = 'intro'; S.phaseT = 0; S.hitstop = 0; S.slow = 0; S.comboShow = null; S.koBy = null;
  S.camX = STAGE_W / 2 - SW / 2;
}
function koStart(a, d) {
  if (S.phase !== 'fight') return;
  S.phase = 'ko'; S.phaseT = 0; S.slow = 70; S.koBy = a; S.flash = 10;
  Kit.noise(1.4, 0.5, 300); Kit.tone(160, 1.4, 0.2, 'sawtooth', 0.25);
}
function endRound(winner) {
  if (winner >= 0) { S.wins[winner]++; S.f[winner].set('win', 'win', 0.2); S.f[1 - winner].hp > 0 ? S.f[1 - winner].set('lose', 'lose', 0.15) : 0; }
  S.phase = 'post'; S.phaseT = 0; S.roundWinner = winner;
  if (winner >= 0) Kit.jingle(winner === 0 || S.mode === 'versus' ? [523, 659, 784, 1047] : [392, 349, 330, 262], 0.12, 'square', 0.12);
}
function afterRound() {
  const done = S.wins[0] === 2 || S.wins[1] === 2;
  if (!done) { S.round++; startRound(); return; }
  const p1won = S.wins[0] === 2;
  if (S.mode === 'versus') { S.screen = 'result'; S.resultT = 0; return; }
  if (p1won) {
    S.ladderI++;
    if (S.ladderI >= S.ladder.length) { S.screen = 'ending'; S.phaseT = 0; Kit.setHi('street-legends', S.ladderI); Kit.jingle([523, 659, 784, 1047, 784, 1047, 1319], 0.14); return; }
    nextLadder();
  } else { S.screen = 'continue'; S.phaseT = 0; S.cont = 9; }
}
function nextLadder() { const L = S.ladder[S.ladderI]; startMatch(CHARS[S.sel[0]], L.ch, L.stage); }
function buildLadder() {
  const me = CHARS[S.sel[0]], others = CHARS.filter(c => c !== me).sort(() => Math.random() - 0.5);
  S.ladder = others.map(c => ({ ch: c, stage: c.home })).concat([{ ch: SHADOW(me), stage: 4 }]); S.ladderI = 0;
}

function update() {
  S.fx.update(1 / 60); if (S.shake > 0) S.shake *= 0.85; if (S.shake < 0.3) S.shake = 0; if (S.flash > 0) S.flash--;
  if (S.screen === 'title') return titleUpdate();
  if (S.screen === 'select') return selectUpdate();
  if (S.screen === 'stagesel') return stageSelUpdate();
  if (S.screen === 'vs') { if (++S.phaseT > 130 || (S.phaseT > 30 && (Kit.hit('a') || Kit.hit('start')))) { S.screen = 'fight'; S.phaseT = 0; } return; }
  if (S.screen === 'continue') { if (++S.phaseT % 60 === 0) { S.cont--; Kit.tone(440, 0.1, 0.1); } if (Kit.hit('a') || Kit.hit('start')) { nextLadder(); return; } if (S.cont < 0) S.screen = 'title'; return; }
  if (S.screen === 'ending' || S.screen === 'result') { if (++S.phaseT > 60 && (Kit.hit('a') || Kit.hit('start'))) S.screen = 'title'; if (S.phaseT > 900) S.screen = 'title'; return; }
  if (S.screen !== 'fight' || S.paused) return;
  // freeze frames: super flash and hitstop
  if (S.superFreeze > 0) { S.superFreeze--; return; }
  if (S.hitstop > 0) { S.hitstop--; for (const f of S.f) f.pose = lerpPose(f.pose, f.target, 0.4); return; }
  if (S.slow > 0) { S.slow--; if (S.slow % 3 !== 0) return; }
  S.tframe++; S.phaseT++;
  for (const f of S.f) { if (f.ctrl.kind === 'cpu') cpuThink(f); f.ctrl.read(f.face, f.ai); }
  if (S.phase === 'intro') {
    if (S.phaseT === 1) { S.announce = { t: 'ROUND ' + S.round, c: '#ffd21f', k: 0 }; Kit.jingle([392, 392, 523], 0.15, 'square', 0.1); }
    if (S.phaseT >= 70 && S.f[0].st === 'intro') { S.announce = { t: 'FIGHT!', c: '#ff3b3b', k: 0 }; Kit.noise(0.5, 0.3, 1500); Kit.jingle([523, 784, 1047], 0.07, 'sawtooth', 0.13); for (const f of S.f) f.set('idle', 'idle', 0.2); }
    if (S.phaseT >= 100) { S.phase = 'fight'; }
  }
  if (S.phase === 'fight' && S.tframe % 60 === 0 && --S.timer <= 0) {
    S.timer = 0; const [a, b] = S.f, w = a.hp === b.hp ? -1 : a.hp > b.hp ? 0 : 1;
    S.announce = { t: 'TIME', c: '#fff', k: 0 }; endRound(w);
  }
  for (const f of S.f) f.update();
  updateProjs();
  // pushboxes, bounds and the camera
  const [a, b] = S.f;
  if (a.st !== 'thrown' && b.st !== 'thrown') {
    const minD = 24 * (a.s + b.s), d = b.x - a.x;
    if (Math.abs(d) < minD && Math.abs(a.y - b.y) < 70 && a.st !== 'down' && b.st !== 'down') { const push = (minD - Math.abs(d)) / 2 * Math.sign(d || 1); a.x -= push; b.x += push; }
  }
  for (const f of S.f) f.x = clamp(f.x, 24, STAGE_W - 24);
  const mid = (a.x + b.x) / 2;
  if (Math.abs(a.x - b.x) > SW - 50) { const c = mid; for (const f of S.f) f.x = clamp(f.x, c - (SW - 50) / 2, c + (SW - 50) / 2); }
  S.camX = lerp(S.camX, clamp(mid - SW / 2, 0, STAGE_W - SW), 0.15);
  if (S.comboShow && --S.comboShow.t <= 0) S.comboShow = null;
  if (S.announce) S.announce.k++;
  if (S.phase === 'ko' && S.phaseT > 110 && S.f.every(f => f.st !== 'airhit')) endRound(S.koBy.side);
  if (S.phase === 'post' && S.phaseT > 170) afterRound();
}

/* ---------- menus ---------- */
const MENU = () => [['ARCADE', () => { S.mode = 'arcade'; toSelect(); }], ['VERSUS  2P', () => { S.mode = 'versus'; toSelect(); }], ['CPU LEVEL: ' + ['EASY', 'NORMAL', 'HARD'][S.cpu], () => { S.cpu = (S.cpu + 1) % 3; }]];
function toSelect() { S.screen = 'select'; S.sel = [0, 1]; S.picked = [false, S.mode !== 'versus']; S.ctrlSel = [new Controller(S.mode === 'versus' ? 'p1' : 'solo'), new Controller('p2')]; }
function titleUpdate() {
  const n = MENU().length;
  if (Kit.hit('down')) { S.menu = (S.menu + 1) % n; Kit.tone(660, 0.05, 0.08); }
  if (Kit.hit('up')) { S.menu = (S.menu + n - 1) % n; Kit.tone(660, 0.05, 0.08); }
  if (Kit.hit('a') || Kit.hit('b')) { Kit.tone(880, 0.08, 0.1); MENU()[S.menu][1](); }
}
function selectUpdate() {
  const players = S.mode === 'versus' ? [0, 1] : [0];
  for (const i of players) {
    const c = S.ctrlSel[i]; c.read(1, null);
    const dx = c.dirAbs.x, dy = c.dirAbs.y; c.mv = c.mv || 0;
    if (S.picked[i]) { if (c.press.hp && S.mode === 'versus') S.picked[i] = false; continue; }
    if ((dx || dy) && c.mv <= 0) { S.sel[i] = (S.sel[i] + (dx || -dy) + 4) % 4; c.mv = 10; Kit.tone(520, 0.04, 0.08); }
    if (!dx && !dy) c.mv = 0; else c.mv--;
    if (c.press.lp || c.press.lk || (i === 0 && Kit.hit('start'))) { S.picked[i] = true; Kit.jingle([523, 784], 0.07); }
  }
  if (S.picked.every(Boolean)) {
    if (S.mode === 'versus') { S.screen = 'stagesel'; S.stageSel = 0; S.mvT = 10; }
    else { buildLadder(); nextLadder(); }
  }
}
function stageSelUpdate() {
  if (--S.mvT < 0) { if (Kit.hit('right') || Kit.hit('down')) { S.stageSel = (S.stageSel + 1) % STAGES.length; Kit.tone(520, 0.04, 0.08); } if (Kit.hit('left') || Kit.hit('up')) { S.stageSel = (S.stageSel + STAGES.length - 1) % STAGES.length; Kit.tone(520, 0.04, 0.08); } }
  if (S.mvT < 0 && (Kit.hit('a') || Kit.hit('start') || Kit.keys.KeyF)) startMatch(CHARS[S.sel[0]], CHARS[S.sel[1]], S.stageSel);
}

/* =====================================================================
   RENDER
   ===================================================================== */
function render() {
  const g = Kit.begin('#000');
  if (S.screen === 'title') drawTitle(g);
  else if (S.screen === 'select') drawSelect(g);
  else if (S.screen === 'stagesel') drawStageSel(g);
  else if (S.screen === 'vs') drawVS(g);
  else if (S.screen === 'continue') drawContinue(g);
  else if (S.screen === 'ending' || S.screen === 'result') drawEnding(g);
  else drawFight(g);
  Kit.end();
}
function drawStage(g, i, cam) {
  g.drawImage(stageCanvas(i), cam, 0, SW, 360, 0, 0, SW, 360);
  g.save(); g.translate(-cam, 0); STAGES[i].live(g, cam); g.restore();
}
function drawFight(g) {
  const sh = S.shake;
  g.save(); if (sh) g.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
  const cam = Math.round(S.camX);
  drawStage(g, S.stage, cam);
  if (S.superFreeze > 0) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(-10, -10, SW + 20, 380); const f = S.superBy; g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 20; k++) { g.strokeStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.2})`; g.lineWidth = 2; const a = k / 20 * TAU + S.superFreeze * 0.05; g.beginPath(); g.moveTo(f.x - cam, FLOOR - 70); g.lineTo(f.x - cam + Math.cos(a) * 400, FLOOR - 70 + Math.sin(a) * 400); g.stroke(); } g.restore(); }
  // the attacker draws on top
  const order = S.f.slice().sort((a, b) => (a.st === 'attack' || a.st === 'special' ? 1 : 0) - (b.st === 'attack' || b.st === 'special' ? 1 : 0));
  for (const f of order) drawFighter(g, f, cam);
  for (const f of S.f) drawBeam(g, f, cam);
  for (const p of S.projs) drawProj(g, p, cam);
  drawSparks(g, cam);
  g.save(); g.translate(-cam, 0); S.fx.draw(g); g.restore();
  if (S.stage === 2) rainOverlay(g);
  g.restore();
  if (S.flash > 0) { g.fillStyle = `rgba(255,255,255,${S.flash / 14})`; g.fillRect(0, 0, SW, 360); }
  drawHUD(g);
}
function drawHUD(g) {
  const [a, b] = S.f, W = 190;
  for (const f of S.f) {
    const left = f.side === 0, x = left ? 14 : SW - 14 - W, y = 16;
    g.fillStyle = INK; g.beginPath(); g.roundRect(x - 3, y - 3, W + 6, 18, 4); g.fill();
    g.fillStyle = '#5a0a0a'; g.fillRect(x, y, W, 12);
    const hw = W * f.dhp / f.ch.hp, hp = W * f.hp / f.ch.hp;
    g.fillStyle = '#ff8a1f'; left ? g.fillRect(x + W - hw, y, hw, 12) : g.fillRect(x, y, hw, 12);
    g.fillStyle = lin(g, 0, y, 0, y + 12, [[0, '#fff27a'], [0.5, '#ffd21f'], [1, '#d89a10']]); left ? g.fillRect(x + W - hp, y, hp, 12) : g.fillRect(x, y, hp, 12);
    if (f.hp < f.ch.hp * 0.25 && Kit.blink(3)) { g.fillStyle = 'rgba(255,60,60,.5)'; left ? g.fillRect(x + W - hp, y, hp, 12) : g.fillRect(x, y, hp, 12); }
    Kit.text(f.ch.name, left ? x : x + W, y + 26, 13, '#fff', left ? 'left' : 'right');
    for (let k = 0; k < 2; k++) { const cx = left ? x + W - 8 - k * 14 : x + 8 + k * 14; g.fillStyle = INK; g.beginPath(); g.arc(cx, y + 26, 5.5, 0, TAU); g.fill(); g.fillStyle = S.wins[f.side] > k ? '#ffd21f' : '#333'; g.beginPath(); g.arc(cx, y + 26, 4, 0, TAU); g.fill(); }
    // super meter
    const my = 344, mw = 120, mx = left ? 14 : SW - 14 - mw;
    g.fillStyle = INK; g.fillRect(mx - 2, my - 2, mw + 4, 10); g.fillStyle = '#1a1a3a'; g.fillRect(mx, my, mw, 6);
    const full = f.meter >= 100; g.fillStyle = full ? (Kit.blink(4) ? '#fff' : '#2fe6ff') : '#2f8bff'; const mwv = mw * f.meter / 100; left ? g.fillRect(mx, my, mwv, 6) : g.fillRect(mx + mw - mwv, my, mwv, 6);
    const human = f.ctrl.kind !== 'cpu';
    Kit.text(full ? (human ? 'SUPER READY · PRESS SUPER' : 'SUPER READY') : 'SUPER', left ? mx + mw + 6 : mx - 6, my + 3, 9, full ? '#2fe6ff' : '#9aa', left ? 'left' : 'right', { stroke: INK });
  }
  // timer
  g.fillStyle = INK; g.beginPath(); g.roundRect(SW / 2 - 20, 8, 40, 30, 6); g.fill();
  Kit.text(String(S.timer).padStart(2, '0'), SW / 2, 24, 22, S.timer <= 10 ? '#ff3b3b' : '#fff', 'center', { italic: false });
  if (S.comboShow) { const left = S.comboShow.side === 0; Kit.text(S.comboShow.n + ' HITS', left ? 20 : SW - 20, 110, 22, '#ffd21f', left ? 'left' : 'right'); Kit.text('COMBO', left ? 20 : SW - 20, 130, 12, '#fff', left ? 'left' : 'right'); }
  if (S.announce && S.announce.k < 80) {
    const k = S.announce.k, sc = k < 8 ? 2.2 - k * 0.15 : 1;
    g.save(); g.translate(SW / 2, 160); g.scale(sc, sc); g.globalAlpha = k > 60 ? (80 - k) / 20 : 1;
    Kit.text(S.announce.t, 0, 0, 46, S.announce.c, 'center', { glow: S.announce.c, blur: 20 }); g.restore();
  }
  if (S.phase === 'ko' || S.phase === 'post') {
    const k = S.phaseT, txt = S.roundWinner === -1 && S.phase === 'post' ? 'DRAW' : S.phase === 'ko' || S.phaseT < 60 ? 'K.O.' : null;
    if (S.phase === 'post' && S.phaseT > 50 && S.roundWinner >= 0) Kit.text(S.f[S.roundWinner].ch.name + ' WINS', SW / 2, 160, 30, '#ffd21f', 'center', { glow: '#ff6a00' });
    else if (txt) { const sc = Math.max(1, 3 - k * 0.12); g.save(); g.translate(SW / 2, 150); g.scale(sc, sc); Kit.text(txt, 0, 0, 56, '#ff3b3b', 'center', { glow: '#ff3b3b', blur: 24 }); g.restore(); }
  }
  if (S.paused) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, SW, 360); Kit.text('PAUSED', SW / 2, 150, 36, '#ffd21f'); Kit.mono('START / ESC resume', SW / 2, 186, 10, '#ccc', 'center'); }
}
function drawTitle(g) {
  drawStage(g, (Math.floor(Kit.t / 6)) % STAGES.length, (Math.sin(Kit.t * 0.1) * 0.5 + 0.5) * (STAGE_W - SW));
  g.fillStyle = 'rgba(5,3,15,.55)'; g.fillRect(0, 0, SW, 360);
  g.save(); g.translate(SW / 2, 70); g.rotate(-0.05);
  Kit.text('STREET', 0, -6, 52, '#fff', 'center', { glow: '#ff3b3b', blur: 18 });
  Kit.text('LEGENDS', 0, 40, 56, '#ffd21f', 'center', { glow: '#ff6a00', blur: 18, stroke: '#7a0a0a' });
  g.restore();
  MENU().forEach(([label], i) => { const on = i === S.menu, y = 200 + i * 30; if (on) { g.fillStyle = 'rgba(255,59,59,.3)'; g.fillRect(SW / 2 - 120, y - 13, 240, 26); } Kit.text((on ? '▶ ' : '') + label, SW / 2, y, on ? 19 : 16, on ? '#ffd21f' : '#fff'); });
  Kit.mono('↑ ↓ choose   ·   PUNCH / START to pick', SW / 2, 302, 9, '#bbb', 'center');
  Kit.mono('LP J · HP K · LK L · HK I · SPECIAL U · SUPER O    2P: P1 WASD + F G R T H Y, P2 arrows + J K L I U O', SW / 2, 318, 7, '#999', 'center');
  const best = Kit.hi('street-legends'); if (best) Kit.mono('ARCADE CLEARED ' + (best >= 4 ? '★' : best + '/4'), SW / 2, 334, 9, '#ffd21f', 'center');
}
function drawSelect(g) {
  g.fillStyle = lin(g, 0, 0, 0, 360, [[0, '#1a0a2a'], [1, '#05030a']]); g.fillRect(0, 0, SW, 360);
  g.strokeStyle = 'rgba(255,59,59,.12)'; for (let k = 0; k < 20; k++) { g.beginPath(); g.moveTo(k * 40 - (Kit.t * 20) % 40, 0); g.lineTo(k * 40 - 200 - (Kit.t * 20) % 40, 360); g.stroke(); }
  Kit.text('SELECT YOUR FIGHTER', SW / 2, 26, 22, '#ffd21f', 'center', { glow: '#ff6a00' });
  // big previews
  const p1 = CHARS[S.sel[0]];
  _floorDraw(g, p1, 110, 250, 1.35, 1);
  Kit.text(p1.name, 110, 272, 22, p1.color, 'center', { glow: p1.color, blur: 10 }); Kit.mono(p1.title, 110, 290, 9, '#ddd', 'center');
  if (S.mode === 'versus') { const p2 = CHARS[S.sel[1]]; _floorDraw(g, p2, 370, 250, 1.35, -1); Kit.text(p2.name, 370, 272, 22, p2.color, 'center', { glow: p2.color, blur: 10 }); Kit.mono(p2.title, 370, 290, 9, '#ddd', 'center'); }
  else { const sp = p1.specials; const lines = Object.entries(sp).map(([k, v]) => [{ qcf_p: '↓↘→ + P', dp_p: '→↓↘ + P', dp_k: '→↓↘ + K', qcb_k: '↓↙← + K', qcb_p: '↓↙← + P', super: '↓↘→↓↘→ + P' }[k], v.replace(/([A-Z])/g, ' $1').toUpperCase()]);
    Kit.text('MOVES', 360, 96, 14, '#ffd21f'); lines.forEach(([m, n], i) => { Kit.mono(n, 290, 120 + i * 20, 9, '#fff'); Kit.mono(m, 470, 120 + i * 20, 9, '#2fe6ff', 'right'); });
    Kit.mono('THROW: → or ← + HP up close', 290, 120 + lines.length * 20, 9, '#bbb'); Kit.mono('DASH: →→  ·  BLOCK: hold ←', 290, 134 + lines.length * 20, 9, '#bbb');
    Kit.text('EASY MODE BUTTONS', 360, 166 + lines.length * 20, 11, '#ffd21f');
    Kit.mono('SPECIAL: ' + [sp.qcf_p, sp.dp_p || sp.dp_k, sp.qcb_k || sp.qcb_p].map((v, i) => ['', '↓ + ', '← + '][i] + v.replace(/([A-Z])/g, ' $1').toUpperCase()).join(' · '), 360, 184 + lines.length * 20, 7, '#fff', 'center');
    Kit.mono('SUPER: press SUPER when the bar is full', 360, 198 + lines.length * 20, 8, '#2fe6ff', 'center'); }
  // roster
  CHARS.forEach((c, i) => {
    const x = SW / 2 - 104 + i * 52, y = 310, on0 = S.sel[0] === i, on1 = S.mode === 'versus' && S.sel[1] === i;
    g.fillStyle = INK; g.fillRect(x - 2, y - 2, 48, 44); g.fillStyle = lin(g, 0, y, 0, y + 40, [[0, shadeCol(c.color.length === 7 ? c.color : '#888888', 0.6)], [1, '#111']]); g.fillRect(x, y, 44, 40);
    g.save(); g.beginPath(); g.rect(x, y, 44, 40); g.clip(); _floorDraw(g, c, x + 22, y + 96, 0.62, 1); g.restore();
    if (on0) { g.strokeStyle = S.picked[0] ? '#fff' : (Kit.blink(4) ? '#ff3b3b' : '#ffd21f'); g.lineWidth = 3; g.strokeRect(x - 1, y - 1, 46, 42); Kit.text('1P', x + 6, y - 8, 10, '#ff3b3b', 'center'); }
    if (on1) { g.strokeStyle = S.picked[1] ? '#fff' : (Kit.blink(4) ? '#2f8bff' : '#2fe6ff'); g.lineWidth = 3; g.strokeRect(x + 2, y + 2, 40, 36); Kit.text('2P', x + 38, y - 8, 10, '#2f8bff', 'center'); }
  });
}
function _floorDraw(g, ch, x, floorY, sc, face) {
  const f = { ch, s: ch.scale * sc, x, y: 0, face, pose: lerpPose(POSES.idle, POSES.idle2, 0.5 + 0.5 * Math.sin(Kit.t * 3)), spinFlip: 1, alpha: 1, trail: [], st: 'idle' };
  g.save(); g.translate(0, floorY - FLOOR); drawFighter(g, f, 0); g.restore();
}
function drawStageSel(g) {
  drawStage(g, S.stageSel, (Math.sin(Kit.t * 0.3) * 0.5 + 0.5) * (STAGE_W - SW));
  g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, SW, 70);
  Kit.text('SELECT STAGE', SW / 2, 22, 18, '#ffd21f'); Kit.text('◀  ' + STAGES[S.stageSel].name + '  ▶', SW / 2, 50, 22, '#fff', 'center', { glow: '#ff3b3b' });
  if (Kit.blink()) Kit.mono('P1: LP / START to fight', SW / 2, 340, 10, '#fff', 'center');
}
function drawVS(g) {
  const [a, b] = S.f, k = Math.min(1, S.phaseT / 20);
  g.fillStyle = lin(g, 0, 0, SW, 0, [[0, shadeCol(a.ch.color, 0.5)], [0.5, '#000'], [1, shadeCol(b.ch.color, 0.5)]]); g.fillRect(0, 0, SW, 360);
  _floorDraw(g, a.ch, lerp(-80, 120, k), 300, 1.6, 1); _floorDraw(g, b.ch, lerp(SW + 80, 360, k), 300, 1.6, -1);
  Kit.text('VS', SW / 2, 150, 60, '#ffd21f', 'center', { glow: '#ff3b3b', blur: 20 });
  Kit.text(a.ch.name, 110, 330, 20, '#fff'); Kit.text(b.ch.name, 370, 330, 20, '#fff');
  Kit.mono(STAGES[S.stage].name, SW / 2, 352, 9, '#ccc', 'center');
  if (S.mode === 'arcade') Kit.mono('STAGE ' + (S.ladderI + 1) + ' / ' + S.ladder.length, SW / 2, 40, 11, '#fff', 'center');
}
function drawContinue(g) {
  g.fillStyle = '#05030a'; g.fillRect(0, 0, SW, 360);
  _floorDraw(g, CHARS[S.sel[0]], SW / 2, 290, 1.4, 1);
  Kit.text('CONTINUE?', SW / 2, 80, 40, '#ffd21f'); Kit.text(String(Math.max(0, S.cont)), SW / 2, 140, 54, '#ff3b3b');
  Kit.mono('PUNCH / START to keep fighting', SW / 2, 330, 10, '#ccc', 'center');
}
function drawEnding(g) {
  const ch = S.screen === 'ending' ? CHARS[S.sel[0]] : S.f[S.wins[0] === 2 ? 0 : 1].ch;
  drawStage(g, ch.home, (Math.sin(Kit.t * 0.2) * 0.5 + 0.5) * (STAGE_W - SW));
  g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, SW, 360);
  const f = { ch, s: ch.scale * 1.5, x: SW / 2, y: 0, face: 1, pose: lerpPose(POSES.win, POSES.win2, 0.5 + 0.5 * Math.sin(Kit.t * 4)), spinFlip: 1, alpha: 1, trail: [], st: 'win' };
  g.save(); g.translate(0, 300 - FLOOR); drawFighter(g, f, 0); g.restore();
  Kit.text(S.screen === 'ending' ? 'CONGRATULATIONS!' : (S.wins[0] === 2 ? 'PLAYER 1 WINS' : 'PLAYER 2 WINS'), SW / 2, 60, 30, '#ffd21f', 'center', { glow: '#ff6a00' });
  if (S.screen === 'ending') Kit.mono(ch.name + ' is the legend of the streets.', SW / 2, 92, 11, '#fff', 'center');
  if (S.phaseT > 60 && Kit.blink()) Kit.mono('PRESS START', SW / 2, 336, 11, '#fff', 'center');
}

/* ---------- boot ---------- */
Kit.init({
  W: 480, H: 360, update, render, touchLabels: { a: 'LP', b: 'HP', c: 'LK', d: 'HK', e: 'SPCL', f: 'SUPER' },
  onStart() {
    if (S.screen === 'title') MENU()[S.menu][1]();
    else if (S.screen === 'fight') S.paused = !S.paused;
  },
  onPause() { if (S.screen === 'fight') S.paused = !S.paused; else if (S.screen !== 'title') S.screen = 'title'; },
  onTitle() { return S.screen === 'title'; },
});
