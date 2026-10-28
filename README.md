# Internet-Arcade

## Hill Hop 64

An arcade motocross game in one file: open `HillHop64.html` in a browser. It works offline, because three.js (r160, MIT) is inlined.

### Modes

Championship Race puts you on a grid start against 4 to 6 AI riders over 2, 3 or 5 laps of a 1.4 km stadium track. The track has lane splits, a double, a tabletop, a step-up, a triple, whoops, banked berms, tyre-stack and hay-bale obstacles, mud pits and cool-down zones.

Free-Ride: Hill Hop has no clock and no rivals. It's a 1.2 km open map with Hill Country, a Mega Ramp, bowls, the Dune Sea and scattered kickers. Keys 1 to 5 warp between areas.

### Controls

| Action | Keyboard | Gamepad |
| --- | --- | --- |
| Steer | ← → or A D | Left stick |
| Lean (air pitch, wheelie) | ↑ ↓ or W S | Left stick |
| Gas (if Auto-gas is off) | J or Z | A |
| Brake | K or X | X |
| Turbo | L or Shift | B, RB, RT |
| Pre-load | Space | Y, LB |
| Camera / reset / pause | C / R / Esc | Start |

Touch buttons appear on touch screens.

### How it plays

- The bike leaves the ground when the terrain drops away faster than gravity can follow, so ramp lips and sharp crests launch you.
- Tap pre-load just before a crest to compress the suspension and launch much higher.
- Lean in the air to set your landing angle. Land parallel to the slope for a speed boost. Landing rear wheel first costs speed. Landing front wheel first, or into the face of a landing, is a wipeout.
- Holding turbo heats the engine. A full gauge means 5 seconds at crawling speed. Blue cool-down zones reset the gauge instantly.
- Ruts are stamped into a render target and shaded with bump and parallax, so the racing lines deepen lap after lap. Roost, dust and mud spray are particles.
- Mud builds up on the bike and rider while you ride, more from mud pits, other riders' roost, hard landings and crashes.
- All textures are generated at load time: dirt, clay, grass, nylon, leather, brushed aluminium, grime and tyre knobs.
