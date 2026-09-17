## MODIFIED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: MODIFIED Preferences persist across sessions and devices

The system SHALL persist each authenticated user's non-default preference values in a
server-side `preferences` sub-document on that user's record, storing only values that
differ from the schema defaults, so the values are available on any later session or
device — including the new `combat.autoScrollToNextCombatant` boolean, which follows
exactly the same sparse-storage rule as every other known preference key.

#### Scenario: Auto-scroll preference survives logout and re-login on another device

- **Given** an authenticated user who has set `combat.autoScrollToNextCombatant` to `false`
- **When** the user logs out, clears local browser storage, and logs in again from a
  different browser
- **Then** `GET /api/me/preferences` returns `combat.autoScrollToNextCombatant` as `false`

#### Scenario: Default auto-scroll value is not persisted

- **Given** a user who has never changed `combat.autoScrollToNextCombatant` (it remains at
  its schema default of `true`)
- **When** the stored preference document is inspected
- **Then** `preferences.values` does not contain a `combat.autoScrollToNextCombatant` key

## Traceability

- Proposal element: New `combat.autoScrollToNextCombatant` preference (default on, local + profile persisted) -> Requirement: MODIFIED Preferences persist across sessions and devices
- Design decision: Decision 3 (new `combat` preference domain) -> Requirement: MODIFIED Preferences persist across sessions and devices
- Requirement: MODIFIED Preferences persist across sessions and devices -> Task(s): extend `lib/preferences/schema.ts`, `userPreferencesRepo.ts`, and their existing test suites with the new key

## Non-Functional Acceptance Criteria

### Requirement: Performance

Not affected beyond the existing preference read/write path — adding one boolean key to an already-generic, path-driven schema introduces no new performance characteristics. No distinct scenario applies.

### Requirement: Security

See functional scenarios above; the new key is validated by the same `KEY_VALIDATORS`/`validatePreferencePatch` mechanism as every existing key (type-checked boolean, unknown/invalid values rejected or dropped). No distinct security scenario applies.

### Requirement: Reliability

#### Scenario: Malformed stored value degrades to default

- **Given** a stored preferences document where `combat.autoScrollToNextCombatant` is present but not a boolean (e.g. corrupted or from a future incompatible schema version)
- **When** `resolvePreferences` reads the document
- **Then** the resolved value falls back to the schema default (`true`) rather than throwing or propagating the invalid value
