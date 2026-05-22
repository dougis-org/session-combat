## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED CombatStatsRow shared primitive

The system SHALL provide a `CombatStatsRow` component in `lib/components/CombatStatsRow.tsx` that renders AC and HP/maxHP as a labeled row, accepting `ac`, `acNote`, `hp`, and `maxHp` props.

#### Scenario: Renders AC and HP values

- **Given** `CombatStatsRow` is rendered with `ac={18}`, `hp={45}`, `maxHp={58}`
- **When** the component mounts
- **Then** the text "18" appears under an "AC" label and "45/58" appears under an "HP" label

#### Scenario: Renders acNote when provided

- **Given** `CombatStatsRow` is rendered with `ac={14}`, `acNote="leather armor"`, `hp={20}`, `maxHp={20}`
- **When** the component mounts
- **Then** "(leather armor)" appears adjacent to the AC value

#### Scenario: Renders without acNote when omitted

- **Given** `CombatStatsRow` is rendered with `ac={10}`, `hp={8}`, `maxHp={8}` and no `acNote`
- **When** the component mounts
- **Then** no parenthetical text appears next to the AC value

## MODIFIED Requirements

### Requirement: MODIFIED CreatureStatBlock uses CombatStatsRow internally

The system SHALL render `CombatStatsRow` within `CreatureStatBlock` for the AC/HP row, producing identical visual output to the previous inline implementation.

#### Scenario: CreatureStatBlock visual output unchanged after refactor

- **Given** `CreatureStatBlock` is rendered with `ac={16}`, `hp={30}`, `maxHp={30}` and full ability scores
- **When** the component mounts
- **Then** "16" appears under "AC" and "30/30" appears under "HP", identical to pre-refactor output

## REMOVED Requirements

_None._

## Traceability

- Proposal element "Extract CombatStatsRow from CreatureStatBlock" → Requirement: ADDED CombatStatsRow shared primitive
- Design decision 1 → Requirement: ADDED CombatStatsRow shared primitive
- Design decision 1 → Requirement: MODIFIED CreatureStatBlock uses CombatStatsRow internally
- Requirement: ADDED CombatStatsRow → Task: Create CombatStatsRow component
- Requirement: MODIFIED CreatureStatBlock → Task: Refactor CreatureStatBlock to use CombatStatsRow

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No visual regression in CreatureStatBlock consumers

- **Given** `CreatureStatBlock` is used in combat or encounter views
- **When** the refactored version renders
- **Then** AC and HP display is identical to the previous implementation with no layout shift
