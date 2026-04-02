## ADDED Requirements

### Requirement: HP history entry recorded before every HP change

Before applying any HP-affecting operation (damage, healing, or temp HP grant) to a combatant, the system SHALL record a history entry capturing the combatant's `hp` and `tempHp` values at that moment (a pre-change snapshot).

The history SHALL be stored in localStorage under the key `hp-history:<combatId>` as a map of `combatantId → HpHistoryEntry[]`.

Each `HpHistoryEntry` SHALL contain:
- `hp`: the combatant's `hp` before the change
- `tempHp`: the combatant's `tempHp` before the change (default `0` if undefined)
- `type`: one of `'damage' | 'healing' | 'tempHp'`
- `amount`: the raw input amount (for display purposes only)
- `timestamp`: `Date.now()` at the time of the operation

#### Scenario: Damage records snapshot before hp/tempHp are updated

- **WHEN** damage is applied to a combatant with `hp = 30`, `tempHp = 5`
- **THEN** a history entry `{ hp: 30, tempHp: 5, type: 'damage', amount: <input>, timestamp: <now> }` is pushed to the combatant's history stack before `hp`/`tempHp` are modified

#### Scenario: Healing records snapshot before hp is updated

- **WHEN** healing is applied to a combatant with `hp = 20`, `tempHp = 0`
- **THEN** a history entry `{ hp: 20, tempHp: 0, type: 'healing', amount: <input>, timestamp: <now> }` is pushed before `hp` is modified

#### Scenario: Temp HP grant records snapshot before tempHp is updated

- **WHEN** temp HP is granted to a combatant with `hp = 25`, `tempHp = 3`
- **THEN** a history entry `{ hp: 25, tempHp: 3, type: 'tempHp', amount: <input>, timestamp: <now> }` is pushed before `tempHp` is modified

---

### Requirement: History stack capped at 10 entries per combatant

The history stack for each combatant SHALL hold at most 10 entries. When a new entry is pushed and the stack already contains 10 entries, the oldest entry SHALL be discarded (FIFO overflow) before the new entry is added.

#### Scenario: 11th push discards oldest entry

- **GIVEN** a combatant whose history stack already contains 10 entries
- **WHEN** an 11th HP change is applied
- **THEN** the oldest (first) entry is removed and the new entry is appended, keeping the stack at 10 entries

---

### Requirement: Undo restores the most recent pre-change snapshot

When a DM triggers undo for a combatant, the system SHALL:
1. Pop the most recent `HpHistoryEntry` from that combatant's stack.
2. Restore `CombatantState.hp` and `CombatantState.tempHp` to the values in the popped entry.
3. Persist the updated `CombatantState` (localStorage + API PUT).
4. Update the localStorage history map (entry removed).

The undo SHALL NOT record a new history entry for itself (undoing is not itself undoable).

#### Scenario: Undo after damage restores previous hp and tempHp

- **GIVEN** a combatant whose last history entry is `{ hp: 30, tempHp: 5 }`
- **WHEN** the DM triggers undo
- **THEN** the combatant's `hp` is set to `30` and `tempHp` to `5`
- **THEN** the history entry is removed from the stack
- **THEN** no new history entry is added

#### Scenario: Undo is unavailable when history stack is empty

- **GIVEN** a combatant with an empty history stack
- **WHEN** the context menu is opened
- **THEN** the "Undo HP Change" menu item is disabled (not hidden)

---

### Requirement: Undo accessible via combatant context menu

Each combatant row SHALL expose an "Undo HP Change" action in its context menu. The item SHALL be enabled only when the combatant's history stack is non-empty.

#### Scenario: Context menu shows enabled undo when history exists

- **GIVEN** a combatant with one or more history entries
- **WHEN** the DM opens the combatant context menu
- **THEN** "Undo HP Change" is present and enabled

#### Scenario: Context menu shows disabled undo when history is empty

- **GIVEN** a combatant with no history entries
- **WHEN** the DM opens the combatant context menu
- **THEN** "Undo HP Change" is present but disabled

---

### Requirement: History cleared when combat ends

When `CombatState.isActive` transitions to `false` (combat ended), the system SHALL remove the `hp-history:<combatId>` key from localStorage for that combat.

#### Scenario: Ending combat clears history

- **GIVEN** combat is active and one or more combatants have history entries
- **WHEN** combat ends (`isActive` becomes `false`)
- **THEN** the `hp-history:<combatId>` localStorage entry is deleted
- **THEN** all combatant undo stacks are empty

---

### Requirement: History isolated per combat session

History SHALL be keyed by `combatId`. Starting a new combat SHALL result in a fresh, empty history map. History from a previous combat SHALL NOT carry over.

#### Scenario: New combat has no history

- **GIVEN** a previous combat's history exists in localStorage
- **WHEN** a new combat session starts with a different `combatId`
- **THEN** the new combat's history map is empty
- **THEN** the previous combat's history key remains in localStorage until that combat ends
