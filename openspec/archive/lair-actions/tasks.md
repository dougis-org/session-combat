## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only (`git checkout main && git pull --ff-only`)

## 2. Branch Setup

- [x] 2.1 Create feature branch `feat/lair-actions` from `main`
- [x] 2.2 Push branch to remote immediately (`git push -u origin feat/lair-actions`) — branch must exist on remote before any implementation work begins

## 3. Types

- [x] 3.1 In `lib/types.ts`, add `"lair"` to the `CombatantState.type` union (`"player" | "monster" | "lair"`)
- [x] 3.2 In `lib/types.ts`, add `usesRemaining?: number` to the `CreatureAbility` interface
- [x] 3.3 Verify TypeScript compiles clean (`npx tsc --noEmit`)

## 4. Pure Functions — TDD

- [x] 4.1 Write failing unit tests for `useCharge`: normal decrement, clamp at 0, no `usesRemaining` field passthrough
- [x] 4.2 Write failing unit tests for `restoreCharge`: normal increment, no `usesRemaining` field passthrough
- [x] 4.3 Write failing unit tests for `restoreAllCharges`: limited actions incremented, unlimited actions unchanged, mixed array
- [x] 4.4 Confirm all three test suites fail (`npm test -- --testPathPattern=combat`)
- [x] 4.5 In `lib/utils/combat.ts`, implement `useCharge(ability: CreatureAbility): CreatureAbility` — decrements `usesRemaining` by 1, clamps at 0, returns new object
- [x] 4.6 In `lib/utils/combat.ts`, implement `restoreCharge(ability: CreatureAbility): CreatureAbility` — increments `usesRemaining` by 1, returns new object
- [x] 4.7 In `lib/utils/combat.ts`, implement `restoreAllCharges(actions: CreatureAbility[]): CreatureAbility[]` — applies `restoreCharge` to all actions where `usesRemaining` is a finite number; returns new array
- [x] 4.8 Confirm all pure-function tests pass

## 5. Sort Tiebreaker — TDD

- [x] 5.1 Write failing unit tests for `sortCombatants`: lair before player at init 20, lair before monster at init 20, multiple lairs sorted alphabetically by name, existing player/monster tie order preserved
- [x] 5.2 Confirm sort tests fail
- [x] 5.3 In `app/combat/page.tsx`, update `sortCombatants` so that at the same initiative value lair slots sort before players, which sort before monsters; add alphabetical-by-name secondary sort within multiple lair slots
- [x] 5.4 Confirm all sort tests pass

## 6. LairActionsSlot Component — TDD

- [x] 6.1 Write failing unit tests for `LairActionsSlot`: renders compact badge when inactive, renders full action list when active, Skip calls `onNextTurn`, Use decrements charge via `onUpdate`, `[−]`/`[+]` controls call `onUpdate`, Restore All calls `onUpdate` with incremented charges, Use button disabled at `usesRemaining: 0`, no HP/AC/conditions rendered
- [x] 6.2 Confirm component tests fail (component does not exist yet)
- [x] 6.3 Create `lib/components/LairActionsSlot.tsx` with props: `combatant: CombatantState`, `onUpdate: (updates: Partial<CombatantState>) => void`, `onNextTurn: () => void`, `isActive: boolean` — no Firebase or Next.js imports
- [x] 6.4 Implement inactive state: compact badge with lair icon and lair name
- [x] 6.5 Implement active state: full action list with description (read-only during combat), `[−] N [+]` charge controls per action (hidden when `usesRemaining` is absent), Use button (disabled at 0), and exhausted visual indicator
- [x] 6.6 Add "Skip" button (calls `onNextTurn`) in active state
- [x] 6.7 Add "Restore All" button: calls `restoreAllCharges` on `lairActions` and invokes `onUpdate`
- [x] 6.8 Confirm all component tests pass

## 7. Page Integration — TDD

- [x] 7.1 Write failing E2E tests: Add lair slot pre-combat (form appears, confirm inserts slot at initiative 20), auto-seed from monster, lair sorts before initiative-20 player, compact badge visible when inactive, advancing turn shows active `LairActionsSlot`, Skip advances to next combatant, Use decrements charge, Use disabled at 0, exhausted visual applied, remove lair slot, descriptions read-only during combat
- [x] 7.2 Confirm E2E tests fail
- [x] 7.3 In `app/combat/page.tsx`, update the initiative-order render map: when `combatant.type === "lair"`, render `<LairActionsSlot>` instead of `<CombatantCard>`
- [x] 7.4 Add "Add Lair" button to the pre-combat setup surface and the active combat view (alongside existing Add Combatant controls)
- [x] 7.5 Implement the Add Lair form: lair name input + optional "Seed from monster" dropdown (lists current-encounter monsters with non-empty `lairActions[]`)
- [x] 7.6 On form confirm: create a `CombatantState` with `type: "lair"`, `initiative: 20`, chosen name, seeded or empty `lairActions[]`, inert `CreatureStats` defaults (`ac: 0`, `hp: 0`, `maxHp: 0`, all-10 ability scores), `conditions: []`; insert into `combatants[]`
- [x] 7.7 Implement remove lair slot: removes the pseudo-combatant from `combatants[]`
- [x] 7.8 Lock description fields once combat is active; charge controls remain editable
- [x] 7.9 Confirm all E2E tests pass

## 8. Validation

- [x] 8.1 Run full test suite: `npm test`
- [x] 8.2 Run type check: `npx tsc --noEmit`
- [x] 8.3 Run build: `npm run build`
- [x] 8.4 Audit all `c.type` / `combatant.type` branches in `app/combat/page.tsx` and `lib/components/` — confirm no lair slot renders HP bar, AC, or conditions UI
- [x] 8.5 Confirm `usesRemaining` rendering is guarded to `LairActionsSlot` only (not present in legendary or trait UI)

## 9. PR and Merge

- [x] 9.1 Commit all changes with a clear message and push to `feat/lair-actions`
- [x] 9.2 Open PR from `feat/lair-actions` to `main`
- [x] 9.3 Monitor CI: on failure, diagnose, fix, commit, push, repeat until all checks pass
- [x] 9.4 Address each review comment, commit fixes to `feat/lair-actions`, push, repeat until no unresolved comments remain
- [x] 9.5 Enable auto-merge only when all required CI checks are green and no blocking review comments remain

## 10. Post-Merge

- [x] 10.1 Checkout `main` and pull; verify merged changes appear on the default branch
- [x] 10.2 Mark all tasks complete
- [x] 10.3 Sync approved spec deltas: copy `openspec/changes/lair-actions/specs/` content to `openspec/specs/` as appropriate
- [x] 10.4 Archive the change: copy `openspec/changes/lair-actions/` to `openspec/archive/lair-actions/` and delete the original — commit both the copy and deletion as a **single atomic commit**; push to `main`
- [x] 10.5 Prune merged local branch (`git branch -d feat/lair-actions`)
