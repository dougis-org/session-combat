## Context

HP changes in combat flow through pure utility functions in `lib/utils/combat.ts` (`applyDamage`, `applyHealing`, `applyDamageWithResistances`). Results are written back to `CombatantState.hp` / `CombatantState.tempHp` and synced to the API via PUT `/api/combat/[id]`. `clientStorage.saveCombatState` mirrors the full `CombatState` to localStorage after every change.

There is no existing history, undo mechanism, or event log. The undo history must be client-only — it should never reach the API database.

## Goals / Non-Goals

**Goals:**
- Per-combatant HP undo via the combatant context menu.
- History survives page refresh (localStorage, isolated from the API payload).
- History resets when combat ends (`isActive → false`).
- Max 10 entries per combatant; oldest entry dropped on overflow.

**Non-Goals:**
- Multi-level undo / redo navigation.
- Undo of non-HP state (conditions, initiative, etc.).
- Exposing history to players.
- Server-side history persistence.

## Decisions

### 1. Store history in a dedicated localStorage key, not inside `CombatantState`

Use a separate localStorage key `hp-history:<combatId>` containing a `Record<combatantId, HpHistoryEntry[]>` map. This key is written by `lib/utils/hpHistory.ts` and is never included in the API PUT payload.

Alternatives considered:
- Attach to `CombatantState` and strip before API PUT → stripping is easy to forget when new PUT paths are added; boundary is implicit.
- In-memory React state only → lost on page refresh, violates the persistence requirement.

Testability: `hpHistory.ts` functions can be tested in isolation by mocking `localStorage`. No API interaction required.

### 2. Store HP snapshots, not deltas

Each `HpHistoryEntry` records the full `{ hp, tempHp }` **before** the change, plus `type`, `amount` (raw input, display only), and `timestamp`.

Alternatives considered:
- Store the delta and replay → delta replay is O(n) and fails for damage-with-resistance where effective damage differs from raw input; snapshots are O(1) restore and always exact.

Testability: Pop an entry, assert restored `hp`/`tempHp` match the snapshot values exactly.

### 3. Context menu, not an inline button

Undo is accessed via the existing combatant context menu. The combatant row is already information-dense; undo is an infrequent error-correction action.

Testability: Render the context menu for a combatant with and without history; assert the item's enabled/disabled state.

### 4. History helpers in `lib/utils/hpHistory.ts`

Encapsulate all history read/write/clear logic in a new module. Components and combat handlers import `pushHpHistory`, `popHpHistory`, `getHpHistoryStack`, `clearCombatHistory` — no direct localStorage access outside this module.

Testability: Each function is a pure localStorage operation; unit tested independently of the combat page.

### 5. `HpHistoryEntry` and history map are standalone types — not added to `CombatantState`

History is client-only UI state. Embedding optional fields on `CombatantState` would blur the server/client boundary. The history map is keyed by combatant ID and accessed only through `hpHistory.ts`.

Testability: TypeScript compiler enforces the boundary; `CombatantState` serialization tests will continue to pass without change.

## Architecture Sketch

```
Combat UI (combatant context menu)
        │
        │ "Undo HP Change"
        ▼
  undoHpChange(combatantId)          ← handler in app/combat/page.tsx
        │
        ├─ popHpHistory(combatId, combatantId)   ← lib/utils/hpHistory.ts
        │       └─ reads/writes  localStorage "hp-history:<combatId>"
        │
        └─ updates CombatantState.hp + .tempHp
                └─ saveCombatState() + API PUT (existing path)

Every HP-mutating action:
  handler in app/combat/page.tsx
        ├─ pushHpHistory(combatId, combatantId, { hp: prev, tempHp: prev })
        └─ calcApplyDamage / calcApplyHealing / calcSetTempHp / calcApplyDamageWithType
```

## Data Model

```typescript
// lib/types.ts (new)
export interface HpHistoryEntry {
  hp: number;
  tempHp: number;       // snapshot before the change
  type: 'damage' | 'healing' | 'tempHp';
  amount: number;       // raw input amount (display only)
  timestamp: number;    // Date.now()
}

// localStorage key: `hp-history:${combatId}`
// value: Record<combatantId, HpHistoryEntry[]>  (max 10 per combatant, LIFO)
```

## Risks / Trade-offs

- **localStorage quota**: Negligible — 10 entries × combatant count × small JSON objects.
- **Stale history after external edit**: If combat state is patched externally, a local undo restores a stale snapshot. Mitigated by clearing history when combat state is fetched fresh from the server.
- **Context menu discoverability**: DMs may not find undo on first use. Acceptable for MVP; a tooltip or keyboard shortcut can be added later.

## Rollback / Mitigation

- **Rollback**: Remove the `hpHistory.ts` module, its call sites in `page.tsx`, and the context menu item. The `hp-history:*` localStorage keys become orphaned and harmless; they will be ignored by the application and will eventually be evicted by the browser.
- **If CI blocks**: Fix the failing check before merging. Do not disable or bypass CI. If a check cannot be fixed, open a separate issue and block the merge until resolved.
- **If review blocks**: Address every comment with targeted follow-up commits. Do not merge with unresolved blocking comments.

## Open Questions

No open questions remain. All decisions from the proposal have been resolved and mapped to design decisions above.

## Proposal-to-Design Mapping

- Per-combatant history stack → Decision 4: `lib/utils/hpHistory.ts` module; Decision 5: standalone types not on `CombatantState`.
- Captures damage, healing, temp HP → Decision 2: snapshot-based entries; wired at call sites in `app/combat/page.tsx`.
- Context menu undo → Decision 3: context menu item enabled/disabled by `getHpHistoryStack().length`.
- localStorage persistence, keyed by combatId → Decision 1: dedicated `hp-history:<combatId>` key.
- History cleared when combat ends → `clearCombatHistory(combatId)` called in the end-combat handler.
- Cap at 10 entries → enforced in `pushHpHistory` (FIFO overflow).

## Operational Blocking Policy

If CI, review, or security checks block the change, pause and fix before proceeding. Do not widen scope to unrelated combat behavior. If a blocker cannot be resolved within the change, open a separate issue and remove the blocking code from this PR.
