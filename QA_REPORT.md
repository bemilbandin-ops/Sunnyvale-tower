# QA report

## Flow tested

Menu -> select Bubbles -> start run -> spawn mixed targeting enemies -> collect six scrap -> add rocket deck -> destroy bottom chassis -> verify two surviving decks drop onto emergency axle.

## Results

- Page and menu rendered correctly.
- Character selection updated the driver and ability.
- Run began with two independently tracked layers.
- Construction modal appeared at six scrap.
- Rocket choice increased the stack from two to three layers.
- Bottom-layer destruction removed the chainsaw and chassis.
- Two remaining layers took 8% impact damage and dropped one position.
- Emergency axle appeared below the new bottom layer.
- No JavaScript, console, or asset-loading errors were detected.
- Desktop viewport tested at 1440×900.
- Mobile landscape viewport tested at 844×390.
- Portrait phones receive a rotate-device notice because the combat view is landscape-first.

## Browser method

The Browser plugin was not available. QA used the installed Python Playwright runtime with system Chromium. Local navigation was blocked by the environment, so Playwright loaded the fully inlined `play.html` content directly. This exercises the same CSS, JavaScript, and embedded runtime assets as the standalone deliverable.
