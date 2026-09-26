# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during `/opsx:propose` — `git fetch origin main` was run from the primary checkout before creating the worktree.
- [x] **Step 2 — Create and publish working branch:** done during `/opsx:propose` — worktree created at `.worktrees/consume-dice-preferences` via `git worktree add .worktrees/consume-dice-preferences -b consume-dice-preferences origin/main`, and pushed via `git push -u origin consume-dice-preferences`.

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 701 --repo dougis-org/session-combat --add-label "in-progress"`. Discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found for issue #701, log a warning and continue. If the `gh` token lacks the `project` scope, instruct the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).

### 1. Schema (design.md Decisions 1, 2, 3)

- [x] **1.1** In `lib/preferences/schema.ts`: change `PreferenceValues.dice.color` to `{ foreground: string; background: string } | null`; add a `DiceColor` (or similarly named) exported type for the object shape.
- [x] **1.2** In `lib/preferences/schema.ts`: change `PreferenceValues.dice.surface` to `'green-felt' | 'wood-table' | 'wood-tray' | 'metal' | null`; export `DICE_SURFACE_VALUES` as the backing tuple (design.md Decision 7).
- [x] **1.3** In `lib/preferences/schema.ts`: add `PreferenceValues.dice.material: 'glass' | 'none' | 'metal' | 'wood' | null`; export `DICE_MATERIAL_VALUES` as the backing tuple.
- [x] **1.4** Update `DEFAULT_PREFERENCES.dice` to include `material: null` alongside the existing `color: null, surface: null`.
- [x] **1.5** Replace `isValidColor` (or add a new validator) so `KEY_VALIDATORS["dice.color"]` accepts only `null` or a plain object with both `foreground` and `background` matching `HEX_COLOR`, rejecting the whole value on any other shape (no partial repair).
- [x] **1.6** Replace `KEY_VALIDATORS["dice.surface"]`'s `typeof v === "string"` check with a closed-set check against `DICE_SURFACE_VALUES` (plus `null`).
- [x] **1.7** Add `KEY_VALIDATORS["dice.material"]` as a closed-set check against `DICE_MATERIAL_VALUES` (plus `null`).
- [x] **1.8 (test-first)** In `tests/unit/lib/preferences/schema.test.ts`: write/update tests for `isValidPreferenceValue('dice.color', ...)` (valid object, `null`, missing field, invalid hex on one field, extra-field object with valid required fields), `isValidPreferenceValue('dice.surface', ...)` (each of the 4 values, `null`, an old free-string value now rejected, e.g. `'stone'`), `isValidPreferenceValue('dice.material', ...)` (each of the 4 values, `null`, invalid string), `resolvePreferences` repair for out-of-enum/malformed stored values, `validatePreferencePatch` rejection cases, `sparseKnownValues`/`partitionPreferenceDelta` coverage for the new `dice.material` key. Confirm these tests fail against the current (pre-1.1–1.7) code, then implement 1.1–1.7 to make them pass.
- [x] **1.9** In `lib/preferences/usePreferences.tsx`: add `'dice.material'` to the `PreferencePath` union and `ALL_PATHS` array.

### 2. Engine wiring (design.md Decisions 4, 5)

- [x] **2.1** In `lib/dice/useDiceAnimation.ts`: reshape the exported `DiceAppearanceOptions` interface to `{ customColorset: { foreground: string; background: string } | null; material: 'glass' | 'none' | 'metal' | 'wood' | null; surface: 'green-felt' | 'wood-table' | 'wood-tray' | 'metal' | null }`; remove the `DEFAULT_APPEARANCE` constant's dependency on `DEFAULT_COLORSET`/`DEFAULT_MATERIAL` (replace with an all-`null` default object).
- [x] **2.2** Update the `new DiceBox(container, { ... })` call: pass `theme_customColorset: appearanceRef.current.customColorset` only when non-`null` (otherwise omit the key entirely); same pattern for `theme_material` and `theme_surface`; remove `theme_colorset` entirely (no longer sourced from preferences).
- [x] **2.3 (test-first)** In the `useDiceAnimation` test suite (using `tests/unit/lib/dice/__helpers__/diceAnimationHarness.ts`'s `diceBoxMockFactory`): write/update tests asserting (a) a set `customColorset`/`material`/`surface` appear verbatim in the constructed `DiceConfig`, (b) all three are absent from the constructed config when the appearance object is all-`null`, (c) `theme_colorset` is never passed. Confirm these fail against current code, then implement 2.1–2.2.
- [x] **2.4** In `lib/components/GlobalDiceFab.tsx`: replace the `useDiceFabPreferences()`-sourced `{ colorset: prefs.diceColorset, material: prefs.diceMaterial }` object passed to `useDiceAnimation(...)` with an object built from `usePreferences().preferences.dice` (`{ customColorset: dice.color, material: dice.material, surface: dice.surface }`).

### 3. Retire the LocalStore gallery path (design.md Decision 6)

- [x] **3.1** In `lib/dice/useDiceFabPreferences.ts`: remove `diceColorset`/`diceMaterial` state, `appearanceReducer`, `AppearanceState`/`AppearanceAction` types, `COLORSET_KEY`/`MATERIAL_KEY` constants, and the `safeGet`/`safeSet` calls tied to them; remove `diceColorset`/`setDiceColorset`/`diceMaterial`/`setDiceMaterial` from the returned `DiceFabPreferences` interface and implementation. Keep `sendToChat`/`disableAnimation` and their existing helpers unchanged.
- [x] **3.2** In `lib/components/GlobalDiceFab.tsx`: remove the "Dice appearance" trigger button, `appearanceOpen` state, the focus-restore effect tied to it, the `<DiceAppearanceModal ... />` render block, and the now-unused import of `DiceAppearanceModal`.
- [x] **3.3** Delete `lib/components/dice/DiceAppearanceModal.tsx` and its test file(s).
- [x] **3.4** In `lib/dice/diceAppearance.ts`: remove `DICE_COLORSETS`, `DICE_COLORSET_CATEGORIES`, `DICE_MATERIALS`, `resolveDiceAppearance`, `DEFAULT_COLORSET`, `DEFAULT_MATERIAL`. If no remaining code imports anything from this file, delete it and its associated fixture/asset tests (`tests/unit/lib/dice/diceAppearance*.test.ts`, `tests/unit/lib/dice/__fixtures__/diceBoxEngineFacts.ts` if solely used by those tests).
- [x] **3.5 (test-first)** Update/remove `GlobalDiceFab` component tests to assert no "Dice appearance" trigger renders and no `DiceAppearanceModal` is reachable, before completing 3.2–3.3.

### 4. `/profile` UI rework (design.md Decision 7)

- [x] **4.1 (test-first)** Update `tests/unit/app/profile/page.test.tsx` (or equivalent) for the new UI: foreground/background hex inputs writing `dice.color` as an object, a "Dice Surface" `<select>` populated from `DICE_SURFACE_VALUES` with friendly labels, a new "Dice Material" `<select>` populated from `DICE_MATERIAL_VALUES`. Confirm these fail against the current single-hex-field UI.
- [x] **4.2** In `app/profile/page.tsx`: replace the single "Dice Color (Hex)" input with a foreground/background hex pair, each with its own local draft + `aria-invalid`/`role="alert"` validation (mirroring the existing FU-3 pattern, applied per field); only push a complete, valid `{ foreground, background }` object to `setPreference('dice.color', ...)`, or `null` when both are cleared.
- [x] **4.3** In `app/profile/page.tsx`: update the "Dice Surface" `<select>` to use `DICE_SURFACE_VALUES` (`green-felt`/`wood-table`/`wood-tray`/`metal`) with friendly `<option>` labels (e.g. "Green Felt", "Wood Table", "Wood Tray", "Metal"), replacing the current `wood`/`metal`/`stone`/`felt` options.
- [x] **4.4** In `app/profile/page.tsx`: add a new "Dice Material" `<select>` using `DICE_MATERIAL_VALUES` (`glass`/`none`/`metal`/`wood`) with friendly labels ("Glass", "Plastic", "Metal", "Wood"), following the same `<select>` pattern as "Dice Animation"/"Dice Surface".

### 5. Manual verification

- [ ] **5.1** Run the app locally, set a custom `dice.color`, `dice.surface`, and `dice.material` on `/profile`, then roll dice via the fab and visually confirm the rendered die/tray reflect the chosen values (covers the risk noted in proposal.md/design.md that `theme_customColorset`'s shape is inferred from the vendored engine bundle, not documented types).

- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (e.g. the FU-3 hex-draft-validation pattern in `app/profile/page.tsx` — reuse for the new foreground/background fields rather than writing a new pattern).
- [x] Confirm acceptance criteria in `openspec/changes/consume-dice-preferences/specs/profile-settings/spec.md` and `openspec/changes/consume-dice-preferences/specs/dice-appearance/spec.md` are covered by the tests written in 1.8, 2.3, 3.5, and 4.1.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `node node_modules/.bin/jest` (per project convention — `npm test` has no script; see `tests/unit/lib/preferences/schema.test.ts`, `tests/unit/lib/dice/**`, profile page tests)
- [ ] Run E2E tests (if applicable) per project convention
- [x] Run type checks: `npm run typecheck` (or project's equivalent)
- [x] Run build: `npm run build`
- [ ] Run security/code quality checks required by project standards (Codacy / Verity gate per `CLAUDE.md`)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change touches non-`.md` files (schema, hooks, components), so the **full path** applies:

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `consume-dice-preferences` to `main`. The PR body **MUST include `Closes #701`**.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 701 --repo dougis-org/session-combat --add-label "in-review" --remove-label "in-progress"`. Move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (this repo's branch ruleset only allows squash merges — never `--merge`; NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, reply, resolve via the `resolveReviewThread` GraphQL mutation (per project convention — replying alone does not resolve a thread), commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: doug (doug@dougis.com)
- Reviewer(s): `pr-review-toolkit:review-pr` automated gate + repo codeowners for `lib/preferences/` and `lib/dice/`
- Required approvals: 1 (or per repo branch protection settings)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → reply → resolve via GraphQL mutation → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected beyond the specs themselves; confirm no README/CLAUDE.md references the removed `DiceAppearanceModal`/gallery flow)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `openspec/changes/consume-dice-preferences/specs/profile-settings/spec.md` and `openspec/changes/consume-dice-preferences/specs/dice-appearance/spec.md` onto `openspec/specs/profile-settings/spec.md` and `openspec/specs/dice-appearance/spec.md` respectively, merging MODIFIED/REMOVED requirements into the existing base spec text (not a raw overwrite — the base spec's `## Purpose` and unaffected requirements are preserved). Update relative links: `../../design.md` → `../../changes/archive/YYYY-MM-DD-consume-dice-preferences/design.md`, `../../tasks.md` → `../../changes/archive/YYYY-MM-DD-consume-dice-preferences/tasks.md`.
- [ ] Archive the change: move `openspec/changes/consume-dice-preferences/` to `openspec/changes/archive/YYYY-MM-DD-consume-dice-preferences/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-consume-dice-preferences/` exists and `openspec/changes/consume-dice-preferences/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-consume-dice-preferences` then `git push -u origin doc/archive-YYYY-MM-DD-consume-dice-preferences`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-consume-dice-preferences` to `main` with title `docs: archive consume-dice-preferences (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D consume-dice-preferences doc/archive-YYYY-MM-DD-consume-dice-preferences`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/consume-dice-preferences`

Required cleanup after archive: `git fetch --prune` and `git branch -D consume-dice-preferences doc/archive-YYYY-MM-DD-consume-dice-preferences`
