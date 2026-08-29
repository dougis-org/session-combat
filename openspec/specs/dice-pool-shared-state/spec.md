## ADDED Requirements

### Requirement: ADDED Shared dice-pool selection state usable by any trigger UI

The system SHALL provide a single `lib/dice/useDicePoolState.ts` module exposing pool selection state (staged count per die size, shared modifier, `poolTotal`, open/close state for a panel keyed to a trigger/panel ref pair, and a `buildRoll()` function producing `{formula, rolls, total}` from the current pool via the existing `rollDicePool`, `buildPoolFormula`, and `getActiveDiceGroups` utilities), used identically by both the chat-docked dice panel and `GlobalDiceFab`, replacing the two independent copies of this state machine that exist today.

#### Scenario: Both consumers observe identical pool-selection behavior

- **Given** the chat-docked dice panel and `GlobalDiceFab`'s modal both use
  `useDicePoolState`
- **When** a die is added, removed, or the modifier is edited in either surface's own
  instance of the hook
- **Then** the staged counts, clamping to `MAX_PER_DIE`, modifier clamping to
  `MAX_MODIFIER`, and `poolTotal` computation behave identically in both surfaces, because
  both call the same shared implementation

#### Scenario: Pool state is local to each mounted instance

- **Given** the chat-docked panel and `GlobalDiceFab`'s modal are both mounted on the same
  page
- **When** the user stages dice in one surface
- **Then** the other surface's staged pool is unaffected (each call to
  `useDicePoolState` owns its own independent React state, matching today's behavior where
  the two pools are already independent, just no longer independently implemented)

#### Scenario: buildRoll produces no network request

- **Given** a non-empty staged pool
- **When** `buildRoll()` is called
- **Then** it returns `{formula, rolls, total}` computed purely client-side via
  `rollDicePool`, with no HTTP request issued

---

### Requirement: ADDED Shared roll-submission capability callable independent of any mounted component

The system SHALL provide a single `lib/dice/useRollSubmission.ts` module exposing a `useRollSubmission(campaignId)` hook that returns a `submitRoll(formula, rolls, total, visibility)` function. `submitRoll` POSTs to `/api/campaigns/[id]/rolls` (with `campaignId` URL-encoded) and resolves to `'success'` (HTTP 201, response body never parsed since it is unused by any caller), `'conflict'` (HTTP 409), or `'error'` (any other status or a thrown/network error), callable directly by any component without requiring any other specific component to be mounted.

#### Scenario: Submission succeeds identically regardless of caller

- **Given** a valid `campaignId`, `formula`, `rolls`, `total`, and `visibility`
- **When** `submitRoll` is called from the chat-docked dice panel or from `GlobalDiceFab`
- **Then** both callers receive the same `'success'` | `'conflict'` | `'error'` outcome for
  the same server response, using one shared implementation of the request/response
  mapping

#### Scenario: Submission works with no other component mounted

- **Given** `CampaignChat` is not mounted anywhere in the current page (e.g. the chat
  drawer's parent has unmounted, or the user is on a route where chat never renders)
- **When** `GlobalDiceFab` calls `submitRoll` directly for an active session
- **Then** the POST is made and resolves normally — no other component's presence is
  required for the call to succeed

#### Scenario: Conflict and error outcomes are reported without throwing

- **Given** the server responds with 409 or a 5xx status, or the network request throws
- **When** `submitRoll` resolves
- **Then** it resolves to `'conflict'` or `'error'` respectively rather than throwing, so
  callers can render inline error state without a try/catch at the call site

---

## Traceability

- Proposal "Decision 1" (shared `lib/dice/` module) → Requirements: both requirements in
  this capability
- Design decision 1 (`useDicePoolState`/`useRollSubmission` split) → Requirements: both
  requirements in this capability
- Requirement → Task(s): see `openspec/changes/archive/2026-08-29-decouple-dice-roll-capability/tasks.md`, "Shared dice hooks" task group
