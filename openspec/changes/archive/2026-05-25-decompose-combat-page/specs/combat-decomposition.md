## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

---

### Requirement: ADDED `useCombat` hook encapsulates all combat state and handlers

The system SHALL provide a `useCombat` hook exported from `lib/hooks/useCombat.ts` that returns all combat server state, setup state, lair form state, derived values, and action handlers. No view component SHALL declare `useState` or `useEffect` for data fetching or combat logic.

#### Scenario: Hook returns correct initial state before data loads

- **Given** the hook is mounted inside a React tree with mocked fetch responses
- **When** the hook is first called
- **Then** `loading` is `true`, `combatState` is `null`, `encounters`, `characters`, `parties`, and `monsterTemplates` are empty arrays

#### Scenario: Hook populates data after successful fetch

- **Given** `fetch` is mocked to return one encounter, one character, one party, no active combat
- **When** the initial `useEffect` data load completes
- **Then** `loading` is `false`, `encounters.length === 1`, `characters.length === 1`, `parties.length === 1`, `combatState === null`

#### Scenario: Hook exposes `setupCombatants` and ref stays in sync

- **Given** the hook is mounted with `combatState === null`
- **When** `addCombatantToSetup` is called with a new combatant
- **Then** `setupCombatants` contains that combatant AND the internal ref contains the same combatant (observable via `addCombatantFromLibrary` duplicate detection)

#### Scenario: Duplicate combatant names detected without stale closure

- **Given** `addCombatantToSetup` has been called once with a combatant named "Goblin"
- **When** `addCombatantFromLibrary` is called with another source named "Goblin" before a re-render
- **Then** both combatants are renamed to "Goblin 1" and "Goblin 2" in `setupCombatants`

#### Scenario: `confirmAddLair` in setup phase adds to staging list

- **Given** `combatState === null`, `lairFormName === "Dragon Lair"`, `lairFormSeedMonster === ""`
- **When** `confirmAddLair` is called
- **Then** `setupCombatants` contains a new lair-type combatant with name "Dragon Lair" AND `showLairForm` becomes `false`

#### Scenario: `confirmAddLair` in active phase adds to live combat and saves

- **Given** `combatState` is a non-null active combat with existing combatants, `lairFormName === "Cave Lair"`, `showLairForm === true`
- **When** `confirmAddLair` is called
- **Then** a POST to `/api/combat` is made with the updated combatant list including the new lair slot, AND `showLairForm` becomes `false`

#### Scenario: `addCombatantFromLibrary` routes to setup when no active combat

- **Given** `combatState === null`
- **When** `addCombatantFromLibrary` is called with a monster source
- **Then** the combatant is appended to `setupCombatants` and `addCombatantToActiveSession` is NOT called

#### Scenario: `addCombatantFromLibrary` routes to active session when combat is running

- **Given** `combatState` is a non-null active combat
- **When** `addCombatantFromLibrary` is called with a monster source
- **Then** a POST to `/api/combat` is made with the monster added to `combatState.combatants`

---

### Requirement: ADDED `CombatantCard` lives in `lib/components/CombatantCard.tsx`

The system SHALL export `CombatantCard` from `lib/components/CombatantCard.tsx`. The component interface (props) SHALL be identical to the current definition in `app/combat/page.tsx`.

#### Scenario: CombatantCard renders at its new path

- **Given** a test imports `CombatantCard` from `@/lib/components/CombatantCard`
- **When** the component is rendered with valid props
- **Then** it renders the combatant's name and HP without error

#### Scenario: HP adjustment triggers `onUpdate` callback

- **Given** `CombatantCard` is rendered with a combatant at 30/30 HP
- **When** a damage amount of 10 is applied
- **Then** `onUpdate` is called with `{ hp: 20 }`

#### Scenario: Undo HP change via `popHpHistory`

- **Given** a damage event has been pushed to HP history for this combatant
- **When** the Undo button is clicked
- **Then** `onUpdate` is called with the previous HP values

---

### Requirement: ADDED `InitiativeEntry` lives in `lib/components/InitiativeEntry.tsx`

The system SHALL export `InitiativeEntry` from `lib/components/InitiativeEntry.tsx`. The component interface SHALL be identical to the current definition in `app/combat/page.tsx`.

#### Scenario: InitiativeEntry renders at its new path

- **Given** a test imports `InitiativeEntry` from `@/lib/components/InitiativeEntry`
- **When** the component is rendered with a combatant and `onSet` callback
- **Then** it renders without error and shows initiative entry controls

---

### Requirement: ADDED `CombatSetupView` renders setup-phase UI

The system SHALL provide a `CombatSetupView` component exported from `lib/components/CombatSetupView.tsx` that renders the encounter/party selection and combatant staging list. It SHALL accept the relevant state and handler props from `useCombat`.

#### Scenario: CombatSetupView renders party and encounter selectors

- **Given** `CombatSetupView` is rendered with mock encounters, parties, and empty `setupCombatants`
- **When** the component mounts
- **Then** an encounter `<select>` and a party `<select>` are present in the DOM

#### Scenario: Start Combat button disabled with no characters

- **Given** `CombatSetupView` is rendered with `characters` as empty array
- **When** the component mounts
- **Then** the "Start Combat" button is disabled

---

### Requirement: ADDED `ActiveCombatView` renders active-combat UI

The system SHALL provide an `ActiveCombatView` component exported from `lib/components/ActiveCombatView.tsx` that renders the initiative tracker, combatant list, and combat toolbar. It SHALL manage `initiativeEditId`, `initiativePanelRef`, and the scroll effect locally.

#### Scenario: ActiveCombatView renders combatant cards

- **Given** `ActiveCombatView` is rendered with an active `combatState` containing two combatants
- **When** the component mounts
- **Then** two combatant card elements are present in the DOM

#### Scenario: `initiativeEditId` scroll effect fires locally

- **Given** `initiativeEditId` is `null`
- **When** a combatant's "Set Initiative" button is clicked and `initiativeEditId` is set to that combatant's ID
- **Then** `scrollIntoView` is called on the initiative panel ref (verifiable via mock)

---

### Requirement: ADDED `CombatantDetailPanel` renders the combatant detail overlay

The system SHALL provide a `CombatantDetailPanel` component exported from `lib/components/CombatantDetailPanel.tsx` that renders the positioned detail overlay containing `CreatureStatBlock` and combatant summary fields.

#### Scenario: Panel renders combatant stat block

- **Given** `CombatantDetailPanel` is rendered with a combatant and a `detailPosition`
- **When** the component mounts
- **Then** the combatant's name is present and the `CreatureStatBlock` is rendered

#### Scenario: Close button calls `onClose`

- **Given** `CombatantDetailPanel` is rendered
- **When** the × button is clicked
- **Then** `onClose` is called

---

### Requirement: ADDED `app/combat/page.tsx` reduced to thin shell

The system SHALL reduce `app/combat/page.tsx` to a file of 30 lines or fewer containing only the default export `CombatPage` wrapping `CombatContent` in `ProtectedRoute`, and a `CombatContent` function that calls `useCombat` and composes the view components.

#### Scenario: page.tsx line count within limit

- **Given** the refactor is complete
- **When** `wc -l app/combat/page.tsx` is run
- **Then** the output is 30 or fewer

---

## MODIFIED Requirements

### Requirement: MODIFIED Unit test import paths for `CombatantCard` and `InitiativeEntry`

The system SHALL import `CombatantCard` from `@/lib/components/CombatantCard` and `InitiativeEntry` from `@/lib/components/InitiativeEntry` in all test files. Imports from `@/app/combat/page` for these components SHALL be removed.

#### Scenario: CombatantCard test suite passes with new import path

- **Given** `tests/unit/components/CombatantCard.test.tsx` imports from `@/lib/components/CombatantCard`
- **When** the Jest test suite runs
- **Then** all existing CombatantCard tests pass

#### Scenario: InitiativeEntry test suite passes with new import path

- **Given** `tests/unit/combat/initiativeEntry.test.tsx` imports from `@/lib/components/InitiativeEntry`
- **When** the Jest test suite runs
- **Then** all existing InitiativeEntry tests pass

---

## REMOVED Requirements

### Requirement: Keep `loadingTemplates` state

**Reason for keeping:** `loadingTemplates` is set in the data-loading `useEffect` and is consumed in JSX (passed as props to `QuickCombatantModal` and `LairForm`). It is active state and must be preserved by the `useCombat` hook.

---

## Traceability

- Proposal element "useCombat hook" → Requirement: ADDED `useCombat` hook
- Proposal element "setupCombatantsRef must travel with setupCombatants" → Scenario: Duplicate combatant names detected without stale closure
- Proposal element "dual-phase handlers" → Scenarios: `confirmAddLair` in setup phase / active phase; `addCombatantFromLibrary` routes
- Proposal element "lair form state co-locates with confirmAddLair" → Scenarios: `confirmAddLair` in setup / active phase
- Proposal element "unit test imports break" → Requirement: MODIFIED Unit test import paths
- Design Decision 1 → Requirement: ADDED `useCombat` hook
- Design Decision 2 → Scenario: `initiativeEditId` scroll effect fires locally
- Design Decision 3 → Scenario: Duplicate combatant names detected without stale closure
- Design Decision 4 → Requirement: Keep `loadingTemplates` state
- Design Decision 5 → Requirements: ADDED `CombatantCard`, `InitiativeEntry`, `CombatSetupView`, `ActiveCombatView`, `CombatantDetailPanel`
- Design Decision 6 → Requirement: MODIFIED Unit test import paths
- Requirement "useCombat hook" → Tasks: T1 (create hook), T2 (extract state), T3 (extract handlers)
- Requirement "CombatantCard moved" → Task: T4 (move component, update imports)
- Requirement "InitiativeEntry moved" → Task: T4 (move component, update imports)
- Requirement "CombatSetupView" → Task: T5 (extract setup view)
- Requirement "ActiveCombatView" → Task: T6 (extract active view)
- Requirement "CombatantDetailPanel" → Task: T7 (extract detail panel)
- Requirement "page.tsx thin shell" → Task: T8 (reduce page.tsx)

---

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: E2E combat tests unchanged

- **Given** the refactor is complete
- **When** `npx playwright test tests/e2e/combat.spec.ts` is run
- **Then** all tests pass with no modifications to the spec file

### Requirement: Operability (TypeScript)

#### Scenario: TypeScript compiles cleanly

- **Given** all new and modified files are complete
- **When** `npx tsc --noEmit` is run
- **Then** exit code is 0 with no new errors or `any` types introduced

### Requirement: Operability (bundle)

#### Scenario: No regression in page load path

- **Given** the refactor is complete
- **When** `next build` runs successfully
- **Then** build completes with no new warnings or errors related to the combat route
