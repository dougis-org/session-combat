## 1. Preparation

- [x] 1.1 Checkout `main` branch and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create working branch: `git checkout -b feat/legendary-actions`
- [x] 1.3 Push branch to remote immediately: `git push -u origin feat/legendary-actions`

## 2. Type Changes (`lib/types.ts`)

- [x] 2.1 Add `cost?: number` to `CreatureAbility` interface
- [x] 2.2 Add `legendaryActionCount?: number` to `MonsterTemplate` interface (alongside existing `legendaryActions?`)
- [x] 2.3 Add `legendaryActionCount?: number` to `Monster` interface
- [x] 2.4 Add `legendaryActionCount?: number` and `legendaryActionsRemaining?: number` to `CombatantState` interface
- [x] 2.5 Verify `npm run build` passes with type changes only

## 3. SRD Data Backfill (`lib/data/srd-monsters.ts`)

- [x] 3.1 Grep all entries with a non-empty `legendaryActions:` array and list them
- [x] 3.2 Add `legendaryActionCount: 3` to each identified entry (directly above or below `legendaryActions:`)
- [x] 3.3 Add `cost: 1` to each `CreatureAbility` entry within every `legendaryActions` array in the SRD data
- [x] 3.4 Verify `npm run build` still passes

## 4. Monster Upload Validator (`lib/validation/monsterUpload.ts`)

- [x] 4.1 Add `legendaryActionCount?: number` to the `RawMonsterData` interface
- [x] 4.2 Pass `legendaryActionCount: raw.legendaryActionCount` through in the monster mapping function (alongside existing `legendaryActions` passthrough at line ~671)
- [x] 4.3 Verify `npm run build` passes

## 5. Combat Utility Functions (`lib/utils/combat.ts`)

- [x] 5.1 Add `useLegendaryAction(remaining: number, cost: number): { legendaryActionsRemaining: number }` — returns `Math.max(0, remaining - cost)`
- [x] 5.2 Add `resetLegendaryActions(count: number): { legendaryActionsRemaining: number }` — returns `{ legendaryActionsRemaining: count }`
- [x] 5.3 Write unit tests for `useLegendaryAction`: cost 1 decrements by 1; cost 2 decrements by 2; remaining cannot go below 0; remaining of 0 stays 0
- [x] 5.4 Write unit tests for `resetLegendaryActions`: returns full count; count of 0 returns 0
- [x] 5.5 Run unit tests: `npm test -- --testPathPattern=combat` and confirm all pass

## 6. Combat Initialisation (`app/combat/page.tsx` — `addCombatantFromLibrary`)

- [x] 6.1 In `addCombatantFromLibrary`, when building the `CombatantState` from a monster, copy `legendaryActionCount` from the source and set `legendaryActionsRemaining: monster.legendaryActionCount ?? 0`
- [x] 6.2 Verify that a combatant added from a legendary SRD monster (e.g. Aboleth) has both fields set correctly in state

## 7. Turn Advance Reset (`app/combat/page.tsx` — `nextTurn`)

- [x] 7.1 In the mid-round branch of `nextTurn` (the `else` path), build an updated combatants array that resets `legendaryActionsRemaining` for the combatant at `nextIndex` if `legendaryActionCount > 0`, then pass it to `saveCombatState`
- [x] 7.2 In the round-end branch of `nextTurn` (the `if` path that runs `processRoundEnd`), apply the same reset to the combatant at `nextIndex` after `processRoundEnd` runs
- [x] 7.3 Write/extend unit or integration test: advancing turn to a legendary combatant resets `legendaryActionsRemaining` to `legendaryActionCount`
- [x] 7.4 Verify non-legendary combatants are not touched by the reset

## 8. UI — Counter Badge in Combatant Row

- [x] 8.1 In `CombatantCard` (inside `app/combat/page.tsx`), add a `⚡ R/N` badge in the combatant row — rendered only when `combatant.legendaryActionCount > 0`
- [x] 8.2 Use amber styling (`text-amber-400`) for the badge, consistent with D&D tooling convention
- [x] 8.3 Add `data-testid="legendary-action-badge"` to the badge element
- [x] 8.4 Verify badge updates reactively when `legendaryActionsRemaining` changes

## 9. UI — Detail Panel Legendary Actions Section

- [x] 9.1 In the detail panel's legendary actions section, add a section header showing remaining count (e.g. `LEGENDARY ACTIONS — ⚡ 3 remaining`)
- [x] 9.2 Add pool editor: `[−] N [+]` controls that call `onUpdate` with new `legendaryActionCount` and reset `legendaryActionsRemaining` to the new count; clamp minimum at 0
- [x] 9.3 Add `[Use — N ⚡]` button for each action in `legendaryActions[]`, using `cost ?? 1` for the label and calling `useLegendaryAction`; disable when `legendaryActionsRemaining < (cost ?? 1)`
- [x] 9.4 Add `[Restore All]` button that calls `resetLegendaryActions(legendaryActionCount)` via `onUpdate`
- [x] 9.5 Add `data-testid` attributes: `legendary-action-pool-editor`, `legendary-action-use-{index}`, `legendary-action-restore`

## 10. Validation & Tests

- [x] 10.1 Run full unit test suite: `npm test` — all tests pass
- [x] 10.2 Run build: `npm run build` — no type errors
- [x] 10.3 Run linter: `npm run lint` — no new violations
- [x] 10.4 Write E2E test: add legendary monster → badge visible in row with correct count
- [x] 10.5 Write E2E test: click Use → remaining decrements; badge updates
- [x] 10.6 Write E2E test: advance turn to legendary combatant → remaining resets to pool
- [x] 10.7 Write E2E test: `[−]/[+]` pool editor → count and remaining update
- [x] 10.8 Write E2E test: `[Restore All]` → remaining resets to pool
- [ ] 10.9 Manually verify in dev server: Aboleth added to combat shows `⚡ 3/3`; use actions; advance turn resets

## 11. PR and Merge

- [x] 11.1 Commit all changes to `feat/legendary-actions`: `git add <files> && git commit -m "feat(combat): legendary action counter tracking (#90)"`
- [x] 11.2 Push: `git push`
- [x] 11.3 Open PR from `feat/legendary-actions` → `main` referencing issue #90
- [ ] 11.4 Monitor CI — fix any failures, push fixes, repeat until all checks green
- [ ] 11.5 Address all review comments — commit fixes, push, repeat until no unresolved comments
- [ ] 11.6 Enable auto-merge once all CI checks pass and no blocking review comments remain
- [ ] 11.7 Confirm merge to `main`

## 12. Post-Merge

- [ ] 12.1 Checkout `main` and pull: `git checkout main && git pull --ff-only`
- [ ] 12.2 Verify merged changes appear on `main`
- [ ] 12.3 Sync spec delta to canonical location: copy `openspec/changes/legendary-actions/specs/legendary-action-tracking/spec.md` → `openspec/specs/legendary-action-tracking/spec.md`
- [ ] 12.4 Archive change as single atomic commit (copy to `openspec/changes/archive/` + delete original in one commit): `git add openspec/ && git commit -m "chore(openspec): archive legendary-actions change"`
- [ ] 12.5 Push archive commit: `git push`
- [ ] 12.6 Prune merged local branch: `git branch -d feat/legendary-actions`
- [ ] 12.7 Close GitHub issue #90
