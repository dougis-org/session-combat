## Preparation

Implementer: agent
Reviewer: human reviewer
Approval expectation: proposal approval required before implementation begins

- [x] 1.1 Check out `main` and pull the latest remote changes with fast-forward only
- [x] 1.2 Create working branch `feat/hp-undo-damage-history` from `main` and push it to remote before any implementation work begins
- [x] 1.3 Review `lib/utils/combat.ts`, `lib/types.ts`, `app/combat/page.tsx`, and `lib/clientStorage.ts` against the approved proposal, design, and specs
- [x] 1.4 Confirm test locations for the new `hpHistory.ts` unit tests and the context menu behavior tests

## Execution

- [x] 2.1 Add `HpHistoryEntry` interface to `lib/types.ts`
- [x] 2.2 Create `lib/utils/hpHistory.ts` with `pushHpHistory`, `popHpHistory`, `getHpHistoryStack`, and `clearCombatHistory` — localStorage key `hp-history:<combatId>`, cap at 10 entries (FIFO overflow)
- [x] 2.3 In `app/combat/page.tsx`, call `pushHpHistory` before `calcApplyDamage` in the damage handler
- [x] 2.4 In `app/combat/page.tsx`, call `pushHpHistory` before `calcApplyHealing` in the healing handler
- [x] 2.5 In `app/combat/page.tsx`, call `pushHpHistory` before `calcSetTempHp` in the temp HP handler
- [x] 2.6 In `app/combat/page.tsx`, call `pushHpHistory` before `calcApplyDamageWithType` in the `applyDamageToTarget` handler
- [x] 2.7 Add `undoHpChange(combatantId)` handler in `app/combat/page.tsx`: pop history, restore `hp`/`tempHp`, save state + API PUT; no new history entry recorded
- [x] 2.8 Call `clearCombatHistory(combatId)` in the end-combat handler (where `isActive` becomes `false`)
- [x] 2.9 Add "Undo HP Change" item to the combatant context menu — enabled when `getHpHistoryStack(combatId, combatantId).length > 0`, calls `undoHpChange(combatantId)`

## Validation

- [x] 3.1 Create `tests/unit/combat/hpHistory.test.ts`: test `pushHpHistory` (basic push, cap enforcement at 10, FIFO overflow), `popHpHistory` (returns and removes top entry; returns `undefined` when empty), `getHpHistoryStack` (returns empty array when key absent), `clearCombatHistory` (removes key)
- [x] 3.2 Add unit tests for `undoHpChange`: verify `hp`/`tempHp` restored to snapshot values; no new history entry recorded
- [x] 3.3 Add tests for the context menu item: enabled when history non-empty; disabled when empty
- [x] 3.4 Run `npm test` for the full unit suite and fix any failures
- [x] 3.5 Run lint on all touched files (`lib/types.ts`, `lib/utils/hpHistory.ts`, `app/combat/page.tsx`) and fix any issues

## PR and Merge

- [x] 4.1 Commit all changes to `feat/hp-undo-damage-history` and push to remote
- [x] 4.2 Open a pull request from `feat/hp-undo-damage-history` to `main`
- [x] 4.3 Monitor CI status until all required checks are green
- [x] 4.4 Address every review comment with targeted follow-up commits on the working branch, then push
- [x] 4.5 Re-run validation after each round of fixes until no blocking comments or CI failures remain
- [x] 4.6 Enable auto-merge only when CI is green and no blocking review comments remain

## Post-Merge

- [x] 5.1 Check out `main` and pull the merged changes after the PR is merged
- [x] 5.2 Verify the merged changes are present on `main`
- [x] 5.3 Sync the approved `temp-hp-tracking` spec delta from `openspec/changes/hp-undo-damage-history/specs/temp-hp-tracking/spec.md` into `openspec/specs/temp-hp-tracking/spec.md`
- [x] 5.4 Sync the new `hp-undo-history` spec from `openspec/changes/hp-undo-damage-history/specs/hp-undo-history/spec.md` into `openspec/specs/hp-undo-history/spec.md`
- [ ] 5.5 Archive the change directory as a single atomic commit that includes both the archive copy and deletion of `openspec/changes/hp-undo-damage-history/`
- [ ] 5.6 Push the archive commit to `main`
- [ ] 5.7 Prune merged local branches and verify the repository is clean
