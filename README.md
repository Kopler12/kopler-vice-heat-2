# VICE HEAT — GTA-Style Cover Art Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Kopler12/kopler-vice-heat-2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Kopler12/kopler-vice-heat-2/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

VICE HEAT turns your own photos into multi-panel, neon-soaked video-game
cover art — the kind of poster you'd expect from a sun-drenched open-world
crime saga set in a fictional vice city. Upload a handful of photos, arrange
them into a bold panel layout, grade them with a sunset or neon look, stamp
on a big caption, a tagline, wanted stars and a badge ribbon, then export a
crisp PNG ready to share.

Everything runs **offline in your browser**. No uploads to a server, no
network calls, no accounts — your photos never leave your machine. All
artwork, lettering and layouts are original; the app uses only system font
stacks and draws everything with Canvas 2D.

## Features

- **Four panel layouts**
  - *Six-Panel Cover Grid* — the classic 3×2 collage cover
  - *Hero + Trio* — one big hero panel with three supporting panels
  - *Duo Split* — a dramatic two-panel face-off
  - *Full-Bleed Poster* — a single cinematic panel
- **Photo handling**
  - Multi-file upload, plus two built-in sample photos so the editor is
    alive the moment it opens
  - Click a panel to select it, then assign any uploaded photo to it
  - Per-panel zoom and X/Y offset sliders
  - Drag directly on the canvas to reposition the selected panel's photo
  - "Fill all panels with one photo" mode for a single-photo cover
- **Four colour grades** (gradient overlays + contrast/saturation grading)
  - Sunset Boulevard, Neon Nights, Golden Hour, Midnight Chrome
- **Caption studio**
  - Editable title and tagline
  - Lettering styles: Blockbuster, Neon Script-ish, Outlined, Chrome
  - Wanted-stars selector (0–5 stars)
  - Optional badge ribbon text (e.g. "DELUXE EDITION")
- **Export**
  - PNG export at 1080×1080, 1080×1350 or 1920×1080
- **Screenshot modes** (used for the entry screenshots, handy for sharing)
  - `?shot=cover` — full-viewport landscape cover
  - `?shot=portrait` — 1080×1350 cover
  - `?shot=square` — 1080×1080 cover

## How to run

You need Node.js 22 (or any static file server).

```sh
node serve.ts
# then open http://localhost:8080/
```

`serve.ts` is a tiny zero-dependency static server for the `app/` folder.
Because the app is plain HTML/CSS/ES modules, you can also serve `app/`
with any other static file server.

## Project layout

```
app/
  index.html      — the single page
  style.css       — editor + shot-mode styling
  src/
    main.js       — editor UI wiring and state
    cover.js      — the Canvas 2D cover rendering engine
    shots.js      — screenshot-mode boot
  samples/        — two bundled sample photos
screenshots/      — four screenshots of the app in action
main.ts           — make.fun entry point (builds the dossier)
serve.ts          — local dev server
vendor/           — the make.fun app library (vendored, unmodified)
```

## How the entry is handed in

This repository is the source of a [make.fun](https://make.fun) entry for
the **gta6-cover-art-01** bounty. Running:

```sh
node main.ts
```

copies `app/` and `screenshots/` into the output directory
(`MAKEFUN_OUTPUT_DIR`, default `/output`) and writes a `dossier.json`
describing the entry, generated with the vendored make.fun library in
`vendor/makefun-app.ts`. The dossier, the app and the screenshots are what
get submitted for judging.

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Kopler12.
