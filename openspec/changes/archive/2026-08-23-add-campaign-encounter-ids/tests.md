---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `add-campaign-encounter-ids`
change. All work should follow a strict TDD (Test-Driven Development)
process: write the failing test first, then the minimal code to pass it,
then refactor.

Target file: `tests/unit/lib/storage.test.ts`, inside the existing
`describe("normalizeCampaign (via loadCampaignById)", ...)` block
(line 151), which already exercises `normalizeCampaign()` indirectly via
`storage.loadCampaignById()` against a mocked Mongo collection — new
cases should follow that same pattern rather than introducing a second
test harness.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code,
    write a test that captures the requirements of the task. Run the
    test and ensure it fails (type error or assertion failure).
2.  **Write code to pass the test:** Write the simplest possible code to
    make the test pass — the two-line diff described in `design.md`
    Decisions 1 and 2.
3.  **Refactor:** Improve the code quality and structure while ensuring
    the test still passes. No refactor is expected to be needed given the
    size of this change.

## Test Cases

- [ ] **Test case 1 (task: "Add `encounterIds?: string[]` to `Campaign`")** —
  Type-level check: a test fixture / mock campaign object literal that
  includes `encounterIds: ['enc-1', 'enc-2']` compiles without a
  TypeScript error against the `Campaign` interface. (Enforced by
  `tsc --noEmit` in Validation, not a runtime assertion; the unit test
  file itself constructing such a fixture is sufficient evidence since
  the suite runs through the TS/SWC toolchain.)
  Maps to: `specs/campaign-model/spec.md` — Scenario "Type declaration
  accepts encounterIds".

- [ ] **Test case 2 (task: "Add the normalization line to
  `normalizeCampaign()`")** — Legacy doc with no `encounterIds` key:
  mock `findOne` to return a campaign document that omits `encounterIds`
  entirely; call `storage.loadCampaignById(id, userId)`; assert the
  returned object's `encounterIds` is `[]`.
  Maps to: `specs/campaign-model/spec.md` — Scenario "Load legacy
  campaign with no encounterIds field defaults to empty array".
  Maps to: `tasks.md` Execution — unit test bullet, sub-bullet 1.

- [ ] **Test case 3** — Doc with a valid `encounterIds` array: mock
  `findOne` to return a campaign document with
  `encounterIds: ['enc-1', 'enc-2']`; call
  `storage.loadCampaignById(id, userId)`; assert the returned object's
  `encounterIds` is exactly `['enc-1', 'enc-2']`, unchanged.
  Maps to: `specs/campaign-model/spec.md` — Scenario "Load campaign with
  existing encounterIds preserves the array".
  Maps to: `tasks.md` Execution — unit test bullet, sub-bullet 2.

- [ ] **Test case 4** — Doc with a malformed non-array `encounterIds`
  value (e.g. `encounterIds: null`): mock `findOne` to return such a
  document; call `storage.loadCampaignById(id, userId)`; assert the
  returned object's `encounterIds` is `[]`.
  Maps to: `specs/campaign-model/spec.md` — Scenario "Load campaign with
  a malformed encounterIds value defaults to empty array".
  Maps to: `tasks.md` Execution — unit test bullet, sub-bullet 3.

- [ ] **Test case 5 (regression guard)** — Existing assertions in the
  `describe("normalizeCampaign (via loadCampaignById)", ...)` block for
  `chapters`, `status`, and `notes` defaulting continue to pass
  unmodified, proving this change doesn't alter unrelated normalization
  behavior.
  Maps to: `proposal.md` — "No behavior change for existing campaigns
  beyond the new field being present."
  Maps to: `design.md` — Functional Requirements Mapping, third
  requirement.

- [ ] **Test case 6 (save round-trip, optional but recommended if an
  equivalent `saveCampaign` test harness already exists)** — An in-memory
  `Campaign` object with `encounterIds: ['enc-1']` passed to
  `storage.saveCampaign()` results in the mocked `updateOne`'s `$set`
  payload including `encounterIds: ['enc-1']`.
  Maps to: `specs/campaign-model/spec.md` — Scenario "Saving a campaign
  persists encounterIds without a dedicated write path".
  Note: only add this if `tests/unit/lib/storage.test.ts` already has a
  `saveCampaign` test block to extend; do not stand up a new mock harness
  solely for this — the behavior is a direct consequence of the existing
  spread-into-`$set` implementation and is lower-risk than the read-path
  cases above.
