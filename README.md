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
- Geist for text and Bricolage Grotesque for names and section titles (both bundled, OFL).
- Floating labels on simple text fields in edit views (`lib/float-labels.js`).

## Record view

Under the Arc theme, detail views of CRM entities use a two-column layout:

- **Band**: navy header with breadcrumbs, avatar (initials), name, key attributes
  (title, account, city…), record actions and, when the entity uses an active pipeline,
  the stage path (click a stage to move the record, if the user may edit the stage).
  An inactive pipeline only shows the current stage.
- **About** (left): the detail layout panels as a compact property inspector, then the
  default side panel (assigned user, teams, dates) and any other side panel.
- **Main column** (right): an **Activity** tab — quick actions (Note, Email, Call, Meeting,
  Task, each shown only if the native panel offers it), activities, tasks, history and the
  stream as a timeline — then one tab per relationship panel with its count. Tab breaks
  defined in the bottom panel layout group their panels under their label. Tabs that do not
  fit go to **More**.

It is applied by a `record/detail` view setup handler (`src/handlers/record-detail.js`) that
derives the side and bottom views configured for the entity instead of replacing them, so
entity-specific behaviour (lead conversion, etc.) is kept. Email and User keep the EspoCRM
layout, as do detail views shown in modals. Panel actions, inline editing and ACL are the
native ones.

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
    metadata/clientDefs/Global.json   record/detail view setup handler
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
    css/arc-detail.css                record view: band, inspector, main column tabs, timeline
    css/arc-overlays.css              dropdowns, modals, tooltips, alerts
    css/arc-login.css                 login page
    css/arc-float-labels.css          floating labels
    css/arc-iframe.css                rich text editor iframe
    res/templates/record/detail.tpl   record view template (band, inspector, main column)
    src/arc.js                        shared constants and helpers
    src/handlers/record-detail.js     applies the record view under the Arc theme
    src/helpers/record-band.js        band: identity and pipeline stage path
    src/mixins/detail-side.js         side view: activity panels move to the main column
    src/mixins/detail-bottom.js       bottom view: tabs, quick actions, counts
    lib/float-labels.js
    fonts/Geist-*.woff2, fonts/BricolageGrotesque-*.woff2 (+ OFL)
```
