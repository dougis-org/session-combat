---
name: tests
description: Tests for the populate-campaigns-g4 change
---

# Tests

## Overview

This document outlines the tests for the `populate-campaigns-g4` change. All
work follows a strict TDD (Test-Driven Development) process. Tests are
mapped to acceptance scenarios in
`openspec/changes/populate-campaigns-g4/specs/populate-campaigns-g4/spec.md`
and to tasks in `tasks.md`.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write
    a test that captures the requirements of the task. Run the test and
    ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to
    make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the
    test still passes.

## Test Cases

### Per-campaign contract tests (mapped to spec §"G4 Encounter Population")

- [x] Candlekeep test — verifies Candlekeep Mysteries catalog entry has 17
  chapters, non-empty encounters array, every encounter has a non-empty
  monsters array, every Monster has unique id, non-zero hp/ac/challengeRating/abilityScores.
  Maps to spec scenario: "Candlekeep Mysteries encounters populated" and
  task 4.1.

- [x] Radiant Citadel test — verifies Journeys Through the Radiant Citadel
  catalog entry has 13 chapters, encounters populated. Maps to spec
  scenario: "Journeys Through the Radiant Citadel encounters populated"
  and task 4.2.

- [x] Golden Vault test — verifies Keys from the Golden Vault catalog
  entry has 13 chapters, heist encounters populated. Maps to spec
  scenario: "Keys from the Golden Vault encounters populated" and task
  4.3.

- [x] Yawning Portal test — verifies Tales from the Yawning Portal catalog
  entry has 7 chapters, classic stat blocks present (`cm-acererak-lich`,
  `cm-vecna-robes`). Maps to spec scenario: "Tales from the Yawning
  Portal encounters populated" and task 4.4.

- [x] Saltmarsh test — verifies Ghosts of Saltmarsh catalog entry has 8
  chapters, aquatic encounters populated, `cm-sahuagin-baron` present.
  Maps to spec scenario: "Ghosts of Saltmarsh encounters populated" and
  task 4.5.

- [x] Mad Mage test — verifies Waterdeep: Dungeon of the Mad Mage catalog
  entry has 13 chapters, 80+ encounters populated, Halaster and apprentices
  present. Maps to spec scenario: "Waterdeep: Dungeon of the Mad Mage
  encounters populated" and task 4.6.

- [x] Runelords test — verifies Rise of the Runelords catalog entry has 6
  chapters, encounters populated, `cm-karzoug-demon-skin` present,
  Pathfinder-converted encounters carry `(5e conversion)` note. Maps to
  spec scenario: "Rise of the Runelords encounters populated" and task
  4.7.

- [x] Kingmaker test — verifies Kingmaker catalog entry has 6 chapters,
  encounters populated, `cm-lantern-king` present. Maps to spec scenario:
  "Kingmaker encounters populated" and task 4.8.

- [x] WotR test — verifies Wrath of the Righteous catalog entry has 6
  chapters, encounters populated, demon stat blocks (Deskari, Baphomet,
  Nocticula) use canonical DamageType values. Maps to spec scenario:
  "Wrath of the Righteous encounters populated" and task 4.9.

### Custom-monster invariant tests (mapped to spec §"G4 Custom Monster Constraints")

- [x] G4 monster no descriptive damage types — sample at least 30 new G4
  monsters and verify their `damageResistances`, `damageImmunities`, and
  `damageVulnerabilities` arrays contain only canonical `DamageType`
  values. Maps to spec scenario: "No descriptive damage types" and task
  2.4.

- [x] G4 monster passive perception as string — sample at least 30 new G4
  monsters and verify `senses["passive Perception"]` is a string. Maps to
  spec scenario: "Passive perception is a string" and task 2.5.

### Integration tests (mapped to spec §"MODIFIED CampaignTemplate data structure (G4 catalog entries)")

- [x] G4 catalog helper wiring — verify each G4 catalog entry's encounters
  array is non-empty and contains the per-campaign encounter helper
  output. Maps to spec scenario: "G4 catalog entries ship with full
  encounter arrays" and task 3.7.

### Regression / failure-mode tests

- [x] Missing monster reference fails fast — write a test that injects a
  G4 encounter referencing a non-existent `cm-` id and verify the seed
  script throws immediately. Maps to spec scenario: "Missing monster
  reference fails fast" and task 6.

## BDD/TDD note

The G4 work follows the same TDD pattern as G1 (PR #647), G2 (PR #661),
and G3: write a `describe` block asserting chapter count + non-empty
encounter arrays, watch it fail (because the catalog had placeholder
encounters), then implement the per-campaign helper, then watch it pass.
