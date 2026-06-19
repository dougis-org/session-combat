# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/campaign-rolls-api` then immediately `git push -u origin feat/campaign-rolls-api`

## Execution

### 1. Types — `lib/types.ts`

- [x] Add `RollVisibility` type: `{ scope: 'group' } | { scope: 'dm-only' }`
- [x] Add `CampaignRoll` interface with fields: `_id?`, `id`, `campaignId`, `sessionId`, `rollerId`, `rollerName`, `formula`, `rolls: number[]`, `total: number`, `label?: string`, `visibility: RollVisibility`, `createdAt: Date`
- [x] Extend `CampaignStreamEvent` with `{ type: 'roll'; campaignId: string; data: CampaignRoll }` variant
- [x] Verify: `npm run build` passes

### 2. Utility — `lib/utils/campaignRolls.ts`

- [x] Write unit tests first (`tests/unit/utils/campaignRolls.test.ts`) covering:
  - DM can see `dm-only` roll
  - Player cannot see another player's `dm-only` roll
  - Roller can always see their own `dm-only` roll
  - Any active member can see `group` roll
- [x] Implement `canSeeRoll(roll: CampaignRoll, userId: string, members: CampaignMember[]): boolean` in `lib/utils/campaignRolls.ts`
- [x] Verify: `npm run test:unit -- --testPathPattern='tests/unit/utils/campaignRolls'` passes

### 3. Storage — `lib/storage.ts`

- [x] Add `saveCampaignRoll(roll: CampaignRoll): Promise<void>` — `insertOne` into `campaignRolls` collection (strip `_id` before insert)
- [x] Add `listCampaignRolls(campaignId: string, sessionId: string, userId: string, role: CampaignMemberRole, opts: { limit: number; before?: Date }): Promise<{ rolls: CampaignRoll[]; nextCursor?: string }>` — applies visibility filter query matching `canSeeRoll()` logic, sorts `createdAt` desc, paginates
- [x] Verify: `npm run build` passes

### 4. DB index — ensure `campaignRolls` index at init

- [x] Locate the `ensureIndexes()` / DB init function in `lib/db.ts` (or equivalent)
- [x] Add compound index: `db.collection('campaignRolls').createIndex({ campaignId: 1, sessionId: 1, createdAt: -1 })`
- [x] Verify: `npm run build` passes

### 5. Route — `app/api/campaigns/[id]/rolls/route.ts`

- [x] Write unit tests first (`tests/unit/api/campaigns/[id]/rolls.route.test.ts`) covering:
  - POST valid `group` roll → 201 with correct `sessionId` stamped
  - POST valid `dm-only` roll → 201
  - POST with no active session → 409 `{ error: 'No active session' }`
  - POST missing `formula` → 400
  - POST missing `rolls` or `rolls` not an array → 400
  - POST missing `total` or `total` not a number → 400
  - POST with `visibility.scope: 'direct'` → 400
  - POST by inactive member → 403
  - POST verifies `emitFiltered` called with `{ type: 'roll' }` event
  - GET without `sessionId` param → 400
  - GET with `sessionId` as DM → 200 with all rolls (group + dm-only)
  - GET with `sessionId` as player → 200 with only visible rolls
  - GET cursor pagination (`nextCursor` returned when more results exist)
  - GET unauthenticated → 401
- [x] Implement `POST` handler:
  - Parse and validate body (`formula: string`, `rolls: number[]`, `total: number`, `label?: string`, `visibility: RollVisibility`)
  - Call `assertCampaignAccess`; verify caller is active member (`storage.getMember`)
  - Guard: `campaign.activeSessionId` absent → 409
  - Resolve `rollerName` from `storage.getUserById(auth.userId)`
  - Build `CampaignRoll` with `id: crypto.randomUUID()`, `sessionId: campaign.activeSessionId`, `createdAt: new Date()`
  - `storage.saveCampaignRoll(roll)` (uses storage abstraction; no dead code)
  - `emitFiltered(campaignId, { type: 'roll', campaignId, data: roll }, (uid) => canSeeRoll(roll, uid, activeMembers))`
  - Return `201` with roll doc
- [x] Implement `GET` handler:
  - Require `sessionId` query param (400 if absent/empty)
  - Verify caller is active member
  - Parse `limit` (default 50, cap 100) and `before` cursor
  - Call `storage.listCampaignRolls(...)` with caller's userId and role
  - Return `200` with `{ rolls, nextCursor? }`
- [x] Wrap both handlers in try/catch → 500 on unexpected errors
- [x] Verify: `npm run test:unit -- --testPathPattern='tests/unit/api/campaigns/\[id\]/rolls'` passes

### 6. Integration tests — `tests/integration/campaigns/rolls.integration.test.ts`

- [x] POST with active session → 201, roll persisted
- [x] POST with no active session → 409
- [x] GET without `sessionId` → 400
- [x] GET as DM sees `dm-only` roll; GET as player does not
- [x] Rolls scoped to session — rolls from session A do not appear in session B query
- [x] Verify: `npm run build && npm run test:integration -- --testPathPattern='rolls'` passes

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm run test:unit` — all 121+ suites pass
- [x] `npm run build && npm run test:integration` — all integration suites pass
- [x] `npm run build` — TypeScript compilation clean
- [x] All execution tasks marked complete

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` and check whether every changed file ends in `.md`. This change is not docs-only — apply the full path.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run build && npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors

If **ANY** required step fails, iterate and address before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to `feat/campaign-rolls-api` and push to remote
- [ ] Open PR from `feat/campaign-rolls-api` to `main`. PR body MUST include `Closes #316`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Iterate until merged** — repeat the following priority loop until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED`, exit and notify user:
  1. **Build and tests** — run all steps in Remote push validation; fix failures, commit, push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address each unresolved thread, commit, validate, push, wait 180s; repeat until all resolved
  3. **CI check failures** — after all comments resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing checks, commit, validate, push, wait 180s; restart loop from step 1

Ownership metadata:

- Implementer: dougis
- Reviewer(s): automated CI + agentic reviewers
- Required approvals: per branch ruleset

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks complete
- [ ] Sync approved spec delta: copy `openspec/changes/campaign-rolls-api/specs/rolls-api/spec.md` to `openspec/specs/rolls-api/spec.md`; update relative links in the copy from `../../design.md` → `../../changes/archive/YYYY-MM-DD-campaign-rolls-api/design.md` and `../../tasks.md` → `../../changes/archive/YYYY-MM-DD-campaign-rolls-api/tasks.md`
- [ ] Archive the change: move `openspec/changes/campaign-rolls-api/` to `openspec/changes/archive/YYYY-MM-DD-campaign-rolls-api/` **as a single atomic commit** (stage both the new location and deletion of old location together)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-campaign-rolls-api/` exists and `openspec/changes/campaign-rolls-api/` is gone
- [ ] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-campaign-rolls-api` then `git push -u origin doc/archive-YYYY-MM-DD-campaign-rolls-api`
- [ ] Open PR from doc branch to `main` with title `docs: archive campaign-rolls-api (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor doc PR until merged (same loop as implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feat/campaign-rolls-api doc/archive-YYYY-MM-DD-campaign-rolls-api`
