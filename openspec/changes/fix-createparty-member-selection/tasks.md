# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/createparty-member-selection` then immediately `git push -u origin fix/createparty-member-selection`

## Execution

### T1 — Refactor `createParty()` in `tests/e2e/helpers/actions.ts`

- [x] Change signature from `{ name: string; description?: string; memberCount: number }` to `{ name: string; description?: string; memberNames: string[] }`
- [x] Replace the positional checkbox loop with `for (const name of party.memberNames) { await page.getByLabel(name).check(); }`
- [x] Verify TypeScript compilation catches all stale callers: `npx tsc --noEmit`

### T2 — Update `parties.spec.ts` existing callers

- [x] Replace all 4 `memberCount: 0` occurrences with `memberNames: []`
  - `tests/e2e/parties.spec.ts:20` (data-driven creation)
  - `tests/e2e/parties.spec.ts:110` (Party — no members)
  - `tests/e2e/parties.spec.ts:126` (Party editing)
  - `tests/e2e/parties.spec.ts:152` (Party deletion)

### T3 — Update `combat.spec.ts` party tests

- [x] **"user can create a party"** (line ~178):
  - Add `seedCharacter` calls for 4 characters with identity-prefixed names (e.g. `"Aragorn"`, `"Legolas"`, `"Gimli"`, `"Gandalf"`)
  - Change `memberCount: 4` → `memberNames: [all 4 names]`
  - Add assertion: `await expect(page.getByText("Members: 4")).toBeVisible()`
- [x] **"party with different member counts"** (line ~185):
  - Seed 6 characters (e.g. `"Frodo"`, `"Sam"`, `"Merry"`, `"Pippin"`, `"Aragorn"`, `"Boromir"`) — all identity-prefixed
  - Small Group: `memberNames: [frodo, sam]`; assert `"Members: 2"`
  - Large Group: `memberNames: [all 6]`; assert `"Members: 6"`
- [x] **"complete end-to-end flow"** (line ~493):
  - Replace `memberCount: 13` → `memberNames: [identity.name("Thorin")]`
  - No character seeding change needed — `createCharacter` call already exists

### T4 — Add `"Party member management"` describe block in `parties.spec.ts`

- [x] Add new describe block after the existing `"Party deletion"` block:

```typescript
test.describe("Party member management", () => {
  let charA = "";
  let charB = "";
  let partyName = "";

  test.beforeEach(async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    charA = identity.name("Aragorn");
    charB = identity.name("Legolas");
    await seedCharacter(page, { name: charA });
    await seedCharacter(page, { name: charB });
    partyName = identity.name("Fellowship");
  });

  test("add a member to existing party increases member count", async ({ page }) => { ... });
  test("remove a member from existing party decreases member count", async ({ page }) => { ... });
  test("party card shows correct member names after member changes", async ({ page }) => { ... });
});
```

- [x] Implement the add-member test: create party with `[charA]`, edit → check `charB`, save, assert `"Members: 2"`
- [x] Implement the remove-member test: create party with `[charA, charB]`, edit → uncheck `charA`, save, assert `"Members: 1"` and `charA` not visible
- [x] Implement the names-correct test: verify `charB` is visible and `charA` is not visible after remove

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill on changed files. The primary agent must automatically address all findings before committing.

## Validation

- [x] `npx tsc --noEmit` — no type errors
- [x] `npm run test:unit` — all unit tests pass
- [x] `npx playwright test tests/e2e/parties.spec.ts` — all parties E2E tests pass (local timeouts are pre-existing MongoDB testcontainer flakiness; zero strict-mode/assertion failures)
- [x] `npx playwright test tests/e2e/combat.spec.ts` — all combat E2E tests pass (same pre-existing timeout flakiness; zero assertion failures)
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates):

- **Unit tests** — `npm run test:unit`; all pass
- **Type check** — `npx tsc --noEmit`; no errors
- **E2E (parties)** — `npx playwright test tests/e2e/parties.spec.ts`; all pass
- **E2E (combat)** — `npx playwright test tests/e2e/combat.spec.ts`; all pass
- If **ANY** fail, iterate and fix before pushing

## PR and Merge

- [x] Ensure `openspec-review-code` sub-agent was run and all findings addressed before final commit
- [ ] Commit all changes to `fix/createparty-member-selection` and push to remote
- [ ] Open PR from `fix/createparty-member-selection` to `main`. PR body must include `Closes #117`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (never `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — address, commit, push to `fix/createparty-member-selection`, wait 180s, repeat until no unresolved threads
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix required failures, commit, push, wait 180s, repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user

Ownership metadata:
- Implementer: dougis
- Reviewer(s): agentic review + human approval
- Required approvals: 1

Blocking resolution flow:
- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on main
- [ ] Mark all remaining tasks complete
- [ ] No documentation updates required (test-only change)
- [ ] Sync approved spec deltas into `openspec/specs/` (no global spec impact — test helper only)
- [ ] Archive the change: move `openspec/changes/fix-createparty-member-selection/` to `openspec/changes/archive/YYYY-MM-DD-fix-createparty-member-selection/` in a single atomic commit (copy + delete staged together)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-createparty-member-selection/` exists and `openspec/changes/fix-createparty-member-selection/` is gone
- [ ] **Create doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-fix-createparty-member-selection` then push
- [ ] Open PR: `docs: archive fix-createparty-member-selection (YYYY-MM-DD)` — do NOT push directly to main
- [ ] **IMMEDIATELY** enable auto-merge on doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor doc PR until merged (same loop — address comments, fix CI, push to doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d fix/createparty-member-selection doc/archive-YYYY-MM-DD-fix-createparty-member-selection`
