## ADDED Requirements

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
