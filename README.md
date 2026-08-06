# Sunnyvale Stack Attack — unified cartoon rework

This branch keeps the three-layer rolling-fortress prototype and replaces the mixed visual styles with one consistent cartoon rendering system.

## What changed

- New cartoon SVG portraits for Ricky, Bubbles, and Julian.
- Cartoon-drawn Shitmobile, decks, weapons, enemies, boss, and parallax scenery.
- Consistent bold outlines, simplified proportions, flat cel shading, and shared palette.
- Active gameplay no longer displays the earlier realistic background, vehicle, or enemy sprite sheets.
- UI panels, buttons, health bars, cards, and modals now use the same illustrated design language.
- Existing stack combat, per-layer HP, collapse, construction, character abilities, and boss systems are preserved.

## Run

Start a static server in the repository:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

Add `?quick=1` for the shortened QA run.

## Controls

- Space: character ability
- R: repair weakest deck
- B: open construction when enough scrap is available
- P or Escape: pause

## Main implementation files

- `index.html` — app structure and script/style loading
- `styles.css` — original layout foundation
- `cartoon-theme.css` — unified cartoon UI theme
- `game.js` — gameplay systems
- `cartoon-art.js` — coherent canvas rendering layer
- `assets/characters/*.svg` — cartoon character portraits
- `ART_DIRECTION.md` — visual consistency rules
- `build_standalone.py` — creates `play-standalone.html`

`play.html` redirects to `index.html`, preventing it from drifting into an outdated embedded build. Run `python3 build_standalone.py` when a self-contained HTML export is needed.
