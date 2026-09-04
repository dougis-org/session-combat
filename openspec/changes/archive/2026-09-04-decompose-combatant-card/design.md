## Context

- Relevant architecture:
  - `lib/components/CombatantCard.tsx` (~883 lines) — the target. One function component, 9 `useState` + 1 `useMemo`, ~380-line JSX return, plus two already-extracted module-scope sub-components (`DamageEffectsPanel`, `TargetCheckboxColumn`) and a module-scope helper `applyTypedDamage`.
  - `lib/combat/` — established home for pure combat domain modules: `deathSaves.ts` (`usesDeathSaves`, `enterDying`, `clearDeathState`, `applyDeathSaveRoll`, `toggleDeathSaveSlot`, `applyDamageWhileDowned`, `lifeStateDisplay`), `conditionExpiry.ts`. All return `Partial<CombatantState>` or plain data; none import React.
  - `lib/utils/combat.ts` — HP math (`applyDamage`, `applyHealing`, `setTempHp`, `applyDamageWithType`), `calcConSaveDC`, effect merges, legendary-pool helpers.
  - `lib/utils/hpHistory.ts` — `pushHpHistory`, `popHpHistory`, `getHpHistoryStack` (localStorage-backed, keyed by `combatId` + combatant id).
  - `lib/components/TargetActionModal.tsx` — existing real modal for cross-combatant damage/condition actions.
  - `lib/components/LegendaryActionsPanel.tsx`, `lib/components/LairActionsSlot.tsx` — imported by the card but never rendered (tracked in #695).
  - `lib/components/DeathSaveTracker.tsx` — rendered by the card; unchanged by this work.
  - Consumers: `ActiveCombatView` renders `CombatantCard` via its `CombatantCardProps` contract.
- Dependencies:
  - Proposal `openspec/changes/decompose-combatant-card/proposal.md`.
  - No new npm dependencies. React 18 + Next.js app-router client component. Vitest + Testing Library.
  - GitHub issues #680 (this change) and #695 (follow-up, out of scope).
- Interfaces/contracts touched:
  - `CombatantCardProps` — **unchanged** (public contract frozen).
  - New internal contracts: `TypedDamageResult` type, `applyHpChange()` signature, `useCombatantHp()` hook API, props of each new sub-component.
  - Behavioural contract change (intentional): cross-combatant damage via `applyDamageToTarget` now applies death-save + concentration transitions to the target.

## Goals / Non-Goals

### Goals

- Reduce `lib/components/CombatantCard.tsx` to a <300-line composition layer with an unchanged `CombatantCardProps`.
- Move all HP/concentration/death-state transition orchestration into one pure, React-free, directly unit-testable function in `lib/combat/`.
- Give the typed-damage result a named, documented type instead of a comment-annotated bare object.
- Own HP-adjustment UI state (including `selectedDamageType`) in a dedicated hook.
- Extract `HpControls`, `ConditionControls`, `TargetingPanel`, `CombatantCardHeader` sub-components; relocate `DamageEffectsPanel`, `TargetCheckboxColumn`.
- Replace the `window.prompt()` self condition-add flow with a real modal.
- Fix the latent bug where cross-combatant damage skips death-save/concentration handling.
- Keep every existing `CombatantCard.*.test.tsx` and `combat/hpHistory.test.ts` suite green unchanged; add pure unit + hook tests underneath.

### Non-Goals

- No change to HP math, death-save rules, concentration DC formula, or effects-panel presets.
- No legendary/lair action rendering (#695).
- No rewrite of existing RTL suites.
- No changes to `ActiveCombatView`, `useCombat`, combat API, persistence, or SSE.
- No new global state / context for the card.
- No visual redesign.

## Decisions

### Decision 1: Pure orchestrator `lib/combat/applyHpChange.ts`

- Chosen: A single pure function:
  ```ts
  // lib/combat/applyHpChange.ts
  export interface HpChangeIntent {
    kind: 'damage' | 'heal' | 'setTemp';
    amount: number;              // positive integer, pre-validated by caller
    damageType: DamageType | ''; // only meaningful for kind === 'damage'
  }
  export interface HpChangeResult {
    updates: Partial<CombatantState>;      // hp/tempHp + concentration + death-state, merged
    history?: Omit<HpHistoryEntry, never>; // entry the caller must pushHpHistory(); absent when nothing changed
    conSaveRequired?: number;              // DC the caller must surface via onConSaveRequired
  }
  export function applyHpChange(
    combatant: CombatantState,
    intent: HpChangeIntent,
  ): HpChangeResult;
  ```
  It composes `applyTypedDamage` / `applyHealing` / `setTempHp`, `calcConSaveDC`, and the `deathSaves` module. It performs no I/O: it returns a `history` descriptor rather than calling `pushHpHistory`, and returns `conSaveRequired` rather than calling a callback. Merge-key order in `updates` matches today's `adjustHp` (`hp`, `tempHp`, ...concentration, ...deathSave) so persisted output is byte-identical for unchanged scenarios.
- Alternatives considered:
  - Keep orchestration in the component but extract only helpers — rejected: leaves the modularity finding unaddressed and the logic RTL-only-testable.
  - Put it in a hook (`useHpChange`) — rejected: forces React into pure decision logic and blocks reuse from the cross-combatant path (which acts on a different combatant, not the hook's).
  - A class / reducer — rejected: over-engineered; `Partial<CombatantState>` merge is the existing idiom (`deathSaves.ts`).
- Rationale: Mirrors the proven `deathSaves.ts` pattern. Makes the four-way braid (`typed damage / history / concentration / death-state`) a testable unit. One function serves both the self and cross-combatant paths, which is what makes the latent-bug fix cheap.
- Trade-offs: The caller must remember to act on `history` and `conSaveRequired`. Mitigated by making `useCombatantHp` the single self-path caller and a small shared helper for the target path.

### Decision 2: `useCombatantHp` hook owns HP-adjustment UI state

- Chosen:
  ```ts
  // lib/hooks/useCombatantHp.ts
  export function useCombatantHp(args: {
    combatId: string;
    combatant: CombatantState;
    onUpdate: (u: Partial<CombatantState>) => void;
    onConSaveRequired?: (dc: number) => void;
  }): {
    hpAdjustment: string;
    setHpAdjustment: (v: string) => void;
    isTempMode: boolean;
    setIsTempMode: (v: boolean) => void;
    selectedDamageType: DamageType | '';
    setSelectedDamageType: (t: DamageType | '') => void;
    canUndo: boolean;
    applyDamage: () => void;
    applyHeal: () => void;
    applySetTemp: () => void;
    undoHpChange: () => void;
  };
  ```
  Owns `hpAdjustment`, `isTempMode`, `selectedDamageType`, `historyLength`. Contains `parseHpAdjustment` (regex + `Number.isSafeInteger` + `[1, 1_000_000]` range — copied verbatim from #688). On each action: parse → `applyHpChange` → `onUpdate(result.updates)` → if `result.history` then `pushHpHistory` + refresh `historyLength` → if `result.conSaveRequired` then `onConSaveRequired?.(dc)`. `undoHpChange` calls `popHpHistory` and `onUpdate({ hp, tempHp })` (HP-only, preserving current behaviour — see Open Questions).
- Alternatives considered:
  - Leave `selectedDamageType` in the component (shared with `DamageEffectsPanel`) — rejected per requester: the hook owns it. Composition layer threads it down to both `HpControls` and `DamageEffectsPanel`.
  - Split into `useHpAdjustment` + `useHpHistory` — rejected: they share `historyLength` refresh timing; one hook keeps it coherent.
- Rationale: Removes ~120 lines and 5 closures from the component; makes the plumbing testable with `renderHook`.
- Trade-offs: `selectedDamageType` now crosses a hook boundary to reach `DamageEffectsPanel`; guarded by `CombatantCard.effects-panel.test.tsx`.

### Decision 3: `TypedDamageResult` named type; move `applyTypedDamage` to `lib/combat/`

- Chosen:
  ```ts
  // lib/combat/applyTypedDamage.ts
  export interface TypedDamageResult {
    hp: number;
    tempHp: number;
    /** Damage that actually reduced HP+tempHp, clamped to current pool (0..pool). Drives concentration CON-save DC. */
    effectiveDamage: number;
    /** Post-resistance/immunity incoming amount, independent of current HP (0 if immune). Drives death-save-while-downed rules. */
    incomingDamage: number;
  }
  export function applyTypedDamage(
    hp: number, tempHp: number, damage: number,
    damageType: DamageType | '',
    combatant: Pick<CombatantState, 'damageResistances' | 'damageImmunities' | 'damageVulnerabilities' | 'activeDamageEffects'>,
  ): TypedDamageResult;
  ```
  Body is unchanged from the current card implementation; only its home and return type are formalized.
- Alternatives considered: keep it in the card / in `lib/utils/combat.ts`. Rejected: `lib/combat/` is where composed combat semantics live now; `applyHpChange` is its main consumer.
- Rationale: The `effectiveDamage` vs `incomingDamage` distinction is domain-critical and currently survives only as a comment. A documented type makes it self-describing and testable.
- Trade-offs: One more file. Negligible.

### Decision 4: `lib/components/combatant-card/` sub-components

- Chosen: New directory with:
  - `CombatantCardHeader.tsx` — name + life-state badge + detail/remove/next-turn buttons + AC + HP readout + legendary badge + initiative block.
  - `HpControls.tsx` — HP-adjustment `<input>`, damage-type `<select>`, Damage / Heal / Set Temp / Undo buttons, Temp checkbox, health bar. Props: values + callbacks from `useCombatantHp` + `combatant`.
  - `ConditionControls.tsx` — conditions list, expand toggle, remove, and an "Add Condition" button that opens `ConditionFormModal`.
  - `TargetingPanel.tsx` — "Add Target(s)" button + `showTargeting` panel (two `TargetCheckboxColumn`s) + rendered targets list with hover tooltip + `TargetActionModal` wiring + `applyDamageToTarget` / `addConditionToTarget`.
  - `DamageEffectsPanel.tsx`, `TargetCheckboxColumn.tsx` — relocated as-is.
  - `ConditionFormModal.tsx` — new (Decision 5).
  `lib/components/CombatantCard.tsx` stays the public entry: it renders the header, `HpControls`, `DamageEffectsPanel`, `DeathSaveTracker` + note, concentration/CON-save badges, `ConditionControls`, `TargetingPanel`, notes.
- Alternatives considered: one flat `components/` dir (rejected: 6+ new card-only files pollute it); nested folder per component (rejected: over-structured).
- Rationale: Keeps the card-specific pieces discoverable and co-located; `CombatantCard.tsx` remains the stable import path so no call-site churn.
- Trade-offs: Import-path updates for the two relocated components; `tokensave_callers` check before moving.

### Decision 5: Dedicated `ConditionFormModal` replaces `window.prompt()`

- Chosen: New `lib/components/combatant-card/ConditionFormModal.tsx` — a small modal (name text input + optional duration-in-rounds number input + Add/Cancel), styled and structured after `TargetActionModal` (same overlay, focus behaviour, `data-testid` conventions). Validation matches #688: trimmed name, `<= 100` chars, duration digits-only `[1, 10_000]`. `ConditionControls` owns its open/close state and calls `onUpdate({ conditions: [...combatant.conditions, newCondition] })`.
- Alternatives considered: extend `TargetActionModal` with a "self" mode (no target). Rejected (design's call, absent requester override): couples two flows and complicates `TargetActionModal`'s props; a dedicated ~60-line component is cleaner. If the requester prefers the shared approach, this decision and the specs update accordingly (change-control).
- Rationale: Removes the last `window.prompt()` in combat UI; testable, accessible, consistent with the cross-combatant flow.
- Trade-offs: Minor duplication of modal shell with `TargetActionModal`; acceptable, and a future consolidation is possible.

### Decision 6: Route cross-combatant damage through `applyHpChange` (latent-bug fix)

- Chosen: `TargetingPanel`'s `applyDamageToTarget(damage, damageType)` builds `applyHpChange(target, { kind: 'damage', amount: damage, damageType })`, calls `onUpdateCombatant(target.id, result.updates)`, and `pushHpHistory(combatId, target.id, result.history)` when present. Concentration CON-save surfacing for a *target* is out of scope (no per-target callback exists) — only the state updates (`pendingConSaveDC`, cleared `concentratingOn`, death-state) are applied, matching what persistence needs. This is captured as a MODIFIED requirement with scenarios in specs.
- Alternatives considered: leave the target path untouched (rejected per requester: fix the latent bug); add a full `onConSaveRequired`-per-target callback (rejected: prop-surface creep, out of scope, `CombatantCardProps` frozen).
- Rationale: Single orchestrator means the self and target damage paths cannot silently diverge again.
- Trade-offs: Behaviour change — a downed target now accrues death-save failures / instant-death from another combatant's attack; a concentrating target dropped to 0 loses concentration. Must be grep-checked against existing target-damage tests and called out in the PR.

### Decision 7: Dead `LegendaryActionsPanel` / `LairActionsSlot` imports

- Chosen: Remove the two unused imports from `CombatantCard.tsx` as a mechanical cleanup. #695 will re-add them when the panels are actually rendered.
- Alternatives considered: keep them (rejected: lint noise, misleads readers); wire them now (rejected: that is #695, scope creep).
- Rationale: The refactor should leave the file honest about its dependencies.
- Trade-offs: #695 re-adds an import line — trivial.

## Proposal to Design Mapping

- Proposal element: Extract pure HP/concentration/death-state orchestrator
  - Design decision: Decision 1 (`applyHpChange.ts`)
  - Validation approach: `lib/combat/applyHpChange.test.ts` matrix (kind × life-state × concentration × resistance); existing combat RTL suites stay green.
- Proposal element: Named type for `effectiveDamage` vs `incomingDamage`
  - Design decision: Decision 3 (`TypedDamageResult`)
  - Validation approach: `lib/combat/applyTypedDamage.test.ts`; `tsc` type-check.
- Proposal element: `useCombatantHp` hook owns HP UI state incl. `selectedDamageType`
  - Design decision: Decision 2
  - Validation approach: `tests/unit/hooks/useCombatantHp.test.ts` (`renderHook`); `CombatantCard.hp.test.tsx` + `.effects-panel.test.tsx` unchanged and green.
- Proposal element: Extract `HpControls` / `ConditionControls` / `TargetingPanel` / `CombatantCardHeader`; relocate `DamageEffectsPanel` / `TargetCheckboxColumn`
  - Design decision: Decision 4
  - Validation approach: `wc -l lib/components/CombatantCard.tsx` < 300; full `CombatantCard.*.test.tsx` suite green; build passes.
- Proposal element: Replace `window.prompt()` self condition-add with a real modal
  - Design decision: Decision 5 (`ConditionFormModal`)
  - Validation approach: new modal component test; `CombatantCard.*` suite green (no `prompt` mock needed for that path anymore).
- Proposal element: Fix cross-combatant damage skipping death-save/concentration
  - Design decision: Decision 6
  - Validation approach: MODIFIED spec requirement + scenarios; new tests for `applyDamageToTarget` covering downed + concentrating targets; grep existing target tests first.
- Proposal element: `CombatantCardProps` unchanged; <300-line composition layer
  - Design decision: Decisions 4, 7
  - Validation approach: diff of `CombatantCard.tsx` exports; `ActiveCombatView` untouched; build + line count.
- Proposal element: Legendary/lair wiring out of scope
  - Design decision: Decision 7 (remove dead imports) + #695
  - Validation approach: grep confirms no `LegendaryActionsPanel` / `LairActionsSlot` reference remains in `CombatantCard.tsx`.

## Functional Requirements Mapping

- Requirement: Damaging/healing a combatant produces the same persisted `Partial<CombatantState>` as today (HP, tempHp, concentration clears, `pendingConSaveDC`, death-state).
  - Design element: Decision 1 (`applyHpChange`), Decision 2 (hook plumbing)
  - Acceptance criteria reference: specs `combat-hp-orchestration` — "Damage on an active combatant", "Damage to 0 HP enters dying", "Damage while downed applies death-save rules", "Immune damage while downed is inert", "Healing a downed combatant clears death state", "Damage on a concentrating combatant surfaces CON save".
  - Testability notes: Pure function — assert full `HpChangeResult` for each row. Cross-checked by unchanged `CombatantCard.hp.test.tsx`, `.concentration.test.tsx`, `.deathSaves.test.tsx`.
- Requirement: HP-history entries are pushed for the same state transitions and in the same shape as today.
  - Design element: Decision 1 (`history` descriptor), Decision 2 (hook calls `pushHpHistory`)
  - Acceptance criteria reference: specs `combat-hp-orchestration` — "HP history recorded on effective change", "No history entry when value unchanged".
  - Testability notes: Assert `result.history` presence/absence and fields; `combat/hpHistory.test.ts` unchanged.
- Requirement: HP-adjustment input only accepts a plain positive integer in `[1, 1_000_000]`.
  - Design element: Decision 2 (`parseHpAdjustment` moved verbatim into hook)
  - Acceptance criteria reference: specs `combat-hp-orchestration` — "Rejects non-integer / out-of-range HP input".
  - Testability notes: `renderHook` + call `applyDamage` with bad `hpAdjustment`; assert no `onUpdate`.
- Requirement: Undo restores previous `hp`/`tempHp` only (documented limitation: does not revert life-state).
  - Design element: Decision 2 (`undoHpChange`)
  - Acceptance criteria reference: specs `combat-hp-orchestration` — "Undo restores HP and tempHp".
  - Testability notes: hook test; `CombatantCard.hp.test.tsx` undo cases unchanged.
- Requirement: Adding a condition to the current combatant uses a modal (name + optional duration), not `window.prompt`.
  - Design element: Decision 5 (`ConditionFormModal`), Decision 4 (`ConditionControls`)
  - Acceptance criteria reference: specs `combat-condition-controls` — "Add Condition opens modal", "Submitting adds a validated condition", "Invalid name/duration is rejected", "Cancel adds nothing".
  - Testability notes: RTL on the new component + `ConditionControls`; assert `onUpdate` payload.
- Requirement: Cross-combatant damage applies death-save and concentration state transitions to the target, consistent with the self path.
  - Design element: Decision 6
  - Acceptance criteria reference: specs `combat-targeting-actions` — MODIFIED "Applying damage to a downed target adds a death-save failure", MODIFIED "Damaging a concentrating target to 0 clears its concentration", "Target HP history recorded".
  - Testability notes: New tests driving `applyDamageToTarget` via `TargetActionModal`; assert `onUpdateCombatant` payload includes death-save/concentration keys.
- Requirement: `selectedDamageType` chosen in HP controls still drives `DamageEffectsPanel`'s "Custom" buttons.
  - Design element: Decision 2 + Decision 4 (composition layer threads it to both children)
  - Acceptance criteria reference: specs `combat-hp-orchestration` — "Selected damage type is shared with the effects panel".
  - Testability notes: `CombatantCard.effects-panel.test.tsx` unchanged and green.
- Requirement: `CombatantCardProps` and the `CombatantCard` import path are unchanged.
  - Design element: Decisions 4, 7
  - Acceptance criteria reference: specs `combat-combatant-card` — "Public props contract unchanged", "Composition layer under 300 lines".
  - Testability notes: `tsc`; `wc -l`; `ActiveCombatView` diff empty; `CombatantCard.callbacks.test.tsx` + `.badges.test.tsx` unchanged.

## Non-Functional Requirements Mapping

- Requirement category: operability / maintainability
  - Requirement: `lib/components/CombatantCard.tsx` is < 300 lines and no single new module exceeds the project Standard size limit.
  - Design element: Decisions 1-5 (extraction)
  - Acceptance criteria reference: specs `combat-combatant-card` NFAC — "Composition layer under 300 lines"; Verity gate passes without new comprehensibility/modularity findings on the card.
  - Testability notes: `wc -l`; `verity` pre-push gate; Codacy.
- Requirement category: reliability
  - Requirement: No regression — all pre-existing combat test suites pass unchanged.
  - Design element: whole design (behaviour-preserving except Decisions 5 UX and 6 latent-bug fix)
  - Acceptance criteria reference: specs NFAC — "Existing combat suites unchanged and green".
  - Testability notes: `npm test` scoped to combat; CI `ci-gate`.
- Requirement category: security
  - Requirement: User-entered HP and condition values remain validated before reaching persisted state (no weakening of #688 guards).
  - Design element: Decisions 2, 5 (validation moved verbatim)
  - Acceptance criteria reference: See functional scenarios "Rejects non-integer / out-of-range HP input" and "Invalid name/duration is rejected" — not duplicated here.
  - Testability notes: unit tests on parser + modal validation.
- Requirement category: performance
  - Requirement: No additional renders per keystroke or per HP action beyond today's.
  - Design element: Decision 2 (state lives in one hook; children receive stable callbacks)
  - Acceptance criteria reference: specs NFAC — "No extra re-render on HP input".
  - Testability notes: manual `run` smoke; optional render-count assertion in hook test; not a CI gate.

## Risks / Trade-offs

- Risk/trade-off: Behaviour drift in the merged `updates` object from `adjustHp` extraction.
  - Impact: Wrong persisted combat state after damage/heal.
  - Mitigation: Write `applyHpChange` tests against current observed behaviour before deleting `adjustHp`; preserve merge-key order; run all combat RTL suites.
- Risk/trade-off: The Decision 6 latent-bug fix breaks a test that assumed the old (buggy) behaviour.
  - Impact: Red suite; possible user-visible change to target damage.
  - Mitigation: `grep -rn "applyDamageToTarget\|onUpdateCombatant" tests/` first; encode as MODIFIED spec requirement; call out in PR body and `.verity` memory.
- Risk/trade-off: Moving `selectedDamageType` into the hook desyncs it from `DamageEffectsPanel`.
  - Impact: Custom effect buttons ignore the chosen type.
  - Mitigation: Composition layer passes it to both children; `effects-panel` suite guards.
- Risk/trade-off: Relocating `DamageEffectsPanel` / `TargetCheckboxColumn` breaks imports.
  - Impact: Build failure.
  - Mitigation: `tokensave_callers` per symbol; keep `CombatantCard.tsx` as public entry.
- Risk/trade-off: `ConditionFormModal` changes DOM enough to break card RTL queries.
  - Impact: Red suite.
  - Mitigation: Mirror `TargetActionModal` structure and `data-testid`s; run full card suite.
- Risk/trade-off: Scope creep into #695.
  - Impact: Larger, riskier PR.
  - Mitigation: Decision 7 limits card changes to removing imports; enforced in review.

## Rollback / Mitigation

- Rollback trigger: A combat regression found post-merge that cannot be hot-fixed within one iteration (wrong HP/lifeState persisted, targeting broken, card crash).
- Rollback steps: `git revert` the squash-merge commit on `main` via a revert PR; the change is a self-contained refactor with no data/schema/API surface, so revert is clean. Re-open #680.
- Data migration considerations: None. No persisted schema, storage-key, or API-contract changes. `CombatantState` shape is unchanged; `hpHistory` localStorage keys unchanged.
- Verification after rollback: `npm test` (combat scope) green on the reverted `main`; `run` smoke of an active combat: damage, heal, undo, add condition, target + apply damage.

## Operational Blocking Policy

- If CI checks fail (`ci-gate`, Codacy): treat as blocking. Diagnose from logs, fix in the worktree, commit, push, re-run. Never waive Verity findings on agent judgement (project rule); only `verity waive` to relay a human-accepted risk with a cited source.
- If security checks fail: blocking. This change adds no network/auth/secret surface; a finding is most likely a false positive on moved code — use `verity feedback finding <run-id> <pattern-id> false_positive` rather than a waive, and note it in the PR.
- If required reviews are blocked/stale: run `pr-review-toolkit:review-pr`, address every finding, commit, push, re-review until zero findings, then enable `gh pr merge --auto --squash`. If the review stalls after 3+ fix-review iterations with no progress, stop and report the remaining findings to the requester.
- Escalation path and timeout: If blocked > ~30 min of wall time with no forward progress (CI flake, infra, ambiguous finding), summarize state and remaining blockers to the requester (Doug) and wait for guidance. Do not force-merge; do not bypass branch protection.

## Open Questions

- Should `undoHpChange` also revert `lifeState` / `deathSaves` / concentration, or keep today's HP-only behaviour? Default: keep HP-only, document as a known limitation. (Not a blocker for apply.)
- Dedicated `ConditionFormModal` vs extending `TargetActionModal` with a self mode? Default: dedicated component. (Not a blocker; change-control if reversed.)
- Hook test location: `tests/unit/hooks/` (matches `useCombat.test.ts`) vs co-located. Default: `tests/unit/hooks/`. (Not a blocker.)
