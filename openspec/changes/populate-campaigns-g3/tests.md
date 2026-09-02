---
name: tests
description: Tests for the populate-campaigns-g3 change
---

# Tests

## Overview

This document outlines the tests for the `populate-campaigns-g3` change. All
work follows a strict TDD (Test-Driven Development) process. Tests are
mapped to acceptance scenarios in
`openspec/changes/populate-campaigns-g3/specs/populate-campaigns-g3/spec.md`
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

### Per-campaign contract tests (mapped to spec §"G3 Encounter Population")

- [ ] Rime test — verifies Rime catalog entry has 7 chapters, non-empty
  encounters array, every encounter has a non-empty monsters array, every
  Monster has unique id, non-zero hp/ac/challengeRating/abilityScores.
  Maps to spec scenario: "Icewind Dale: Rime of the Frostmaiden encounters
  populated" and task 4.1 in `tasks.md`.

- [ ] WBtW test — verifies WBtW catalog entry has 5 chapters, encounters
  populated, Hourglass Coven stat blocks (`cm-brigid-morningglow`,
  `cm-mungoj-reyhorn`, `cm-endelyn-moongrave`, `cm-sister-gala`) present
  in `CUSTOM_MONSTERS` with full legendary action blocks. Maps to spec
  scenario: "The Wild Beyond the Witchlight encounters populated" and
  task 4.2.

- [ ] PotA test — verifies PotA catalog entry has 5 chapters, 20+
  encounters, the four Elemental Princes (`cm-imix`, `cm-ogremoch`,
  `cm-yuan-tin`, `cm-bane`) present, elementals referenced via shared
  `cm-` entries. Maps to spec scenario: "Princes of the Apocalypse
  encounters populated" and task 4.3.

- [ ] CotCT test — verifies Curse of the Crimson Throne catalog entry has
  6 chapters, encounters populated, `cm-ileosa-arabasti` present,
  Pathfinder-converted encounters carry `(5e conversion)` note. Maps to
  spec scenario: "Curse of the Crimson Throne encounters populated" and
  task 4.4.

- [ ] HR test — verifies Hell's Rebels catalog entry has 6 chapters,
  encounters populated, `cm-barbaroscia-thrune` and related Thrune NPCs
  present, devil stat blocks use canonical DamageType values. Maps to
  spec scenario: "Hell's Rebels encounters populated" and task 4.5.

- [ ] RHoD test — verifies Red Hand of Doom catalog entry has 5 chapters,
  15+ encounters, `cm-hurog-manthex` and `cm-wyrmlord` present. Maps to
  spec scenario: "Red Hand of Doom encounters populated" and task 4.6.

### Custom-monster invariant tests (mapped to spec §"G3 Custom Monster Constraints")

- [ ] G3 monster no descriptive damage types — sample at least 20 new G3
  monsters and verify their `damageResistances`, `damageImmunities`, and
  `damageVulnerabilities` arrays contain only canonical `DamageType`
  values from `lib/constants.ts`. Maps to spec scenario: "No descriptive
  damage type strings" and task 2.4.

- [ ] G3 monster passive perception as string — sample at least 20 new G3
  monsters and verify `senses["passive Perception"]` is a string. Maps
  to spec scenario: "Passive perception is a string" and task 2.5.

### Integration tests (mapped to spec §"MODIFIED CampaignTemplate data structure (G3 catalog entries)")

- [ ] G3 catalog helper wiring — verify each G3 catalog entry's encounters
  array is non-empty and contains the per-campaign encounter helper
  output. Maps to spec scenario: "G3 catalog entries ship with full
  encounter arrays" and task 3.7.

### Regression / failure-mode tests

- [ ] Missing monster reference fails fast — write a test that injects a
  G3 encounter referencing a non-existent `cm-` id and verify the seed
  script throws immediately. Maps to spec scenario: "Missing monster
  reference fails fast" and task 6.

## BDD/TDD note

The G3 work follows the same TDD pattern as G1 (PR #647) and G2 (PR
#661): write a `describe` block asserting chapter count + non-empty
encounter arrays, watch it fail (because the catalog had placeholder
encounters), then implement the per-campaign helper, then watch it pass.
