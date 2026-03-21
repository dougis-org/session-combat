## ADDED Requirements

### Requirement: Party selector is available in combat setup

The combat setup "From Library" panel SHALL display a party selector dropdown allowing users to optionally choose one party from their library.

#### Scenario: Party dropdown renders with no party selected by default

- **WHEN** the user opens the combat setup page
- **THEN** a "Select Party (Optional)" dropdown is visible in the "From Library" panel below the encounter selector
- **AND** the default selection is "No party (all characters)"

#### Scenario: Dropdown is populated with user's parties

- **WHEN** the combat page loads and the user has saved parties
- **THEN** the party dropdown lists all parties by name
- **AND** each option represents one saved party

#### Scenario: Dropdown shows empty state when no parties exist

- **WHEN** the combat page loads and the user has no saved parties
- **THEN** the party dropdown renders with only the "No party (all characters)" option

---

### Requirement: Party selection scopes which characters enter combat

When no party is selected, all library characters SHALL be added to combat (existing behavior). When a party is selected, ONLY that party's characters SHALL be added, replacing the all-characters default.

#### Scenario: No party selected — all characters included

- **WHEN** the user starts combat with no party selected
- **THEN** all characters from the user's library are added as combatants
- **AND** behavior is identical to the existing pre-party-selector behavior

#### Scenario: Party selected — only party characters included

- **WHEN** the user selects a party and starts combat
- **THEN** only the characters belonging to that party are added as combatants
- **AND** library characters not in that party are NOT added

#### Scenario: Party with zero characters

- **WHEN** the user selects a party that has no characters and starts combat
- **THEN** no characters are added from the party
- **AND** combat proceeds normally (monsters from encounter, if any, are still added)

---

### Requirement: Party characters are silently deduplicated against setupCombatants

If a character would be added from a party but is already present in `setupCombatants` (added via quick entry), that character SHALL be silently skipped — no warning, no error.

#### Scenario: Character already in setup — skipped silently

- **WHEN** a character is present in setupCombatants (added manually via Quick Entry)
- **AND** the user selects a party that also contains that character
- **AND** starts combat
- **THEN** that character appears in combat exactly once
- **AND** no warning or error is shown to the user

#### Scenario: No overlap — all party characters added

- **WHEN** a user selects a party whose characters are not in setupCombatants
- **AND** starts combat
- **THEN** all party characters are added as combatants

---

### Requirement: Party selection is cleared when combat ends

When the user ends a combat session, the party selection state SHALL be reset to "no party selected."

#### Scenario: Party selection cleared on endCombat

- **WHEN** the user ends the current combat session
- **THEN** the party selector resets to the default "No party (all characters)" state
- **AND** the next combat setup starts with no party pre-selected

---

### Requirement: Party utility functions are isolated and testable

The logic for expanding a party to characters and detecting duplicates SHALL live in `lib/utils/partySelection.ts`, decoupled from the combat page component.

#### Scenario: expandPartyToCharacters returns correct character list

- **WHEN** `expandPartyToCharacters(party, characters)` is called with a party containing character IDs
- **THEN** it returns the character objects whose IDs are in `party.characterIds`
- **AND** characters not in the party are excluded

#### Scenario: findDuplicatePartyCharacters detects existing combatants

- **WHEN** `findDuplicatePartyCharacters(partyCharacters, setupCombatants)` is called
- **AND** some party characters have IDs that appear as substrings in setupCombatants IDs
- **THEN** those characters are returned as duplicates
- **AND** non-overlapping characters are not included in the result
