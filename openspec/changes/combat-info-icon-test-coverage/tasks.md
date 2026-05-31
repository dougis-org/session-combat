# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/combat-info-icon-test-coverage` then immediately `git push -u origin feat/combat-info-icon-test-coverage`

## Execution

- [x] Read `lib/types.ts` to confirm the exact shape of `CombatantState['conditions']` (field names: `id`, `name`, `duration`)
- [x] Add fixture helpers to `tests/unit/components/CombatInfoIcon.test.tsx`:
  - `ALIVE_MONSTER` — alive monster (hp > 0)
  - `ALIVE_PLAYER_WITH_CONDITION` — alive player with one condition (`Poisoned`, duration 3)
  - `ALIVE_PLAYER_CONDITION_NO_DURATION` — alive player with one condition (`Blinded`, no duration)
  - `GOBLIN_1`, `GOBLIN_2` — two alive monsters sharing the name "Goblin" (for ×N grouping)
- [x] Add `describe('Column layout and headings')` block covering:
  - Both column headings visible after hover (`PLAYERS (1)`, `MONSTERS (1)`)
  - Dead combatants excluded from header count (`PLAYERS (1)`, `MONSTERS (0)`)
- [x] Add `describe('×N grouping')` block covering:
  - Two same-name monsters grouped with "×2"
  - Single combatant renders without multiplier
- [x] Add `describe('Status conditions')` block covering:
  - Condition with duration: `• Poisoned (3)` visible after hover
  - Condition without duration: `• Blinded` visible without trailing parenthesis
- [x] Add `describe('DEFEATED section')` block covering:
  - DEFEATED label present when dead combatant exists
  - DEFEATED label absent when all combatants alive
- [x] Add `describe('Strikethrough on dead combatants')` block covering:
  - Dead combatant name's ancestor has class `line-through`
- [x] Add `describe('"None" fallback text')` block covering:
  - Players column shows "None" when only monsters present
  - Monsters column shows "None" when only players present
- [x] Add `describe('Independent column sections')` block covering:
  - One alive player + one dead monster: Players column has no DEFEATED, Monsters column does
- [x] Add `describe('Empty state')` block covering:
  - Empty combatant array: tooltip shows "No combatants" after hover

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] `npx jest tests/unit/components/CombatInfoIcon.test.tsx --no-coverage` — all tests pass (existing 6 + new)
- [x] `npx tsc --noEmit` — no type errors
- [x] `npx jest --no-coverage` — full suite passes (no regressions)
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npx jest --no-coverage` — all pass
- **Build** — `npm run build` — succeeds with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [ ] Open PR from `feat/combat-info-icon-test-coverage` to `main`. PR body must state **"Closes #62"**
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — poll autonomously; address comments, commit fixes, validate locally, push; wait 180 seconds; repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing check, commit, validate locally, push; wait 180 seconds; repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user

Ownership metadata:

- Implementer: Claude Code agent
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on main
- [ ] Mark all remaining tasks as complete
- [ ] Sync approved spec deltas into `openspec/specs/`
- [ ] Archive the change: move `openspec/changes/combat-info-icon-test-coverage/` to `openspec/changes/archive/YYYY-MM-DD-combat-info-icon-test-coverage/` in a single commit (copy + delete staged together)
- [ ] Confirm archive path exists and original path is gone
- [ ] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-combat-info-icon-test-coverage` then push
- [ ] Open PR from doc branch to `main` titled `docs: archive combat-info-icon-test-coverage (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR
- [ ] Monitor doc PR until merged (same loop as implementation PR)
- [ ] Prune local branches: `git fetch --prune` and `git branch -d feat/combat-info-icon-test-coverage doc/archive-YYYY-MM-DD-combat-info-icon-test-coverage`
