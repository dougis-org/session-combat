---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-open5e-challenge-rating-type` change. All work should follow a strict TDD (Test-Driven Development) process: write each failing test below before touching implementation code, confirm it fails for the right reason, then make the minimal change to pass it.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

All new test cases live in `tests/unit/import/transformMonster.test.ts`, calling `transformMonster` with a raw creature object that varies only `challenge_rating`, and asserting on `result.monster.challengeRating`.

- [ ] **Test case 1** (maps to tasks.md "Widen `Open5ECreature.challenge_rating` type" + specs "Transform monster data with numeric challenge rating"): Confirm existing tests with `challenge_rating: 0.25`, `challenge_rating: 10`, and `challenge_rating: 0` still pass unchanged after the type widening (regression guard — no new test needed, just re-run existing suite).
- [ ] **Test case 2** (maps to tasks.md fraction-string test + specs "Transform monster data with fraction-string challenge rating"): `transformMonster({..., challenge_rating: "1/2"})` → `result.monster.challengeRating === 0.5`. Write this test first, confirm it fails against the current `number`-only interface type (TS error) or passes at runtime but was previously unverified, then confirm the type widening + existing parser logic make it pass.
- [ ] **Test case 3** (maps to tasks.md additional fraction tests + specs "Transform monster data with additional fraction-string challenge ratings"): `transformMonster({..., challenge_rating: "1/4"})` → `result.monster.challengeRating === 0.25`.
- [ ] **Test case 4** (same mapping as case 3): `transformMonster({..., challenge_rating: "1/8"})` → `result.monster.challengeRating === 0.125`.
- [ ] **Test case 5** (maps to tasks.md zero-denominator test + specs "Transform monster data with zero-denominator fraction challenge rating"): `transformMonster({..., challenge_rating: "1/0"})` → `result.monster.challengeRating === 0`, and the call does not throw and does not produce `NaN` or `Infinity` (assert `Number.isFinite(result.monster.challengeRating)` is `true`).
- [ ] **Test case 6** (maps to tasks.md non-numeric-string test + specs "Transform monster data with non-numeric challenge rating string"): `transformMonster({..., challenge_rating: "CR5"})` → `result.monster.challengeRating === 0`.
- [ ] **Test case 7** (same mapping as case 6, second example): `transformMonster({..., challenge_rating: ""})` → `result.monster.challengeRating === 0`.
- [ ] **Test case 8** (maps to tasks.md bare numeric-string test + specs "Transform monster data with bare numeric-string challenge rating"): `transformMonster({..., challenge_rating: "5"})` → `result.monster.challengeRating === 5`.
- [ ] **Test case 9** (maps to specs NFAC "No silent misclassification of low-CR creatures on import"): Confirm test cases 2-8 collectively give 100% branch coverage of `parseChallengeRating` (all three branches: numeric passthrough, `"/"`-fraction split, `parseFloat` fallback) — verify via the project's coverage report after adding the above tests, no separate test needed beyond cases 2-8.

## Type-Check Verification

- [ ] After widening `Open5ECreature.challenge_rating` to `number | string` in `lib/import/open5eAdapter.ts`, run the project's type-check command and confirm no new TypeScript errors are introduced anywhere `Open5ECreature` is consumed (expected: none, since the only consumer, `parseChallengeRating`, already accepts `unknown`).
