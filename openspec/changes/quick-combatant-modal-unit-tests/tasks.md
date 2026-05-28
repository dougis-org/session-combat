# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b test/quick-combatant-modal-unit-tests` then immediately `git push -u origin test/quick-combatant-modal-unit-tests`
- [x] Verify `@testing-library/user-event` is in `package.json` dependencies; install if missing (`npm install --save-dev @testing-library/user-event`)

## Execution

### §1 — Test: render and navigation

Spec: `openspec/changes/quick-combatant-modal-unit-tests/specs/render-and-navigation.md`

- [x] Create `tests/unit/components/QuickCombatantModal.test.tsx` with file header (`@jest-environment jsdom`, `IS_REACT_ACT_ENVIRONMENT`, imports, `next/link` mock, `crypto.randomUUID` spy, minimal fixtures)
- [x] Write `describe('render and navigation')` block:
  - [ ] Test: modal renders with monsters tab active by default (heading visible, Monsters tab `aria-selected="true"`)
  - [ ] Test: close button calls `onClose`
  - [ ] Test: backdrop click calls `onClose`
  - [ ] Test: clicking inside the modal does NOT call `onClose`
  - [ ] Test: switching to Party Members tab updates `aria-selected`
  - [ ] Test: switching to Create New tab makes custom form visible
  - [ ] Test: tab switch resets search query and creator filter to defaults
- [x] Run: `npx jest tests/unit/components/QuickCombatantModal.test.tsx --testNamePattern="render and navigation"` — all pass

### §2 — Test: monster states

Spec: `openspec/changes/quick-combatant-modal-unit-tests/specs/search-and-filter.md`

- [x] Write `describe('monster tab states')` block:
  - [ ] Test: `loadingTemplates=true` shows "Loading templates..." and hides search input
  - [ ] Test: `monsterTemplates=[]` shows "No monster templates available" with link
- [x] Run: `npx jest tests/unit/components/QuickCombatantModal.test.tsx --testNamePattern="monster tab states"` — all pass

### §3 — Test: monster search and filter

Spec: `openspec/changes/quick-combatant-modal-unit-tests/specs/search-and-filter.md`

- [x] Write `describe('monster search and filter')` block:
  - [ ] Test: all monsters visible initially (no search, no filter)
  - [ ] Test: typing "Goblin" filters list to Goblin only
  - [ ] Test: clearing search restores all monsters
  - [ ] Test: no-match search shows "No monsters match your search and filter criteria"
  - [ ] Test: "My" filter shows only user's monster (Orc)
  - [ ] Test: "Global" filter shows only global monster (Goblin)
  - [ ] Test: "Other" filter shows only shared monster (Troll)
  - [ ] Test: "All" filter (after "Global") shows all monsters
- [x] Run: `npx jest tests/unit/components/QuickCombatantModal.test.tsx --testNamePattern="monster search and filter"` — all pass

### §4 — Test: monster selection

Spec: `openspec/changes/quick-combatant-modal-unit-tests/specs/selection.md`

- [x] Write `describe('monster selection')` block:
  - [ ] Test: clicking Add calls `onAddMonster` with `{ id: 'test-uuid', templateId: 'g1', name: 'Goblin' }` (and spread fields)
  - [ ] Test: adding monster shows success toast ("Goblin added successfully")
  - [ ] Test: adding monster with `showToast=false` shows no toast
  - [ ] Test: modal stays open after adding (heading still visible, `onClose` not called)
  - [ ] Test: "(Global)" badge rendered for global monster
  - [ ] Test: "(Mine)" badge rendered for user's own monster
  - [ ] Test: "(Shared)" badge rendered for other user's monster
- [x] Run: `npx jest tests/unit/components/QuickCombatantModal.test.tsx --testNamePattern="monster selection"` — all pass

### §5 — Test: character tab

Spec: `openspec/changes/quick-combatant-modal-unit-tests/specs/search-and-filter.md`, `openspec/changes/quick-combatant-modal-unit-tests/specs/selection.md`

- [x] Write `describe('character tab')` block:
  - [ ] Test: `loadingTemplates=true` on characters tab shows "Loading characters..."
  - [ ] Test: `characterTemplates=[]` shows "No party members available" with link
  - [ ] Test: characters render when present ("Aria" and "Bron" visible)
  - [ ] Test: typing "Aria" filters to Aria only
  - [ ] Test: clicking Add calls `onAddCharacter` with the Aria character object
  - [ ] Test: adding character shows toast ("Aria added successfully")
- [x] Run: `npx jest tests/unit/components/QuickCombatantModal.test.tsx --testNamePattern="character tab"` — all pass

### §6 — Test: custom form

Spec: `openspec/changes/quick-combatant-modal-unit-tests/specs/custom-form.md`

- [x] Write `describe('custom form')` block:
  - [ ] Test: form fields render (Name, Dexterity, AC, Max HP, Current HP, Initiative, "Add Combatant" button, "Cancel" button)
  - [ ] Test: happy path — valid inputs → `onAddMonster` called with correct payload, `onClose` called
  - [ ] Test: initiative filled → payload includes `initiative: 18`
  - [ ] Test: initiative blank → payload does NOT include `initiative` key
  - [ ] Test: dexterity 14 → modifier displays "+2"
  - [ ] Test: empty name → "Name is required" error, `onAddMonster` not called
  - [ ] Test: dexterity=0 → dexterity range error, `onAddMonster` not called
  - [ ] Test: dexterity=31 → dexterity range error, `onAddMonster` not called
  - [ ] Test: AC=0 → "AC must be at least 1", `onAddMonster` not called
  - [ ] Test: maxHp=0 → "Max HP must be at least 1", `onAddMonster` not called
  - [ ] Test: hp > maxHp → "Current HP must be between 0 and Max HP", `onAddMonster` not called
  - [ ] Test: validation error clears when switching tabs
  - [ ] Test: Cancel button calls `onClose`
- [x] Run: `npx jest tests/unit/components/QuickCombatantModal.test.tsx --testNamePattern="custom form"` — all pass

### §7 — Update OpenWolf anatomy

- [x] Add entry to `.wolf/anatomy.md` for `tests/unit/components/QuickCombatantModal.test.tsx`
- [x] Append entry to `.wolf/memory.md`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill on the changed files. The primary agent must automatically address all findings before committing.

## Validation

- [x] Run full unit test suite: `npm test` — all tests pass (no regressions)
- [x] Run coverage for target file: `npx jest --coverage --collectCoverageFrom='lib/components/QuickCombatantModal.tsx' tests/unit/components/QuickCombatantModal.test.tsx` — statement ≥ 70%, branch ≥ 55%
- [x] Run type check: `npx tsc --noEmit` — no errors
- [x] Run build: `npm run build` — succeeds

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test` — all tests pass
- **Integration tests** — `npm run test:integration` — all tests pass
- **Build** — `npm run build` — no errors
- If **ANY** of the above fail, iterate and fix before pushing

## PR and Merge

- [x] Ensure `openspec-review-code` sub-agent was run and all findings addressed before final commit
- [ ] Commit all changes to `test/quick-combatant-modal-unit-tests` and push to remote
- [ ] Open PR from `test/quick-combatant-modal-unit-tests` to `main`. PR body MUST include: `Closes #258`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin` to force)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — poll autonomously; address comments, commit fixes, follow Remote push validation, push, wait 180 seconds, repeat until no unresolved threads remain
- [ ] **Monitor CI checks** — poll via `gh pr checks <PR-URL> --json isRequired,state`; fix any blocking failure, commit, follow Remote push validation, push, wait 180 seconds, repeat
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify

Ownership metadata:

- Implementer: (assigned agent)
- Reviewer(s): @dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → diagnose with `npx jest --verbose` or `npm run build` → fix → commit → validate → push → re-run checks
- Review comment → address → commit → validate → push → confirm thread resolved
- Security finding → N/A (test-only change, no new dependencies expected)

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all tasks complete (`- [x]`)
- [ ] Update `.wolf/anatomy.md` if any files were renamed or moved during review
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/quick-combatant-modal-unit-tests/` to `openspec/changes/archive/YYYY-MM-DD-quick-combatant-modal-unit-tests/` **in a single atomic commit** (stage both the new location and the deletion of the old location together)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-quick-combatant-modal-unit-tests/` exists and `openspec/changes/quick-combatant-modal-unit-tests/` is gone
- [ ] **Create a doc branch** for the archive commit: `git checkout -b doc/archive-YYYY-MM-DD-quick-combatant-modal-unit-tests` then `git push -u origin doc/archive-YYYY-MM-DD-quick-combatant-modal-unit-tests`
- [ ] Open a PR from the doc branch to `main` with title `docs: archive quick-combatant-modal-unit-tests (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until merged (same comment/CI loop as implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` && `git branch -d test/quick-combatant-modal-unit-tests doc/archive-YYYY-MM-DD-quick-combatant-modal-unit-tests`
