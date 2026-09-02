---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the
`migrate-content-reference-storage-domains` change. All work follows strict TDD
(fail → pass → refactor). Every case below maps to a task in `tasks.md` and an
acceptance scenario in
`specs/storage-content-reference-domains/spec.md`.

Test infrastructure: Jest. Mock `@/lib/db` (`getDatabase`) and
`@/lib/telemetry/logger` (`logStorageEvent`) per the pattern in
`tests/unit/lib/storage/membershipRepo.test.ts` and
`tests/unit/lib/storage/campaignRepo.test.ts`. Assert `StorageError` via
`import { StorageError } from "@/lib/storage/errors"` and
`DuplicateShareError` via `@/lib/errors`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** capturing the task's requirement; run it, confirm
   it fails.
2. **Write the simplest code** to pass it.
3. **Refactor** while keeping the test green.

## Test Cases

### Task Step 3 — Re-verify the inventory

- [ ] `inventory.json` cluster entry count matches the live method count on
  `storage` for the 18 cluster methods (method-count guardrail;
  spec: "All cluster methods are migrated")
- [ ] Manual note recorded for every drifted entry (e.g. `getNextSessionNumber`
  already on `runStorageOp`) — verified present in the PR description

### Task Step 4 — Caller audit

- [ ] Every non-test call site of the six swallow methods and two no-try roll
  methods is listed with its enclosing error boundary and resulting HTTP
  status (spec: "The six converting methods no longer swallow")
- [ ] Any unguarded caller has a follow-up sub-task and a regression test

### Task Step 5 — `sessionLogRepo.ts` (spec: failures surface as StorageError;
not-found paths remain non-throwing)

- [ ] `loadSessionLogs`: `find` rejects → `rejects.toThrow(StorageError)` with
  `op === "loadSessionLogs"`, `collection === "sessionLogs"`, `error.cause` set,
  one `logStorageEvent({ outcome: "error" })`
- [ ] `loadSessionLogs`: query returns `[]` → resolves to `[]`, one
  `logStorageEvent({ outcome: "not_found" })`
- [ ] `loadSessionLogs`: query returns rows → resolves mapped + sorted
  descending by `sessionNumber`, one `logStorageEvent({ outcome: "success" })`
- [ ] `getNextSessionNumber`: `findOne` rejects → `StorageError` (`op`/`collection`
  correct), one error event (parity with
  `tests/unit/storage/sessionLog.test.ts`)
- [ ] `getNextSessionNumber`: no rows → resolves `1`; latest row `n` → resolves
  `n + 1`
- [ ] `saveSessionLog`: `insertOne` rejects → `StorageError`; success → resolves
  `undefined`, `_id` stripped from inserted doc
- [ ] `updateSessionLog`: `findOneAndUpdate` rejects → `StorageError`
- [ ] `updateSessionLog`: no matching doc → resolves `null` (not a throw)
- [ ] `updateSessionLog`: match → resolves normalized `SessionLog`, `datePlayed`
  coerced to `Date`, `campaignId` in patch ignored
- [ ] `deleteSessionLog`: `deleteOne` rejects → `StorageError`
- [ ] `deleteSessionLog`: `deletedCount === 0` → resolves `false`;
  `deletedCount === 1` → resolves `true`

### Task Step 6 — `shareRepo.ts` (spec: addShare preserves the
DuplicateShareError contract; failures surface as StorageError; not-found paths)

- [ ] `addShare`: `insertOne` rejects with `{ code: 11000 }` →
  `rejects.toThrow(DuplicateShareError)` for the right campaign/character; NOT a
  `StorageError`
- [ ] `addShare`: `insertOne` rejects with a generic error →
  `rejects.toThrow(StorageError)` (`op === "addShare"`,
  `collection === "campaignCharacterShares"`)
- [ ] `addShare`: success → resolves `undefined`, `_id` stripped
- [ ] `removeShare`: `deleteOne` rejects → `StorageError`
- [ ] `removeShare`: `deletedCount === 0` → `false`; `=== 1` → `true`
- [ ] `listSharesForCampaign`: `find` rejects → `StorageError`
- [ ] `listSharesForCampaign`: `[]` → resolves `[]`, `not_found` event; rows →
  normalized, `_id` stripped
- [ ] `listAllSharesForCampaign`: `find` rejects → `StorageError`
- [ ] `listAllSharesForCampaign`: `[]` → resolves `[]`; rows → normalized
- [ ] `tests/unit/lib/storage-shares.test.ts` passes unmodified (spec: facade
  shape preserved)

### Task Step 7 — `spellRepo.ts` (spec: failures surface as StorageError;
not-found and input-guard paths remain non-throwing; MODIFIED loadSpellById)

- [ ] `loadSpells`: `find` rejects → `StorageError` (`collection ===
  "spellTemplates"`)
- [ ] `loadSpells`: `[]` → resolves `[]`; rows → normalized; `concentration`
  filter still applied when passed; `GLOBAL_USER_ID` used when no `userId`
- [ ] `loadSpellById`: `findOne` rejects → `rejects.toThrow(StorageError)`
  (`op === "loadSpellById"`), one error event **(changed behavior — was
  `resolves(null)`)**
- [ ] `loadSpellById`: no matching doc → resolves `null`, `not_found` event
- [ ] `loadSpellById`: id empty / non-string / length > 64 → resolves `null`,
  `getDatabase` NOT called, `logStorageEvent` NOT called
- [ ] `deleteSpellTemplate`: `deleteOne` rejects → `StorageError`
- [ ] `deleteSpellTemplate`: bad-shape id → resolves without calling
  `getDatabase` / performing a delete
- [ ] `saveSpellTemplate`: `updateOne` rejects → `StorageError`; success → `_id`
  stripped, `buildEntityQuery` used, upsert
- [ ] `spellExistsByNameAndSource`: `countDocuments` rejects → `StorageError`
  **(changed behavior — was `resolves(false)`)**
- [ ] `spellExistsByNameAndSource`: count `0` → `false`; count `> 0` → `true`

### Task Step 8 — `rollRepo.ts` (spec: the two no-try roll methods gain a
wrapped failure path; performance — cursor unchanged; security — visibility
scoping unchanged)

- [ ] `saveCampaignRoll`: `insertOne` rejects → `rejects.toThrow(StorageError)`
  (`op === "saveCampaignRoll"`, `collection === "campaignRolls"`), one error
  event
- [ ] `saveCampaignRoll`: success → resolves `undefined`, `_id` stripped
- [ ] `listCampaignRolls`: `find` rejects → `StorageError`, one error event
- [ ] `listCampaignRolls`: fewer than `limit` docs → `{ rolls }` with no
  `nextCursor`; more than `limit` → `pop()` applied, `nextCursor ===` last
  remaining doc's `createdAt.toISOString()`
- [ ] `listCampaignRolls`: non-DM caller → `$or` filter contains only
  `group`-scope, `rollerId === userId`; DM caller → also `dm-only`
- [ ] `listCampaignRolls`: `opts.before` present → adds `createdAt: { $lt }` to
  the query
- [ ] `listCampaignRolls`: result rolls have `_id` stripped, sorted
  `createdAt: -1`
- [ ] Existing `listCampaignRolls` assertions ported from
  `tests/unit/lib/storage.test.ts` still hold

### Task Step 9 — `load` / `clear`

- [ ] `clear`: one collection `deleteMany` rejects → `rejects.toThrow(StorageError)`
  (`op === "clear"`), one error event (per Preflight decision; default = wrap)
- [ ] `clear`: success → all seven collections receive `deleteMany({ userId })`
- [ ] `load`: per the agreed disposition — if orchestration-only, a sub-loader
  rejecting propagates the `StorageError` (no partial-empty object); if wrapped,
  `rejects.toThrow(StorageError)`; if deleted, `facadeShape` test updated and
  `storage.load` absent
- [ ] `load` (if retained): success → aggregates
  `{ encounters, characters, parties, campaigns, combatState? }` from the
  per-domain loaders

### Task Step 10 — `loadSpellById` characterization test rewrite (spec:
characterization coverage remains green)

- [ ] `tests/unit/lib/storage.characterization.test.ts`: DB-error case asserts
  `rejects.toThrow(StorageError)` (was `resolves.toBeNull()`)
- [ ] Same file: genuine-not-found case still asserts `resolves` to `null`
- [ ] Same file: bad-shape id case still asserts `resolves` to `null`
- [ ] Full characterization suite green; changed assertion noted in PR body

### Task Step 11 — Spell-by-id route (spec: spell-by-id route distinguishes
outage from not-found)

- [ ] `tests/unit/api/spells/[id].route.test.ts` GET: `storage.loadSpellById`
  rejects with `StorageError` → response `500`, body `"Failed to load spell"`,
  `console.error` called
- [ ] GET: `storage.loadSpellById` resolves `null` → response `404`, body
  `"Spell not found"`
- [ ] PUT / DELETE: `storage.loadSpellById` rejects with `StorageError` →
  response `500` (not `404`)
- [ ] Route handler diff is empty (no logic change) — asserted by review, or
  the minimal change is documented

### Task Step 12 — `dedupeEngine.ts` (spec: spell dedupe tolerates a thrown
existence check)

- [ ] Dedupe unit test: `storage.spellExistsByNameAndSource` rejects with
  `StorageError` → import surfaces the failure; the affected item is NOT
  inserted as "not a duplicate"
- [ ] Dedupe happy path unchanged: `false` → treated as new, `true` → treated
  as duplicate

### Task Step 13 — Facade guardrails (spec: facade shape preserved)

- [ ] `tests/unit/lib/storage/facadeShape.test.ts` passes
- [ ] Own-enumerable method count on `storage` equal before/after
- [ ] `tsc --noEmit` reports no errors
- [ ] No cluster method body in `lib/storage.ts` contains `getDatabase(`
- [ ] `tests/unit/lib/storage.test.ts`, `storage.characters.test.ts`,
  `storage.campaignEncounters.test.ts`, and the session route tests
  (`tests/unit/api/campaigns/sessions.route.test.ts`,
  `tests/unit/api/campaigns/[id]/sessions/active.route.test.ts`,
  `tests/unit/storage/sessionLog.test.ts`) all pass unmodified

### Non-functional (spec: Performance / Security / Reliability)

- [ ] Reliability: for every migrated method, a thrown collection op yields
  exactly one `logStorageEvent({ outcome: "error" })` — asserted in each repo
  test
- [ ] Reliability: each migrated read emits exactly one event per terminal path
  with the matching `outcome`
- [ ] Security: `StorageError.message` for every cluster method contains only
  the op name and collection name — no driver text / connection string
  (single parametrized assertion over the repo functions)
- [ ] Security: `listCampaignRolls` visibility `$or` filter is byte-identical
  to pre-migration for non-DM and DM callers (covered in Step 8)
- [ ] Performance: `npm test` total runtime shows no regression beyond
  run-to-run variance; no method adds an `await` beyond `runStorageOp`'s
  `Date.now()` bracketing (diff review)

## Traceability

| Test group | tasks.md step | spec requirement |
|---|---|---|
| Inventory re-verify | Step 3 | Content and reference domain methods live in per-domain repos |
| Caller audit | Step 4 | Content/reference storage failures surface as StorageError |
| `sessionLogRepo` | Step 5 | failures surface as StorageError; not-found paths remain non-throwing |
| `shareRepo` | Step 6 | addShare preserves the DuplicateShareError contract; failures surface as StorageError |
| `spellRepo` | Step 7 | failures surface as StorageError; not-found and input-guard paths; MODIFIED loadSpellById error contract |
| `rollRepo` | Step 8 | the two no-try roll methods gain a wrapped failure path; NFAC Performance / Security |
| `load` / `clear` | Step 9 | Content and reference domain methods live in per-domain repos |
| Characterization rewrite | Step 10 | Characterization coverage remains green |
| Spell route | Step 11 | Spell-by-id route distinguishes outage from not-found |
| `dedupeEngine` | Step 12 | Spell dedupe tolerates a thrown existence check |
| Facade guardrails | Step 13 | Content/reference storage facade shape is preserved |
| Non-functional | Steps 5–8, 13 | NFAC Performance / Security / Reliability |
