## MODIFIED Requirements

### Requirement: No duplicate E2E spec coverage
`tests/e2e/auth.spec.ts`, `tests/e2e/combat.spec.ts`, `tests/e2e/characters.spec.ts`, and `tests/e2e/parties.spec.ts` SHALL NOT test the same user scenarios. Each distinct scenario (such as "register page loads form" or "user can start a combat encounter") SHALL be owned by exactly one spec file. The recommended division of responsibilities is:
- `auth.spec.ts` — registration, login, logout, duplicate-email rejection
- `combat.spec.ts` — encounter creation, combat flow setup, legendary actions, lair actions, temp HP, end-to-end flow including character/party as prerequisites
- `characters.spec.ts` — character creation (including validation and field interactions), persistence, display, editing, and deletion
- `parties.spec.ts` — party creation (including validation and member state), persistence, display, editing, and deletion

Existing character and party creation tests in `combat.spec.ts` MAY remain as they serve a distinct purpose (verifying combat setup prerequisites) and SHALL NOT be removed solely to eliminate overlap. All *new* character and party coverage SHALL be added to `characters.spec.ts` and `parties.spec.ts` respectively.

#### Scenario: No test scenario covered by more than one spec file
- **WHEN** the spec files are audited
- **THEN** each distinct user scenario (e.g., "register page loads form") appears in exactly one spec file
- **AND** `characters.spec.ts` is the authoritative owner of character CRUD regression coverage
- **AND** `parties.spec.ts` is the authoritative owner of party CRUD regression coverage

#### Scenario: All previously covered scenarios still exist after new files are added
- **WHEN** `characters.spec.ts` and `parties.spec.ts` are added to `tests/e2e/`
- **THEN** all previously covered user scenarios in `auth.spec.ts` and `combat.spec.ts` are preserved
- **AND** no existing passing test is removed or modified

#### Scenario: New character or party coverage goes in the domain spec file
- **WHEN** a developer adds a new test for character creation, editing, or deletion
- **THEN** the test is placed in `tests/e2e/characters.spec.ts`
- **WHEN** a developer adds a new test for party creation, editing, or deletion
- **THEN** the test is placed in `tests/e2e/parties.spec.ts`
