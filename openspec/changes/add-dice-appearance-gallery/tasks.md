# Tasks

Change: `add-dice-appearance-gallery` · Issue: #618 · Base branch: `main` · Working branch: `add-dice-appearance-gallery` · Owner (org): `dougis-org`

## Preparation

- [ ] **Step 1 — Confirm the dedicated worktree:** verify `.worktrees/add-dice-appearance-gallery` exists (created during propose) and `cd` into it. If it is missing, from the primary checkout run `git fetch origin main` then `git worktree add .worktrees/add-dice-appearance-gallery -b add-dice-appearance-gallery origin/main`. Never checkout another branch in the primary checkout.
- [ ] **Step 2 — Confirm the working branch is published:** `git -C .worktrees/add-dice-appearance-gallery status -sb` should show it tracking `origin/add-dice-appearance-gallery`; if not, `git push -u origin add-dice-appearance-gallery` from inside the worktree.
- [ ] **Step 3 — Rebase check:** `git fetch origin main` and rebase the working branch onto `origin/main` if it has drifted; resolve the `openspec-shared` submodule pointer if needed (`git submodule update --init --force .github/openspec-shared`).

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list. If not listed, halt, tell the user the `pr-review-toolkit` plugin is required, provide installation guidance, and do not proceed until they confirm it is installed.
- [ ] **Verify the OpenSpec schema resolves in the worktree** — `openspec validate add-dice-appearance-gallery` must succeed (it needs the `.github/openspec-shared` submodule checked out; run `git submodule update --init --force .github/openspec-shared` if it fails).

## Execution

- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 618 --add-label "in-progress"`. Then discover the linked GitHub Project (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the issue's project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks `project` scope, tell the user to run `gh auth refresh -s project` and skip only the project-item move (the label edit still applies).
- [ ] Before writing new code, search for reusable pieces: `lib/dice/useDiceFabPreferences.ts` (LocalStore + reducer INIT pattern), `lib/offline/LocalStore`, `lib/components/dice/DiceRollOverlay.tsx` (portal + capture-phase Escape/outside-click + focus management), `lib/dice/useDiceAnimation.ts` (`new DiceBox` options), `.worktrees/add-user-preference-persistence/lib/preferences/schema.ts` (target `dice.*` shape).

### 1. Spec-lock the engine facts (BDD groundwork)

- [ ] 1.1 Add a checked-in note / test fixture capturing the engine facts this change relies on for `@drdreo/dice-box-threejs@1.1.0`: colorset ids + their `texture` names from `fl`, and material preset keys from `J_` (`glass`, `metal`, `perfectmetal`, `wood`, `none`). Source: `node_modules/@drdreo/dice-box-threejs/dist/dice-box-threejs.es.js`. This fixture backs task 2.3.

### 2. Appearance registry (`dice-appearance` capability)

- [ ] 2.1 **Test first:** `tests/unit/lib/dice/diceAppearance.test.ts` — assert `DICE_COLORSETS` contains only `category ∈ {Colors, Damage Types, Custom Sets}`, excludes `swrpg_*`/`swa_*`/`swl_*`/`xwing_*`/`test`/`tigerking`/`acleaf`/`isabelle`/`thecage`, and that `DICE_MATERIALS` ids are exactly `{glass, none, metal, wood}` with `none` named "Plastic". Assert `DEFAULT_COLORSET === 'white'`, `DEFAULT_MATERIAL === 'glass'`.
- [ ] 2.2 Implement `lib/dice/diceAppearance.ts`: `DICE_COLORSETS` (id, name, category, `swatch: {fg,bg}` copied from the engine `fl` entry), `DICE_MATERIALS`, `DEFAULT_COLORSET`, `DEFAULT_MATERIAL`, and `resolveDiceAppearance(rawColorset: unknown, rawMaterial: unknown): { colorset: string; material: string }` coercing unknown/absent → defaults. Colorsets grouped/orderable by category.
- [ ] 2.3 **Test:** `tests/unit/lib/dice/diceAppearance.assets.test.ts` — for every `DICE_COLORSETS` entry, map id → engine texture name(s) (via the fixture from 1.1) and assert each `*.webp` exists under `public/dice-box-threejs/textures/`. Fails the build on any miss.
- [ ] 2.4 **Test:** `resolveDiceAppearance` unit cases — valid ids pass through; unknown string, wrong type, `undefined`, `null` → defaults; never throws.

### 3. Persist the preference (`useDiceFabPreferences`)

- [ ] 3.1 **Test first:** extend `tests/unit/lib/dice/useDiceFabPreferences.test.ts` — new `diceColorset` / `diceMaterial` getters + `setDiceColorset` / `setDiceMaterial`: default when storage empty; roundtrip a set value; junk in storage → resolved default; `LocalStore` throwing on read/write → no throw, exactly one `console.warn` per failing key, in-session value still updates.
- [ ] 3.2 Extend `lib/dice/useDiceFabPreferences.ts`: add `dice-fab-colorset` and `dice-fab-material` keys, `INIT` reads them via `safeGet` and runs `resolveDiceAppearance`, add `SET_DICE_COLORSET` / `SET_DICE_MATERIAL` reducer actions + `safeSet`, expose resolved `diceColorset` / `diceMaterial` and setters on `DiceFabPreferences`. Keep the existing one-key-per-pref style.

### 4. Appearance modal + panel trigger (`global-dice-fab` capability)

- [ ] 4.1 **Test first:** `tests/unit/components/dice/DiceAppearanceModal.test.tsx` — renders `role="dialog"` + `aria-modal`, an accessible name for dice appearance; renders one selectable control per `DICE_COLORSETS` entry grouped under category headings (headings are plain text, not `<label>` — decision n-headings); renders the 4 material controls; shows the "3D roll animation only" note; selecting a colorset/material calls the setter immediately (no save button) and reflects `aria-checked`; Escape and outside-click call `onClose` and `stopPropagation`; focus enters on mount and is restored on unmount; opening the modal triggers no `import('@drdreo/dice-box-threejs')` and no `fetch`.
- [ ] 4.2 Implement `lib/components/dice/DiceAppearanceModal.tsx` as a body-level portal mirroring `DiceRollOverlay` conventions (capture-phase `keydown`/`mousedown` with `stopPropagation`, `contentRef.contains` guard, focus in/restore). Colorsets as a `radiogroup` grid of swatch+label buttons (inline `background`/`color` from `swatch`); materials as a second `radiogroup`. Props: `colorset`, `material`, `onColorsetChange`, `onMaterialChange`, `onClose`.
- [ ] 4.3 **Test first + implement:** in `tests/unit/components/GlobalDiceFab.test.tsx` add cases — a "Dice appearance" control is in the panel; activating it opens the modal; Escape/outside-click on the modal closes only the modal (panel `dialog` still present); focus returns to the trigger. Then wire `GlobalDiceFab.tsx`: local `appearanceOpen` state, trigger button in the panel, render `<DiceAppearanceModal>` fed from `prefs.diceColorset` / `prefs.diceMaterial` and the new setters.

### 5. Apply to the animation (`dice-appearance` + `global-dice-fab`)

- [ ] 5.1 **Test first:** extend `tests/unit/lib/dice/useDiceAnimation.test.ts` — with a mocked `DiceBox`, assert the constructor options include `theme_colorset`, `theme_customColorset: null`, `theme_material` from the passed appearance, and that the pre-existing options are unchanged. Default appearance → `white` / `glass`.
- [ ] 5.2 Thread the resolved appearance into `lib/dice/useDiceAnimation.ts` (hook arg kept in a ref, or `run(built, container, appearance)`), and pass the three `theme_*` options into `new DiceBox(...)`. Update `GlobalDiceFab.tsx` to supply `{ colorset: prefs.diceColorset, material: prefs.diceMaterial }`.
- [ ] 5.3 **Test:** `tests/unit/lib/dice/useDiceAnimation.reconcile.test.ts` (or a new file) — a forced d4 (`@` notation) with material `wood` + a textured colorset resolves the run with either a matching reconcile or a `FaceMismatchError` → `true` (reveal), never a throw past the boundary; assert the decided total is untouched. Add an assertion that a seeded roll's `built.total` is identical across default and non-default appearance.
- [ ] 5.4 **Test:** confirm the instant path is appearance-agnostic — a `DiceRollOverlay` render test with a non-default appearance in storage produces identical chip/inline output to the default (no new assertions needed beyond existing snapshots staying green; add one explicit check).

### 6. E2E

- [ ] 6.1 Extend `tests/e2e/dice-roll-animation.spec.ts` (or a sibling spec): open the dice panel → open appearance modal → pick a non-default colorset + material → reload → roll → assert (via the same console/probe hook the animation E2E already uses) that the engine was constructed with the chosen `theme_colorset` / `theme_material`, and the roll total banner still renders. Use a free port (not 3000) for the test server (feedback memory).

### 7. Docs / spec sync prep

- [ ] 7.1 Update `.wolf/anatomy.md` with the new files (`lib/dice/diceAppearance.ts`, `lib/components/dice/DiceAppearanceModal.tsx`, new test files) and append the session line to `.wolf/memory.md`.
- [ ] 7.2 Note in `design.md` (already recorded) the intended `PreferenceValues.dice.colorset` / `.material` mapping; leave a `TODO(add-user-preference-persistence)` comment near the two new keys in `useDiceFabPreferences.ts`.
- [ ] 7.3 Confirm every acceptance scenario in `openspec/changes/add-dice-appearance-gallery/specs/**/spec.md` maps to at least one test above.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill against the staged + unstaged diff. The primary agent automatically applies all clearly-correct findings directly to the code — without stopping, without presenting the list to the user, without asking. Apply fixes, re-run the affected tests to confirm green, then commit.

## Validation

- [ ] Run unit/integration tests — `npm test` (and the dice-focused suites) all green
- [ ] Run E2E tests — `npm run test:e2e` for the dice specs (free port, not 3000)
- [ ] Run type checks — `npm run typecheck` (or `tsc --noEmit` per project config)
- [ ] Run lint — `npm run lint`
- [ ] Run build — `npm run build` succeeds with no errors
- [ ] Run Codacy analysis on changed files (`mcp__codacy__codacy_cli_analyze` per project rules)
- [ ] All completed tasks marked complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Determine docs-only vs full: `git diff --name-only origin/main...HEAD` — if every changed file ends in `.md`, docs-only path; otherwise full path. This change touches `.ts`/`.tsx`, so the **full path** applies:

- **Unit tests** — `npm test`; all pass
- **Integration tests** — project integration suite (`npm run test:integration` if present); all pass
- **Regression / E2E tests** — `npm run test:e2e` for at least the dice specs; all pass
- **Build** — `npm run build`; succeeds with no errors

If ANY step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Confirm the `openspec-review-code` sub-agent ran and all findings were addressed before the final commit
- [ ] Commit all changes to `add-dice-appearance-gallery` and push to remote
- [ ] Open a PR from `add-dice-appearance-gallery` to `main`. **PR body MUST include `Closes #618`.** Use any repo PR template (`.github/PULL_REQUEST_TEMPLATE`).
- [ ] **Issue lifecycle: mark in-review** — `gh issue edit 618 --add-label "in-review" --remove-label "in-progress"`, then move the project item to the "In Review" status column (same discovery as the in-progress step; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero remain. If findings persist after 3+ iterations with no progress, report the stall with remaining findings and wait for human guidance.
- [ ] **After the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (main is squash-only per ruleset; NEVER `--admin`, never push directly to `main`)
- [ ] **Iterate until merged** — loop until `gh pr view <PR-URL> --json state` returns `MERGED` (exit + notify if `CLOSED`):
  1. **Build and tests** — run [Remote push validation]; fix failures, commit, push first
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, run [Remote push validation], push, wait 180s; repeat until all resolved
  3. **CI check failures** — only after comments are clear, poll `gh pr checks <PR-URL>`; fix failing required checks (`ci-gate`, Codacy), commit, validate, push, wait 180s; restart at step 1

Ownership metadata:

- Implementer: (assigned at apply time)
- Reviewer(s): doug (`doug@dougis.com`) + `pr-review-toolkit:review-pr` gate
- Required approvals: 0 human approvals required by the `main` ruleset; required checks `ci-gate` + Codacy must be green; the automated review gate must reach zero findings before auto-merge

Blocking resolution flow:

- CI failure → diagnose → fix → commit → validate locally → push → re-run checks
- Security/Codacy finding → remediate (or justify + config-suppress with maintainer sign-off) → commit → validate → push → re-scan
- Review comment → address → commit → validate → push → confirm thread resolved
- Stall (no progress after 3 review-fix iterations, or CI red >24h with no clear cause) → stop, hand back to doug with remaining findings listed

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes are on `main`
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Update impacted repo docs (README dice section if any; `.wolf/anatomy.md`, `.wolf/cerebrum.md` learnings, `.wolf/buglog.json` if bugs were fixed during apply)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `specs/dice-appearance/spec.md` → `openspec/specs/dice-appearance/spec.md` (new capability) and merge `specs/global-dice-fab/spec.md` into `openspec/specs/global-dice-fab/spec.md`. In each promoted file, rewrite relative links: `../../design.md` → `../../changes/archive/YYYY-MM-DD-add-dice-appearance-gallery/design.md`, same for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/add-dice-appearance-gallery/` → `openspec/changes/archive/YYYY-MM-DD-add-dice-appearance-gallery/`, staging the copy and the deletion in **one** commit. If `openspec archive` aborts on unrelated malformed live specs, use `--skip-specs` and hand-merge (project memory `project_openspec_live_specs_malformed`).
- [ ] Confirm the archive dir exists and the original is gone
- [ ] Create a doc branch: `git checkout -b doc/archive-YYYY-MM-DD-add-dice-appearance-gallery` then `git push -u origin doc/archive-YYYY-MM-DD-add-dice-appearance-gallery`
- [ ] Open a PR `docs: archive add-dice-appearance-gallery (YYYY-MM-DD)` from that branch to `main` — do NOT push directly to `main`
- [ ] Immediately `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER `--admin`)
- [ ] Monitor the doc PR until merged (same loop as the implementation PR)
- [ ] Cleanup: `git fetch --prune`; `git branch -D add-dice-appearance-gallery doc/archive-YYYY-MM-DD-add-dice-appearance-gallery`; `git worktree remove .worktrees/add-dice-appearance-gallery` (add `--force` if the `openspec-shared` submodule blocks removal — project memory `project_worktree_submodule_removal`)
- [ ] Close-out: confirm issue #618 auto-closed via `Closes #618`; move its project item to "Done" if not automatic
