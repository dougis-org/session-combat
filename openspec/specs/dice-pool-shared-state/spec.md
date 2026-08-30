## Purpose

Provide shared, component-agnostic hooks for dice-pool selection state (`useDicePoolState`) and roll submission (`useRollSubmission`), so the chat-docked dice panel and `GlobalDiceFab` — and any future trigger UI — drive identical behavior from one implementation.

## Requirements

### Requirement: Shared dice-pool selection state usable by any trigger UI

The system SHALL provide a single `lib/dice/useDicePoolState.ts` module exposing pool selection state (staged count per die size, shared modifier, `poolTotal`, open/close state for a panel keyed to a trigger/panel ref pair, a `buildRoll()` function producing `{formula, rolls, total}` from the current pool via the existing `rollDicePool`, `buildPoolFormula`, and `getActiveDiceGroups` utilities, and a `buildPercentileRoll()` function producing `{formula, rolls, total}` for a standalone percentile roll), used identically by both the chat-docked dice panel and `GlobalDiceFab`, replacing the two independent copies of this state machine that exist today.

_(Modified 2026-08-30, `add-dice-roll-animation`.)_ `buildRoll()` SHALL **additionally** return `breakdown: { sides: number; value: number }[]` (one entry per individual die, preserving the per-die size from `rollDicePool`) and `modifier: number` (the clamped applied modifier); the `formula`, `rolls`, and `total` fields SHALL be byte-for-byte identical to their pre-change values. `buildPercentileRoll()` SHALL **additionally** return `percentileFaces: [tensFace, onesFace]` (the two physical d10 faces from `rollPercentile()`). These additional fields SHALL be additive only: consumers that read `formula` / `rolls` / `total`, and the roll-submission payload (`{formula, rolls, total, visibility}`), SHALL be unaffected.

`buildPercentileRoll()` SHALL delegate to the centralized `rollPercentile()` helper (see `dice-rolling` capability) and return `{ formula: "d%", rolls: [value], total: value }` where `value` is the decoded percentile result (1..100). It SHALL NOT read the staged pool or the shared modifier.

#### Scenario: Built rolls carry a per-die breakdown without changing the submission payload

- **Given** a staged pool of `2d20+1d6` with modifier `+3`
- **When** `buildRoll()` is called
- **Then** it returns `formula`, `rolls`, and `total` exactly as before
- **And** it also returns `breakdown` with 3 entries — two `{ sides: 20, value }` and one
  `{ sides: 6, value }` — whose `value`s sum with `modifier` (`3`) to equal `total`
- **And** it also returns `modifier: 3`
- **And** when this roll is submitted, the POST body to `/api/campaigns/[id]/rolls` contains
  only `{formula, rolls, total, visibility}` — no `breakdown` or `modifier` field

#### Scenario: Built percentile rolls carry the two physical d10 faces

- **Given** any staged pool contents and any modifier
- **When** `buildPercentileRoll()` is called
- **Then** it returns `{ formula: "d%", rolls: [value], total: value }` with `value` in
  1..100 as before
- **And** it also returns `percentileFaces: [tensFace, onesFace]`, each in 1..10, which
  decode (tens `% 10` * 10 + ones `% 10`, with `0` → `100`) to `value`
- **And** no HTTP request is issued and the staged pool and modifier are unchanged

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

#### Scenario: buildPercentileRoll produces a decoded percentile result independent of the pool

- **Given** any staged pool contents and any modifier value
- **When** `buildPercentileRoll()` is called
- **Then** it returns `{ formula: "d%", rolls: [value], total: value }` with a single integer `value` in 1..100 equal to `total`, computed client-side via `rollPercentile()`, with no HTTP request issued and no change to the staged pool or modifier

---

### Requirement: Shared roll-submission capability callable independent of any mounted component

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
- (2026-08-30, `add-dice-roll-animation`) Additive `BuiltRoll` data seam (`breakdown` / `modifier` / `percentileFaces`) → Requirement: MODIFIED Shared dice-pool selection state usable by any trigger UI. See `openspec/changes/archive/2026-08-30-add-dice-roll-animation/tasks.md`, task group E1.
