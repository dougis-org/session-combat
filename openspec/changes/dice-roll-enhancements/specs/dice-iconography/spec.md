## ADDED Requirements

### Requirement: Vendored dice-face icon set covers all supported die sizes

The system SHALL provide a vendored SVG icon component for each die size supported by `rollDie`/`rollDicePool` (d4, d6, d8, d10, d12, d20), sourced from game-icons.net (Delapouite, CC BY 3.0), exposed as React components in a dedicated icon module.

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

The system SHALL include a visible attribution to game-icons.net and the Delapouite author, satisfying the CC BY 3.0 license, co-located with the vendored icon source (e.g. a header comment in the icon module, or a project-level notice file referenced from it).

#### Scenario: Attribution text is present in the icon module

- **WHEN** the icon module's source file is inspected
- **THEN** it contains a comment (or a clear reference to a notice file) crediting "game-icons.net" and "Delapouite" and naming the CC BY 3.0 license
