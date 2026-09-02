---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `refactor-storage-issue-503` change
(migrate monsterTemplates / campaignTemplates / campaigns / membership storage
domains into per-domain repos on `runStorageOp`, plus the `rethrowAsIs`
foundation change). All work follows strict TDD: write a failing test, write the
minimum code to pass, refactor.

Test framework and location conventions follow the project's existing suites:
`tests/unit/lib/storage/*.test.ts` (repo units), `tests/unit/lib/utils/*` (util
units), `tests/integration/*` (route/integration). Reuse
`tests/**/test-helper-factories` and `tests/**/test-user-factory` where they fit.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** capturing the task's requirement; run it, confirm it fails.
2. **Write the simplest code** to make it pass.
3. **Refactor** while keeping the test green.

## Test Cases

### Sub-task B — `rethrowAsIs` foundation (`tests/unit/lib/storage/runOp.test.ts`)

Maps to spec: `storage-op-telemetry-foundation` → "Domain errors bypass
StorageError wrapping", "MODIFIED runStorageOp error handling".

- [ ] `rethrowAsIs` returns `true` for the thrown error → `runStorageOp` rejects
  with the **original** error instance (not `StorageError`)
- [ ] ...and still calls `logStorageEvent` exactly once with `outcome: "error"`,
  the `name`, `collection`, and a numeric `durationMs`
- [ ] `rethrowAsIs` returns `false` for the thrown error → `runStorageOp` rejects
  with `StorageError` whose `cause` is the original error
- [ ] `rethrowAsIs` omitted from `meta` → `runStorageOp` rejects with
  `StorageError` (regression guard; behavior identical to pre-change)
- [ ] `rethrowAsIs` predicate itself throws → error propagates (documented
  behavior; predicate is caller-controlled)
- [ ] success and not-found paths are unaffected by the presence of `rethrowAsIs`

### Sub-task B — cluster-1 regression

Maps to spec: `storage-op-telemetry-foundation` NFAC "Foundation change does not
regress migrated cluster 1 repos".

- [ ] Existing `encounterRepo` / `characterRepo` / `combatStateRepo` /
  `partyRepo` unit + integration suites pass unmodified after the `runOp.ts`
  change

### Sub-task D — monster templates (`tests/unit/lib/storage/monsterTemplateRepo.test.ts`)

Maps to spec: `storage-domain-decomposition` → "Campaign and template domain
methods live in per-domain repos", "Storage failures ... surface as
StorageError", "Empty and not-found results do not throw".

- [ ] `loadMonsterTemplates` — success returns `MonsterTemplate[]` with ids
  normalized
- [ ] `loadMonsterTemplates` — empty collection resolves to `[]`, no throw,
  `logStorageEvent` `outcome: "not_found"`
- [ ] `loadMonsterTemplates` — collection query rejects → rejects with
  `StorageError` (`op: "loadMonsterTemplates"`, `collection: "monsterTemplates"`),
  `logStorageEvent` `outcome: "error"` (was: returned `[]`)
- [ ] `loadGlobalMonsterTemplates` — delegates to `loadMonsterTemplates(GLOBAL_USER_ID)`
  via direct sibling call; DB failure → `StorageError`
- [ ] `loadAllMonsterTemplates` — merges user + global; result shape identical to
  pre-migration for the happy path
- [ ] `loadAllMonsterTemplates` — DB failure in either underlying call →
  `StorageError` (was: returned `[]`); 2 callers listed in the file header
- [ ] `saveMonsterTemplate` — upsert issued with `{id, userId}` filter; DB
  failure → `StorageError` (was: rethrew raw)
- [ ] `deleteMonsterTemplate` — DB failure → `StorageError`
- [ ] `monsterExistsByNameAndSource` — returns `true`/`false` for
  present/absent; DB failure → `StorageError` (was: returned `false`); no
  `isEmpty` so `false` is never logged as `not_found`
- [ ] `findMonsterByNameAndSource` — returns the doc or `null`; DB failure →
  `StorageError` (was: returned `null`)
- [ ] Every method reachable unchanged as `storage.<name>` with identical signature

### Sub-task E — campaign templates (`tests/unit/lib/storage/campaignTemplateRepo.test.ts`)

Maps to spec: `storage-domain-decomposition` same requirements.

- [ ] `loadGlobalCampaignTemplates` — success returns sorted (`name` asc,
  collation `en`/strength 2) `CampaignTemplate[]`
- [ ] `loadGlobalCampaignTemplates` — empty → `[]` no throw; DB failure →
  `StorageError` (was: `[]`)
- [ ] `loadGlobalCampaignTemplateById` — hit returns normalized doc; miss →
  `null` no throw; DB failure → `StorageError` (was: `null`)
- [ ] `saveCampaignTemplate` — upsert filter `{id, userId}`; DB failure →
  `StorageError`
- [ ] `deleteCampaignTemplate` — returns `true` when `deletedCount > 0`, `false`
  otherwise; DB failure → `StorageError`; `false` result never logged as
  `not_found`
- [ ] `storage.*` delegation signatures identical

### Sub-task F — campaigns (`tests/unit/lib/storage/campaignRepo.test.ts`)

Maps to spec: `storage-domain-decomposition` same requirements.

- [ ] `loadCampaigns` — success returns `Campaign[]` via
  `normalizeStoredEntityId` + `normalizeCampaign`
- [ ] `loadCampaigns` — empty → `[]`; DB failure → `StorageError` (was: `[]`)
- [ ] `loadCampaignById` — hit / miss (`null`) / DB failure (`StorageError`,
  was: `null`)
- [ ] `loadCampaignByIdAny` — hit / miss (`null`) / DB failure (`StorageError`)
- [ ] `saveCampaign` — upsert; DB failure → `StorageError`
- [ ] `deleteCampaign` — DB failure → `StorageError`
- [ ] `setActiveCampaignSession` — DB failure → `StorageError`
- [ ] `claimActiveCampaignSession` — returns `true` on `modifiedCount === 1`,
  `false` otherwise; DB failure → `StorageError`; `false` never logged
  `not_found`
- [ ] `listCampaignsForMember` — no memberships → `[]` (non-throwing early
  return preserved); memberships present → resolves summaries; DB failure at
  either query → `StorageError` (was: `[]`)
- [ ] `getCampaignsByIds` — empty input → `[]`; DB failure → `StorageError`
- [ ] `normalizeCampaign` moved into `campaignRepo.ts` and still applied on all
  read paths
- [ ] `storage.*` delegation signatures identical

### Sub-task G — membership (`tests/unit/lib/storage/membershipRepo.test.ts`)

Maps to spec: `storage-op-telemetry-foundation` → "addMember preserves its
duplicate-member contract"; `storage-domain-decomposition` → failure/empty
requirements.

- [ ] `addMember` — success inserts stripped of `_id`
- [ ] `addMember` — insert rejects with `{code: 11000}` → rejects with
  `DuplicateMemberError` for `campaignId`/`userId`, **NOT** `StorageError`
- [ ] `addMember` — insert rejects with a non-`11000` error → rejects with
  `StorageError` (`op: "addMember"`, `collection: "campaignMembers"`)
- [ ] `addMember` — `logStorageEvent` `outcome: "error"` emitted once on both
  failure paths
- [ ] `updateMemberStatus` — success pushes history entry; DB failure →
  `StorageError`
- [ ] `listMembersForCampaign` — members present → mapped `CampaignMember[]`
  (no `_id`); member-less campaign → `[]` no throw, `outcome: "not_found"`;
  DB failure → `StorageError` (was: `[]`). File header lists the 4 non-test
  callers and each one's post-change behavior.
- [ ] `getMember` — present → `CampaignMember` (no `_id`); absent → `null` no
  throw; DB failure → `StorageError` (not `null`, not raw driver error)
- [ ] `listInvitationsForUser` — success / empty (`[]`) / DB failure
  (`StorageError`)
- [ ] `getUserById` — hit / miss (`null`) / DB failure (`StorageError`)
- [ ] `getUsersByIds` — empty input → `[]`; partial match returns found subset;
  DB failure → `StorageError`
- [ ] `storage.*` delegation signatures identical

### Sub-task G — `DuplicateMemberError` call sites

Maps to spec: `storage-op-telemetry-foundation` → "addMember preserves its
duplicate-member contract" (edge scenario).

- [ ] `app/api/campaigns/[id]/members/route.ts` — a duplicate add still hits the
  `error instanceof DuplicateMemberError` branch and returns its existing
  status (not 500). Covered by existing route test running unmodified, plus an
  explicit assertion if not already present.
- [ ] `app/api/campaigns/global/[id]/copy/route.ts` and
  `app/api/campaigns/route.ts` — compile and behave unchanged (existing tests
  pass unmodified)

### Sub-task H — `getMember` / `assertCampaignAccess` (AC headline)

Maps to spec: `storage-domain-decomposition` → "Campaign access checks do not
mask storage failures as not-found".

- [ ] `assertCampaignAccess` — `storage.getMember` mocked to reject with
  `StorageError` → `assertCampaignAccess` rejects/throws, does **not** return
  the 404 `notFound()` response, does **not** call `loadCampaignByIdAny`
- [ ] `assertCampaignAccess` — `storage.getMember` resolves `null` → returns the
  404 `notFound()` response (unchanged)
- [ ] `assertCampaignAccess` — `storage.getMember` resolves an inactive member
  (`status !== 'active'`) → 404 `notFound()` (unchanged)
- [ ] Representative campaign-scoped route (e.g. a `GET /api/campaigns/[id]/...`
  handler) — `getMember` `StorageError` → HTTP 500, `StorageError` logged, not a
  404, no unhandled crash

### Sub-task I — facade shape guardrail

Maps to spec: `storage-domain-decomposition` → "Public storage facade shape is
preserved".

- [ ] Count of own-enumerable methods on `storage` equals the pre-change count
  (snapshot the number in the test)
- [ ] `storage.savedContent` still exposes its 4 nested methods
- [ ] `tsc --noEmit` reports no errors
- [ ] `git grep` of the ~36 `storage` consumers' import lines is byte-identical
  before/after (manual verification step recorded in the PR)
- [ ] All pre-existing `storage`-mocking suites
  (`tests/unit/lib/storage.test.ts`, `storage-shares.test.ts`,
  `storage.characters.test.ts`, `storage.campaignEncounters.test.ts`,
  `storage.characterization.test.ts`) pass unmodified

### Sub-task A / J — inventory + coverage cross-check

Maps to spec: `storage-domain-decomposition` → "Characterization coverage
remains green"; proposal Open Questions.

- [ ] `tests/unit/lib/storage.characterization.test.ts` passes against the
  migrated code; any assertion whose meaning changed is listed in the PR body
- [ ] Method-count check from `tasks.md` Sub-task A: `inventory.json` entry count
  vs. actual `storage` method count reconciled; drift recorded
- [ ] Every acceptance scenario across
  `openspec/changes/refactor-storage-issue-503/specs/**/spec.md` has at least
  one test case above referencing it (traceability review before marking the
  tests artifact done)

### Non-functional

Maps to spec NFAC sections.

- [ ] Reliability: for each migrated method, exactly one `logStorageEvent`
  `outcome: "error"` on the failure path (asserted in the per-repo suites above)
- [ ] Reliability: read methods emit exactly one event with the matching
  `outcome` on each of success / not_found / error
- [ ] Security: `StorageError.message` for any migrated method contains only
  `op` + `collection` — no connection string, credentials, or raw driver text
- [ ] Performance: full unit + integration suite runtime shows no regression
  beyond normal variance after the change (informal check, no hard budget)
