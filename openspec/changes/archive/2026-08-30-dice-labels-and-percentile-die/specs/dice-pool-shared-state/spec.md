## MODIFIED Requirements

### Requirement: MODIFIED Shared dice-pool selection state usable by any trigger UI

The system SHALL provide a single `lib/dice/useDicePoolState.ts` module exposing pool selection state (staged count per die size, shared modifier, `poolTotal`, open/close state for a panel keyed to a trigger/panel ref pair, a `buildRoll()` function producing `{formula, rolls, total}` from the current pool via the existing `rollDicePool`, `buildPoolFormula`, and `getActiveDiceGroups` utilities, **and a `buildPercentileRoll()` function producing `{formula, rolls, total}` for a standalone percentile roll**), used identically by both the chat-docked dice panel and `GlobalDiceFab`, replacing the two independent copies of this state machine that exist today.

`buildPercentileRoll()` SHALL delegate to the centralized `rollPercentile()` helper (see `dice-rolling` capability) and return `{ formula: "d%", rolls: [value], total: value }` where `value` is the decoded percentile result (1..100). It SHALL NOT read the staged pool or the shared modifier.

#### Scenario: Both consumers observe identical pool-selection behavior

- **Given** the chat-docked dice panel and `GlobalDiceFab`'s modal both use `useDicePoolState`
- **When** a die is added, removed, or the modifier is edited in either surface's own instance of the hook
- **Then** the staged counts, clamping to `MAX_PER_DIE`, modifier clamping to `MAX_MODIFIER`, and `poolTotal` computation behave identically in both surfaces, because both call the same shared implementation

#### Scenario: Pool state is local to each mounted instance

- **Given** the chat-docked panel and `GlobalDiceFab`'s modal are both mounted on the same page
- **When** the user stages dice in one surface
- **Then** the other surface's staged pool is unaffected (each call to `useDicePoolState` owns its own independent React state)

#### Scenario: buildRoll produces no network request

- **Given** a non-empty staged pool
- **When** `buildRoll()` is called
- **Then** it returns `{formula, rolls, total}` computed purely client-side via `rollDicePool`, with no HTTP request issued

#### Scenario: buildPercentileRoll produces a decoded percentile result independent of the pool

- **Given** any staged pool contents and any modifier value
- **When** `buildPercentileRoll()` is called
- **Then** it returns `{ formula: "d%", rolls: [value], total: value }` with a single integer `value` in 1..100 equal to `total`, computed client-side via `rollPercentile()`, with no HTTP request issued and no change to the staged pool or modifier
