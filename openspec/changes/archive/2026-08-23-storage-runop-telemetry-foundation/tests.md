---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `storage-runop-telemetry-foundation`
change. All work should follow a strict TDD (Test-Driven Development)
process: write each failing test first, implement the minimal code to pass
it, then refactor. Test files: `tests/unit/lib/storage/errors.test.ts`,
`tests/unit/lib/telemetry/logger.test.ts`, `tests/unit/lib/storage/runOp.test.ts`.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### `lib/storage/errors.ts` (task: implement `StorageError`)

- [ ] `StorageError` instance exposes `error.cause === originalError` when constructed with `{ cause: originalError }` — maps to spec scenario "StorageError construction"
- [ ] `StorageError` instance exposes `error.op === "loadSpellById"` and `error.collection === "spellTemplates"` for `new StorageError("loadSpellById", "spellTemplates", { cause: originalError })` — maps to spec scenario "StorageError construction"
- [ ] `error instanceof Error` is `true` and `error.name === "StorageError"` — maps to spec scenario "StorageError construction"
- [ ] `error.message` includes both the op name and collection name (human-readable, per design.md Decision 3's chosen message format) — maps to spec scenario "StorageError construction"

### `lib/telemetry/logger.ts` (task: implement `logStorageEvent`)

- [ ] `logStorageEvent({ name, collection, outcome: "success", durationMs })` emits a log entry containing `name`, `collection`, `outcome`, `durationMs`, with no `error` field required — maps to spec scenario "Success event"
- [ ] `logStorageEvent({ name, collection, outcome: "not_found", durationMs })` emits a log entry with `outcome: "not_found"` and the same required fields — maps to spec requirement "logStorageEvent emits a fixed structured shape" (not-found variant)
- [ ] `logStorageEvent({ name, collection, outcome: "error", durationMs, error })` emits a log entry containing all of `name`, `collection`, `outcome: "error"`, `durationMs`, and a reference to the passed `error` — maps to spec scenario "Error event carries the original error"
- [ ] Every call to `logStorageEvent` produces the same field set across all three `outcome` values (no outcome-specific field drops except `error` being present only when passed) — maps to spec NFR "Duration is captured for every operation" (shape consistency underpins the timing requirement)

### `lib/storage/runOp.ts` (task: implement `runStorageOp`)

- [ ] `runStorageOp({ name, collection, isEmpty: (r) => r === null }, fn)` where `fn()` resolves to `null` resolves to `null` without throwing — maps to spec scenario "Single-record lookup finds nothing"
- [ ] Same call as above logs exactly one `logStorageEvent` call with `outcome: "not_found"` — maps to spec scenario "Single-record lookup finds nothing"
- [ ] `runStorageOp({ name, collection }, fn)` (no `isEmpty`) where `fn()` resolves to `[]` resolves to `[]` without throwing, and logs `outcome: "success"` (not `"not_found"`) — maps to spec scenario "List query finds nothing"
- [ ] `runStorageOp({ name, collection }, fn)` where `fn()` resolves to a non-empty value logs `outcome: "success"` and returns the value unmodified — maps to spec requirement "Not-found results never throw" (baseline success case, implied by contrast with the not-found scenarios)
- [ ] `runStorageOp({ name: "loadSpellById", collection: "spellTemplates" }, fn)` where `fn()` rejects with `new Error("connection refused")` rejects with a `StorageError` instance (not the original error, not a sentinel) — maps to spec scenario "Wrapped operation throws"
- [ ] Same rejection case logs exactly one `logStorageEvent` call with `outcome: "error"` and the original error attached — maps to spec scenario "Wrapped operation throws"
- [ ] `runStorageOp({ name, collection, isEmpty: (r) => r === null }, fn)` where `fn()` rejects never invokes the `isEmpty` classifier and still rejects with a `StorageError` — maps to spec scenario "Failure occurs regardless of an isEmpty classifier being present"
- [ ] The `StorageError` thrown by `runStorageOp` has `error.op` and `error.collection` matching the `name`/`collection` passed to the corresponding `logStorageEvent` call — maps to spec scenario "StorageError thrown by runStorageOp is correlatable to its log line"
- [ ] `durationMs` logged is greater than or equal to 0 and reflects elapsed time around the `fn()` call, verified for at least one success and one error case using a controllable delay (e.g. fake timers or a `setTimeout`-based `fn()`) — maps to spec NFR "Duration is captured for every operation"

### Isolation / zero-blast-radius (task: confirm no existing imports)

- [ ] `lib/storage.ts` contains no import of `lib/storage/runOp.ts`, `lib/storage/errors.ts`, or `lib/telemetry/logger.ts` (grep-based or static-analysis assertion, run as part of validation rather than a jest test if more appropriate) — maps to spec scenario "Zero blast radius on existing code"
- [ ] Full existing test suite (all files under `tests/unit/` that reference `storage`) passes unmodified after this change is applied — maps to spec scenario "Zero blast radius on existing code"
