## GitHub Issues

- #161

## Why

- Problem statement: `Open5ECreature.challenge_rating` is typed as `challenge_rating: number` in `lib/import/open5eAdapter.ts`, but the Open5E v2 creatures API can return challenge rating as a fraction string (e.g. `"1/2"`, `"1/4"`, `"1/8"`) for sub-CR-1 creatures. The downstream parser `parseChallengeRating` (`lib/import/transformMonster.ts`) already anticipates this — it accepts `unknown` and has a branch that splits on `"/"` — but that defensive handling is completely untested, and the exported interface type doesn't say a string is possible.
- Why now: GitHub issue #161 was filed against this adapter for interface/API-shape mismatches. Investigation during exploration confirmed the `desc`/`description` field named in the issue is already fixed in code, but the `challenge_rating` concern the issue also raised is still real and still uncovered by tests.
- Business/user impact: If Open5E returns a fraction string for a low-CR creature and the fraction-parsing branch has a latent bug (e.g. a malformed fraction, non-numeric parts, or a live API shape drift), monster imports for those creatures could silently produce an incorrect (or `0`) challenge rating with no test to catch a regression. This directly affects the accuracy of imported monster data used in combat encounters.

## Problem Space

- Current behavior:
  - `Open5ECreature.challenge_rating` is typed as `number` only.
  - `parseChallengeRating(rating: unknown)` handles three cases: numeric input, string containing `"/"` (split into numerator/denominator), and a `parseFloat` fallback for anything else (including bare numeric strings), defaulting to `0` when parsing fails.
  - No unit test exercises the string/fraction branch or the fallback branch with a non-numeric string. Existing tests in `tests/unit/import/transformMonster.test.ts` only pass numeric `challenge_rating` values (`0.25`, `10`, `0`).
  - The one integration test that documents live Open5E v2 shape (`tests/integration/api/open5eApiShape.test.ts`) does not assert anything about `challenge_rating`'s type, and both its `describe` blocks are `.skip`ped.
- Desired behavior:
  - `Open5ECreature.challenge_rating` type reflects both real shapes the API can return: `number | string`.
  - `parseChallengeRating`'s three branches (whole number, fraction string, fallback/invalid) are each covered by a unit test, including a case that proves the `0` fallback for unparseable input.
- Constraints:
  - No change to `MonsterTemplate.challengeRating`'s output type — it must remain a `number`; only the adapter-facing input type and its test coverage change.
  - No changes to `transformSpell.ts`, `dedupeEngine.ts`, or any other consumer of `Open5ECreature`/`Open5ESpell` — scope is limited to the `challenge_rating` field and its parser.
- Assumptions:
  - The fraction format Open5E returns is always `"<numerator>/<denominator>"` with both parts parseable as integers (consistent with existing `parseChallengeRating` logic) — this proposal does not change parsing behavior, only its type and test coverage.
  - `desc` vs `description` (the other named issue in #161) requires no further action; verified already correct in both `Open5ESpell` and the existing (skipped) integration test.
- Edge cases considered:
  - Fraction string with zero denominator (e.g. `"1/0"`) — existing code returns `0`; a test should confirm this and it should stay a defensive fallback rather than a thrown error.
  - Non-numeric string (e.g. `""`, `"CR5"`) — existing code falls through to `parseFloat(String(rating)) || 0`, yielding `0`; should be tested.
  - Whole-number values delivered as strings (e.g. `"5"`) — falls into `parseFloat` fallback branch, not the `"/"` branch; should be tested to confirm intended behavior.

## Scope

### In Scope

- Widen `Open5ECreature.challenge_rating` type in `lib/import/open5eAdapter.ts` to `number | string`.
- Add unit tests in `tests/unit/import/transformMonster.test.ts` (or a dedicated test for `parseChallengeRating` if it's exported/exportable) covering: numeric input, fraction-string input (`"1/2"`, `"1/4"`, `"1/8"`), zero-denominator fraction, non-numeric string fallback, and numeric-string fallback.
- Re-verify/document that `Open5ESpell.desc` already matches the API and needs no change (no code change, but note in tasks/tests as a completed acceptance criterion).

### Out of Scope

- Any change to `parseChallengeRating`'s parsing logic/algorithm itself (it already handles the cases correctly; only its test coverage and the input type are the gap).
- Un-skipping or otherwise modifying `tests/integration/api/open5eApiShape.test.ts` (live network-dependent test, separate concern).
- Any other field-shape mismatches in `Open5ECreature`/`Open5ESpell` not named in issue #161.
- Changes to `transformMonster`'s other normalization helpers (`normalizeAlignment`, `mapSize`, `normalizeSpeed`).

## What Changes

- `lib/import/open5eAdapter.ts`: `Open5ECreature.challenge_rating` type widened from `number` to `number | string`.
- `tests/unit/import/transformMonster.test.ts`: new test cases added for the fraction-string and fallback branches of `parseChallengeRating` via `transformMonster`.

## Risks

- Risk: Widening the type to `number | string` could mask a genuine future type error if Open5E ever returns something else entirely (e.g. `null`).
  - Impact: Low — `parseChallengeRating` already treats `rating: unknown`, so runtime behavior is unaffected regardless of the exported interface's declared type; this is a type-accuracy fix, not a behavior change.
  - Mitigation: Keep the `unknown` parameter on `parseChallengeRating` (already the case) so the parser stays defensive even if the interface type is later found to be incomplete again.
- Risk: New tests could reveal that the existing fraction-parsing logic has a subtle bug (e.g. `"1/0"` producing `0` is intentional per current code, but a reviewer might expect a different fallback).
  - Impact: Low — surfaced during test-writing, not in production; would only require a small logic tweak, kept in scope since it's directly tied to the code path being tested.
  - Mitigation: Document the exact expected value for each new test case in `tests.md` so behavior is explicit and reviewable before implementation.

## Open Questions

- None. Scope was narrowed from GitHub issue #161 during an explore-mode session (`/opsx:explore`) that investigated both named mismatches (`desc`/`description` and `challenge_rating`), confirmed the `desc` field is already correct, and confirmed the `challenge_rating` type/test gap is real. The user then explicitly instructed proceeding via `/opsx:propose`, which counts as approval per the schema's explore-mode exception.

## Non-Goals

- Achieving full parity between `Open5ECreature`/`Open5ESpell` and every field of the live Open5E v2 API (only the two items named in issue #161 were investigated; other fields are out of scope until separately reported).
- Re-enabling or fixing the skipped live-API integration test suite.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
