## Context

- Relevant architecture: `lib/import/open5eAdapter.ts` defines the wire-shape types (`Open5ECreature`, `Open5ESpell`) returned by the Open5E v2 API. `lib/import/transformMonster.ts` consumes `Open5ECreature` and normalizes it into the app's internal `MonsterTemplate` shape, including `parseChallengeRating` for the `challenge_rating` field.
- Dependencies: no new runtime dependencies. Test-only change plus one type widening.
- Interfaces/contracts touched: `Open5ECreature.challenge_rating` (type only, in `lib/import/open5eAdapter.ts`). No change to `MonsterTemplate.challengeRating` (remains `number`) or to `parseChallengeRating`'s runtime logic.

## Goals / Non-Goals

### Goals

- Make `Open5ECreature.challenge_rating`'s declared type match the two real shapes the Open5E v2 API sends (`number` for CR >= 1, fraction `string` for CR < 1).
- Close the test-coverage gap on `parseChallengeRating`'s fraction-string and fallback branches so a future change to that function can't silently break fraction parsing.

### Non-Goals

- Changing `parseChallengeRating`'s parsing algorithm.
- Achieving full API-shape parity for every other field on `Open5ECreature`/`Open5ESpell`.
- Un-skipping the live-network integration test (`open5eApiShape.test.ts`).

## Decisions

### Decision 1: Widen `challenge_rating` to `number | string`

- Chosen: Change `Open5ECreature.challenge_rating: number` to `Open5ECreature.challenge_rating: number | string` in `lib/import/open5eAdapter.ts`.
- Alternatives considered:
  - Introduce a dedicated `ChallengeRating` union/branded type — rejected as over-engineering for a single field used in one place.
  - Leave the type as `number` and rely only on `parseChallengeRating`'s `unknown` parameter to absorb the mismatch — rejected because it leaves the exported interface actively wrong about what the API can send, which is the defect issue #161 flagged.
- Rationale: `number | string` is the minimal, accurate type for the two shapes Open5E actually returns. `parseChallengeRating` already accepts `unknown`, so no call-site changes are needed beyond the interface declaration.
- Trade-offs: `number | string` is a looser type than a fully-modeled fraction type would be, but matches the project's existing style (plain field types, defensive parsing in the transform layer) and keeps the change minimal.

### Decision 2: Add targeted unit tests via `transformMonster`, not a new exported unit for `parseChallengeRating`

- Chosen: Add new test cases to `tests/unit/import/transformMonster.test.ts` that call `transformMonster` with `challenge_rating` set to fraction strings, a zero-denominator fraction, a non-numeric string, and a numeric string, asserting on `monster.challengeRating`.
- Alternatives considered:
  - Export `parseChallengeRating` from `transformMonster.ts` and unit-test it directly — rejected: it's currently a private helper and none of the other helpers in the file (`normalizeAlignment`, `mapSize`, `normalizeSpeed`) are exported either; changing that convention for one function isn't justified by this fix.
- Rationale: Testing through the existing public entry point (`transformMonster`) matches the file's current test structure and avoids widening the module's public API for a single-field concern.
- Trade-offs: Slightly less direct than a unit test on `parseChallengeRating` itself, but keeps the test file's existing pattern intact and still fully exercises every branch.

## Proposal to Design Mapping

- Proposal element: Widen `Open5ECreature.challenge_rating` type to `number | string`
  - Design decision: Decision 1
  - Validation approach: TypeScript compiles with no new errors; existing numeric-CR tests continue to pass unchanged.
- Proposal element: Add unit test coverage for fraction-string and fallback branches of `parseChallengeRating`
  - Design decision: Decision 2
  - Validation approach: New Jest test cases in `tests/unit/import/transformMonster.test.ts`, run via `npm run test:unit`.
- Proposal element: Confirm `Open5ESpell.desc` needs no change
  - Design decision: N/A (no code decision required — documented as a verified non-issue in proposal.md and tasks.md)
  - Validation approach: Existing (skipped) integration test assertion `expect(spell).toHaveProperty("desc")` already matches the interface; no new test needed.

## Functional Requirements Mapping

- Requirement: `Open5ECreature.challenge_rating` type must accept both numeric and fraction-string values without a TypeScript error.
  - Design element: Decision 1 (type widening).
  - Acceptance criteria reference: proposal.md "In Scope" bullet 1.
  - Testability notes: Verified by `tsc`/build passing; no runtime test needed for a type-only change.
- Requirement: `parseChallengeRating` must correctly convert `"1/2"`, `"1/4"`, `"1/8"` to `0.5`, `0.25`, `0.125` respectively.
  - Design element: Decision 2 (new test cases).
  - Acceptance criteria reference: proposal.md "In Scope" bullet 2.
  - Testability notes: Direct assertion on `monster.challengeRating` for each fraction input via `transformMonster`.
- Requirement: `parseChallengeRating` must return `0` for a zero-denominator fraction (e.g. `"1/0"`) rather than `NaN`/`Infinity`.
  - Design element: Decision 2 (new test case).
  - Acceptance criteria reference: proposal.md "Edge cases considered".
  - Testability notes: Assert `monster.challengeRating === 0` for `challenge_rating: "1/0"`.
- Requirement: `parseChallengeRating` must return `0` for a non-numeric, non-fraction string (e.g. `"CR5"` or `""`).
  - Design element: Decision 2 (new test case).
  - Acceptance criteria reference: proposal.md "Edge cases considered".
  - Testability notes: Assert `monster.challengeRating === 0` for `challenge_rating: "CR5"`.
- Requirement: `parseChallengeRating` must correctly parse a bare numeric string (e.g. `"5"`) as `5`, exercising the `parseFloat` fallback branch (not the `"/"` branch).
  - Design element: Decision 2 (new test case).
  - Acceptance criteria reference: proposal.md "Edge cases considered".
  - Testability notes: Assert `monster.challengeRating === 5` for `challenge_rating: "5"`.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Import of low-CR monsters (CR < 1) from the live Open5E API must not silently produce an incorrect challenge rating due to an untested code path.
  - Design element: Decision 2 (test coverage closes the previously-blind fraction-parsing branch).
  - Acceptance criteria reference: proposal.md "Why" / "Business impact".
  - Testability notes: Covered entirely by the new unit tests; no new integration/E2E test is needed since `transformMonster` is a pure function.

## Risks / Trade-offs

- Risk/trade-off: Widening the type to `number | string` is a narrow fix; if Open5E's real payload ever includes a third shape (e.g. `null` for unrated creatures), the interface would again be inaccurate.
  - Impact: Low — `parseChallengeRating` treats its input as `unknown` regardless of the declared interface type, so a mismatch here affects type-checking accuracy, not runtime correctness.
  - Mitigation: `parseChallengeRating` keeps its `unknown` parameter unchanged, preserving defense-in-depth independent of the interface's precision.
- Risk/trade-off: New tests could reveal existing fraction-parsing behavior a reviewer disagrees with (e.g., should `"1/0"` throw instead of silently returning `0`?).
  - Impact: Low, contained to code review before merge — no production impact since this is caught by tests, not shipped behavior.
  - Mitigation: Each new test's expected value is spelled out in tests.md up front for reviewer sign-off before implementation.

## Rollback / Mitigation

- Rollback trigger: If the type-widening change introduces unexpected TypeScript errors elsewhere in the codebase where `Open5ECreature.challenge_rating` is consumed as a strict `number` (currently only `parseChallengeRating`, which already accepts `unknown`, so none are expected).
- Rollback steps: Revert the single-line type change in `lib/import/open5eAdapter.ts` and the added test cases in `tests/unit/import/transformMonster.test.ts`; both are isolated, single-file edits with no migration or persisted-state impact.
- Data migration considerations: None — this is a compile-time type change and test additions only; no runtime data is migrated or altered.
- Verification after rollback: `npm run test:unit` and `tsc --noEmit` (or project's standard type-check command) pass as they did before this change.

## Operational Blocking Policy

- If CI checks fail: Fix the failing check before merging; do not bypass with `--admin` or skip flags (per project convention — see `feedback_no_admin_merge` memory). Given the change is two small, isolated edits, a CI failure most likely means either a type error was missed elsewhere or a new test assertion is wrong — investigate and fix rather than waive.
- If security checks fail: Not expected — no new dependencies, no user input handling, no external calls added. If Verity flags anything, treat as a genuine finding and fix; do not waive without a human-reviewed reason per project's quality-gate policy.
- If required reviews are blocked/stale: Standard PR review wait; this change is small enough that a stale review should be pinged rather than bypassed.
- Escalation path and timeout: No special timeout — follow the repo's normal PR review cadence. Given the change's small size, escalate to the repo owner only if blocked more than a few days with no reviewer response.

## Open Questions

- None outstanding. All ambiguity was resolved during the preceding explore-mode session, and this design does not introduce new decisions requiring further stakeholder input beyond the proposal's already-approved scope.
