# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/campaign-session-journal` then immediately `git push -u origin feat/campaign-session-journal`

## Execution

### Group A — Party data model refactor (prerequisite for NPC auto-capture)

- [x] **A1 — Types:** In `lib/types.ts`:
  - Add `PartyMember` interface: `{ characterId: string; addedAt: Date; leftAt?: Date }`
  - Replace `Party.characterIds: string[]` with `Party.members: PartyMember[]`
  - Add `SessionEvent` interface: `{ type: 'npc_joined' | 'npc_left' | 'combat_completed' | 'custom'; description: string; characterId?: string; characterName?: string; timestamp?: Date }`
  - Add `SessionLog` interface (see design.md for full shape)
  - Add `SessionLogInput` type (all fields optional except `datePlayed` and `campaignId`)

- [x] **A2 — partySelection utility:** In `lib/utils/partySelection.ts`:
  - Update `expandPartyToCharacters` to filter `party.members.filter(m => !m.leftAt).map(m => m.characterId)` instead of `party.characterIds`
  - Verify `resolveCharactersForCombat` and `findDuplicatePartyCharacters` work correctly after the change

- [x] **A3 — storage.ts lazy migration + cascade:** In `lib/storage.ts`:
  - In `loadParties()`: if a document has no `members` field, derive it from `characterIds` with `addedAt = party.createdAt` before returning
  - In `deleteCharacter()`: replace `$pull { characterIds: id }` with a MongoDB array filter update that sets `members.$[elem].leftAt = new Date()` where `elem.characterId === id` and `elem.leftAt` does not exist

- [x] **A4 — Party POST route:** In `app/api/parties/route.ts`:
  - Accept `characterIds` from the request body
  - Build `members: PartyMember[]` from input: each entry gets `addedAt = new Date()`
  - Remove any reference to `characterIds` from the saved document

- [x] **A5 — Party PUT route:** In `app/api/parties/[id]/route.ts`:
  - Accept `characterIds` from the request body (no client-side change)
  - Compute diff against `existingParty.members`: new ids → `addedAt = now`; removed ids → `leftAt = now`; unchanged → no modification
  - Save updated `members` array

- [x] **A6 — Party UI:** In `app/parties/page.tsx`:
  - Replace all reads of `party.characterIds` with derived active ids: `party.members.filter(m => !m.leftAt).map(m => m.characterId)`
  - Verify member count display, member list, and checkbox state all use active members correctly

### Group B — Session log storage and API

- [x] **B1 — storage.ts session log functions:** In `lib/storage.ts`:
  - `loadSessionLogs(userId, campaignId): Promise<SessionLog[]>` — sorted by `sessionNumber` descending
  - `saveSessionLog(log: SessionLog): Promise<void>` — insert
  - `updateSessionLog(id, userId, campaignId, patch): Promise<SessionLog | null>` — partial update, returns updated doc
  - `deleteSessionLog(id, userId, campaignId): Promise<void>`
  - `getNextSessionNumber(userId, campaignId): Promise<number>` — returns `MAX(sessionNumber) + 1` or `1` if none exist

- [x] **B2 — GET/POST route:** Create `app/api/campaigns/[id]/sessions/route.ts`:
  - `GET`: verify campaign belongs to user, return `loadSessionLogs(userId, campaignId)`
  - `POST`: validate `datePlayed` required; default `sessionNumber` via `getNextSessionNumber`; default `milestone: false`; save and return 201

- [x] **B3 — PATCH/DELETE route:** Create `app/api/campaigns/[id]/sessions/[sessionId]/route.ts`:
  - `PATCH`: partial update; validate ownership; return updated log or 404
  - `DELETE`: delete by id + userId + campaignId; return 200 or 404

### Group C — Session journal UI

- [x] **C1 — Session log page:** Create `app/campaigns/[id]/sessions/page.tsx`:
  - Fetch `GET /api/campaigns/[id]/sessions` on load
  - Render list reverse-chrono: session number, date, title, milestone badge, expandable summary + events
  - Empty state: "No sessions logged yet. Add your first session above."

- [x] **C2 — Create form with NPC auto-populate:**
  - On form open: fetch the campaign's linked party (find party where `campaignId === id`)
  - Compute `addedAt`/`leftAt` in window (between last session `datePlayed` and now)
  - Pre-populate `events[]` as `npc_joined`/`npc_left` events
  - If no party found, show notice: "No linked party found for this campaign."
  - `sessionNumber` field: default to `MAX + 1`, editable
  - `summary` textarea: placeholder "What happened this session? Include: key NPCs encountered, decisions made, plot threads advanced, combat outcomes."
  - Events list: each event shows description + delete button; "+ Add custom event" button
  - Milestone checkbox; when checked, reveal `newLevel` number input
  - Save and Cancel buttons

- [x] **C3 — Inline edit form:** Clicking an existing entry opens it in the same inline form shape; PATCH on save

- [x] **C4 — Campaign card link:** In `app/campaigns/page.tsx` (or `CampaignEditor.tsx`), add a "Session Log" link on each campaign card pointing to `/campaigns/[id]/sessions`

### Group D — Tests

- [x] **D1 — Unit: Party member diff logic**
  - `partySelection.expandPartyToCharacters` returns only active members
  - Diff logic (add/remove/unchanged) for the PUT route
  - Lazy migration: document without `members` returns correct derived members

- [x] **D2 — Unit: Session number auto-increment**
  - `getNextSessionNumber` returns 1 when no sessions exist
  - Returns `MAX + 1` when sessions exist

- [x] **D3 — Unit: NPC event pre-population filtering**
  - Members with `addedAt` in window → `npc_joined` events
  - Members with `leftAt` in window → `npc_left` events
  - Members outside window → not included
  - No previous session → all active members included

- [x] **D4 — Integration: Party PUT diff-and-timestamp**
  - Adding a member sets `addedAt = now` on the new entry
  - Removing a member sets `leftAt = now`; entry remains in array
  - Unchanged member is not modified

- [x] **D5 — Integration: Character delete cascade**
  - Deleting a character sets `leftAt` on all party memberships
  - Deleting a character not in any party does not error

- [x] **D6 — Integration: Session log CRUD**
  - POST creates log, returns 201 with auto-incremented sessionNumber
  - GET returns list sorted by sessionNumber descending
  - PATCH updates specified fields only
  - DELETE removes log; subsequent GET of that id returns 404
  - All endpoints return 401 without auth
  - User B cannot access user A's session logs

- [ ] **D7 — Integration: Unmigrated party document**
  - Seed a party with `characterIds` and no `members`
  - Assert `loadParties()` returns correct derived members

## Validation

- [x] Run unit tests: `npm run test:unit`
- [x] Run integration tests: `npm run test:integration`
- [x] Run type check: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Run linter: `npm run lint`
- [ ] Manually test: create a campaign, link a party, add/remove an NPC, open session journal, verify NPC events pre-populate
- [ ] All tasks in Execution marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- **Type check** — `npx tsc --noEmit` — zero errors

If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [ ] Run the required pre-PR self-review from `.agent/skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to `feat/campaign-session-journal` and push to remote
- [ ] Open PR from `feat/campaign-session-journal` to `main`
- [ ] Wait 120 seconds for agentic reviewers to post comments
- [ ] **Monitor PR comments** — address each comment, commit fixes, follow remote push validation, push; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — diagnose and fix any failure, commit, follow remote push validation, push; repeat until all checks pass
- [ ] Wait for PR to merge — **never force-merge**; if a human force-merges, continue to Post-Merge

Ownership metadata:
- Implementer: doug@dougis.com
- Reviewer(s): agentic reviewers + human approval
- Required approvals: 1 human

Blocking resolution flow:
- CI failure → diagnose → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Update `lib/types.ts` JSDoc if any interfaces need documentation cleanup post-review
- [ ] Sync approved spec deltas into `openspec/specs/`
- [ ] Archive the change: move `openspec/changes/campaign-session-journal/` to `openspec/changes/archive/YYYY-MM-DD-campaign-session-journal/` — stage both the new location and the deletion in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-campaign-session-journal/` exists and `openspec/changes/campaign-session-journal/` is gone
- [ ] Commit and push the archive commit to `main`
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/campaign-session-journal`
