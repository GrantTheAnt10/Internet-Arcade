# Internet-Arcade

Open `index.html` in a browser to walk into the arcade. Everything runs from the files in this repo, with no build step and no server needed. To publish it, GitHub Pages serving the repo root works as is.

## The arcade

The page starts zoomed out on a row of cabinets.

- Browse with ← → (or A D), the on-screen arrows, the mouse wheel, by dragging with the mouse, or by swiping on a touch screen.
- Press Enter or click/tap a machine to play it. Clicking a machine that isn't selected selects it first.
- The camera then moves down to the coin door, a coin flips in and drops into the slot, the slot lights up, the marquee flashes and the screen shows CREDIT 01 before zooming in. Press Enter or tap again to skip it. With reduced motion turned on, it is skipped automatically.
- On a computer the camera zooms almost all the way into the cabinet, keeping the bezel on both sides of the screen, and the game's keyboard controls fade in underneath. Keys go straight to the game.
- On a phone the camera frames the screen and the control panel. The joystick, the four buttons and START on the cabinet are live and drive the game.
- ◀ ARCADE (top left) goes back to the room. In Hill Hop 64, Esc on the title screen does the same.

To add a machine, add an entry to `MACHINES` near the top of the script in `index.html`. Give it a `title`, two colours and a `src`. A game controlled by the cabinet's joystick and buttons needs to listen for the `hh-key` / `hh-start` / `hh-release` messages the way `HillHop64.html` does (search it for `EMBED`). Machines without a `src` show a "Coming soon" screen.

## The games

| Cabinet | File | What it is |
| --- | --- | --- |
| Star Rampart | `StarRampart.html` | Formation space shooter. Waves fly in and dive; bosses can capture your fighter with a tractor beam, and shooting the boss while it dives wins it back as a double ship. Every fourth stage is a challenge stage. |
| Hill Hop 64 | `HillHop64.html` | 3D arcade motocross (details below). |
| Brick Blitz | `BrickBlitz.html` | Breakout with tough, explosive and unbreakable bricks, sliding rows, six power-ups and a boss every sixth round. Mouse or keys move the paddle. |
| Street Legends | `StreetLegends.html` | One-on-one street fighter with four original fighters (Kaito, Mei, Brick, Vex), each with motion-input specials and a super, plus a shadow boss. Five stages: a mountain dojo, a neon avenue, a rainy back alley, sunset harbor docks and a subway platform. Arcade ladder against the CPU (three levels) and two-player versus. Specials and supers have one-button versions: SPECIAL (alone, or with ↓ or ←) and SUPER when the bar is full; the classic joystick motions still work too. |
| Skyline Skater | `SkylineSkater.html` | Rooftop skate runner: ollie gaps, grind rails, chain kickflips, grabs and 360s into combos. |
| Turbo Tanks | `TurboTanks.html` | Arena tank battle with ricochet shells, breakable walls, mines, a turbo dash and five enemy types. |

Every game also runs on its own: open the file directly. On a touch screen you get on-screen buttons, and high scores are kept in the browser. The five canvas games share a small kit in `src/games/kit.js`. To rebuild them after changing the sources, run:

```
python3 src/games/build.py .
```

That inlines the kit into each game, so every output file stays self-contained.

## iOS app

The **iOS app** workflow (`.github/workflows/ios.yml`) wraps the arcade in a full-screen iOS web view and builds an `.ipa` on a macOS runner. It runs on every push to `main` that touches the HTML or `ios/`, and you can also start it by hand from the Actions tab. Each run publishes a GitHub Release with the IPA attached. The newest one is always at:

https://github.com/GrantTheAnt10/Internet-Arcade/releases/latest/download/InternetArcade.ipa

The IPA is **unsigned**, because the build has no Apple signing certificate. Install it with a sideloading tool that signs it with your own Apple ID, such as [AltStore](https://altstore.io) or [Sideloadly](https://sideloadly.io). With a free Apple ID the install expires after 7 days and has to be refreshed. To make App Store or TestFlight builds instead, add your signing certificate and provisioning profile as repository secrets and switch the build step to `xcodebuild archive` plus `-exportArchive`.

The Xcode project is generated from `ios/project.yml` with [XcodeGen](https://github.com/yonaskolb/XcodeGen); the Swift wrapper is `ios/InternetArcade/AppDelegate.swift`.

## Hill Hop 64

An arcade motocross game in one file. Play it from the arcade, or open `HillHop64.html` on its own. It works offline, because three.js (r160, MIT) is inlined.

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

Touch buttons appear on touch screens when the game is opened on its own; inside the arcade the cabinet's buttons take over.

### How it plays

- The bike leaves the ground when the terrain drops away faster than gravity can follow, so ramp lips and sharp crests launch you.
- Tap pre-load just before a crest to compress the suspension and launch much higher.
- Landing assist (on by default, toggle it in the menu) eases the nose toward the slope you're about to land on whenever you let go of lean. Leaning overrides it, so flips still work.
- Lean in the air to set your landing angle. Land parallel to the slope for a speed boost. Landing rear wheel first costs speed. Landing front wheel first, or into the face of a landing, is a wipeout.
- Holding turbo heats the engine. A full gauge means 5 seconds at crawling speed. Blue cool-down zones reset the gauge instantly.
- Ruts are stamped into a render target and shaded with bump and parallax, so the racing lines deepen lap after lap. Roost, dust and mud spray are particles.
- Mud builds up on the bike and rider while you ride, more from mud pits, other riders' roost, hard landings and crashes.
- All textures are generated at load time: dirt, clay, grass, nylon, leather, brushed aluminium, grime and tyre knobs.
