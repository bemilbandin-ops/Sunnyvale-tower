# Sunnyvale Survival — Stack Attack Prototype

A focused browser-game prototype for the vertically stacked rolling-fortress combat loop.

## What is implemented

- Maximum of three active layers for the prototype.
- The Shitmobile chassis begins as the bottom layer.
- Each layer owns independent health, a weapon, firing cooldown, and damage state.
- Starting weapons: close-range chainsaw and rapid nail gun.
- Build choices add bottle rockets, a propane flamethrower, or a returning boomerang deck.
- Runners and bruisers target the lowest layer.
- Raccoons climb toward the top layer.
- Bottle attackers target a random layer.
- Seizure agents target the most valuable mounted weapon.
- Destroying any layer removes its weapon and makes every layer above it drop down.
- Surviving layers take 8% impact damage and stop firing briefly during a collapse.
- If the Shitmobile is destroyed first, remaining platforms land on an emergency axle.
- Six-scrap construction stops allow a new deck, reinforcement, weapon replacement, or repairs.
- Ricky, Bubbles, and Julian have different active abilities.
- A phase-based government seizure captain ends the short run.
- Three-layer parallax background and faster road movement.

## Run the editable project

Start a static server in this directory:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

Add `?quick=1` for the shortened QA run.

## Standalone version

Open `play.html` directly. It contains the CSS, JavaScript, and runtime art as embedded data, so it does not require the surrounding folders.

## Controls

- `Space`: character ability
- `R`: repair the weakest surviving deck
- `B`: open construction when enough scrap has been collected
- `P` or `Escape`: pause
- The on-screen buttons support mouse and touch.

## Project structure

- `index.html` — editable page structure
- `styles.css` — interface and responsive styling
- `game.js` — all prototype gameplay systems
- `data/prototype.json` — central mechanic and balance summary
- `assets/characters` — cropped runtime character assets
- `assets/enemies` — cropped runtime enemy assets
- `assets/vehicle` — Shitmobile states
- `assets/layers` — modular platform art
- `assets/weapons` — mounted weapon art
- `assets/backgrounds` — parallax layers
- `assets/source` — original generated source sheets
- `build_standalone.py` — rebuilds `play.html`
- `screenshots` — QA evidence

## Scope note

This is the minimum useful prototype, not a finished content-complete game. It is intended to validate whether independent deck health, positional weapons, targeted attacks, construction, and collapse create the desired combat rhythm.

## Rights note

This is an unofficial technical prototype. Public or commercial use of third-party names, characters, settings, branding, or likenesses requires the appropriate rights and permissions.
