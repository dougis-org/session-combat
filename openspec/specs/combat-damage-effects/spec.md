## ADDED Requirements

### Requirement: CombatantState supports combat-scoped active damage effects

`CombatantState` SHALL include an optional `activeDamageEffects` field of type `ActiveDamageEffect[]`. Each entry has a `type: DamageType`, `kind: 'resistance' | 'immunity' | 'vulnerability'`, and `label: string`. This field SHALL NOT exist on `CreatureStats` — it is combat-runtime state only and does not persist to character or monster templates.

#### Scenario: CombatantState can hold active damage effects

- **WHEN** a `CombatantState` is constructed
- **THEN** `activeDamageEffects` may be set to an array of `ActiveDamageEffect` entries
- **THEN** the field is optional; absence is equivalent to an empty array

#### Scenario: Active effects do not persist to character template

- **WHEN** a combat session ends
- **THEN** `activeDamageEffects` are discarded with the `CombatantState`
- **THEN** the source `Character` or `Monster` record is unchanged

---

### Requirement: Active effects merge with permanent resistances at damage resolution

When `applyDamageWithType()` is called, the caller SHALL merge permanent resistances/immunities/vulnerabilities from `CombatantState` fields with those from `activeDamageEffects` before passing them. The merged arrays are what the function evaluates.

#### Scenario: Active effect supplements permanent resistance

- **WHEN** a combatant has `damageResistances: ['poison']` and `activeDamageEffects: [{ type: 'fire', kind: 'resistance', label: 'Rage' }]`
- **WHEN** fire damage is applied
- **THEN** fire resistance is applied (from active effect)

#### Scenario: Active immunity overrides permanent resistance to same type

- **WHEN** a combatant has `damageResistances: ['cold']` and `activeDamageEffects: [{ type: 'cold', kind: 'immunity', label: 'Protection from Energy' }]`
- **WHEN** cold damage is applied
- **THEN** `modifier` is `'immune'` and `effectiveDamage` is `0`

#### Scenario: Duplicate permanent + active resistance does not stack

- **WHEN** a combatant has `damageResistances: ['fire']` and `activeDamageEffects: [{ type: 'fire', kind: 'resistance', label: 'Stoneskin' }]`
- **WHEN** fire damage is applied
- **THEN** damage is halved once (not further reduced)

---

### Requirement: DM can add a combat effect from a preset

The combatant card SHALL provide a UI action to add an active damage effect. When invoked, the DM SHALL be able to select a preset from `DAMAGE_EFFECT_PRESETS` or define a custom effect. Applying a preset adds its entries to `activeDamageEffects` using the preset `label`.

#### Scenario: Applying Rage preset adds BPS resistance entries

- **WHEN** DM selects the "Rage" preset and confirms
- **THEN** three entries are added to `activeDamageEffects`:
  `{ type: 'bludgeoning', kind: 'resistance', label: 'Rage' }`,
  `{ type: 'piercing', kind: 'resistance', label: 'Rage' }`,
  `{ type: 'slashing', kind: 'resistance', label: 'Rage' }`

#### Scenario: Applying a choose-type preset prompts for type selection

- **WHEN** DM selects "Protection from Energy" preset
- **THEN** a type picker is shown limited to: acid, cold, fire, lightning, thunder
- **WHEN** DM picks `cold`
- **THEN** one entry is added: `{ type: 'cold', kind: 'resistance', label: 'Protection from Energy' }`

#### Scenario: Custom effect can be added with any label and type

- **WHEN** DM selects "Custom" option, enters label "Paladin Aura", picks `radiant`, kind `resistance`
- **THEN** one entry is added: `{ type: 'radiant', kind: 'resistance', label: 'Paladin Aura' }`

---

### Requirement: DM can remove active effects by label

The combatant card SHALL display current `activeDamageEffects` grouped by label. Each group SHALL have a remove action that deletes all entries with that label from `activeDamageEffects`.

#### Scenario: Removing Rage clears all Rage entries

- **WHEN** `activeDamageEffects` contains three entries with `label: 'Rage'` and one with `label: 'Stoneskin'`
- **WHEN** DM removes the "Rage" group
- **THEN** the three Rage entries are removed
- **THEN** the Stoneskin entry remains

#### Scenario: Active effects panel visible on combatant card

- **WHEN** a combatant has one or more `activeDamageEffects`
- **THEN** an "Active Effects" section is visible on the combatant card showing each label group
- **WHEN** a combatant has no active effects
- **THEN** the section is hidden or collapsed by default

---

### Requirement: DAMAGE_EFFECT_PRESETS constant ships with initial preset set

`lib/constants.ts` SHALL export `DAMAGE_EFFECT_PRESETS` as a readonly array of `DamageEffectPreset`. The initial set SHALL include the following 7 presets. New presets MAY be added by appending to the array with no other code changes.

| id | label | Effects |
|----|-------|---------|
| `rage` | Rage | resistance: bludgeoning, piercing, slashing |
| `stoneskin` | Stoneskin | resistance: bludgeoning, piercing, slashing |
| `protection-from-energy` | Protection from Energy | resistance: [user chooses from acid, cold, fire, lightning, thunder] |
| `fire-shield-warm` | Fire Shield (Warm) | resistance: cold |
| `fire-shield-chill` | Fire Shield (Chill) | resistance: fire |
| `absorb-elements` | Absorb Elements | resistance: [user chooses any DamageType] |
| `warding-bond` | Warding Bond | resistance: all 13 canonical types |

#### Scenario: DAMAGE_EFFECT_PRESETS contains all 7 initial presets

- **WHEN** `DAMAGE_EFFECT_PRESETS` is imported
- **THEN** it contains entries with ids: `rage`, `stoneskin`, `protection-from-energy`, `fire-shield-warm`, `fire-shield-chill`, `absorb-elements`, `warding-bond`

#### Scenario: Warding Bond preset covers all 13 types

- **WHEN** the `warding-bond` preset is applied
- **THEN** 13 resistance entries are added to `activeDamageEffects`, one per `DamageType`, all with `label: 'Warding Bond'`

#### Scenario: Extending presets requires no code change beyond adding to the array

- **WHEN** a new entry is appended to `DAMAGE_EFFECT_PRESETS`
- **THEN** it appears in the preset picker without modifying any other file
