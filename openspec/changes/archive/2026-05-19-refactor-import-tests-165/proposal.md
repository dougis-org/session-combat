## GitHub Issues

- #165

## Why

- Problem statement: Two structural issues in the import test architecture make tests harder to maintain and scale: (1) `importMonsterSingle` duplicates an existence check already handled by `shouldImport`, and (2) the D&D Beyond HTTP mock server is inlined in one integration test, making it unreusable.
- Why now: Related cleanup (issue #164) was just completed; addressing these now keeps the test architecture clean before more import tests are added.
- Business/user impact: No user-facing change. Reduces future maintenance burden and prevents test drift between monster and spell import paths.

## Problem Space

- Current behavior:
  - `importMonsterSingle` (lib/import/dedupeEngine.ts:61) calls `storage.findMonsterByNameAndSource` directly, duplicating logic already in `shouldImport("monsters", ...)`.
  - A real HTTP server (`createServer`) is constructed inline in `tests/integration/import/characterImport.integration.test.ts` (lines 48–65) to fake the D&D Beyond character service. It cannot be reused by other tests.
- Desired behavior:
  - `importMonsterSingle` delegates existence checks to `shouldImport`, called before `transformMonster` so duplicates skip transformation entirely.
  - The D&D Beyond HTTP server mock lives in `tests/mocks/dndBeyond/server.ts` as an exportable setup/teardown pair.
- Constraints: No behavior change to any public API or user-visible feature.
- Assumptions:
  - `transformMonster` is cheap enough that calling `shouldImport` first (skipping transform on duplicates) is safe and preferable.
  - No additional integration tests will need the D&D Beyond HTTP mock in the near term, but the extraction still pays off for organization.
- Edge cases considered:
  - `shouldImport` returns `existingId` for monsters — `importMonsterSingle` doesn't use it, which is fine.
  - `importMonsterSingle` currently checks existence *after* validation; new order is check first, then validate+save. Invalid monsters that are also duplicates will now be skipped rather than errored — acceptable since the duplicate check is deterministic.

## Scope

### In Scope

- Refactor `importMonsterSingle` to call `shouldImport("monsters", ...)` before `transformMonster`
- Extract inline `createServer` block from `characterImport.integration.test.ts` to `tests/mocks/dndBeyond/server.ts`
- Update `characterImport.integration.test.ts` to use the new server helper
- Update unit/integration tests for dedupeEngine if behavior assertions change

### Out of Scope

- Moving `tests/helpers/importTestHelpers.ts` (Open5E data factories — already correctly placed)
- Moving `tests/helpers/dndBeyondImport.ts` (D&D Beyond data factories — stay in helpers/)
- Moving `createMockFetch` / `createMockFetch429` (jest fakes, not real servers)
- Any changes to production import logic beyond the existence-check refactor

## What Changes

- `lib/import/dedupeEngine.ts`: `importMonsterSingle` — replace inline `findMonsterByNameAndSource` call with `shouldImport("monsters", name, source)`
- `tests/mocks/dndBeyond/server.ts`: new file — exports `createDndBeyondMockServer()` returning setup/teardown
- `tests/integration/import/characterImport.integration.test.ts`: use `createDndBeyondMockServer()` instead of inline server

## Risks

- Risk: Behavior change in `importMonsterSingle` — invalid duplicates now skipped instead of errored
  - Impact: Low. Duplicates are identified by name+source; an invalid monster with a matching name+source is an edge case with no meaningful difference in outcome.
  - Mitigation: Review dedupeEngine tests to confirm no assertions depend on the old order.

## Open Questions

No unresolved ambiguity. All design decisions were resolved during exploration:
- Order of `shouldImport` vs `transformMonster`: call `shouldImport` first (confirmed with user).
- Mock split strategy: `tests/helpers/` = data factories, `tests/mocks/` = real HTTP servers (confirmed with user).

## Non-Goals

- Creating a general mock server framework
- Adding new import tests (this change only reorganizes existing code)
- Touching the Open5E mock helpers (already well-placed)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
