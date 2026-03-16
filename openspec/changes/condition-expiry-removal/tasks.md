## 1. Execution

- [x] 1.1 Check out `main`, pull latest: `git checkout main && git pull`
- [x] 1.2 Create feature branch: `git checkout -b fix/condition-expiry-removal`
- [x] 1.3 Open `app/combat/page.tsx` and locate the `nextTurn` function (around line 437)

## 2. Core Fix — Condition Expiry Filter

- [x] 2.1 Before the `.map()` pass, collect expiring conditions: build an array of `{ combatantName: string, conditionName: string }` for every `cond` where `cond.duration !== undefined && cond.duration - 1 <= 0` across all `combatState.combatants`
- [x] 2.2 If the expiring array is non-empty, call `alert()` with a message listing each combatant + condition name (e.g. `"Conditions expired:\n• Goblin: Poisoned\n• Fighter: Frightened"`)
- [x] 2.3 Fix the filter predicate: change `!cond.duration || cond.duration > 0` to `cond.duration == null || cond.duration > 0` so that `duration = 0` conditions are correctly removed

## 3. Validation

- [ ] 3.1 Manually verify: add a condition with `duration = 1` to a combatant, advance turns until round wrap — confirm alert fires and condition disappears
- [ ] 3.2 Manually verify: add a condition with `duration = 2`, advance one round — confirm condition remains with `duration = 1`, no alert
- [ ] 3.3 Manually verify: add a condition with no duration — confirm it never expires and no alert fires for it
- [x] 3.4 Run existing tests: `npm test` — confirm no regressions
- [x] 3.5 If `window.alert` is called in any unit/integration tests that cover `nextTurn`, mock it: `jest.spyOn(window, 'alert').mockImplementation(() => {})`
- [x] 3.6 Run build: `npm run build` — confirm no TypeScript errors

## 4. PR and Merge

- [ ] 4.1 Commit changes: `git add app/combat/page.tsx && git commit -m "fix: remove expired conditions and alert on condition expiry at round end"`
- [ ] 4.2 Push branch and open PR referencing issue #32
- [ ] 4.3 Confirm CI passes (build + tests)
- [ ] 4.4 Resolve any review comments; re-run CI if needed
- [ ] 4.5 Enable auto-merge once approved

## 5. Post-Merge

- [ ] 5.1 Sync approved spec to permanent store: copy `openspec/changes/condition-expiry-removal/specs/combat-condition-expiry/spec.md` → `openspec/specs/combat-condition-expiry/spec.md`
- [ ] 5.2 Archive the change: run `/opsx:archive` (or `openspec archive change condition-expiry-removal`)
- [ ] 5.3 Delete local feature branch: `git branch -d fix/condition-expiry-removal`
