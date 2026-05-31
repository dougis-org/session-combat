# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b feat/combat-event-auto-capture` then immediately `git push -u origin feat/combat-event-auto-capture`

## Execution

### T1 — Data model: add campaignId and completedAt to CombatState

- [ ] In `lib/types.ts`, add `campaignId: string` and `completedAt?: Date` to `CombatState`
- [ ] Update any test fixtures in `tests/unit/fixtures/combatHelpers.ts` (`makeCombatState`) to include `campaignId`
- [ ] Run `npx tsc --noEmit` — confirm no new type errors introduced
- **Spec:** combat-history.md, combat-api.md

### T2 — API: POST /api/combat — upsert → insert, require campaignId

- [ ] In `app/api/combat/route.ts`, change `POST` handler:
  - Extract `campaignId` from request body
  - Return HTTP 400 if `campaignId` is missing
  - Replace `updateOne({ userId }, { $set: combatState }, { upsert: true })` with `insertOne(combatState)`
  - Include `campaignId` in the `CombatState` object being inserted
- **Spec:** combat-history.md (ADDED insert), combat-api.md (MODIFIED POST)

### T3 — API: PUT /api/combat/[id] — set completedAt on deactivation

- [ ] In `app/api/combat/[id]/route.ts`, update `PUT` handler:
  - When `isActive` in the body is `false` and `existingCombatState.isActive` is `true`, set `completedAt: new Date()` in `updatedCombatState`
  - When `isActive` is not transitioning to false, leave `completedAt` unchanged
- **Spec:** combat-history.md (ADDED completedAt)

### T4 — API: GET /api/combat — filter by isActive: true

- [ ] In `app/api/combat/route.ts`, change `GET` handler:
  - Update `findOne({ userId: auth.userId })` to `findOne({ userId: auth.userId, isActive: true })`
- **Spec:** combat-history.md (MODIFIED active query)

### T5 — Hook: refactor useCombat — campaignId param, POST→insert, PUT for updates, endCombat fix

- [ ] In `lib/hooks/useCombat.ts`:
  - Add `campaignId?: string` option parameter to `useCombat()`
  - In `startCombatWithSetupCombatants`, include `campaignId` in `newState`
  - Store the `id` from POST 201 response in state (currently the client-generated UUID should match, but use the server echo to be safe)
  - Create a new `updateCombatState` helper that calls `PUT /api/combat/[id]` with updated fields
  - Route all state changes that happen *after* creation through `PUT /api/combat/[id]` instead of `POST /api/combat`
  - Rewrite `endCombat()`:
    - Call `PUT /api/combat/[id] { isActive: false }` and await
    - On success: clear local state (`setCombatState(null)`, `setSetupCombatants([])`, `setSelectedPartyId(null)`, clear HP history)
    - On failure: show error; do NOT clear local state
- **Spec:** combat-history.md (ADDED endCombat server confirmation), combat-api.md (ADDED useCombat uses PUT)

### T6 — Route: /campaigns/[id]/combat page

- [ ] Create `app/campaigns/[id]/combat/page.tsx` as a thin shell:
  - Use `ProtectedRoute` wrapper (match pattern from `app/combat/page.tsx`)
  - Extract `params.id` as `campaignId`
  - Call `useCombat({ campaignId })` and pass results to `CombatSetupView` / `ActiveCombatView`
- **Spec:** combat-api.md (ADDED /campaigns/[id]/combat route)

### T7 — API: GET /api/campaigns/[id]/combat-events endpoint

- [ ] Create `app/api/campaigns/[id]/combat-events/route.ts`:
  - Use `withAuthAndParams<{ id: string }>`
  - Parse `since` query param (ISO date string); default to epoch if missing
  - Query: `combatStates.find({ userId: auth.userId, campaignId: id, completedAt: { $gte: sinceDate } })`
  - Map each document to a `SessionEvent`:
    ```ts
    {
      type: 'combat_completed',
      description: `Combat: ${doc.encounterDescription || 'Unnamed encounter'} (${doc.currentRound - 1} rounds)`,
      encounterId: doc.encounterId,
      encounterDescription: doc.encounterDescription,
      rounds: doc.currentRound - 1,
      completedAt: doc.completedAt,
      campaignId: doc.campaignId,
    }
    ```
  - Return `SessionEvent[]`
- **Spec:** combat-api.md (ADDED GET /api/campaigns/[id]/combat-events)

### T8 — Session journal: pre-populate combat events in new session form

- [ ] In the session log create form (`app/campaigns/[id]/sessions/page.tsx` or its child form component):
  - Determine `since`: latest `SessionLog.datePlayed` for the campaign, or campaign `createdAt` if none
  - Fetch `GET /api/campaigns/[campaignId]/combat-events?since=<since>`
  - Merge returned events into the `events[]` pre-population list alongside NPC events
  - Handle fetch failure gracefully — log error, continue with empty combat events list
- **Spec:** session-journal-integration.md

### T9 — MongoDB index

- [ ] In the database initialization / startup code (wherever indexes are created for other collections), add:
  ```ts
  await db.collection('combatStates').createIndex(
    { userId: 1, campaignId: 1, completedAt: 1 },
    { background: true }
  )
  ```
- **Spec:** combat-api.md (ADDED MongoDB index)

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent using the `openspec-review-code` skill. The primary agent must automatically address all findings before committing.

## Validation

- [ ] `npm run test:unit` — all unit tests pass
- [ ] `npm run test:integration` — all integration tests pass (new tests for T2–T5, T7–T8)
- [ ] `npx tsc --noEmit` — zero type errors
- [ ] `npm run build` — build succeeds
- [ ] E2E: `npx playwright test tests/e2e/combat.spec.ts` — existing combat E2E tests pass unmodified

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- If **ANY** of the above fail, **MUST** iterate and fix before pushing

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to `feat/combat-event-auto-capture` and push to remote
- [ ] Open PR from `feat/combat-event-auto-capture` to `main`. PR body must include: `Closes #206`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; address, commit fixes, validate locally, push, wait 180 seconds, repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll using `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing checks, commit, validate locally, push, wait 180 seconds, repeat
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:
- Implementer: (assigned at apply time)
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:
- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm thread resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on main
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update `openspec/specs/` — sync spec deltas from `openspec/changes/combat-event-auto-capture/specs/` into `openspec/specs/combat-history/`, `openspec/specs/combat-api/`, `openspec/specs/session-journal-integration/`
- [ ] Archive the change: move `openspec/changes/combat-event-auto-capture/` to `openspec/changes/archive/YYYY-MM-DD-combat-event-auto-capture/` **in a single commit** (stage both the copy and the deletion together — never split)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-combat-event-auto-capture/` exists and `openspec/changes/combat-event-auto-capture/` is gone
- [ ] **Create doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-combat-event-auto-capture` then `git push -u origin doc/archive-YYYY-MM-DD-combat-event-auto-capture`
- [ ] Open PR from doc branch to `main` with title `docs: archive combat-event-auto-capture (YYYY-MM-DD)`. Enable auto-merge immediately: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor doc PR until merged (same loop — address comments and CI failures, push to doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` && `git branch -D feat/combat-event-auto-capture doc/archive-YYYY-MM-DD-combat-event-auto-capture`
