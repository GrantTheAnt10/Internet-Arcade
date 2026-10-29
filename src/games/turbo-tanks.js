/* =====================================================================
   TURBO TANKS — top-down arena tank battle
   ===================================================================== */
const TS = 20, GW = 24, GH = 17, OY = 20;          // tile size, grid, HUD height
const MAPS = [
  ['########################',
   '#P.....................#',
   '#......................#',
   '#...bbbb........bbbb...#',
   '#...b..............b...#',
   '#...b....#....#....b...#',
   '#........#....#........#',
   '#....bb..........bb....#',
   '#....bb...wwww...bb....#',
   '#....bb..........bb....#',
   '#........#....#........#',
   '#...b....#....#....b...#',
   '#...b..............b...#',
   '#...bbbb........bbbb...#',
   '#......................#',
   '#E..........E.........E#',
   '########################'],
  ['########################',
   '#E.........##.........E#',
   '#..........##..........#',
   '#..bbb..........bbb....#',
   '#..b..b...bbbb..b..b...#',
   '#.....b..........b.....#',
   '#...www...#..#...www...#',
   '#...www...#..#...www...#',
   '#..........bb..........#',
   '#....b.....bb.....b....#',
   '#....b...#....#...b....#',
   '#....bbbb#....#bbbb....#',
   '#......................#',
   '#..###............###..#',
   '#......................#',
   '#P.........##.........E#',
   '########################'],
  ['########################',
   '#P..b......#.....b....E#',
   '#...b......#.....b.....#',
   '#...b..bbbb#bbbb.b.....#',
   '#...b............b.....#',
   '#...######..######.....#',
   '#......................#',
   '#.bbb....wwwwww....bbb.#',
   '#.b......wwwwww......b.#',
   '#.bbb....wwwwww....bbb.#',
   '#......................#',
   '#.....######..######...#',
   '#.....b............b...#',
   '#.....b.bbbb#bbbb..b...#',
   '#.....b.....#......b...#',
   '#E....b.....#.....Eb..E#',
   '########################'],
];
const TYPES = {
  grunt: { col: '#a8743a', speed: 46, hp: 1, fire: 2.2, shell: 190, bounce: 1, pts: 100 },
  fast: { col: '#3bb34a', speed: 92, hp: 1, fire: 1.8, shell: 210, bounce: 0, pts: 200 },
  rico: { col: '#9b4bff', speed: 52, hp: 1, fire: 1.6, shell: 240, bounce: 2, pts: 250 },
  heavy: { col: '#7a8290', speed: 34, hp: 3, fire: 2.6, shell: 170, bounce: 0, big: true, pts: 400 },
  miner: { col: '#e8c42a', speed: 60, hp: 1, fire: 3.0, shell: 190, bounce: 1, mines: true, pts: 300 },
};
const S = {
  mode: 'title', level: 0, score: 0, hi: 0, lives: 3, grid: [], bricks: {}, tanks: [], shells: [], mines: [], drops: [], marks: [],
  fx: new Particles(), smoke: new Particles(), msg: '', msgT: 0, paused: false, mouse: null, queue: [], spawnT: 0, shake: 0,
};

/* ---------- map ---------- */
function genMap(n) {
  // symmetric random arena, kept connected
  for (let tries = 0; tries < 40; tries++) {
    const g = []; for (let y = 0; y < GH; y++) g.push([...'#' + '.'.repeat(GW - 2) + '#']);
    for (let x = 0; x < GW; x++) { g[0][x] = '#'; g[GH - 1][x] = '#'; }
    const blocks = 7 + Math.min(n, 8);
    for (let i = 0; i < blocks; i++) {
      const w = randi(1, 4), h = randi(1, 3), x = randi(2, GW / 2 - w), y = randi(2, GH - 3 - h), t = pick(['b', 'b', 'b', '#', 'w']);
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { g[yy][xx] = t; g[GH - 1 - yy][GW - 1 - xx] = t; }
    }
    g[1][1] = 'P'; g[1][GW - 2] = 'E'; g[GH - 2][GW - 2] = 'E'; g[GH - 2][1] = 'E'; g[GH - 2][GW >> 1] = 'E';
    for (const [x, y] of [[1, 1], [2, 1], [1, 2], [GW - 2, 1], [GW - 3, 1], [GW - 2, GH - 2], [GW - 3, GH - 2], [1, GH - 2], [2, GH - 2], [GW >> 1, GH - 2]]) if (g[y][x] !== 'P' && g[y][x] !== 'E') g[y][x] = '.';
    const rows = g.map(r => r.join(''));
    if (connected(rows)) return rows;
  }
  return MAPS[0];
}
function connected(rows) {
  const seen = new Set(), q = [], open = (x, y) => rows[y] && rows[y][x] && '#bw'.indexOf(rows[y][x]) < 0;
  let total = 0; for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (open(x, y)) { total++; if (!q.length) { q.push([x, y]); seen.add(y * GW + x); } }
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (open(nx, ny) && !seen.has(ny * GW + nx)) { seen.add(ny * GW + nx); q.push([nx, ny]); } } }
  return seen.size === total;
}
function loadLevel() {
  const rows = S.level < MAPS.length ? MAPS[S.level] : genMap(S.level);
  S.grid = rows.map(r => [...r]); S.bricks = {}; S.tanks = []; S.shells = []; S.mines = []; S.drops = []; S.marks = []; S.fx.clear(); S.smoke.clear();
  S.spawns = [];
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const c = S.grid[y][x];
    if (c === 'b') S.bricks[y * GW + x] = 2;
    if (c === 'P') { S.pspawn = [x, y]; S.grid[y][x] = '.'; }
    if (c === 'E') { S.spawns.push([x, y]); S.grid[y][x] = '.'; }
  }
  const p = S.player = makeTank('player', S.pspawn[0], S.pspawn[1]); p.inv = 2; S.tanks.push(p);
  // enemy roster grows with the level
  const n = 4 + Math.min(S.level, 8), pool = ['grunt', 'grunt', 'fast'];
  if (S.level >= 1) pool.push('rico'); if (S.level >= 2) pool.push('heavy', 'miner'); if (S.level >= 4) pool.push('fast', 'rico', 'heavy');
  S.queue = []; for (let i = 0; i < n; i++) S.queue.push(pick(pool));
  S.spawnT = 1.2; S.onField = Math.min(3 + Math.floor(S.level / 2), 6);
  S.msg = 'ARENA ' + (S.level + 1); S.msgT = 2;
}
const tile = (x, y) => (S.grid[y] && S.grid[y][x]) || '#';
const blocksTank = c => c === '#' || c === 'b' || c === 'w';
const blocksShell = c => c === '#' || c === 'b';
const at = (px, py) => tile(Math.floor(px / TS), Math.floor((py - OY) / TS));

/* ---------- tanks ---------- */
function makeTank(kind, tx, ty) {
  const T = kind === 'player' ? { col: '#2fe6ff', speed: 78, hp: 1, shell: 230, bounce: 1 } : TYPES[kind];
  return { kind, T, x: tx * TS + TS / 2, y: OY + ty * TS + TS / 2, ang: kind === 'player' ? 0 : Math.PI, tur: Math.PI / 2, hp: T.hp, reload: 1 + Math.random(), tread: 0, path: [], pathT: 0, boost: 0, cool: 0, inv: 0, mineT: 3 + Math.random() * 3, rapid: 0 };
}
function canStand(x, y, r = 8) {
  for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, -r], [0, r], [-r, 0], [r, 0]]) if (blocksTank(at(x + dx, y + dy))) return false;
  return true;
}
function moveTank(t, dx, dy) {
  if (dx && canStand(t.x + dx, t.y)) t.x += dx;
  if (dy && canStand(t.x, t.y + dy)) t.y += dy;
  t.tread += Math.hypot(dx, dy);
  if (Math.random() < Math.hypot(dx, dy) * 0.08) S.marks.push({ x: t.x, y: t.y, a: t.ang, life: 6 });
}
function fire(t) {
  const big = t.T.big, sp = t.T.shell;
  const x = t.x + Math.cos(t.tur) * 13, y = t.y + Math.sin(t.tur) * 13;
  if (blocksShell(at(x, y))) return;
  S.shells.push({ x, y, vx: Math.cos(t.tur) * sp, vy: Math.sin(t.tur) * sp, owner: t, bounces: t.T.bounce + (t.kind === 'player' && t.rapid > 0 ? 1 : 0), r: big ? 4 : 2.5, life: 6 });
  S.smoke.burst(x, y, 5, ['#ccc', '#999'], 40, 0.5, 4);
  Kit.noise(0.12, t.kind === 'player' ? 0.25 : 0.12, big ? 500 : 1100);
}
function explodeAt(x, y, r, owner) {
  S.fx.burst(x, y, 40, ['#ffd21f', '#ff6a00', '#fff', '#ff3b3b'], 160, 0.7, 3); S.smoke.burst(x, y, 12, ['#555', '#777'], 50, 1.4, 8);
  S.marks.push({ x, y, scorch: true, life: 12 }); S.shake = Math.max(S.shake, 0.3); Kit.noise(0.6, 0.45, 400);
  for (let ty = Math.floor((y - OY - r) / TS); ty <= Math.floor((y - OY + r) / TS); ty++) for (let tx = Math.floor((x - r) / TS); tx <= Math.floor((x + r) / TS); tx++) if (tile(tx, ty) === 'b') breakBrick(tx, ty, 9);
  for (const t of S.tanks) if (Math.hypot(t.x - x, t.y - y) < r + 8) damage(t, owner);
}
function breakBrick(tx, ty, n = 1) {
  const k = ty * GW + tx; S.bricks[k] = (S.bricks[k] || 2) - n;
  S.fx.burst(tx * TS + TS / 2, OY + ty * TS + TS / 2, 6, ['#b8562a', '#7a3a1a'], 70, 0.4, 3);
  if (S.bricks[k] <= 0) { S.grid[ty][tx] = '.'; delete S.bricks[k]; }
}
function damage(t, by) {
  if (t.dead || t.inv > 0) return;
  if (--t.hp > 0) { S.fx.burst(t.x, t.y, 10, ['#fff', '#ffd21f'], 90, 0.3); Kit.tone(300, 0.1, 0.12, 'square'); return; }
  t.dead = true;
  S.fx.burst(t.x, t.y, 60, ['#ffd21f', '#ff6a00', '#fff', t.T.col], 200, 0.9, 3.5); S.smoke.burst(t.x, t.y, 16, ['#444', '#666'], 60, 1.6, 9);
  S.marks.push({ x: t.x, y: t.y, scorch: true, life: 20 }); S.shake = 0.5; Kit.noise(0.9, 0.5, 350); Kit.tone(120, 0.5, 0.15, 'sawtooth', 0.5);
  if (t.kind === 'player') {
    S.lives--; S.deadT = 2;
    if (S.lives <= 0) { S.mode = 'over'; S.overT = 5; S.newHi = Kit.setHi('turbo-tanks', S.score); S.hi = Kit.hi('turbo-tanks'); Kit.jingle([392, 330, 262, 196], 0.2, 'triangle'); }
  } else {
    S.score += t.T.pts;
    if (Math.random() < 0.22) S.drops.push({ x: t.x, y: t.y, k: pick(['R', 'S', 'B']), life: 10 });
  }
}

/* ---------- enemy AI: path toward the player, shoot when there is a clear line ---------- */
function bfsPath(t, goal) {
  const sx = Math.floor(t.x / TS), sy = Math.floor((t.y - OY) / TS), gx = Math.floor(goal.x / TS), gy = Math.floor((goal.y - OY) / TS);
  const prev = new Int32Array(GW * GH).fill(-1), q = [sy * GW + sx]; prev[sy * GW + sx] = sy * GW + sx;
  while (q.length) {
    const c = q.shift(), cx = c % GW, cy = (c / GW) | 0; if (cx === gx && cy === gy) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy, n = ny * GW + nx; if (nx < 0 || ny < 0 || nx >= GW || ny >= GH || prev[n] >= 0 || blocksTank(tile(nx, ny))) continue; prev[n] = c; q.push(n); }
  }
  const end = gy * GW + gx; if (prev[end] < 0) return [];
  const path = []; for (let c = end; c !== sy * GW + sx; c = prev[c]) path.unshift([(c % GW) * TS + TS / 2, OY + ((c / GW) | 0) * TS + TS / 2]);
  return path;
}
function clearShot(x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 5);
  for (let i = 1; i < n; i++) if (blocksShell(at(lerp(x0, x1, i / n), lerp(y0, y1, i / n)))) return false;
  return true;
}
function think(t, dt) {
  const P = S.player;
  t.pathT -= dt;
  const target = P && !P.dead ? P : { x: 240, y: 190 };
  if (t.pathT <= 0) { t.pathT = rand(0.6, 1.2); t.path = bfsPath(t, target); if (t.kind !== 'fast' && t.path.length > 3 && Math.random() < 0.35) t.path = t.path.slice(0, -randi(2, 4)); }
  const wp = t.path[0];
  if (wp) {
    const dx = wp[0] - t.x, dy = wp[1] - t.y, d = Math.hypot(dx, dy);
    if (d < 3) t.path.shift();
    else {
      const want = Math.atan2(dy, dx), da = wrap(want - t.ang);
      t.ang += clamp(da, -4 * dt, 4 * dt);
      if (Math.abs(da) < 0.5) moveTank(t, Math.cos(t.ang) * t.T.speed * dt, Math.sin(t.ang) * t.T.speed * dt);
    }
  }
  // turret tracks the player (with some lag) and fires on a clear line
  if (P && !P.dead) {
    const lead = 0.25, tx = P.x + (P.vx || 0) * lead, ty = P.y + (P.vy || 0) * lead;
    const want = Math.atan2(ty - t.y, tx - t.x) + (t.aimErr || 0);
    t.tur += clamp(wrap(want - t.tur), -2.5 * dt, 2.5 * dt);
    t.reload -= dt;
    if (t.reload <= 0 && Math.abs(wrap(want - t.tur)) < 0.12 && clearShot(t.x, t.y, P.x, P.y) && Math.hypot(P.x - t.x, P.y - t.y) < 300) {
      fire(t); t.reload = t.T.fire * rand(0.8, 1.3) * Math.max(0.55, 1 - S.level * 0.05); t.aimErr = rand(-0.12, 0.12);
    }
  }
  if (t.T.mines && (t.mineT -= dt) <= 0) { t.mineT = rand(5, 9); if (S.mines.filter(m => m.owner === t).length < 2) S.mines.push({ x: t.x, y: t.y, owner: t, arm: 1.2, life: 12 }); }
}
const wrap = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };

/* ---------- update ---------- */
function newGame() { Object.assign(S, { mode: 'play', level: 0, score: 0, lives: 3, paused: false }); loadLevel(); Kit.jingle([262, 330, 392, 523], 0.1, 'square', 0.12); }
function update(dt) {
  S.fx.update(dt); S.smoke.update(dt); if (S.shake > 0) S.shake -= dt;
  for (const m of S.marks) m.life -= dt; S.marks = S.marks.filter(m => m.life > 0).slice(-220);
  if (S.mode === 'title') return;
  if (S.mode === 'over') { if ((S.overT -= dt) <= 0) S.mode = 'title'; return; }
  if (S.paused) return;
  if (S.msgT > 0) S.msgT -= dt;
  const P = S.player;
  // player
  if (!P.dead) {
    P.inv -= dt; P.cool -= dt; P.rapid -= dt; P.reload -= dt;
    let ax = Kit.axisX(), ay = Kit.axisY(); const l = Math.hypot(ax, ay);
    if (Kit.hit('c') && P.cool <= 0) { P.boost = 0.45; P.cool = 2.5; Kit.noise(0.4, 0.2, 2500, 'highpass'); }
    P.boost -= dt;
    const sp = P.T.speed * (P.boost > 0 ? 2.3 : 1) * (P.fast > 0 ? 1.35 : 1); P.fast -= dt;
    P.vx = 0; P.vy = 0;
    if (l > 0.2) {
      const want = Math.atan2(ay, ax); P.ang += clamp(wrap(want - P.ang), -8 * dt, 8 * dt);
      const mv = Math.max(0, Math.cos(wrap(want - P.ang)));
      P.vx = Math.cos(P.ang) * sp * mv; P.vy = Math.sin(P.ang) * sp * mv;
      moveTank(P, P.vx * dt, P.vy * dt);
      if (P.boost > 0) S.smoke.burst(P.x - Math.cos(P.ang) * 10, P.y - Math.sin(P.ang) * 10, 2, ['#2fe6ff', '#fff'], 40, 0.3, 3);
    }
    // turret: follows the mouse if one is in use, otherwise the hull
    if (S.mouse) P.tur = Math.atan2(S.mouse.y - P.y, S.mouse.x - P.x); else P.tur += clamp(wrap(P.ang - P.tur), -10 * dt, 10 * dt);
    const want = Kit.hit('a') || Kit.hit('d') || S.click; S.click = false;
    const mine = S.shells.filter(s => s.owner === P).length;
    if (want && P.reload <= 0 && mine < (P.rapid > 0 ? 5 : 3)) { fire(P); P.reload = P.rapid > 0 ? 0.12 : 0.3; }
    if (Kit.hit('b') && S.mines.filter(m => m.owner === P).length < 2) { S.mines.push({ x: P.x, y: P.y, owner: P, arm: 1.2, life: 10 }); Kit.tone(220, 0.1, 0.1, 'square'); }
    for (const d of S.drops) if (Math.hypot(d.x - P.x, d.y - P.y) < 14) {
      d.life = 0; S.score += 50; Kit.jingle([660, 880, 1100], 0.05);
      if (d.k === 'R') { P.rapid = 10; S.msg = 'RAPID FIRE'; } else if (d.k === 'S') { P.fast = 10; S.msg = 'SPEED'; } else { P.inv = 6; S.msg = 'SHIELD'; }
      S.msgT = 1.2;
    }
  } else if (S.deadT > 0 && (S.deadT -= dt) <= 0 && S.mode === 'play') {
    const np = makeTank('player', S.pspawn[0], S.pspawn[1]); np.inv = 2.5; S.tanks = S.tanks.filter(t => t !== P); S.tanks.push(np); S.player = np;
  }
  for (const d of S.drops) d.life -= dt; S.drops = S.drops.filter(d => d.life > 0);
  // spawn enemies
  const live = S.tanks.filter(t => t.kind !== 'player' && !t.dead).length;
  if (S.queue.length && live < S.onField && (S.spawnT -= dt) <= 0) {
    const sp = pick(S.spawns), t = makeTank(S.queue.shift(), sp[0], sp[1]);
    if (canStand(t.x, t.y) && Math.hypot(t.x - P.x, t.y - P.y) > 80) { S.tanks.push(t); S.fx.burst(t.x, t.y, 20, ['#fff', t.T.col], 80, 0.5); S.spawnT = 1.6; } else S.queue.unshift(t.kind);
  }
  for (const t of S.tanks) if (t.kind !== 'player' && !t.dead) think(t, dt);
  // tanks don't overlap
  for (const a of S.tanks) for (const b of S.tanks) {
    if (a === b || a.dead || b.dead) continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d < 17 && d > 0) { const p = (17 - d) / 2; moveTank(a, -dx / d * p, -dy / d * p); moveTank(b, dx / d * p, dy / d * p); }
  }
  // shells
  for (const s of S.shells) {
    const steps = 3;
    for (let i = 0; i < steps && !s.dead; i++) {
      const ox = s.x, oy = s.y; s.x += s.vx * dt / steps; s.y += s.vy * dt / steps;
      const c = at(s.x, s.y);
      if (blocksShell(c)) {
        const tx = Math.floor(s.x / TS), ty = Math.floor((s.y - OY) / TS);
        if (c === 'b') { breakBrick(tx, ty); s.dead = true; Kit.tone(160, 0.08, 0.1, 'square'); break; }
        if (s.bounces-- <= 0) { s.dead = true; S.fx.burst(ox, oy, 6, ['#fff', '#ffd21f'], 60, 0.3); break; }
        if (blocksShell(at(s.x, oy))) s.vx = -s.vx; if (blocksShell(at(ox, s.y))) s.vy = -s.vy;
        if (!blocksShell(at(s.x, oy)) && !blocksShell(at(ox, s.y))) { s.vx = -s.vx; s.vy = -s.vy; }
        s.x = ox; s.y = oy; Kit.tone(1200, 0.04, 0.06, 'triangle'); s.bounced = true;
      }
      for (const t of S.tanks) if (!t.dead && Math.hypot(t.x - s.x, t.y - s.y) < 9 + s.r && (t !== s.owner || s.bounced)) { s.dead = true; damage(t, s.owner); break; }
    }
    s.life -= dt; if (s.life <= 0) s.dead = true;
  }
  // shells cancel each other
  for (let i = 0; i < S.shells.length; i++) for (let j = i + 1; j < S.shells.length; j++) { const a = S.shells[i], b = S.shells[j]; if (!a.dead && !b.dead && Math.hypot(a.x - b.x, a.y - b.y) < 6) { a.dead = b.dead = true; S.fx.burst(a.x, a.y, 8, ['#fff', '#ffd21f'], 80, 0.3); Kit.tone(900, 0.05, 0.08); } }
  S.shells = S.shells.filter(s => !s.dead);
  // mines
  for (const m of S.mines) {
    m.arm -= dt; m.life -= dt;
    const trig = m.arm <= 0 && S.tanks.some(t => !t.dead && Math.hypot(t.x - m.x, t.y - m.y) < 18);
    const shot = S.shells.find(s => Math.hypot(s.x - m.x, s.y - m.y) < 6); if (shot) shot.dead = true;
    if (trig || shot || m.life <= 0) { m.dead = true; explodeAt(m.x, m.y, 30, m.owner); }
  }
  S.mines = S.mines.filter(m => !m.dead);
  S.tanks = S.tanks.filter(t => !t.dead || t === S.player);
  // arena cleared?
  if (!S.queue.length && !S.tanks.some(t => t.kind !== 'player' && !t.dead) && !S.clearT && S.mode === 'play') { S.clearT = 2.2; S.msg = 'ARENA CLEAR!'; S.msgT = 2; S.score += 1000; Kit.jingle([523, 659, 784, 1047], 0.1); }
  if (S.clearT && (S.clearT -= dt) <= 0) { S.clearT = 0; S.level++; loadLevel(); }
}

/* ---------- draw ---------- */
function drawTank(g, t) {
  if (t.dead) return;
  if (t.inv > 0 && Math.floor(t.inv * 10) % 2 === 0 && t.kind === 'player') g.globalAlpha = 0.5;
  g.save(); g.translate(t.x, t.y);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-9, -7, 20, 16);
  g.save(); g.rotate(t.ang);
  const big = t.T.big ? 1.15 : 1; g.scale(big, big);
  // treads
  g.fillStyle = '#1a1a1a'; g.fillRect(-10, -9, 20, 5); g.fillRect(-10, 4, 20, 5);
  g.fillStyle = '#555'; for (let i = 0; i < 5; i++) { const x = -10 + ((i * 4 + t.tread) % 20); g.fillRect(x, -9, 1.5, 5); g.fillRect(x, 4, 1.5, 5); }
  // hull
  const hg = g.createLinearGradient(0, -5, 0, 5); hg.addColorStop(0, '#fff'); hg.addColorStop(0.2, t.T.col); hg.addColorStop(1, '#000');
  g.fillStyle = hg; g.fillRect(-9, -5, 18, 10);
  g.restore();
  // turret
  g.rotate(t.tur);
  g.fillStyle = '#222'; g.fillRect(0, -1.6 * big, 14 * big, 3.2 * big);
  g.fillStyle = t.T.col; g.beginPath(); g.arc(0, 0, 5.5 * big, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(-1.5, -1.5, 2, 0, TAU); g.fill();
  g.restore(); g.globalAlpha = 1;
  if (t.inv > 0 && t.kind === 'player' && t.inv > 2.6) { g.strokeStyle = '#2fe6ff'; g.lineWidth = 1.5; g.beginPath(); g.arc(t.x, t.y, 14, 0, TAU); g.stroke(); }
  if (t.T.hp > 1 && t.hp < t.T.hp) { g.fillStyle = '#f33'; g.fillRect(t.x - 8, t.y - 15, 16 * t.hp / t.T.hp, 2); }
}
function render() {
  const g = Kit.begin('#2a2418');
  if (S.shake > 0) g.translate(rand(-3, 3) * S.shake * 2, rand(-3, 3) * S.shake * 2);
  // floor
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { g.fillStyle = (x + y) % 2 ? '#3a3226' : '#363023'; g.fillRect(x * TS, OY + y * TS, TS, TS); }
  if (S.mode === 'title') { drawTitle(g); Kit.end(); return; }
  for (const m of S.marks) {
    g.globalAlpha = Math.min(1, m.life / 3) * (m.scorch ? 0.55 : 0.25);
    if (m.scorch) { g.fillStyle = '#0d0a06'; g.beginPath(); g.arc(m.x, m.y, 12, 0, TAU); g.fill(); }
    else { g.save(); g.translate(m.x, m.y); g.rotate(m.a); g.fillStyle = '#1a140c'; g.fillRect(-2, -9, 4, 3); g.fillRect(-2, 6, 4, 3); g.restore(); }
  }
  g.globalAlpha = 1;
  // walls
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const c = S.grid[y][x], px = x * TS, py = OY + y * TS;
    if (c === '#') {
      const sg = g.createLinearGradient(px, py, px, py + TS); sg.addColorStop(0, '#9aa2b0'); sg.addColorStop(1, '#4a505c');
      g.fillStyle = sg; g.fillRect(px, py, TS, TS); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(px, py + TS - 2, TS, 2); g.fillRect(px + TS - 2, py, 2, TS);
      g.fillStyle = '#c8ccd4'; for (const [a, b] of [[4, 4], [15, 4], [4, 15], [15, 15]]) g.fillRect(px + a, py + b, 2, 2);
    } else if (c === 'b') {
      const hp = S.bricks[y * GW + x] || 2;
      g.fillStyle = hp > 1 ? '#a24a22' : '#7a3618'; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#d8b090'; g.globalAlpha = 0.35;
      for (let r = 0; r < 4; r++) { g.fillRect(px, py + r * 5, TS, 1); for (let k = 0; k < 3; k++) g.fillRect(px + ((r % 2) * 4 + k * 8) % TS, py + r * 5, 1, 5); }
      g.globalAlpha = 1; if (hp < 2) { g.strokeStyle = '#1a0a04'; g.beginPath(); g.moveTo(px + 4, py + 3); g.lineTo(px + 10, py + 11); g.lineTo(px + 7, py + 17); g.stroke(); }
    } else if (c === 'w') {
      g.fillStyle = '#1a5a9a'; g.fillRect(px, py, TS, TS);
      g.fillStyle = 'rgba(255,255,255,.25)'; const o = (Kit.t * 8 + x * 5) % TS; g.fillRect(px + o * 0.5, py + 6, 6, 1); g.fillRect(px + ((o + 10) % TS) * 0.8, py + 14, 5, 1);
    }
  }
  for (const m of S.mines) { g.fillStyle = m.arm > 0 ? '#555' : (Kit.blink(3) ? '#ff3b3b' : '#600'); g.beginPath(); g.arc(m.x, m.y, 4.5, 0, TAU); g.fill(); g.strokeStyle = '#ffd21f'; g.lineWidth = 1; g.stroke(); }
  for (const d of S.drops) { if (d.life < 3 && Kit.blink(4)) continue; g.fillStyle = { R: '#ff3b3b', S: '#2fe6ff', B: '#ffd21f' }[d.k]; g.beginPath(); g.roundRect(d.x - 7, d.y - 7, 14, 14, 3); g.fill(); Kit.text(d.k, d.x, d.y + 0.5, 9, '#000', 'center', { stroke: false, italic: false }); }
  for (const t of S.tanks) drawTank(g, t);
  for (const s of S.shells) { g.fillStyle = s.owner.kind === 'player' ? '#fff' : '#ffd21f'; g.beginPath(); g.arc(s.x, s.y, s.r, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,200,80,.35)'; g.beginPath(); g.arc(s.x - s.vx * 0.02, s.y - s.vy * 0.02, s.r * 0.8, 0, TAU); g.fill(); }
  S.smoke.draw(g); S.fx.draw(g);
  if (S.mouse && S.player && !S.player.dead) { g.strokeStyle = 'rgba(47,230,255,.7)'; g.lineWidth = 1; g.beginPath(); g.arc(S.mouse.x, S.mouse.y, 6, 0, TAU); g.moveTo(S.mouse.x - 9, S.mouse.y); g.lineTo(S.mouse.x + 9, S.mouse.y); g.moveTo(S.mouse.x, S.mouse.y - 9); g.lineTo(S.mouse.x, S.mouse.y + 9); g.stroke(); }
  // HUD
  g.fillStyle = '#000'; g.fillRect(0, 0, 480, OY);
  Kit.mono('SCORE ' + String(S.score).padStart(6, '0'), 8, 10, 11, '#fff');
  Kit.mono('ARENA ' + (S.level + 1), 200, 10, 11, '#ffd21f', 'center');
  Kit.mono('HI ' + String(Math.max(S.hi, S.score)).padStart(6, '0'), 300, 10, 11, '#8a85a8', 'center');
  for (let i = 0; i < S.lives; i++) { g.fillStyle = '#2fe6ff'; g.fillRect(400 + i * 14, 6, 10, 8); g.fillStyle = '#111'; g.fillRect(405 + i * 14, 9, 7, 2); }
  const left = S.queue.length + S.tanks.filter(t => t.kind !== 'player' && !t.dead).length; Kit.mono('×' + left, 474, 10, 11, '#ff3b3b', 'right');
  if (S.player && S.player.cool > 0) { g.fillStyle = '#333'; g.fillRect(360, 7, 30, 6); g.fillStyle = '#2fe6ff'; g.fillRect(360, 7, 30 * (1 - S.player.cool / 2.5), 6); }
  if (S.msgT > 0) Kit.text(S.msg, 240, 190, 26, '#ffd21f', 'center', { glow: '#000' });
  if (S.paused) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, 480, 360); Kit.text('PAUSED', 240, 180, 30, '#ffd21f'); }
  if (S.mode === 'over') { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, 0, 480, 360); Kit.text('GAME OVER', 240, 170, 34, '#ff3b3b'); if (S.newHi) Kit.text('NEW HIGH SCORE!', 240, 206, 16, '#ffd21f'); }
  Kit.end();
}
function drawTitle(g) {
  g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, 480, 360);
  Kit.text('TURBO', 240, 72, 52, '#ffd21f', 'center', { glow: '#ff6a00' });
  Kit.text('TANKS', 240, 120, 52, '#ff3b3b', 'center', { glow: '#ff3b3b' });
  let i = 0; for (const k in TYPES) { const t = makeTank(k, 0, 0); t.x = 96 + i * 72; t.y = 170; t.ang = -Math.PI / 2 + Math.sin(Kit.t + i) * 0.4; t.tur = t.ang; drawTank(g, t); Kit.mono(k.toUpperCase(), t.x, 192, 8, '#ddd', 'center'); Kit.mono(TYPES[k].pts + '', t.x, 204, 8, '#ffd21f', 'center'); i++; }
  Kit.mono('MOVE: stick / arrows / WASD   FIRE: A · J · Space · click', 240, 232, 9, '#fff', 'center');
  Kit.mono('MINE: B · K     TURBO DASH: C · L     Shells ricochet off steel', 240, 246, 9, '#fff', 'center');
  if (Kit.blink()) Kit.text('PRESS START', 240, 290, 22, '#ffd21f');
  Kit.mono('HI ' + String(S.hi).padStart(6, '0'), 240, 322, 10, '#8a85a8', 'center');
}

/* ---------- boot ---------- */
S.hi = Kit.hi('turbo-tanks');
Kit.init({
  W: 480, H: 360, render, touchLabels: { a: 'FIRE', b: 'MINE', c: 'TURBO' },
  update: dt => { if (S.mode === 'title' && Kit.hit('a')) newGame(); else update(dt); },
  onStart() { if (S.mode === 'title') newGame(); else if (S.mode === 'play') S.paused = !S.paused; },
  onPause() { if (S.mode === 'play') S.paused = !S.paused; },
  onTitle() { return S.mode === 'title'; },
});
// a mouse aims the turret and clicks fire (desktop); touch uses the on-screen buttons
Kit.canvas.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && S.mode === 'play') S.mouse = Kit.toLogical(e.clientX, e.clientY); });
Kit.canvas.addEventListener('pointerdown', e => { Kit.audioInit(); if (S.mode === 'title') { newGame(); return; } if (e.pointerType === 'mouse') { S.mouse = Kit.toLogical(e.clientX, e.clientY); S.click = true; } });
Kit.canvas.addEventListener('pointerleave', () => { S.mouse = null; });
