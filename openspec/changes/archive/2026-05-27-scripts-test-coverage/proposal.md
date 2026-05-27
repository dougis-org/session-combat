## GitHub Issues

- #246

## Why

- Problem statement: `lib/scripts/` has 0% test coverage. These scripts mutate production data (MongoDB) and transform external API responses into stored schema. A bug in them — whether introduced directly or via a type change elsewhere — goes completely undetected.
- Why now: Issue #246 was filed to track this gap. The testcontainers infrastructure is already in place, making integration tests low-cost to add. The pure transformation logic in `populateMonstersByType.js` is particularly high-value to cover because it's complex, untested, and silently produces corrupt monster data if the Open5E API shape ever diverges.
- Business/user impact: `migrateGlobalMonsters` is re-run during staging resets and new environment provisioning. A regression here would silently leave global monsters untagged. `transformMonster` maps the Open5E API response to the app's `MonsterTemplate` schema — breakage here corrupts the monster library for all users.

## Problem Space

- Current behavior: All three scripts in `lib/scripts/` execute logic with no test coverage. Running them in tests is impossible today because each auto-executes on import.
- Desired behavior: `migrateGlobalMonsters.ts` is integration-tested against a real containerized MongoDB instance (pre/post state, idempotency). `populateMonstersByType.js` pure functions are unit-tested. Both scripts are importable without auto-executing.
- Constraints: Scripts must remain runnable directly via `node` / `ts-node`. The `require.main === module` / `if (import.meta.url === ...)` guard achieves importability without breaking the CLI usage.
- Assumptions: `seedCampaignTemplates.ts` is out of scope per explicit decision — it is mostly static data with minimal logic risk.
- Edge cases considered: Running `migrateGlobalMonsters` twice (idempotency); monsters already tagged with `source: "SRD"` must not be double-updated; `transformMonster` with missing optional fields (no proficiencies, no senses, no actions).

## Scope

### In Scope

- Add `require.main === module` guard to `lib/scripts/migrateGlobalMonsters.ts`
- Add `require.main === module` guard to `lib/scripts/populateMonstersByType.js`
- Export `migrateGlobalMonsters` function for testability
- Export pure functions from `populateMonstersByType.js`: `normalizeType`, `getCRExperience`, `transformMonster`, `generateTypeFile`
- Unit tests for `normalizeType`, `getCRExperience`, `transformMonster`, `generateTypeFile`
- Integration tests for `migrateGlobalMonsters`: pre-migration seed, post-migration verify, idempotency

### Out of Scope

- `lib/scripts/seedCampaignTemplates.ts` — no tests, no guard change
- End-to-end testing of the `populateMonstersByType` `main()` function (network + disk)
- Coverage of `fetchJSON` or file-write paths in `populateMonstersByType.js`

## What Changes

- `lib/scripts/migrateGlobalMonsters.ts`: add `require.main === module` guard, export the function
- `lib/scripts/populateMonstersByType.js`: add `require.main === module` guard, export pure functions
- `tests/unit/lib/scripts/migrateGlobalMonsters.test.ts`: new — unit smoke test confirming export shape
- `tests/unit/lib/scripts/populateMonstersByType.test.ts`: new — unit tests for `normalizeType`, `getCRExperience`, `transformMonster`, `generateTypeFile`
- `tests/integration/scripts/migrateGlobalMonsters.integration.test.ts`: new — pre/post DB state, idempotency

## Risks

- Risk: Adding exports to scripts could be misread as making them a shared library
  - Impact: Low — scripts remain in `lib/scripts/`, naming is explicit
  - Mitigation: No changes to any imports outside test files
- Risk: Integration test adds to CI time
  - Impact: Low — testcontainers MongoDB already starts for all integration tests; this just adds a few DB operations
  - Mitigation: Test is minimal — two DB writes + two reads

## Open Questions

No unresolved ambiguity. All decisions made during exploration:
- `require.main === module` guard is acceptable (confirmed by user)
- Integration test for `migrateGlobalMonsters`, unit tests for `populateMonstersByType`
- `seedCampaignTemplates` explicitly excluded

## Non-Goals

- Achieving 100% coverage of `lib/scripts/`
- Testing the network fetch or file-write paths in `populateMonstersByType.js`
- Modifying how scripts are invoked in production (`package.json` scripts, etc.)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
