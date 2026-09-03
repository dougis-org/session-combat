# Tasks

Change: `decompose-combatant-card` · Schema: `sdd-with-feedback-loop` · Issue-driven: **yes (#680)**; follow-up **#695** is out of scope.

Ownership metadata:

- Implementer: TBD (assigned when `/opsx:apply` starts)
- Reviewer(s): `openspec-review-code` sub-agent (pre-commit) + `pr-review-toolkit:review-pr` sub-agent (PR gate) + human approver on the PR
- Required approvals: per `main` ruleset — 0 human approvals required to merge, but `ci-gate` + Codacy must pass and the `pr-review-toolkit:review-pr` gate must reach zero findings before auto-merge is enabled

Blocking resolution flow:

- CI failure → diagnose from logs → fix in worktree → commit → local validation → push → re-run checks
- Security / Codacy finding → remediate (never `verity waive` on agent judgement; use `verity feedback finding <run-id> <pattern-id> false_positive` for a genuine false positive and note it in the PR) → commit → validate → push → re-scan
- Review comment → address → commit → validate → push → confirm thread resolved
- Escalation: no forward progress for ~30 min wall time, or 3+ review-fix iterations with no reduction in findings → stop, summarize remaining blockers to the requester (Doug), wait for guidance. Never force-merge, never bypass branch protection.

## Preparation

- [ ] **Step 1 — Confirm the dedicated worktree exists:** verify `.worktrees/decompose-combatant-card` exists (created during propose) and `cd` into it. If missing, from the primary checkout run `git fetch origin main` then `git worktree add .worktrees/decompose-combatant-card -b decompose-combatant-card origin/main`. Never checkout a different branch in the primary checkout — all work happens in the worktree.
- [ ] **Step 2 — Confirm the working branch is pushed:** from inside the worktree, confirm `decompose-combatant-card` tracks `origin/decompose-combatant-card`; if not, `git push -u origin decompose-combatant-card`.
- [ ] **Step 3 — Confirm submodule + tooling:** `git submodule update --init --force .github/openspec-shared`; run `openspec validate decompose-combatant-card` (must report valid); confirm the tokensave graph is available (`tokensave_status`).
- [ ] **Step 4 — Rebase check:** `git fetch origin main` and rebase the worktree branch onto `origin/main` if it has advanced; re-run `openspec validate`.

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If not listed, halt, tell the user the plugin is required, provide installation guidance, and do not proceed until they confirm it is installed.
- [ ] **Verify `openspec-review-code` is available** — required before every commit in this plan.

## Execution

Follow strict BDD/TDD: for each unit below, write the failing test(s) first (from the `spec.md` scenarios and `tests.md`), then implement until green. Never edit a pre-existing `CombatantCard.*.test.tsx` or `combat/hpHistory.test.ts` file except where `target-action-modal/spec.md` NFAC explicitly allows updating a stale assertion for the intended cross-combatant behaviour change.

### Issue lifecycle: mark in-progress

- [ ] `gh issue edit 680 --repo dougis-org/session-combat --add-label "in-progress"`
- [ ] Discover the linked GitHub Project: `gh project list --owner dougis-org --format json`; resolve the status field option matching "In Progress" via `gh project field-list <project-number> --owner dougis-org --format json`; move the item for #680 via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks `project` scope, tell the user to run `gh auth refresh -s project` and skip the project-item update (the label edit still applies).
- [ ] #695 stays in the backlog untouched (out of scope).

### Unit A — `TypedDamageResult` + `applyTypedDamage` relocation

- [ ] Write `lib/combat/applyTypedDamage.test.ts` covering `combat-hp-orchestration` scenarios "Typed damage against immunity" and "Untyped damage lands in full", plus resistance and vulnerability rows.
- [ ] Create `lib/combat/applyTypedDamage.ts`: move the function body verbatim from `lib/components/CombatantCard.tsx`; export the documented `TypedDamageResult` interface (`hp`, `tempHp`, `effectiveDamage`, `incomingDamage`).
- [ ] `tokensave_callers` / grep for `applyTypedDamage`; update the import in `CombatantCard.tsx` (temporary, until Unit F removes it).
- [ ] Run Unit A tests + `tsc`.

### Unit B — pure orchestrator `applyHpChange`

- [ ] Write `lib/combat/applyHpChange.test.ts` covering every scenario in `combat-hp-orchestration/spec.md` "Pure HP-change orchestrator" (active damage, enter dying, damage while downed, fully-mitigated while downed, healing clears life-state, concentration CON save, drop-to-0 clears concentration, no history when unchanged, set-temp higher/lower). Assert the full `HpChangeResult` (`updates` keys + order-independent contents, `history` presence/fields, `conSaveRequired`).
- [ ] Create `lib/combat/applyHpChange.ts` with `HpChangeIntent`, `HpChangeResult`, and `applyHpChange()` per design Decision 1. Compose `applyTypedDamage`, `applyHealing`, `setTempHp`, `calcConSaveDC`, and the `deathSaves` module. No React, no `pushHpHistory`, no callbacks. Preserve the merge-key order used by the current `adjustHp`.
- [ ] Run Unit B tests + `tsc`.

### Unit C — `useCombatantHp` hook

- [ ] Write `tests/unit/hooks/useCombatantHp.test.ts` (`renderHook`) covering `combat-hp-orchestration` scenarios "Non-integer input is rejected", "Out-of-range input is rejected", "Valid input applies and clears the field", plus: heal path, set-temp path, `undoHpChange` restores hp/tempHp only, `canUndo` reflects history length, `conSaveRequired` triggers `onConSaveRequired`.
- [ ] Create `lib/hooks/useCombatantHp.ts` per design Decision 2: owns `hpAdjustment`, `isTempMode`, `selectedDamageType`, `historyLength`; contains `parseHpAdjustment` (copied verbatim from the current `CombatantCard.tsx`); wires `applyHpChange` → `onUpdate` → `pushHpHistory`/`historyLength` refresh → `onConSaveRequired`. `undoHpChange` uses `popHpHistory` + `onUpdate({ hp, tempHp })`.
- [ ] Run Unit C tests + `tsc`.

### Unit D — `ConditionFormModal`

- [ ] Write `tests/unit/components/combatant-card/ConditionFormModal.test.tsx` covering `combatant-card-decomposition` scenarios "Submitting the modal adds a validated condition", "Invalid condition input is rejected" (empty name, >100 chars, non-digit / out-of-range duration), "Cancelling the modal adds nothing".
- [ ] Create `lib/components/combatant-card/ConditionFormModal.tsx` modelled on `lib/components/TargetActionModal.tsx` (overlay, focus behaviour, `data-testid` conventions): name input + optional duration input + Add/Cancel; validation limits name `<= 100`, duration digits-only `[1, 10_000]`.
- [ ] Run Unit D tests.

### Unit E — extract sub-components into `lib/components/combatant-card/`

- [ ] Write/extend `tests/unit/components/combatant-card/` tests for `CombatantCardHeader`, `HpControls`, `ConditionControls`, `TargetingPanel` per the `combatant-card-decomposition` and `target-action-modal` ADDED scenarios.
- [ ] `git mv lib/components/... ` is not applicable (files are inside `CombatantCard.tsx`); create:
  - [ ] `lib/components/combatant-card/DamageEffectsPanel.tsx` (move body verbatim from `CombatantCard.tsx`).
  - [ ] `lib/components/combatant-card/TargetCheckboxColumn.tsx` (move body verbatim).
  - [ ] `lib/components/combatant-card/CombatantCardHeader.tsx` (name/badges/info/remove/next-turn/AC/HP readout/legendary badge/initiative — props-driven).
  - [ ] `lib/components/combatant-card/HpControls.tsx` (input/select/Damage/Heal/Set Temp/Undo/Temp checkbox/health bar — driven by `useCombatantHp` values + `combatant`).
  - [ ] `lib/components/combatant-card/ConditionControls.tsx` (conditions list + toggle + remove + "Add Condition" opening `ConditionFormModal`; replaces both `window.prompt` calls).
  - [ ] `lib/components/combatant-card/TargetingPanel.tsx` (owns `showTargeting`/`selectedTargetId`/`hoveredTargetId`; "Add Target(s)" button + selection panel + target chips + hover tooltip + `TargetActionModal` wiring + `applyDamageToTarget` / `addConditionToTarget`).
- [ ] `tokensave_callers` / grep for `DamageEffectsPanel` and `TargetCheckboxColumn` — confirm nothing outside `CombatantCard.tsx` imported them; update the single import site.
- [ ] Run Unit E tests + `tsc`.

### Unit F — cross-combatant damage routes through `applyHpChange` (latent-bug fix)

- [ ] `grep -rn "applyDamageToTarget\|onUpdateCombatant\|TargetActionModal" tests/` and read each hit; record any test asserting the old "no life-state/concentration change on target damage" behaviour.
- [ ] Write `tests/unit/components/combatant-card/TargetingPanel.targetDamage.test.tsx` covering `target-action-modal/spec.md` MODIFIED scenarios (downed target adds a death-save failure, concentrating target to 0 clears concentration, concentrating target above 0 records `pendingConSaveDC` with no callback, target HP history recorded, immune target no-op).
- [ ] Implement: `applyDamageToTarget` builds `applyHpChange(target, { kind: 'damage', amount: damage, damageType })`, calls `onUpdateCombatant(target.id, result.updates)`, pushes `result.history` for the target when present. No per-target CON-save callback.
- [ ] Update any assertion identified in the grep step to the new intended behaviour; note each in a running list for the PR body.
- [ ] Run Unit F tests.

### Unit G — rewrite `CombatantCard.tsx` as the composition layer

- [ ] Replace the body of `lib/components/CombatantCard.tsx`: destructure props (unchanged `CombatantCardProps`), call `useCombatantHp`, `useMemo` for `combatantMap`, compute display-only derived values, and render `CombatantCardHeader`, `HpControls`, `DamageEffectsPanel` (passing `selectedDamageType` from the hook), `DeathSaveTracker` + note, concentration / `pendingConSaveDC` badges, `ConditionControls`, `TargetingPanel`, notes.
- [ ] Delete `adjustHp` and the inline HP/condition closures now living in the hook / sub-components.
- [ ] Remove the `LegendaryActionsPanel` and `LairActionsSlot` imports (design Decision 7).
- [ ] `wc -l lib/components/CombatantCard.tsx` → confirm `< 300`.
- [ ] `grep -n "LegendaryActionsPanel\|LairActionsSlot\|window.prompt" lib/components/CombatantCard.tsx` → confirm no matches.

### Confirm coverage

- [ ] Every scenario in all three `spec.md` files maps to a passing test (see `tests.md` traceability table).
- [ ] Re-run `openspec validate decompose-combatant-card`.
- [ ] Run the complete pre-existing combat suite (`CombatantCard.*.test.tsx`, `ActiveCombatView.test.tsx`, `combat/hpHistory.test.ts`, `utils/combat.test.ts`) unchanged — all green.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill against the staged/unstaged diff. The primary agent applies all clearly-correct findings directly — no stopping, no presenting the list, no confirmation. Then re-run the affected tests and `tsc`, and only then commit.

## Validation

- [ ] `npm test` (or the project's documented unit command) — full suite green
- [ ] Targeted combat suites green: `CombatantCard.*.test.tsx`, `combat/*.test.ts`, `hooks/useCombatantHp.test.ts`, `combatant-card/*`
- [ ] Type check: `npx tsc --noEmit` (or documented command)
- [ ] Lint: project ESLint command — no new errors
- [ ] Build: `npm run build` — succeeds
- [ ] Security / quality: Codacy CLI analyze on changed files; Verity pre-push gate — fix findings (no agent-judgement waives)
- [ ] `run` smoke: launch the app, open an active combat, exercise damage / heal / undo / set-temp / add condition (modal) / add target / apply damage to a target (including a downed target) — no console errors, behaviour matches spec
- [ ] All completed tasks marked `- [x]`
- [ ] All steps in [Remote push validation]

## Remote push validation

Determine docs-only vs full: `git diff --name-only origin/main...HEAD`. This change touches `.ts`/`.tsx` → **full path**.

**Full path:**

- [ ] Unit tests — project unit suite; all pass
- [ ] Integration tests — project integration suite; all pass
- [ ] Regression / E2E — project E2E suite (if runnable in this environment; otherwise rely on CI `ci-gate`)
- [ ] Build — `npm run build`; succeeds with no errors

If any required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Confirm the `openspec-review-code` sub-agent ran and all findings were addressed before the final commit
- [ ] Commit all changes on `decompose-combatant-card` and push
- [ ] Open PR `decompose-combatant-card` → `main`. **PR body MUST include `Closes #680`.** Also list: (a) the two intentional behaviour changes (self condition modal; cross-combatant death-save/concentration handling) and (b) the running list of updated test assertions from Unit F. Note that #695 is the tracked follow-up for legendary/lair wiring.
- [ ] **Issue lifecycle: mark in-review:** `gh issue edit 680 --repo dougis-org/session-combat --add-label "in-review" --remove-label "in-progress"`; move the project item to the "In Review" status column (same discovery pattern; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, run [Remote push validation], push, re-run) until zero findings remain. If findings persist after 3+ iterations with no progress, report the stall with the remaining findings and wait for human guidance.
- [ ] **Only after the review gate is at zero findings:** `gh pr merge <PR-URL> --auto --squash` (`main` is squash-only; NEVER `--admin`)
- [ ] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` is `MERGED` (if `CLOSED`, stop and notify the user); never wait for a human to report the merge, never force-merge:
  1. Build and tests — run [Remote push validation]; fix failures, commit, push first
  2. PR comments — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, run [Remote push validation], push, wait 180s; repeat until all resolved
  3. CI checks — after comments are clear, poll `gh pr checks <PR-URL>`; fix failing required checks, commit, run [Remote push validation], push, wait 180s; restart from step 1

## Post-Merge

- [ ] From the **primary checkout**: `git checkout main` and `git pull --ff-only`
- [ ] Verify the squashed change is on `main`
- [ ] Mark all remaining tasks `- [x]`
- [ ] Update impacted repo docs: `.wolf/anatomy.md` (new `lib/combat/applyHpChange.ts`, `lib/combat/applyTypedDamage.ts`, `lib/hooks/useCombatantHp.ts`, `lib/components/combatant-card/*`; revised `CombatantCard.tsx` entry + token estimate), append the session line to `.wolf/memory.md`, add `.wolf/cerebrum.md` learnings (orchestrator pattern in `lib/combat/`, hook owns `selectedDamageType`, cross-combatant path now shares orchestration), and record a `.verity` decision for the cross-combatant behaviour change.
- [ ] Sync approved spec deltas into `openspec/specs/`: copy each `openspec/changes/decompose-combatant-card/specs/<cap>/spec.md` to `openspec/specs/<cap>/spec.md`, updating relative links to `../../changes/archive/YYYY-MM-DD-decompose-combatant-card/design.md` and `.../tasks.md`. Capabilities: `combat-hp-orchestration` (new), `combatant-card-decomposition` (new), `target-action-modal` (merge the delta into the existing spec). If `openspec archive` aborts on unrelated malformed live specs, use `--skip-specs` and hand-merge (per project note).
- [ ] Archive: move `openspec/changes/decompose-combatant-card/` to `openspec/changes/archive/YYYY-MM-DD-decompose-combatant-card/`, staging the copy and the deletion in a **single** commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-decompose-combatant-card/` exists and `openspec/changes/decompose-combatant-card/` is gone
- [ ] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-decompose-combatant-card` then `git push -u origin doc/archive-YYYY-MM-DD-decompose-combatant-card`
- [ ] Open PR `doc/archive-...` → `main`, title `docs: archive decompose-combatant-card (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **Immediately** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until merged (same loop as the implementation PR)
- [ ] Remove the worktree: from the primary checkout `git worktree remove .worktrees/decompose-combatant-card` (use `--force` if the openspec-shared submodule blocks it, per project note)
- [ ] Prune branches: `git fetch --prune` and `git branch -D decompose-combatant-card doc/archive-YYYY-MM-DD-decompose-combatant-card`
- [ ] Confirm #680 auto-closed via `Closes #680`; move its project item to "Done"

Required cleanup after archive: `git fetch --prune` and `git branch -D decompose-combatant-card doc/archive-YYYY-MM-DD-decompose-combatant-card`; `git worktree remove .worktrees/decompose-combatant-card`.
