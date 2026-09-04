---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `decompose-combatant-card` change. All work follows strict TDD: write the failing test first (from the `spec.md` scenario), make it pass with the simplest code, then refactor.

**Hard constraint:** the pre-existing suites below must stay green **without being edited** — except that `TargetingPanel` target-damage assertions may be updated for the one intentional behaviour change (see Unit F / `target-action-modal` NFAC):

- `tests/unit/components/CombatantCard.hp.test.tsx`
- `tests/unit/components/CombatantCard.concentration.test.tsx`
- `tests/unit/components/CombatantCard.deathSaves.test.tsx`
- `tests/unit/components/CombatantCard.effects-panel.test.tsx`
- `tests/unit/components/CombatantCard.callbacks.test.tsx`
- `tests/unit/components/CombatantCard.badges.test.tsx`
- `tests/unit/components/ActiveCombatView.test.tsx`
- `tests/unit/combat/hpHistory.test.ts`
- `tests/unit/utils/combat.test.ts`

New test files:

- `lib/combat/applyTypedDamage.test.ts`
- `lib/combat/applyHpChange.test.ts`
- `tests/unit/hooks/useCombatantHp.test.ts`
- `tests/unit/components/combatant-card/ConditionFormModal.test.tsx`
- `tests/unit/components/combatant-card/CombatantCardHeader.test.tsx`
- `tests/unit/components/combatant-card/HpControls.test.tsx`
- `tests/unit/components/combatant-card/ConditionControls.test.tsx`
- `tests/unit/components/combatant-card/TargetingPanel.test.tsx`
- `tests/unit/components/combatant-card/TargetingPanel.targetDamage.test.tsx`

## Test Cases

### Unit A — `TypedDamageResult` + `applyTypedDamage` relocation

- [ ] `applyTypedDamage(10,0,8,'fire',immuneToFire)` returns `{ hp:10, tempHp:0, effectiveDamage:0, incomingDamage:0 }` — *spec: combat-hp-orchestration › "Typed damage against immunity"; task: Unit A*
- [ ] `applyTypedDamage(6,2,10,'',plain)` returns `hp:0, tempHp:0, effectiveDamage:8, incomingDamage:10` — *spec: combat-hp-orchestration › "Untyped damage lands in full"; task: Unit A*
- [ ] Resistance halves incoming (`incomingDamage` reflects post-resistance amount; `effectiveDamage` clamped to pool) — *spec: combat-hp-orchestration › "Named typed-damage result"; task: Unit A*
- [ ] Vulnerability doubles incoming — *spec: combat-hp-orchestration › "Named typed-damage result"; task: Unit A*
- [ ] `TypedDamageResult` is exported and `tsc` passes with the field docs — *spec: combat-hp-orchestration › "Named typed-damage result"; task: Unit A*
- [ ] No module other than `lib/combat/applyHpChange.ts` and `CombatantCard.tsx` (transitional) imports `applyTypedDamage` (grep) — *task: Unit A*

### Unit B — pure orchestrator `applyHpChange`

- [ ] Damage on active combatant → `updates.hp` reduced, no life-state/concentration keys, `history` present, `conSaveRequired` undefined — *spec: combat-hp-orchestration › "Damage on an active combatant"; task: Unit B*
- [ ] Damage to 0 HP on a fresh death-save user → `updates` includes `enterDying()` keys — *spec: "Damage to 0 HP enters dying for a death-save user"; task: Unit B*
- [ ] Damage while `lifeState:'dying'` (non-crit, below maxHp) → `updates` equals `applyDamageWhileDowned(combatant,{critical:false,damage})` — *spec: "Damage while downed applies the death-save-while-downed rules"; task: Unit B*
- [ ] `fire` damage while downed against fire immunity (incoming 0) → no added failure, not `dead` — *spec: "Fully-mitigated damage while downed is inert"; task: Unit B*
- [ ] Heal a downed combatant → `updates.hp` set and `clearDeathState()` keys present — *spec: "Healing a downed combatant clears life-state"; task: Unit B*
- [ ] Damage a concentrating combatant, hp stays > 0 → `updates.pendingConSaveDC === calcConSaveDC(effective)` and `conSaveRequired === calcConSaveDC(effective)` — *spec: "Damage on a concentrating combatant surfaces a CON save"; task: Unit B*
- [ ] Damage a concentrating combatant to 0 → `updates` has `hp:0`, `concentratingOn:undefined`, `pendingConSaveDC:undefined`, `conSaveRequired` undefined — *spec: "Dropping a concentrating combatant to 0 clears concentration"; task: Unit B*
- [ ] Damage that does not change hp/tempHp → `history` undefined — *spec: "No HP-history entry when the value does not change"; task: Unit B*
- [ ] `setTemp` with higher value → `updates.tempHp` set, `history.type==='tempHp'`; with lower/equal value → empty `updates`, no `history` — *spec: "Set temporary HP takes the higher value"; task: Unit B*
- [ ] `applyHpChange` imports no React and calls no `pushHpHistory` (static check / no side effect in test) — *design Decision 1; task: Unit B*

### Unit C — `useCombatantHp` hook

- [ ] `hpAdjustment="3.5"` + `applyDamage()` → `onUpdate` not called, field unchanged — *spec: combat-hp-orchestration › "Non-integer input is rejected"; task: Unit C*
- [ ] `hpAdjustment="9999999"` + `applyHeal()` → `onUpdate` not called — *spec: "Out-of-range input is rejected"; task: Unit C*
- [ ] `hpAdjustment="6"` + `applyDamage()` → `onUpdate` called once with orchestrator `updates`, field becomes `""` — *spec: "Valid input applies and clears the field"; task: Unit C*
- [ ] `applyHeal()` with valid value routes through `applyHpChange` heal path — *spec: combat-hp-orchestration; task: Unit C*
- [ ] `applySetTemp()` with lower-than-current value → no `onUpdate`, field cleared — *spec: "Set temporary HP takes the higher value"; task: Unit C*
- [ ] After an effective damage action, `canUndo` is true; `undoHpChange()` → `onUpdate({hp,tempHp})` only (no life-state keys) — *spec: combatant-card-decomposition › "Undo restores HP and tempHp only"; task: Unit C*
- [ ] `onConSaveRequired` is invoked with the DC when the orchestrator returns `conSaveRequired` — *spec: combat-hp-orchestration › "Damage on a concentrating combatant surfaces a CON save"; task: Unit C*
- [ ] `setSelectedDamageType('cold')` then `applyDamage()` passes `damageType:'cold'` into `applyHpChange` — *spec: "Selected damage type is shared with the effects panel"; task: Unit C*

### Unit D — `ConditionFormModal`

- [ ] Submitting name `Prone`, empty duration → `onSubmit`/`onUpdate` payload `{ name:'Prone', duration:undefined }` with generated `id`; modal closes — *spec: combatant-card-decomposition › "Submitting the modal adds a validated condition"; task: Unit D*
- [ ] Empty name → confirm is inert / no submit — *spec: "Invalid condition input is rejected"; task: Unit D*
- [ ] Name > 100 chars → rejected — *spec: "Invalid condition input is rejected"; task: Unit D*
- [ ] Duration `"abc"` or `"0"` or `"20000"` → rejected — *spec: "Invalid condition input is rejected"; task: Unit D*
- [ ] Cancel with a typed name → no submit, modal closes — *spec: "Cancelling the modal adds nothing"; task: Unit D*

### Unit E — extracted sub-components

- [ ] `CombatantCardHeader` with `lifeState:'dying'` renders the dying badge; info button → `onShowDetails(id, position)`; initiative → `onSetInitiative(id)` — *spec: combatant-card-decomposition › "Header renders life-state badge and callbacks"; task: Unit E*
- [ ] `CombatantCardHeader` renders `⚡ N/M` legendary badge when `legendaryActionCount > 0` — *spec: combatant-card-decomposition › "No dead action-panel imports remain"; task: Unit E*
- [ ] `HpControls`: enter `5`, click "Damage" → `onUpdate({hp:15})`, input cleared, "Undo HP" enabled — *spec: "Damage button applies damage through the hook"; task: Unit E*
- [ ] `HpControls`: "Undo HP" after damage → `onUpdate({hp:20, tempHp})`, no life-state key — *spec: "Undo restores HP and tempHp only"; task: Unit E*
- [ ] `ConditionControls`: click "Add Condition" → modal shown, `window.prompt` not called — *spec: "Add Condition opens a modal, not a prompt"; task: Unit E*
- [ ] `ConditionControls`: existing conditions list toggles and per-item remove calls `onUpdate` with the filtered list — *spec: combatant-card-decomposition › "Condition controls extracted to `ConditionControls`"; task: Unit E*
- [ ] `TargetingPanel`: open panel, check an enemy → `onUpdate({targetIds:[...]})` — *spec: target-action-modal › "Selecting targets updates the combatant"; task: Unit E*
- [ ] `TargetingPanel`: click a target chip → `TargetActionModal` rendered for that target — *spec: target-action-modal › "Clicking a target chip opens the target action modal"; task: Unit E*
- [ ] `lib/components/combatant-card/` contains all seven files; no external import of `DamageEffectsPanel`/`TargetCheckboxColumn` from the old path — *spec: "Sub-components live under `lib/components/combatant-card/`"; task: Unit E*

### Unit F — cross-combatant damage routes through `applyHpChange`

- [ ] Apply 5 untyped damage to a `lifeState:'dying'` target → `onUpdateCombatant(targetId, updatesAddingOneFailure)` matching `applyDamageWhileDowned` — *spec: target-action-modal › "Applying damage to a downed target adds a death-save failure"; task: Unit F*
- [ ] Apply 10 untyped damage to a concentrating target with hp 4 → `onUpdateCombatant(targetId, { hp:0, concentratingOn:undefined, pendingConSaveDC:undefined })` — *spec: "Damaging a concentrating target to 0 clears its concentration"; task: Unit F*
- [ ] Apply 12 untyped damage to a concentrating target with hp 30 → `onUpdateCombatant` update has `pendingConSaveDC === calcConSaveDC(12)`; no target CON-save callback fired — *spec: "Damaging a concentrating target above 0 records a pending CON save on the target"; task: Unit F*
- [ ] Apply 4 untyped damage to a non-immune target hp 10 → HP-history entry pushed for `combatId`+targetId (`type:'damage', amount:4, hp:10`) — *spec: "Target HP history is recorded on an effective change"; task: Unit F*
- [ ] Apply 9 `fire` damage to a fire-immune target → `onUpdateCombatant` with hp unchanged, no history entry — *spec: "Immune target takes no damage and records no history"; task: Unit F*
- [ ] Grep sweep recorded: every pre-existing test asserting old target behaviour is listed and its updated assertion noted for the PR body — *spec: target-action-modal NFAC › "Existing targeting ... suites"; task: Unit F*

### Unit G — composition layer

- [ ] `CombatantCardProps` structurally identical before/after (type-level test or snapshot of the interface) — *spec: combatant-card-decomposition › "Public props contract unchanged"; task: Unit G*
- [ ] `wc -l lib/components/CombatantCard.tsx` < 300 — *spec: "Composition layer under 300 lines"; task: Unit G*
- [ ] `grep` in `CombatantCard.tsx`: no `LegendaryActionsPanel`, no `LairActionsSlot`, no `window.prompt` — *spec: "No dead action-panel imports remain" + REMOVED `window.prompt`; task: Unit G*
- [ ] `lib/components/ActiveCombatView.tsx` unchanged and compiles — *spec: "Public props contract unchanged"; task: Unit G*
- [ ] Choosing `cold` in HP controls enables the effects-panel "resistance (cold)/immunity (cold)/vulnerability (cold)" buttons (full-card render) — *spec: combat-hp-orchestration › "Choosing a type in HP controls enables the effects-panel custom buttons"; task: Unit G*

### Regression gate

- [ ] All nine pre-existing suites listed in the Overview pass with no edits (except the allowed `TargetingPanel` target-damage assertions) — *spec: combat-hp-orchestration NFAC › "Existing combat suites unchanged and green" + combatant-card-decomposition NFAC › "Existing card suites unchanged and green"; task: "Confirm coverage"*
- [ ] `npx tsc --noEmit` clean — *task: Validation*
- [ ] `npm run build` succeeds — *task: Validation / Remote push validation*
- [ ] Verity pre-push gate reports no new MEDIUM+ comprehensibility/modularity finding on `CombatantCard.tsx` — *spec: combatant-card-decomposition NFAC › "No new Verity ... finding on the card"; task: Validation*
