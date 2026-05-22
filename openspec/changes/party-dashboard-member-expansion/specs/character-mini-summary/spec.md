## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED CharacterMiniSummary component

The system SHALL provide a `CharacterMiniSummary` component in `lib/components/CharacterMiniSummary.tsx` that renders a compact read-only character card showing name, race, characterType badge, class + level, AC, and HP.

#### Scenario: Renders full character identity and stats

- **Given** `CharacterMiniSummary` is rendered with `name="Aragorn"`, `race="Human"`, `characterType="character"`, `classes=[{class:"Fighter",level:5}]`, `ac={18}`, `hp={45}`, `maxHp={58}`
- **When** the component mounts
- **Then** "Aragorn", "Human", "Fighter", "Lv 5", "18" (AC), and "45/58" (HP) are all visible in the rendered output

#### Scenario: Renders NPC badge for characterType npc

- **Given** `CharacterMiniSummary` is rendered with `characterType="npc"`
- **When** the component mounts
- **Then** an "NPC" label or badge is visible, distinct from the name text

#### Scenario: Renders Companion badge for characterType companion

- **Given** `CharacterMiniSummary` is rendered with `characterType="companion"`
- **When** the component mounts
- **Then** a "Companion" label or badge is visible

#### Scenario: Renders no badge for characterType character

- **Given** `CharacterMiniSummary` is rendered with `characterType="character"` (or undefined)
- **When** the component mounts
- **Then** no NPC or Companion badge is rendered

#### Scenario: Multiclass level is summed across all classes

- **Given** `CharacterMiniSummary` is rendered with `classes=[{class:"Fighter",level:3},{class:"Rogue",level:2}]`
- **When** the component mounts
- **Then** "Lv 5" appears in the identity line

#### Scenario: Graceful render when race is undefined

- **Given** `CharacterMiniSummary` is rendered with `race={undefined}`
- **When** the component mounts
- **Then** the component renders without throwing; race displays as "—" or is omitted

#### Scenario: Graceful render when classes is empty

- **Given** `CharacterMiniSummary` is rendered with `classes={[]}`
- **When** the component mounts
- **Then** the component renders without throwing; no class/level line is shown

## MODIFIED Requirements

_None._

## REMOVED Requirements

_None._

## Traceability

- Proposal element "New CharacterMiniSummary component" → Requirement: ADDED CharacterMiniSummary component
- Design decisions 2, 3, 4 → Requirement: ADDED CharacterMiniSummary component
- Requirement: ADDED CharacterMiniSummary → Task: Create CharacterMiniSummary component

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No crash on partial character data

- **Given** `CharacterMiniSummary` is rendered with `race={undefined}` and `classes={[]}`
- **When** the component mounts
- **Then** it renders successfully with fallback values and does not throw a runtime error

### Requirement: Performance

#### Scenario: No network requests made by CharacterMiniSummary

- **Given** `CharacterMiniSummary` is rendered with all required props
- **When** the component mounts
- **Then** no `fetch` or HTTP requests are initiated by the component
