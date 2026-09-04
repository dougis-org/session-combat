## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Targeting panel extracted to `TargetingPanel`

The system SHALL render the "Add Target(s)" button, the target-selection panel
(two `TargetCheckboxColumn`s for Party and Enemies), the rendered target chips
with their hover tooltip, and the `TargetActionModal` wiring from a
`TargetingPanel` component. `TargetingPanel` SHALL own the `showTargeting`,
`selectedTargetId`, and `hoveredTargetId` state and receive `combatId`,
`combatant`, `allCombatants`, `onUpdate`, and `onUpdateCombatant` as props.

#### Scenario: Selecting targets updates the combatant

- **Given** a rendered `CombatantCard` with `allCombatants` provided and the targeting panel open
- **When** the user checks an enemy in the Enemies column
- **Then** `onUpdate` is called with `targetIds` including that combatant's id

#### Scenario: Clicking a target chip opens the target action modal

- **Given** a combatant with one entry in `targetIds`
- **When** the user clicks that target's chip
- **Then** `TargetActionModal` is rendered for that target

## MODIFIED Requirements

### Requirement: MODIFIED Applying damage to a target routes through the shared HP orchestrator

The system SHALL apply cross-combatant damage (from `TargetActionModal`'s damage
action) to the target through the same `applyHpChange` orchestrator used for the
current combatant, so that a target's life-state and concentration transitions
are handled consistently with the self path. The resulting
`Partial<CombatantState>` SHALL be passed to `onUpdateCombatant(targetId, ...)`
and, when the orchestrator returns a history descriptor, an HP-history entry
SHALL be pushed for the target. Surfacing a CON-save prompt for a *target*
remains out of scope (no per-target callback exists); only the state keys are
applied.

#### Scenario: Applying damage to a downed target adds a death-save failure

- **Given** a target player combatant with `lifeState: 'dying'`, `deathSaves: { successes: 0, failures: 0 }`
- **And** a `CombatantCard` for another combatant that targets it, with `onUpdateCombatant` provided
- **When** the user opens the target action modal and applies 5 untyped damage (non-critical, below the target's `maxHp`)
- **Then** `onUpdateCombatant` is called with the target id and an update that adds one death-save failure (matching `applyDamageWhileDowned(target, { critical: false, damage: 5 })`)

#### Scenario: Damaging a concentrating target to 0 clears its concentration

- **Given** a target combatant with `hp` 4, `concentratingOn: 'Haste'`, not downed
- **When** the user applies 10 untyped damage to it via the target action modal
- **Then** `onUpdateCombatant` is called with the target id and an update containing `hp: 0`, `concentratingOn: undefined`, and `pendingConSaveDC: undefined`

#### Scenario: Damaging a concentrating target above 0 records a pending CON save on the target

- **Given** a target combatant with `hp` 30, `concentratingOn: 'Haste'`
- **When** the user applies 12 untyped damage to it via the target action modal
- **Then** `onUpdateCombatant` is called with the target id and an update containing `pendingConSaveDC` equal to `calcConSaveDC(12)`
- **And** no `onConSaveRequired` callback is invoked for the target

#### Scenario: Target HP history is recorded on an effective change

- **Given** a target combatant with `hp` 10 that is not immune to the applied damage
- **When** the user applies 4 untyped damage to it via the target action modal
- **Then** an HP-history entry for `combatId` + target id is pushed with `type: 'damage'`, `amount: 4`, `hp: 10`

#### Scenario: Immune target takes no damage and records no history

- **Given** a target combatant immune to `fire`
- **When** the user applies 9 `fire` damage to it via the target action modal
- **Then** `onUpdateCombatant` is called with `hp` unchanged and no HP-history entry is pushed

## REMOVED Requirements

### Requirement: REMOVED Direct `applyTypedDamage` call in the cross-combatant damage path

Reason for removal: `applyDamageToTarget` previously called `applyTypedDamage`
directly and applied only `hp`/`tempHp` to the target, silently skipping the
death-save and concentration handling that the self path performs. That path now
delegates to `applyHpChange`, closing the divergence.

## Traceability

- Proposal element "Route applyDamageToTarget through applyHpChange (latent-bug fix)" -> Requirement: MODIFIED Applying damage to a target routes through the shared HP orchestrator; Requirement: REMOVED Direct `applyTypedDamage` call in the cross-combatant damage path
- Proposal element "Extract ... TargetingPanel" -> Requirement: ADDED Targeting panel extracted to `TargetingPanel`
- Design Decision 4 -> Requirement: ADDED Targeting panel extracted to `TargetingPanel`
- Design Decision 6 -> Requirement: MODIFIED Applying damage to a target routes through the shared HP orchestrator; Requirement: REMOVED Direct `applyTypedDamage` call in the cross-combatant damage path
- Requirement: ADDED Targeting panel extracted to `TargetingPanel` -> Task: "Extract `TargetingPanel.tsx`"
- Requirement: MODIFIED Applying damage to a target routes through the shared HP orchestrator -> Tasks: "Route `applyDamageToTarget` through `applyHpChange`", "Add cross-combatant damage tests (downed / concentrating / immune / history)", "Grep existing target-damage tests for assumptions before changing behaviour"
- Requirement: REMOVED Direct `applyTypedDamage` call in the cross-combatant damage path -> Task: "Route `applyDamageToTarget` through `applyHpChange`"

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Existing targeting and target-action-modal suites still pass or are updated only for the intended behaviour change

- **Given** the pre-existing tests that exercise `applyDamageToTarget` / `TargetActionModal`
- **When** the refactor is complete
- **Then** any test that fails does so only because it asserted the previous (buggy) "no life-state/concentration change on target damage" behaviour, and each such failure is fixed by updating that assertion to the new intended behaviour, with the change noted in the PR description

### Requirement: Security

See functional scenarios in `combatant-card-decomposition` ("Invalid condition input is rejected") and `combat-hp-orchestration` ("Non-integer input is rejected"). The cross-combatant path reuses `TargetActionModal`'s existing damage validation; no new input surface is added.
