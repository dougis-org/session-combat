---
name: tests
description: Tests for the extract-http-backoff-utils change
---

# Tests

## Overview

This document outlines the tests for the `extract-http-backoff-utils` change. All work follows a strict TDD process: write failing tests before any implementation, then implement against them, then refactor.

Test file: `tests/unit/import/http-utils.test.ts`
Existing adapter tests: `tests/unit/import/open5eAdapter` (must continue to pass without modification)

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Write the test that captures the requirement. Run it and confirm it fails (red).
2. **Write code to pass the test:** Write the simplest implementation to make it green.
3. **Refactor:** Improve structure while keeping tests green.

## Test Cases

### Task 2 — `calculateBackoffMs` (spec: ADDED calculateBackoffMs computes exponential backoff)

- [ ] `calculateBackoffMs(0)` returns `1000`
  - Spec: Backoff grows exponentially with attempt number
- [ ] `calculateBackoffMs(1)` returns `2000`
  - Spec: Backoff grows exponentially with attempt number
- [ ] `calculateBackoffMs(2)` returns `4000`
  - Spec: Backoff grows exponentially with attempt number
- [ ] `calculateBackoffMs(3)` returns `8000`
  - Spec: Backoff grows exponentially with attempt number
- [ ] `calculateBackoffMs(4)` returns `10000`
  - Spec: Backoff caps at MAX_BACKOFF_MS
- [ ] `calculateBackoffMs(5)` returns `10000`
  - Spec: Backoff caps at MAX_BACKOFF_MS

### Task 2 — `calculateBackoffMs` with Retry-After (spec: ADDED calculateBackoffMs respects Retry-After header)

- [ ] `calculateBackoffMs(0, "5")` returns `5000`
  - Spec: Retry-After value within cap
- [ ] `calculateBackoffMs(0, "30")` returns `10000`
  - Spec: Retry-After value exceeds cap
- [ ] `calculateBackoffMs(0, "0")` returns `0`
  - Spec: Retry-After value of zero
- [ ] `calculateBackoffMs(0, null)` falls through to exponential path and returns `1000`
  - Spec: No Retry-After header

### Task 2 — `handleRateLimitResponse` (spec: ADDED handleRateLimitResponse sleeps and signals retry when retries remain)

- [ ] Returns `true` when `attempt=0, retries=3`, no Retry-After header; sleep called with `1000`
  - Spec: Mid-sequence 429 triggers sleep and retry signal
- [ ] Returns `true` when `attempt=1, retries=3`, Retry-After="3"; sleep called with `3000`
  - Spec: 429 with Retry-After header uses header value for sleep

### Task 2 — `handleRateLimitResponse` last attempt (spec: ADDED handleRateLimitResponse returns false on last attempt without sleeping)

- [ ] Returns `false` when `attempt=3, retries=3`; no sleep called
  - Spec: Final attempt 429 returns false with no sleep

### Task 4 — Existing open5eAdapter tests (spec: MODIFIED fetchWithBackoff delegates backoff and rate-limit logic)

- [ ] All pre-existing tests in `tests/unit/import/open5eAdapter` pass without modification
  - Spec: End-to-end retry behaviour is unchanged
- [ ] No literal `10000` or `10_000` appears in `lib/import/open5eAdapter.ts`
  - Spec: No magic numeric literals remain in fetchWithBackoff
