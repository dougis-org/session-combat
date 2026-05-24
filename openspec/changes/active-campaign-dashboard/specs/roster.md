## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED CharacterRosterCard component

The system SHALL provide a `CharacterRosterCard` component that renders character identity fields (name, race, class/level, type badge) with no combat stats (AC, HP).

#### Scenario: Player character renders identity fields

- **Given** a character with `name: "Aria"`, `race: "Elf"`, `classes: [{class: "Wizard", level: 5}]`, `characterType: "character"`
- **When** `CharacterRosterCard` renders
- **Then** the card shows "Aria", "Elf · Wizard · Lv 5", and no NPC/Companion badge; AC and HP are absent from the DOM

#### Scenario: NPC renders type badge

- **Given** a character with `characterType: "npc"` and `name: "Mira"`
- **When** `CharacterRosterCard` renders
- **Then** an "NPC" badge is visible alongside the name

#### Scenario: Companion renders type badge

- **Given** a character with `characterType: "companion"` and `name: "Rex"`
- **When** `CharacterRosterCard` renders
- **Then** a "Companion" badge is visible alongside the name

#### Scenario: Character with no classes renders gracefully

- **Given** a character with `classes: []` or `classes` undefined
- **When** `CharacterRosterCard` renders
- **Then** race is shown (if present) and no class/level line appears; no crash

### Requirement: ADDED CampaignChapterInfo component

The system SHALL provide a `CampaignChapterInfo` component that renders the campaign's current chapter title, falling back gracefully when no chapter is set or the referenced chapter does not exist.

#### Scenario: Current chapter renders correctly

- **Given** `chapters: [{id: "ch1", title: "The Siege of Sigil"}]` and `currentChapterId: "ch1"`
- **When** `CampaignChapterInfo` renders
- **Then** "The Siege of Sigil" is visible

#### Scenario: No currentChapterId set

- **Given** `currentChapterId` is undefined or empty
- **When** `CampaignChapterInfo` renders
- **Then** a fallback like "No chapter set" is displayed; no crash

#### Scenario: currentChapterId references missing chapter

- **Given** `currentChapterId: "ch-missing"` and no chapter with that id in `chapters`
- **When** `CampaignChapterInfo` renders
- **Then** fallback text is displayed; no crash

## MODIFIED Requirements

No existing roster or character display requirements are modified by this change. `CharacterMiniSummary` is unchanged.

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal: "Party members listed with name, race, class, and level" → Requirement: CharacterRosterCard component
- Proposal: "Travelling NPCs and companions listed separately" → Requirement: CharacterRosterCard (type badge scenario)
- Proposal: "Each active campaign card shows module name, current chapter" → Requirement: CampaignChapterInfo component
- Design Decision 1 (CharacterRosterCard, not CharacterMiniSummary) → Requirement: CharacterRosterCard component
- Design Decision 2 (CampaignChapterInfo new component) → Requirement: CampaignChapterInfo component
- Requirements → Tasks: tasks.md — Task 1 (CharacterRosterCard), Task 2 (CampaignChapterInfo)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: CharacterRosterCard handles missing optional fields

- **Given** a character where `race` is undefined and `classes` is empty
- **When** `CharacterRosterCard` renders
- **Then** the component renders without errors; missing fields are shown as "—" or omitted gracefully
