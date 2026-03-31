## ADDED Requirements

### Requirement: Canonical damage type constant and union type

The system SHALL define a `DAMAGE_TYPES` constant in `lib/constants.ts` containing all 13 canonical D&D 5e damage types, and a `DamageType` union type derived from it. The 13 types are: `acid`, `bludgeoning`, `cold`, `fire`, `force`, `lightning`, `necrotic`, `piercing`, `poison`, `psychic`, `radiant`, `slashing`, `thunder`.

#### Scenario: DAMAGE_TYPES is exhaustive and ordered

- **WHEN** `DAMAGE_TYPES` is imported
- **THEN** it contains exactly 13 entries: acid, bludgeoning, cold, fire, force, lightning, necrotic, piercing, poison, psychic, radiant, slashing, thunder
- **THEN** `DamageType` is a union of those 13 string literals

#### Scenario: Type enforcement at compile time

- **WHEN** code assigns a string not in `DAMAGE_TYPES` to a `DamageType` field
- **THEN** TypeScript compilation fails with a type error

---

### Requirement: `CreatureStats` resistance fields use `DamageType[]`

The `damageResistances`, `damageImmunities`, and `damageVulnerabilities` fields on `CreatureStats` SHALL be typed as `DamageType[]` (not `string[]`). `conditionImmunities` remains `string[]` as condition names are not part of this type system.

#### Scenario: Valid resistance entry compiles

- **WHEN** a `CreatureStats` object is constructed with `damageResistances: ['fire', 'cold']`
- **THEN** TypeScript compilation succeeds

#### Scenario: Invalid resistance entry fails compilation

- **WHEN** a `CreatureStats` object is constructed with `damageResistances: ['from nonmagical attacks']`
- **THEN** TypeScript compilation fails

---

### Requirement: SRD monster data uses only canonical type strings

All entries in `lib/data/srd-monsters.ts` `damageResistances`, `damageImmunities`, and `damageVulnerabilities` arrays SHALL contain only values from `DAMAGE_TYPES`. Freeform qualifier strings (`'from nonmagical attacks'`, `'nonmagical bludgeoning'`, `"that aren't adamantine"`) SHALL be removed.

#### Scenario: All SRD resistance arrays contain valid types only

- **WHEN** all `damageResistances`, `damageImmunities`, `damageVulnerabilities` values in `srd-monsters.ts` are checked against `DAMAGE_TYPES`
- **THEN** every value is a member of `DAMAGE_TYPES`
- **THEN** no sentinel strings (`'from nonmagical attacks'`, `'nonmagical bludgeoning'`, `"that aren't adamantine"`) remain

---

### Requirement: Resistance fields propagate through combatant builders

When constructing a `CombatantState` from a `Character`, `Monster`, or library item, the system SHALL copy `damageResistances`, `damageImmunities`, `damageVulnerabilities`, and `conditionImmunities` from the source object.

#### Scenario: Monster combatant inherits resistances

- **WHEN** a monster with `damageImmunities: ['fire']` is added to combat
- **THEN** the resulting `CombatantState` has `damageImmunities: ['fire']`

#### Scenario: Player character combatant inherits resistances

- **WHEN** a character with `damageResistances: ['poison']` is added to combat
- **THEN** the resulting `CombatantState` has `damageResistances: ['poison']`

#### Scenario: Combatant with no resistances has empty or undefined arrays

- **WHEN** a combatant source has no `damageResistances` defined
- **THEN** the resulting `CombatantState` has `damageResistances` as `undefined` or `[]`
