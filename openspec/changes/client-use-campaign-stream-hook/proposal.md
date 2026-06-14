## GitHub Issues

- #312

## Why

- Problem statement: The multi-user campaign real-time transport (Phase 4) requires a client-side hook to consume the SSE stream from the server endpoint, manage connection lifecycle, and deliver typed events to React components.
- Why now: Phase 1 is complete; 4b and 4c have no upstream dependencies and can proceed immediately. The hook is already implemented and fully tested.
- Business/user impact: Unblocks all UI components that need to react to live campaign updates (chat, combat state changes, etc.).

## Problem Space

- Current behavior: No client-side SSE consumer exists; components cannot receive real-time campaign events.
- Desired behavior: A React hook `useCampaignStream(campaignId, onEvent)` wraps `EventSource`, manages reconnect/backoff, exposes connection state, and dispatches typed `CampaignStreamEvent` objects to callers. Tears down cleanly on unmount or `campaignId` change.
- Constraints: Must work in the Next.js `"use client"` context; `EventSource` must be accessed via `globalThis` to remain test-friendly. Reconnect uses exponential backoff (1s base, 2× per failure, capped at 30s); resets to 1s after successful reconnect.
- Assumptions: The SSE endpoint (`GET /api/campaigns/[id]/stream`) is defined in issue #311 (4a); end-to-end testing against a live endpoint is deferred to 4a.
- Edge cases considered: unmount during connecting state, unmount while a reconnect timer is pending, campaignId change while open, stale `onEvent` closure (handled via ref).

## Scope

### In Scope

- `lib/hooks/useCampaignStream.ts` — the hook implementation
- `tests/unit/hooks/useCampaignStream.test.ts` — unit tests covering T1–T4
- `lib/types.ts` — `CampaignStreamEvent` union type (`heartbeat | change`)

### Out of Scope

- SSE server endpoint (issue #311, 4a)
- End-to-end integration test against a live stream (deferred to 4a)
- `CampaignChat` dock UI shell (issue #313, 4c)
- Data wiring / product features

## What Changes

- `lib/hooks/useCampaignStream.ts` added: wraps `EventSource` with auto-reconnect/backoff, connection state (`connecting | open | error`), and typed event dispatch via `onEventRef`.
- `lib/types.ts` extended: `CampaignStreamEvent` union type added.
- `tests/unit/hooks/useCampaignStream.test.ts` added: 19 tests across T1 (connection lifecycle), T2 (event dispatch), T3 (reconnect behaviour), T4 (teardown).

## Risks

- Risk: `CampaignStreamEvent` type evolves as 4a defines more event types.
  - Impact: Callers receive `unknown` data until type is updated.
  - Mitigation: Type is a discriminated union; adding new variants is non-breaking for existing callers.

- Risk: End-to-end reconnect behaviour untested until 4a lands.
  - Impact: Edge cases in browser reconnect vs. explicit backoff may surface in production.
  - Mitigation: Unit tests cover all known branches; 4a will add integration coverage.

## Open Questions

- No unresolved ambiguity. The hook is implemented and all 19 unit tests pass. End-to-end testing is explicitly deferred to issue #311 per the issue's stated scope.

## Non-Goals

- Providing a manual-reconnect API (e.g. `reconnect()` callback) — not required by any consumer today.
- Retry count or last-error details in the returned state — not required by 4c.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
