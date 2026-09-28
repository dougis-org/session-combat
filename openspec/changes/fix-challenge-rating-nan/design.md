## Context

- Relevant architecture: `lib/import/transformMonster.ts` transforms an `Open5ECreature` (external API shape) into a `MonsterTemplate` (internal shape). `parseChallengeRating(rating: unknown): number` is a private helper called once, from within `transformMonster`, to populate `MonsterTemplate.challengeRating`.
- Dependencies: None new. No package or type changes required.
- Interfaces/contracts touched: `parseChallengeRating` (unexported, internal helper) only. `transformMonster`'s exported signature and `MonsterTemplate` shape are unchanged.

## Goals / Non-Goals

### Goals

- Ensure `parseChallengeRating` never returns `NaN` for any string input, fraction-form or not.
- Add regression coverage for the numerator-NaN case and the adjacent denominator-NaN case, via the existing `transformMonster` test suite.

### Non-Goals

- Exporting `parseChallengeRating` as a standalone unit for direct testing (this repeats the explicit decision made in the archived `fix-open5e-challenge-rating-type` change: test through `transformMonster`).
- Handling fraction strings with more than two `"/"`-separated segments.
- Changing the non-fraction (`parseFloat`) fallback path.

## Decisions

### Decision 1: Guard the numerator with `Number.isFinite` in the `"/"` branch

- Chosen: Change `return den > 0 ? num / den : 0;` to `return den > 0 && Number.isFinite(num) ? num / den : 0;`.
- Alternatives considered:
  - Validate both `num` and `den` with `Number.isFinite` for symmetry, dropping the `den > 0` check in favor of `Number.isFinite(den) && den > 0`. Rejected as unnecessary: `den > 0` already evaluates to `false` when `den` is `NaN` (per `NaN > 0 === false`), so the denominator side is already correctly guarded with no behavior change needed.
  - Pre-validate both segments before destructuring (e.g. `rating.split("/").every(...)`). Rejected as more code for the same outcome — the ternary-guard form matches the existing style and is a one-line diff.
- Rationale: `Number.isFinite` is the direct, standard-library way to reject `NaN` (and `Infinity`, which is also not a valid challenge rating) without introducing a new dependency or helper.
- Trade-offs: None meaningful. This is a strict tightening of an existing safety fallback; it cannot turn a previously-valid result into `0`.

### Decision 2: Extend the existing `transformMonster` test file rather than add a new test file or export `parseChallengeRating`

- Chosen: Add two `it(...)` cases (numerator-NaN → `0`, denominator-NaN → `0`) to the existing test suite that covers `transformMonster`'s challenge-rating parsing (established by the archived `fix-open5e-challenge-rating-type` change).
- Alternatives considered: Export `parseChallengeRating` and unit-test it directly. Rejected — the prior change's design.md (Decision 2) explicitly chose integration-style testing through `transformMonster` to avoid growing the module's public surface for a single internal helper; this change follows the same precedent for consistency.
- Rationale: Consistency with recently-established test structure in this exact file; avoids re-litigating a settled decision.
- Trade-offs: Test failure messages point to `transformMonster` output rather than the helper directly, but this matches existing tests in the same file and keeps the diff minimal.

## Proposal to Design Mapping

- Proposal element: Add a finite-number guard on the numerator in the `"/"` branch of `parseChallengeRating`.
  - Design decision: Decision 1.
  - Validation approach: Unit test asserting `transformMonster({..., challenge_rating: "x/2"}).challengeRating === 0`.
- Proposal element: Add regression test(s) via `transformMonster`, consistent with prior precedent.
  - Design decision: Decision 2.
  - Validation approach: Two new test cases in the existing `transformMonster` test file; run via `npm run test:unit`.

## Functional Requirements Mapping

- Requirement: `parseChallengeRating` must return `0` (not `NaN`) when the fraction-form numerator is non-numeric.
  - Design element: Decision 1 (`Number.isFinite(num)` guard).
  - Acceptance criteria reference: `tasks.md` / `tests.md` case "x/2 → 0".
  - Testability notes: Deterministic pure-function input/output; no mocking needed.
- Requirement: Existing fraction-parsing behavior (valid fractions, zero denominator, non-fraction numeric strings, numeric input) must remain unchanged.
  - Design element: Decision 1 (ternary only adds a conjunctive condition; cannot affect other branches).
  - Acceptance criteria reference: Existing test cases in the `transformMonster` suite (from the archived change) must continue to pass unmodified.
  - Testability notes: Run full existing suite alongside new cases to confirm no regression.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Import pipeline must never silently produce `NaN` in `MonsterTemplate.challengeRating` for any string input.
  - Design element: Decision 1.
  - Acceptance criteria reference: "x/2 → 0" and "2/x → 0" test cases.
  - Testability notes: Assert with `Number.isFinite(monster.challengeRating)` in addition to the exact expected value, to make the invariant explicit in the test.

## Risks / Trade-offs

- Risk/trade-off: None beyond what's already captured in proposal.md — this is a strict-subset tightening of an existing fallback.
  - Impact: Negligible.
  - Mitigation: Regression tests pin both old and new fallback paths.

## Rollback / Mitigation

- Rollback trigger: Any newly-failing test in the `transformMonster` suite after this change lands, or an unexpected production report of a previously-valid challenge rating now resolving to `0`.
- Rollback steps: Revert the single-line change to `parseChallengeRating` and the accompanying test additions; no data migration is involved since `challengeRating` is computed at import time, not stored pre-transform.
- Data migration considerations: None — this only affects values computed during future imports, not persisted data from past imports (a NaN already saved from a prior import is unaffected by this change and out of scope).
- Verification after rollback: Re-run `npm run test:unit` on the affected test file to confirm the suite passes at the reverted state.

## Operational Blocking Policy

- If CI checks fail: Fix the failing check before merging; this is a one-line logic change plus tests, so any CI failure indicates either a bad edit or an unrelated pre-existing issue that must be triaged separately (do not use `--admin` to bypass).
- If security checks fail: Not expected to trigger any (no new dependencies, no I/O, no user-facing surface change); investigate as a false positive per repo convention if it occurs.
- If required reviews are blocked/stale: Follow standard repo PR process; do not force-merge.
- Escalation path and timeout: If blocked more than one review cycle, flag to the requester (issue #757 author) for input; no hard timeout given the small scope.

## Open Questions

- None.
