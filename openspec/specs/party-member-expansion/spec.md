## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Party card groups members by characterType

The system SHALL render party members in the party list card grouped into sections by `characterType` (Player Characters, Travelling NPCs, Companions), each member displayed as a `CharacterMiniSummary`. Groups with no members SHALL be hidden.

#### Scenario: Party with all three types renders three sections

- **Given** a party whose members include 2 characters with `characterType="character"`, 1 with `characterType="npc"`, and 1 with `characterType="companion"`
- **When** the party card is rendered on the parties page
- **Then** three labelled sections are visible: "Player Characters" (2 cards), "Travelling NPCs" (1 card), and "Companions" (1 card)

#### Scenario: Party with only player characters renders one section

- **Given** a party whose members all have `characterType="character"` (or no `characterType` set)
- **When** the party card is rendered
- **Then** only the "Player Characters" section is visible; "Travelling NPCs" and "Companions" sections are not rendered

#### Scenario: Party with NPCs and no PCs hides the PC section

- **Given** a party whose members all have `characterType="npc"`
- **When** the party card is rendered
- **Then** only the "Travelling NPCs" section is visible; "Player Characters" and "Companions" sections are not rendered

#### Scenario: Each member card shows name, race, class, level, AC, HP

- **Given** a party member character with known name, race, class, level, AC, and HP
- **When** the party card is rendered
- **Then** all six fields are visible within that member's mini-summary card

#### Scenario: Party with zero members shows no member sections

- **Given** a party with `characterIds: []`
- **When** the party card is rendered
- **Then** no member sections are rendered (existing empty-member behavior preserved)

#### Scenario: Member with no characterType defaults to Player Characters

- **Given** a party member character with `characterType` undefined
- **When** the party card is rendered
- **Then** that member appears in the "Player Characters" section

## MODIFIED Requirements

### Requirement: MODIFIED Party card member display replaces comma list

The system SHALL no longer render party members as a comma-separated name string. Member display is replaced by the grouped `CharacterMiniSummary` sections described above.

#### Scenario: Comma-separated name list is no longer rendered

- **Given** a party with three members
- **When** the party card is rendered
- **Then** no comma-joined name string appears; members appear only in grouped `CharacterMiniSummary` cards

## REMOVED Requirements

_None._

## Traceability

- Proposal element "Party list grouped member display" → Requirement: ADDED Party card groups members by characterType
- Proposal element "Party card replaces getCharacterNames()" → Requirement: MODIFIED Party card member display replaces comma list
- Design decision 5 → Requirement: ADDED Party card groups members by characterType
- Design decision 5 → Requirement: MODIFIED Party card member display replaces comma list
- Requirement: ADDED Party card groups members → Task: Update party list card rendering
- Requirement: MODIFIED Party card member display → Task: Update party list card rendering

## Non-Functional Acceptance Criteria

**Requirement: Performance**

#### Scenario: No additional network requests when rendering grouped party members

- **Given** the parties page has loaded all character and party data
- **When** party cards render grouped member sections
- **Then** no additional `fetch` or HTTP requests are made
