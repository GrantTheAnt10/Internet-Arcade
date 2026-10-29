/* =====================================================================
   SKYLINE SKATER — rooftop skate runner with tricks, grinds and combos
   ===================================================================== */
const GRAV = 1500, JUMP = 500, SKX = 130;
const TRICKS = { b: { name: 'KICKFLIP', t: 0.42, pts: 300 }, d: { name: '360 SPIN', t: 0.55, pts: 450 }, c: { name: 'GRAB', t: 0, pts: 0 } };
const S = {
  mode: 'title', score: 0, hi: 0, lives: 3, speed: 180, dist: 0, cam: 0,
  roofs: [], rails: [], boxes: [], cans: [], fx: new Particles(), sparks: new Particles(),
  sk: null, combo: 0, mult: 1, comboT: 0, tricksInCombo: [], msg: '', msgT: 0, pops: [], paused: false,
  far: [], mid: [], stars: [],
};
function skater() { return { x: 0, y: 0, vy: 0, ground: null, rail: null, air: false, trick: null, trickT: 0, grabT: 0, spin: 0, flip: 0, bail: 0, holdJ: 0, dead: 0 }; }

/* ---------- city generation ---------- */
function genBackdrop() {
  S.far = []; S.mid = []; S.stars = [];
  for (let x = 0; x < 1400; x += rand(30, 70)) S.far.push({ x, w: rand(30, 70), h: rand(60, 180), win: Math.random() });
  for (let x = 0; x < 1600; x += rand(50, 110)) S.mid.push({ x, w: rand(50, 110), h: rand(70, 160), hue: pick([190, 300, 330, 50]), sign: Math.random() < 0.3 });
  for (let i = 0; i < 60; i++) S.stars.push({ x: rand(0, 480), y: rand(0, 160), s: Math.random() });
}
function lastRoof() { return S.roofs[S.roofs.length - 1]; }
function addRoof(first) {
  const prev = lastRoof();
  const gap = first ? 0 : rand(46, Math.min(190, 60 + S.speed * 0.45));
  const x0 = prev ? prev.x1 + gap : -200;
  const w = first ? 900 : rand(260, 620);
  let y = prev ? clamp(prev.y + rand(-55, 60), 200, 300) : 260;
  if (prev && y < prev.y - 60) y = prev.y - 60;            // never higher than an ollie can reach
  const roof = { x0, x1: x0 + w, y, style: randi(0, 2), ramp: !first && Math.random() < 0.28 };
  S.roofs.push(roof);
  if (first) return;
  // features: rails, boxes (AC units / vents), spray-can pickups
  const r = Math.random();
  if (r < 0.45 && w > 300) {
    const rw = rand(110, Math.min(260, w - 120)), rx = x0 + rand(60, w - rw - 40);
    S.rails.push({ x0: rx, x1: rx + rw, y: y - rand(26, 40) });
  } else if (r < 0.6) {
    // a gap rail: starts over this roof and runs across the next gap
    const rx = x0 + w - rand(120, 180); S.rails.push({ x0: rx, x1: x0 + w + 80, y: y - 34, gap: true });
  }
  const nBox = Math.random() < 0.55 ? randi(1, 2) : 0;
  for (let i = 0; i < nBox; i++) {
    const bx = x0 + rand(140, w - 90), bw = rand(22, 38), bh = rand(18, 30);
    if (S.rails.some(rl => bx + bw > rl.x0 - 30 && bx < rl.x1 + 30)) continue;
    S.boxes.push({ x0: bx, x1: bx + bw, base: y, top: y - bh, kind: pick(['ac', 'vent', 'crate']) });
  }
  if (Math.random() < 0.6) { const cx = x0 + rand(80, w - 80); for (let i = 0; i < 4; i++) S.cans.push({ x: cx + i * 22, y: y - 70 - Math.sin(i / 3 * Math.PI) * 30 }); }
}
function roofAt(x) { return S.roofs.find(r => x >= r.x0 && x <= r.x1); }
function surfaceY(r, x) { if (r.ramp && x > r.x1 - 46) return r.y - (x - (r.x1 - 46)) * 0.42; return r.y; }

function newGame() {
  Object.assign(S, { mode: 'play', score: 0, lives: 3, speed: 185, dist: 0, cam: 0, roofs: [], rails: [], boxes: [], cans: [], combo: 0, mult: 1, tricksInCombo: [], pops: [], paused: false });
  S.fx.clear(); S.sparks.clear();
  addRoof(true); while (lastRoof().x1 < 1400) addRoof(false);
  S.sk = skater(); S.sk.x = 0; S.sk.y = 260; S.sk.ground = S.roofs[0];
  S.msg = 'GO!'; S.msgT = 1; Kit.jingle([392, 523, 659, 784], 0.08);
}

/* ---------- combo ---------- */
function addTrick(name, pts) {
  S.combo += pts; S.mult = Math.min(10, S.mult + 1); S.comboT = 0; S.tricksInCombo.push(name);
  S.pops.push({ x: S.sk.x, y: S.sk.y - 50, t: 1, s: name });
  Kit.tone(660 + S.mult * 60, 0.08, 0.1, 'square', 1.3);
}
function bankCombo() {
  if (!S.combo) return;
  const total = S.combo * S.mult; S.score += total;
  if (S.tricksInCombo.length > 1 || total > 600) { S.msg = total.toLocaleString() + (S.mult > 1 ? '  (x' + S.mult + ')' : ''); S.msgT = 1.3; Kit.jingle([784, 988, 1175], 0.06, 'square', 0.1); }
  S.combo = 0; S.mult = 1; S.tricksInCombo = [];
}
function bail(why, loseLife) {
  const k = S.sk; k.bail = 1.0; k.trick = null; k.grabT = 0; k.spin = 0; k.flip = 0;
  S.combo = 0; S.mult = 1; S.tricksInCombo = [];
  S.fx.burst(k.x, k.y - 12, 26, ['#ff3bd4', '#2fe6ff', '#fff'], 160, 0.7, 3, 400);
  Kit.noise(0.4, 0.4, 700); Kit.tone(200, 0.4, 0.1, 'sawtooth', 0.4);
  S.speed = Math.max(170, S.speed * 0.8);
  S.msg = why; S.msgT = 1.2;
  if (loseLife) {
    S.lives--;
    if (S.lives <= 0) { k.dead = 2; S.mode = 'over'; S.overT = 5; S.newHi = Kit.setHi('skyline-skater', Math.floor(S.score)); S.hi = Kit.hi('skyline-skater'); Kit.jingle([392, 330, 262, 196], 0.2, 'triangle'); }
  }
}

/* ---------- update ---------- */
function update(dt) {
  S.fx.update(dt); S.sparks.update(dt);
  for (let i = S.pops.length - 1; i >= 0; i--) if ((S.pops[i].t -= dt) <= 0) S.pops.splice(i, 1);
  if (S.mode === 'title') { S.cam += 60 * dt; return; }
  if (S.mode === 'over') { if ((S.overT -= dt) <= 0) S.mode = 'title'; return; }
  if (S.paused) return;
  if (S.msgT > 0) S.msgT -= dt;
  const k = S.sk;
  S.speed = Math.min(360, S.speed + dt * 4.5);
  const sp = k.bail > 0 ? S.speed * 0.5 : S.speed;
  k.x += sp * dt; S.dist += sp * dt; S.score += sp * dt / 10;
  S.cam = k.x - SKX;
  if (k.bail > 0) k.bail -= dt;
  // world upkeep
  while (lastRoof().x1 < S.cam + 1100) addRoof(false);
  const cut = S.cam - 300;
  S.roofs = S.roofs.filter(r => r.x1 > cut); S.rails = S.rails.filter(r => r.x1 > cut); S.boxes = S.boxes.filter(b => b.x1 > cut); S.cans = S.cans.filter(c => c.x > cut && !c.got);
  const jump = Kit.hit('a') || Kit.hit('up');
  if (k.ground || k.rail) {
    // riding
    if (k.ground) {
      const r = k.ground;
      if (k.x > r.x1) {
        k.ground = null; k.air = true;
        k.vy = r.ramp ? -JUMP * 0.9 : 0;           // kicker at the lip launches you
        if (r.ramp) { S.fx.burst(k.x, k.y, 8, ['#aaa'], 60, 0.4); Kit.tone(300, 0.15, 0.08, 'triangle', 2); }
      } else k.y = surfaceY(r, k.x);
      for (const b of S.boxes) if (k.x + 6 > b.x0 && k.x - 6 < b.x1 && k.y > b.top + 2 && k.bail <= 0) { b.x1 = b.x0 - 1; bail('WIPEOUT!', true); return; }
    } else {
      const rl = k.rail;
      k.y = rl.y; k.grindPts = (k.grindPts || 0) + dt;
      if (k.grindPts > 0.1) { k.grindPts = 0; S.combo += 25; }
      if (Math.random() < 0.6) S.sparks.burst(k.x - 4, k.y, 2, ['#ffd21f', '#fff', '#ff8a1f'], 90, 0.3, 2, 300);
      if (k.x > rl.x1) { k.rail = null; k.air = true; k.vy = -120; }
    }
    if (jump && k.bail <= 0) {
      k.vy = -JUMP; k.air = true; k.holdJ = 0.22;
      if (k.rail) { addTrick('GRIND', 0); k.rail = null; }
      k.ground = null; Kit.tone(240, 0.12, 0.12, 'triangle', 1.8);
    }
  }
  if (k.air && !k.ground && !k.rail) {
    // holding jump floats a little higher
    const holding = (Kit.held('a') || Kit.held('up')) && k.holdJ > 0; k.holdJ -= dt;
    k.vy += GRAV * (holding ? 0.55 : 1) * dt; k.y += k.vy * dt;
    // tricks
    if (!k.trick && k.bail <= 0) {
      if (Kit.hit('b')) startTrick('b'); else if (Kit.hit('d') || (Kit.hit('down'))) startTrick('d');
    }
    if (k.trick) {
      k.trickT -= dt; const T = TRICKS[k.trick];
      if (k.trick === 'b') k.flip = (1 - k.trickT / T.t) * TAU; else k.spin = (1 - k.trickT / T.t) * TAU;
      if (k.trickT <= 0) { addTrick(T.name, T.pts); k.trick = null; k.flip = 0; k.spin = 0; }
    }
    const grabbing = Kit.held('c') && k.bail <= 0 && !k.trick;
    if (grabbing) { k.grabT += dt; if (k.grabT > 0.25 && !k.grabScored) { k.grabScored = true; addTrick('INDY GRAB', 200); } else if (k.grabT > 0.25) S.combo += Math.round(120 * dt); }
    else { k.grabT = 0; k.grabScored = false; }
    // spray cans
    for (const c of S.cans) if (!c.got && Math.abs(c.x - k.x) < 12 && Math.abs(c.y - (k.y - 18)) < 20) { c.got = true; S.score += 100; S.fx.burst(c.x, c.y, 10, ['#3bff4a', '#fff'], 90, 0.4); Kit.tone(1320, 0.06, 0.08, 'square', 1.5); }
    // land on rails (only while falling)
    if (k.vy > 0) for (const rl of S.rails) {
      if (k.x >= rl.x0 && k.x <= rl.x1 && k.y >= rl.y && k.y - k.vy * dt <= rl.y + 2) {
        if (k.trick || k.grabT > 0.05) { bail('BAILED!', false); k.rail = null; break; }
        k.rail = rl; k.air = false; k.y = rl.y; k.vy = 0; Kit.noise(0.2, 0.15, 3000, 'highpass');
        if (!S.tricksInCombo.length || S.tricksInCombo[S.tricksInCombo.length - 1] !== 'RAIL') addTrick(rl.gap ? 'GAP GRIND' : 'RAIL GRIND', rl.gap ? 300 : 150);
        break;
      }
    }
    // land on roofs / boxes
    if (!k.rail && k.vy > 0) {
      const r = roofAt(k.x);
      if (r && k.y >= surfaceY(r, k.x) && k.y - k.vy * dt <= surfaceY(r, k.x) + 8) {
        k.y = surfaceY(r, k.x); k.vy = 0; k.air = false; k.ground = r;
        if (k.trick || k.grabT > 0.05) bail('BAILED!', false);
        else { bankCombo(); Kit.tone(160, 0.08, 0.12, 'triangle'); S.fx.burst(k.x, k.y, 5, ['#888'], 50, 0.3, 2); }
      } else if (r && k.y > surfaceY(r, k.x) + 8) {
        // hit the side of a taller roof
        bail('SPLAT!', true); if (S.mode === 'play') respawn(); return;
      }
      for (const b of S.boxes) if (k.x + 6 > b.x0 && k.x - 6 < b.x1 && k.y > b.top + 4 && k.y - k.vy * dt > b.top + 4 && k.bail <= 0) { b.x1 = b.x0 - 1; bail('WIPEOUT!', true); return; }
      for (const b of S.boxes) if (k.x + 6 > b.x0 && k.x - 6 < b.x1 && k.y >= b.top && k.y - k.vy * dt <= b.top + 4) {
        // landing on top of a box is fine (it's a ledge)
        k.y = b.top; k.vy = 0; k.air = false; k.ground = { x0: b.x0, x1: b.x1, y: b.top };
        if (k.trick || k.grabT > 0.05) bail('BAILED!', false); else bankCombo();
      }
    }
    // fell into the street
    if (k.y > 420) {
      if (S.mode === 'play') bail('FELL!', true);
      if (S.mode === 'play') respawn();
    }
  }
}
function startTrick(key) { const k = S.sk; k.trick = key; k.trickT = TRICKS[key].t; Kit.tone(500, 0.1, 0.06, 'triangle', 1.5); }
function respawn() {
  const k = S.sk, r = S.roofs.find(r => r.x0 > k.x - 40) || lastRoof();
  k.x = r.x0 + 40; k.y = r.y; k.vy = 0; k.ground = r; k.rail = null; k.air = false; k.bail = 1.2;
  S.boxes = S.boxes.filter(b => b.x0 > k.x + 160 || b.x1 < k.x);
}

/* ---------- draw ---------- */
function render() {
  const g = Kit.begin('#0b0620');
  const sky = g.createLinearGradient(0, 0, 0, 360); sky.addColorStop(0, '#05020f'); sky.addColorStop(0.55, '#2a0f4a'); sky.addColorStop(1, '#ff3b8a');
  g.fillStyle = sky; g.fillRect(0, 0, 480, 360);
  for (const st of S.stars) { g.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(Kit.t + st.s * 9))})`; g.fillRect(st.x, st.y, 1, 1); }
  g.fillStyle = '#ffe9c0'; g.shadowColor = '#ffd'; g.shadowBlur = 30; g.beginPath(); g.arc(380, 70, 26, 0, TAU); g.fill(); g.shadowBlur = 0;
  // far skyline
  const fo = (S.cam * 0.15) % 1400;
  for (const b of S.far) for (const off of [0, 1400]) {
    const x = b.x - fo + off; if (x > 480 || x + b.w < 0) continue;
    g.fillStyle = '#1a0d33'; g.fillRect(x, 300 - b.h, b.w, b.h + 60);
    g.fillStyle = 'rgba(255,220,120,.35)'; for (let wy = 300 - b.h + 6; wy < 300; wy += 9) for (let wx = x + 4; wx < x + b.w - 4; wx += 7) if (((wx * 7 + wy * 13) | 0) % 5 < 2 * b.win) g.fillRect(wx, wy, 3, 4);
  }
  // mid skyline with neon signs
  const mo = (S.cam * 0.4) % 1600;
  for (const b of S.mid) for (const off of [0, 1600]) {
    const x = b.x - mo + off; if (x > 480 || x + b.w < 0) continue;
    g.fillStyle = '#120826'; g.fillRect(x, 340 - b.h, b.w, b.h + 40);
    g.fillStyle = `hsla(${b.hue},100%,60%,.5)`; for (let wy = 340 - b.h + 8; wy < 340; wy += 12) for (let wx = x + 6; wx < x + b.w - 6; wx += 10) if (((wx * 3 + wy * 7) | 0) % 7 < 2) g.fillRect(wx, wy, 4, 5);
    if (b.sign) { g.shadowColor = `hsl(${b.hue},100%,60%)`; g.shadowBlur = 12; g.fillStyle = `hsl(${b.hue},100%,65%)`; g.fillRect(x + 8, 340 - b.h - 14, b.w - 16, 8); g.shadowBlur = 0; }
  }
  if (S.mode === 'title') { drawTitle(g); Kit.end(); return; }
  g.save(); g.translate(-Math.round(S.cam), 0);
  // roofs
  for (const r of S.roofs) {
    const col = ['#2b2440', '#33283f', '#262a44'][r.style];
    g.fillStyle = col; g.fillRect(r.x0, r.y, r.x1 - r.x0, 400 - r.y);
    g.fillStyle = '#4a3f66'; g.fillRect(r.x0, r.y, r.x1 - r.x0, 4);
    g.fillStyle = 'rgba(255,200,120,.25)'; for (let wy = r.y + 16; wy < 360; wy += 16) for (let wx = r.x0 + 10; wx < r.x1 - 10; wx += 18) if (((wx + wy * 3) | 0) % 4 === 0) g.fillRect(wx, wy, 6, 7);
    if (r.ramp) { g.fillStyle = '#6a5a8a'; g.beginPath(); g.moveTo(r.x1 - 46, r.y); g.lineTo(r.x1, r.y - 19); g.lineTo(r.x1, r.y); g.fill(); g.fillStyle = '#ffd21f'; g.fillRect(r.x1 - 3, r.y - 19, 3, 19); }
    // water tower / antenna decor
    if (r.style === 1 && r.x1 - r.x0 > 300) { const x = r.x0 + 40; g.fillStyle = '#1a1428'; g.fillRect(x, r.y - 48, 30, 30); g.fillRect(x + 4, r.y - 18, 3, 18); g.fillRect(x + 23, r.y - 18, 3, 18); g.fillStyle = '#ff3b3b'; g.fillRect(x + 13, r.y - 54, 4, 4); }
  }
  // boxes
  for (const b of S.boxes) {
    const h = b.base - b.top;
    g.fillStyle = b.kind === 'ac' ? '#8a8aa0' : b.kind === 'vent' ? '#5a6a7a' : '#8a5a2a'; g.fillRect(b.x0, b.top, b.x1 - b.x0, h);
    g.fillStyle = 'rgba(0,0,0,.35)'; for (let x = b.x0 + 3; x < b.x1 - 2; x += 5) g.fillRect(x, b.top + 4, 2, h - 6);
    g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(b.x0, b.top, b.x1 - b.x0, 2);
  }
  // rails
  for (const rl of S.rails) {
    g.strokeStyle = '#c8d0e0'; g.lineWidth = 3; g.beginPath(); g.moveTo(rl.x0, rl.y); g.lineTo(rl.x1, rl.y); g.stroke();
    g.strokeStyle = '#6a7080'; g.lineWidth = 2;
    for (let x = rl.x0 + 6; x < rl.x1; x += 40) { const r = roofAt(x); if (r) { g.beginPath(); g.moveTo(x, rl.y); g.lineTo(x, r.y); g.stroke(); } }
  }
  // spray cans
  for (const c of S.cans) if (!c.got) { const bob = Math.sin(Kit.t * 4 + c.x) * 2; g.fillStyle = '#3bff4a'; g.fillRect(c.x - 3, c.y - 7 + bob, 6, 12); g.fillStyle = '#fff'; g.fillRect(c.x - 2, c.y - 10 + bob, 4, 3); }
  drawSkater(g, S.sk);
  S.sparks.draw(g); S.fx.draw(g);
  for (const p of S.pops) { g.globalAlpha = Math.min(1, p.t * 2); Kit.text(p.s, p.x, p.y - (1 - p.t) * 24, 11, '#ffd21f', 'center'); g.globalAlpha = 1; }
  g.restore();
  // HUD
  Kit.mono('SCORE ' + String(Math.floor(S.score)).padStart(7, '0'), 10, 14, 12, '#fff');
  Kit.mono('HI ' + String(Math.max(S.hi, Math.floor(S.score))).padStart(7, '0'), 470, 14, 12, '#ffd21f', 'right');
  for (let i = 0; i < S.lives; i++) { g.fillStyle = '#ff3bd4'; g.fillRect(12 + i * 14, 26, 10, 3); g.fillStyle = '#ccc'; g.fillRect(13 + i * 14, 29, 2, 2); g.fillRect(19 + i * 14, 29, 2, 2); }
  Kit.mono(Math.round(S.speed / 3.2) + ' MPH', 470, 30, 10, '#2fe6ff', 'right');
  if (S.combo) Kit.text(S.combo.toLocaleString() + (S.mult > 1 ? ' x' + S.mult : ''), 240, 46, 16, '#2fe6ff', 'center', { glow: '#2fe6ff', blur: 8 });
  if (S.tricksInCombo.length) Kit.mono(S.tricksInCombo.slice(-4).join(' + '), 240, 64, 9, '#fff', 'center');
  if (S.msgT > 0) Kit.text(S.msg, 240, 120, 26, S.msg.endsWith('!') && S.msg !== 'GO!' ? '#ff3b3b' : '#ffd21f', 'center', { glow: '#000' });
  if (S.paused) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, 480, 360); Kit.text('PAUSED', 240, 170, 30, '#ffd21f'); }
  if (S.mode === 'over') { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, 480, 360); Kit.text('GAME OVER', 240, 160, 34, '#ff3b8a'); Kit.mono('DISTANCE ' + Math.floor(S.dist / 10) + ' m', 240, 196, 12, '#fff', 'center'); if (S.newHi) Kit.text('NEW HIGH SCORE!', 240, 222, 16, '#ffd21f'); }
  Kit.end();
}
function drawSkater(g, k) {
  if (!k || (k.dead > 0 && S.mode === 'over')) return;
  if (k.bail > 0 && Math.floor(k.bail * 14) % 2 === 0) return;
  const x = k.x, y = k.y, grab = k.grabT > 0, crouch = k.air ? (grab ? 1 : 0.5) : (k.rail ? 0.3 : 0);
  g.save(); g.translate(x, y);
  // board
  g.save(); g.translate(0, -3);
  if (k.spin) g.scale(Math.cos(k.spin), 1);
  if (k.flip) g.scale(1, Math.cos(k.flip) * 0.9 + 0.1);
  g.fillStyle = Math.cos(k.flip || 0) < 0 ? '#ff3bd4' : '#2a1a10'; g.fillRect(-14, -2, 28, 3);
  g.fillStyle = '#ffd21f'; g.fillRect(-11, 1, 4, 3); g.fillRect(7, 1, 4, 3);
  g.restore();
  // rider
  const hip = -20 + crouch * 7, sh = hip - 15, lean = k.rail ? -2 : 2;
  g.strokeStyle = '#1b1b2b'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-6, -6); g.lineTo(-3 + crouch * -2, hip + 6 + crouch * 2); g.lineTo(0, hip); g.moveTo(6, -6); g.lineTo(4 + crouch * 2, hip + 6 + crouch * 2); g.lineTo(0, hip); g.stroke();
  g.strokeStyle = '#2fe6ff'; g.lineWidth = 7; g.beginPath(); g.moveTo(0, hip); g.lineTo(lean, sh); g.stroke();
  g.strokeStyle = '#2fe6ff'; g.lineWidth = 3;
  if (grab) { g.beginPath(); g.moveTo(lean, sh + 2); g.lineTo(-4, -4); g.moveTo(lean, sh + 2); g.lineTo(10, sh - 4); g.stroke(); }
  else { g.beginPath(); g.moveTo(lean, sh + 2); g.lineTo(-10, sh + 6 - crouch * 4); g.moveTo(lean, sh + 2); g.lineTo(11, sh + 2 - crouch * 6); g.stroke(); }
  g.fillStyle = '#f0c8a0'; g.beginPath(); g.arc(lean + 1, sh - 6, 5, 0, TAU); g.fill();
  g.fillStyle = '#ff3bd4'; g.fillRect(lean - 4, sh - 12, 10, 4); g.fillRect(lean + 4, sh - 10, 5, 2);
  g.restore();
}
function drawTitle(g) {
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, 480, 360);
  Kit.text('SKYLINE', 240, 78, 50, '#2fe6ff', 'center', { glow: '#2fe6ff' });
  Kit.text('SKATER', 240, 126, 50, '#ff3bd4', 'center', { glow: '#ff3bd4' });
  const rows = [['JUMP / OLLIE', 'A · Space · J · ↑  (hold = higher)'], ['KICKFLIP', 'B · K · X'], ['GRAB (hold)', 'C · L'], ['360 SPIN', 'D · I · ↓'], ['GRIND', 'land on a rail']];
  rows.forEach(([a, b], i) => { Kit.mono(a, 150, 168 + i * 16, 10, '#ffd21f', 'left'); Kit.mono(b, 260, 168 + i * 16, 10, '#fff', 'left'); });
  Kit.mono('Chain tricks for a multiplier. Land a trick before it finishes and you bail.', 240, 258, 8, '#ccc', 'center');
  if (Kit.blink()) Kit.text('PRESS START', 240, 296, 22, '#ffd21f');
  Kit.mono('HI ' + String(S.hi).padStart(7, '0'), 240, 326, 10, '#8a85a8', 'center');
}

/* ---------- boot ---------- */
genBackdrop(); S.hi = Kit.hi('skyline-skater');
Kit.init({
  W: 480, H: 360, render, touchLabels: { a: 'JUMP', b: 'FLIP', c: 'GRAB', d: 'SPIN' },
  update: dt => { if (S.mode === 'title' && Kit.hit('a')) newGame(); else update(dt); },
  onStart() { if (S.mode === 'title') newGame(); else if (S.mode === 'play') S.paused = !S.paused; },
  onPause() { if (S.mode === 'play') S.paused = !S.paused; },
  onTitle() { return S.mode === 'title'; },
});
Kit.canvas.addEventListener('pointerdown', () => { Kit.audioInit(); if (S.mode === 'title') newGame(); });
