# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/party-builder-shared-characters` then immediately `git push -u origin feat/party-builder-shared-characters`

## Execution

### Group A — Storage layer

- [x] **A1 — Add `SharedCharacterEntry` type to `lib/types.ts`**
  - Export `interface SharedCharacterEntry { share: CampaignCharacterShare; character: Pick<Character, 'id' | 'name' | 'characterType' | 'userId' | 'deletedAt'> }`
  - Verify: `npm run build` passes

- [x] **A2 — Add `listAllSharesForCampaign(campaignId)` to `lib/storage.ts`**
  - Query `campaignCharacterShares` with `{ campaignId }` only (no userId filter)
  - Normalize and return `CampaignCharacterShare[]`
  - Unit test: multiple players' shares returned; empty campaign returns `[]`

- [x] **A3 — Add `loadPartiesByCampaign(campaignId)` to `lib/storage.ts`**
  - Query `parties` collection with `{ campaignId }`
  - Wrap query in `Date.now()` timing; log `[perf] loadPartiesByCampaign <campaignId>: <ms>ms` when > 10ms
  - Include `// TODO: add campaignId index on parties if >50ms becomes common` comment
  - Unit test: returns only parties in specified campaign; other campaign's parties excluded

- [x] **A4 — Add `setPartyMemberLeftAt(campaignId, characterId, timestamp)` to `lib/storage.ts`**
  - Call `loadPartiesByCampaign(campaignId)`; for each party, find active members (`!leftAt`) with matching `characterId`, set `leftAt = timestamp`, call `saveParty`
  - Catch and log errors from `saveParty`; do not re-throw
  - Unit test: active member gets `leftAt`; already-left member unchanged; multiple parties both updated; `saveParty` throw does not propagate

- [x] **A5 — Add `canAddToCampaignParty(campaignId, characterId, dmUserId)` to `lib/storage.ts`**
  - Return `true` if character is DM-owned (load character by id, check `userId === dmUserId`)
  - Else: find share in `campaignCharacterShares` where `{ campaignId, characterId }`; if found, check `getMember(campaignId, share.userId)` returns `status === 'active'`; return `true` only if both conditions pass
  - Unit test: owns char → `true`; active share → `true`; invited-member share → `false`; removed-member share → `false`; no share → `false`

### Group B — API routes

- [x] **B1 — Extend `GET /api/campaigns/[id]/characters` for DM role**
  - File: `app/api/campaigns/[id]/characters/route.ts`
  - After existing member check: if `member.role === 'dm'`, call `storage.listAllSharesForCampaign(campaignId)`, load each share's character via `storage.loadCharacterById`, filter out `deletedAt` characters and those whose share's `userId` member is not `active`, return `SharedCharacterEntry[]`
  - If `member.role === 'player'`, existing behavior unchanged (caller's own shares only)
  - Route test: DM gets enriched list; DM list excludes soft-deleted chars; DM list excludes inactive-member chars; player gets own shares in bare format; non-member gets 403

- [x] **B2 — Enforce access rule in `POST /api/parties`**
  - File: `app/api/parties/route.ts`
  - After building `ids` list: if `campaignId` is provided, call `canAddToCampaignParty(campaignId, charId, auth.userId)` for each new characterId; if any returns `false`, return HTTP 403 `{ error: 'Character not shared into campaign' }`
  - Route test: DM-owned char → 201; shared char → 201; unshared char → 403; no campaignId → no share check (existing behavior)

- [x] **B3 — Enforce access rule in `PUT /api/parties/[id]`**
  - File: `app/api/parties/[id]/route.ts`
  - After computing `newIdSet`: identify *newly added* characterIds (in `newIdSet` but not in `existingActiveIds`); if party has `campaignId`, call `canAddToCampaignParty` for each new id; return 403 if any fails
  - Route test: DM-owned → 200; shared → 200; unshared → 403; no campaignId → no share check; re-adding existing active member → no re-check, 200

- [x] **B4 — Extend `DELETE /api/campaigns/[id]/characters/[cid]` with cleanup**
  - File: `app/api/campaigns/[id]/characters/[cid]/route.ts`
  - After `storage.removeShare(...)` succeeds: call `storage.setPartyMemberLeftAt(campaignId, characterId, new Date())` in a try/catch; log errors but do not affect the 204 response
  - Route test: unshare returns 204; party member has `leftAt` after unshare; cleanup error does not change response

- [x] **B5 — Extend `DELETE /api/campaigns/[id]/members/[userId]` with cleanup**
  - File: `app/api/campaigns/[id]/members/[userId]/route.ts`
  - After `storage.updateMemberStatus(..., 'removed', ...)` succeeds: call `storage.listAllSharesForCampaign(campaignId)`, filter to `share.userId === targetUserId`, call `storage.setPartyMemberLeftAt` for each share's `characterId` in a try/catch; log errors but do not affect the 200 response
  - Route test: removal returns `{ status: 'removed' }`; all target's shared chars get `leftAt`; member with no shares — no error; cleanup error does not change response

### Group C — Campaign context

- [x] **C1 — Update `lib/utils/campaignContext.ts`**
  - Add `GET /api/campaigns/${campaignId}/characters` to the `Promise.all` fetch list
  - On non-OK response: log error, treat as empty array (degraded gracefully)
  - Merge `SharedCharacterEntry[]` characters with `allCharacters` (deduplicate by id)
  - Reactive guard: for each non-DM-owned character in the merged list, verify its `characterId` appears in the fetched shares list; exclude if not found or if `deletedAt` set
  - Existing `leftAt` filter on `memberIds` already handles the `leftAt` case — no change needed there
  - Unit test: shared char in party appears in `context.characters`; revoked-share char excluded; soft-deleted shared char excluded; DM-owned chars unaffected; failed shares fetch degrades to DM-only chars

### Group D — Party builder UI

- [x] **D1 — Update `PartyEditor` in `app/parties/page.tsx`**
  - Add `sharedCharacters: SharedCharacterEntry[]` prop (passed from `PartiesContent`)
  - When `campaignId` is selected, fetch `GET /api/campaigns/${campaignId}/characters` and pass result as `sharedCharacters`; re-fetch when `campaignId` changes
  - In `PartyEditor`: below the DM-owned character groups, render a "Shared by Campaign Members" section; group entries by `share.userId`; display owner userId or name label; render a checkbox per character; exclude entries where `character.deletedAt` is set
  - Checkboxes work identically to DM-owned character checkboxes (`toggleCharacter`)
  - When `campaignId` is empty/unset, `sharedCharacters` is `[]` and the section is not rendered
  - Component test: section rendered with campaignId; section absent without campaignId; soft-deleted char not shown; toggle and save works

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm run test:unit` — all unit tests pass
- [x] `npm run test:integration` — all integration tests pass
- [x] `npm run build` — TypeScript build succeeds
- [x] `npm run lint` — no lint errors
- [x] All spec scenarios from `specs/campaign-character-shares-dm-get/spec.md`, `specs/party-access-rule/spec.md`, `specs/party-cleanup/spec.md`, `specs/party-builder-ui/spec.md`, `specs/campaign-context-shared-chars/spec.md` are covered by passing tests

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- **Lint** — `npm run lint` — must succeed with no errors

If **ANY** of the above fail, iterate and fix before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/party-builder-shared-characters` and push to remote
- [x] Open PR from `feat/party-builder-shared-characters` to `main`. PR body must include `Closes #310`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] **Monitor PR comments** — poll autonomously; address, commit fixes, validate locally, push, wait 180 seconds, repeat until no unresolved comments
- [x] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, validate locally, push, wait 180 seconds, repeat
- [x] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user

Ownership metadata:

- Implementer: agentic (Claude Code)
- Reviewer(s): @dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → diagnose → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on `main`
- [x] Mark all remaining tasks complete
- [x] Sync approved spec deltas to `openspec/specs/`:
  - Copy `openspec/changes/archive/2026-06-08-party-builder-shared-characters/specs/campaign-character-shares-dm-get/spec.md` → `openspec/specs/campaign-character-shares/spec.md` (merged into existing; MODIFIED section appended)
  - Copy `openspec/changes/archive/2026-06-08-party-builder-shared-characters/specs/party-access-rule/spec.md` → `openspec/specs/party-access-rule/spec.md` (new)
  - Copy `openspec/changes/archive/2026-06-08-party-builder-shared-characters/specs/party-cleanup/spec.md` → `openspec/specs/party-cleanup/spec.md` (new)
  - Copy `openspec/changes/archive/2026-06-08-party-builder-shared-characters/specs/party-builder-ui/spec.md` → `openspec/specs/party-builder-ui/spec.md` (new)
  - Copy `openspec/changes/archive/2026-06-08-party-builder-shared-characters/specs/campaign-context-shared-chars/spec.md` → `openspec/specs/campaign-context-shared-chars/spec.md` (new)
- [x] Archive: move `openspec/changes/party-builder-shared-characters/` to `openspec/changes/archive/2026-06-08-party-builder-shared-characters/` — staged both copy and deletion in a **single commit**
- [x] Confirm `openspec/changes/archive/2026-06-08-party-builder-shared-characters/` exists and `openspec/changes/party-builder-shared-characters/` is gone
- [x] Create doc branch: `git checkout -b doc/archive-2026-06-08-party-builder-shared-characters` → `git push -u origin doc/archive-2026-06-08-party-builder-shared-characters`
- [x] Open PR: `docs: archive party-builder-shared-characters (2026-06-08)` from doc branch to `main` — PR #395
- [x] **IMMEDIATELY** enable auto-merge on doc PR
- [x] Monitor doc PR until merged (same loop as implementation PR)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -d feat/party-builder-shared-characters doc/archive-2026-06-08-party-builder-shared-characters`
- [x] Update `docs/multi-user-campaigns/03-cross-user-characters.md`: mark issue #310 as CLOSED, set Phase 3 status to complete
