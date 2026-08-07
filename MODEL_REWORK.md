# Gameplay model rework

This branch adds a second rendering pass after `cartoon-art.js` and before `game.js`.

## What is replaced

- Ricky is redrawn with a dimensional pompadour, sideburns, tinted glasses, moustache/goatee, cigarette, gold chain, textured houndstooth shirt, and striped track pants.
- Bubbles is redrawn with a shorter silhouette, side-parted hair, oversized translucent glasses with visible eyes, shaded plaid fabric, and brown trousers.
- Julian is redrawn with a taller muscular silhouette, layered dark hair and beard, shaded black T-shirt, denim texture, work boots, arm hair, and his drink.
- The Shitmobile is redrawn as a worn cartoon station wagon with translucent windows, mismatched panels, faux-wood trim, rust, duct-tape repair, cart-cage front end, wheel detail, damaged-state cracks, and upgraded roof junk.

The same generated character drawings are used for the menu portraits, driver HUD portrait, and the live canvas gameplay model. The gameplay models are not separate mockups.

## Scale changes

The draw pass keeps the existing gameplay coordinates and bottom anchors, but reduces the visible art inside those bounds:

- Ricky: 72% of the old draw bounds.
- Bubbles: 70%.
- Julian: 73%.
- Shitmobile: 84%.
- Platforms: 88%.
- Axle: 86%.
- Weapons: 82–84%, right/bottom anchored so muzzles stay aligned.
- Human enemies: 72–74%.
- Raccoons: 70%.

## Files

- `toon-models.js`: character/vehicle rendering, portrait generation, live canvas interception, and scale anchoring.
- `toon-models.css`: smaller portrait framing and reduced uniform border weight.
- `index.html`: loads the new CSS and rendering pass before `game.js`.

## Intentional implementation choice

The models are drawn at runtime with layered Canvas paths, gradients, fabric patterns, hatching, reflections, material wear, and variable line weights. No gameplay rules, health values, abilities, enemy behavior, controls, or collision coordinates were changed.
