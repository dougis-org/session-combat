---
name: tests
description: Tests for the decompose-combat-page change
---

# Tests

## Overview

All work follows strict TDD: write a failing test first, make it pass with the simplest code, then refactor. Each test case maps to a task in `tasks.md` and a scenario in `specs/combat-decomposition.md`.

---

## Test Cases

### `tests/unit/hooks/useCombat.test.ts` (new file — Task T9)

All hook tests use `renderHook` from `@testing-library/react` or equivalent, with `fetch` mocked globally.

#### Initial state (maps to spec: "Hook returns correct initial state before data loads")

- [ ] **T9-1:** Before fetch resolves, `result.current.loading === true`, `result.current.combatState === null`, `result.current.encounters.length === 0`, `result.current.characters.length === 0`, `result.current.parties.length === 0`
  - Fail: hook returns `loading: false` prematurely
  - Pass: hook initialises with `loading: true` and null/empty values

#### Data load success (maps to spec: "Hook populates data after successful fetch")

- [ ] **T9-2:** After all five fetch mocks resolve successfully, `loading === false` and `encounters`, `characters`, `parties`, `monsterTemplates` match the mock responses
  - Fail: data not populated or `loading` still `true`
  - Pass: hook state matches mocked API responses after async resolution

#### Fetch error handling

- [ ] **T9-3:** When any fetch returns `ok: false`, `error` is set to a non-null string and `loading` becomes `false`
  - Fail: error state not set
  - Pass: `error` is populated, `loading` is `false`

#### `addCombatantToSetup` + ref sync (maps to spec: "Hook exposes `setupCombatants` and ref stays in sync")

- [ ] **T9-4:** After calling `addCombatantToSetup(combatantFixture)`, `setupCombatants` contains the combatant; subsequent call to `addCombatantFromLibrary` with the same base name before re-render detects the duplicate via internal ref
  - Fail: duplicate detection misses the first combatant (stale state)
  - Pass: internal ref is updated synchronously, duplicate detected

#### Duplicate name detection without stale closure (maps to spec: "Duplicate combatant names detected without stale closure")

- [ ] **T9-5:** Add "Goblin" via `addCombatantToSetup`, then immediately call `addCombatantFromLibrary` with a source named "Goblin" (no intermediate re-render). Assert `setupCombatants` contains "Goblin 1" and "Goblin 2"
  - Fail: second Goblin added without renaming (ref stale)
  - Pass: both combatants renamed sequentially

#### `confirmAddLair` — setup phase (maps to spec: "confirmAddLair in setup phase adds to staging list")

- [ ] **T9-6:** With `combatState === null`, set `lairFormName: "Dragon Lair"`, call `confirmAddLair()`. Assert `setupCombatants` gains a lair-type combatant named "Dragon Lair" AND `showLairForm` becomes `false` AND `lairFormName` becomes `''`
  - Fail: lair not added, or form state not cleared
  - Pass: staging list and form state updated correctly

#### `confirmAddLair` — active phase (maps to spec: "confirmAddLair in active phase adds to live combat and saves")

- [ ] **T9-7:** With `combatState` set to an active combat, `lairFormName: "Cave Lair"`, call `confirmAddLair()`. Assert `fetch` (POST `/api/combat`) is called with the combatant list containing the new lair slot AND `showLairForm` becomes `false`
  - Fail: no POST made or wrong combatant list
  - Pass: POST made with correct payload

#### `addCombatantFromLibrary` — setup routing (maps to spec: "addCombatantFromLibrary routes to setup when no active combat")

- [ ] **T9-8:** With `combatState === null`, call `addCombatantFromLibrary(monsterSource, 'monster', 'monster')`. Assert `setupCombatants` gains the combatant AND no POST to `/api/combat` is made
  - Fail: POST made or combatant not in `setupCombatants`
  - Pass: combatant in staging list, no network call

#### `addCombatantFromLibrary` — active routing (maps to spec: "addCombatantFromLibrary routes to active session when combat is running")

- [ ] **T9-9:** With `combatState` set to active combat, call `addCombatantFromLibrary(monsterSource, 'monster', 'monster')`. Assert POST to `/api/combat` is made with the monster appended
  - Fail: no POST or wrong endpoint
  - Pass: POST made with updated combatant list

#### `startCombat` transitions to active state

- [ ] **T9-10:** With `combatState === null` and `characters` populated, call `startCombat()`. Assert POST to `/api/combat` is made with `isActive: true` and `currentRound: 1`
  - Fail: no POST or state not active
  - Pass: POST made with correct new `CombatState`

#### `endCombat` resets state (mocked `window.confirm = () => true`)

- [ ] **T9-11:** With active `combatState`, call `endCombat()`. Assert `combatState` becomes `null` and `setupCombatants` becomes `[]`
  - Fail: state not cleared
  - Pass: state reset after confirm

#### `nextTurn` — mid-round advancement

- [ ] **T9-12:** With active combat, `currentTurnIndex: 0`, `combatants.length === 3`, call `nextTurn()`. Assert POST made with `currentTurnIndex: 1`, `currentRound: 1`
  - Fail: index not incremented or wrong round
  - Pass: index advances, round unchanged

#### `nextTurn` — round wrap

- [ ] **T9-13:** With active combat, `currentTurnIndex` at last combatant index, call `nextTurn()`. Assert POST made with `currentTurnIndex: 0` and `currentRound` incremented by 1
  - Fail: round not incremented or index not wrapped
  - Pass: round incremented, index reset to 0

#### `rollInitiative` — all non-lair combatants get rolled

- [ ] **T9-14:** With active combat containing 2 regular combatants and 1 lair slot, call `rollInitiative()`. Assert POST made where both regular combatants have `initiativeRoll` set (not null) and lair combatant is unchanged
  - Fail: lair combatant modified or regular combatants not rolled
  - Pass: only non-lair combatants have `initiativeRoll`

#### `updateCombatant` patches combatant and saves

- [ ] **T9-15:** With active `combatState`, call `updateCombatant('c1', { hp: 15 })`. Assert POST to `/api/combat` made where the target combatant has `hp: 15`
  - Fail: wrong combatant updated or no POST
  - Pass: correct combatant patched

---

### `tests/unit/components/CombatantCard.test.tsx` (enhanced — Tasks T3, T10)

All existing tests continue to pass. New tests added:

#### New import path (maps to spec: "CombatantCard renders at its new path")

- [ ] **T3-1:** Import `CombatantCard` from `@/lib/components/CombatantCard`; render with base fixture; assert combatant name visible
  - Fail: module not found or render error
  - Pass: component renders from new path

#### HP damage triggers `onUpdate` (maps to spec: "HP adjustment triggers onUpdate callback")

- [ ] **T10-1:** Render with `hp: 30`, apply damage of 10; assert `onUpdate` called with `{ hp: 20 }`
  - Fail: `onUpdate` not called or wrong value
  - Pass: callback receives correct HP

#### Undo button appears after damage (maps to spec: "Undo button enabled after damage")

- [ ] **T10-2:** Apply damage to push HP history; assert Undo button is rendered and not disabled
  - Fail: Undo button absent or disabled
  - Pass: Undo button present and enabled

#### Undo restores HP (maps to spec: "Undo calls onUpdate with previous HP")

- [ ] **T10-3:** Push HP history, click Undo; assert `onUpdate` called with previous `{ hp, tempHp }` values
  - Fail: wrong HP values or callback not called
  - Pass: previous state restored

#### `onShowDetails` fires with position (maps to spec: "onShowDetails callback fires with position")

- [ ] **T10-4:** Click the details/stat block trigger button; assert `onShowDetails` called with `(combatantId, { top: expect.any(Number), left: expect.any(Number) })`
  - Fail: callback not called or position missing
  - Pass: callback fires with ID and position object

#### `onShowRemoveConfirm` fires (maps to spec: "onShowRemoveConfirm callback fires")

- [ ] **T10-5:** Click the Remove button; assert `onShowRemoveConfirm` called with `(combatantId, { top: expect.any(Number), left: expect.any(Number) })`
  - Fail: callback not called
  - Pass: callback fires with combatant ID

---

### `tests/unit/combat/initiativeEntry.test.tsx` (import update only — Task T4)

All existing tests continue to pass with the updated import path.

#### New import path (maps to spec: "InitiativeEntry renders at its new path")

- [ ] **T4-1:** Import `InitiativeEntry` from `@/lib/components/InitiativeEntry`; render with base combatant; assert no render error
  - Fail: module not found
  - Pass: component renders from new path

---

### `tests/unit/components/CombatSetupView.test.tsx` (new file — Task T6)

- [ ] **T6-1:** Render `CombatSetupView` with mock encounters and parties; assert encounter `<select>` and party `<select>` present in DOM (maps to spec: "CombatSetupView renders party and encounter selectors")
  - Fail: selectors not found
  - Pass: both selectors rendered

- [ ] **T6-2:** Render `CombatSetupView` with `characters: []`; assert Start Combat button has `disabled` attribute (maps to spec: "Start Combat button disabled with no characters")
  - Fail: button not disabled
  - Pass: button disabled

---

### `tests/unit/components/CombatantDetailPanel.test.tsx` (new file — Task T5)

- [ ] **T5-1:** Render `CombatantDetailPanel` with a combatant fixture and a `detailPosition`; assert combatant name is present in the DOM (maps to spec: "Panel renders combatant stat block")
  - Fail: name not found
  - Pass: name rendered

- [ ] **T5-2:** Click the × close button; assert `onClose` callback called (maps to spec: "Close button calls onClose")
  - Fail: callback not called
  - Pass: `onClose` invoked

---

### E2E — `tests/e2e/combat.spec.ts` (no modifications — Task T11)

- [ ] **T11-1:** Run full Playwright suite against `tests/e2e/combat.spec.ts`; assert all tests pass with zero modifications to the spec file
  - Fail: any test fails after refactor (indicates logic regression)
  - Pass: all 764-line spec tests green

---

## Traceability Matrix

| Test ID | Task | Spec Scenario |
|---------|------|---------------|
| T9-1 | T9 | Hook returns correct initial state before data loads |
| T9-2 | T9 | Hook populates data after successful fetch |
| T9-3 | T9 | (error path — non-functional reliability) |
| T9-4 | T9 | Hook exposes setupCombatants and ref stays in sync |
| T9-5 | T9 | Duplicate combatant names detected without stale closure |
| T9-6 | T9 | confirmAddLair in setup phase adds to staging list |
| T9-7 | T9 | confirmAddLair in active phase adds to live combat and saves |
| T9-8 | T9 | addCombatantFromLibrary routes to setup when no active combat |
| T9-9 | T9 | addCombatantFromLibrary routes to active session when combat is running |
| T9-10 | T9 | startCombat transitions to active state |
| T9-11 | T9 | endCombat resets state |
| T9-12 | T9 | nextTurn mid-round advancement |
| T9-13 | T9 | nextTurn round wrap |
| T9-14 | T9 | rollInitiative all non-lair combatants get rolled |
| T9-15 | T9 | updateCombatant patches combatant and saves |
| T3-1 | T3 | CombatantCard renders at its new path |
| T10-1 | T10 | HP adjustment triggers onUpdate callback |
| T10-2 | T10 | Undo button enabled after damage |
| T10-3 | T10 | Undo calls onUpdate with previous HP |
| T10-4 | T10 | onShowDetails callback fires with position |
| T10-5 | T10 | onShowRemoveConfirm callback fires |
| T4-1 | T4 | InitiativeEntry renders at its new path |
| T6-1 | T6 | CombatSetupView renders party and encounter selectors |
| T6-2 | T6 | Start Combat button disabled with no characters |
| T5-1 | T5 | Panel renders combatant stat block |
| T5-2 | T5 | Close button calls onClose |
| T11-1 | T11 | E2E combat tests unchanged |
