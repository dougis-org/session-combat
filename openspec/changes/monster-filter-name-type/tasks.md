## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create feature branch: `git checkout -b feat/monster-filter-name-type`
- [x] 1.3 Push branch to remote immediately: `git push -u origin feat/monster-filter-name-type`

## 2. Tests (write first — TDD)

- [x] 2.1 Create `tests/unit/monsters-filter.test.tsx` (or colocate in `app/monsters/`) with failing tests for:
  - Name filter: substring match, case-insensitive, empty clears filter
  - Type filter: exact match, "All types" shows all, empty-state per section
  - Combined name + type filters compose correctly
  - Type dropdown contains sorted distinct types from both arrays
- [x] 2.2 Confirm tests fail (red) before implementation begins
- [x] 2.3 Run `npm test -- --testPathPattern=monsters-filter` to verify baseline failure

## 3. Core Implementation

- [x] 3.1 Add `filterText` and `filterType` state to `MonstersContent` in `app/monsters/page.tsx`
- [x] 3.2 Add `availableTypes` `useMemo` that computes sorted distinct `type` values from `[...userTemplates, ...globalTemplates]`
- [x] 3.3 Add `filteredUserTemplates` `useMemo` applying name substring + type exact-match filter
- [x] 3.4 Add `filteredGlobalTemplates` `useMemo` applying the same filter logic
- [x] 3.5 Replace `userTemplates.map(...)` render with `filteredUserTemplates.map(...)`
- [x] 3.6 Replace `globalTemplates.map(...)` render with `filteredGlobalTemplates.map(...)`
- [x] 3.7 Update empty-state messages in both sections: distinguish filter-zero ("No monsters match your filter.") from no-data state ("No personal monsters yet...")

## 4. Filter UI

- [x] 4.1 Add filter bar above "My Monsters" section heading with:
  - Text input bound to `filterText` (placeholder: "Filter by name…")
  - Type `<select>` bound to `filterType`, populated from `availableTypes` with "All types" first option
- [x] 4.2 Style filter bar using existing Tailwind patterns (dark bg, gray/purple accents, consistent with page)
- [x] 4.3 Verify filter bar is visible while add/edit forms are open (no conditional hiding)

## 5. Validation

- [x] 5.1 Run unit tests and confirm all pass (green): `npm test -- --testPathPattern=monsters-filter`
- [x] 5.2 Run full test suite and confirm no regressions: `npm test`
- [ ] 5.3 Manual smoke test: open `/monsters`, type "dragon", verify both sections filter; select a type, verify combined filter; clear both, verify all monsters return
- [ ] 5.4 Manual smoke test: verify empty-state message appears when filter matches nothing in a section
- [ ] 5.5 Manual smoke test: verify admin edit/add flows still work while filter is active
- [x] 5.6 Run lint: `npm run lint`

## 6. PR and Merge

- [ ] 6.1 Commit all changes with descriptive message referencing issue #108
- [ ] 6.2 Push to remote: `git push`
- [ ] 6.3 Open PR targeting `main`; title: "feat: monster filter by name and type (#108)"
- [ ] 6.4 Monitor CI checks — fix any failures, commit, push, repeat until all checks pass
- [ ] 6.5 Address any review comments, commit fixes, push, repeat until no unresolved comments remain
- [ ] 6.6 Enable auto-merge once all CI checks are green and no blocking review comments remain

## 7. Post-Merge

- [ ] 7.1 Checkout `main` and pull: `git checkout main && git pull --ff-only`
- [ ] 7.2 Verify merged changes appear on `main`
- [ ] 7.3 Sync approved spec delta to permanent location: copy `openspec/changes/monster-filter-name-type/specs/monster-filter/spec.md` → `openspec/specs/monster-filter/spec.md`
- [ ] 7.4 Archive change as single atomic commit (copy to `openspec/archive/` + delete `openspec/changes/monster-filter-name-type/` in one commit): `openspec archive change monster-filter-name-type`
- [ ] 7.5 Push archive commit to `main`
- [ ] 7.6 Delete local feature branch: `git branch -d feat/monster-filter-name-type`
