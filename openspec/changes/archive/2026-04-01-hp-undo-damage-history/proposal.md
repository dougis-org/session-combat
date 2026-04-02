## Why

DMs frequently mistype HP values during fast-paced combat — entering 40 damage instead of 4, or healing the wrong combatant. There is currently no way to correct this without manually computing and entering the inverse value. An undo mechanism lets DMs recover from input errors without disrupting play.

## Problem Space

The current combat system has no concept of HP change history. Each HP mutation (damage, healing, temp HP grant) overwrites the previous value in place. When a DM makes an input error, the only correction path is to manually apply the reverse operation — which itself becomes another entry in the player's perception of events and can cause confusion.

The desired behavior is: every HP change is recoverable via a single undo action applied per combatant, scoped to the current combat session.

## What Changes

- Add a per-combatant HP change history stack (damage, healing, and temp HP grants).
- Expose an "Undo HP Change" action in each combatant's context menu.
- Undo restores the combatant's `hp` and `tempHp` to the values they held immediately before the most recent HP change.
- History is stored in localStorage, keyed per combat session, so it survives a page refresh.
- History is cleared when combat ends.
- History is capped at 10 entries per combatant.

## Capabilities

### New Capabilities

- `hp-undo-history`: Per-combatant HP change history tracking and undo. Covers the history data model, push/pop/clear operations, undo action, UI affordance (context menu), localStorage persistence, and reset on combat end.

### Modified Capabilities

- `temp-hp-tracking`: Temp HP grants must be captured in the history stack alongside regular HP changes so undo covers the full `hp`/`tempHp` state snapshot.

## Scope

In scope:

- Undoing the most recent HP change for any individual combatant
- Capturing all HP-affecting operations: damage, healing, temp HP grant, and damage-with-resistance/immunity/vulnerability
- History persisted in localStorage, keyed by `combatId`, surviving page refresh
- History cleared when `CombatState.isActive` transitions to `false`
- Undo accessible via the combatant context menu; disabled when history stack is empty

Out of scope:

- Multi-level undo or a redo stack
- Undo of non-HP state (conditions, initiative, legendary action pools, etc.)
- Exposing HP history to players
- Server-side persistence of history
- An audit log or damage history display panel

## Non-Goals

- Treating undo as an auditable event (undo itself is not logged to history)
- Cross-client undo sync in multi-DM sessions
- Configurable stack depth per user or session

## Risks

- Snapshot-based storage (not deltas) is necessary to correctly handle damage-with-resistance entries, where the effective damage differs from the raw input; deltas could misrepresent the actual state change.
- History scoped to localStorage means it is lost if the user clears browser storage mid-session; this is acceptable for an error-correction tool.
- A stale history entry could restore an incorrect value if the combat state was modified by an external source between the push and the undo. Mitigated by clearing history on reconnect/refetch.

## Open Questions

No open questions remain. Decisions confirmed:
1. **Persistence**: localStorage, not the API database. Survives page refresh.
2. **UI placement**: Context menu only (no inline button).
3. **Stack depth**: Fixed cap of 10 entries per combatant.

## Change Control

If scope changes after approval, `proposal.md`, `design.md`, `specs/`, and `tasks.md` must be updated before `/opsx:apply` proceeds. This proposal must be reviewed and explicitly approved before design, specs, tasks, or apply proceed.
