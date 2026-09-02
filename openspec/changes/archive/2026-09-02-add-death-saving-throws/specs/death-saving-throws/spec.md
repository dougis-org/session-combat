## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Player character enters the dying state at 0 HP

The system SHALL place a player combatant into a `dying` life state with an empty death-save tracker (0 successes, 0 failures) the first time its HP is reduced to 0 or below, and SHALL display a death-save tracker with 3 success slots and 3 failure slots on that combatant.

#### Scenario: Player character drops to 0 HP

- **Given** a combatant with `type: "player"`, `hp: 4`, `maxHp: 20`, and no `lifeState`
- **When** the DM applies 4 or more damage so the resulting HP is 0
- **Then** the combatant has `lifeState: "dying"` and `deathSaves: { successes: 0, failures: 0 }`
- **And** the death-save tracker with 3 empty success slots and 3 empty failure slots is shown on that combatant

#### Scenario: Combatant already dying takes more damage does not reset the tracker

- **Given** a player combatant with `hp: 0`, `lifeState: "dying"`, `deathSaves: { successes: 1, failures: 1 }`
- **When** the DM applies additional non-critical damage below the `maxHp` threshold
- **Then** `deathSaves.successes` remains `1`
- **And** `deathSaves.failures` becomes `2` (one failure added for taking damage while downed)

### Requirement: ADDED Rolling a death save applies the correct outcome

The system SHALL provide a "Roll death save" action on the dying combatant's tracker that rolls a single d20 using the centralized unbiased dice utility (`rollDie(20)`), displays the rolled value, and applies its outcome: a roll of 10–19 adds one success, a roll of 2–9 adds one failure, a natural 20 adds two successes and immediately revives the character, and a natural 1 adds two failures.

#### Scenario: DM rolls a death save that succeeds

- **Given** a dying player combatant with `deathSaves: { successes: 0, failures: 0 }`
- **When** the DM triggers "Roll death save" and the d20 result is between 10 and 19 inclusive
- **Then** the rolled value is shown to the DM
- **And** `deathSaves.successes` is `1` and `deathSaves.failures` is `0`

#### Scenario: DM rolls a death save that fails

- **Given** a dying player combatant with `deathSaves: { successes: 1, failures: 0 }`
- **When** the DM triggers "Roll death save" and the d20 result is between 2 and 9 inclusive
- **Then** `deathSaves.failures` is `1` and `deathSaves.successes` is `1`

#### Scenario: Natural 20 on a death save revives at 1 HP

- **Given** a dying player combatant with `hp: 0`, `lifeState: "dying"`, `deathSaves: { successes: 1, failures: 2 }`
- **When** the DM triggers "Roll death save" and the d20 result is exactly 20
- **Then** the combatant has `hp: 1`
- **And** `lifeState` is unset (active) and `deathSaves` is cleared
- **And** an inline note indicates "Nat 20 — revived at 1 HP"

#### Scenario: Natural 1 on a death save adds two failures

- **Given** a dying player combatant with `deathSaves: { successes: 2, failures: 0 }`
- **When** the DM triggers "Roll death save" and the d20 result is exactly 1
- **Then** `deathSaves.failures` is `2`

### Requirement: ADDED Death-save slots are individually toggleable

The system SHALL allow the DM to toggle any individual success slot or failure slot on or off directly, and SHALL re-evaluate resolution (stabilize / die) after every toggle.

#### Scenario: DM toggles a death-save slot manually

- **Given** a dying player combatant with `deathSaves: { successes: 1, failures: 0 }`
- **When** the DM clicks the second success slot
- **Then** `deathSaves.successes` is `2`
- **And** clicking the same slot again returns `deathSaves.successes` to `1`

#### Scenario: Manual toggle reaching the third slot resolves the state

- **Given** a dying player combatant with `deathSaves: { successes: 2, failures: 0 }`
- **When** the DM toggles the third success slot on
- **Then** `lifeState` is `"stable"` and `deathSaves` is cleared

### Requirement: ADDED Three successes stabilize, three failures kill

The system SHALL set `lifeState` to `"stable"` when a dying combatant reaches 3 successes, and to `"dead"` when it reaches 3 failures, and SHALL clear the running `deathSaves` counts on either resolution. A dying combatant that reaches 3 failures SHALL resolve to `"dead"` regardless of its success count.

#### Scenario: Third success stabilizes the character

- **Given** a dying player combatant with `deathSaves: { successes: 2, failures: 1 }`
- **When** an action (roll or manual toggle) adds a third success
- **Then** `lifeState` is `"stable"`, `deathSaves` is cleared, and the tracker is no longer shown

#### Scenario: Third failure kills the character

- **Given** a dying player combatant with `deathSaves: { successes: 2, failures: 2 }`
- **When** an action adds a third failure
- **Then** `lifeState` is `"dead"`, `deathSaves` is cleared, and the tracker is no longer shown

### Requirement: ADDED Damage to a downed character adds failures; critical or massive damage is instant death

The system SHALL add one failure when a combatant that is `dying` or `stable` at 0 HP takes damage, SHALL set `lifeState` to `"dead"` when that damage is from a critical hit or when the incoming damage amount is greater than or equal to the combatant's `maxHp`, and a `stable` combatant that takes damage SHALL return to `dying`.

#### Scenario: Downed character takes ordinary damage

- **Given** a player combatant with `hp: 0`, `lifeState: "dying"`, `deathSaves: { successes: 0, failures: 0 }`, `maxHp: 20`
- **When** the DM applies 5 damage (not a critical hit)
- **Then** `deathSaves.failures` is `1` and `lifeState` is still `"dying"`

#### Scenario: Massive damage is instant death

- **Given** a player combatant with `hp: 0`, `lifeState: "dying"`, `maxHp: 20`
- **When** the DM applies 20 or more damage in a single instance
- **Then** `lifeState` is `"dead"` and `deathSaves` is cleared

#### Scenario: Stable character takes damage and returns to dying

- **Given** a player combatant with `hp: 0`, `lifeState: "stable"`, `maxHp: 20`
- **When** the DM applies 5 damage (not a critical hit, below `maxHp`)
- **Then** `lifeState` is `"dying"`, `deathSaves` is `{ successes: 0, failures: 1 }`, and the tracker is shown again

### Requirement: ADDED Healing a downed character above 0 HP clears death-save state

The system SHALL clear `lifeState` and `deathSaves` when a combatant that is `dying`, `stable`, or `dead` is healed to 1 HP or more. Healing that leaves the combatant at exactly 0 HP SHALL NOT change its life state.

#### Scenario: Downed character is healed above 0

- **Given** a player combatant with `hp: 0`, `lifeState: "dying"`, `deathSaves: { successes: 1, failures: 2 }`
- **When** the DM applies 6 healing
- **Then** `hp` is `6`, `lifeState` is unset, `deathSaves` is unset, and the tracker is no longer shown

#### Scenario: Healing to exactly 0 does not revive

- **Given** a player combatant with `hp: -3` clamped to `0`, `lifeState: "dying"`
- **When** healing is applied that does not bring HP to 1 or above
- **Then** `lifeState` remains `"dying"` and the tracker stays visible

### Requirement: ADDED Non-player combatants do not make death saves

The system SHALL restrict death-save behavior to combatants with `type: "player"`. Combatants of any other type reaching 0 HP SHALL retain the existing behavior (dead indicator, no tracker, no `lifeState`/`deathSaves` fields).

#### Scenario: Monster reaches 0 HP

- **Given** a combatant with `type: "monster"`, `hp: 3`
- **When** the DM applies 3 or more damage
- **Then** no death-save tracker is shown
- **And** the combatant has no `lifeState` or `deathSaves` fields
- **And** the existing dead indicator (`☠️`) is shown

### Requirement: ADDED Initiative list reflects life state

The system SHALL visually distinguish combatants in the initiative list by life state: active combatants render normally; `dying` combatants render normally with a "Dying" indicator and their death-save tracker; `stable` and `dead` combatants render greyed out (reduced visual prominence) with a "Stable" or "Dead" indicator respectively and no tracker. Stable and dead combatants SHALL still occupy their initiative position and turn slot (they are not skipped).

#### Scenario: Initiative list reflects life state

- **Given** a combat with one active player, one `dying` player, one `stable` player, and one `dead` player
- **When** the initiative list renders
- **Then** the active player renders with normal styling and no indicator
- **And** the dying player renders with normal styling, a "Dying" indicator, and a death-save tracker
- **And** the stable player renders greyed with a "Stable" indicator and no tracker
- **And** the dead player renders greyed with a "Dead" indicator and no tracker
- **And** advancing turns still stops on the stable and dead players' turns

## MODIFIED Requirements

### Requirement: MODIFIED Combatant zero-HP indicator is driven by life state

The system SHALL derive the downed/dead visual indicator on a combatant card and in the target list from the combatant's `lifeState` for player combatants (`dying`, `stable`, `dead`), and SHALL fall back to the existing `hp <= 0` skull indicator only for combatants that do not use death saves.

#### Scenario: Player card indicator follows life state rather than raw HP

- **Given** a player combatant with `hp: 0` and `lifeState: "stable"`
- **When** the combatant card and target list render
- **Then** they show a "Stable" indicator (not a bare `☠️` implying death)

#### Scenario: Non-player card indicator unchanged

- **Given** a monster combatant with `hp: 0` and no `lifeState`
- **When** the combatant card and target list render
- **Then** they show the existing `☠️` indicator

## REMOVED Requirements

None.

## Traceability

- Proposal element "Tracker shown automatically at 0 HP for PCs" -> Requirement: ADDED Player character enters the dying state at 0 HP
- Proposal element "3 success + 3 failure slots, individually toggleable" -> Requirement: ADDED Death-save slots are individually toggleable
- Proposal element "Roll death save via dice library, record impact" -> Requirement: ADDED Rolling a death save applies the correct outcome
- Proposal element "3 successes -> stable / 3 failures -> dead, counts cleared" -> Requirement: ADDED Three successes stabilize, three failures kill
- Proposal element "Nat 20 = 2 successes + revive at 1 HP (always-on)" -> Requirement: ADDED Rolling a death save applies the correct outcome (Scenario: Natural 20 ...)
- Proposal element "Damage while downed; crit / massive = instant death" -> Requirement: ADDED Damage to a downed character adds failures; critical or massive damage is instant death
- Proposal element "Healing above 0 clears death-save state" -> Requirement: ADDED Healing a downed character above 0 HP clears death-save state
- Proposal element "Bosses/monsters do not make death saves" -> Requirement: ADDED Non-player combatants do not make death saves
- Proposal element "Initiative list distinguishes states; stable & dead greyed, not skipped" -> Requirement: ADDED Initiative list reflects life state
- Proposal element "Replace hp<=0 skull heuristic" -> Requirement: MODIFIED Combatant zero-HP indicator is driven by life state
- Design Decision 1 (explicit `lifeState` + `deathSaves`) -> all ADDED requirements
- Design Decision 2 (`lib/combat/deathSaves.ts` pure helpers) -> Requirements: Rolling a death save, Death-save slots toggleable, Three successes/three failures, Damage to a downed character, Healing clears state
- Design Decision 3 (`adjustHp` single writer) -> Requirements: Player enters dying, Damage to a downed character, Healing clears state
- Design Decision 4 (`rollDie(20)`, inline display) -> Requirement: Rolling a death save applies the correct outcome
- Design Decision 5 (initiative-list styling helper) -> Requirements: Initiative list reflects life state, MODIFIED zero-HP indicator
- Requirement: ADDED Player character enters the dying state at 0 HP -> Tasks: types field addition, `deathSaves.ts` `enterDying`/`usesDeathSaves`, `adjustHp` wiring, tracker render, unit + component tests
- Requirement: ADDED Rolling a death save applies the correct outcome -> Tasks: `applyDeathSaveRoll`, roll-action button, `rollDie` spy tests
- Requirement: ADDED Death-save slots are individually toggleable -> Tasks: `toggleDeathSaveSlot`, slot component, tests
- Requirement: ADDED Three successes stabilize, three failures kill -> Tasks: resolution logic in `deathSaves.ts`, tests
- Requirement: ADDED Damage to a downed character ... -> Tasks: `applyDamageWhileDowned`, `adjustHp` damage branch, crit-flag investigation, tests
- Requirement: ADDED Healing a downed character above 0 HP clears death-save state -> Tasks: `clearDeathState`, `adjustHp` healing branch, tests
- Requirement: ADDED Non-player combatants do not make death saves -> Tasks: `usesDeathSaves` predicate, conditional render, tests
- Requirement: ADDED Initiative list reflects life state -> Tasks: `lifeStateDisplay` helper, `ActiveCombatView` + card styling, component tests
- Requirement: MODIFIED Combatant zero-HP indicator is driven by life state -> Tasks: replace `hp <= 0 && '☠️'` sites, tests

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Death-save tracker does not load the dice rendering engine

- **Given** the combat view with a dying player combatant
- **When** the combatant card and its death-save tracker render
- **Then** no 3D dice engine module (`@drdreo/dice-box-threejs` / dice-box) is imported or initialized as a result of rendering the tracker
- **And** the d20 is produced only when the DM triggers "Roll death save", via `rollDie(20)`

### Requirement: Security

Death saves are a DM-only local combat action with no new authentication or authorization surface. Fairness of the underlying randomness is covered by the existing `rollDie` guarantees.

#### Scenario: Death-save rolls use the unbiased secure generator

- **Given** the death-save roll action
- **When** a death save is rolled
- **Then** the value is obtained from `rollDie(20)` (crypto-secure, rejection-sampled) and never from `Math.random`

### Requirement: Reliability

#### Scenario: Combat state without death-save fields behaves as active

- **Given** a persisted combat loaded from before this change, whose player combatants have no `lifeState` or `deathSaves` fields
- **When** the combat view renders and turns are advanced
- **Then** those combatants are treated as active (no tracker, normal styling)
- **And** reducing one to 0 HP transitions it into the `dying` state normally
