## ADDED Requirements

### Requirement: SRD monster library is non-empty
`ALL_SRD_MONSTERS` exported from `lib/data/monsters/index.ts` SHALL contain at least 300 monsters. The empty-array workaround from commit `064c546` is permanently removed.

#### Scenario: Library exports monsters
- **WHEN** `ALL_SRD_MONSTERS` is imported from `lib/data/monsters`
- **THEN** its `length` SHALL be greater than 300

#### Scenario: Library covers all 14 creature categories
- **WHEN** the monster array is grouped by `type`
- **THEN** all 14 categories (aberration, beast, celestial, construct, dragon, elemental, fey, fiend, giant, humanoid, monstrosity, ooze, plant, undead) SHALL be represented

---

### Requirement: Every monster conforms to MonsterTemplate shape
Every entry in `ALL_SRD_MONSTERS` SHALL be a valid `MonsterTemplate` with correct types for all fields — no raw API format remnants.

#### Scenario: speed is a string
- **WHEN** any monster's `speed` field is inspected
- **THEN** it SHALL be of type `string` (not an object)
- **AND** it SHALL be non-empty

#### Scenario: abilityScores uses full key names
- **WHEN** any monster's `abilityScores` is inspected
- **THEN** it SHALL have all six keys: `strength`, `dexterity`, `constitution`, `intelligence`, `wisdom`, `charisma`
- **AND** no abbreviated key (`str`, `dex`, `con`, `int`, `wis`, `cha`) SHALL be present

#### Scenario: savingThrows uses full key names when present
- **WHEN** a monster has a `savingThrows` field
- **THEN** all keys SHALL be full names (`strength`, `dexterity`, `constitution`, `intelligence`, `wisdom`, `charisma`)
- **AND** no abbreviated key SHALL be present

#### Scenario: senses is a Record when present
- **WHEN** a monster has a `senses` field
- **THEN** it SHALL be a plain object (not a string)
- **AND** all values SHALL be strings

#### Scenario: maxHp is present and valid
- **WHEN** any monster's `maxHp` is inspected
- **THEN** it SHALL be a number greater than 0
- **AND** it SHALL be greater than or equal to `hp`

#### Scenario: size is lowercase
- **WHEN** any monster's `size` is inspected
- **THEN** it SHALL equal its own `.toLowerCase()` value
- **AND** it SHALL be one of: `tiny`, `small`, `medium`, `large`, `huge`, `gargantuan`

---

### Requirement: No forbidden extra fields on monster objects
Monster entries SHALL NOT contain fields that are not part of `MonsterTemplate` and were present in the deleted raw API format.

#### Scenario: armorType is absent
- **WHEN** any monster object is inspected
- **THEN** it SHALL NOT have an `armorType` property

#### Scenario: hitDice is absent
- **WHEN** any monster object is inspected
- **THEN** it SHALL NOT have a `hitDice` property

#### Scenario: hitPoints is absent
- **WHEN** any monster object is inspected
- **THEN** it SHALL NOT have a `hitPoints` property

---

### Requirement: Required MonsterTemplate fields are present on every monster
Every monster SHALL have all fields required by `MonsterTemplate` (excluding `id`, `userId`, `createdAt`, `updatedAt` which are assigned at seed time).

#### Scenario: Required fields present
- **WHEN** any monster in `ALL_SRD_MONSTERS` is inspected
- **THEN** it SHALL have non-empty values for: `name`, `size`, `type`, `ac`, `hp`, `maxHp`, `speed`, `abilityScores`, `challengeRating`

---

### Requirement: TypeScript compilation succeeds with monster library imported
The restored category files and updated `index.ts` SHALL compile with no TypeScript errors.

#### Scenario: Build passes
- **WHEN** `tsc --noEmit` is run against the project
- **THEN** it SHALL exit with code 0 with no errors in `lib/data/monsters/`

---

### Requirement: SRD monster seeding via admin action imports monsters
The `PUT /api/monsters/global` endpoint (admin "Import SRD Monsters" action) SHALL insert a non-zero count of monsters into the database.

#### Scenario: Import count is non-zero
- **WHEN** an admin triggers `PUT /api/monsters/global`
- **THEN** the response `count` field SHALL be greater than 0
- **AND** `total` SHALL equal `ALL_SRD_MONSTERS.length`
