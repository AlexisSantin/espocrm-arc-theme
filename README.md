# Arc Theme for EspoCRM

A light EspoCRM theme with a modern SaaS look, built on the UTT palette
(Bleu UTT `#292B6B` for actions, Cyan `#00B6ED` as a signature accent).

## Features

- Overlay architecture: imports the stock EspoCRM `light` stylesheet, then redefines its CSS custom properties from a small set of Arc tokens.
- Light palette ("Clair"): white sidebar and an ice-blue record band with dark text, cyan glow and cyan marker on the active tab. Band and sidebar colours are tokens; the ink palette of 0.8.0 is in the git history.
- Lists and panels as bordered cards, sentence-case column headers, tabular numbers.
- Status badges with a leading dot and soft tinted backgrounds (WCAG AA contrast).
- One primary action per page header (Create); other actions stay secondary.
- Keyboard focus ring on interactive elements, focus halo on fields, reduced-motion support.
- One typeface, Lexend (designed for reading, bundled, OFL), for text and titles alike. Labels use the same size as values; record links are coloured so what is clickable stands out.
- Dialogs keep EspoCRM's side panel; records opened in it keep a margin so their cards are not cut by the panel edge. Dashboard blocks lift on hover.
- Accessibility (RGAA / WCAG 2.1 AA): text contrast ≥ 4.5:1 and form field borders ≥ 3:1, visible keyboard focus on dark areas, reduced motion, record name as the page heading, pipeline steps wrap instead of being cut, document language and zoom restored (`src/handlers/page-a11y.js`). Band and sidebar colours are tokens (`--arc-band-*`, `--arc-sidebar-*`).

## Record view

Under the Arc theme, detail views of CRM entities use a two-column layout:

- **Band**: full-width ink-blue gradient with a cyan glow, painted on the page background over the measured band
  height (it runs under the top bar, reaches both screen edges even when the content is
  centered on wide screens, and the cards overlap its lower edge), with breadcrumbs,
  name, assigned user(s) and teams (plain chips, not links),
  record actions and, when the entity uses an active pipeline, the stage path (click a
  stage to move the record, if the user may edit the stage). An inactive pipeline only
  shows the current stage.
- **About** (left, 380px): the detail layout panels as a compact property inspector — tab
  breaks become compact pill tabs, empty fields are hidden behind a "Show N empty fields" link
  (all shown while editing) — and then the default side panel (assigned user, teams, dates) as its own card, and
  the other side panels — activities, history, tasks — as separate cards. When the bottom
  layout also lists them, they are not repeated. Static fields on the left, activity on the right.
- **Main column** (right): an **Activity** tab — quick actions (Note, Email, Call, Meeting,
  Task, each shown only if the native panel offers it), then the stream as a timeline — then
  one tab per relationship panel with its count. Tab breaks
  defined in the bottom panel layout group their panels under their label. Tabs that do not
  fit go to **More**.

A handle between the two columns sets the width of About (drag, or arrow keys / Home / End when focused; double-click resets): 300 to 720 px, the main column keeps at least 480 px. The width is kept per user in the browser.

Every block (About, side panels, layout panels) collapses like an accordion: chevron or title click.
The state is kept per user and record type in the browser; all blocks are open while editing.

The cyan corner bracket is the Arc signature: it marks the About card, the quick
actions, list cards and the login card.

It is applied by a `record/detail` view setup handler (`src/handlers/record-detail.js`) that
derives the bottom view configured for the entity instead of replacing it; the side view is
EspoCRM's own, so entity-specific behaviour (lead conversion, etc.) is kept. Email and User keep the EspoCRM
layout, as do detail views shown in modals. Panel actions, inline editing and ACL are the
native ones. Entities with a rich text `body` (knowledge base articles) use a content variant:
their fields sit at the top of the main column, full width. If the handler cannot apply (an unexpected EspoCRM version, for example), the
record keeps the EspoCRM layout instead of failing; the module imports no EspoCRM client module.

## Install

Requires EspoCRM 10.0 or later and PHP 8.3+ (tested on 10.0.3 and 10.0.11).

1. Download `arc-theme-<version>.zip` from the GitHub release.
2. In EspoCRM: **Administration > Extensions > Upload**, choose the ZIP, then **Install**.
3. Select **Arc** in **Administration > User Interface > Theme** (system default, also used on
   the login page) or per user in **Preferences**.

Updates install the same way, over the previous version.

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

The module is bundled: in production EspoCRM loads `lib/module-arc-theme.js` through
`lib/init.js`, which `app/client.json` lists in `scriptList` (developer mode loads the
transpiled sources instead, so test a release on an instance with developer mode off).

## Structure

```
src/files/custom/Espo/Modules/ArcTheme/Resources/
    module.json
    metadata/themes/Arc.json          theme params, chart and calendar colors
    metadata/app/client.json          lib/init.js (bundle loader, production)
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
    css/arc-iframe.css                rich text editor iframe
    res/templates/record/detail.tpl   record view template (band, About with fields, main column)
    res/templates/record/detail-content.tpl  variant for articles (fields in the main column)
    src/arc.js                        shared constants and helpers
    src/handlers/record-detail.js     applies the record view under the Arc theme
    src/helpers/record-band.js        band: identity, people, pipeline stage path, page background
    src/helpers/empty-fields.js       hides empty fields in the inspector, with a toggle
    src/handlers/page-a11y.js         document language and zoom (list, detail, edit, login)
    src/helpers/column-resizer.js     handle that sets the width of About
    src/helpers/panel-collapse.js     collapsible blocks (accordions), state kept per user and entity
    src/mixins/detail-bottom.js       bottom view: tabs, quick actions, counts
    fonts/Lexend-*.woff2 (+ OFL)
```
