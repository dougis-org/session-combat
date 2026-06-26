## Context

- Relevant architecture: Campaign chat uses a server-sent event (SSE) stream at `GET /api/campaigns/[id]/stream`. `lib/server/transport.ts` manages in-process subscriptions; `emitFiltered(campaignId, event, canReceive)` dispatches an event to all connected subscribers matching a predicate. `CampaignStreamEvent` (`lib/types.ts:40-44`) is the discriminated union of all stream event types. `app/campaigns/[id]/layout.tsx` is a client component that mounts `CampaignChat` and provides `activeSessionId` via a one-shot fetch on mount.
- Dependencies: `lib/server/transport.ts` (emitFiltered), `lib/types.ts` (CampaignStreamEvent), `app/api/campaigns/[id]/sessions/active/route.ts`, `app/campaigns/[id]/layout.tsx`, `lib/components/CampaignChat.tsx`.
- Interfaces/contracts touched: `CampaignStreamEvent` union type; `CampaignChat` component props; `sessions/active` POST/DELETE response side-effects.

## Goals / Non-Goals

### Goals

- Session start/end events propagate to all connected clients via the existing SSE channel.
- `activeSessionId` in the layout updates reactively without a page reload.
- No new API endpoints required.

### Non-Goals

- UI changes to the roll strip.
- Polling or long-polling fallback.
- Persist session state in client-side storage.

## Decisions

### Decision 1: Add `session` as a new `CampaignStreamEvent` variant

- Chosen: Extend `CampaignStreamEvent` with `| { type: "session"; campaignId: string; data: { activeSessionId: string | null } }`.
- Alternatives considered: Reuse the existing `change` event type with a generic payload; add a dedicated websocket channel.
- Rationale: A typed discriminated union variant is self-documenting, matches the established pattern (`message`, `roll`, `heartbeat`, `change`), and requires zero infrastructure change.
- Trade-offs: The union grows by one member; any exhaustive switch on `CampaignStreamEvent` must handle the new case (TypeScript will flag it).

### Decision 2: Emit to all active members (no visibility filter)

- Chosen: Use `emitFiltered(campaignId, event, () => true)` so all connected subscribers receive the `session` event.
- Alternatives considered: DM-only emission; per-user filter.
- Rationale: All active campaign members need to know whether a session is active to enable/disable their roll strip. The `activeSessionId` value itself is not sensitive.
- Trade-offs: All connected tabs/clients for the campaign receive the event — acceptable and desirable.

### Decision 3: Route session event through `CampaignChat` via an `onSessionChange` callback prop

- Chosen: Add `onSessionChange?: (activeSessionId: string | null) => void` to `CampaignChat` props. When `onStreamEvent` receives `type === "session"`, call `onSessionChange(e.data.activeSessionId)`. The layout passes `setActiveSessionId` as the callback.
- Alternatives considered: Mount a second `useCampaignStream` instance in the layout component directly.
- Rationale: `CampaignChat` already owns the only `useCampaignStream` connection for this campaign. Opening a second subscription from the layout would double the SSE connections. The callback prop keeps one connection and a clean data-up flow.
- Trade-offs: `CampaignChat` gains a new optional prop; the layout must wire it. Minimal surface increase.

## Proposal to Design Mapping

- Proposal element: Add `session` event to `CampaignStreamEvent`
  - Design decision: Decision 1
  - Validation approach: Unit test that the new union variant compiles and is handled in all switch statements; spec scenario for event shape.
- Proposal element: Emit from sessions/active POST and DELETE
  - Design decision: Decision 2 (use `emitFiltered` with `() => true`)
  - Validation approach: Integration test that POST/DELETE triggers the event; spec scenario for emission timing.
- Proposal element: Handle event in layout to update `activeSessionId`
  - Design decision: Decision 3 (callback prop)
  - Validation approach: Unit test that `onSessionChange` is called on `session` event; spec scenario for roll strip enabling/disabling.

## Functional Requirements Mapping

- Requirement: When DM starts a session, all connected clients update `activeSessionId` within one SSE round-trip.
  - Design element: Decision 1 + 2 (event emitted from POST handler via `emitFiltered`)
  - Acceptance criteria reference: specs/session-event/spec.md — "session event enables roll strip"
  - Testability notes: Mock `emitFiltered`; assert it's called with `{ type: "session", data: { activeSessionId: <id> } }` after POST.
- Requirement: When DM ends a session, all connected clients set `activeSessionId` to `null`.
  - Design element: Decision 1 + 2 (event emitted from DELETE handler)
  - Acceptance criteria reference: specs/session-event/spec.md — "session event disables roll strip"
  - Testability notes: Assert `emitFiltered` called with `{ data: { activeSessionId: null } }` after DELETE.
- Requirement: `CampaignChat` propagates `session` stream events to the layout without a page reload.
  - Design element: Decision 3 (`onSessionChange` callback prop)
  - Acceptance criteria reference: specs/session-event/spec.md — "onSessionChange called on session event"
  - Testability notes: Render `CampaignChat` with a spy `onSessionChange`; simulate SSE `session` event; assert spy called with correct value.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Existing `message` and `roll` event handling must not regress.
  - Design element: `session` is a new union branch; existing branches are untouched.
  - Acceptance criteria reference: Existing tests pass.
  - Testability notes: Full existing test suite must remain green.
- Requirement category: performance
  - Requirement: No additional SSE connections opened.
  - Design element: Decision 3 — single `useCampaignStream` instance reused via callback.
  - Acceptance criteria reference: No new `subscribe` calls in transport.
  - Testability notes: Verify no second `useCampaignStream` call in layout.

## Risks / Trade-offs

- Risk/trade-off: TypeScript exhaustive switches on `CampaignStreamEvent` will need a `session` case.
  - Impact: Compile error if unhandled — good, catches the gap at build time.
  - Mitigation: Fix any switch statements found during implementation (search for `e.type` / `event.type` switches).
- Risk/trade-off: `emitFiltered` is in-process only; it does not persist across serverless cold starts.
  - Impact: In a serverless/edge deployment, a cold instance won't have the subscription registry. No different from how `message`/`roll` events work today — this is a known architectural constraint.
  - Mitigation: No change; document as existing limitation.

## Rollback / Mitigation

- Rollback trigger: Roll strip broken in new way (e.g., stuck enabled after session ends), or TypeScript errors introduced.
- Rollback steps: Revert the three file changes (types.ts, sessions/active/route.ts, layout.tsx + CampaignChat.tsx). No DB migration needed.
- Data migration considerations: None — this is a pure runtime/event change.
- Verification after rollback: Confirm roll strip disabled state matches `activeSessionId` from initial fetch; confirm existing tests pass.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check before proceeding; do not bypass with `--no-verify`.
- If security checks fail: Treat as a blocker. `session` event payload is non-sensitive (`activeSessionId` is a UUID), but any security flag must be investigated.
- If required reviews are blocked/stale: Wait up to 48 hours, then re-request. Do not self-merge.
- Escalation path and timeout: After 48 hours of no review, ping in the PR thread and proceed only after explicit approval.

## Open Questions

- None. Implementation path is unambiguous.
