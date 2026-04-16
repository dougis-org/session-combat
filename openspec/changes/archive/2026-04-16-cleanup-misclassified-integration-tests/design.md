## Context

- Relevant architecture: Jest test suite split across `tests/unit/` and `tests/integration/`. Integration tests use either testcontainers (real MongoDB + Next.js HTTP server) or — incorrectly — `jest.mock()`. Two Jest configs exist: `jest.integration.config.js` (runs non-Docker integration tests) and `jest.docker.config.js` (runs Docker-dependent tests only). The split is purely an artifact of misclassified tests not needing Docker.
- Dependencies: `@testcontainers/mongodb`, `jest`, `ts-jest`. No source code dependencies — this change is test-only.
- Interfaces/contracts touched: `package.json` scripts (`test:docker`, `test:integration`, `test:ci`), `jest.integration.config.js`, `jest.docker.config.js`.

## Goals / Non-Goals

### Goals

- Every file in `tests/integration/` exercises a real external dependency
- No `jest.mock()` in any `tests/integration/` file (except boundary mocks in `logout-clears-storage.test.ts` which is documented as intentional)
- All behavior currently covered by misclassified files is preserved in correctly located unit tests
- `jest.docker.config.js` deleted; `jest.integration.config.js` uses single glob, no exclusions
- `test:docker` script removed; `test:integration` runs the full suite

### Non-Goals

- Adding new integration tests
- Changing test logic or assertions
- Modifying source code

## Decisions

### Decision 1: Move-then-delete ordering

- Chosen: For each misclassified file, write or augment the destination unit test first, verify it passes, then delete the integration file. Never delete before the destination exists and passes.
- Alternatives considered: Delete and rewrite from scratch; move wholesale then patch.
- Rationale: Zero coverage gaps at any point. If a step fails mid-way, the suite is still green (old file still exists).
- Trade-offs: Slightly more steps per file; worth it for safety.

### Decision 2: `monsterUpload` split into `tests/unit/monster-upload/` folder

- Chosen: Create `tests/unit/monster-upload/` with four targeted files: `document-validation.test.ts`, `field-validation.test.ts`, `transform.test.ts`, `pipeline.test.ts`. Absorb the existing `tests/unit/validation/monsterUpload.test.ts` damage-type tests into `transform.test.ts`.
- Alternatives considered: Merge everything into one large file; keep existing unit file and append to it.
- Rationale: The 513-line integration file plus the 101-line unit file would exceed 600 lines merged. The concern breakdowns (document structure, field rules, transform logic, pipeline flow) are genuinely distinct and benefit from separate files. Mirrors the mental model of "what aspect of upload are you testing?"
- Trade-offs: More files to navigate; offset by clear naming.

### Decision 3: `monsterUploadRoute.test.ts` — delete, do not migrate

- Chosen: Delete outright. Every test in this file calls `validateMonsterUploadDocument` directly — identical behavior already covered by `tests/integration/monsterUpload.test.ts` `validateMonsterUploadDocument` section (and subsequently by `document-validation.test.ts`).
- Alternatives considered: Migrate anyway for completeness.
- Rationale: Migrating redundant tests adds noise, not safety. Verified line-by-line: zero unique assertions.
- Trade-offs: None — redundant tests provide false coverage confidence.

### Decision 4: `party-routes.test.ts` — augment existing unit file, do not move wholesale

- Chosen: Add to `tests/unit/api/parties/route.test.ts`: (1) assertion on POST that `_id` is absent from saved payload and `id` is a UUID string; (2) new `describe("PUT /api/parties/[id]")` block covering update behavior and `_id` stripping.
- Alternatives considered: Create new `party-routes.test.ts` in unit folder.
- Rationale: GET/POST coverage already exists in the unit file. Splitting into a second file for the same route creates fragmentation. The PUT handler has zero unit coverage — adding it to the existing file is the right home.
- Trade-offs: Unit file grows slightly; stays well within readable bounds.

### Decision 5: `storage.party.test.ts` — add describe block to existing storage unit file

- Chosen: Add `describe("storage.saveParty")` to `tests/unit/storage/storage.test.ts`.
- Alternatives considered: Separate `storage.party.test.ts` in unit folder.
- Rationale: All other storage method tests live in one file. Consistency beats fragmentation.
- Trade-offs: Storage unit file grows by ~30 lines.

### Decision 6: `offline/logout-clears-storage.test.ts` — keep in integration, document

- Chosen: Stays in `tests/integration/offline/`. Add file header documenting that `next/navigation` and `fetch` mocks are intentional external-boundary mocks, not subject-under-test mocks.
- Alternatives considered: Move to `tests/unit/offline/`.
- Rationale: The test integrates real `LocalStore`, `SyncQueue`, `clientStorage`, and React DOM. It is a legitimate multi-module integration test; only its mocked targets are external I/O boundaries (router, network). Moving it to unit would misrepresent its nature.
- Trade-offs: One file in integration still has mocks — mitigated by documentation making the intent explicit.

### Decision 7: Config collapse

- Chosen: Delete `jest.docker.config.js`. Update `jest.integration.config.js` to use `testMatch: ["**/tests/integration/**/*.test.ts"]` with no `testPathIgnorePatterns`. Remove `test:docker` from `package.json`.
- Alternatives considered: Keep both configs.
- Rationale: The split only existed because mocked tests didn't need Docker. Once all integration tests use real deps (or are documented exceptions), the distinction is meaningless.
- Trade-offs: `test:integration` now always starts containers. This is correct — integration tests should always exercise real deps.

## Proposal to Design Mapping

- Proposal element: Move pure unit tests to `tests/unit/`
  - Design decision: Decision 1 (move-then-delete ordering)
  - Validation approach: Run `npm run test:unit` after each move; assert no new failures
- Proposal element: Split monsterUpload files
  - Design decision: Decision 2 (monster-upload folder)
  - Validation approach: All test names from source file present in destination files; `npm run test:unit` passes
- Proposal element: Delete monsterUploadRoute.test.ts
  - Design decision: Decision 3 (delete redundant)
  - Validation approach: Grep confirms no unique assertions lost; suite passes
- Proposal element: party-routes augmentation
  - Design decision: Decision 4 (augment existing unit file)
  - Validation approach: New PUT tests pass; POST `_id` assertion added and passes
- Proposal element: storage.party augmentation
  - Design decision: Decision 5 (add describe block)
  - Validation approach: saveParty test passes against real storage mock
- Proposal element: logout-clears-storage stays
  - Design decision: Decision 6 (keep + document)
  - Validation approach: File header added; `npm run test:integration` still passes
- Proposal element: Config collapse
  - Design decision: Decision 7
  - Validation approach: `npm run test:integration` runs all integration tests without exclusions; `npm run test:docker` removed; `npm run test:ci` still works

## Functional Requirements Mapping

- Requirement: No `jest.mock()` in `tests/integration/` (except documented boundary mocks)
  - Design element: Decisions 1–6
  - Acceptance criteria reference: specs/test-classification.md
  - Testability notes: `grep -r "jest.mock" tests/integration/` — only `offline/logout-clears-storage.test.ts` may appear, and only with documented boundary mocks
- Requirement: All behavior from deleted integration files preserved in unit tests
  - Design element: Decisions 1, 4, 5
  - Acceptance criteria reference: specs/test-classification.md
  - Testability notes: Manually verify test count and assertion coverage before/after each deletion
- Requirement: `jest.docker.config.js` deleted; `jest.integration.config.js` has no `testPathIgnorePatterns`
  - Design element: Decision 7
  - Acceptance criteria reference: specs/jest-config.md
  - Testability notes: File does not exist post-change; config file grep confirms no `testPathIgnorePatterns`
- Requirement: `test:docker` script removed
  - Design element: Decision 7
  - Acceptance criteria reference: specs/jest-config.md
  - Testability notes: `package.json` scripts section does not contain `test:docker`

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Suite passes green throughout the change — no regression windows
  - Design element: Decision 1 (move-then-delete ordering)
  - Acceptance criteria reference: specs/test-classification.md
  - Testability notes: Run `npm run test:unit` and `npm run test:integration` after each task step
- Requirement category: operability
  - Requirement: CI continues to work with `test:ci` script unchanged
  - Design element: Decision 7
  - Acceptance criteria reference: specs/jest-config.md
  - Testability notes: `npm run test:ci` executes without error after config collapse

## Risks / Trade-offs

- Risk/trade-off: Coverage gap if a file is deleted before its destination tests are confirmed passing
  - Impact: Silent regression in party routes, storage saveParty, or monster validation
  - Mitigation: Strict move-then-delete ordering enforced in tasks.md
- Risk/trade-off: `monsterUpload` split may miss tests if the source file isn't read exhaustively
  - Impact: Lost test cases for legendaryActionCount, damage types, or pipeline flow
  - Mitigation: All five describe blocks from source explicitly mapped to destination files in tasks.md

## Rollback / Mitigation

- Rollback trigger: `npm run test:unit` or `npm run test:integration` fails after a step and cannot be fixed in < 30 minutes
- Rollback steps: `git checkout -- tests/` restores all deleted/modified test files; `git checkout -- jest.*.config.js package.json` restores config
- Data migration considerations: None — test-only change
- Verification after rollback: `npm run test:unit && npm run test:integration` both pass

## Operational Blocking Policy

- If CI checks fail: Do not delete any source integration files until CI is green on the new unit tests
- If security checks fail: N/A — no source code or dependency changes
- If required reviews are blocked/stale: Wait; do not merge partial migration (config collapse must happen atomically with the last file deletion)
- Escalation path and timeout: If blocked > 1 day, revert to last green state and re-scope

## Open Questions

No open questions. All decisions validated against actual file contents during exploration.
