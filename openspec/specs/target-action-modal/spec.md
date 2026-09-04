# Capability: TargetActionModal Test Migration

Covers `tests/unit/components/TargetActionModal.test.tsx` — migration to RTL. This file becomes the canonical RTL pattern reference for the project after migration.

## ADDED Requirements

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

### Requirement: MODIFIED TargetActionModal.test.tsx uses RTL APIs exclusively

The system SHALL test `TargetActionModal` using `@testing-library/react` and `@testing-library/user-event`, with no `createRoot`, `Root`, `act`, `findButton()`, `changeInputValue()`, or `IS_REACT_ACT_ENVIRONMENT`.

#### Scenario: Initial screen renders target info and action buttons

- **Given** `TargetActionModal` is rendered with a target (name="Goblin Target", hp=7, maxHp=7, ac=13)
- **When** the component mounts
- **Then** `screen.getByText('Goblin Target')` is in the document
- **Then** text containing "HP: 7/7" is visible
- **Then** text containing "AC: 13" is visible
- **Then** `screen.getByRole('button', { name: /apply damage/i })` is present
- **Then** `screen.getByRole('button', { name: /add condition/i })` is present
- **Then** `screen.getByRole('button', { name: /cancel/i })` is present

#### Scenario: Cancel button calls onClose

- **Given** `TargetActionModal` is rendered with a `onClose` mock and `userEvent.setup()`
- **When** the user clicks the Cancel button
- **Then** `onClose` has been called once

#### Scenario: Apply Damage button transitions to damage screen

- **Given** `TargetActionModal` is on the initial screen
- **When** the user clicks "Apply Damage"
- **Then** the initial action buttons are no longer in the document
- **Then** `screen.getByPlaceholderText('Damage amount')` is present (number input)
- **Then** `screen.getByRole('combobox', { name: /damage type/i })` is present

#### Scenario: Damage flow submits correct values to onApplyDamage

- **Given** the modal is in damage mode with `userEvent.setup()`
- **When** the user types "5" into the damage amount input
- **And** the user selects "fire" from the damage type combobox
- **Then** the Apply button label updates to include "(fire)"
- **When** the user clicks the Apply button
- **Then** `onApplyDamage` has been called with `(5, 'fire')`

#### Scenario: Damage flow with no type selected submits empty string type

- **Given** the modal is in damage mode with `userEvent.setup()`
- **When** the user types "3" into the damage amount input and does not change the damage type
- **And** clicks the Apply button (label is just "Apply")
- **Then** `onApplyDamage` has been called with `(3, '')`

#### Scenario: Add Condition button transitions to condition screen

- **Given** `TargetActionModal` is on the initial screen
- **When** the user clicks "Add Condition"
- **Then** the initial action buttons are no longer in the document
- **Then** `screen.getByPlaceholderText('Condition name')` is present
- **Then** `screen.getByPlaceholderText('Duration in rounds (optional)')` is present

#### Scenario: Condition flow submits correct values to onAddCondition

- **Given** the modal is in condition mode with `userEvent.setup()`
- **When** the user types "Stunned" into the condition name input
- **And** the user types "3" into the duration input
- **And** clicks the Add button
- **Then** `onAddCondition` has been called with `('Stunned', 3)`

#### Scenario: Condition flow with no duration calls onAddCondition with undefined duration

- **Given** the modal is in condition mode with `userEvent.setup()`
- **When** the user types "Blinded" into the condition name input and leaves duration empty
- **And** clicks the Add button
- **Then** `onAddCondition` has been called with `('Blinded', undefined)`

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

### Requirement: REMOVED custom `findButton()` helper

Reason for removal: Replaced by `screen.getByRole('button', { name: /.../ })`.

### Requirement: REMOVED custom `changeInputValue()` native-setter hack

Reason for removal: Replaced by `await userEvent.type()` and `await userEvent.selectOptions()`.

### Requirement: REMOVED Direct `applyTypedDamage` call in the cross-combatant damage path

Reason for removal: `applyDamageToTarget` previously called `applyTypedDamage`
directly and applied only `hp`/`tempHp` to the target, silently skipping the
death-save and concentration handling that the self path performs. That path now
delegates to `applyHpChange`, closing the divergence.

## Traceability

- Proposal: "Migrate TargetActionModal.test.tsx; becomes canonical RTL reference" → Requirement above
- Design decision 2 (`userEvent.setup()` per test) → All interaction scenarios
- Design decision 4 (query strategy: `getByRole`, `getByPlaceholderText`, `getByRole('combobox')`) → All scenarios
- Requirement → Task: "Migrate TargetActionModal.test.tsx"
- Proposal element "Route applyDamageToTarget through applyHpChange (latent-bug fix)" -> Requirement: MODIFIED Applying damage to a target routes through the shared HP orchestrator; Requirement: REMOVED Direct `applyTypedDamage` call in the cross-combatant damage path
- Proposal element "Extract ... TargetingPanel" -> Requirement: ADDED Targeting panel extracted to `TargetingPanel`
- Design Decision 4 -> Requirement: ADDED Targeting panel extracted to `TargetingPanel`
- Design Decision 6 -> Requirement: MODIFIED Applying damage to a target routes through the shared HP orchestrator; Requirement: REMOVED Direct `applyTypedDamage` call in the cross-combatant damage path
- Requirement: ADDED Targeting panel extracted to `TargetingPanel` -> Task: "Extract `TargetingPanel.tsx`"
- Requirement: MODIFIED Applying damage to a target routes through the shared HP orchestrator -> Tasks: "Route `applyDamageToTarget` through `applyHpChange`", "Add cross-combatant damage tests (downed / concentrating / immune / history)", "Grep existing target-damage tests for assumptions before changing behaviour"
- Requirement: REMOVED Direct `applyTypedDamage` call in the cross-combatant damage path -> Task: "Route `applyDamageToTarget` through `applyHpChange`"

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: No banned legacy imports remain

- **Given** `TargetActionModal.test.tsx` has been migrated
- **When** `grep -E "createRoot|IS_REACT_ACT_ENVIRONMENT|findButton|changeInputValue" tests/unit/components/TargetActionModal.test.tsx` is run
- **Then** the output is empty

#### Scenario: File serves as RTL pattern reference

- **Given** the file uses `userEvent.setup()` per test, `screen.*` queries, and `await user.*` interactions
- **When** a contributor reads the file to understand how to write RTL component tests
- **Then** all patterns are self-consistent and represent current project conventions

### Requirement: Reliability

#### Scenario: Existing targeting and target-action-modal suites still pass or are updated only for the intended behaviour change

- **Given** the pre-existing tests that exercise `applyDamageToTarget` / `TargetActionModal`
- **When** the refactor is complete
- **Then** any test that fails does so only because it asserted the previous (buggy) "no life-state/concentration change on target damage" behaviour, and each such failure is fixed by updating that assertion to the new intended behaviour, with the change noted in the PR description

### Requirement: Security

See functional scenarios in `combatant-card-decomposition` ("Invalid condition input is rejected") and `combat-hp-orchestration` ("Non-integer input is rejected"). The cross-combatant path reuses `TargetActionModal`'s existing damage validation; no new input surface is added.
