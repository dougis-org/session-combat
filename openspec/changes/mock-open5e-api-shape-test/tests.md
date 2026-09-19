---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `mock-open5e-api-shape-test` change. Most tasks here are deletions/configuration (remove a dead test file, add a manual script, wire an `npm run` entry) rather than new production logic, so "TDD" here means: write the verification check first (a failing grep/command/assertion that proves the current state doesn't yet satisfy the requirement), then make the change, then confirm the check passes. Where the script's own shape-checking logic is genuinely testable code, it follows real red/green TDD.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test/check:** Before making the change, write or run the verification command and confirm it fails/shows the pre-change state.
2.  **Make the change:** Do the minimal edit (delete file / add script / add npm script) to satisfy the check.
3.  **Confirm the check passes; refactor if needed** while keeping it passing.

## Test Cases

### Task: Delete `tests/integration/api/open5eApiShape.test.ts`

- [ ] **Failing check (before):** `npx jest --config=jest.integration.config.js --listTests | grep open5eApiShape` returns the file path (proves it's currently discovered by the integration test runner).
- [ ] **Passing check (after):** same command returns no results — the file is gone and not discovered.
- [ ] Maps to spec scenario: "REMOVED Requirement: Live-network Open5E API shape/connectivity Jest tests" (`specs/open5e-api-shape-verification/spec.md`).

### Task: Add `lib/scripts/checkOpen5eApiShape.ts` using `Open5EClient`

- [ ] **Failing check (before):** file does not exist (`test -f lib/scripts/checkOpen5eApiShape.ts` fails).
- [ ] **Static check (after):** `grep -n "new Open5EClient" lib/scripts/checkOpen5eApiShape.ts` matches, and `grep -n "fetchWithRetry\|fetch(" lib/scripts/checkOpen5eApiShape.ts` shows no raw `fetch(` call outside of what `Open5EClient` itself performs (i.e., the script never calls global `fetch` directly).
- [ ] **Type check (after):** `npm run typecheck` passes with the new file included, confirming it correctly imports and uses `Open5ECreature`/`Open5ESpell`/`Open5EClient` types with no `any` bypass.
- [ ] **Behavioral check — success path (manual, live API):** run `npm run check:open5e-api-shape` against the real Open5E API; confirm exit code `0` and a printed pass message covering both creatures and spells.
  - Maps to spec scenario: "Script reports success when the live API matches the expected shape."
- [ ] **Behavioral check — failure path (manual, simulated):** temporarily point the script at an invalid host/port (e.g., via a quick local edit or an env override if the script supports one) or run with network disabled; confirm non-zero exit and an error message naming the endpoint/status.
  - Maps to spec scenario: "Script fails loudly on an unreachable or erroring API."
- [ ] **Behavioral check — shape-mismatch path (manual, simulated):** temporarily feed the script a locally-mocked response missing an expected field (e.g., by swapping in `createMockFetch({...SAMPLE_CREATURE, key: undefined})`-style data during a throwaway local run, or reasoning through the assertion code) and confirm it reports which field/assertion failed rather than passing silently.
  - Maps to spec scenario: "Script fails loudly when the live shape no longer matches expectations."
  - Note: since this script is intentionally outside the Jest tree (design Non-Goal / Decision 1), this case is verified by manual/local dry run and code review, not by a new Jest test file — adding one would reintroduce exactly the `tests/` discovery risk this change removes.

### Task: Add `check:open5e-api-shape` to `package.json`

- [ ] **Failing check (before):** `npm run check:open5e-api-shape` fails with "Missing script."
- [ ] **Passing check (after):** `npm run check:open5e-api-shape` resolves to `npx tsx lib/scripts/checkOpen5eApiShape.ts` and executes (see behavioral checks above for outcome verification).
  - Maps to spec scenario: "Script is runnable via npm."

### Task: Confirm no other file references the deleted test path

- [ ] **Check:** `grep -rn "open5eApiShape" tests/ lib/ app/` matches only `lib/scripts/checkOpen5eApiShape.ts` (and nothing under `tests/`).

### Cross-cutting: no automated suite depends on the new script

- [ ] **Check:** `npm run test:unit` file list (via `--listTests` or `--testPathPattern`) does not include `lib/scripts/checkOpen5eApiShape.ts`; `npm run test:integration --listTests` likewise excludes it (confirms it's outside both `jest.config.js` and `jest.integration.config.js` `testMatch` patterns).
  - Maps to NFAC scenario: "No CI or scheduled dependency on script success."

### Regression: existing Open5E adapter tests unaffected

- [ ] **Check:** `npm run test:unit -- --testPathPattern=open5eAdapter` and the existing `tests/unit/import/open5eAdapter.test.ts` / `tests/helpers/open5eTestHelpers.ts` remain unmodified and passing — confirms this change didn't touch the mocked client tests or fixtures (explicitly out of scope).
