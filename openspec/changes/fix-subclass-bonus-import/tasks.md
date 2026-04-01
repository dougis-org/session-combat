## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create working branch: `git checkout -b fix/subclass-bonus-import`
- [x] 1.3 Push branch to remote immediately: `git push -u origin fix/subclass-bonus-import`

## 2. Interface Update

- [x] 2.1 In `lib/dndBeyondCharacterImport.ts`, add `"set"` to the `type` field
  of the `DndBeyondModifier` interface alongside existing values

## 3. AC Normalization Fix

- [x] 3.1 In `lib/dndBeyondCharacterImport.ts`, update `getArmorBonuses()` (or
  extract a new helper) to collect `unarmored-armor-class` modifiers — returning
  the max `"set"` value plus the sum of all `"bonus"` values
- [x] 3.2 Update `normalizeArmorClass()` unarmored path to apply the result:
  `10 + maxSetUnarmoredBonus + sumBonusUnarmoredBonus + dexterityModifier`
- [x] 3.3 Verify existing equipped-armor path is unchanged (no regression to
  armor items with `subType === "armor-class"`)

## 4. HP Normalization Fix

- [x] 4.1 In `lib/dndBeyondCharacterImport.ts`, update `normalizeMaxHp()` to
  sum modifiers with `subType === "hit-points-per-level"` multiplied by
  `totalLevel` and add to the result
- [x] 4.2 Update `normalizeMaxHp()` to sum modifiers with
  `subType === "hit-points"` (flat bonus) and add to the result
- [x] 4.3 Verify `overrideHitPoints` short-circuit path is unchanged (still
  returns override value without applying modifiers)

## 5. Tests

- [x] 5.1 Add test: unarmored AC with a `type=set, subType=unarmored-armor-class`
  modifier (Draconic Resilience — value 3 → AC = 10 + 3 + DEX)
- [x] 5.2 Add test: unarmored AC with a `type=bonus, subType=unarmored-armor-class`
  modifier (Bracers of Defense — value 2 → additive)
- [x] 5.3 Add test: unarmored AC with both `set` and `bonus` unarmored-armor-class
  modifiers combined (max set + sum bonus + DEX)
- [x] 5.4 Add test: max HP with `hit-points-per-level` modifier (value 1 × level
  12 = +12 HP)
- [x] 5.5 Add test: max HP with flat `hit-points` modifier (fixedValue 4 → +4 HP)
- [x] 5.6 Add test: max HP with both per-level and flat HP modifiers combined
- [x] 5.7 Add test: `overrideHitPoints` still wins over all HP modifiers
- [x] 5.8 Add test: multiple `type=set` unarmored-armor-class modifiers — only max
  value applies regardless of order (added during code review)
- [x] 5.9 Run full unit test suite: `npm test -- --testPathPattern=dndBeyondCharacterImport`

## 6. Validation

- [x] 6.1 Run full test suite: `npm test`
- [x] 6.2 Run lint: `npm run lint`
- [x] 6.3 Run type-check: `npm run type-check` (or equivalent)
- [ ] 6.4 Manually verify calculated values against character 105034644 (Mond Blue):
  expected unarmored AC = 10 + 3 (Draconic) + 2 (Bracers) + DEX mod; expected
  max HP includes +12 from Draconic Resilience + +4 from item

## 7. PR and Merge

- [x] 7.1 Commit changes: `git add lib/dndBeyondCharacterImport.ts tests/unit/import/dndBeyondCharacterImport.test.ts`
- [x] 7.2 Push branch: `git push`
- [x] 7.3 Open PR targeting `main`, referencing issue #104
- [x] 7.4 Monitor CI — fix any failures, commit, push, repeat until green
- [x] 7.5 Address any review comments, push fixes, repeat until no unresolved comments
- [ ] 7.6 Enable auto-merge once all CI checks pass and no blocking review comments remain

## 8. Post-Merge

- [ ] 8.1 Checkout `main` and pull: `git checkout main && git pull --ff-only`
- [ ] 8.2 Verify merged changes appear on `main`
- [ ] 8.3 Sync approved spec delta to canonical location:
  copy `openspec/changes/fix-subclass-bonus-import/specs/dnd-beyond-character-import/spec.md`
  delta into `openspec/specs/dnd-beyond-character-import/spec.md`
- [ ] 8.4 Archive change as a single atomic commit (copy to `openspec/archive/` and
  delete `openspec/changes/fix-subclass-bonus-import/` in the same commit):
  `openspec archive fix-subclass-bonus-import`
- [ ] 8.5 Push archive commit to `main`
- [ ] 8.6 Delete local feature branch: `git branch -d fix/subclass-bonus-import`
