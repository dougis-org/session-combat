## Context

- Relevant architecture: `lib/import/dedupeEngine.ts` is the central import deduplication module. It exports `shouldImport` (collection-agnostic existence check) and `importMonsterSingle`/`importMonstersFromOpen5E`/`importSpellsFromOpen5E` (import runners). The spell path already calls `shouldImport`; the monster path does not.
- Dependencies: `storage` (MongoDB wrapper), `transformMonster` (Open5E → Monster shape), `open5eAdapter` (Open5E API client).
- Interfaces/contracts touched:
  - `importMonsterSingle` internal logic only — not exported publicly, called only from `importMonstersFromOpen5E`
  - `tests/integration/import/characterImport.integration.test.ts` — `beforeAll`/`afterAll` server lifecycle

## Goals / Non-Goals

### Goals

- Make `importMonsterSingle` use `shouldImport` for consistency with the spell import path
- Extract the D&D Beyond HTTP mock server into a reusable helper at `tests/mocks/dndBeyond/server.ts`
- Leave data factories (`tests/helpers/`) untouched

### Non-Goals

- Changing any public API or user-visible behavior
- Generalizing the mock server infrastructure beyond D&D Beyond
- Moving Open5E helpers

## Decisions

### Decision 1: Call `shouldImport` before `transformMonster` in `importMonsterSingle`

- Chosen: Check existence first via `shouldImport("monsters", raw.name, raw.source ?? "")`, return early if duplicate, then transform and save.
- Alternatives considered: Keep existing order (transform first, then check) — consistent with current behavior for invalid duplicates.
- Rationale: Skipping transform on known duplicates is a free optimization. Transform is cheap but the order also makes the logic clearer: "should we import this?" before "how do we import this?". Matches the natural reading order.
- Trade-offs: Invalid monsters that are also duplicates will now be skipped (not errored). Acceptable — the duplicate check is deterministic and the error result was not meaningful in that case.

### Decision 2: Export setup/teardown pair from `tests/mocks/dndBeyond/server.ts`

- Chosen: Export a single `createDndBeyondMockServer()` factory that returns `{ setup, teardown }` — consumers call these in `beforeAll`/`afterAll` and receive the base URL to configure `DND_BEYOND_CHARACTER_SERVICE_BASE_URL`.
- Alternatives considered: Export the server instance directly; use a class with `start()`/`stop()` methods.
- Rationale: A factory returning plain functions is the lightest API with no class overhead, matches the pattern already used in the integration test, and is easy to extend with handler overrides if needed later.
- Trade-offs: No built-in handler customization for now — acceptable since no additional integration tests are planned imminently.

### Decision 3: Keep `tests/helpers/` vs `tests/mocks/` split clean

- Chosen: `tests/helpers/` = data factories (jest object builders, sample fixtures). `tests/mocks/` = real HTTP servers. `createMockFetch`/`createMockFetch429` stay in helpers — they're jest fakes, not real servers.
- Alternatives considered: Move all mock-related utilities to `tests/mocks/`.
- Rationale: The meaningful distinction is "does this open a port?" not "does it fake something?". Mixing jest fakes with real servers would blur the boundary without adding value.
- Trade-offs: None — the split is unambiguous for the files in scope.

## Proposal to Design Mapping

- Proposal element: `importMonsterSingle` duplicates existence check
  - Design decision: Decision 1 — call `shouldImport` first
  - Validation approach: dedupeEngine unit + integration tests; assert skip behavior unchanged
- Proposal element: Inline D&D Beyond HTTP server in integration test
  - Design decision: Decision 2 — extract to `tests/mocks/dndBeyond/server.ts`
  - Validation approach: Integration test passes with new helper; behavior identical
- Proposal element: `tests/helpers/` vs `tests/mocks/` split
  - Design decision: Decision 3 — split on "opens a port"
  - Validation approach: Code review / file placement; no test assertions needed

## Functional Requirements Mapping

- Requirement: `importMonsterSingle` skips duplicates using `shouldImport`
  - Design element: Decision 1
  - Acceptance criteria reference: specs/dedupe-engine/spec.md
  - Testability notes: Unit test — assert `storage.findMonsterByNameAndSource` is NOT called directly; assert `shouldImport` IS called; assert skip result returned for known duplicate
- Requirement: D&D Beyond HTTP mock is reusable
  - Design element: Decision 2
  - Acceptance criteria reference: specs/mock-server/spec.md
  - Testability notes: Integration test uses helper; server starts/stops cleanly; environment variable is set correctly

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: No new external dependencies introduced
  - Design element: All changes use Node.js built-ins (`http.createServer`) and existing test infrastructure
  - Acceptance criteria reference: package.json unchanged
  - Testability notes: Verify no new entries in package.json

## Risks / Trade-offs

- Risk/trade-off: Behavior change for invalid+duplicate monsters (now skipped, not errored)
  - Impact: Low — no test currently asserts this combined edge case; error result had no meaningful consumer
  - Mitigation: Review dedupeEngine test suite before finalizing; confirm no assertion depends on old order

## Rollback / Mitigation

- Rollback trigger: Any dedupeEngine integration test fails after refactor
- Rollback steps: Revert `lib/import/dedupeEngine.ts` to inline check; revert test files
- Data migration considerations: None — pure code change
- Verification after rollback: Run `jest tests/unit/import/dedupeEngine.test.ts tests/integration/import/dedupeEngine.integration.test.ts`

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing test or revert the change.
- If security checks fail: Not applicable — no auth, network, or data handling changes.
- If required reviews are blocked/stale: Ping reviewer after 24h; escalate to maintainer after 48h.
- Escalation path and timeout: Maintainer (dougis) is sole reviewer; no external escalation needed.

## Open Questions

No open questions. All design decisions resolved prior to artifact creation.
