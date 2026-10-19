# Arc Theme for EspoCRM

An [EspoCRM](https://www.espocrm.com) theme based on the [Arc design system](https://uiarc.dev) ([arc-library](https://github.com/kuratlielia/arc-library)).

Two variants:

- **Arc** — light: white surfaces, near-black ink accent, lavender-to-peach gradient signature.
- **Arc Dark** — dark: `#141414` canvas, violet `#a78bff` accent.

## Features

- Overlay architecture: imports the stock EspoCRM `light`/`dark` stylesheet, then redefines ~200 CSS custom properties with Arc tokens (neutrals, status colors, radii, shadows, tracking).
- Pill labels, 10px control radius, 16px panel radius, 22px login card radius.
- Frosted backdrop on modals (blur + light veil).
- Login page with the Arc gradient signature.
- Inter font (already bundled with EspoCRM).
- No JS — pure CSS theme, no core overrides.

## Install (dev)

```bash
cd arc-theme
npm install
npm run sync          # copy src/files -> ../site
npm run clear-cache   # docker compose exec web php clear_cache.php
```

Then select **Arc** or **Arc Dark** in user Preferences (or Administration > System).

## Package

```bash
npm run extension     # build/*.zip
```

## Structure

```
src/files/custom/Espo/Modules/ArcTheme/Resources/
    module.json
    metadata/themes/Arc.json, ArcDark.json
    i18n/en_US/Global.json, fr_FR/Global.json
src/files/client/custom/modules/arc-theme/css/
    arc.css, arc-dark.css          entry points
    arc-tokens.css                 Arc design tokens
    arc-vars-light|dark.css        EspoCRM variable overlays (surfaces, text)
    arc-components-light|dark.css  buttons, inputs, brand
    arc-chrome-light|dark.css      navbar, modals, panels, dropdowns, states
    arc-style.css, arc-style-dark.css  component refinements + login gradient
    arc-iframe.css, arc-dark-iframe.css
```
