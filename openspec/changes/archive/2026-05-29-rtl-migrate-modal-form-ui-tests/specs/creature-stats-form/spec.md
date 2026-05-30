# Capability: CreatureStatsForm Test Migration

Covers `tests/unit/components/CreatureStatsForm.test.tsx` — migration to RTL. Existing tests cover only the resistances/immunities/vulnerabilities subsection. Structure may change; coverage must be maintained or improved.

## MODIFIED Requirements

### Requirement: MODIFIED CreatureStatsForm.test.tsx uses RTL APIs with `within()` scoping

The system SHALL test `CreatureStatsForm`'s resistances section using `@testing-library/react`, `@testing-library/user-event`, and `within()` for disambiguation of repeated checkbox names across the three damage groups (Vulnerabilities, Resistances, Immunities).

#### Scenario: Resistances section is collapsed by default

- **Given** `CreatureStatsForm` is rendered with `BASE_STATS` (no pre-set resistances)
- **When** the component mounts
- **Then** no checkboxes are present in the document (`screen.queryAllByRole('checkbox')` returns `[]`)

#### Scenario: Clicking the Resistances & Immunities toggle expands the section

- **Given** `CreatureStatsForm` is rendered and `userEvent.setup()` is available
- **When** the user clicks `screen.getByRole('button', { name: /resistances/i })`
- **Then** checkboxes appear — 39 total (3 fields × 13 damage types)

#### Scenario: All checkboxes are unchecked when no resistances are set

- **Given** the resistances section is expanded with `BASE_STATS`
- **When** the component renders
- **Then** `screen.getAllByRole('checkbox')` returns 39 elements, all unchecked

#### Scenario: Pre-selected resistances render as checked

- **Given** `stats` includes `damageResistances: ['fire', 'cold']`
- **When** the resistances section is expanded
- **Then** exactly 2 checkboxes are checked across the entire form
- **Then** within the "Damage Resistances" section, the "fire" and "cold" checkboxes are checked

#### Scenario: Checking an unchecked resistance calls onChange with type added

- **Given** the resistances section is expanded with `BASE_STATS` and `userEvent.setup()`
- **When** the user clicks the "fire" checkbox within the "Damage Resistances" section (scoped via `within()`)
- **Then** `onChange` is called once
- **Then** the argument's `damageResistances` array contains `'fire'`

#### Scenario: Unchecking a checked resistance calls onChange with type removed

- **Given** `stats` includes `damageResistances: ['fire']`, section is expanded, `userEvent.setup()`
- **When** the user clicks the checked "fire" checkbox in the resistances section
- **Then** `onChange` is called once
- **Then** the argument's `damageResistances` is falsy (undefined or empty)

#### Scenario: Checking an immunity type calls onChange with damageImmunities updated

- **Given** the resistances section is expanded with `BASE_STATS` and `userEvent.setup()`
- **When** the user clicks "poison" within the "Damage Immunities" section (scoped via `within()`)
- **Then** `onChange` is called once
- **Then** the argument's `damageImmunities` array contains `'poison'`

#### Scenario: Removing the last type from a field sets field to undefined

- **Given** `stats` includes `damageVulnerabilities: ['cold']`, section is expanded, `userEvent.setup()`
- **When** the user unchecks "cold" in the "Damage Vulnerabilities" section
- **Then** `onChange` is called once
- **Then** the argument's `damageVulnerabilities` is `undefined`

## REMOVED Requirements

### Requirement: REMOVED legacy `createRoot`/`Root`/`act` pattern in CreatureStatsForm.test.tsx

Reason for removal: RTL handles rendering and cleanup automatically.

### Requirement: REMOVED DOM-walking label traversal for checkbox discovery

Reason for removal: `within()` scoping on the section container is the RTL-idiomatic replacement. The old approach walked the DOM via `parentElement`, `querySelectorAll('label')`, and text matching — fragile and verbose.

## Traceability

- Proposal: "Migrate `CreatureStatsForm.test.tsx`; structure may change; `within()` for scoping" → Requirement above
- Design decision 3 (`within()` scoping) → All checkbox interaction scenarios
- Design decision 2 (`userEvent.setup()` per test) → All interaction scenarios
- Design decision 4 (query strategy: `getByRole('button')` for toggle, `within().getByRole('checkbox')` for checkboxes) → All scenarios
- Requirement → Task: "Migrate CreatureStatsForm.test.tsx"

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: No banned legacy imports remain

- **Given** `CreatureStatsForm.test.tsx` has been migrated
- **When** `grep -E "createRoot|IS_REACT_ACT_ENVIRONMENT|parentElement|querySelectorAll" tests/unit/components/CreatureStatsForm.test.tsx` is run
- **Then** the output is empty

#### Scenario: `within()` scoping is documented

- **Given** the file uses `within()` to scope checkbox queries to a section
- **When** the section-targeting code is reviewed
- **Then** a single comment explains the DOM dependency (e.g. "scoped by section label text — tied to CreatureStatsForm DOM structure")
