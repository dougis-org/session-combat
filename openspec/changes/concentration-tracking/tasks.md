# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/concentration-tracking` then immediately `git push -u origin feat/concentration-tracking`

## Execution

### 1. Type model — add concentration fields to `CombatantState`

- [x] In `lib/types.ts`, add to `CombatantState` (after `activeDamageEffects?`):
  ```ts
  concentratingOn?: string;
  pendingConSaveDC?: number;
  ```
- [x] Verify: `npx tsc --noEmit` — no new type errors

### 2. Utility — `calcConSaveDC` in `lib/utils/combat.ts`

- [x] Add pure helper:
  ```ts
  export function calcConSaveDC(effectiveDamage: number): number {
    return Math.max(10, Math.floor(effectiveDamage / 2));
  }
  ```
- [x] Write unit tests in `tests/unit/utils/` (new or existing combat utils test file):
  - `calcConSaveDC(0)` → 10 (edge: zero damage; though this path should not be reached at call sites)
  - `calcConSaveDC(14)` → 10
  - `calcConSaveDC(19)` → 10 (floor(19/2) = 9 → max(10,9) = 10)
  - `calcConSaveDC(20)` → 10
  - `calcConSaveDC(21)` → 10 (floor(21/2) = 10)
  - `calcConSaveDC(50)` → 25
- [x] Verify: `npm run test:unit -- --testPathPattern=combat` — all pass

### 3. Damage handler — concentration check in `CombatantCard.tsx`

- [x] In the existing damage-apply callback in `lib/components/CombatantCard.tsx`:
  - After computing `effectiveDamage` (from `applyDamage` / `applyDamageWithType`):
    - If `combatant.concentratingOn` is set **and** `effectiveDamage > 0`: set `pendingConSaveDC: calcConSaveDC(effectiveDamage)` in the state update
    - If new `hp === 0`: also set `concentratingOn: undefined, pendingConSaveDC: undefined`
  - Import `calcConSaveDC` from `lib/utils/combat`
- [x] Write RTL tests in `tests/unit/components/CombatantCard.concentration.test.tsx` (new file, following the split-file pattern already in place):
  - Damage to concentrating combatant sets `pendingConSaveDC` via `onUpdate`
  - Damage with `effectiveDamage = 0` (immunity) does not set `pendingConSaveDC`
  - Lethal damage clears `concentratingOn` and `pendingConSaveDC`
  - Non-lethal damage preserves `concentratingOn`
  - Damage to non-concentrating combatant does not set `pendingConSaveDC`
- [x] Verify: `npm run test:unit -- --testPathPattern=CombatantCard` — all pass

### 4. CON save notification — `onConSaveRequired` callback and `ActiveCombatView` handler

**Context (pre-investigated):** `CombatantState` has no `userId`. Player combatant IDs follow `character-${character.id}`. `ActiveCombatView` has `characters[]` from `useCombat`. Campaign chat supports `{ scope: "direct"; toUserId }` messages.

- [x] Add `onConSaveRequired?: (dc: number) => void` to `CombatantCardProps` in `lib/components/CombatantCard.tsx`
- [x] In the damage handler in `CombatantCard`, call `onConSaveRequired?.(calcConSaveDC(effectiveDamage))` when `concentratingOn` is set and `effectiveDamage > 0`
- [x] In `lib/components/ActiveCombatView.tsx`, implement the `onConSaveRequired` prop passed to each `CombatantCard`:
  - Extract character ID: if `combatant.id.startsWith('character-')`, strip prefix to get `characterId`
  - Look up `Character` in `characters` array by `character.id === characterId`
  - If found (player-type): POST a `CampaignMessage` to the campaign messages API with `visibility: { scope: "direct"; toUserId: character.userId }` and text describing the required save and DC
  - If not found (monster-type): no player message — DM-only awareness via the card DC prompt
- [x] Write RTL tests in `tests/unit/components/CombatantCard.concentration.test.tsx`:
  - `onConSaveRequired` is called with correct DC when concentrating combatant takes effective damage
  - `onConSaveRequired` is NOT called when `effectiveDamage = 0`
  - `onConSaveRequired` is NOT called when `concentratingOn` is undefined
- [x] Write unit tests for `ActiveCombatView` notification handler:
  - Player-type combatant: assert `fetch` called with direct-message body containing `toUserId`
  - Monster-type combatant: assert `fetch` NOT called with a direct message
- [x] Verify: `npm run test:unit` — all pass

### 5. Card UI — concentration badge and DC prompt

- [x] In `lib/components/CombatantCard.tsx`, render:
  - **Concentration badge:** when `concentratingOn` is set, a pill/badge displaying the spell name (consistent with existing pill style in the design system)
  - **DC prompt:** when `pendingConSaveDC` is set, an inline alert showing "CON Save DC {pendingConSaveDC}" with a dismiss (×) button; clicking dismiss calls `onUpdate` with `pendingConSaveDC: undefined`
- [x] Extend `tests/unit/components/CombatantCard.concentration.test.tsx`:
  - Badge renders with spell name
  - Badge absent when `concentratingOn` is undefined
  - DC prompt renders with correct DC value
  - DC prompt absent when `pendingConSaveDC` is undefined
  - Dismiss button clears `pendingConSaveDC` via `onUpdate`
- [x] Verify: `npm run test:unit -- --testPathPattern=CombatantCard` — all pass

### 6. Detail panel — set/end concentration UI

- [x] In `lib/components/CombatantDetailPanel.tsx`, add:
  - A labeled text input ("Concentrating on spell") pre-filled with `combatant.concentratingOn ?? ""`; on save (blur or Enter) calls `onUpdate` with `concentratingOn: value || undefined`
  - An "End Concentration" button (visible only when `concentratingOn` is set) that calls `onUpdate` with `concentratingOn: undefined, pendingConSaveDC: undefined`
- [x] Write RTL tests in `tests/unit/components/CombatantDetailPanel.test.tsx` (new or extend if file exists):
  - Input pre-filled with current spell name
  - Submitting a new spell name calls `onUpdate` with `concentratingOn: "NewSpell"`
  - "End Concentration" button visible when concentrating
  - "End Concentration" button absent when not concentrating
  - Clicking "End Concentration" calls `onUpdate` with both fields cleared
  - Setting a second spell name overwrites the first (single-spell enforcement)
- [x] Verify: `npm run test:unit -- --testPathPattern=CombatantDetailPanel` — all pass

### 7. Full unit suite

- [x] `npm run test:unit` — all tests pass

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npx tsc --noEmit` — zero type errors
- [x] `npm run test:unit` — all tests pass
- [x] `npm run test:integration` — all tests pass
- [x] `npm run build` — build succeeds with no errors
- [x] All execution tasks marked complete
- [x] All steps in [Remote push validation] pass

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test:unit` — all pass
- **Integration tests** — `npm run test:integration` — all pass
- **Build** — `npm run build` — succeeds

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build` — succeeds
- Skip integration and unit tests

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/concentration-tracking` and push to remote
- [x] Open PR from `feat/concentration-tracking` to `main`. PR body MUST include `Closes #93`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin`; NEVER use `--merge` — repo ruleset requires squash)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, push before doing anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL>`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: AI agent
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on main
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec delta: copy `openspec/changes/concentration-tracking/specs/concentration-tracking/spec.md` → `openspec/specs/concentration-tracking/spec.md`; update relative links from `../../design.md` → `../../changes/archive/YYYY-MM-DD-concentration-tracking/design.md` and `../../tasks.md` → `../../changes/archive/YYYY-MM-DD-concentration-tracking/tasks.md`
- [ ] Archive the change: move `openspec/changes/concentration-tracking/` to `openspec/changes/archive/YYYY-MM-DD-concentration-tracking/` — **stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-concentration-tracking/` exists and `openspec/changes/concentration-tracking/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-concentration-tracking` then `git push -u origin doc/archive-YYYY-MM-DD-concentration-tracking`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-concentration-tracking` to `main` with title `docs: archive concentration-tracking (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until merged (same loop as implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feat/concentration-tracking doc/archive-YYYY-MM-DD-concentration-tracking`
