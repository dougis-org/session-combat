## ADDED Requirements

### Requirement: `applyDamageWithType()` computes effective damage with resistance modifiers

The system SHALL provide a pure function `applyDamageWithType(hp, tempHp, rawDamage, type?, resistances?, immunities?, vulnerabilities?)` in `lib/utils/combat.ts`. It SHALL compute effective damage based on the combatant's resistance/immunity/vulnerability to the given type, apply temp HP absorption via `applyDamage()`, and return the resulting HP state plus a modifier label.

#### Scenario: No damage type selected — raw damage applied

- **WHEN** `applyDamageWithType` is called with `type = undefined`
- **THEN** `effectiveDamage` equals `rawDamage`
- **THEN** `modifier` is `'normal'`
- **THEN** HP result matches `applyDamage(hp, tempHp, rawDamage)`

#### Scenario: Immune — damage zeroed

- **WHEN** `applyDamageWithType` is called with `type = 'fire'` and `immunities = ['fire']`
- **THEN** `effectiveDamage` is `0`
- **THEN** `modifier` is `'immune'`
- **THEN** `hp` and `tempHp` are unchanged

#### Scenario: Resistant — damage halved (round down)

- **WHEN** `applyDamageWithType` is called with `rawDamage = 10`, `type = 'cold'`, `resistances = ['cold']`
- **THEN** `effectiveDamage` is `5`
- **THEN** `modifier` is `'resistant'`

#### Scenario: Resistant — odd damage rounds down

- **WHEN** `applyDamageWithType` is called with `rawDamage = 9`, `type = 'cold'`, `resistances = ['cold']`
- **THEN** `effectiveDamage` is `4`

#### Scenario: Vulnerable — damage doubled

- **WHEN** `applyDamageWithType` is called with `rawDamage = 10`, `type = 'lightning'`, `vulnerabilities = ['lightning']`
- **THEN** `effectiveDamage` is `20`
- **THEN** `modifier` is `'vulnerable'`

#### Scenario: Resistant and vulnerable cancel to normal

- **WHEN** `applyDamageWithType` is called with `type = 'bludgeoning'`, `resistances = ['bludgeoning']`, `vulnerabilities = ['bludgeoning']`
- **THEN** `effectiveDamage` equals `rawDamage`
- **THEN** `modifier` is `'normal'`

#### Scenario: Immunity takes priority over vulnerability

- **WHEN** `applyDamageWithType` is called with `type = 'necrotic'`, `immunities = ['necrotic']`, `vulnerabilities = ['necrotic']`
- **THEN** `effectiveDamage` is `0`
- **THEN** `modifier` is `'immune'`

#### Scenario: Unrelated type — no modifier applied

- **WHEN** `applyDamageWithType` is called with `type = 'fire'` and `resistances = ['cold']`
- **THEN** `effectiveDamage` equals `rawDamage`
- **THEN** `modifier` is `'normal'`

---

### Requirement: Resistance math applied before temp HP absorption

The effective damage (post-modifier) SHALL be passed to temp HP absorption. Resistance SHALL reduce the damage that enters the temp HP / regular HP drain calculation.

#### Scenario: Resistance reduces damage before temp HP drains

- **WHEN** `applyDamageWithType` is called with `hp = 30`, `tempHp = 6`, `rawDamage = 10`, `type = 'fire'`, `resistances = ['fire']`
- **THEN** `effectiveDamage` is `5`
- **THEN** `tempHp` result is `1` (6 − 5)
- **THEN** `hp` result is `30` (temp HP fully absorbed the 5)

#### Scenario: Immunity leaves temp HP and HP unchanged

- **WHEN** `applyDamageWithType` is called with `hp = 20`, `tempHp = 8`, `rawDamage = 15`, `type = 'poison'`, `immunities = ['poison']`
- **THEN** `tempHp` is `8`
- **THEN** `hp` is `20`

---

### Requirement: Damage type selector on HP adjustment widget

The HP adjustment widget in the combat view SHALL include a dropdown to select a damage type from `DAMAGE_TYPES`. A "No type" (blank) option SHALL be the default. The selector SHALL appear for both the direct HP adjustment and the deal-damage-to-target flow.

#### Scenario: No type selected — behavior unchanged

- **WHEN** a user applies damage without selecting a damage type
- **THEN** `applyDamage()` is called directly (no resistance check)
- **THEN** HP updates as before

#### Scenario: Type selected — resistance check performed

- **WHEN** a user selects `fire` and applies 10 damage to a combatant with `damageImmunities: ['fire']`
- **THEN** `applyDamageWithType()` is called
- **THEN** HP is unchanged
- **THEN** feedback message `"Immune — 0 dmg"` is shown

---

### Requirement: Visual feedback when damage modifier is applied

After applying typed damage, the HP adjustment widget SHALL display a transient feedback message for 3 seconds describing the modifier outcome.

#### Scenario: Immune feedback

- **WHEN** damage is applied and `modifier` is `'immune'`
- **THEN** message `"Immune — 0 dmg"` is displayed

#### Scenario: Resistant feedback

- **WHEN** `rawDamage = 10` is applied and `modifier` is `'resistant'`
- **THEN** message `"Resisted — 10 → 5 dmg"` is displayed

#### Scenario: Vulnerable feedback

- **WHEN** `rawDamage = 10` is applied and `modifier` is `'vulnerable'`
- **THEN** message `"Vulnerable — 10 → 20 dmg"` is displayed

#### Scenario: Normal typed damage — no modifier label

- **WHEN** typed damage is applied and `modifier` is `'normal'`
- **THEN** no modifier label is shown (feedback is silent or absent)

---

### Requirement: `applyDamageWithType()` operates on merged permanent + active effect arrays

The caller SHALL merge `CombatantState.damageResistances/Immunities/Vulnerabilities` with the corresponding entries from `activeDamageEffects` before passing them to `applyDamageWithType()`. The function itself receives plain `DamageType[]` arrays and applies the priority rules without knowledge of the source.

#### Scenario: Temporary resistance applies when permanent does not cover the type

- **WHEN** `combatant.damageResistances = ['poison']` and `activeDamageEffects` contains `{ type: 'fire', kind: 'resistance', label: 'Rage' }`
- **WHEN** merged arrays passed to `applyDamageWithType()` with `type = 'fire'`, `rawDamage = 10`
- **THEN** `modifier` is `'resistant'` and `effectiveDamage` is `5`

#### Scenario: Immunity from active effect wins over permanent resistance

- **WHEN** merged immunities contains `'cold'` (from active effect) and merged resistances also contains `'cold'` (permanent)
- **WHEN** `applyDamageWithType()` called with `type = 'cold'`, `rawDamage = 10`
- **THEN** `modifier` is `'immune'` and `effectiveDamage` is `0`

---

### Requirement: `CreatureStatsForm` resistance fields use constrained tag picker

The `damageResistances`, `damageImmunities`, and `damageVulnerabilities` fields in `CreatureStatsForm` SHALL render as a multi-select tag picker sourced from `DAMAGE_TYPES`, replacing the current free-text textarea.

#### Scenario: Only canonical types can be selected

- **WHEN** a user edits damage resistances in `CreatureStatsForm`
- **THEN** only the 13 canonical `DAMAGE_TYPES` values are selectable
- **THEN** no freeform text input is available

#### Scenario: Existing valid values are pre-selected

- **WHEN** a `CreatureStats` object with `damageResistances: ['fire', 'cold']` is loaded into the form
- **THEN** `fire` and `cold` are shown as selected tags
