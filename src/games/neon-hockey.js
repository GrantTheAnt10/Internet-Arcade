/* =====================================================================
   NEON PONG HOCKEY — air hockey for one player vs CPU, or two players
   ===================================================================== */
const R = { x0: 24, x1: 456, y0: 34, y1: 346, goal: 96 };   // rink and goal mouth height
const CY = (R.y0 + R.y1) / 2, CX = (R.x0 + R.x1) / 2;
const MR = 17, PR = 9, WIN = 7;
const DIFF = [{ name: 'EASY', speed: 190, react: 0.35, aim: 0.3 }, { name: 'NORMAL', speed: 270, react: 0.18, aim: 0.6 }, { name: 'HARD', speed: 370, react: 0.08, aim: 0.95 }];
const S = {
  mode: 'title', sel: 0, players: 1, diff: 1, score: [0, 0], paused: false,
  m: [null, null], puck: null, fx: new Particles(), shake: 0, msg: '', msgT: 0, serveT: 0, trail: [], ptr: {}, flash: [0, 0],
};
function mallet(side) { return { side, x: side ? R.x1 - 60 : R.x0 + 60, y: CY, vx: 0, vy: 0, dash: 0, cool: 0, tx: null, ty: null }; }
function newMatch() {
  Object.assign(S, { mode: 'play', score: [0, 0], paused: false }); S.m = [mallet(0), mallet(1)];
  S.fx.clear(); serve(Math.random() < 0.5 ? 0 : 1); Kit.jingle([523, 659, 784, 1047], 0.08);
}
function serve(toSide) {
  S.puck = { x: CX + (toSide ? 40 : -40), y: CY + rand(-30, 30), vx: 0, vy: 0 };
  S.serveT = 1.0; S.trail = [];
}
const half = side => side ? [CX + MR, R.x1 - MR] : [R.x0 + MR, CX - MR];

/* ---------- input per side ---------- */
function keyAxes(side) {
  const k = c => !!Kit.keys[c];
  if (S.players === 1) return [Kit.axisX(), Kit.axisY(), Kit.hit('a') || Kit.hit('b') || Kit.hit('c')];
  if (side === 0) return [(k('KeyD') ? 1 : 0) - (k('KeyA') ? 1 : 0) || Kit.stick.x, (k('KeyS') ? 1 : 0) - (k('KeyW') ? 1 : 0) || Kit.stick.y, edge('p0', k('ShiftLeft') || k('KeyF') || k('Space') || Kit.pad.a)];
  return [(k('ArrowRight') ? 1 : 0) - (k('ArrowLeft') ? 1 : 0), (k('ArrowDown') ? 1 : 0) - (k('ArrowUp') ? 1 : 0), edge('p1', k('KeyJ') || k('KeyL') || k('KeyK') || k('ShiftRight') || k('Slash'))];
}
const edges = {};
function edge(id, v) { const r = v && !edges[id]; edges[id] = v; return r; }

function cpu(m, dt) {
  const D = DIFF[S.diff], P = S.puck;
  m.think = (m.think || 0) - dt;
  if (m.think <= 0) {
    m.think = D.react;
    const goalX = R.x1 - 8;
    if (P.x > CX - 20) {
      // puck on our side: get behind it and strike toward the far goal
      const aimY = CY + rand(-R.goal / 2, R.goal / 2) * D.aim, dx = P.x - R.x0, dy = P.y - aimY, d = Math.hypot(dx, dy) || 1;
      m.tx = P.x + dx / d * (MR + PR - 4) + P.vx * 0.08; m.ty = P.y + dy / d * (MR + PR - 4) + P.vy * 0.08;
      if (P.x > m.x - 4) { m.tx = Math.min(goalX - 20, P.x + 30); m.ty = P.y + (P.y < CY ? 26 : -26); } // got behind it: circle around
      m.wantDash = Math.random() < D.aim * 0.4 && Math.hypot(P.x - m.x, P.y - m.y) < 70;
    } else {
      // defend: sit between puck and our goal
      const t = clamp((R.x1 - P.x) / 300, 0, 1);
      m.tx = R.x1 - 50 - 30 * (1 - t); m.ty = clamp(lerp(CY, P.y, 0.6), CY - R.goal / 2 - 10, CY + R.goal / 2 + 10); m.wantDash = false;
    }
  }
  return D.speed;
}

function update(dt) {
  S.fx.update(dt); if (S.shake > 0) S.shake -= dt; S.flash = S.flash.map(f => Math.max(0, f - dt));
  if (S.mode === 'title') { titleInput(); return; }
  if (S.mode === 'over') { if ((S.overT -= dt) <= 0 || (S.overT < 3 && (Kit.hit('a') || Kit.hit('start')))) S.mode = 'title'; return; }
  if (S.paused) return;
  if (S.msgT > 0) S.msgT -= dt;
  const P = S.puck;
  for (const m of S.m) {
    const [lo, hi] = half(m.side);
    let maxV = 300, ax = 0, ay = 0, dash = false;
    if (m.side === 1 && S.players === 1) { maxV = cpu(m, dt); dash = m.wantDash && m.cool <= 0; }
    else { [ax, ay, dash] = keyAxes(m.side); if (ax || ay) { m.tx = null; if (![...pointers.values()].includes(m.side)) delete S.ptr[m.side]; } }
    const ptr = S.ptr[m.side]; if (ptr) { m.tx = ptr.x; m.ty = ptr.y; maxV = 900; }
    let tvx, tvy;
    if (m.tx != null) { const dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy); const sp = Math.min(maxV, d * 12); tvx = d > 0.5 ? dx / d * sp : 0; tvy = d > 0.5 ? dy / d * sp : 0; }
    else { const l = Math.hypot(ax, ay) || 1; tvx = ax / Math.max(1, l) * maxV; tvy = ay / Math.max(1, l) * maxV; }
    if (dash && m.cool <= 0) { m.dash = 0.18; m.cool = 0.9; Kit.noise(0.15, 0.15, 3000, 'highpass'); }
    if (m.dash > 0) { m.dash -= dt; const l = Math.hypot(tvx, tvy) || 1; const dir = l > 1 ? [tvx / l, tvy / l] : [m.side ? -1 : 1, 0]; tvx = dir[0] * 620; tvy = dir[1] * 620; }
    m.cool -= dt;
    const k = 1 - Math.exp(-dt * (m.tx != null ? 30 : 16));
    m.vx += (tvx - m.vx) * k; m.vy += (tvy - m.vy) * k;
    const ox = m.x, oy = m.y;
    m.x = clamp(m.x + m.vx * dt, lo, hi); m.y = clamp(m.y + m.vy * dt, R.y0 + MR, R.y1 - MR);
    m.rvx = (m.x - ox) / dt; m.rvy = (m.y - oy) / dt;   // actual velocity after clamping
  }
  if (S.serveT > 0) { S.serveT -= dt; return; }
  // puck physics in small steps
  const steps = Math.ceil(Math.max(Math.hypot(P.vx, P.vy) * dt / 4, 1));
  for (let i = 0; i < steps; i++) if (puckStep(dt / steps)) return;
  S.trail.push([P.x, P.y]); if (S.trail.length > 14) S.trail.shift();
  // a puck that hasn't really moved for a while (dead, or pinned between mallets and a rail) pops free
  if (!S.jam || Math.hypot(P.x - S.jam.x, P.y - S.jam.y) > 12) S.jam = { x: P.x, y: P.y, t: 0 };
  else if ((S.jam.t += dt) > (Math.hypot(P.vx, P.vy) > 40 ? 0.8 : 2.5)) {
    const dx = CX - P.x, dy = CY - P.y, d = Math.hypot(dx, dy) || 1;
    P.x += dx / d * 22; P.y += dy / d * 22; P.vx = dx / d * 220; P.vy = dy / d * 220;
    for (const m of S.m) { const mx = m.x - P.x, my = m.y - P.y, md = Math.hypot(mx, my) || 1; if (md < 60) { const [lo, hi] = half(m.side); m.x = clamp(P.x + mx / md * 60, lo, hi); m.y = clamp(P.y + my / md * 60, R.y0 + MR, R.y1 - MR); m.vx = m.vy = 0; } }
    S.jam = null; Kit.tone(880, 0.1, 0.06, 'sine');
  }
}
function puckStep(dt) {
  const P = S.puck;
  P.x += P.vx * dt; P.y += P.vy * dt;
  const fr = Math.exp(-dt * 0.35); P.vx *= fr; P.vy *= fr;
  // walls (goal mouths are open)
  const inMouth = Math.abs(P.y - CY) < R.goal / 2 - PR * 0.3;
  if (P.y < R.y0 + PR) { P.y = R.y0 + PR; P.vy = Math.abs(P.vy) * 0.92; wallHit(); }
  if (P.y > R.y1 - PR) { P.y = R.y1 - PR; P.vy = -Math.abs(P.vy) * 0.92; wallHit(); }
  if (!inMouth) {
    if (P.x < R.x0 + PR) { P.x = R.x0 + PR; P.vx = Math.abs(P.vx) * 0.92; wallHit(); }
    if (P.x > R.x1 - PR) { P.x = R.x1 - PR; P.vx = -Math.abs(P.vx) * 0.92; wallHit(); }
  } else if (P.x < R.x0 - PR) { goal(1); return true; } else if (P.x > R.x1 + PR) { goal(0); return true; }
  // mallets
  for (const m of S.m) {
    const dx = P.x - m.x, dy = P.y - m.y, d = Math.hypot(dx, dy), min = MR + PR;
    if (d >= min || d === 0) continue;
    const nx = dx / d, ny = dy / d;
    P.x = m.x + nx * min; P.y = m.y + ny * min;
    // never shove the puck through a rail: keep it in and move the mallet back instead
    const mouth = Math.abs(P.y - CY) < R.goal / 2 - PR;
    P.y = clamp(P.y, R.y0 + PR, R.y1 - PR); if (!mouth) P.x = clamp(P.x, R.x0 + PR, R.x1 - PR);
    const ex = P.x - m.x, ey = P.y - m.y, ed = Math.hypot(ex, ey);
    if (ed < min - 0.01) {
      const ux = ed > 0.01 ? ex / ed : nx, uy = ed > 0.01 ? ey / ed : ny, [lo, hi] = half(m.side);
      m.x = clamp(P.x - ux * min, lo, hi); m.y = clamp(P.y - uy * min, R.y0 + MR, R.y1 - MR);
    }
    const rvx = P.vx - (m.rvx || 0), rvy = P.vy - (m.rvy || 0), vn = rvx * nx + rvy * ny;
    if (vn < 0) {
      const e = m.dash > 0 ? 1.25 : 0.95;
      P.vx -= (1 + e) * vn * nx; P.vy -= (1 + e) * vn * ny;
      const sp = Math.hypot(P.vx, P.vy), max = m.dash > 0 ? 820 : 640; if (sp > max) { P.vx *= max / sp; P.vy *= max / sp; }
      const hard = clamp(-vn / 600, 0.1, 1);
      Kit.tone(220 + hard * 300, 0.06, 0.08 + hard * 0.15, 'triangle'); if (hard > 0.6) { S.shake = 0.12; S.fx.burst(P.x, P.y, 10, [m.side ? '#ff3bd4' : '#2fe6ff', '#fff'], 160, 0.3); }
    }
  }
  return false;
}
function wallHit() { const sp = Math.hypot(S.puck.vx, S.puck.vy); if (sp > 60) Kit.tone(520, 0.04, Math.min(0.12, sp / 3000), 'square'); }
function goal(side) {
  S.score[side]++; S.flash[1 - side] = 1; S.shake = 0.5;
  const P = S.puck, col = side ? '#ff3bd4' : '#2fe6ff';
  S.fx.burst(P.x < CX ? R.x0 : R.x1, CY, 90, [col, '#fff', '#ffd21f'], 260, 1.1, 3);
  Kit.noise(1.4, 0.25, 900, 'bandpass'); Kit.jingle(side ? [784, 659, 784, 1047] : [523, 659, 784, 1047], 0.09);
  const who = S.players === 1 ? (side === 0 ? 'YOU SCORE!' : 'CPU SCORES') : (side === 0 ? 'P1 SCORES!' : 'P2 SCORES!');
  S.msg = who; S.msgT = 1.6;
  if (S.score[side] >= WIN) {
    S.mode = 'over'; S.overT = 6; S.winner = side;
    if (S.players === 1 && side === 0) { const st = Kit.hi('neon-hockey-wins') + 1; try { localStorage.setItem('ia-hi-neon-hockey-wins', st); } catch (e) { } }
    return;
  }
  for (const m of S.m) { m.x = m.side ? R.x1 - 60 : R.x0 + 60; m.y = CY; m.vx = m.vy = 0; m.tx = null; }
  serve(1 - side);
}

/* ---------- title menu ---------- */
const MENU = () => [['1 PLAYER  vs CPU', () => { S.players = 1; newMatch(); }], ['2 PLAYERS', () => { S.players = 2; newMatch(); }], ['CPU: ' + DIFF[S.diff].name, () => { S.diff = (S.diff + 1) % 3; }]];
function titleInput() {
  const n = MENU().length;
  if (Kit.hit('down')) { S.sel = (S.sel + 1) % n; Kit.tone(660, 0.05, 0.08); }
  if (Kit.hit('up')) { S.sel = (S.sel + n - 1) % n; Kit.tone(660, 0.05, 0.08); }
  if (Kit.hit('a') || Kit.hit('b')) MENU()[S.sel][1]();
}

/* ---------- draw ---------- */
function neonLine(g, col, w, f) { g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 10; g.lineWidth = w; g.beginPath(); f(); g.stroke(); g.shadowBlur = 0; }
function render() {
  const g = Kit.begin('#05040e');
  if (S.shake > 0) g.translate(rand(-4, 4) * S.shake, rand(-4, 4) * S.shake);
  // table surface with air holes
  const tg = g.createRadialGradient(CX, CY, 20, CX, CY, 280); tg.addColorStop(0, '#141238'); tg.addColorStop(1, '#07061a');
  g.fillStyle = tg; g.beginPath(); g.roundRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0, 26); g.fill();
  g.fillStyle = 'rgba(255,255,255,.06)'; for (let x = R.x0 + 12; x < R.x1; x += 16) for (let y = R.y0 + 12; y < R.y1; y += 16) g.fillRect(x, y, 1, 1);
  neonLine(g, '#ff3bd4', 2, () => { g.moveTo(CX, R.y0); g.lineTo(CX, R.y1); });
  neonLine(g, '#ff3bd4', 2, () => g.arc(CX, CY, 46, 0, TAU));
  neonLine(g, '#2fe6ff', 2, () => g.arc(R.x0, CY, R.goal / 2 + 26, -Math.PI / 2, Math.PI / 2));
  neonLine(g, '#ff3bd4', 2, () => g.arc(R.x1, CY, R.goal / 2 + 26, Math.PI / 2, Math.PI * 1.5));
  // rails and goal mouths
  neonLine(g, '#e8e6ff', 4, () => g.roundRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0, 26));
  for (const side of [0, 1]) {
    const x = side ? R.x1 : R.x0, col = side ? '#ff3bd4' : '#2fe6ff';
    g.fillStyle = '#05040e'; g.fillRect(x - 6, CY - R.goal / 2, 12, R.goal);
    neonLine(g, col, 4 + S.flash[side] * 6, () => { g.moveTo(x, CY - R.goal / 2); g.lineTo(x + (side ? 10 : -10), CY - R.goal / 2); g.lineTo(x + (side ? 10 : -10), CY + R.goal / 2); g.lineTo(x, CY + R.goal / 2); });
  }
  if (S.mode === 'title') { drawTitle(g); Kit.end(); return; }
  // puck trail and puck
  const P = S.puck;
  S.trail.forEach(([x, y], i) => { g.globalAlpha = (i / S.trail.length) * 0.4; g.fillStyle = '#ffd21f'; g.beginPath(); g.arc(x, y, PR * (i / S.trail.length), 0, TAU); g.fill(); });
  g.globalAlpha = 1;
  if (S.serveT > 0 && Kit.blink(4)) g.globalAlpha = 0.4;
  g.shadowColor = '#ffd21f'; g.shadowBlur = 14; g.fillStyle = '#1a1405'; g.beginPath(); g.arc(P.x, P.y, PR, 0, TAU); g.fill();
  g.lineWidth = 3; g.strokeStyle = '#ffd21f'; g.stroke(); g.shadowBlur = 0; g.globalAlpha = 1;
  // mallets
  for (const m of S.m) {
    const col = m.side ? '#ff3bd4' : '#2fe6ff';
    g.shadowColor = col; g.shadowBlur = m.dash > 0 ? 30 : 14;
    const mg = g.createRadialGradient(m.x - 5, m.y - 5, 2, m.x, m.y, MR); mg.addColorStop(0, '#fff'); mg.addColorStop(0.35, col); mg.addColorStop(1, '#0a0a20');
    g.fillStyle = mg; g.beginPath(); g.arc(m.x, m.y, MR, 0, TAU); g.fill();
    g.shadowBlur = 0; g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.arc(m.x, m.y, MR * 0.45, 0, TAU); g.fill();
    g.fillStyle = col; g.beginPath(); g.arc(m.x, m.y, MR * 0.28, 0, TAU); g.fill();
    if (m.cool > 0) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(m.x, m.y, MR + 4, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - m.cool / 0.9)); g.stroke(); }
  }
  S.fx.draw(g);
  // scoreboard
  const n0 = S.players === 1 ? 'YOU' : 'P1', n1 = S.players === 1 ? 'CPU' : 'P2';
  Kit.text(n0 + '  ' + S.score[0], CX - 52, 16, 16, '#2fe6ff', 'right', { glow: '#2fe6ff', blur: 8 });
  Kit.text(S.score[1] + '  ' + n1, CX + 52, 16, 16, '#ff3bd4', 'left', { glow: '#ff3bd4', blur: 8 });
  Kit.mono('FIRST TO ' + WIN, CX, 16, 9, '#8a85a8', 'center');
  if (S.msgT > 0) Kit.text(S.msg, CX, CY, 30, '#ffd21f', 'center', { glow: '#ffd21f', blur: 12 });
  if (S.paused) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, 480, 360); Kit.text('PAUSED', CX, CY, 30, '#ffd21f'); }
  if (S.mode === 'over') {
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, 0, 480, 360);
    const t = S.players === 1 ? (S.winner === 0 ? 'YOU WIN!' : 'CPU WINS') : (S.winner === 0 ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!');
    Kit.text(t, CX, CY - 14, 32, S.winner ? '#ff3bd4' : '#2fe6ff', 'center', { glow: '#fff', blur: 10 });
    Kit.mono(S.score[0] + ' - ' + S.score[1], CX, CY + 22, 16, '#fff', 'center');
  }
  Kit.end();
}
function drawTitle(g) {
  Kit.text('NEON PONG', CX, 92, 44, '#2fe6ff', 'center', { glow: '#2fe6ff' });
  Kit.text('HOCKEY', CX, 138, 44, '#ff3bd4', 'center', { glow: '#ff3bd4' });
  MENU().forEach(([label], i) => {
    const y = 192 + i * 30, on = i === S.sel;
    if (on) { g.fillStyle = 'rgba(47,230,255,.15)'; g.fillRect(CX - 110, y - 12, 220, 24); }
    Kit.text((on ? '▶ ' : '') + label, CX, y, on ? 17 : 15, on ? '#ffd21f' : '#fff', 'center');
  });
  Kit.mono('↑ ↓ choose  ·  FIRE / START to pick', CX, 290, 9, '#8a85a8', 'center');
  Kit.mono('1P: arrows / WASD / mouse / drag · FIRE = SMASH', CX, 306, 9, '#8a85a8', 'center');
  Kit.mono('2P: P1 WASD + Space · P2 arrows + J · or one finger per half', CX, 320, 9, '#8a85a8', 'center');
  const w = Kit.hi('neon-hockey-wins'); if (w) Kit.mono('WINS vs CPU: ' + w, CX, 336, 9, '#ffd21f', 'center');
}

/* ---------- boot ---------- */
Kit.init({
  W: 480, H: 360, update, render, touchLabels: { a: 'SMASH' },
  onStart() { if (S.mode === 'title') MENU()[S.sel][1](); else if (S.mode === 'play') S.paused = !S.paused; else if (S.mode === 'over' && S.overT < 4) S.mode = 'title'; },
  onPause() { if (S.mode === 'play') S.paused = !S.paused; },
  onTitle() { return S.mode === 'title'; },
});
// pointers: in 1P any pointer drives your mallet; in 2P each half of the table belongs to one player
const pointers = new Map();
function ptrSide(x) { return S.players === 1 ? 0 : (x < CX ? 0 : 1); }
Kit.canvas.addEventListener('pointerdown', e => {
  Kit.audioInit();
  const p = Kit.toLogical(e.clientX, e.clientY);
  if (S.mode !== 'play') return;
  const side = ptrSide(p.x); pointers.set(e.pointerId, side); S.ptr[side] = p;
});
Kit.canvas.addEventListener('pointermove', e => {
  const p = Kit.toLogical(e.clientX, e.clientY);
  if (S.mode !== 'play') return;
  if (pointers.has(e.pointerId)) S.ptr[pointers.get(e.pointerId)] = p;
  else if (e.pointerType === 'mouse' && S.players === 1) S.ptr[0] = p;     // mouse steers without clicking
});
const lift = e => { if (pointers.has(e.pointerId)) { delete S.ptr[pointers.get(e.pointerId)]; pointers.delete(e.pointerId); } };
Kit.canvas.addEventListener('pointerup', lift); Kit.canvas.addEventListener('pointercancel', lift);
Kit.canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') delete S.ptr[0]; });
