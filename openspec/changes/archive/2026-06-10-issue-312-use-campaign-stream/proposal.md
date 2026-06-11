## GitHub Issues

- #312
- #296 (parent epic: Phase 4 — Real-time transport)

## Why

- Problem statement: Phase 4 established a server-side SSE stream endpoint (`GET /api/campaigns/[id]/stream`) in issue #311, but no client-side hook exists to consume it. Components that need real-time campaign events have no way to connect, receive, or react to them.
- Why now: The server transport (4a) is complete. The client hook (4b) is its direct pair and unblocks the chat dock shell (4c) and any future product features that need live data.
- Business/user impact: Without this hook, no real-time multiplayer feature can be wired up. This is foundational plumbing.

## Problem Space

- Current behavior: No `useCampaignStream` hook exists. Components cannot subscribe to campaign SSE events.
- Desired behavior: A React hook wraps `EventSource`, opens a connection to `/api/campaigns/[id]/stream`, dispatches typed `CampaignStreamEvent` payloads to a caller-supplied callback, exposes connection status, and cleans up on unmount.
- Constraints:
  - Auth is cookie-based — no custom request headers needed; native `EventSource` is sufficient.
  - The server emits named SSE event types (`event: heartbeat`, `event: change`) — `onmessage` will not fire; `addEventListener` per event type is required.
  - Each SSE frame's `data` field is a JSON-serialised `CampaignStreamEvent` object.
  - An initial `: connected` SSE comment is sent on open — invisible to the client, no special handling needed.
- Assumptions:
  - `CampaignStreamEvent` discriminated union (`heartbeat | change`) defined in `lib/types.ts` is stable for Phase 4.
  - Cookie credentials are included automatically by `EventSource` (same-origin).
  - Browser native auto-reconnect handles transient network drops; explicit backoff is only needed for `onerror` + `readyState === CLOSED` (HTTP-level failures).
- Edge cases considered:
  - Hook unmounts before `EventSource` connects — close must be called without waiting for `onopen`.
  - `campaignId` changes while mounted — effect dependency on `campaignId` re-creates the `EventSource`.
  - Repeated errors exhaust backoff cap (30 s) — stay in `error` state, do not retry indefinitely per reconnect cycle after cap is hit; reset backoff on successful open.
  - Server closes the stream intentionally (e.g. auth revoked) — treat same as error, attempt reconnect.

## Scope

### In Scope

- `lib/hooks/useCampaignStream.ts` — the hook itself
- Connection state exposure: `'connecting' | 'open' | 'closed' | 'error'`
- Typed event dispatch via caller-supplied `onEvent` callback
- Auto-reconnect with exponential backoff on `onerror` + `CLOSED`
- Teardown (close + cancel pending reconnect timer) on unmount
- Unit tests covering state transitions and reconnect logic

### Out of Scope

- SSE endpoint (implemented in #311)
- `CampaignChat` dock shell (4c, #313)
- Any product feature wiring (message display, participant lists, etc.)
- Polyfills for non-supporting browsers
- Custom retry-after header handling

## What Changes

- New file: `lib/hooks/useCampaignStream.ts`
- New test file: `tests/unit/hooks/useCampaignStream.test.ts`
- No changes to existing files

## Risks

- Risk: `EventSource` is not available in test environments (jsdom)
  - Impact: Tests fail without mocking
  - Mitigation: Mock `EventSource` in tests; hook uses `globalThis.EventSource` so it can be replaced

- Risk: Backoff timer leaks if component unmounts mid-delay
  - Impact: Dangling `setTimeout` fires after unmount, attempts to update state on unmounted component
  - Mitigation: Track timer ref, clear in teardown function; guard state updates with a `torn` flag

- Risk: Stale `onEvent` callback (closures capturing old state)
  - Impact: Events dispatched to outdated callbacks
  - Mitigation: Store `onEvent` in a ref updated on every render; the `useEffect` captures only the ref, not the function

## Open Questions

No unresolved ambiguity. All design questions were resolved during exploration:
- SSE format confirmed from `route.ts:12-13` (named `event:` field + JSON `data:`)
- Auth confirmed as cookie-based, no custom headers needed
- Callback style chosen over return value for `lastEvent`

## Non-Goals

- This hook does not parse or interpret event semantics (that's the consumer's job)
- This hook does not batch or deduplicate events
- This hook does not persist events across remounts

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
