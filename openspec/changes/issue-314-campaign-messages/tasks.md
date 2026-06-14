# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/issue-314-campaign-messages` then immediately `git push -u origin feature/issue-314-campaign-messages`

## Execution

### T1 — Add `CampaignMessage` type and extend `CampaignStreamEvent`

**File:** `lib/types.ts`

- [x] Add `MessageVisibility` type:
  ```ts
  export type MessageVisibility =
    | { scope: 'group' }
    | { scope: 'dm-only' }
    | { scope: 'direct'; toUserId: string };
  ```
- [x] Add `CampaignMessage` interface:
  ```ts
  export interface CampaignMessage {
    _id?: string;
    id: string;
    campaignId: string;
    senderId: string;
    senderName: string;
    text: string;
    visibility: MessageVisibility;
    createdAt: Date;
  }
  ```
- [x] Extend `CampaignStreamEvent` union with:
  ```ts
  | { type: 'message'; campaignId: string; data: CampaignMessage }
  ```
- [x] **Verify:** `npm run type-check` passes with no new errors

---

### T2 — Upgrade transport to support per-subscriber filtering

**File:** `lib/server/transport.ts`

- [x] Change registry type: `Map<string, Map<string, EventHandler>>` (campaignId → userId → handler)
- [x] Update `subscribe(campaignId: string, userId: string, onEvent: EventHandler)`:
  - In replica-set path: `registry.get(campaignId)?.set(userId, onEvent)` on add; `registry.get(campaignId)?.delete(userId)` on teardown
  - Subscriber count logic stays the same
  - Polling path (`atlasMode === false`): unchanged — no userId needed since `emitFiltered` is never called on that path
- [x] Export `emitFiltered(campaignId: string, event: CampaignStreamEvent, canReceive: (userId: string) => boolean): void`:
  ```ts
  export function emitFiltered(
    campaignId: string,
    event: CampaignStreamEvent,
    canReceive: (userId: string) => boolean
  ): void {
    const handlers = registry.get(campaignId);
    if (!handlers) return;
    for (const [userId, handler] of handlers) {
      if (canReceive(userId)) {
        try { handler(event); } catch { /* handler errors don't break dispatch */ }
      }
    }
  }
  ```
- [x] **Verify:** `npm run type-check` passes; existing stream integration tests still pass

---

### T3 — Update stream route to pass userId to subscribe

**File:** `app/api/campaigns/[id]/stream/route.ts`

- [x] Change `subscribe(id, handler)` → `subscribe(id, auth.userId, handler)`
- [x] **Verify:** `npm run type-check` passes; run existing SSE stream tests

---

### T4 — Register campaignMessages index in initializeDatabase

**File:** `lib/db.ts`

- [x] Add inside `initializeDatabase()`:
  ```ts
  try {
    await db
      .collection('campaignMessages')
      .createIndex({ campaignId: 1, createdAt: 1 });
    console.log('Created index on campaignMessages.{campaignId, createdAt}');
  } catch (indexError) {
    if (indexError instanceof Error && !indexError.message.includes('already exists')) {
      console.warn('Warning creating campaignMessages.{campaignId, createdAt} index:', indexError.message);
    }
  }
  ```
- [x] **Verify:** `npm run type-check` passes

---

### T5 — Extract `canSeeMessage` predicate

**File:** `lib/utils/campaignMessages.ts` (new)

- [x] Implement:
  ```ts
  import type { CampaignMessage, CampaignMember } from '@/lib/types';

  export function canSeeMessage(
    msg: CampaignMessage,
    userId: string,
    members: Pick<CampaignMember, 'userId' | 'role' | 'status'>[]
  ): boolean {
    const member = members.find((m) => m.userId === userId && m.status === 'active');
    if (!member) return false;

    const { scope } = msg.visibility;

    if (scope === 'group') return true;

    if (scope === 'direct') {
      const toUserId = (msg.visibility as { scope: 'direct'; toUserId: string }).toUserId;
      return userId === msg.senderId || userId === toUserId;
    }

    // dm-only: DM(s) + sender
    if (scope === 'dm-only') {
      return userId === msg.senderId || member.role === 'dm';
    }

    return false;
  }
  ```
- [x] Write unit tests in `lib/utils/__tests__/campaignMessages.test.ts`:
  - group message visible to all active members
  - direct message visible only to sender and toUserId
  - dm-only visible only to sender and DM role members
  - inactive member sees nothing regardless of scope
- [x] **Verify:** `npm test lib/utils/__tests__/campaignMessages.test.ts` passes

---

### T6 — Implement POST /api/campaigns/[id]/messages

**File:** `app/api/campaigns/[id]/messages/route.ts` (new)

- [x] POST handler:
  1. Auth via `withAuthAndParams`
  2. Assert caller is active member of campaign (403 if not)
  3. Validate body: `text` (non-empty string), `visibility.scope` (`group` | `direct` | `dm-only`); if `scope === 'direct'` require `toUserId` (400 if missing)
  4. Build `CampaignMessage` document with `id: new ObjectId().toHexString()`, `senderId: auth.userId`, `senderName` (fetch from user record or member record), `createdAt: new Date()`
  5. Insert into `campaignMessages`
  6. Fetch all active members for the campaign (for `canReceive` predicate)
  7. Call `emitFiltered(campaignId, { type: 'message', campaignId, data: message }, (uid) => canSeeMessage(message, uid, activeMembers))`
  8. Return `201` with persisted document
- [x] **Verify:** `npm run type-check`

---

### T7 — Implement GET /api/campaigns/[id]/messages

**File:** `app/api/campaigns/[id]/messages/route.ts` (extend above)

- [x] GET handler:
  1. Auth via `withAuthAndParams`
  2. Assert caller is active member (403 if not)
  3. Parse query params: `limit` (default 50, max 100), `before` (ISO timestamp cursor, optional)
  4. Fetch caller's member record to determine role
  5. Build MongoDB query predicate matching the visibility rules (mirror `canSeeMessage` at DB level):
     ```ts
     {
       campaignId,
       ...(before ? { createdAt: { $lt: new Date(before) } } : {}),
       $or: [
         { 'visibility.scope': 'group' },
         { 'visibility.scope': 'direct', 'visibility.toUserId': userId },
         { 'visibility.scope': 'direct', senderId: userId },
         { 'visibility.scope': 'dm-only', senderId: userId },
         ...(role === 'dm' ? [{ 'visibility.scope': 'dm-only' }] : []),
       ],
     }
     ```
  6. Sort `{ createdAt: -1 }`, limit to `limit + 1` to detect next page
  7. If result length > limit, pop last item and set `nextCursor` to the last included item's `createdAt.toISOString()`
  8. Return `200` with `{ messages, nextCursor?: string }`
- [x] **Verify:** `npm run type-check`

---

### T8 — Write integration tests

**File:** `__tests__/integration/campaignMessages.test.ts` (new)

Cover the following integration scenarios (see `specs/campaign-messages/spec.md`):

- [x] POST — active member sends group/direct/dm-only messages (201 + persisted)
- [x] POST — non-member / inactive member rejected (403)
- [x] POST — missing fields / missing toUserId (400)
- [x] GET — group messages visible to all active members
- [x] GET — direct messages hidden from unrelated members
- [x] GET — dm-only hidden from non-DM players
- [x] GET — DM sees all scopes
- [x] GET — pagination: 60 messages, first page returns 50 + nextCursor; second page returns 10
- [x] GET — non-member rejected (403)
- [x] SSE — group message reaches all subscribers
- [x] SSE — direct message reaches only sender + recipient (player C does not receive)
- [x] SSE — dm-only reaches sender + all active DMs; other players excluded
- [x] SSE — message retrievable via GET even when no SSE subscribers are connected

- [x] **Verify:** `npm run test:integration -- --testPathPattern=campaignMessages` passes

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings directly to the code — without stopping, presenting findings to the user, or asking for confirmation. Apply fixes, re-run tests, then commit.

## Validation

- [x] `npm run type-check` — zero errors
- [x] `npm test` — all unit tests pass (including new `canSeeMessage` tests)
- [x] `npm run test:integration` — all integration tests pass
- [x] `npm run build` — build succeeds
- [x] All tasks T1–T8 checked off

## Remote push validation

**Full path** (non-`.md` files changed — applicable here):

- **Unit tests:** `npm test` — all pass
- **Integration tests:** `npm run test:integration` — all pass
- **Build:** `npm run build` — succeeds with no errors

If **ANY** step fails, iterate and fix before pushing.

## PR and Merge

- [x] Ensure pre-commit code review sub-agent ran and all findings were applied before final commit
- [x] Commit all changes to `feature/issue-314-campaign-messages` and push to remote
- [x] Open PR to `main`. PR body MUST include: `Closes #314`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [x] Wait 180 seconds for CI and agentic reviewers
- [x] **Iterate until merged** — priority loop until `gh pr view <PR-URL> --json state` returns `MERGED`:
  1. Run all [Remote push validation] steps; fix failures, commit, push
  2. Poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, push, wait 180s
  3. Poll `gh pr checks <PR-URL>`; fix any failing required checks, commit, push, wait 180s
  - Restart from step 1 after every push. Never force-merge.

Ownership metadata:
- Implementer: dougis
- Reviewer(s): agentic CI + dougis-org code owners
- Required approvals: 1

Blocking resolution flow:
- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on `main`
- [x] Mark all remaining tasks complete
- [x] Sync spec delta: copy `openspec/changes/issue-314-campaign-messages/specs/campaign-messages/spec.md` → `openspec/specs/campaign-messages/spec.md`; update relative links (`../../design.md` → `../../changes/archive/YYYY-MM-DD-issue-314-campaign-messages/design.md`, same for `tasks.md`)
- [x] Archive the change: move `openspec/changes/issue-314-campaign-messages/` → `openspec/changes/archive/YYYY-MM-DD-issue-314-campaign-messages/` in a **single commit** (stage copy + deletion together)
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-issue-314-campaign-messages/` exists and `openspec/changes/issue-314-campaign-messages/` is gone
- [x] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-issue-314-campaign-messages` and push
- [x] Open PR with title: `docs: archive issue-314-campaign-messages (YYYY-MM-DD)` — do NOT push directly to `main`
- [x] Enable auto-merge on doc PR immediately: `gh pr merge <DOC-PR-URL> --auto --merge`
- [x] Monitor doc PR until merged (same loop — address comments and CI failures)
- [x] Prune: `git fetch --prune` and `git branch -D feature/issue-314-campaign-messages doc/archive-YYYY-MM-DD-issue-314-campaign-messages`
