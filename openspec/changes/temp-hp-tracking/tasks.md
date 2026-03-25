## 1. Execution

- [x] 1.1 Check out `main` and pull latest: `git checkout main && git pull --ff-only`
- [x] 1.2 Create feature branch: `git checkout -b feat/temp-hp-tracking`

## 2. Type Change

- [x] 2.1 In `lib/types.ts`, add `tempHp?: number` to `CombatantState` (after `conditions`, before `notes`)

## 3. Combat Math Extraction

- [x] 3.1 Create `lib/utils/combat.ts` with three pure exported functions:
  - `applyDamage(hp, tempHp, damage)` → `{ hp, tempHp }` — drains temp first, overflow to regular, floors regular at 0
  - `applyHealing(hp, maxHp, amount)` → `{ hp }` — caps at maxHp
  - `setTempHp(currentTempHp, newValue)` → `{ tempHp }` — `Math.max(currentTempHp, newValue)` (no stacking)
- [x] 3.2 Create `tests/unit/combat/combat.test.ts`:
  - `applyDamage`: fully absorbed, partially absorbed, exact match, overflow to 0 HP, no temp HP baseline
  - `applyHealing`: normal heal, heal at max (capped), heal from 0
  - `setTempHp`: higher value replaces, lower value ignored, equal value ignored, setting from 0

## 4. Component Updates — `app/combat/page.tsx`

- [x] 4.1 Replace `adjustHp` body with `applyHealing` / `applyDamage` calls from `combat.ts`
- [x] 4.2 Replace `applyDamageToTarget` body with `applyDamage` call from `combat.ts`
- [x] 4.3 Add `isTempMode` boolean state to `CombatCard` (default `false`)
- [x] 4.4 Render `Temp [ ]` checkbox next to the `[Damage] [Heal]` buttons; toggles `isTempMode`
- [x] 4.5 When `isTempMode` is true, rename Heal button label to "Set Temp" and call `setTempHp` on click
- [x] 4.6 Update health bar:
  - Compute `total = combatant.maxHp + (combatant.tempHp ?? 0)`
  - Segment 1: `width = (hp / total) * 100%`, existing colour logic unchanged
  - Segment 2: `width = (tempHp / total) * 100%`, `bg-blue-400`, `data-testid="temp-hp-bar"`, only rendered when `tempHp > 0`
- [x] 4.7 Update HP numeric display: when `tempHp > 0`, append `+N tmp` in blue (`text-blue-400`) after Max

## 5. E2E Test

- [x] 5.1 Add scenario to `tests/e2e/combat.spec.ts`:
  - Set up combat with one combatant (hp=30, maxHp=40)
  - Enable Temp toggle, enter 14, click "Set Temp" → assert `+14 tmp` visible, temp bar segment visible
  - Enter 10, click "Damage" → assert `+4 tmp` visible, hp unchanged (30)
  - Enter 10, click "Damage" → assert temp gone (0), hp=24
  - Click "End Combat", confirm → assert combat screen cleared

## 6. Validation

- [x] 6.1 Run unit tests: `npm test` — all pass including new `combat.test.ts`
- [ ] 6.2 Run E2E tests: `npx playwright test` — new temp HP scenario passes, no regressions
- [x] 6.3 Run type check: `npx tsc --noEmit`
- [x] 6.4 Run build: `npm run build`

## 7. PR and Merge

- [ ] 7.1 Commit and push feature branch
- [ ] 7.2 Open PR referencing issue #87
- [ ] 7.3 Wait for CI and any agent reviews; resolve all comments
- [ ] 7.4 Enable auto-merge when all checks are green

Ownership metadata:
- Implementer: —
- Reviewer(s): —
- Required approvals: 1

## 8. Post-Merge

- [ ] 8.1 Archive this change: run `/opsx:archive`
- [ ] 8.2 Delete local feature branch: `git branch -d feat/temp-hp-tracking`
- [ ] 8.3 Sync spec to global store if applicable
