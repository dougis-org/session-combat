## Context

- Relevant architecture: Integration tests live under `tests/integration/`. Two helper layers exist: `auth.test.helpers.ts` (auth-domain test utilities + data factories) and `helpers/` (generic shared helpers — `server.ts`, `users.ts`, `monsterTestData.ts`).
- Dependencies: `helpers/users.ts` will import `createTestUser` from `tests/integration/auth.test.helpers.ts`. No other new cross-file dependencies are introduced.
- Interfaces/contracts touched:
  - `tests/integration/helpers/users.ts` — exported API changes (`createTestUser` → `registerTestUser`, `uniqueEmail` removed)
  - `tests/integration/auth.test.helpers.ts` — no exported API changes; `createTestUser` and `createTestEmail` stay unchanged
  - 14 test files — import and call-site updates only

## Goals / Non-Goals

### Goals

- Single email generator: `createTestEmail` in `auth.test.helpers.ts`
- Single credential object factory: `createTestUser` in `auth.test.helpers.ts`
- Single HTTP registration helper: `registerTestUser` in `helpers/users.ts`, delegating data generation upward
- Zero remaining exports of `uniqueEmail` or async `createTestUser` from `helpers/users.ts`
- All parallel-safe (no raw `Date.now()`-only email generation anywhere in integration tests)

### Non-Goals

- Restructuring `auth.test.helpers.ts` internals
- Changing test assertion patterns
- Adding user cleanup/teardown
- Any production code changes

## Decisions

### Decision 1: `helpers/users.ts` imports from `auth.test.helpers.ts` (not vice versa)

- Chosen: `helpers/users.ts` imports `createTestUser` from `auth.test.helpers.ts` for credential generation.
- Alternatives considered: Extract `createTestEmail` and `createTestUser` to a third file (e.g., `helpers/testData.ts`) that both can import.
- Rationale: `auth.test.helpers.ts` is already the canonical home — it has the collision-safe logic, it's already used by register/login tests, and moving it would be a larger refactor with no net gain.
- Trade-offs: `helpers/users.ts` gains a dependency on `auth.test.helpers.ts`. This is one-directional and not circular (verified: `auth.test.helpers.ts` does not import from `helpers/`).

### Decision 2: Rename `createTestUser` → `registerTestUser` in `helpers/users.ts`

- Chosen: Rename the async HTTP-registering function to `registerTestUser`.
- Alternatives considered: Keep the name and add a JSDoc disambiguation comment.
- Rationale: The name `createTestUser` on an async network-calling function collides with the sync data-only `createTestUser` in `auth.test.helpers.ts`. Different return types, different signatures, different purpose. Renaming removes the ambiguity without any information loss.
- Trade-offs: 12 test files need a mechanical import/call-site rename. All are caught by TypeScript at compile time.

### Decision 3: Remove `uniqueEmail` from `helpers/users.ts`

- Chosen: Delete `uniqueEmail` entirely; `registerTestUser` uses `createTestUser` from `auth.test.helpers.ts` for email generation.
- Alternatives considered: Deprecate with a re-export alias.
- Rationale: No file outside `helpers/users.ts` imports `uniqueEmail`. It was an internal implementation detail. Removing it closes the door on future misuse.
- Trade-offs: None — zero external consumers confirmed by grep.

### Decision 4: `login.test.ts` setup migrates to `registerTestUser`

- Chosen: Replace `createTestEmail + registerUser` setup calls in `login.test.ts` with `registerTestUser`.
- Rationale: `login.test.ts` tests the login endpoint; user registration is setup, not the subject under test. Using `registerTestUser` is semantically correct and removes the auth-domain import dependency.
- Trade-offs: `login.test.ts` no longer imports `registerUser` or `createTestEmail` from `auth.test.helpers.ts` (it still imports `loginUser`, `assertSuccessResponse`, etc.).

### Decision 5: Fix `register.test.ts` special-email strings

- Chosen: Replace raw `` `user+test-${Date.now()}@example.co.uk` `` etc. with `createTestEmail` variants.
- Rationale: These are the only remaining collision-unsafe email strings in the integration suite. The `createTestEmail` function already handles timestamp+random safely.
- Trade-offs: The special-email test intentionally uses distinct formats (`.co.uk`, hyphens, underscores). `createTestEmail` generates `prefix-timestamp-random@example.com` format. We keep the structural variety by using prefixes like `user+tag`, `user-name`, `user_name` but generate the domain/suffix via `createTestEmail` — or construct emails manually using the safe pattern. Decision: construct them manually with `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,9)}@example.co.uk` to preserve domain variety, keeping the same pattern as `createTestEmail`.

## Proposal to Design Mapping

- Proposal element: Single canonical email generator
  - Design decision: Decision 1 (import direction) + Decision 3 (remove `uniqueEmail`)
  - Validation approach: grep confirms zero `uniqueEmail` references after change; `createTestEmail` is the only email generator

- Proposal element: Single canonical credential factory
  - Design decision: Decision 2 (rename) + Decision 1 (import direction)
  - Validation approach: TypeScript compile confirms no signature mismatches; grep confirms no async `createTestUser` in `helpers/users.ts`

- Proposal element: Single HTTP registration helper
  - Design decision: Decision 2 (`registerTestUser`)
  - Validation approach: All 12 migrated files compile and tests pass

- Proposal element: `login.test.ts` setup migration
  - Design decision: Decision 4
  - Validation approach: `login.test.ts` imports only `loginUser`, assertion helpers, constants from `auth.test.helpers.ts`

- Proposal element: Fix `register.test.ts` special-email collision risk
  - Design decision: Decision 5
  - Validation approach: No raw `Date.now()`-only patterns remain in integration tests

## Functional Requirements Mapping

- Requirement: `registerTestUser(baseUrl, prefix?)` returns `{email, password, cookie, userId}`
  - Design element: `helpers/users.ts` — renamed function, same return shape
  - Acceptance criteria reference: specs/registration-factory.md
  - Testability notes: Existing tests that call `createTestUser` will call `registerTestUser` after rename; same assertions apply

- Requirement: Email generation is collision-safe in parallel execution
  - Design element: All email generation routes through `createTestEmail` (timestamp + random)
  - Acceptance criteria reference: specs/email-generation.md
  - Testability notes: Grep for `Date.now()` patterns in integration test files; parallel test run with `--maxWorkers=4`

- Requirement: No import of `uniqueEmail` or async `createTestUser` from `helpers/users.ts` after migration
  - Design element: Decisions 2 and 3
  - Acceptance criteria reference: specs/migration-completeness.md
  - Testability notes: `grep -r "uniqueEmail\|createTestUser.*helpers/users" tests/` returns zero matches

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Parallel test runs do not produce email collisions
  - Design element: `createTestEmail` uses `Date.now() + Math.random().toString(36)` — safe across workers
  - Testability notes: Run integration suite with `JEST_WORKER_ID` varying across workers

- Requirement category: operability
  - Requirement: TypeScript catches all missed renames at compile time
  - Design element: `createTestUser` (async, `(baseUrl, prefix)`) and `registerTestUser` have distinct names and signatures — any unmigrated call site is a type error
  - Testability notes: `tsc --noEmit` after changes

## Risks / Trade-offs

- Risk/trade-off: Import cycle if `auth.test.helpers.ts` ever imports from `helpers/users.ts`
  - Impact: Build failure
  - Mitigation: Direction is `helpers/users.ts → auth.test.helpers.ts`, never the reverse. Document in `auth.test.helpers.ts` header comment.

- Risk/trade-off: `register.test.ts` special-email fix changes test email formats
  - Impact: Tests may miss format-specific validation bugs if domains change
  - Mitigation: Decision 5 preserves domain variety (`.co.uk`, hyphens, underscores) while adding random suffix

## Rollback / Mitigation

- Rollback trigger: Integration test suite fails after migration
- Rollback steps: Revert the `helpers/users.ts` changes; revert call sites to `createTestUser`; no DB or production changes to reverse
- Data migration considerations: None — test-only changes
- Verification after rollback: Integration suite green

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing test or compile error before proceeding.
- If security checks fail: N/A — no production code changes.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to maintainer after 48 hours.
- Escalation path and timeout: 48-hour review SLA; maintainer merge authority after that.

## Open Questions

No open questions. All decisions resolved during proposal exploration.
