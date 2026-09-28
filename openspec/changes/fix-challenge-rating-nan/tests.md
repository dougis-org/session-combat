---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-challenge-rating-nan` change. All work should follow a strict TDD (Test-Driven Development) process. Target file: `tests/unit/import/transformMonster.test.ts` (covers `lib/import/transformMonster.ts`).

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

Maps to task "Add regression tests" and "Implement fix" in `tasks.md`, and to the scenarios in `specs/monster-import/spec.md`.

- [x] **Test 1 — Non-numeric numerator falls back to zero (the bug, issue #757).**
  Add to `tests/unit/import/transformMonster.test.ts`:
  `transformMonster({ ..., challenge_rating: "x/2" })` → `result.challengeRating === 0`.
  Maps to: spec scenario "Fraction with non-numeric numerator falls back to zero".
  TDD: run first against unmodified `parseChallengeRating` and confirm it fails (`NaN !== 0`); then apply the `Number.isFinite(num)` guard and confirm it passes.

- [x] **Test 2 — Non-numeric denominator already falls back to zero (regression lock-in).**
  Add: `transformMonster({ ..., challenge_rating: "2/x" })` → `result.challengeRating === 0`.
  Maps to: spec scenario "Fraction with non-numeric denominator falls back to zero".
  TDD: this should already pass on unmodified code (`den = NaN`, `NaN > 0` is `false`); run it before the fix to confirm it passes today, then confirm it still passes after the fix (no regression).

- [x] **Test 3 — Existing valid-fraction and zero-denominator behavior unchanged.**
  Confirm existing test cases for `challenge_rating: "1/2"` → `0.5` and `challenge_rating: "1/0"` → `0` (added by the archived `fix-open5e-challenge-rating-type` change) still pass unmodified after the fix.
  Maps to: spec scenario "Valid fraction and zero-denominator behavior unchanged".
  TDD: no new test needed if already present in the suite — verify by running the full file before and after the change; add explicitly only if not already covered.

- [x] **Test 4 — No-NaN reliability invariant.**
  For both Test 1 and Test 2 inputs, additionally assert `Number.isFinite(result.challengeRating) === true`.
  Maps to: NFAC scenario "No NaN propagation from import pipeline".
  TDD: fails for the "x/2" case before the fix (`Number.isFinite(NaN) === false`), passes after.

## Verification Commands

- `node node_modules/.bin/jest tests/unit/import/transformMonster.test.ts` — run the targeted file
- `npm run test:unit` — run the full unit suite to confirm no regressions elsewhere
