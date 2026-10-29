# Arc Theme for EspoCRM

A light EspoCRM theme with a modern SaaS look, built on the UTT palette
(Bleu UTT `#292B6B` for actions, Cyan `#00B6ED` as a signature accent).

## Features

- Overlay architecture: imports the stock EspoCRM `light` stylesheet, then redefines its CSS custom properties from a small set of Arc tokens.
- Light sidebar with a gradient marker on the active tab; translucent top bar.
- Lists and panels as bordered cards, sentence-case column headers, tabular numbers.
- Status badges with a leading dot and soft tinted backgrounds (WCAG AA contrast).
- One primary action per page header (Create); other actions stay secondary.
- Keyboard focus ring on interactive elements, focus halo on fields, reduced-motion support.
- Geist font (bundled).
- Floating labels on simple text fields in edit views (`lib/float-labels.js`).

## Install (dev)

```bash
cd arc-theme
npm install
npm run sync          # copy src/files -> ../site
npm run clear-cache   # docker compose exec web php clear_cache.php
```

Then select **Arc** in user Preferences (or Administration > User Interface).
The login page uses the system theme, so it only shows the Arc style when Arc is the system default.

## Package

```bash
npm run extension     # build/*.zip
```

The CSS files imported by `arc.css` and `arc-iframe.css` carry `?v=<version>` so browsers
do not keep stale copies: bump it together with `package.json` on every release.

## Structure

```
src/files/custom/Espo/Modules/ArcTheme/Resources/
    module.json
    metadata/themes/Arc.json          theme params, chart and calendar colors
    metadata/app/client.json          float-labels script
    i18n/en_US/Global.json, fr_FR/Global.json
src/files/client/custom/modules/arc-theme/
    css/arc.css                       entry point
    css/arc-tokens.css                Arc tokens (neutrals, brand, states, radii, shadows)
    css/arc-espo-vars.css             EspoCRM variables mapped to tokens
    css/arc-base.css                  typography, links, focus, scrollbars
    css/arc-shell.css                 sidebar, top bar, page header
    css/arc-controls.css              buttons, fields, button groups
    css/arc-data.css                  list cards, tables, badges
    css/arc-record.css                panels, detail fields, tabs
    css/arc-overlays.css              dropdowns, modals, tooltips, alerts
    css/arc-login.css                 login page
    css/arc-float-labels.css          floating labels
    css/arc-iframe.css                rich text editor iframe
    lib/float-labels.js
    fonts/Geist-*.woff2
```
