/* =====================================================================
   BRICK BLITZ — breakout with power-ups, hazards and bosses
   ===================================================================== */
const F = { x0: 30, x1: 450, y0: 34, y1: 360 };       // playfield walls
const BW = 30, BH = 13, COLS = 13, BX0 = F.x0 + (F.x1 - F.x0 - COLS * BW) / 2, BY0 = 58;
const BRICK = {
  r: { c: '#ff3b3b', pts: 90 }, o: { c: '#ff8a1f', pts: 80 }, y: { c: '#ffd21f', pts: 70 }, g: { c: '#2ee86b', pts: 60 },
  c: { c: '#2fe6ff', pts: 60 }, b: { c: '#3a7bff', pts: 70 }, p: { c: '#b04bff', pts: 80 }, w: { c: '#f4f4f4', pts: 50 },
  s: { c: '#b8bec8', pts: 50, hard: 2 }, x: { c: '#e8b43a', gold: true }, e: { c: '#ff2d6f', pts: 100, boom: true },
};
// '>' at the start of a row makes that row slide side to side
const LEVELS = [
  ['.............', 'rrrrrrrrrrrrr', 'ooooooooooooo', 'yyyyyyyyyyyyy', 'ggggggggggggg', 'ccccccccccccc', 'bbbbbbbbbbbbb'],
  ['......w......', '.....wpw.....', '....wpppw....', '...wpppppw...', '..wpppepppw..', '...wpppppw...', '....wpppw....', '.....wpw.....', '......w......'],
  ['sssssssssssss', 'r.r.r.r.r.r.r', '.o.o.o.o.o.o.', 'y.y.y.y.y.y.y', '.g.g.g.g.g.g.', 'c.c.c.c.c.c.c', 'xx.xx.xx.xx.x'],
  ['>ccccc...ccccc', '.............', '>bbbbbbbbbbbbb', '.............', '>ppppp...ppppp', '.............', 'ggggggegggggg'],
  ['x...........x', 'xrrrrrrrrrrrx', 'xoooooeooooox', 'xyyyyyyyyyyyx', 'xgggggggggggx', 'x...........x', 'xxxxx...xxxxx'],
  'BOSS',
  ['e.e.e.e.e.e.e', 'rrrrrrrrrrrrr', 'sssssssssssss', 'yyyyyyyyyyyyy', 'sssssssssssss', 'bbbbbbbbbbbbb', 'ppppppppppppp'],
  ['..rr.....rr..', '.rrrr...rrrr.', 'rrrrrr.rrrrrr', 'rrrrrrrrrrrrr', '.rrrrrrrrrrr.', '..rrrrrrrrr..', '...rrrrrrr...', '....rrerr....', '.....rrr.....', '......r......'],
  ['>sssssssssssss', 'c.c.c.c.c.c.c', '>ggggggggggggg', 'y.y.y.y.y.y.y', '>ooooooooooooo', 'xx..xx.xx..xx'],
  ['w.w.w.w.w.w.w', '.b.b.b.b.b.b.', 'p.p.p.e.p.p.p', '.b.b.b.b.b.b.', 'w.w.w.w.w.w.w', 'xxx.......xxx', 'sssssssssssss'],
  ['ggggggggggggg', 'g...........g', 'g.yyyyyyyyy.g', 'g.y.......y.g', 'g.y.reeer.y.g', 'g.y.......y.g', 'g.yyyyyyyyy.g', 'g...........g', 'ggggggggggggg'],
  'BOSS',
];
const POWERS = {
  L: { c: '#ff3b3b', name: 'LASER' }, E: { c: '#3a7bff', name: 'EXPAND' }, C: { c: '#2ee86b', name: 'CATCH' },
  S: { c: '#ff8a1f', name: 'SLOW' }, M: { c: '#2fe6ff', name: 'MULTI-BALL' }, P: { c: '#9a9aa8', name: '1UP' },
};
const S = {
  mode: 'title', level: 0, loop: 0, score: 0, lives: 3, hi: 0, paused: false,
  paddle: null, balls: [], bricks: [], caps: [], lasers: [], bolts: [], boss: null, fx: new Particles(), shake: 0, msg: '', msgT: 0,
  power: null, powerT: 0, pointerX: null,
};

function newGame() { Object.assign(S, { mode: 'play', level: 0, loop: 0, score: 0, lives: 3, paused: false }); loadLevel(); Kit.jingle([392, 523, 659, 784], 0.1); }
function loadLevel() {
  S.bricks = []; S.caps = []; S.lasers = []; S.bolts = []; S.boss = null; S.fx.clear(); S.power = null;
  const L = LEVELS[S.level % LEVELS.length];
  if (L === 'BOSS') {
    S.boss = { x: 240, y: 110, w: 132, h: 54, hp: 14 + S.loop * 6, max: 14 + S.loop * 6, vx: 70 + S.loop * 20, fireT: 2, hitT: 0 };
    // a shield row of breakable bricks under the boss
    for (let c = 0; c < COLS; c++) if (c % 3 !== 1) addBrick(c, 9, 's', 0);
  } else L.forEach((row, r) => {
    const moving = row[0] === '>'; const cells = moving ? row.slice(1) : row;
    [...cells].forEach((ch, c) => { if (BRICK[ch]) addBrick(c, r, ch, moving ? (r % 2 ? 1 : -1) : 0); });
  });
  S.paddle = { x: 240, y: 336, w: 58, tw: 58, vx: 0 };
  S.balls = [newBall(true)];
  S.msg = S.boss ? 'BOSS: BLITZ CORE' : 'ROUND ' + (S.level + 1 + S.loop * LEVELS.length); S.msgT = 2;
}
function addBrick(c, r, ch, move) {
  const d = BRICK[ch], hard = d.hard ? d.hard + Math.floor((S.level + S.loop * LEVELS.length) / 4) : 1;
  S.bricks.push({ x: BX0 + c * BW, y: BY0 + r * BH, w: BW - 2, h: BH - 2, ch, hp: d.gold ? Infinity : hard, max: hard, move, ox: 0, flash: 0 });
}
function baseSpeed() { return 230 + S.loop * 30 + Math.min(S.level, 10) * 6; }
function newBall(stuck) { return { x: S.paddle ? S.paddle.x : 240, y: 326, vx: 0, vy: 0, r: 4, stuck: !!stuck, stuckDx: 0, stuckT: 3, sp: baseSpeed(), trail: [] }; }
function launch(b) {
  const a = -Math.PI / 2 + clamp(b.stuckDx / (S.paddle.w / 2), -1, 1) * 0.6 + rand(-0.1, 0.1);
  b.vx = Math.cos(a) * b.sp; b.vy = Math.sin(a) * b.sp; b.stuck = false; Kit.tone(520, 0.08, 0.1, 'square', 1.4);
}
function addScore(n) { const before = S.score; S.score += n; if (Math.floor(before / 50000) < Math.floor(S.score / 50000)) { S.lives++; Kit.jingle([784, 988, 1175, 1568], 0.07); } }

function hitBrick(br, ball) {
  if (br.hp === Infinity) { br.flash = 0.2; Kit.tone(1500, 0.05, 0.06, 'triangle'); return; }
  br.hp--; br.flash = 0.15;
  if (br.hp > 0) { Kit.tone(900, 0.06, 0.08, 'square'); return; }
  breakBrick(br);
}
function breakBrick(br) {
  if (br.dead) return;
  br.dead = true;
  const d = BRICK[br.ch];
  addScore(d.ch === 's' ? 50 * (S.level + 1) : d.pts || 50);
  S.fx.burst(br.x + br.w / 2 + br.ox, br.y + br.h / 2, 14, [d.c, '#fff'], 110, 0.6, 2.5, 200);
  Kit.tone(300 + Math.random() * 600, 0.07, 0.1, 'square', 1.8);
  if (d.boom) {
    S.shake = 0.35; Kit.noise(0.4, 0.4, 900);
    S.fx.burst(br.x + br.w / 2, br.y + br.h / 2, 40, ['#ff2d6f', '#ffd21f', '#fff'], 200, 0.7, 3);
    for (const o of S.bricks) if (!o.dead && o.hp !== Infinity && Math.abs(o.x - br.x) <= BW + 1 && Math.abs(o.y - br.y) <= BH + 1) setTimeout(() => breakBrick(o), 60);
  }
  if (!S.boss && Math.random() < 0.16 && S.caps.length < 3) {
    const keys = Object.keys(POWERS).filter(k => k !== 'P' || Math.random() < 0.3);
    S.caps.push({ x: br.x + br.w / 2 + br.ox, y: br.y + br.h / 2, k: pick(keys) });
  }
}
function applyPower(k) {
  const P = S.paddle;
  Kit.jingle([660, 880, 1100], 0.05, 'square', 0.1);
  S.msg = POWERS[k].name; S.msgT = 1.2;
  if (k === 'P') { S.lives++; return; }
  if (k === 'M') { const src = S.balls.find(b => !b.stuck) || S.balls[0]; for (const a of [-0.5, 0.5]) { const n = newBall(false); Object.assign(n, { x: src.x, y: src.y, sp: src.sp }); const ang = Math.atan2(src.vy || -1, src.vx) + a; n.vx = Math.cos(ang) * n.sp; n.vy = Math.sin(ang) * n.sp; if (n.vy > -60) n.vy = -Math.abs(n.vy) - 60; S.balls.push(n); } return; }
  if (k === 'S') { for (const b of S.balls) { b.sp = Math.max(170, b.sp * 0.7); const m = Math.hypot(b.vx, b.vy) || 1; b.vx *= b.sp / m; b.vy *= b.sp / m; } return; }
  S.power = k; P.tw = k === 'E' ? 88 : 58;
}

function update(dt) {
  S.fx.update(dt); if (S.shake > 0) S.shake -= dt;
  if (S.mode !== 'play' || S.paused) { if (S.mode === 'over' && (S.overT -= dt) <= 0) S.mode = 'title'; return; }
  if (S.msgT > 0) S.msgT -= dt;
  const P = S.paddle;
  // paddle: keys/stick, or follow the pointer
  P.w = lerp(P.w, P.tw, dt * 8);
  const ax = Kit.axisX();
  if (ax) { P.vx = lerp(P.vx, ax * 400, dt * 14); S.pointerX = null; } else P.vx = lerp(P.vx, 0, dt * 18);
  P.x += P.vx * dt;
  if (S.pointerX != null) P.x = lerp(P.x, S.pointerX, dt * 20);
  P.x = clamp(P.x, F.x0 + P.w / 2, F.x1 - P.w / 2);
  const fire = Kit.hit('a') || Kit.hit('b') || Kit.hit('c') || Kit.hit('d') || Kit.hit('up') || S.tap; S.tap = false;
  // moving brick rows
  for (const br of S.bricks) if (br.move && !br.dead) br.ox = Math.sin(Kit.t * 0.9) * 26 * br.move;
  for (const br of S.bricks) if (br.flash > 0) br.flash -= dt;
  // balls
  for (const b of S.balls) {
    if (b.stuck) {
      b.x = P.x + b.stuckDx; b.y = P.y - 10 - b.r + 4; b.stuckT -= dt;
      if (fire || b.stuckT <= 0) launch(b);
      continue;
    }
    const steps = Math.ceil(Math.hypot(b.vx, b.vy) * dt / 3);
    for (let s = 0; s < steps; s++) moveBall(b, dt / steps);
    b.trail.push([b.x, b.y]); if (b.trail.length > 8) b.trail.shift();
  }
  // lasers
  if (S.power === 'L' && fire && S.lasers.length < 4 && !S.balls.some(b => b.stuck)) { S.lasers.push({ x: P.x - P.w / 2 + 6, y: P.y - 6 }, { x: P.x + P.w / 2 - 6, y: P.y - 6 }); Kit.tone(1600, 0.06, 0.08, 'sawtooth', 0.5); }
  for (const l of S.lasers) {
    l.y -= 480 * dt;
    for (const br of S.bricks) if (!br.dead && l.x > br.x + br.ox && l.x < br.x + br.ox + br.w && l.y > br.y && l.y < br.y + br.h) { hitBrick(br); l.dead = true; break; }
    if (S.boss && !l.dead && Math.abs(l.x - S.boss.x) < S.boss.w / 2 && Math.abs(l.y - S.boss.y) < S.boss.h / 2) { bossHit(); l.dead = true; }
    if (l.y < F.y0) l.dead = true;
  }
  S.lasers = S.lasers.filter(l => !l.dead);
  S.bricks = S.bricks.filter(b => !b.dead);
  // capsules
  for (const c of S.caps) {
    c.y += 90 * dt;
    if (c.y > P.y - 8 && c.y < P.y + 8 && Math.abs(c.x - P.x) < P.w / 2 + 8) { c.dead = true; applyPower(c.k); addScore(250); }
    if (c.y > F.y1 + 10) c.dead = true;
  }
  S.caps = S.caps.filter(c => !c.dead);
  // boss
  if (S.boss) {
    const B = S.boss; B.x += B.vx * dt; if (B.x < F.x0 + B.w / 2 || B.x > F.x1 - B.w / 2) { B.vx *= -1; B.x = clamp(B.x, F.x0 + B.w / 2, F.x1 - B.w / 2); }
    B.y = 110 + Math.sin(Kit.t * 0.8) * 12; B.hitT -= dt;
    if ((B.fireT -= dt) <= 0) { B.fireT = Math.max(0.6, 1.8 - S.loop * 0.3) * rand(0.7, 1.2); const dx = P.x - B.x; S.bolts.push({ x: B.x, y: B.y + B.h / 2, vx: clamp(dx, -80, 80), vy: 150 }); Kit.tone(200, 0.2, 0.08, 'sawtooth', 0.5); }
  }
  for (const bo of S.bolts) {
    bo.x += bo.vx * dt; bo.y += bo.vy * dt;
    if (bo.y > P.y - 6 && bo.y < P.y + 6 && Math.abs(bo.x - P.x) < P.w / 2) { bo.dead = true; loseLife(); }
    if (bo.y > F.y1) bo.dead = true;
  }
  S.bolts = S.bolts.filter(b => !b.dead);
  // lost balls
  S.balls = S.balls.filter(b => b.y < F.y1 + 10);
  if (!S.balls.length) loseLife();
  // cleared?
  if ((S.boss ? S.boss.hp <= 0 : !S.bricks.some(b => b.hp !== Infinity)) && !S.clearT) {
    S.clearT = 1.6; S.msg = S.boss ? 'BOSS DESTROYED!' : 'ROUND CLEAR'; S.msgT = 1.6; addScore(S.boss ? 5000 : 1000);
    Kit.jingle([523, 659, 784, 1047, 1319], 0.08);
  }
  if (S.clearT && (S.clearT -= dt) <= 0) { S.clearT = 0; S.level++; if (S.level >= LEVELS.length) { S.level = 0; S.loop++; } loadLevel(); }
}
function moveBall(b, dt) {
  const P = S.paddle;
  b.x += b.vx * dt; b.y += b.vy * dt;
  if (b.x < F.x0 + b.r) { b.x = F.x0 + b.r; b.vx = Math.abs(b.vx); Kit.tone(440, 0.03, 0.05, 'square'); }
  if (b.x > F.x1 - b.r) { b.x = F.x1 - b.r; b.vx = -Math.abs(b.vx); Kit.tone(440, 0.03, 0.05, 'square'); }
  if (b.y < F.y0 + b.r) { b.y = F.y0 + b.r; b.vy = Math.abs(b.vy); Kit.tone(440, 0.03, 0.05, 'square'); }
  // paddle
  if (b.vy > 0 && b.y + b.r >= P.y - 5 && b.y - b.r <= P.y + 5 && Math.abs(b.x - P.x) <= P.w / 2 + b.r) {
    const off = clamp((b.x - P.x) / (P.w / 2), -1, 1), a = -Math.PI / 2 + off * 1.05;
    b.sp = Math.min(b.sp * 1.012, baseSpeed() + 140);
    b.vx = Math.cos(a) * b.sp + P.vx * 0.15; b.vy = Math.sin(a) * b.sp; const m = Math.hypot(b.vx, b.vy); b.vx *= b.sp / m; b.vy *= b.sp / m;
    b.y = P.y - 5 - b.r;
    if (S.power === 'C') { b.stuck = true; b.stuckDx = b.x - P.x; b.stuckT = 2; }
    Kit.tone(330, 0.05, 0.1, 'square', 1.2);
  }
  // bricks
  for (const br of S.bricks) {
    if (br.dead) continue;
    const bx = br.x + br.ox, cx = clamp(b.x, bx, bx + br.w), cy = clamp(b.y, br.y, br.y + br.h), dx = b.x - cx, dy = b.y - cy;
    if (dx * dx + dy * dy > b.r * b.r) continue;
    const pl = b.x + b.r - bx, pr = bx + br.w - (b.x - b.r), pt = b.y + b.r - br.y, pb = br.y + br.h - (b.y - b.r);
    const m = Math.min(pl, pr, pt, pb);
    if (m === pl) { b.vx = -Math.abs(b.vx); b.x = bx - b.r; } else if (m === pr) { b.vx = Math.abs(b.vx); b.x = bx + br.w + b.r; }
    else if (m === pt) { b.vy = -Math.abs(b.vy); b.y = br.y - b.r; } else { b.vy = Math.abs(b.vy); b.y = br.y + br.h + b.r; }
    hitBrick(br, b);
    break;
  }
  // boss
  const B = S.boss;
  if (B && Math.abs(b.x - B.x) < B.w / 2 + b.r && Math.abs(b.y - B.y) < B.h / 2 + b.r) {
    const ox = (B.w / 2 + b.r) - Math.abs(b.x - B.x), oy = (B.h / 2 + b.r) - Math.abs(b.y - B.y);
    if (ox < oy) { b.vx = Math.sign(b.x - B.x) * Math.abs(b.vx); b.x += Math.sign(b.x - B.x) * ox; } else { b.vy = Math.sign(b.y - B.y) * Math.abs(b.vy); b.y += Math.sign(b.y - B.y) * oy; }
    bossHit();
  }
  // never let the ball go nearly horizontal
  if (Math.abs(b.vy) < b.sp * 0.25) { b.vy = Math.sign(b.vy || -1) * b.sp * 0.25; const m = Math.hypot(b.vx, b.vy); b.vx *= b.sp / m; b.vy *= b.sp / m; }
}
function bossHit() {
  const B = S.boss; if (B.hitT > 0) return; B.hitT = 0.12; B.hp--; addScore(200); S.shake = 0.15;
  S.fx.burst(B.x + rand(-30, 30), B.y + rand(-10, 10), 16, ['#ff2d6f', '#ffd21f', '#fff'], 140);
  Kit.noise(0.18, 0.3, 1400);
  if (B.hp <= 0) { S.fx.burst(B.x, B.y, 120, ['#ff2d6f', '#ffd21f', '#fff', '#2fe6ff'], 260, 1.2, 3); S.shake = 0.8; Kit.noise(1.2, 0.5, 600); S.bolts = []; }
}
function loseLife() {
  if (S.clearT) return;
  S.lives--; S.fx.burst(S.paddle.x, S.paddle.y, 40, ['#2fe6ff', '#fff', '#ff3b3b'], 160, 0.9, 3); Kit.noise(0.6, 0.4, 500); Kit.tone(300, 0.6, 0.12, 'sawtooth', 0.3);
  S.power = null; S.paddle.tw = 58; S.caps = []; S.bolts = []; S.lasers = [];
  if (S.lives <= 0) { S.mode = 'over'; S.overT = 5; S.newHi = Kit.setHi('brick-blitz', S.score); S.hi = Kit.hi('brick-blitz'); Kit.jingle([392, 330, 262, 196], 0.22, 'triangle'); return; }
  S.balls = [newBall(true)]; S.msg = 'READY'; S.msgT = 1;
}

/* ---------- draw ---------- */
function drawBrick(g, br) {
  const d = BRICK[br.ch], x = br.x + br.ox, y = br.y;
  let col = d.c;
  if (d.hard && br.hp < br.max) col = '#8d939c';
  const gr = g.createLinearGradient(0, y, 0, y + br.h);
  gr.addColorStop(0, '#fff'); gr.addColorStop(0.18, col); gr.addColorStop(0.75, col); gr.addColorStop(1, 'rgba(0,0,0,.6)');
  g.fillStyle = gr; g.fillRect(x, y, br.w, br.h);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + br.w - 2, y + 2, 2, br.h - 2);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y, 2, br.h - 1);
  if (d.gold || d.hard) { // metallic sweep
    const p = ((Kit.t * 0.6 + x / 400) % 1.4) - 0.2;
    g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(x + p * br.w, y + 1, 3, br.h - 2);
  }
  if (d.boom) { g.fillStyle = Kit.blink(2) ? '#fff' : '#1a0b02'; g.beginPath(); g.arc(x + br.w / 2, y + br.h / 2, 2.5, 0, TAU); g.fill(); }
  if (br.flash > 0) { g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x, y, br.w, br.h); }
}
function render() {
  const g = Kit.begin('#08061a');
  if (S.shake > 0) g.translate(rand(-3, 3) * S.shake * 3, rand(-3, 3) * S.shake * 3);
  // backdrop: neon grid
  g.strokeStyle = 'rgba(255,59,212,.12)'; g.lineWidth = 1;
  for (let x = F.x0; x <= F.x1; x += 30) { g.beginPath(); g.moveTo(x, F.y0); g.lineTo(x, F.y1); g.stroke(); }
  for (let y = F.y0 + ((Kit.t * 12) % 30); y <= F.y1; y += 30) { g.beginPath(); g.moveTo(F.x0, y); g.lineTo(F.x1, y); g.stroke(); }
  // walls
  const wg = g.createLinearGradient(0, 0, F.x0, 0); wg.addColorStop(0, '#2a2a3a'); wg.addColorStop(1, '#8a8aa8');
  g.fillStyle = wg; g.fillRect(F.x0 - 10, F.y0 - 10, 10, F.y1); g.save(); g.scale(-1, 1); g.fillRect(-F.x1 - 10, F.y0 - 10, 10, F.y1); g.restore();
  g.fillStyle = '#6a6a88'; g.fillRect(F.x0 - 10, F.y0 - 10, F.x1 - F.x0 + 20, 10);
  if (S.mode === 'title') { drawTitle(g); Kit.end(); return; }
  for (const br of S.bricks) drawBrick(g, br);
  if (S.boss) drawBoss(g, S.boss);
  for (const c of S.caps) {
    const p = POWERS[c.k]; g.fillStyle = p.c; g.beginPath(); g.roundRect(c.x - 12, c.y - 5, 24, 10, 5); g.fill();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(c.x - 9, c.y - 4, 18, 2);
    Kit.text(c.k, c.x, c.y + 0.5, 8, '#fff', 'center', { stroke: '#000', italic: false });
  }
  g.fillStyle = '#ff3b3b'; for (const l of S.lasers) g.fillRect(l.x - 1, l.y - 6, 2, 8);
  for (const bo of S.bolts) { g.fillStyle = '#ff2d6f'; g.beginPath(); g.arc(bo.x, bo.y, 4, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(bo.x, bo.y, 1.6, 0, TAU); g.fill(); }
  // paddle
  const P = S.paddle;
  if (P && S.mode === 'play') {
    const pg = g.createLinearGradient(0, P.y - 5, 0, P.y + 5);
    pg.addColorStop(0, '#fff'); pg.addColorStop(0.3, S.power === 'L' ? '#ff6a6a' : S.power === 'C' ? '#6aff9a' : '#8ad8ff'); pg.addColorStop(1, '#1a3a6a');
    g.fillStyle = pg; g.beginPath(); g.roundRect(P.x - P.w / 2, P.y - 5, P.w, 10, 5); g.fill();
    g.fillStyle = '#ff3b3b'; g.fillRect(P.x - P.w / 2 + 2, P.y - 3, 6, 6); g.fillRect(P.x + P.w / 2 - 8, P.y - 3, 6, 6);
    if (S.power === 'L') { g.fillStyle = '#ddd'; g.fillRect(P.x - P.w / 2 + 4, P.y - 9, 4, 5); g.fillRect(P.x + P.w / 2 - 8, P.y - 9, 4, 5); }
  }
  for (const b of S.balls) {
    b.trail.forEach(([x, y], i) => { g.globalAlpha = i / b.trail.length * 0.35; g.fillStyle = '#2fe6ff'; g.beginPath(); g.arc(x, y, b.r * (i / b.trail.length), 0, TAU); g.fill(); });
    g.globalAlpha = 1; const bg = g.createRadialGradient(b.x - 1.5, b.y - 1.5, 0.5, b.x, b.y, b.r);
    bg.addColorStop(0, '#fff'); bg.addColorStop(1, '#9adfff'); g.fillStyle = bg; g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill();
  }
  S.fx.draw(g);
  // HUD
  g.fillStyle = '#000'; g.fillRect(0, 0, 480, 22);
  Kit.mono('SCORE ' + String(S.score).padStart(7, '0'), 10, 11, 12, '#fff');
  Kit.mono('HI ' + String(Math.max(S.hi, S.score)).padStart(7, '0'), 240, 11, 12, '#ffd21f', 'center');
  for (let i = 0; i < Math.min(S.lives - 1, 6); i++) { g.fillStyle = '#8ad8ff'; g.beginPath(); g.roundRect(352 + i * 12, 7, 10, 6, 3); g.fill(); }
  Kit.mono('R' + (S.level + 1 + S.loop * LEVELS.length), 474, 11, 12, '#ff3bd4', 'right');
  if (S.msgT > 0) Kit.text(S.msg, 240, 250, 20, '#2fe6ff', 'center', { glow: '#2fe6ff', blur: 10 });
  if (S.balls.some(b => b.stuck) && S.mode === 'play' && Kit.blink()) Kit.mono('FIRE TO LAUNCH', 240, 300, 10, '#fff', 'center');
  if (S.paused) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, 0, 480, 360); Kit.text('PAUSED', 240, 170, 30, '#ffd21f'); }
  if (S.mode === 'over') { Kit.text('GAME OVER', 240, 170, 32, '#ff3b3b'); if (S.newHi) Kit.text('NEW HIGH SCORE!', 240, 205, 16, '#ffd21f'); }
  Kit.end();
}
function drawBoss(g, B) {
  const x = B.x - B.w / 2, y = B.y - B.h / 2, hit = B.hitT > 0;
  const gr = g.createLinearGradient(0, y, 0, y + B.h); gr.addColorStop(0, hit ? '#fff' : '#6a6a88'); gr.addColorStop(0.5, hit ? '#ffd' : '#2a2a3a'); gr.addColorStop(1, '#0a0a14');
  g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, B.w, B.h, 10); g.fill();
  g.strokeStyle = '#ff2d6f'; g.lineWidth = 2; g.stroke();
  const ex = clamp((S.paddle.x - B.x) / 20, -12, 12);
  g.fillStyle = '#1a0010'; g.beginPath(); g.ellipse(B.x, B.y, 26, 14, 0, 0, TAU); g.fill();
  const eg = g.createRadialGradient(B.x + ex, B.y + 2, 1, B.x + ex, B.y + 2, 12); eg.addColorStop(0, '#fff'); eg.addColorStop(0.3, '#ff2d6f'); eg.addColorStop(1, '#5a0020');
  g.fillStyle = eg; g.beginPath(); g.arc(B.x + ex, B.y + 2, 10, 0, TAU); g.fill();
  for (let i = 0; i < 6; i++) { g.fillStyle = i < 6 * B.hp / B.max ? '#2fe6ff' : '#222'; g.fillRect(x + 10 + i * 18, y + B.h - 8, 14, 4); }
}
function drawTitle(g) {
  Kit.text('BRICK', 240, 86, 54, '#ff8a1f', 'center', { glow: '#ff3b3b' });
  Kit.text('BLITZ', 240, 140, 54, '#2fe6ff', 'center', { glow: '#3a7bff' });
  const demo = ['r', 'o', 'y', 'g', 'c', 'b', 'p'];
  demo.forEach((ch, i) => drawBrick(g, { x: 135 + i * 30, y: 182, w: 28, h: 11, ch, ox: 0, hp: 1, max: 1, flash: 0 }));
  drawBrick(g, { x: 165, y: 197, w: 28, h: 11, ch: 's', ox: 0, hp: 2, max: 2 }); drawBrick(g, { x: 225, y: 197, w: 28, h: 11, ch: 'e', ox: 0, hp: 1, max: 1 }); drawBrick(g, { x: 285, y: 197, w: 28, h: 11, ch: 'x', ox: 0, hp: 1, max: 1 });
  Kit.mono('silver: tough   pink: explodes   gold: unbreakable', 240, 222, 8, '#bbb', 'center');
  let i = 0; for (const k in POWERS) { const p = POWERS[k], x = 78 + i * 66; g.fillStyle = p.c; g.beginPath(); g.roundRect(x - 12, 240, 24, 10, 5); g.fill(); Kit.text(k, x, 245.5, 8, '#fff', 'center', { stroke: '#000', italic: false }); Kit.mono(p.name, x, 260, 7, '#ccc', 'center'); i++; }
  if (Kit.blink()) Kit.text('PRESS START', 240, 300, 22, '#ffd21f');
  Kit.mono('HI ' + String(S.hi).padStart(7, '0') + '   ·   ← → move   ·   FIRE launch / laser', 240, 330, 9, '#8a85a8', 'center');
}

/* ---------- boot ---------- */
S.hi = Kit.hi('brick-blitz');
Kit.init({
  W: 480, H: 360, render, touchLabels: { a: 'FIRE' },
  update: dt => { if (S.mode === 'title' && Kit.hit('a')) newGame(); update(dt); },
  onStart() { if (S.mode === 'title') newGame(); else if (S.mode === 'play') S.paused = !S.paused; },
  onPause() { if (S.mode === 'play') S.paused = !S.paused; },
  onTitle() { return S.mode === 'title'; },
});
// mouse / touch drag steers the paddle directly; a tap launches
const ptr = e => { if (S.mode === 'play') S.pointerX = Kit.toLogical(e.clientX, e.clientY).x; };
Kit.canvas.addEventListener('pointermove', ptr);
Kit.canvas.addEventListener('pointerdown', e => { ptr(e); Kit.audioInit(); if (S.mode === 'title') newGame(); else S.tap = true; });
