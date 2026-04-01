## 1. Preparation

- [x] 1.1 Checkout `main` and pull with fast-forward only: `git checkout main && git pull --ff-only`
- [x] 1.2 Create feature branch and push to remote: `git checkout -b feat/monster-library-multi-column && git push -u origin feat/monster-library-multi-column`

## 2. Tests (write first — TDD)

- [x] 2.1 Add tests to `tests/unit/monstersPage.test.tsx` verifying the grid layout class (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) is present on the user and global card list containers
- [x] 2.2 Add tests verifying the `MonsterTemplateEditor` is NOT rendered inline inside either section body when editing
- [x] 2.3 Add tests verifying the modal overlay (`fixed inset-0 z-50`) appears when `editingTemplate` is set
- [x] 2.4 Add tests verifying backdrop click calls `cancelEdit` (closes modal)
- [x] 2.5 Add tests verifying Escape key press calls `cancelEdit`
- [x] 2.6 Run tests and confirm they fail (red): `npm test -- tests/unit/monstersPage.test.tsx`

## 3. Implementation

- [x] 3.1 In `app/monsters/page.tsx`, replace `<div className="space-y-4">` in the user section with `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`
- [x] 3.2 Replace `<div className="space-y-4">` in the global section with the same grid class
- [x] 3.3 Remove `{editingTemplate && editingMode === 'user' && <MonsterTemplateEditor ... />}` from the user section body
- [x] 3.4 Remove `{editingTemplate && editingMode === 'global' && <MonsterTemplateEditor ... />}` from the global section body
- [x] 3.5 Add `useEffect` to `MonstersContent` that attaches a `keydown` listener for Escape when `editingTemplate` is set, and removes it on cleanup
- [x] 3.6 Add backdrop click handler: outer modal div `onClick={cancelEdit}`, inner form div `onClick={e => e.stopPropagation()}`
- [x] 3.7 Add the modal block to `MonstersContent` render: `{editingTemplate && <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8" onClick={cancelEdit}><div className="max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}><MonsterTemplateEditor .../></div></div>}`

## 4. Refactor Pass

- [x] 4.1 Review the modal JSX for clarity — extract a named handler `handleBackdropClick` if the inline onClick is awkward
- [x] 4.2 Confirm no duplicate `MonsterTemplateEditor` render paths remain in the file

## 5. Validation

- [x] 5.1 Run unit tests and confirm green: `npm test -- tests/unit/monstersPage.test.tsx`
- [x] 5.2 Run full test suite: `npm test`
- [x] 5.3 Run linter: `npm run lint`
- [x] 5.4 Manual smoke test: open `/monsters`, verify cards appear in a grid, open editor modal, verify backdrop click and Escape both close it

## 6. PR and Merge

- [ ] 6.1 Commit all changes to `feat/monster-library-multi-column` and push
- [ ] 6.2 Open PR from `feat/monster-library-multi-column` → `main` referencing issue #107
- [ ] 6.3 Monitor CI — if checks fail: diagnose, fix, commit, push, repeat until green
- [ ] 6.4 Address all review comments — commit fixes, push, repeat until no unresolved comments remain
- [ ] 6.5 Enable auto-merge once all required CI checks are green and no blocking comments remain

## 7. Post-Merge

- [ ] 7.1 Checkout `main` and pull: `git checkout main && git pull --ff-only`
- [ ] 7.2 Verify merged changes appear on `main`
- [ ] 7.3 Sync approved spec delta to permanent location: copy `openspec/changes/monster-library-multi-column/specs/monster-library-grid-layout/spec.md` → `openspec/specs/monster-library-grid-layout/spec.md`
- [ ] 7.4 Archive this change (single atomic commit): copy `openspec/changes/monster-library-multi-column/` → `openspec/archive/monster-library-multi-column/` and delete original — commit and push together
- [ ] 7.5 Prune local feature branch: `git branch -d feat/monster-library-multi-column`
