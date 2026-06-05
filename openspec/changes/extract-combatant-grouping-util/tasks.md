# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/extract-combatant-grouping-util` then immediately `git push -u origin refactor/extract-combatant-grouping-util`

## Execution

- [x] **Add `GroupedCombatants` interface to `lib/utils/combat.ts`**
  - Add after the existing imports:
    ```ts
    export interface GroupedCombatants {
      alive: {
        players: Map<string, CombatantState[]>;
        monsters: Map<string, CombatantState[]>;
      };
      dead: {
        players: Map<string, CombatantState[]>;
        monsters: Map<string, CombatantState[]>;
      };
      totals: {
        players: number;  // alive only
        monsters: number; // alive only
      };
    }
    ```

- [x] **Add `groupCombatantsForDisplay` function to `lib/utils/combat.ts`**
  - Extract the filtering and grouping logic verbatim from `lib/components/CombatInfoIcon.tsx` lines 14–53
  - Function signature: `export function groupCombatantsForDisplay(combatants: CombatantState[]): GroupedCombatants`
  - Return `{ alive: { players: alivePlayersByName, monsters: aliveMonstersByName }, dead: { players: deadPlayersByName, monsters: deadMonstersByName }, totals: { players: totalPlayers, monsters: totalMonsters } }`

- [x] **Refactor `lib/components/CombatInfoIcon.tsx`**
  - Import `groupCombatantsForDisplay` from `@/lib/utils/combat`
  - Replace lines 14–53 with: `const { alive, dead, totals } = groupCombatantsForDisplay(combatants);`
  - Update all references in JSX:
    - `alivePlayersByName` → `alive.players`
    - `aliveMonstersByName` → `alive.monsters`
    - `deadPlayersByName` → `dead.players`
    - `deadMonstersByName` → `dead.monsters`
    - `totalPlayers` → `totals.players`
    - `totalMonsters` → `totals.monsters`

- [x] **Verify TypeScript compiles:** `npx tsc --noEmit`
- [x] **Verify existing tests pass:** `npm test -- --testPathPattern CombatInfoIcon`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run unit tests: `npm test`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [ ] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Integration tests** — `npm run test:e2e` if applicable; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `refactor/extract-combatant-grouping-util` to `main`. PR body must include **`Closes #274`**.
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; address, commit, follow remote push validation, push; wait 180 seconds; repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll using `gh pr checks <PR-URL> --json isRequired,state`; fix any required-check failures, commit, follow remote push validation, push; wait 180 seconds; repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user

Ownership metadata:

- Implementer: @dougis
- Reviewer(s): automated CI + agentic reviewer
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No documentation updates required (pure internal refactor)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/extract-combatant-grouping-util/` to `openspec/changes/archive/YYYY-MM-DD-extract-combatant-grouping-util/` **in a single commit** — stage both the new location and the deletion of the old in the same commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-extract-combatant-grouping-util/` exists and `openspec/changes/extract-combatant-grouping-util/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-extract-combatant-grouping-util` then push
- [ ] Open PR from doc branch to `main` with title `docs: archive extract-combatant-grouping-util (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR
- [ ] Monitor the doc PR until it merges
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d refactor/extract-combatant-grouping-util doc/archive-YYYY-MM-DD-extract-combatant-grouping-util`
