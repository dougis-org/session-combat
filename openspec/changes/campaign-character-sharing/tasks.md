# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/campaign-character-sharing` then immediately `git push -u origin feat/campaign-character-sharing`

## Execution

### 1. Types — `lib/types.ts`

- [x] Add `CampaignCharacterShare` interface after the `CampaignMemberSummary` block:
  ```ts
  export interface CampaignCharacterShare {
    _id?: string;
    id: string;
    campaignId: string;
    characterId: string;
    userId: string;
    sharedAt: Date;
  }
  ```

### 2. Errors — `lib/errors.ts`

- [x] Add `DuplicateShareError` following the exact `DuplicateMemberError` pattern:
  ```ts
  export class DuplicateShareError extends Error {
    constructor(campaignId: string, characterId: string) {
      super(`Character "${characterId}" is already shared into campaign "${campaignId}".`);
      this.name = 'DuplicateShareError';
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, DuplicateShareError);
      }
    }
  }
  ```

### 3. Storage — `lib/storage.ts`

- [x] Import `CampaignCharacterShare` and `DuplicateShareError` at the top of `lib/storage.ts`
- [x] In `initializeDatabase()`, register the `campaignCharacterShares` unique index on `{ campaignId: 1, characterId: 1 }` (follow the `campaignMembers` index creation pattern)
- [x] Add `addShare(share: CampaignCharacterShare): Promise<void>`:
  - Insert into `campaignCharacterShares` (strip `_id` before insert)
  - Catch code 11000 → throw `DuplicateShareError`
- [x] Add `removeShare(campaignId: string, characterId: string): Promise<boolean>`:
  - `deleteOne({ campaignId, characterId })`
  - Return `deletedCount > 0`
- [x] Add `listSharesForCampaign(campaignId: string, userId: string): Promise<CampaignCharacterShare[]>`:
  - `find({ campaignId, userId }).toArray()`
  - Normalize `_id` via `normalizeStoredEntityId`, strip `_id` from result

**TDD:** Write unit tests in `tests/unit/lib/storage-shares.test.ts` (mock the DB) before implementing. Run `npm run test:unit` to confirm they pass.

### 4. API — POST and GET — `app/api/campaigns/[id]/characters/route.ts`

- [x] Create `app/api/campaigns/[id]/characters/route.ts`
- [x] **POST handler** (`withAuthAndParams<{ id: string }>`):
  1. Parse body; return 400 if `characterId` is missing or not a non-empty string
  2. Load `getMember(campaignId, auth.userId)`; return 403 if null, not `active`, or role is not `player`
  3. Load character via `storage.loadCharacter(characterId, auth.userId)` (or equivalent); return 404 if not found
  4. Return 403 if `character.userId !== auth.userId`
  5. Call `addShare({ id: crypto.randomUUID(), campaignId, characterId, userId: auth.userId, sharedAt: new Date() })`
  6. Catch `DuplicateShareError` → return 409
  7. Return 201 with `{ id, characterId }`
- [x] **GET handler** (`withAuthAndParams<{ id: string }>`):
  1. Load `getMember(campaignId, auth.userId)`; return 403 if null or not `active`
  2. Call `listSharesForCampaign(campaignId, auth.userId)`
  3. Return 200 with the array

**TDD:** Write unit tests in `tests/unit/api/campaigns/[id]/characters/route.test.ts` before implementing. Run `npm run test:unit`.

### 5. API — DELETE — `app/api/campaigns/[id]/characters/[cid]/route.ts`

- [x] Create `app/api/campaigns/[id]/characters/[cid]/route.ts`
- [x] **DELETE handler** (`withAuthAndParams<{ id: string; cid: string }>`):
  1. Load `getMember(campaignId, auth.userId)`; return 403 if null or not `active`
  2. Load character by `cid`; return 404 if not found
  3. Return 403 if `character.userId !== auth.userId`
  4. Call `removeShare(campaignId, cid)`; return 404 if returns `false`
  5. Return 204

**TDD:** Write unit tests in `tests/unit/api/campaigns/[id]/characters/[cid]/route.test.ts` before implementing. Run `npm run test:unit`.

### 6. Player UI — campaign view character-sharing panel

- [x] Identify where the campaign detail is rendered in `app/campaigns/` (likely `CampaignEditor` or the campaign page component)
- [x] Add a `SharedCharactersPanel` component (inline or separate file):
  - Rendered only when `currentUserMember?.role === 'player' && currentUserMember?.status === 'active'`
  - Fetches `GET /api/campaigns/[id]/characters` on mount to get current shares
  - Fetches player's own characters from `GET /api/characters` (or existing character list)
  - Renders each character with a toggle (checked = shared)
  - On toggle on: `POST /api/campaigns/[id]/characters` with `{ characterId }`
  - On toggle off: `DELETE /api/campaigns/[id]/characters/[cid]`
  - Optimistic UI update; revert on error

**TDD:** Write RTL unit tests in `tests/unit/components/SharedCharactersPanel.test.tsx`. Run `npm run test:unit`.

### 7. Integration tests

- [x] Write integration tests in `tests/integration/campaigns/characterSharing.integration.test.ts`:
  - `addShare` inserts and `listSharesForCampaign` returns it
  - Duplicate insert throws `DuplicateShareError`
  - `removeShare` returns true on success, false on non-existent
  - Same character can appear in two different campaigns
  - Run with `npm run test:integration`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings before committing.

## Validation

- [x] `npm run test:unit` — all tests pass
- [x] `npm run test:integration` — all tests pass
- [x] `npm run build` — no type errors, clean build
- [x] All execution tasks above are checked off

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit` — all must pass
- **Integration tests** — `npm run test:integration` — all must pass
- **Build** — `npm run build` — must succeed with no errors
- If **ANY** of the above fail, iterate and fix before pushing

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings addressed before final commit
- [ ] Commit all changes and push to `feat/campaign-character-sharing`
- [ ] Open PR to `main`. PR body must include `Closes #309`.
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (never `--admin`)
- [ ] Wait 180 seconds for CI and agentic reviewers
- [ ] **Monitor PR comments** — address each, commit fixes, run remote push validation, push, wait 180s, repeat until no unresolved threads remain
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required check, run remote push validation, push, wait 180s, repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user

Ownership metadata:

- Implementer: (assigned)
- Reviewer(s): (assigned)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → run remote push validation → push → re-run checks
- Security finding → remediate → commit → run remote push validation → push → re-scan
- Review comment → address → commit → run remote push validation → push → resolve thread

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on main
- [ ] Mark all remaining tasks complete
- [ ] Sync `openspec/changes/campaign-character-sharing/specs/campaign-character-shares.md` → `openspec/specs/campaign-character-shares/campaign-character-shares.md`
- [ ] Archive the change: move `openspec/changes/campaign-character-sharing/` → `openspec/changes/archive/YYYY-MM-DD-campaign-character-sharing/` — stage both the copy and deletion in a **single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-campaign-character-sharing/` exists and `openspec/changes/campaign-character-sharing/` is gone
- [ ] **Create doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-campaign-character-sharing` then `git push -u origin doc/archive-YYYY-MM-DD-campaign-character-sharing`
- [ ] Open PR from doc branch to `main` with title `docs: archive campaign-character-sharing (YYYY-MM-DD)` — do **not** push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor doc PR until merged (same comment/CI loop as implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` && `git branch -D feat/campaign-character-sharing doc/archive-YYYY-MM-DD-campaign-character-sharing`
