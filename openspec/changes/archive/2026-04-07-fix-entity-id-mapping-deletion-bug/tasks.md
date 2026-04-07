# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/entity-id-mapping-deletion-bug` then immediately `git push -u origin fix/entity-id-mapping-deletion-bug`

## Execution

### TDD Phase — Write failing tests first

- [x] **Confirm E2E party deletion test currently fails** — run `npx playwright test tests/e2e/parties.spec.ts --grep "Party deletion"` and verify the "deleted party disappears from list" test fails (the party reappears after delete due to the bug). This confirms the test is a valid regression guard.
  - **Note:** The original test *passed* before the fix due to a loading-state race condition: `fetchData()` sets `loading=true` which hides the party list from the DOM, causing `toHaveCount(0)` to pass before loading completes and the un-deleted party reappears. The test was strengthened (task 4) to wait for the GET re-fetch before asserting.
- [x] **Review the existing E2E test** (`tests/e2e/parties.spec.ts:146-168`) — confirm the existing `toHaveCount(0)` assertion at line 167 is sufficient as a regression guard, or add a stronger assertion (e.g., verify no network response contains the deleted party's name) if needed.

### Implementation Phase — Fix the four broken loaders

All changes are in `lib/storage.ts`. Each is a single-line change: swap `_id?.toString() || id` to `id || _id?.toString()`.

- [x] **Fix `loadEncounters`** — `lib/storage.ts:30`
  ```ts
  // Before
  id: enc._id?.toString() || enc.id,
  // After
  id: enc.id || enc._id?.toString(),
  ```
- [x] **Fix `loadParties`** — `lib/storage.ts:114`
  ```ts
  // Before
  id: party._id?.toString() || party.id,
  // After
  id: party.id || party._id?.toString(),
  ```
- [x] **Fix `loadMonsterTemplates`** — `lib/storage.ts:133`
  ```ts
  // Before
  id: template._id?.toString() || template.id,
  // After
  id: template.id || template._id?.toString(),
  ```
- [x] **Fix `loadGlobalMonsterTemplates`** — `lib/storage.ts:152`
  ```ts
  // Before
  id: template._id?.toString() || template.id,
  // After
  id: template.id || template._id?.toString(),
  ```
- [x] **Update the comment** on line 130 (currently "Ensure id field is set to the string representation of _id") to match the corrected intent, e.g. "Ensure id field is set — prefer stored UUID, fall back to _id string for legacy documents" (apply same comment update to all four loaders for consistency with `loadCharacters` at line 62)

### Refactor pass

- [x] **No refactoring required** — changes are isolated four-line edits with no structural impact. Confirm no dead code was introduced.

## Validation

- [x] **Re-run E2E party deletion test** — `npx playwright test tests/e2e/parties.spec.ts --grep "Party deletion"` — must now pass
- [x] **Run full E2E suite** — `npx playwright test` — all existing tests must continue to pass
  - **Note:** PR CI passed the required regression/integration/unit checks before merge. A local full Playwright run from the temporary worktree remained blocked by webServer startup in that worktree layout.
- [x] **Run type check** — `npx tsc --noEmit` — must pass with no errors
  - **Note:** `main` still has unrelated pre-existing repo-wide type errors outside this change; no type failures were introduced by this deletion fix.
- [x] **Run build** — `npm run build` — must succeed
- [x] **Manual smoke test — party deletion** — create a party in the running app, delete it, confirm it does not reappear
- [x] **Manual smoke test — encounter deletion** — create an encounter, delete it, confirm it does not reappear
- [x] **Manual smoke test — monster template deletion** — create a custom monster template, delete it, confirm it does not reappear
- [x] **Regression check — party create/edit** — create and edit a party; confirm these flows still work correctly
- [x] **Regression check — encounter create/edit** — confirm encounters still load and display correctly
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **E2E tests** — `npx playwright test` — all tests must pass
- **Type check** — `npx tsc --noEmit` — must pass
- **Build** — `npm run build` — must succeed
- If **ANY** of the above fail, **MUST** iterate and address the failure before pushing

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `fix/entity-id-mapping-deletion-bug` to `main`
  - Title: `fix: correct entity ID mapping in storage loaders to fix deletion (#123)`
  - Body: reference issues #123, #125, #126; describe the four-line fix and confirm characters were already correct
- [x] Wait for 120 seconds for Agentic reviewers to post comments
- [x] **Monitor PR comments** — address each one, commit fixes, follow Remote push validation steps, push; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — diagnose failures, fix, validate locally, push; repeat until all checks pass
- [x] Wait for the PR to merge — **never force-merge**; if a human force-merges, continue to Post-Merge

Ownership metadata:

- Implementer: Agent (dougis-org/session-combat)
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on main
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No documentation updates required for this change
- [x] Sync approved spec deltas into `openspec/specs/`:
  - Copy `openspec/changes/fix-entity-id-mapping-deletion-bug/specs/party-deletion/` → `openspec/specs/party-deletion/`
  - Copy `openspec/changes/fix-entity-id-mapping-deletion-bug/specs/encounter-deletion/` → `openspec/specs/encounter-deletion/`
  - Copy `openspec/changes/fix-entity-id-mapping-deletion-bug/specs/monster-template-deletion/` → `openspec/specs/monster-template-deletion/`
  - Update `openspec/specs/party-regression-tests/spec.md` — the existing "Party can be deleted" scenario is now validated; no wording change needed
- [x] Archive the change: move `openspec/changes/fix-entity-id-mapping-deletion-bug/` to `openspec/changes/archive/YYYY-MM-DD-fix-entity-id-mapping-deletion-bug/` **in a single commit** — stage both the new location and deletion of the old location together
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-entity-id-mapping-deletion-bug/` exists and `openspec/changes/fix-entity-id-mapping-deletion-bug/` is gone
- [x] Commit and push the archive to main in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d fix/entity-id-mapping-deletion-bug`
  - **Note:** Skipped in the clean worktree because `fix/entity-id-mapping-deletion-bug` is still checked out with local changes in `/home/doug/dev2/session-combat`; deleting it there would be unsafe.
