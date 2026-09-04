## GitHub Issues

- #680
- #695 (follow-up spun out of this proposal; out of scope here)

## Why

- Problem statement: `lib/components/CombatantCard.tsx` is ~883 lines on `main` (grew a further 124 lines after the death-saving-throws feature, #688). It mixes at least seven responsibilities in one component: HP adjustment controls, the damage-type/effects panel, condition add/remove, the targeting panel, cross-combatant actions, death-save wiring, and HP/concentration/death-state transition orchestration. Verity flagged it during #92 / #688 with a MEDIUM comprehensibility finding (exceeds Standard size limits) and a MEDIUM modularity finding (HP/death-state transition logic coupled to the presentation component).
- Why now: The file just crossed a threshold where every new combat feature (legendary/lair wiring in #695, future status-effect work) makes the single `adjustHp` orchestration knot harder to change safely. The death-save feature already established the `lib/combat/` pure-domain-module pattern (`deathSaves.ts`, `conditionExpiry.ts`), so the target architecture is proven and the extraction is low-risk.
- Business/user impact: No user-visible behaviour change intended (with two deliberate exceptions below). The payoff is maintainability: pure, directly unit-testable domain logic; sub-300-line components; and a clear seam for the next combat features.

## Problem Space

- Current behavior:
  - `CombatantCard()` is a single ~650-line function component with 9 `useState` hooks plus a `useMemo`, a 380-line JSX return, and inline helper closures (`adjustHp`, `applyDamage`, `applyHeal`, `applySetTemp`, `undoHpChange`, `addCondition`, `removeCondition`, `applyDamageToTarget`, `addConditionToTarget`, `handleDeathSaveToggle`, `handleDeathSaveRoll`, `parseHpAdjustment`).
  - `adjustHp` braids four concerns that each have (or should have) a separate home: typed-damage calculation, HP-history side effects (`pushHpHistory` + `setHistoryLength`), concentration rules (`calcConSaveDC`, `onConSaveRequired`, `pendingConSaveDC`/`concentratingOn` clearing — all inline, no module), and death-state transitions (delegates to `lib/combat/deathSaves.ts` for the *logic*, but the *decision of when to call each function* is inline).
  - `applyTypedDamage` (module scope in the card) returns `{ hp, tempHp, effectiveDamage, incomingDamage }` — a bare object where `#688` bolted on `incomingDamage` with an explanatory comment distinguishing it from `effectiveDamage` (post-resistance-vs-HP-clamped). The distinction is real domain semantics carried only by a comment.
  - `addCondition` (self) uses two `window.prompt()` calls with hand-rolled validation. The cross-combatant equivalent already uses a real component, `TargetActionModal`.
  - `applyDamageToTarget` applies typed damage to another combatant and pushes *their* HP history, but does **not** run death-save or concentration orchestration on the target. Damaging a downed PC via another combatant's target list silently skips their death-save failure / instant-death check, and dropping a concentrating target to 0 via targeting does not clear their concentration. This diverges from the self `adjustHp` path.
  - `LegendaryActionsPanel` and `LairActionsSlot` are imported (lines 8-9) but never rendered; only a passive `⚡ N/M` badge exists.
- Desired behavior:
  - HP + concentration + death-state transitions computed by one pure function (`lib/combat/applyHpChange.ts`) that takes the combatant and a damage/heal intent and returns a single merged `Partial<CombatantState>` update plus optional side-effect descriptors (history entry to persist, CON-save DC to surface). No React, no storage calls inside it.
  - A `useCombatantHp` hook owns HP-adjustment UI state (`hpAdjustment` string + parsing, `isTempMode`, `selectedDamageType`, `historyLength`) and performs the `pushHpHistory` / `onConSaveRequired` plumbing around `applyHpChange`.
  - `CombatantCard` becomes a <300-line composition layer rendering extracted sub-components: `CombatantCardHeader`, `HpControls`, `ConditionControls`, `TargetingPanel` (owning the `showTargeting` panel, targets list, and `TargetActionModal` wiring). `DamageEffectsPanel` and `TargetCheckboxColumn` (already extracted) move into the new `lib/components/combatant-card/` directory.
  - The damage-calc result gets a named type (`TypedDamageResult`) with documented `effectiveDamage` vs `incomingDamage` fields.
  - Self condition-add uses a real modal component instead of `window.prompt()`.
  - Cross-combatant damage (`applyDamageToTarget`) routes through the same `applyHpChange` orchestrator so downed/concentrating targets are handled consistently with the self path.
- Constraints:
  - No behaviour change to the HP math, death-save rules, concentration DC calc, or effects-panel behaviour. The two intentional exceptions: (a) self condition-add UX moves from `prompt()` to a modal; (b) cross-combatant damage gains the death-save/concentration handling it currently lacks (latent-bug fix).
  - All existing `CombatantCard.*.test.tsx` RTL suites and `combat/hpHistory.test.ts` must stay green **as written** (no rewriting them to match new internals). New pure unit tests are added underneath.
  - Follow project MCP-tooling and `.wolf` / `.verity` conventions. Work happens in the `.worktrees/decompose-combatant-card` worktree on the `decompose-combatant-card` branch.
  - `main` is a squash-only ruleset; PR must merge via `--squash`, `ci-gate` + Codacy required.
- Assumptions:
  - `lib/combat/` is the correct home for the new pure orchestrator (consistent with `deathSaves.ts`, `conditionExpiry.ts`).
  - `lib/components/combatant-card/` is an acceptable new directory for the card's sub-components; the barrel export stays `lib/components/CombatantCard.tsx`.
  - The `CombatantCardProps` public interface does not change (same props, same callbacks) so no call-site churn in `ActiveCombatView`.
  - `rollDie` stays injected at the component edge (`handleDeathSaveRoll`) so the orchestrator stays deterministic/pure.
- Edge cases considered:
  - Damage fully mitigated by immunity (effectiveDamage 0) while downed — must not add a death-save failure or trigger instant death; `incomingDamage` semantics preserved.
  - Healing a downed combatant back to >=1 HP clears death state (existing `clearDeathState` path).
  - `resultHp === 0` with no prior `lifeState` and effective damage > 0 → `enterDying()`.
  - Concentration + 0 HP → clear `concentratingOn` and `pendingConSaveDC`.
  - Undo HP change (`popHpHistory`) — does it need to also revert death-state? Current code does not; preserving that (see Open Questions).
  - Target that is a `lair` type or already `dead` — orchestrator must no-op death saves for non-`usesDeathSaves` combatants (already handled by `usesDeathSaves`).
  - `selectedDamageType` shared between HP controls and `DamageEffectsPanel` "Custom" buttons — the hook owns it; the effects panel receives it via props from the composition layer.

## Scope

### In Scope

- Extract `lib/combat/applyHpChange.ts`: pure HP/concentration/death-state orchestrator returning one merged update object + side-effect descriptors.
- Move `applyTypedDamage` into `lib/combat/` and give its result a named, documented type (`TypedDamageResult` with `effectiveDamage` / `incomingDamage`).
- Add `lib/hooks/useCombatantHp.ts` owning HP-adjustment UI state (including `selectedDamageType`) and the history/CON-save plumbing.
- Create `lib/components/combatant-card/` and extract `CombatantCardHeader`, `HpControls`, `ConditionControls`, `TargetingPanel`; relocate `DamageEffectsPanel` and `TargetCheckboxColumn` there.
- Replace the self `addCondition` `window.prompt()` flow with a real modal component (`ConditionFormModal` or a generalization of the existing `TargetActionModal` condition mode — decided in design).
- Route `applyDamageToTarget` through `applyHpChange` so cross-combatant damage applies death-save and concentration handling consistently (latent-bug fix).
- Reduce `CombatantCard.tsx` to a <300-line composition layer with the unchanged `CombatantCardProps` interface.
- Add pure unit tests for `applyHpChange` and `applyTypedDamage`/`TypedDamageResult`, and hook tests for `useCombatantHp`.
- Keep every existing RTL suite green unchanged.
- Update `.wolf/anatomy.md`, `.wolf/memory.md`, `.wolf/cerebrum.md`, and `.verity/memory/` as required by project conventions.

### Out of Scope

- Wiring `LegendaryActionsPanel` / `LairActionsSlot` into the card — tracked in #695.
- Any change to the death-save rules, HP math, concentration DC formula, effects-panel presets, or targeting selection logic.
- Rewriting or restructuring the existing `CombatantCard.*.test.tsx` suites.
- Changes to `ActiveCombatView`, `useCombat`, or combat persistence/API.
- Replacing the effects-panel or targeting-panel UX.
- Migrating `TargetActionModal`'s own `alert()` calls.

## What Changes

- New file `lib/combat/applyHpChange.ts` (pure orchestrator) + `lib/combat/applyHpChange.test.ts`.
- `applyTypedDamage` relocated from `CombatantCard.tsx` to `lib/combat/` with an exported `TypedDamageResult` type; `lib/combat/applyTypedDamage.test.ts` added.
- New file `lib/hooks/useCombatantHp.ts` + `lib/hooks/useCombatantHp.test.ts` (or `tests/unit/hooks/`).
- New directory `lib/components/combatant-card/` containing `CombatantCardHeader.tsx`, `HpControls.tsx`, `ConditionControls.tsx`, `TargetingPanel.tsx`, `DamageEffectsPanel.tsx`, `TargetCheckboxColumn.tsx`, and a condition modal component.
- `lib/components/CombatantCard.tsx` shrinks to a composition layer (<300 lines); `CombatantCardProps` unchanged.
- `applyDamageToTarget` behaviour: now also emits death-save/concentration updates for the target.
- Self condition-add: `window.prompt()` calls removed, replaced by modal.
- New/updated tests as listed; existing RTL suites untouched.
- `.wolf/*` and `.verity/memory/*` documentation updated.

## Risks

- Risk: Extracting `adjustHp` changes subtle ordering of merged updates (concentration vs death-state keys) and produces a different `Partial<CombatantState>`.
  - Impact: Wrong HP / lifeState / concentration persisted after damage; regressions the RTL suites might not fully cover.
  - Mitigation: `applyHpChange` gets a comprehensive pure test matrix (damage/heal/temp × downed/active/concentrating × immune/normal) written against the *current* observed behaviour before refactoring the component; keep the existing merge key order; run all combat RTL suites.
- Risk: The latent-bug fix (cross-combatant death-save/concentration handling) is a real behaviour change that could surprise users or break a test that assumed the old behaviour.
  - Impact: A downed target now accrues death-save failures from another combatant's attack; a test asserting "no lifeState change on target damage" would fail.
  - Mitigation: Grep the target-damage tests first; call the change out explicitly in specs as a MODIFIED requirement with scenarios; note in PR description and `.verity` memory.
- Risk: `selectedDamageType` ownership moving into `useCombatantHp` breaks the coupling with `DamageEffectsPanel`'s "Custom" buttons.
  - Impact: Custom effect buttons stop reflecting the chosen damage type.
  - Mitigation: Composition layer passes `selectedDamageType` from the hook down to both `HpControls` and `DamageEffectsPanel`; effects-panel test (`CombatantCard.effects-panel.test.tsx`) guards it.
- Risk: New `lib/components/combatant-card/` directory + moved files break imports elsewhere.
  - Impact: Build failure.
  - Mitigation: `tokensave_callers` / grep on each moved symbol before moving; keep `CombatantCard.tsx` as the stable public entry point.
- Risk: Modal replacement for `addCondition` introduces a focus-trap / a11y regression or changes the DOM enough to break `CombatantCard.*` queries.
  - Impact: RTL suite breakage, a11y finding.
  - Mitigation: Reuse the existing `TargetActionModal` structure/patterns; run the full card suite; keep `data-testid` hooks stable.
- Risk: Scope creep into #695 (legendary/lair) because the imports are right there.
  - Impact: Larger, riskier PR.
  - Mitigation: Remove or retain the dead imports only as a mechanical cleanup; no rendering work — enforced in review.

## Open Questions

- Question: Should `undoHpChange` (`popHpHistory`) also revert `lifeState` / `deathSaves` / concentration, or keep today's behaviour where undo only restores `hp`/`tempHp`?
  - Needed from: requester (Doug)
  - Blocker for apply: no — default is to preserve current behaviour (undo restores HP only) and note it as a known limitation.
- Question: For the self condition modal — build a dedicated `ConditionFormModal`, or extend `TargetActionModal` to accept an optional "self" mode (no target, condition-only)?
  - Needed from: requester (Doug); otherwise design.md will choose a dedicated `ConditionFormModal` for a cleaner separation.
  - Blocker for apply: no.
- Question: Preferred location for hook tests — `lib/hooks/*.test.ts` co-located, or `tests/unit/hooks/` (where `useCombat.test.ts` already lives)?
  - Needed from: requester (Doug); default `tests/unit/hooks/` to match the existing convention.
  - Blocker for apply: no.

## Non-Goals

- Not improving or redesigning the combat UI visually.
- Not changing combat state persistence, the combat API, or SSE event flow.
- Not adding legendary/lair action controls (#695).
- Not touching non-`CombatantCard` combat components.
- Not introducing a state-management library or context for the card.
- Not achieving 100% coverage on the card — only adding pure tests for the newly extracted logic.

## Change Control

If scope changes after proposal approval, update `openspec/changes/decompose-combatant-card/proposal.md`,
`openspec/changes/decompose-combatant-card/design.md`,
`openspec/changes/decompose-combatant-card/specs/**/*.md`, and
`openspec/changes/decompose-combatant-card/tasks.md` before implementation starts.
