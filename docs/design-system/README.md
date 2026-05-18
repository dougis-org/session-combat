# Session Combat Design System

> A design system for **Session Combat** — a D&D 5e combat tracker and encounter manager that aims to keep the DM's hands on the table, not on the laptop. This system captures the look, feel, vocabulary, and component patterns of the live app so future designs (slides, mocks, marketing pages, new product surfaces) stay coherent with it.

## Source material

This design system was reverse-engineered from a single source of truth — the production Next.js codebase.

- **Repo:** [dougis-org/session-combat](https://github.com/dougis-org/session-combat) — Next.js 16 + TypeScript + Tailwind v4 + MongoDB. The README in that repo is the best plain-English description of what the product does.
- **The brand-relevant files we read in depth** (browse these for context beyond what this system codifies):
  - `app/page.tsx` — home / dashboard composition + admin panel pattern
  - `app/login/page.tsx` — auth screen pattern
  - `app/encounters/page.tsx` — list + inline editor pattern
  - `app/combat/page.tsx` — the heart of the product (104 KB, very dense)
  - `lib/components/CreatureStatBlock.tsx` — D&D 5e stat block treatment
  - `lib/components/Modal.tsx` — overlay chrome
  - `public/logo.svg`, `public/favicon.svg` — brand marks
- **Stack signal:** the entire app is `@import "tailwindcss"` with no custom theme. Every color/spacing/radius value below maps to a stock Tailwind token, so the system is "Tailwind-first" — designers can stay in Tailwind tokens and stay correct.

If you have direct access to the repo, **read `app/combat/page.tsx`** before designing anything that touches active combat. It is the single most opinionated UI in the product and dictates how every secondary screen feels.

---

## Product context

Session Combat is for **Dungeon Masters running live tabletop sessions**. The user is sitting at a table with a group of friends, a screen, and a stack of dice — they need a tool that disappears into the table.

The product surfaces:

| Route          | What it does                                                              |
|----------------|---------------------------------------------------------------------------|
| `/`            | Home — five big tiles into the other tools                                |
| `/login`       | Email + password auth                                                     |
| `/characters`  | Manual + D&D Beyond character import                                      |
| `/parties`     | Group characters into parties                                             |
| `/monsters`    | Browse the SRD monster library (32+) and create custom monsters           |
| `/encounters`  | Build encounters by combining monsters + descriptions                     |
| `/combat`      | **The combat tracker** — initiative, HP, conditions, lair, legendary, etc |

Only one product surface exists today (the web app). No marketing site, no mobile app, no docs site.

---

## Content fundamentals

The voice of the product is a **DM's clipboard** — terse, imperative, present-tense, in the second person, written for someone who already speaks D&D 5e.

### Tone & casing

- **Imperative for actions.** "Roll Initiative", "Next Turn", "End Combat", "Add New Encounter", "Start Combat". Never "Let's roll initiative!" or "Roll the dice now".
- **Second-person and possessive for ownership.** "Manage your characters and stats", "your encounters", "your campaign".
- **Title Case** for buttons and section headings. **Sentence case** for body copy and descriptions ("Manage encounters and monsters").
- **No exclamation marks** in normal product copy. Errors and toasts are stated flatly.
- **No emoji.** None. The product uses zero emoji as iconography or accent. (See ICONOGRAPHY below.)

### Jargon — use freely, do not explain

The audience is fluent in D&D 5e SRD vocabulary. Use it as-is. Do not gloss.

> Initiative · HP · AC · DEX · STR · CON · INT · WIS · CHA · CR · SRD · Hit Dice ·
> Saving Throw · Bonus Action · Reaction · Legendary Action · Lair Action · Recharge ·
> Round · Turn · Encounter · Party · Combatant · Concentrating · Bloodied · Down

### Microcopy examples (lifted from the codebase)

- Button labels: `+ Add Party Member` · `+ Add Enemy` · `+ Add Lair` · `Roll Initiative` · `Next Turn` · `Restart Round` · `End Combat` · `Start Combat` · `Save Encounter` · `Back to Home`
- Empty states: *"No encounters yet. Create one to get started!"* · *"No monsters added yet."* · *"No combatants match the selected filter."*
- Inline meta: *"HP: 88/88, AC: 17, DEX: 14"* — compact, comma-separated, abbreviation-first.
- Errors: *"Need at least one character"* · *"Failed to save combat state"* · *"Conditions expired: • Goblin 2: Frightened"*
- Tagline: *"A simple combat tracker for D&D sessions"* (centered under the home grid). Note the word **simple** — humility is part of the brand voice.

### Things to avoid

- **No "epic" / "adventure" / "embark" marketing language.** Session Combat is a tool, not a storefront.
- **No "Oops!" or "Sorry!".** Errors state the problem.
- **No celebratory copy** — "Awesome!", "Great choice!", "You're all set!" all feel wrong here.
- **Don't write for new players.** Document explains how to import a D&D Beyond character but does *not* explain what HP is.

---

## Visual foundations

The aesthetic is **mission-control for a fantasy game**: a dark, dense, high-contrast UI where every pixel earns its keep. Think audio mixing console, not parchment scroll.

### Color

A pure **Tailwind dark stack**, no custom palette layered on top.

| Token              | Hex       | Tailwind        | Role                                                |
|--------------------|-----------|-----------------|-----------------------------------------------------|
| `--sc-bg`          | `#0a0a0a` | `gray-950`      | Footer / chrome                                     |
| `--sc-surface-0`   | `#111827` | `gray-900`      | Page background                                     |
| `--sc-surface-1`   | `#1f2937` | `gray-800`      | Cards, panels                                       |
| `--sc-surface-2`   | `#374151` | `gray-700`      | Inputs, sub-cards, ghost button                     |
| `--sc-surface-3`   | `#4b5563` | `gray-600`      | Ghost-hover, disabled button                        |
| `--sc-fg-1..4`     | white → `gray-500` | —     | Four-step text ramp                                 |
| **Party**          | `#2563eb` / `#60a5fa` | `blue-600` / `blue-400` | Players, primary actions, links            |
| **Enemy**          | `#dc2626` / `#f87171` | `red-600` / `red-400`   | Monsters, delete, logout, "End Combat"     |
| **Lair / Library** | `#9333ea` / `#c084fc` | `purple-600` / `purple-400` | Lair actions, "(from library)" indicator |
| **Go**             | `#16a34a` | `green-600`     | Save, Start Combat, Next Turn, HP increments        |
| **Initiative**     | `#facc15` | `yellow-400`    | Initiative number, active-turn ring, "Initiative Order" header |

The **role colors are semantic, not decorative.** Blue is always "the party / something good for the player". Red is always "the monster / something destructive". Never use red for a save button.

See `colors_and_type.css` for the full token set including the HP ramp (green → yellow → red as the bar drops).

### Type

The product type family is **IBM Plex** — three matched companions across one foundry:

- **IBM Plex Sans** — the default for all UI. Slightly mechanical humanist; reads as "instrument panel" rather than "marketing site". Excellent at the small/dense sizes the app actually uses.
- **IBM Plex Mono** — dice notation, HP values inline, init chips, build version. Designed alongside the Sans, so they look intentionally paired (not just thrown together).
- **IBM Plex Serif** — reserved for lore moments, encounter descriptions in long-form view, and print/PDF exports. Currently unused in the production UI; available when needed.

All three load from Google Fonts via `colors_and_type.css`. Weights shipped: 400 / 500 / 600 / 700, plus italic 400 on the Serif. Fallbacks degrade to system sans / Georgia / `ui-monospace`.

| Step      | Size    | Weight | Use                                |
|-----------|---------|--------|------------------------------------|
| `4xl`     | 36 / 1.15 | 700 | Page hero ("D&D Session Combat Tracker") |
| `3xl`     | 30 / 1.2  | 700 | Page title ("Encounters")          |
| `2xl`     | 24 / 1.25 | 700 | Panel heading ("Create Encounter") |
| `xl`      | 20      | 600    | Card title ("Initiative Order")    |
| `lg`      | 18      | 600    | Section ("Admin Tools")            |
| `base`    | 16      | 400    | Body                               |
| `sm`      | 14      | 500    | Inline meta ("HP 88/88, AC 17…")   |
| `xs`      | 12      | 400    | Chrome (footer version, timestamps) |

Mono (`IBM Plex Mono`) is used for **dice notation, HP values inline, the init chip on the active combatant, and the build version in the footer**. Don't use mono for body text.

### Spacing & layout

- **4 px base grid.** Card padding is `p-4` (16) or `p-6` (24). Stack gaps are `space-y-2` (8) or `space-y-4` (16).
- **Container width:** `container mx-auto px-4 py-8` — Tailwind container, ~1100 px max.
- **Card** = `bg-gray-800 rounded-lg p-4`. That's the default shape of almost everything.
- **Sub-card / row** = `bg-gray-700 rounded p-2` or `p-3`. Used for monster rows inside encounters, ability score cells, action descriptions inside monster details.

### Radius

| Token       | Value | Use                              |
|-------------|-------|----------------------------------|
| `rounded`   | 4 px  | Buttons, inputs, sub-cards       |
| `rounded-lg`| 8 px  | Cards, panels, modals            |
| `rounded-full` | pill | Role tags, condition badges, init chip exception (8px) |

No "soft" 12–16 px radii. No pill-shaped buttons. Square-ish corners reinforce the "console" feel.

### Elevation & borders

**The system is mostly flat.** Depth comes from *surface contrast* (gray-900 → 800 → 700) rather than shadow.

- Cards have no shadow by default.
- Modals use `shadow-lg` and float over a 50%-black scrim.
- **Active items use a 2 px ring**, not a glow:
  - Active combatant: `border-2 border-yellow-400`
  - In-edit encounter: `border-2 border-blue-500`
- A 1 px `border-gray-700` divider is used between cards in long lists and for `border-b` separators inside cards.

### Backgrounds & imagery

- **No background images.** No parchment textures, no fantasy art, no patterns.
- **No gradients** anywhere in the UI. (The logo SVG contains gradients, but those stay inside the mark.)
- The flat dark surface is the brand. Resist the urge to add atmosphere.

### Animation

Restrained.

- `transition-colors` on every button (~120 ms ease). That's it.
- HP bar fill animates width on change (~200 ms ease).
- No spring physics, no parallax, no scroll-driven animation, no entrance choreography, no "celebration" moments.
- The only "alive" UI is the active-turn ring; everything else is static until acted upon.

### Hover & press states

- **Buttons** swap one shade darker on hover. `blue-600 → blue-700`. `red-600 → red-700`. `green-600 → green-700`. `purple-600 → purple-700`. `gray-700 → gray-600`. No opacity dimming, no scale change, no shadow grow.
- **Cards that link** (home tiles, encounter list rows) swap `bg-gray-800 → bg-gray-700` on hover.
- **Disabled** buttons collapse to `bg-gray-600` with `cursor: not-allowed`.
- **Focus** on inputs = a 1 px `border-blue-500` ring inside the input, no outer glow.
- **No active/press state** is defined in the codebase — the hover state is the press state.

### Transparency & blur

Used **sparingly and only for overlays**:

- Modal scrim: `bg-black bg-opacity-50` (no blur).
- Admin tool result panel: `bg-blue-900 bg-opacity-50`.
- This design system's UI-kit harness uses `backdrop-filter: blur()` for its top switcher bar, but that bar is *not part of the product* — it's just chrome for the kit.

Don't use blur in the product itself.

### Cards — anatomy

The canonical card is a **flat dark slab**: rectangular-ish (8 px corners), `bg-gray-800`, padded `p-4` or `p-6`, no shadow, no border unless active. Title at `text-xl font-semibold`, meta at `text-sm text-gray-400`, dividers as `border-b border-gray-700`. See `preview/comp-combatant-card.html` for the most expressive variant.

---

## Iconography

**Almost no icons.** This is one of the most distinctive things about the product visually.

- **Hand-drawn SVG.** The only two iconographic assets in the entire codebase are `public/logo.svg` and `public/favicon.svg` — both bespoke (crossed swords + fireball). Both are in `assets/`.
- **One inline SVG** in `app/combat/page.tsx`: a single info-circle (Heroicons-style, fill, 20×20, `viewBox="0 0 20 20"`) used to disclose the encounter description. This is the **only** Heroicon-flavored mark in the app.
- **No icon font, no Lucide, no Heroicons import, no SVG sprite.** UI affordances are conveyed by **words on buttons** ("+ Add Party Member") and **color/role coding** instead.
- **No emoji.** Confirmed — `grep` for emoji in `app/` returns nothing. The closest things to symbolic glyphs in the UI:
  - `▼` (U+25BC) for the Admin Tools collapse caret
  - `×` (U+00D7) for modal close
  - `•` (U+2022) bullet in toasts ("• Goblin 2: Frightened")
  - `+` / `−` plain ASCII in HP steppers and "+ Add" buttons.
- **No icon-only buttons.** Every actionable button has a text label. Combat actions add a `▸` arrow after a verb ("Next ▸") but never strip the verb out.

### Rules for adding icons going forward

If a future surface genuinely needs a glyph:

1. **First** check whether a word will do. It almost always will.
2. If not, use a single Heroicons-fill 20×20 inline SVG with `fill="currentColor"`, matching the one existing instance.
3. Never introduce an icon library, never adopt emoji, never draw bespoke decorative icons that aren't the logo.

The logo itself is the brand's only true illustrative moment — keep it that way.

---

## Index — what's in this repo

```
README.md                      ← this file
SKILL.md                       ← portable Agent Skill manifest
colors_and_type.css            ← all design tokens as CSS variables + utility classes
assets/
  logo.svg                     ← crossed-swords + fireball mark (1000×1000 viewBox)
  favicon.svg                  ← simplified mark for 16×16 favicon
preview/                       ← Design-System tab cards (registered, 700-wide)
  colors-surfaces.html
  colors-foreground.html
  colors-roles.html
  colors-hp-status.html
  type-scale.html
  type-families.html
  spacing-radius.html
  elevation-borders.html
  comp-buttons.html
  comp-inputs.html
  comp-pills.html
  comp-ability-grid.html
  comp-combatant-card.html
  brand-logo.html
  brand-voice.html
ui_kits/
  session-combat/
    index.html                 ← interactive kit (login → home → encounters → monster → combat)
    primitives.jsx             ← Button, Pill, Input, Card, HpBar, InitChip, AbilityScores, Logo, …
    screens.jsx                ← LoginScreen, HomeScreen, EncountersScreen, CombatScreen
    MonsterScreen.jsx          ← Full SRD-style stat block view
```

The **Design System** tab of this project picks up everything in `preview/` and `ui_kits/<product>/index.html` automatically — grouped into Colors, Type, Spacing, Components, Brand.

---

## Caveats & open questions

- **Type family is a new opinion.** The production codebase ships system fonts; this design system commits to **IBM Plex** as the canonical family. To bring the live app in line, add the Google Fonts import to `app/layout.tsx` and set `font-family: "IBM Plex Sans"` in `app/globals.css` (and `font-mono: "IBM Plex Mono"`). Until that ships, mocks built off this system will look slightly more characterful than the running app.
- **Icon strategy is "none".** Documented as a deliberate choice, but if the product grows it may need a small Heroicons subset. The system is ready for that.
- **No marketing site, no mobile app.** Only one product surface is captured. Future surfaces (landing page, docs, mobile) will need a sister UI kit and may invite a slightly looser version of these rules.
- **Logo is functional, not refined.** The crossed-swords + fireball SVG works at any size but is hand-coded SVG rather than a designer-finalized mark. Strong candidate for v2.

If you're going to design with this system, **read `app/combat/page.tsx` in the source repo** before you do anything that touches active combat — that file dictates the rhythm of the whole product.
