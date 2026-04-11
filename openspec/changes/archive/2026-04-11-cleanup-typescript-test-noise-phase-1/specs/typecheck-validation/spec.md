## ADDED Requirements

This document details *changes* to requirements and is additive to the
`design.md` document, not a replacement.

### Requirement: ADDED phase-bounded typecheck cleanup

The system SHALL allow the phase 1 cleanup to remove the non-D&D typecheck
failures without requiring the D&D Beyond fixture-contract failures to be solved
in the same change.

#### Scenario: Non-D&D failures are removed from the repo-wide typecheck

- **Given** the repository contains the phase 1 cleanup changes
- **When** `npx tsc --noEmit` is run from the project root
- **Then** TypeScript no longer reports failures from
  `tests/unit/combat/conditionExpiry.test.ts`,
  `tests/unit/combat/damageResistance.test.ts`,
  `tests/unit/helpers/route.test.helpers.ts`,
  `tests/unit/import/characterImportRoute.test.ts`,
  `tests/unit/import/charactersPageImport.test.ts`,
  `tests/unit/import/dndBeyondCharacterServer.test.ts`, or
  `tests/integration/monsterUpload.test.ts`

#### Scenario: Remaining D&D Beyond failures do not block phase 1 scope

- **Given** D&D Beyond fixture-contract failures remain tracked in #138
- **When** the phase 1 change is reviewed
- **Then** those D&D Beyond failures are treated as out of scope for this change
- **And** the change is evaluated against the non-D&D failure set only

## MODIFIED Requirements

### Requirement: MODIFIED test fixtures and helpers must match current exported contracts

The system SHALL keep the affected non-D&D tests and test helpers aligned with
the current exported application types and platform contracts.

#### Scenario: Combat tests use current combatant and damage-effect shapes

- **Given** the combat tests construct `CombatantState` and
  `ActiveDamageEffect` fixtures
- **When** the tests are typechecked
- **Then** those fixtures use the current property names, required fields, and
  argument ordering from the exported combat contracts

#### Scenario: Helper and import tests use current auth, async, env, and response patterns

- **Given** the touched route/import/helper tests rely on `AuthPayload`,
  handler wrappers, `process.env`, optional properties, and mocked responses
- **When** the tests are typechecked
- **Then** auth mocks satisfy the current auth contract
- **And** handler helper wrappers return the async shape their callers expect
- **And** env overrides avoid direct read-only mutations
- **And** optional properties are narrowed before assertion
- **And** mocked `Response` objects use a type-safe pattern

## REMOVED Requirements

### Requirement: REMOVED tolerance for stale non-D&D test typing drift

Reason for removal:
The repo should no longer tolerate known stale non-D&D test fixtures and helper
patterns that obscure TypeScript regressions unrelated to current work.

#### Scenario: Legacy stale test patterns are no longer accepted in phase 1 files

- **Given** one of the phase 1 files uses a removed property name, mismatched
  helper signature, unsafe env mutation, or unsafe optional-property assertion
- **When** `npx tsc --noEmit` is run
- **Then** the file is treated as a failure until it matches the current
  contract rather than being excused as pre-existing noise

## Traceability

- Proposal element -> Requirement:
  remove non-D&D noise first -> ADDED phase-bounded typecheck cleanup
- Design decision -> Requirement:
  Decision 1 and Decision 3 -> MODIFIED test fixtures and helpers must match
  current exported contracts
- Design decision -> Requirement:
  Decision 2 -> ADDED phase-bounded typecheck cleanup
- Requirement -> Task(s):
  ADDED/MODIFIED/REMOVED requirements -> tasks 3.1 through 4.2 in `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **Given** the phase 1 change updates only tests and test helpers
- **When** `npx tsc --noEmit` and the targeted suites are run
- **Then** the change does not introduce new production runtime work
- **And** any validation cost increase is limited to the normal cost of the
  touched tests compiling and running

### Requirement: Security

#### Scenario: Access control

- **Given** phase 1 modifies only tests and test helpers
- **When** auth-related test fixtures are updated
- **Then** the change aligns them to the current exported auth contract
- **And** does not weaken production auth enforcement or route behavior

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a maintainer runs repo-wide typecheck after phase 1
- **When** a failure remains
- **Then** the remaining failure set should be materially smaller and easier to
  attribute
- **And** D&D Beyond fixture-related failures can be routed to #138 without
  ambiguity
