# 🕹 Internet Arcade

A dark, neon-themed arcade website where you can click on classic arcade machine cabinets and play the games right in your browser – powered by the [Internet Archive's Internet Arcade](https://archive.org/details/internetarcade).

---

## 🎮 How to View / Play

### Option 1 – Open locally in Google Chrome (fastest)

No server or install needed. Just:

1. Click the green **Code** button on this GitHub page and choose **Download ZIP**.
2. Unzip the downloaded file anywhere on your computer.
3. Open the unzipped folder, then **double-click `index.html`**.
4. Chrome opens the arcade automatically – click any cabinet to play!

> **Tip:** If game thumbnails don't load, that's normal when opening as a local file because the images come from archive.org. The games still launch fine when you click a cabinet.

---

### Option 2 – Host it free on GitHub Pages (shareable public URL)

GitHub Pages turns this repo into a live website at  
**`https://madbaby523.github.io/Internet-Arcade/`**

#### One-time setup (takes ~2 minutes)

1. Go to your repository on GitHub: `https://github.com/Madbaby523/Internet-Arcade`
2. Click **Settings** (top tab row).
3. In the left sidebar click **Pages**.
4. Under **Source** choose **GitHub Actions**.
5. Click **Save**.

That's it! The workflow in `.github/workflows/deploy.yml` will automatically deploy the site every time you push to the `main` branch.

#### After setup

- Open `https://madbaby523.github.io/Internet-Arcade/` in any browser.
- Share that link with anyone – no sign-in required.
- Every time you push changes to `main`, the site updates in ~1 minute.

> The deployment status is shown in the **Actions** tab of your repository.

---

## 🗂 Project Files

| File | What it does |
|---|---|
| `index.html` | Page structure – header, cabinet grid, game modal |
| `styles.css` | Dark neon theme, scanlines, glow animations |
| `script.js` | Renders cabinets, opens games in a pop-up modal |
| `.github/workflows/deploy.yml` | Auto-deploys to GitHub Pages on push to `main` |

---

## 🕹 Games Included

Pac-Man · Ms. Pac-Man · Galaga · Dig Dug · Donkey Kong · Defender · Frogger · Centipede · Asteroids · Missile Command · Tron · Q\*bert · BurgerTime · Joust · Zaxxon · Stargate

All games are played via the Internet Archive's free MAME emulator – no downloads required.

---

## 🎯 Controls (once a game loads)

Most games use the keyboard:

| Key | Action |
|---|---|
| Arrow keys | Move / joystick |
| `1` | Insert coin / start 1-player game |
| `2` | Start 2-player game |
| `5` | Insert coin (alternate) |
| `Ctrl` | Fire / action button |
| `Esc` or click outside | Close the game and return to the arcade |

> Press **`C`** anywhere on the main page to see the coin counter easter egg!
