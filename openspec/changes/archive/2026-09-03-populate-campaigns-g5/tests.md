---
name: tests
description: Tests for the populate-campaigns-g5 change
---

# Tests

## Overview

This document outlines the tests for the `populate-campaigns-g5` change. All
work follows a strict TDD (Test-Driven Development) process. Tests are
mapped to acceptance scenarios in
`openspec/changes/populate-campaigns-g5/specs/populate-campaigns-g5/spec.md`
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

### Per-campaign contract tests (mapped to spec §"G5 Encounter Population")

For each of the 25 G5 campaigns, write a per-campaign contract test
verifying:

- chapter count matches the published campaign structure
- encounters array is non-empty
- every encounter has a non-empty `monsters` array
- every `Monster` has unique `id`, non-zero `hp`, `ac`, `challengeRating`,
  `abilityScores`

The campaigns are:

- [ ] Age of Worms
- [ ] Dungeons of Drakkenheim
- [ ] Dark of Hot Springs Island
- [ ] Scarlet Citadel
- [ ] Courts of the Shadow Fey
- [ ] Vault of the Drow
- [ ] Shackled City
- [ ] Reavers of Harkenwold
- [ ] Lost City
- [ ] Turn of Fortune's Wheel
- [ ] Dragonlance: Shadow of the Dragon Queen
- [ ] Empire of the Ghouls
- [ ] Temple of Elemental Evil
- [ ] Keep on the Borderlands
- [ ] Points of Light
- [ ] Night Below
- [ ] Return to Temple of Elemental Evil
- [ ] Desert of Desolation
- [ ] Queen of the Spiders
- [ ] Against the Cult of the Reptile God
- [ ] Spelljammer: Light of Xaryxis
- [ ] Expedition to the Barrier Peaks
- [ ] Return to the Tomb of Horrors
- [ ] Savage Tide
- [ ] Expedition

### Custom-monster invariant tests (mapped to spec §"G5 Custom Monster Constraints")

- [ ] G5 monster no descriptive damage types — sample at least 50 new G5
  monsters and verify their `damageResistances`, `damageImmunities`, and
  `damageVulnerabilities` arrays contain only canonical `DamageType`
  values.

- [ ] G5 monster passive perception as string — sample at least 50 new
  G5 monsters and verify `senses["passive Perception"]` is a string.

### 3PP stat block tests (mapped to spec §"G5 3PP Stat Block Constraints")

- [ ] 3PP mechanics encoded in traits — verify Drakkenheim contamination,
  Hot Springs Island tags, etc. appear in `traits[].description`, not in
  schema-breaking fields.

### Integration tests (mapped to spec §"MODIFIED CampaignTemplate data structure (G5 catalog entries)")

- [ ] G5 catalog helper wiring — verify each G5 catalog entry's encounters
  array is non-empty and contains the per-campaign encounter helper
  output.

### Rollout completion test (mapped to spec §"Rollout completion marker")

- [ ] Doc status transitions to "rollout complete" — after G5 lands,
  verify `docs/campaign-encounter-rollout.md` status header reflects
  "rollout complete" and the status table shows all 49 campaigns as
  merged.

### Regression / failure-mode tests

- [ ] Missing monster reference fails fast — write a test that injects a
  G5 encounter referencing a non-existent `cm-` id and verify the seed
  script throws immediately.

## BDD/TDD note

The G5 work follows the same TDD pattern as G1 (PR #647), G2 (PR #661),
G3, and G4: write a `describe` block asserting chapter count + non-empty
encounter arrays, watch it fail (because the catalog had placeholder
encounters), then implement the per-campaign helper, then watch it pass.

The 25 G5 campaigns may be implemented in 2-3 sub-group PRs (G5a, G5b,
G5c) per the design Decision 1; each sub-group PR carries its own
contract tests.
