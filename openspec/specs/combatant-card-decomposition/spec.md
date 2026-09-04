# combatant-card-decomposition Specification

## Purpose

Keep `lib/components/CombatantCard.tsx` a thin, sub-300-line composition
layer with no HP, damage, condition, or targeting business logic of its own.
HP/concentration/death-state orchestration lives in `lib/combat/` (see
`combat-hp-orchestration`); the card's own header, HP controls, condition
controls, and targeting panel live as focused sub-components under
`lib/components/combatant-card/`. No user-visible behaviour change is
intended beyond replacing `window.prompt`-based condition entry with a real
modal.

## Requirements

### Requirement: `CombatantCard` is a thin composition layer

The system SHALL keep `lib/components/CombatantCard.tsx` as a composition layer
under 300 lines that renders extracted sub-components and holds no HP, damage,
condition, or targeting business logic of its own. The public `CombatantCardProps`
interface and the `@/lib/components/CombatantCard` import path SHALL be unchanged.

#### Scenario: Public props contract unchanged

- **Given** the exported `CombatantCardProps` interface before and after the refactor
- **When** the two are compared
- **Then** they are structurally identical (same members, same types, same optionality)
- **And** `lib/components/ActiveCombatView.tsx` requires no change to keep compiling

#### Scenario: Composition layer under 300 lines

- **Given** the refactored `lib/components/CombatantCard.tsx`
- **When** its line count is measured
- **Then** it is fewer than 300 lines

#### Scenario: Sub-components live under `lib/components/combatant-card/`

- **Given** the refactored codebase
- **When** `lib/components/combatant-card/` is listed
- **Then** it contains `CombatantCardHeader.tsx`, `HpControls.tsx`, `ConditionControls.tsx`, `TargetingPanel.tsx`, `DamageEffectsPanel.tsx`, `TargetCheckboxColumn.tsx`, and `ConditionFormModal.tsx`
- **And** no other module imports `DamageEffectsPanel` or `TargetCheckboxColumn` from the old `CombatantCard.tsx` path

### Requirement: HP controls extracted to `HpControls`

The system SHALL render the HP-adjustment input, damage-type select, Damage /
Heal / Set Temp / Undo buttons, Temp-mode checkbox, and the health bar from an
`HpControls` component that receives all state and callbacks from
`useCombatantHp` and the `combatant` prop.

#### Scenario: Damage button applies damage through the hook

- **Given** a rendered `CombatantCard` for a combatant with `hp` 20
- **When** the user enters `5` and clicks "Damage"
- **Then** `onUpdate` is called with `hp: 15` and the input is cleared
- **And** the visible "Undo HP" button becomes enabled

#### Scenario: Undo restores HP and tempHp only

- **Given** a combatant that has just taken damage from `hp` 20 to `hp` 15
- **When** the user clicks "Undo HP"
- **Then** `onUpdate` is called with `hp: 20` and `tempHp` from the history entry
- **And** no `lifeState` or `deathSaves` key is included (documented limitation)

### Requirement: Condition controls extracted to `ConditionControls`

The system SHALL render the conditions list, its expand/collapse toggle, and
per-condition remove buttons from a `ConditionControls` component, and SHALL open
the current combatant's "Add Condition" flow as a modal (`ConditionFormModal`)
rather than through `window.prompt`.

#### Scenario: Add Condition opens a modal, not a prompt

- **Given** a rendered `CombatantCard`
- **When** the user clicks "Add Condition"
- **Then** a modal dialog with a name field and an optional duration field is shown
- **And** `window.prompt` is not invoked

#### Scenario: Submitting the modal adds a validated condition

- **Given** the condition modal is open
- **When** the user enters name `Prone`, leaves duration empty, and confirms
- **Then** `onUpdate` is called with `conditions` containing a new entry `{ name: 'Prone', duration: undefined }` with a generated `id`
- **And** the modal closes

#### Scenario: Invalid condition input is rejected

- **Given** the condition modal is open
- **When** the user enters an empty name, or a name longer than 100 characters, or a non-digit / out-of-range `[1, 10_000]` duration, and confirms
- **Then** `onUpdate` is not called

#### Scenario: Cancelling the modal adds nothing

- **Given** the condition modal is open with a typed name
- **When** the user cancels
- **Then** `onUpdate` is not called and the modal closes

### Requirement: Card header extracted to `CombatantCardHeader`

The system SHALL render the combatant name, life-state badge, info/remove/
next-turn buttons, AC, HP readout, legendary-action badge, and initiative block
from a `CombatantCardHeader` component driven entirely by props.

#### Scenario: Header renders life-state badge and callbacks

- **Given** a combatant with `lifeState: 'dying'` rendered in a `CombatantCard`
- **When** the card mounts
- **Then** the life-state badge shows the dying state
- **And** clicking the info button calls `onShowDetails` with the combatant id and a position
- **And** clicking initiative calls `onSetInitiative` with the combatant id

### Requirement: `CombatantCard` no longer imports unused action panels

The system SHALL NOT import `LegendaryActionsPanel` or `LairActionsSlot` in
`lib/components/CombatantCard.tsx` while those components are not rendered.
Re-introducing them is tracked separately in issue #695.

#### Scenario: No dead action-panel imports remain

- **Given** the refactored `lib/components/CombatantCard.tsx`
- **When** its import statements are inspected
- **Then** there is no import of `LegendaryActionsPanel` or `LairActionsSlot`
- **And** the passive `⚡ N/M` legendary-action badge is still rendered by `CombatantCardHeader`

### Requirement: Performance

#### Scenario: Card mount cost unchanged

- **Given** an active combat with 12 combatants
- **When** the combat view renders
- **Then** perceived render time is not worse than the pre-refactor baseline (manual `run` smoke; not a CI gate)

### Requirement: Security

See functional scenario: "Invalid condition input is rejected". Condition name and duration remain validated before reaching persisted state; the modal enforces the same limits the `window.prompt` flow did.

### Requirement: Reliability

#### Scenario: Existing card suites unchanged and green

- **Given** `tests/unit/components/CombatantCard.callbacks.test.tsx`, `CombatantCard.badges.test.tsx`, and `tests/unit/components/ActiveCombatView.test.tsx`
- **When** the refactor is complete and none of those files has been edited (except unavoidable test-harness `window.prompt` mocks that are now dead code may be left as-is)
- **Then** all of those suites pass

### Requirement: Operability

#### Scenario: No new Verity comprehensibility or modularity finding on the card

- **Given** the Verity pre-push gate
- **When** it runs against the refactor branch
- **Then** it reports no MEDIUM-or-higher comprehensibility or modularity finding on `lib/components/CombatantCard.tsx`
