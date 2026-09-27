---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `wire-roll-validator-client-712` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

All test cases live in `tests/unit/lib/dice/useRollSubmission.test.ts`.

- [ ] **Oversized formula is rejected locally** — `submitRoll` called with a `formula` string of `MAX_FORMULA_LENGTH + 1` characters; assert result is `'error'` and `global.fetch` was not called.
  - Task: "Write failing unit tests first (TDD)" / "Implement the validation gate" (tasks.md, Execution)
  - Scenario: specs/roll-submission-validation/spec.md → "Oversized formula is rejected locally"
- [ ] **Oversized rolls array is rejected locally** — `submitRoll` called with a `rolls` array of `MAX_DICE_IN_ROLL + 1` valid entries; assert result is `'error'` and `global.fetch` was not called.
  - Task: "Write failing unit tests first (TDD)" / "Implement the validation gate"
  - Scenario: "Oversized rolls array is rejected locally"
- [ ] **Out-of-range die value (above max) is rejected locally** — `submitRoll` called with a `rolls` entry of `MAX_DIE_VALUE + 1`; assert result is `'error'` and `global.fetch` was not called.
  - Task: "Write failing unit tests first (TDD)" / "Implement the validation gate"
  - Scenario: "Out-of-range die value is rejected locally"
- [ ] **Out-of-range die value (below min) is rejected locally** — `submitRoll` called with a `rolls` entry of `0`; assert result is `'error'` and `global.fetch` was not called.
  - Task: "Write failing unit tests first (TDD)" / "Implement the validation gate"
  - Scenario: "Out-of-range die value is rejected locally"
- [ ] **Out-of-range total (positive overflow) is rejected locally** — `submitRoll` called with `total = MAX_TOTAL_MAGNITUDE + 1`; assert result is `'error'` and `global.fetch` was not called.
  - Task: "Write failing unit tests first (TDD)" / "Implement the validation gate"
  - Scenario: "Out-of-range total is rejected locally"
- [ ] **Out-of-range total (negative overflow) is rejected locally** — `submitRoll` called with `total = -(MAX_TOTAL_MAGNITUDE + 1)`; assert result is `'error'` and `global.fetch` was not called.
  - Task: "Write failing unit tests first (TDD)" / "Implement the validation gate"
  - Scenario: "Out-of-range total is rejected locally"
- [ ] **Maximum legitimate pool roll still submits** — `submitRoll` called with a payload shaped like `useDicePoolState.buildRoll()`'s max output (`MAX_DICE_IN_ROLL` dice at `MAX_DIE_VALUE`, `total` within `MAX_TOTAL_MAGNITUDE`); assert `global.fetch` is called with the unmodified payload and the existing `201`/`409`/other → `'success'`/`'conflict'`/`'error'` mapping is preserved.
  - Task: "Add boundary happy-path unit tests"
  - Scenario: "A well-formed pool roll is still submitted"
- [ ] **Percentile (d%) roll still submits** — `submitRoll` called with `formula: 'd%'` and a single `rolls` entry in `1..100`; assert `global.fetch` is called with the unmodified payload.
  - Task: "Add boundary happy-path unit tests"
  - Scenario: "A well-formed percentile (d%) roll is still submitted"
- [ ] **Existing baseline tests remain green, unmodified** — re-run the pre-existing tests (`201` → `'success'`, bodyless `201` → `'success'` without parsing JSON, campaign-id URL-encoding, `409` → `'conflict'`, `500` → `'error'`, thrown network error → `'error'`) and confirm none required a code or assertion change.
  - Task: "Run the new and existing tests; confirm all pass (green)"
  - Scenario: NFR "`safeParse` never throws" (reliability) — confirmed by these tests continuing to pass without new `try`/`catch` around the parse gate.
