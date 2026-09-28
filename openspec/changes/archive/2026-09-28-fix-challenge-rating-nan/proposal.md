## GitHub Issues

- #757

## Why

- Problem statement: `parseChallengeRating` in `lib/import/transformMonster.ts` returns `NaN` instead of a safe fallback when a fraction-form challenge rating has a non-numeric numerator (e.g. `"x/2"`). The existing `den > 0 ? num / den : 0` guard only catches a non-positive denominator; it does not check that `num` is a finite number, so `NaN / 2` evaluates to `NaN` and is returned as-is.
- Why now: Surfaced during review of PR #755 (fix-open5e-challenge-rating-type), which widened the `Open5ECreature.challenge_rating` type and added coverage for the existing fraction/fallback branches, but explicitly left this parsing bug out of scope. Filed as issue #757 for follow-up.
- Business/user impact: If Open5E or a malformed import payload ever returns a fraction string with a non-numeric part, `MonsterTemplate.challengeRating` becomes `NaN`, silently corrupting any downstream code that displays, sorts, or compares challenge ratings (e.g. `NaN` sorts unpredictably and renders as the literal text "NaN" in the UI).

## Problem Space

- Current behavior: `parseChallengeRating("x/2")` → `Number("x") = NaN`, `den = 2 > 0` is true, so the function returns `NaN / 2 = NaN`.
- Desired behavior: Any fraction-form input where the numerator is not a finite number should fall back to `0`, matching the existing fallback behavior for a zero/negative denominator and for the non-fraction path (`parseFloat(String(rating)) || 0`).
- Constraints: Keep the fix minimal and localized to `parseChallengeRating`; do not change its exported surface (it is an internal, unexported function per the prior change's design decision to test only through `transformMonster`).
- Assumptions: The denominator side is already safe — `Number("x") = NaN`, and `NaN > 0` evaluates to `false`, so a non-numeric denominator (e.g. `"2/x"`) already falls back to `0` today. Only the numerator side needs a guard.
- Edge cases considered:
  - `"x/2"` (non-numeric numerator) → should become `0` (currently `NaN`, the bug).
  - `"2/x"` (non-numeric denominator) → already `0` today (den is NaN, `NaN > 0` is false). No change needed, but should be covered by a regression test alongside the fix.
  - `"1/0"` (zero denominator) → already `0` today; unaffected by this change.
  - `"1/2/3"` (extra fraction segments) → `split("/").map(Number)` destructures only the first two; the third segment is silently dropped. Out of scope for this issue.
  - Plain numeric strings and numbers are handled by other branches and are unaffected.

## Scope

### In Scope

- Add a finite-number guard on the numerator in the `"/"` branch of `parseChallengeRating` (`lib/import/transformMonster.ts`).
- Add regression test(s) via `transformMonster`, consistent with the precedent set in the archived `fix-open5e-challenge-rating-type` change (test through the public `transformMonster` function, not by exporting `parseChallengeRating`).

### Out of Scope

- Any change to how `parseChallengeRating` handles more than two `"/"`-separated segments (e.g. `"1/2/3"`).
- Any change to the non-fraction (`parseFloat`) path.
- Any change to `Open5ECreature.challenge_rating`'s type or other parts of the Open5E import pipeline beyond this one function.

## What Changes

- `lib/import/transformMonster.ts`: `parseChallengeRating`'s `"/"` branch gains a `Number.isFinite(num)` check alongside the existing `den > 0` check, so a non-numeric numerator falls back to `0` instead of propagating `NaN`.
- Test file covering `transformMonster` (existing suite from the archived challenge-rating change) gains a case for `challenge_rating: "x/2"` asserting `monster.challengeRating === 0`, plus a case for `"2/x"` to lock in the already-correct denominator behavior.

## Risks

- Risk: Changing the guard condition could alter behavior for some previously-unnoticed valid input pattern.
  - Impact: Low — the change only tightens the existing `0`-fallback to cover one more failure mode; it cannot make a currently-valid rating (finite `num`, positive `den`) return `0`.
  - Mitigation: Regression tests cover both the buggy case and the adjacent already-correct case to pin down behavior before and after.

## Open Questions

- None. This is a small, well-bounded bug fix with a fully specified repro, fix, and test case from the issue itself.

## Non-Goals

- Refactoring `parseChallengeRating` beyond the minimal guard.
- Handling malformed fraction strings with more than one `"/"`.
- Revisiting the "test through `transformMonster`, not a standalone export" testing decision from the prior change.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
