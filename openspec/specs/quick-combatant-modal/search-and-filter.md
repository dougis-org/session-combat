## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Unit tests for monster search and filter

The system SHALL have automated tests verifying that Fuse.js search and creator filter correctly narrow the monster list.

#### Scenario: Monster list renders all templates initially

- **Given** the component is rendered with 3 monster templates (Goblin/global, Orc/mine, Troll/other)
- **When** the monsters tab is active with no search query
- **Then** all three monster names are visible in the list

#### Scenario: Typing in search filters monster list

- **Given** the monsters tab is active showing all 3 monsters
- **When** the user types "Goblin" in the search input
- **Then** "Goblin" is visible in the list and "Orc" and "Troll" are not visible

#### Scenario: Clearing search restores full list

- **Given** the user has typed "Goblin" and the list shows only Goblin
- **When** the user clears the search input
- **Then** all three monsters are visible again

#### Scenario: Search with no match shows empty state

- **Given** the monsters tab is active
- **When** the user types "zzznomatch" in the search input
- **Then** the text "No monsters match your search and filter criteria." is visible

#### Scenario: Creator filter "My" shows only user's monsters

- **Given** the monsters tab is active with userId="user-test-123" and 3 monsters (Goblin/global, Orc/mine, Troll/other)
- **When** the user clicks the "My" filter button
- **Then** only "Orc" is visible; "Goblin" and "Troll" are not visible

#### Scenario: Creator filter "Global" shows only global monsters

- **Given** the monsters tab is active
- **When** the user clicks the "Global" filter button
- **Then** only "Goblin" is visible; "Orc" and "Troll" are not visible

#### Scenario: Creator filter "Other" shows only shared monsters

- **Given** the monsters tab is active
- **When** the user clicks the "Other" filter button
- **Then** only "Troll" is visible; "Goblin" and "Orc" are not visible

#### Scenario: Creator filter "All" (default) shows everything

- **Given** the user has applied the "Global" filter
- **When** the user clicks the "All" filter button
- **Then** all three monsters are visible

#### Scenario: Loading state on monsters tab

- **Given** `loadingTemplates=true`
- **When** the monsters tab is active
- **Then** "Loading templates..." is visible and the search input is not present

#### Scenario: Empty monster templates shows prompt

- **Given** `monsterTemplates=[]`
- **When** the monsters tab is active
- **Then** "No monster templates available." is visible with a "Create one" link

### Requirement: ADDED Unit tests for character search and filter

The system SHALL have automated tests verifying that search and filter correctly narrow the character list.

#### Scenario: Character list renders all templates initially

- **Given** the characters tab is active with 2 character templates
- **When** no search query is entered
- **Then** both character names are visible

#### Scenario: Typing in search filters character list

- **Given** the characters tab is active with "Aria" and "Bron" characters
- **When** the user types "Aria" in the search input
- **Then** "Aria" is visible and "Bron" is not visible

#### Scenario: Loading state on characters tab

- **Given** `loadingTemplates=true`
- **When** the user switches to the Party Members tab
- **Then** "Loading characters..." is visible

#### Scenario: Empty character templates shows prompt

- **Given** `characterTemplates=[]`
- **When** the user switches to the Party Members tab
- **Then** "No party members available." is visible with a "Create one" link

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element (Fuse.js search, creator filter) -> Requirement: ADDED Unit tests for monster search and filter
- Design decision: Decision 2 (real Fuse.js) -> Scenarios: Typing in search filters monster list, Clearing search restores full list
- Design decision: Decision 6 (aria-label query strategy) -> all search input scenarios
- Requirement -> Task(s): tasks.md §2 "Test: monster states", §3 "Test: monster search and filter", §5 "Test: character tab"

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Fuse.js search is deterministic

- **Given** the fixture monster names are "Goblin", "Orc", "Troll" (clearly distinct)
- **When** the search term "Goblin" is entered
- **Then** only Goblin matches — Fuse.js 0.3 threshold does not produce cross-matches for these names
