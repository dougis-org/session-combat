# combat-hp-orchestration Specification

## Purpose

Compute HP, temporary-HP, concentration, and life-state transitions for a
damage/heal/set-temp action in one pure, directly unit-testable domain
function (`lib/combat/applyHpChange.ts`), rather than braided inline React
state closures. HP-adjustment UI state (free-text parsing, temp-mode,
selected damage type, undo history) lives in a `useCombatantHp` hook that
performs the storage/callback plumbing around the pure orchestrator. No
behaviour change to the HP math, death-save rules, concentration DC calc, or
effects-panel behaviour is intended.

## Requirements

### Requirement: Pure HP-change orchestrator

The system SHALL compute all HP, temporary-HP, concentration, and life-state
transitions for a single damage/heal/set-temp action in one pure function
(`lib/combat/applyHpChange.ts`) that takes a combatant plus an intent and returns
a single merged `Partial<CombatantState>` update together with optional
side-effect descriptors (an HP-history entry to persist and a CON-save DC to
surface). The function SHALL NOT perform storage, callbacks, or any I/O.

#### Scenario: Damage on an active combatant

- **Given** a combatant with `hp` 20, `maxHp` 20, no `lifeState`, not concentrating
- **When** `applyHpChange` is called with `{ kind: 'damage', amount: 7, damageType: '' }`
- **Then** `result.updates` contains `hp: 13` and no `lifeState`, `deathSaves`, `concentratingOn`, or `pendingConSaveDC` keys
- **And** `result.history` is present with `type: 'damage'`, `amount: 7`, `hp: 20`, `tempHp: 0`
- **And** `result.conSaveRequired` is undefined

#### Scenario: Damage to 0 HP enters dying for a death-save user

- **Given** a player combatant with `hp` 4, no `lifeState`, not concentrating
- **When** `applyHpChange` is called with `{ kind: 'damage', amount: 9, damageType: '' }`
- **Then** `result.updates` contains `hp: 0` and the `enterDying()` life-state keys (`lifeState: 'dying'`, zeroed `deathSaves`)

#### Scenario: Damage while downed applies the death-save-while-downed rules

- **Given** a player combatant with `lifeState: 'dying'`, `deathSaves: { successes: 0, failures: 1 }`
- **When** `applyHpChange` is called with `{ kind: 'damage', amount: 3, damageType: '' }` (non-critical, post-resistance incoming 3, below `maxHp`)
- **Then** `result.updates` matches `applyDamageWhileDowned(combatant, { critical: false, damage: 3 })` — one additional death-save failure

#### Scenario: Fully-mitigated damage while downed is inert

- **Given** a player combatant with `lifeState: 'dying'` and `damageImmunities` including `fire`
- **When** `applyHpChange` is called with `{ kind: 'damage', amount: 10, damageType: 'fire' }` (post-immunity incoming 0)
- **Then** `result.updates` adds no death-save failure and does not set `lifeState: 'dead'`

#### Scenario: Healing a downed combatant clears life-state

- **Given** a player combatant with `hp` 0, `lifeState: 'stable'`, `deathSaves: { successes: 1, failures: 2 }`
- **When** `applyHpChange` is called with `{ kind: 'heal', amount: 5, damageType: '' }`
- **Then** `result.updates` contains `hp: 5` and the `clearDeathState()` keys

#### Scenario: Damage on a concentrating combatant surfaces a CON save

- **Given** a combatant with `hp` 20, `concentratingOn: 'Bless'`, not downed
- **When** `applyHpChange` is called with `{ kind: 'damage', amount: 12, damageType: '' }` (effective damage 12, `hp` stays above 0)
- **Then** `result.updates` contains `pendingConSaveDC` equal to `calcConSaveDC(12)`
- **And** `result.conSaveRequired` equals `calcConSaveDC(12)`

#### Scenario: Dropping a concentrating combatant to 0 clears concentration

- **Given** a combatant with `hp` 5, `concentratingOn: 'Bless'`, `pendingConSaveDC: 13`
- **When** `applyHpChange` is called with `{ kind: 'damage', amount: 9, damageType: '' }`
- **Then** `result.updates` contains `hp: 0`, `concentratingOn: undefined`, and `pendingConSaveDC: undefined`
- **And** `result.conSaveRequired` is undefined

#### Scenario: No HP-history entry when the value does not change

- **Given** a combatant with `hp` 0 and `tempHp` 0
- **When** `applyHpChange` is called with `{ kind: 'damage', amount: 4, damageType: '' }` and the computed `hp`/`tempHp` are unchanged
- **Then** `result.history` is undefined

#### Scenario: Set temporary HP takes the higher value

- **Given** a combatant with `tempHp` 3
- **When** `applyHpChange` is called with `{ kind: 'setTemp', amount: 8, damageType: '' }`
- **Then** `result.updates` contains `tempHp: 8` and `result.history` has `type: 'tempHp'`
- **When** instead called with `{ kind: 'setTemp', amount: 2, damageType: '' }`
- **Then** `result.updates` is empty and `result.history` is undefined

### Requirement: Named typed-damage result

The system SHALL expose an exported `TypedDamageResult` type from
`lib/combat/applyTypedDamage.ts` with `hp`, `tempHp`, `effectiveDamage`
(HP-pool-clamped amount, drives the concentration CON-save DC), and
`incomingDamage` (post-resistance/immunity amount independent of current HP,
drives the death-save-while-downed rules) fields, each documented.

#### Scenario: Typed damage against immunity

- **Given** a combatant immune to `fire` with `hp` 10, `tempHp` 0
- **When** `applyTypedDamage(10, 0, 8, 'fire', combatant)` is called
- **Then** the result is `{ hp: 10, tempHp: 0, effectiveDamage: 0, incomingDamage: 0 }`

#### Scenario: Untyped damage lands in full

- **Given** a combatant with `hp` 6, `tempHp` 2
- **When** `applyTypedDamage(6, 2, 10, '', combatant)` is called
- **Then** the result has `hp: 0`, `tempHp: 0`, `effectiveDamage: 8`, `incomingDamage: 10`

### Requirement: HP-adjustment input validation lives in `useCombatantHp`

The system SHALL parse the free-text HP-adjustment field in the
`useCombatantHp` hook, accepting only a plain positive integer in the inclusive
range `[1, 1_000_000]`; any other input SHALL result in no state update.

#### Scenario: Non-integer input is rejected

- **Given** the hook with `hpAdjustment` set to `"3.5"`
- **When** `applyDamage()` is invoked
- **Then** `onUpdate` is not called and `hpAdjustment` is left unchanged

#### Scenario: Out-of-range input is rejected

- **Given** the hook with `hpAdjustment` set to `"9999999"`
- **When** `applyHeal()` is invoked
- **Then** `onUpdate` is not called

#### Scenario: Valid input applies and clears the field

- **Given** the hook with `hpAdjustment` set to `"6"`
- **When** `applyDamage()` is invoked
- **Then** `onUpdate` is called once with the orchestrator result and `hpAdjustment` becomes `""`

### Requirement: Selected damage type is shared with the effects panel

The system SHALL keep the `selectedDamageType` value in the `useCombatantHp`
hook and the composition layer SHALL pass that value to both the HP controls
and the damage-effects panel, so the panel's "Custom" resistance/immunity/
vulnerability buttons continue to reflect the type chosen in the HP controls.

#### Scenario: Choosing a type in HP controls enables the effects-panel custom buttons

- **Given** a rendered `CombatantCard` with the damage-effects panel open
- **When** the user selects `cold` in the HP-controls damage-type dropdown
- **Then** the effects panel shows enabled "resistance (cold)", "immunity (cold)", and "vulnerability (cold)" buttons

### Requirement: Performance

#### Scenario: No extra re-render on HP input

- **Given** a rendered `CombatantCard` in an active combat
- **When** the user types five characters into the HP-adjustment field
- **Then** the number of `CombatantCard` subtree renders is not greater than with the pre-refactor implementation for the same keystrokes

### Requirement: Security

See functional scenarios: "Non-integer input is rejected", "Out-of-range input is rejected". HP values entered by the user remain validated before reaching persisted combat state; this change relocates the guard without weakening it.

### Requirement: Reliability

#### Scenario: Existing combat suites unchanged and green

- **Given** the pre-existing `tests/unit/components/CombatantCard.hp.test.tsx`, `CombatantCard.concentration.test.tsx`, `CombatantCard.deathSaves.test.tsx`, `CombatantCard.effects-panel.test.tsx`, and `tests/unit/combat/hpHistory.test.ts`
- **When** the refactor is complete and none of those files has been edited
- **Then** all of those suites pass
