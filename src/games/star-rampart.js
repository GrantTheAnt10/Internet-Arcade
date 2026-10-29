/* =====================================================================
   STAR RAMPART — formation space shooter
   ===================================================================== */
const PF = { x: 120, w: 240, h: 360 };        // playfield inside the 480x360 screen
const PAL = { w: '#f4f4f4', r: '#ff3030', b: '#3a7bff', y: '#ffd21f', g: '#2ee86b', p: '#b04bff', c: '#2fe6ff', o: '#ff8a1f', k: '#222' };
const SPR_SRC = {
  ship: ['......w......', '......w......', '.....www.....', '.....www.....', '..r..www..r..', '..r.wwwww.r..', '..wwwrwrwww..', 'w.wwrrwrrww.w', 'w.wwwwwwwww.w', 'wwwww.w.wwwww', 'www..w.w..www', 'ww...w.w...ww', 'w...........w'],
  bee0: ['..b.......b..', '...b.....b...', '..bbyyyyybb..', '.bbyyryryybb.', 'bb.yyyyyyy.bb', 'b..yrrrrry..b', '...yyyyyyy...', '....y.y.y....'],
  bee1: ['.............', '..b.......b..', '...byyyyyb...', '..byyryryyb..', '.bbyyyyyyybb.', 'bb.yrrrrry.bb', 'b..yyyyyyy..b', '....y.y.y....'],
  fly0: ['r...........r', 'rr...b.b...rr', 'rrw..rrr..wrr', 'rrwwrrwrrwwrr', '.rrrrwwwrrrr.', '..rr.rrr.rr..', '..r..rrr..r..', '.....b.b.....'],
  fly1: ['.............', '.r...b.b...r.', 'rrw..rrr..wrr', 'rrwwrrwrrwwrr', 'rrrrrwwwrrrrr', '.r.r.rrr.r.r.', '.....rrr.....', '.....b.b.....'],
  boss0: ['...g.....g...', '....g...g....', '..ggggggggg..', '.ggppgggppgg.', 'gggppgggppggg', 'gg.ggggggg.gg', 'g..gg.g.gg..g', '...g..g..g...'],
  boss1: ['.............', '...g.....g...', '..ggggggggg..', '.ggppgggppgg.', 'gggppgggppggg', 'ggggggggggggg', '.g.gg.g.gg.g.', '..g...g...g..'],
};
const SPR = {};
function makeSprites() {
  const build = (rows, swap) => {
    const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length; const g = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; g.fillStyle = PAL[(swap && swap[ch]) || ch]; g.fillRect(x, y, 1, 1); }));
    return c;
  };
  for (const k in SPR_SRC) SPR[k] = build(SPR_SRC[k]);
  SPR.boss0d = build(SPR_SRC.boss0, { g: 'p', p: 'c' }); SPR.boss1d = build(SPR_SRC.boss1, { g: 'p', p: 'c' });
  SPR.captive = build(SPR_SRC.ship, { w: 'r', r: 'w' });
}

/* ---------- paths ---------- */
// Catmull-Rom through points, resampled to equal spacing so things fly at a steady speed
function makePath(pts, step = 2) {
  const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
  for (let i = 1; i < P.length - 2; i++) for (let k = 0; k < 16; k++) {
    const t = k / 16, p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2], t2 = t * t, t3 = t2 * t;
    out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
      0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
  }
  out.push(pts[pts.length - 1]);
  const res = [out[0]]; let acc = 0;
  for (let i = 1; i < out.length; i++) {
    const d = Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]); acc += d;
    while (acc >= step) { acc -= step; const f = 1 - acc / d; res.push([lerp(out[i - 1][0], out[i][0], f), lerp(out[i - 1][1], out[i][1], f)]); }
  }
  res.push(out[out.length - 1]);
  return res;
}
const mirror = pts => pts.map(([x, y]) => [PF.w - x, y]);
const ENTRY = {
  top: [[150, -16], [150, 40], [190, 120], [200, 190], [160, 230], [115, 200], [118, 150]],
  side: [[-16, 300], [50, 270], [100, 220], [105, 160], [70, 130], [40, 160], [70, 190], [110, 170]],
  loop: [[-16, 120], [60, 110], [120, 150], [150, 210], [120, 250], [80, 220], [100, 170], [140, 150]],
};
const CHALLENGE = [
  [[-16, 60], [80, 80], [160, 160], [200, 260], [120, 320], [40, 260], [80, 160], [180, 100], [260, 60]],
  [[120, -16], [120, 120], [60, 200], [120, 260], [180, 200], [120, 140], [120, 60], [40, -20]],
  [[-16, 320], [60, 220], [120, 180], [180, 220], [160, 280], [100, 260], [100, 160], [140, 60], [180, -20]],
];

/* ---------- formation ---------- */
const SLOTS = [];
(function () {
  const rows = [{ type: 'boss', n: 4, y: 36 }, { type: 'fly', n: 8, y: 54 }, { type: 'fly', n: 8, y: 70 }, { type: 'bee', n: 10, y: 88 }, { type: 'bee', n: 10, y: 104 }];
  for (const r of rows) for (let i = 0; i < r.n; i++) SLOTS.push({ type: r.type, dx: (i - (r.n - 1) / 2) * 18, y: r.y });
})();
const byType = t => SLOTS.map((s, i) => [s, i]).filter(([s]) => s.type === t).map(([, i]) => i);
// entry waves: [path, mirrored?, slot indices]
function waveList() {
  const boss = byType('boss'), fly = byType('fly'), bee = byType('bee');
  return [
    { path: 'top', pairs: true, slots: [...fly.slice(4, 8), ...bee.slice(10, 14)].concat([]) },
    { path: 'side', slots: [...boss, ...fly.slice(0, 4)] },
    { path: 'side', mir: true, slots: fly.slice(8, 16) },
    { path: 'top', slots: [...bee.slice(0, 4), ...bee.slice(14, 18)] },
    { path: 'loop', mir: true, slots: [...bee.slice(4, 10), ...bee.slice(18, 20)] },
  ];
}
const SCORE = { bee: [50, 100], fly: [80, 160], boss: [150, 400] };

/* ---------- game state ---------- */
const S = {
  mode: 'title', score: 0, hi: 0, lives: 3, stage: 1, extra: [20000, 70000],
  player: null, dual: false, shots: [], bombs: [], foes: [], stars: [], fx: new Particles(), pops: [],
  waves: [], waveT: 0, diveT: 0, msg: '', msgT: 0, deadT: 0, paused: false, overT: 0, challenge: false, hits: 0, total: 0,
  captive: null, beamFoe: null,
};
function initStars() {
  S.stars = [];
  for (let i = 0; i < 70; i++) S.stars.push({ x: Math.random() * PF.w, y: Math.random() * PF.h, z: 0.3 + Math.random(), c: pick(['#fff', '#ff6', '#6ff', '#f6f', '#f66']), ph: Math.random() * 6 });
}
function newGame() {
  Object.assign(S, { mode: 'play', score: 0, lives: 3, stage: 1, extra: [20000, 70000], dual: false, captive: null, paused: false });
  S.fx.clear(); startStage(); Kit.jingle([523, 659, 784, 1047, 784, 1047], 0.11);
}
function startStage() {
  S.shots = []; S.bombs = []; S.foes = []; S.pops = []; S.beamFoe = null;
  S.challenge = S.stage > 2 && (S.stage - 3) % 4 === 0;
  S.hits = 0; S.total = 0;
  S.player = S.player && S.player.alive ? S.player : spawnPlayer();
  const waves = waveList();
  S.waves = waves.map((w, wi) => {
    const list = [];
    if (S.challenge) {
      const base = CHALLENGE[wi % CHALLENGE.length], pts = (wi % 2) ? mirror(base) : base;
      for (let k = 0; k < 8; k++) list.push({ type: pick(['bee', 'fly', 'boss']), slot: -1, path: makePath(pts), delay: k * 0.14 });
    } else {
      const base = ENTRY[w.path];
      w.slots.forEach((slot, k) => {
        const mir = w.pairs ? (k % 2 === 1) : !!w.mir;
        list.push({ type: SLOTS[slot].type, slot, path: makePath(mir ? mirror(base) : base), delay: (w.pairs ? Math.floor(k / 2) : k) * 0.13 });
      });
    }
    return { start: 1.6 + wi * 2.6, list, spawned: false };
  });
  S.waveT = 0; S.diveT = 3.5; S.total = S.challenge ? 40 : SLOTS.length;
  S.msg = S.challenge ? 'CHALLENGING STAGE' : 'STAGE ' + S.stage; S.msgT = 2.2;
}
function spawnPlayer() { return { x: PF.w / 2, y: PF.h - 26, alive: true, inv: 1.5 }; }

function foeSprite(f) {
  const fr = Math.floor(Kit.t * 3 + f.ph) % 2;
  if (f.type === 'boss') return SPR[(f.hp < 2 ? 'boss' + fr + 'd' : 'boss' + fr)];
  return SPR[f.type + fr];
}
function spawnFoe(def) {
  S.foes.push({ type: def.type, slot: def.slot, x: def.path[0][0], y: def.path[0][1], path: def.path, pi: 0, state: 'enter', hp: def.type === 'boss' ? 2 : 1,
    ang: Math.PI, ph: Math.random() * 2, speed: 2.4 + S.stage * 0.05, shotsLeft: 0 });
}
function slotPos(i) {
  const s = SLOTS[i], t = Kit.t, entering = S.waves.some(w => !w.spawned) || S.foes.some(f => f.state === 'enter' || f.state === 'home');
  let x = PF.w / 2 + s.dx, y = s.y;
  if (entering) x += Math.sin(t * 1.3) * 12;
  else { const k = 1 + 0.1 * (0.5 + 0.5 * Math.sin(t * 1.6)); x = PF.w / 2 + s.dx * k; y = 24 + (s.y - 24) * k; }
  return [x, y];
}
function addScore(n) {
  S.score += n;
  if (S.extra.length && S.score >= S.extra[0]) { S.extra.shift(); S.lives++; Kit.jingle([784, 988, 1175, 1568], 0.08, 'square', 0.1); }
}

/* ---------- dives ---------- */
function startDive(f, kind) {
  const px = S.player ? S.player.x : PF.w / 2, side = f.x < PF.w / 2 ? -1 : 1;
  if (kind === 'beam') {
    f.state = 'beamdive'; f.path = makePath([[f.x, f.y], [f.x + side * 24, f.y - 14], [f.x + side * 30, f.y + 20], [clamp(px, 30, PF.w - 30), 196]]); f.pi = 0;
  } else {
    f.state = 'dive';
    const tx = clamp(px + rand(-30, 30), 10, PF.w - 10);
    f.path = makePath([[f.x, f.y], [f.x + side * 22, f.y - 16], [f.x + side * 34, f.y + 18], [lerp(f.x, tx, 0.5), 170], [tx, 250], [tx - side * 40, 320], [tx - side * 50, PF.h + 20]]); f.pi = 0;
    f.shotsLeft = Math.min(3, 1 + Math.floor(S.stage / 3)); f.fireAt = rand(110, 190);
  }
  Kit.tone(1400, 0.5, 0.05, 'sine', 0.45);
}
function pickDiver() {
  const home = S.foes.filter(f => f.state === 'formation');
  if (!home.length || !S.player || !S.player.alive) return;
  const bosses = home.filter(f => f.type === 'boss');
  if (bosses.length && !S.dual && !S.captive && !S.beamFoe && Math.random() < 0.3) { const b = pick(bosses); S.beamFoe = b; startDive(b, 'beam'); return; }
  const f = pick(home); startDive(f, 'dive');
  // bosses bring escorts
  if (f.type === 'boss') for (const e of home.filter(e => e !== f && e.type === 'fly' && Math.abs(e.x - f.x) < 30).slice(0, 2)) { startDive(e, 'dive'); e.path = f.path.map(([x, y]) => [x + (e.x - f.x), y + (e.y - f.y)]); }
}

/* ---------- update ---------- */
function update(dt) {
  for (const s of S.stars) { s.y += (S.mode === 'play' ? 40 : 24) * s.z * dt; if (s.y > PF.h) { s.y = 0; s.x = Math.random() * PF.w; } }
  S.fx.update(dt);
  for (let i = S.pops.length - 1; i >= 0; i--) { S.pops[i].t -= dt; if (S.pops[i].t <= 0) S.pops.splice(i, 1); }
  if (S.mode !== 'play' || S.paused) { if (S.mode === 'over' && (S.overT -= dt) <= 0) S.mode = 'title'; return; }
  if (S.msgT > 0) S.msgT -= dt;
  const P = S.player;
  // player
  if (P.alive) {
    if (P.captured) {
      const b = P.captured; P.x = lerp(P.x, b.x, dt * 2); P.y = lerp(P.y, b.y + 16, dt * 1.6); P.spin += dt * 10;
      if (Math.abs(P.y - (b.y + 16)) < 3) { P.alive = false; S.captive = { boss: b }; b.hasCaptive = true; S.deadT = 2.2; S.msg = 'FIGHTER CAPTURED'; S.msgT = 2.2; S.lives--; Kit.jingle([392, 349, 330, 294], 0.16, 'triangle', 0.12); }
    } else {
      P.x = clamp(P.x + Kit.axisX() * 140 * dt, S.dual ? 16 : 8, PF.w - (S.dual ? 16 : 8));
      if (P.inv > 0) P.inv -= dt;
      const fire = Kit.hit('a') || Kit.hit('b') || Kit.hit('c') || Kit.hit('d');
      const volleys = S.shots.length / (S.dual ? 2 : 1);
      if (fire && volleys < 2) {
        if (S.dual) { S.shots.push({ x: P.x - 8, y: P.y - 8 }, { x: P.x + 8, y: P.y - 8 }); } else S.shots.push({ x: P.x, y: P.y - 8 });
        Kit.tone(1100, 0.08, 0.08, 'square', 0.35);
      }
    }
  } else if (S.deadT > 0 && (S.deadT -= dt) <= 0) {
    if (S.lives > 0) { S.player = spawnPlayer(); S.msg = 'READY'; S.msgT = 1.2; } else gameOver();
  }
  // shots
  for (let i = S.shots.length - 1; i >= 0; i--) { const s = S.shots[i]; s.y -= 420 * dt; if (s.y < -8) S.shots.splice(i, 1); }
  for (let i = S.bombs.length - 1; i >= 0; i--) { const b = S.bombs[i]; b.x += b.vx * dt; b.y += b.vy * dt; if (b.y > PF.h + 6) S.bombs.splice(i, 1); }
  // spawn waves
  S.waveT += dt;
  for (const w of S.waves) {
    if (w.spawned || S.waveT < w.start) continue;
    for (const d of w.list) if (!d.done && S.waveT >= w.start + d.delay) { d.done = true; spawnFoe(d); }
    if (w.list.every(d => d.done)) w.spawned = true;
  }
  // foes
  for (const f of S.foes) {
    if (f.state === 'enter' || f.state === 'dive' || f.state === 'beamdive' || f.state === 'leave') {
      const ox = f.x, oy = f.y;
      f.pi += f.speed * 60 * dt / 2;
      const i = Math.min(f.path.length - 1, Math.floor(f.pi));
      f.x = f.path[i][0]; f.y = f.path[i][1];
      if (Math.hypot(f.x - ox, f.y - oy) > 0.01) f.ang = Math.atan2(f.y - oy, f.x - ox) + Math.PI / 2;
      if (f.state === 'dive' && f.shotsLeft > 0 && f.y > f.fireAt && P.alive) {
        f.shotsLeft--; f.fireAt += 26;
        const dx = P.x - f.x, dy = P.y - f.y, d = Math.hypot(dx, dy) || 1, sp = 150 + S.stage * 6;
        S.bombs.push({ x: f.x, y: f.y + 4, vx: clamp(dx / d * sp, -60, 60), vy: Math.max(100, dy / d * sp) });
      }
      if (i >= f.path.length - 1) {
        if (f.state === 'beamdive') { f.state = 'beam'; f.beamT = 3.2; f.ang = Math.PI; Kit.tone(220, 3, 0.05, 'sawtooth', 2); }
        else if (S.challenge || f.state === 'leave') f.dead = true;
        else if (f.state === 'dive') { f.x = slotPos(f.slot)[0]; f.y = -16; f.state = 'home'; }
        else f.state = 'home';
      }
    } else if (f.state === 'home') {
      const [sx, sy] = slotPos(f.slot), dx = sx - f.x, dy = sy - f.y, d = Math.hypot(dx, dy), sp = 150 * dt;
      if (d < sp + 0.5) { f.x = sx; f.y = sy; f.state = 'formation'; }
      else { f.x += dx / d * sp; f.y += dy / d * sp; f.ang = Math.atan2(dy, dx) + Math.PI / 2; }
    } else if (f.state === 'formation') {
      const [sx, sy] = slotPos(f.slot); f.x = sx; f.y = sy; f.ang = lerp(f.ang, Math.PI * 2, 0.15) % (Math.PI * 2); if (Math.abs(f.ang) < 0.05) f.ang = 0;
    } else if (f.state === 'beam') {
      f.beamT -= dt;
      if (P.alive && !P.captured && f.beamT < 2.6 && f.beamT > 0.4 && Math.abs(P.x - f.x) < 18 && !(P.inv > 0)) { P.captured = f; P.spin = 0; Kit.tone(300, 1.6, 0.1, 'sawtooth', 3); }
      if (f.beamT <= 0) { f.state = 'home'; S.beamFoe = null; }
    }
  }
  // captive follows its boss
  if (S.captive) { const b = S.captive.boss; S.captive.x = b.x; S.captive.y = b.y - 14; }
  // collisions: player shots vs foes (and the captive)
  for (let i = S.shots.length - 1; i >= 0; i--) {
    const s = S.shots[i];
    if (S.captive && Math.abs(s.x - S.captive.x) < 6 && Math.abs(s.y - S.captive.y) < 6) {
      S.shots.splice(i, 1); S.fx.burst(S.captive.x, S.captive.y, 24, ['#fff', '#f33', '#ff0'], 90); S.captive.boss.hasCaptive = false; S.captive = null;
      S.msg = 'FIGHTER LOST'; S.msgT = 1.6; Kit.noise(0.5, 0.3, 900); continue;
    }
    for (const f of S.foes) {
      if (f.dead || Math.abs(s.x - f.x) > 7 || Math.abs(s.y - f.y) > 6) continue;
      S.shots.splice(i, 1);
      if (--f.hp > 0) { Kit.tone(600, 0.08, 0.1, 'square', 1.5); break; }
      f.dead = true; S.hits++;
      const diving = f.state !== 'formation';
      let pts = SCORE[f.type][diving ? 1 : 0];
      if (f.type === 'boss' && diving && f.state !== 'beam') pts = 400 + (f.hasCaptive ? 400 : 0);
      if (!S.challenge) addScore(pts); else addScore(100);
      if (diving && pts >= 400) S.pops.push({ x: f.x, y: f.y, t: 1, s: pts });
      S.fx.burst(f.x, f.y, 18, f.type === 'bee' ? ['#ffd21f', '#3a7bff', '#fff'] : f.type === 'fly' ? ['#ff3030', '#fff', '#3a7bff'] : ['#2ee86b', '#b04bff', '#fff'], 100);
      Kit.noise(0.25, 0.22, 1600);
      if (f === S.beamFoe) S.beamFoe = null;
      if (f.hasCaptive && S.captive) {
        if (diving) { S.captive.rescue = true; S.rescue = { x: S.captive.x, y: S.captive.y }; S.msg = 'FIGHTER RESCUED'; S.msgT = 1.8; Kit.jingle([523, 659, 784, 1047, 1319], 0.09); }
        else { S.msg = 'FIGHTER LOST'; S.msgT = 1.6; }
        S.captive = null;
      }
      break;
    }
  }
  // rescued ship docks beside you
  if (S.rescue) {
    const R = S.rescue, tx = P.alive ? P.x + 16 : PF.w / 2, ty = P.alive ? P.y : PF.h - 26;
    R.x = lerp(R.x, tx, dt * 2.5); R.y = lerp(R.y, ty, dt * 2.5);
    if (Math.hypot(R.x - tx, R.y - ty) < 2) { S.rescue = null; if (P.alive) { S.dual = true; P.x = clamp(P.x + 8, 16, PF.w - 16); } else { S.lives++; } }
  }
  S.foes = S.foes.filter(f => !f.dead);
  // foes / bombs vs player
  if (P.alive && !P.captured && !(P.inv > 0)) {
    const hitAt = (x, y, r) => {
      if (S.dual) { if (Math.abs(x - (P.x - 8)) < r && Math.abs(y - P.y) < r) return -1; if (Math.abs(x - (P.x + 8)) < r && Math.abs(y - P.y) < r) return 1; return 0; }
      return Math.abs(x - P.x) < r && Math.abs(y - P.y) < r ? 2 : 0;
    };
    for (let i = S.bombs.length - 1; i >= 0; i--) { const h = hitAt(S.bombs[i].x, S.bombs[i].y, 5); if (h) { S.bombs.splice(i, 1); playerHit(h); break; } }
    for (const f of S.foes) { if (f.state === 'formation') continue; const h = hitAt(f.x, f.y, 9); if (h) { f.dead = true; S.fx.burst(f.x, f.y, 14, ['#fff', '#fa0'], 90); playerHit(h); break; } }
    S.foes = S.foes.filter(f => !f.dead);
  }
  // dives
  if (!S.challenge && S.waves.every(w => w.spawned) && P.alive && !P.captured) {
    if ((S.diveT -= dt) <= 0) { pickDiver(); S.diveT = Math.max(0.7, 2.6 - S.stage * 0.15) * rand(0.6, 1.3); }
  }
  // stage clear
  if (S.waves.length && S.waves.every(w => w.spawned) && S.foes.length === 0 && !S.rescue) {
    if (S.challenge) {
      const bonus = S.hits === 40 ? 10000 : S.hits * 100; addScore(bonus);
      S.msg = S.hits === 40 ? 'PERFECT!  10000' : 'HITS ' + S.hits + '   BONUS ' + bonus; S.msgT = 2.5;
    }
    if (S.captive) { S.captive = null; }
    S.stage++; S.nextT = S.challenge ? 3 : 1.2; S.challenge = false; S.waves = [];
  }
  if (S.nextT > 0 && (S.nextT -= dt) <= 0) startStage();
}
function playerHit(which) {
  const P = S.player;
  if (S.dual && which !== 2) {
    S.fx.burst(P.x + which * 8, P.y, 30, ['#fff', '#f33', '#ff0', '#3af'], 110);
    S.dual = false; P.x += -which * 8; Kit.noise(0.6, 0.35, 700); return;
  }
  P.alive = false; S.dual = false; S.fx.burst(P.x, P.y, 50, ['#fff', '#f33', '#ff0', '#3af'], 140, 1);
  Kit.noise(1.0, 0.45, 600); Kit.tone(200, 0.8, 0.12, 'sawtooth', 0.3);
  S.lives--; S.deadT = 2.2; S.bombs = [];
  for (const f of S.foes) if (f.state === 'dive' || f.state === 'beamdive' || f.state === 'beam') { f.state = 'home'; }
  S.beamFoe = null;
}
function gameOver() {
  S.mode = 'over'; S.overT = 5; S.newHi = Kit.setHi('star-rampart', S.score); S.hi = Kit.hi('star-rampart');
  Kit.jingle([392, 330, 262, 196], 0.22, 'triangle', 0.14);
}

/* ---------- draw ---------- */
function drawSprite(img, x, y, ang = 0, alpha = 1) {
  const g = Kit.ctx; g.save(); g.translate(Math.round(x), Math.round(y)); if (ang) g.rotate(ang); g.globalAlpha = alpha;
  g.drawImage(img, -img.width / 2, -img.height / 2); g.restore();
}
function render() {
  const g = Kit.begin('#04030c');
  g.imageSmoothingEnabled = false;
  // side panels
  const grd = g.createLinearGradient(0, 0, 0, 360); grd.addColorStop(0, '#120a2a'); grd.addColorStop(1, '#05030f');
  g.fillStyle = grd; g.fillRect(0, 0, PF.x, 360); g.fillRect(PF.x + PF.w, 0, PF.x, 360);
  g.fillStyle = '#2fe6ff'; g.fillRect(PF.x - 2, 0, 2, 360); g.fillRect(PF.x + PF.w, 0, 2, 360);
  g.save(); g.translate(PF.x, 0); g.beginPath(); g.rect(0, 0, PF.w, PF.h); g.clip();
  // stars
  for (const s of S.stars) { g.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(Kit.t * 2 + s.ph)); g.fillStyle = s.c; g.fillRect(s.x | 0, s.y | 0, s.z > 1 ? 2 : 1, s.z > 1 ? 2 : 1); }
  g.globalAlpha = 1;
  if (S.mode === 'title') drawTitle(g);
  else {
    // tractor beams
    for (const f of S.foes) if (f.state === 'beam') {
      const k = clamp(Math.min(3.2 - f.beamT, f.beamT) / 0.4, 0, 1), y0 = f.y + 6, y1 = Math.min(PF.h, y0 + 150 * k);
      for (let i = 0; i < 6; i++) {
        const yy = y0 + (y1 - y0) * (i / 6), w = 6 + 26 * (i / 6) * k;
        g.fillStyle = `hsla(${(Kit.t * 360 + i * 40) % 360},100%,65%,0.35)`; g.fillRect(f.x - w, yy, w * 2, (y1 - y0) / 6 - 1);
      }
    }
    for (const f of S.foes) drawSprite(foeSprite(f), f.x, f.y, f.ang);
    if (S.captive) drawSprite(SPR.captive, S.captive.x, S.captive.y, Math.PI);
    if (S.rescue) drawSprite(SPR.ship, S.rescue.x, S.rescue.y, Kit.t * 8);
    const P = S.player;
    if (P && P.alive && S.mode === 'play') {
      const vis = !(P.inv > 0) || Math.floor(Kit.t * 12) % 2;
      if (vis) {
        if (P.captured) drawSprite(SPR.captive, P.x, P.y, P.spin);
        else if (S.dual) { drawSprite(SPR.ship, P.x - 8, P.y); drawSprite(SPR.ship, P.x + 8, P.y); }
        else drawSprite(SPR.ship, P.x, P.y);
      }
    }
    g.fillStyle = '#fff'; for (const s of S.shots) { g.fillRect(s.x - 0.5, s.y - 4, 1, 7); g.fillStyle = '#f33'; g.fillRect(s.x - 0.5, s.y - 4, 1, 2); g.fillStyle = '#fff'; }
    for (const b of S.bombs) { g.fillStyle = '#ff3'; g.fillRect(b.x - 1, b.y - 3, 2, 6); g.fillStyle = '#f33'; g.fillRect(b.x - 1, b.y + 1, 2, 2); }
    S.fx.draw(g);
    for (const p of S.pops) Kit.mono(String(p.s), p.x, p.y - (1 - p.t) * 10, 8, '#2fe6ff', 'center');
    if (S.msgT > 0 && S.mode === 'play') Kit.text(S.msg, PF.w / 2, 190, S.msg.length > 14 ? 13 : 18, S.msg.startsWith('FIGHTER') ? '#ff3030' : '#2fe6ff', 'center', { glow: '#2fe6ff', blur: 8 });
    if (S.paused) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, 0, PF.w, PF.h); Kit.text('PAUSED', PF.w / 2, 170, 26, '#ffd21f'); Kit.mono('START or ESC to resume', PF.w / 2, 200, 9, '#ccc', 'center'); }
    if (S.mode === 'over') { Kit.text('GAME OVER', PF.w / 2, 160, 26, '#ff3030'); if (S.newHi) Kit.text('NEW HIGH SCORE!', PF.w / 2, 192, 14, '#ffd21f'); }
  }
  g.restore();
  // HUD
  Kit.text('1UP', 60, 30, 14, Kit.blink() || S.mode !== 'play' ? '#ff3030' : '#600', 'center', { stroke: false });
  Kit.mono(String(S.score).padStart(6, '0'), 60, 48, 15, '#fff', 'center');
  Kit.text('HIGH', 60, 86, 12, '#ff3030', 'center', { stroke: false });
  Kit.mono(String(Math.max(S.hi, S.score)).padStart(6, '0'), 60, 102, 15, '#fff', 'center');
  Kit.text('STAR', 60, 300, 15, '#2fe6ff', 'center', { glow: '#2fe6ff', blur: 8 }); Kit.text('RAMPART', 60, 318, 15, '#ff3bd4', 'center', { glow: '#ff3bd4', blur: 8 });
  if (S.mode !== 'title') {
    Kit.text('SHIPS', 420, 30, 12, '#2fe6ff', 'center', { stroke: false });
    for (let i = 0; i < Math.min(S.lives - (S.player && S.player.alive ? 1 : 0), 6); i++) drawSprite(SPR.ship, 396 + (i % 3) * 18, 52 + Math.floor(i / 3) * 18);
    Kit.text('STAGE', 420, 110, 12, '#2fe6ff', 'center', { stroke: false });
    Kit.mono(String(S.stage), 420, 128, 16, '#fff', 'center');
    for (let i = 0; i < Math.min(S.stage, 10); i++) { g.fillStyle = i % 5 === 4 ? '#ff3030' : '#ffd21f'; g.beginPath(); g.moveTo(396 + i * 5, 160); g.lineTo(400 + i * 5, 150); g.lineTo(404 + i * 5, 160); g.fill(); }
  }
  Kit.mono('← → MOVE', 420, 300, 9, '#8a85a8', 'center'); Kit.mono('FIRE  J / SPACE', 420, 314, 9, '#8a85a8', 'center'); Kit.mono('ESC  PAUSE', 420, 328, 9, '#8a85a8', 'center');
  Kit.end();
}
function drawTitle(g) {
  Kit.text('STAR', PF.w / 2, 52, 40, '#2fe6ff', 'center', { glow: '#2fe6ff' });
  Kit.text('RAMPART', PF.w / 2, 90, 34, '#ff3bd4', 'center', { glow: '#ff3bd4' });
  const rows = [['boss0', 'BOSS', '150 / 400'], ['fly0', 'STINGER', '80 / 160'], ['bee0', 'DRONE', '50 / 100']];
  rows.forEach(([s, n, p], i) => { drawSprite(SPR[s], 52, 140 + i * 26); Kit.mono(n, 70, 140 + i * 26, 10, '#fff'); Kit.mono(p, 200, 140 + i * 26, 10, '#ffd21f', 'right'); });
  Kit.mono('IN FORMATION / DIVING', PF.w / 2, 214, 8, '#8a85a8', 'center');
  Kit.mono('Beware the boss tractor beam.', PF.w / 2, 238, 8, '#ccc', 'center');
  Kit.mono('Shoot the boss while it dives to', PF.w / 2, 250, 8, '#ccc', 'center');
  Kit.mono('win your fighter back: DOUBLE SHIP', PF.w / 2, 262, 8, '#ccc', 'center');
  if (Kit.blink()) Kit.text('PRESS START', PF.w / 2, 300, 18, '#ffd21f');
  Kit.mono('ENTER · FIRE · START BUTTON', PF.w / 2, 322, 8, '#8a85a8', 'center');
}

/* ---------- boot ---------- */
makeSprites(); initStars(); S.hi = Kit.hi('star-rampart');
Kit.init({
  W: 480, H: 360, update: dt => {
    if (S.mode === 'title' && (Kit.hit('a') || Kit.hit('b'))) newGame();
    update(dt);
  }, render,
  touchLabels: { a: 'FIRE', b: 'FIRE' },
  onStart() { if (S.mode === 'title') newGame(); else if (S.mode === 'play') S.paused = !S.paused; },
  onPause() { if (S.mode === 'play') S.paused = !S.paused; },
  onTitle() { return S.mode === 'title'; },
});
