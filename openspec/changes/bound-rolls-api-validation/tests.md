---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `bound-rolls-api-validation` change. All work follows strict TDD: write a failing test, write the minimum code to pass, refactor.

Traceability columns: **Task** = slice/step in `tasks.md`; **Scenario** = requirement scenario in `specs/roll-submission-validation/spec.md`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** capturing the task's requirement; run it and confirm it fails.
2. **Write the simplest code** to make it pass.
3. **Refactor** while keeping the test green.

## Test Cases

### Slice 1 — `lib/validation/rollSubmission.ts` (`tests/unit/lib/validation/rollSubmission.test.ts`)

- [ ] **T1.1** exported `MAX_DICE_IN_ROLL >= MAX_PER_DIE * DIE_SIDES.length` (Task 1a/1b → Scenario: "Bounds are derived from dice constants")
- [ ] **T1.2** exported `MAX_DIE_VALUE >= Math.max(...SUPPORTED_SIDES)` (Task 1a/1b → "Bounds are derived from dice constants")
- [ ] **T1.3** exported `MAX_TOTAL_MAGNITUDE >= MAX_DICE_IN_ROLL * MAX_DIE_VALUE + MAX_MODIFIER` (Task 1a/1b → "Bounds are derived from dice constants")
- [ ] **T1.4** `MAX_LABEL_LENGTH === 128` (Task 1a/1b → "Bounds are derived from dice constants")
- [ ] **T1.5** `MAX_FORMULA_LENGTH` accepts a fully-expanded max pool formula string (Task 1a/1b → "Accepts well-formed rolls unchanged")
- [ ] **T1.6** schema accepts a standard pool roll `{formula:"3d6 + 2", rolls:[4,2,5], total:13, visibility:{scope:"group"}}` (Task 1a/1b → "Normal pool roll still succeeds")
- [ ] **T1.7** schema accepts a `d%` roll `{formula:PERCENTILE_FORMULA, rolls:[87], total:87, visibility:{scope:"dm-only"}}` (Task 1a/1b → "Percentile (d%) roll still succeeds")
- [ ] **T1.8** schema accepts 120 dice entries + modifier producing near-max total (Task 1a/1b → "Maximum legitimate pool still succeeds")
- [ ] **T1.9** schema accepts empty `rolls` array (Task 1a/1b → "Empty rolls array remains acceptable")
- [ ] **T1.10** schema accepts a roll whose `total` != sum(`rolls`) (Task 1a/1b → "Total is not recomputed or cross-checked")
- [ ] **T1.11** schema accepts absent `label`, empty `label`, and whitespace `label` (Task 1a/1b → "Rejects out-of-bounds roll payloads" boundary / unchanged behavior)
- [ ] **T1.12** schema accepts a 128-char `label`, rejects a 129-char `label` (Task 1a/1b → "Oversized label is rejected")
- [ ] **T1.13** schema rejects `formula` longer than `MAX_FORMULA_LENGTH` (Task 1a/1b → "Oversized formula is rejected")
- [ ] **T1.14** schema rejects empty / whitespace-only `formula` (Task 1a/1b → "Rejects out-of-bounds roll payloads")
- [ ] **T1.15** schema rejects `rolls` length > `MAX_DICE_IN_ROLL` (Task 1a/1b → "Oversized rolls array is rejected")
- [ ] **T1.16** schema rejects a non-integer `rolls` entry (Task 1a/1b → "Out-of-range die value is rejected")
- [ ] **T1.17** schema rejects a `rolls` entry `< 1` and an entry `> MAX_DIE_VALUE` (Task 1a/1b → "Out-of-range die value is rejected")
- [ ] **T1.18** schema rejects non-finite `total` (`NaN`, `Infinity`) (Task 1a/1b → "Out-of-range total is rejected")
- [ ] **T1.19** schema rejects `|total| > MAX_TOTAL_MAGNITUDE`; accepts a large negative `total` within magnitude (Task 1a/1b → "Out-of-range total is rejected")
- [ ] **T1.20** schema rejects `visibility` absent, and `visibility.scope` not in `{group, dm-only}` (Task 1a/1b → "Invalid visibility scope is rejected")
- [ ] **T1.21** module import check: `lib/validation/rollSubmission.ts` imports only `zod` and `@/lib/utils/dice` (Task 1c → "Validator module is browser-safe")

### Slice 2 — `lib/server/readBoundedJson.ts` (`tests/unit/lib/server/readBoundedJson.test.ts`)

- [ ] **T2.1** body under cap → `{ ok: true, value }` with parsed object (Task 2a/2b → "Body at or under the cap proceeds to schema validation")
- [ ] **T2.2** body over cap → `{ ok: false, reason: 'oversize' }` and reader `cancel()` was called (Task 2a/2b → "Body over the cap is rejected with 413" + NFAC "Oversized body is not fully buffered")
- [ ] **T2.3** `Content-Length` header above cap → `{ ok: false, reason: 'oversize' }`, stream `getReader` never called (Task 2a/2b → "Oversized Content-Length is rejected without reading the body")
- [ ] **T2.4** valid-length but non-JSON text → `{ ok: false, reason: 'invalid-json' }` (Task 2a/2b → "Malformed JSON still returns 400")
- [ ] **T2.5** request with no readable body stream → `{ ok: false, reason: 'error' }` (Task 2a/2b → defensive; maps to route `500`)

### Slice 3 — rolls route (`tests/**/campaigns/[id]/rolls` route test)

Route tests mock `storage` and `emitFiltered`; assert call counts.

- [ ] **T3.1** body serialized `> ROLL_BODY_MAX_BYTES` → `413`; `storage.saveCampaignRoll` not called; `emitFiltered` not called (Task 3a/3b → "Body over the cap is rejected with 413")
- [ ] **T3.2** oversized `Content-Length` → `413`, no persist/broadcast (Task 3a/3b → "Oversized Content-Length is rejected without reading the body")
- [ ] **T3.3** oversized `formula` → `400`, no persist/broadcast (Task 3a/3b → "Oversized formula is rejected")
- [ ] **T3.4** `rolls` length > `MAX_DICE_IN_ROLL` → `400`, no persist/broadcast (Task 3a/3b → "Oversized rolls array is rejected")
- [ ] **T3.5** out-of-range die value → `400`, no persist/broadcast (Task 3a/3b → "Out-of-range die value is rejected")
- [ ] **T3.6** out-of-range / non-finite `total` → `400`, no persist/broadcast (Task 3a/3b → "Out-of-range total is rejected")
- [ ] **T3.7** `label` 129 chars → `400`, no persist/broadcast (Task 3a/3b → "Oversized label is rejected")
- [ ] **T3.8** `visibility.scope` invalid/absent → `400`, no persist/broadcast (Task 3a/3b → "Invalid visibility scope is rejected")
- [ ] **T3.9** `400` schema-failure body is a single concise `error` string; no raw zod issue array (Task 3a/3b → "Schema error body does not leak internal detail")
- [ ] **T3.10** malformed JSON → `400` `Invalid JSON`, no persist/broadcast (Task 3a/3b → "Malformed JSON still returns 400")
- [ ] **T3.11** JSON array / primitive body → `400`, no persist/broadcast (Task 3a/3b → "Non-object body still returns 400")
- [ ] **T3.12** valid payload, caller not an active member → `403`, no persist/broadcast (Task 3a/3b → "Non-member caller still returns 403")
- [ ] **T3.13** valid payload, campaign has no `activeSessionId` → `409`, no persist/broadcast (Task 3a/3b → "No active session still returns 409")
- [ ] **T3.14** standard pool roll → `201`; `storage.saveCampaignRoll` called once; `emitFiltered` called once; response echoes the stored `CampaignRoll` (Task 3a/3b → "Normal pool roll still succeeds")
- [ ] **T3.15** `d%` roll (`formula` = `PERCENTILE_FORMULA`, single entry 1..100) → `201` with persist + broadcast (Task 3a/3b → "Percentile (d%) roll still succeeds")
- [ ] **T3.16** 120-dice + 999-modifier max pool → `201` (Task 3a/3b → "Maximum legitimate pool still succeeds")
- [ ] **T3.17** in-bounds roll where `total` != sum(`rolls`) → `201`; stored `total` equals the submitted value verbatim (Task 3a/3b → "Total is not recomputed or cross-checked")
- [ ] **T3.18** empty `rolls` array, otherwise valid → `201` (Task 3a/3b → "Empty rolls array remains acceptable")
- [ ] **T3.19** on any `400`/`413` rejection, no `roll` event emitted and a subsequent identical-but-valid submission succeeds (Task 3a/3b → NFAC Reliability "Validation failure leaves no partial state")
- [ ] **T3.20** `rg` check: `lib/dice/useRollSubmission.ts` unchanged by this branch (Task 3d → confirms #712 scope boundary)

### Cross-cutting

- [ ] **T4.1** full unit suite green (`npm test`) (Validation)
- [ ] **T4.2** `tsc --noEmit` clean (Validation)
- [ ] **T4.3** `npm run build` succeeds (Validation / Remote push validation)
- [ ] **T4.4** every scenario in `specs/roll-submission-validation/spec.md` is referenced by at least one test case above (Task "Confirm acceptance criteria covered")
