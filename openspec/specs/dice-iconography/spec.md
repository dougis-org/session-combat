## Purpose

Provide a single vendored set of dice-face SVG icon components (d4/d6/d8/d10/d12/d20) sourced from game-icons.net, exposed as React components with a `DIE_ICONS` lookup and a shared `DieGlyph` component that pairs each icon with its always-visible die label, so every dice surface renders the same iconography.

## Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-08-20-dice-roll-enhancements/design.md) document, not a replacement.

### Requirement: Vendored dice-face icon set covers all supported die sizes

The system SHALL provide a vendored SVG icon component for each die size supported by `rollDie`/`rollDicePool` (d4, d6, d8, d10, d12, d20), sourced from game-icons.net (Delapouite and Skoll, CC BY 3.0), exposed as React components in a dedicated icon module.

#### Scenario: An icon component exists for every supported die size

- **WHEN** the icon module is inspected for the die sizes `[4, 6, 8, 10, 12, 20]`
- **THEN** a distinct icon component is exported (or resolvable via the lookup map) for each of those six sizes

#### Scenario: Icon component renders valid SVG markup

- **WHEN** any one of the six die-size icon components is rendered
- **THEN** it renders an `<svg>` element containing at least one path/shape node, with no console errors or warnings

### Requirement: Icon lookup by die size

The system SHALL expose a `DIE_ICONS` lookup (keyed by number of sides) mapping each supported die size to its icon component, so callers can select the correct icon given a `sides` value without a manual switch/if-else.

#### Scenario: Lookup returns the matching component for a given side count

- **WHEN** `DIE_ICONS[20]` is accessed
- **THEN** the returned value is the d20 icon component (the same component used to render a d20 elsewhere)

#### Scenario: Lookup covers exactly the supported die sizes

- **WHEN** the keys of `DIE_ICONS` are enumerated
- **THEN** they are exactly `4, 6, 8, 10, 12, 20` (no extra or missing entries)

### Requirement: Icon components are stylable like existing hand-rolled icons

The system SHALL implement each dice icon so it accepts the same `width`, `height`, and `className` props as the existing hand-rolled inline-SVG icons in `CampaignChat.tsx` (e.g. the pin icon), and SHALL use `currentColor` (or an equivalent prop-driven fill) so the icon's color follows its surrounding text/button color rather than being hardcoded.

#### Scenario: className is applied to the rendered SVG

- **WHEN** a dice icon component is rendered with `className="text-yellow-400"`
- **THEN** the rendered `<svg>` element carries that class

#### Scenario: Icon color follows currentColor by default

- **WHEN** a dice icon component is rendered without an explicit fill override, inside an element with a set text color
- **THEN** the icon's fill resolves to that surrounding text color (via `currentColor` or equivalent), not a hardcoded color value

### Requirement: Source attribution is present for the vendored icon set

The system SHALL include a visible attribution to game-icons.net and its contributing authors, satisfying the CC BY 3.0 license, co-located with the vendored icon source (e.g. a header comment in the icon module, or a project-level notice file referenced from it).

#### Scenario: Attribution text is present in the icon module

- **WHEN** the icon module's source file is inspected
- **THEN** it contains a comment (or a clear reference to a notice file) crediting "game-icons.net" and its authors and naming the CC BY 3.0 license

### Requirement: Shared die glyph component pairs each icon with a visible label

The system SHALL provide a shared presentational `DieGlyph` component that renders a die's vendored icon(s) together with a visible text label, used by every die control in both the chat-dock dice panel and the global dice fab so the icon/label pairing is defined in exactly one place.

- For `sides` in `{4, 6, 8, 10, 12, 20}`, `DieGlyph` SHALL render `DIE_ICONS[sides]` and the visible text label `d{sides}`.
- For the percentile variant (`sides = '%'`), `DieGlyph` SHALL render exactly two `DiceD10Icon`s and the visible text label `d%`.
- `DieGlyph` SHALL contain no roll or state logic.

#### Scenario: Standard die glyph renders matching icon and label

- **WHEN** `DieGlyph` is rendered with `sides = 20`
- **THEN** it renders the d20 icon component from `DIE_ICONS` and the visible text `d20`

#### Scenario: Percentile glyph renders two d10 icons and the d% label

- **WHEN** `DieGlyph` is rendered with the percentile variant
- **THEN** it renders exactly two `DiceD10Icon` components and the visible text `d%`

#### Scenario: Label is visible text, not only an attribute

- **WHEN** any `DieGlyph` is rendered
- **THEN** its label is present as rendered text content, not solely as a `title` or `aria-label`

### Requirement: DIE_ICONS keys are unchanged by percentile support

The system SHALL NOT add a d100 entry to `DIE_ICONS`; percentile support reuses the existing `DiceD10Icon`. The keys of `DIE_ICONS` SHALL remain exactly `4, 6, 8, 10, 12, 20`.

#### Scenario: Lookup still covers exactly the six die sizes

- **WHEN** the keys of `DIE_ICONS` are enumerated
- **THEN** they are exactly `4, 6, 8, 10, 12, 20` (no `100` entry added)

---

## Traceability

- Proposal element "Vendor a small set of dice-face SVG icons (d4/d6/d8/d10/d12/d20) from game-icons.net" → Requirements: Vendored dice-face icon set covers all supported die sizes; Icon lookup by die size
- Proposal element "Add the required attribution notice" → Requirements: Source attribution is present for the vendored icon set
- Design decision D1 (vendor as inline React components, not an npm package) → Requirements: Vendored dice-face icon set covers all supported die sizes
- Design decision D2 (new `lib/components/icons/dice.tsx` module with `DIE_ICONS` lookup) → Requirements: Icon lookup by die size
- Requirements → Tasks: see `openspec/changes/archive/2026-08-20-dice-roll-enhancements/tasks.md` (section 1)
