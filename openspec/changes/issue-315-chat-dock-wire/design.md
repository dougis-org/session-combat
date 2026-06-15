## Context

- Relevant architecture:
  - `lib/components/CampaignChat.tsx` — existing dock shell (expand/collapse/pin). Currently has no props and renders a placeholder.
  - `lib/hooks/useCampaignStream.ts` — SSE hook: `useCampaignStream(campaignId, onEvent) → { status }`. Handles reconnect with exponential backoff. Fires `CampaignStreamEvent` including `{ type: "message", data: CampaignMessage }`.
  - `app/layout.tsx` — root layout; currently mounts `<CampaignChat />` globally.
  - `app/campaigns/[id]/` — campaign detail route; sub-routes: `combat/`, `library/`, `prompts/`, `sessions/`.
  - `lib/hooks/useAuth.ts` — `useAuth() → { user: AuthUser | null, loading }` where `AuthUser = { userId, email, username? }`.
  - `lib/utils/campaignMessages.ts` — `canSeeMessage(msg, userId, members)` utility (server-side; not used in client).
- Dependencies:
  - Issue 314 complete: `POST /api/campaigns/[id]/messages` and `GET /api/campaigns/[id]/messages` are live.
  - `CampaignMessage` type: `{ id, campaignId, senderId, senderName, text, visibility: MessageVisibility, createdAt }`.
  - `MessageVisibility`: `{ scope: "group" } | { scope: "dm-only" } | { scope: "direct", toUserId: string }`.
  - `CampaignStreamEvent` union includes `{ type: "message", campaignId, data: CampaignMessage }`.
  - `GET /api/campaigns/[id]/members` — returns `CampaignMember[]` with `userId`, `username`, `role`, `status`.
- Interfaces/contracts touched:
  - `CampaignChat` component signature (add `campaignId` prop).
  - `app/layout.tsx` (remove `CampaignChat`).
  - `app/campaigns/[id]/layout.tsx` (new file).
  - `openspec/specs/campaign-chat-dock/spec.md` (extend existing spec).

## Goals / Non-Goals

### Goals

- Wire live message delivery: stream events → feed state.
- Composer with group / dm-only / whisper visibility.
- `@username` autocomplete for whisper targeting.
- History: load on open, infinite scroll up for older pages.
- Unread badge: per-campaign, LocalStore-backed, cleared on open.
- Campaign layout that scopes `CampaignChat` to campaign routes only.

### Non-Goals

- Message editing, deletion, reactions, attachments, threading.
- Offline queuing, push notifications, read receipts per message.
- Server-side rendering of message history.

## Decisions

### Decision 1: Campaign ID source — campaign layout (Option C)

- Chosen: Create `app/campaigns/[id]/layout.tsx`. This layout receives `params.id` (the campaign ID) from the Next.js App Router and renders `<CampaignChat campaignId={params.id} />` alongside `{children}`. Remove `<CampaignChat />` from `app/layout.tsx`.
- Alternatives considered:
  - Option A: `usePathname()` inside `CampaignChat` to parse campaign ID from URL. Rejected: URL-coupling inside a presentational component, fragile to route changes.
  - Option B: React Context set by campaign page. Rejected: requires Client Component wrapper in a Server Component hierarchy; more indirection for no benefit.
- Rationale: Layout is the idiomatic Next.js App Router place to scope a UI element to a route segment. `params.id` is the authoritative source of truth. The dock only makes sense on campaign pages.
- Trade-offs: `CampaignChat` no longer renders on non-campaign pages. Acceptable — it has no data to show there.

### Decision 2: Member list — independent fetch inside CampaignChat

- Chosen: `CampaignChat` fetches `GET /api/campaigns/[id]/members` once on mount (when `campaignId` is set). Stored in local state. Used only for `@mention` autocomplete and `toUserId` resolution.
- Alternatives considered: Receive members as a prop from the layout/page. Rejected: would couple the layout to the chat's internal needs; adds prop-drilling for a single internal use.
- Rationale: `CampaignChat` is already a self-contained component with its own state. One additional fetch keeps the interface clean.
- Trade-offs: A redundant network request if the campaign page also fetches members. Acceptable at this scale.

### Decision 3: State architecture — layered useState, not expanded reducer

- Chosen: Keep the existing `dockReducer` for dock UI state (`isExpanded`, `isPinned`). Add separate `useState` hooks for: `messages`, `page`, `hasMore`, `isLoadingHistory`, `unreadCount`, `members`, `composerText`, `visibility`, `mentionQuery`, `mentionAnchorIndex`, `isSending`.
- Alternatives considered: Expand `dockReducer` to cover all state. Rejected: message/composer state is async and granular; forcing it into a reducer makes side-effects (fetches, stream events) awkward.
- Rationale: Reducer handles synchronous toggle logic well; useState handles async/incremental data well. Mixing the two cleanly is a standard React pattern.
- Trade-offs: More `useState` calls; mitigated by logical grouping in the file.

### Decision 4: @mention autocomplete — onChange detection, inline overlay

- Chosen: On every `onChange` of the textarea, scan from the cursor backward to find `@word` pattern (`/@(\w*)$/` on text up to `selectionStart`). If matched, set `mentionQuery`; otherwise clear it. Render a floating `<ul>` overlay positioned relative to the textarea. On member select: replace the `@word` fragment with `@username`, set `visibility = { scope: "direct", toUserId }`, close overlay.
- Alternatives considered: A separate "Whisper to" dropdown in the visibility selector (no inline typing). Not chosen per explicit user preference for autocomplete.
- Rationale: Familiar chat UX (`@mention` is standard); keeps composer text and visibility coupled in a single gesture.
- Trade-offs: Cursor position tracking adds complexity; mitigated by using `selectionStart` on the native textarea and string replacement.
- Note: Only one whisper target per message (single `direct` visibility). Selecting a second `@mention` replaces the previous target and updates `visibility.toUserId`.

### Decision 5: History — GET on open, prepend on scroll-to-top

- Chosen: On dock expand (first open or re-open after close), fetch `GET /api/campaigns/[id]/messages?page=1&perPage=30` and set `messages`. Attach a `scroll` listener to the feed container; when `scrollTop === 0` and `hasMore`, fetch the next page and prepend results. Deduplicate by `message.id`.
- Alternatives considered: Fetch all history eagerly on mount. Rejected: could be large; unnecessary if dock is never opened.
- Rationale: Lazy load on open keeps mount cost minimal. Prepend-on-scroll is the standard pattern for chat history.
- Trade-offs: Scroll position jumps when messages are prepended; mitigated by saving `scrollHeight` before prepend and restoring `scrollTop + ΔscrollHeight` after.

### Decision 6: Unread badge — LocalStore timestamp, per-campaign key

- Chosen: On mount, read `LocalStore.get<string>('campaign-chat-last-open-{campaignId}')`. Parse as a `Date`. Incoming stream `message` events with `createdAt > lastOpen` increment `unreadCount`. On dock expand, write `new Date().toISOString()` to LocalStore and reset `unreadCount` to 0.
- Rationale: Simple, no server round-trip. Survives page reloads. Per-campaign key so switching campaigns doesn't bleed counts.
- Trade-offs: History messages loaded on open do not contribute to `unreadCount` (they are historical). Only stream events received since the last close count. This is the specified behavior.

### Decision 7: Deduplication — id-keyed Set

- Chosen: Maintain a `Set<string>` of message IDs in state (or a ref). When appending a stream event, skip if ID already present. When prepending history, filter out IDs already in the feed.
- Rationale: The stream may re-deliver a message the client just optimistically appended, or history may overlap with live messages.

### Decision 8: Optimistic send — append then confirm

- Chosen: On send, immediately append a locally-constructed `CampaignMessage` (using `useAuth().user`) to the feed with a temporary `id = 'pending-{Date.now()}'`. The server will emit a stream event with the real message; deduplication by `id` won't match the temp ID, so the real message appends. The temp message remains (no removal logic for MVP).
- Alternatives considered: Wait for stream event before showing. Rejected: adds perceived latency.
- Trade-offs: A brief duplicate window (temp + real) if stream event is very fast. Acceptable for MVP; a future cleanup can match on text+timestamp.

### Decision 9: Composer disabled state

- Chosen: The textarea and Send button are `disabled` when `streamStatus !== 'open'` or `isSending`. A brief status line ("Reconnecting…") appears above the composer when stream is not open.
- Rationale: Prevents lost messages on a disconnected stream.

### Decision 10: Sub-component extraction — same file, unexported

- Chosen: Extract `ChatFeed`, `ChatComposer`, and `MentionDropdown` as non-exported function components within `lib/components/CampaignChat.tsx`. They receive state/handlers via props from `CampaignChat`.
- Rationale: Keeps the file testable (individual sub-functions can be tested if needed) without splitting into separate files, which would add import overhead for a cohesive UI unit.

## Proposal to Design Mapping

- Proposal element: Remove `CampaignChat` from root layout; scope to campaign routes
  - Design decision: Decision 1 (campaign layout)
  - Validation approach: Unit test confirms `<CampaignChat />` not present in root layout; E2E confirms dock absent on non-campaign pages.

- Proposal element: `campaignId` prop added to `CampaignChat`
  - Design decision: Decision 1
  - Validation approach: TypeScript; prop is required, no default.

- Proposal element: Connect to `useCampaignStream`
  - Design decision: Decision 3 (state layering); stream message events → `messages` state
  - Validation approach: Unit test with mocked `useCampaignStream`; simulate message event; assert feed updates.

- Proposal element: History load on open + infinite scroll
  - Design decision: Decision 5
  - Validation approach: Mock `fetch`; assert `GET /api/campaigns/[id]/messages` called on expand; scroll-to-top triggers second page fetch.

- Proposal element: Unread badge
  - Design decision: Decision 6
  - Validation approach: Unit test: mock LocalStore, fire stream message event, assert pill shows badge; open dock, assert badge clears.

- Proposal element: Member fetch for `@mention`
  - Design decision: Decision 2
  - Validation approach: Mock `fetch`; assert `GET /api/campaigns/[id]/members` called on mount.

- Proposal element: `@mention` autocomplete
  - Design decision: Decision 4
  - Validation approach: Unit test: type `@al` into textarea, assert dropdown appears with matching members; select member, assert `visibility.toUserId` set and dropdown closed.

- Proposal element: Send message
  - Design decision: Decision 8 (optimistic), Decision 9 (disabled state)
  - Validation approach: Mock `fetch`; assert `POST /api/campaigns/[id]/messages` called with correct body; assert optimistic message in feed.

- Proposal element: Deduplication
  - Design decision: Decision 7
  - Validation approach: Unit test: add message, fire stream event with same ID, assert only one copy in feed.

## Functional Requirements Mapping

- Requirement: Members see live messages via stream
  - Design element: `useCampaignStream` → `onEvent` callback → `setMessages(prev => [...prev, msg])` (Decision 3)
  - Acceptance criteria reference: spec — Scenario: Stream message event appends to feed
  - Testability notes: Mock `useCampaignStream` to fire synthetic events; assert DOM update.

- Requirement: History loads on dock open
  - Design element: `useEffect` on `isExpanded` → `GET /api/campaigns/[id]/messages` (Decision 5)
  - Acceptance criteria reference: spec — Scenario: History loads when dock opens
  - Testability notes: Mock `fetch`; spy on URL with page/perPage params.

- Requirement: Infinite scroll
  - Design element: Scroll listener on feed container → fetch next page (Decision 5)
  - Acceptance criteria reference: spec — Scenario: Scroll to top triggers older page load
  - Testability notes: Simulate scroll event with `scrollTop = 0`; assert second `fetch` call.

- Requirement: Visibility selector (Group / DM-only / Whisper)
  - Design element: `<select>` or button group in `ChatComposer`; controls `visibility` state (Decision 3)
  - Acceptance criteria reference: spec — Scenario: Composer renders visibility options
  - Testability notes: Assert three options present; selecting each updates `visibility` state.

- Requirement: `@mention` autocomplete for whisper
  - Design element: `onChange` regex scan → `mentionQuery` → filtered members list → `MentionDropdown` (Decision 4)
  - Acceptance criteria reference: spec — Scenario: Typing @prefix shows member dropdown
  - Testability notes: Render with mocked members; type `@`; assert dropdown items.

- Requirement: Send message via POST
  - Design element: Send button → `POST /api/campaigns/[id]/messages` with `{ text, visibility }` (Decision 8)
  - Acceptance criteria reference: spec — Scenario: Active member sends group message
  - Testability notes: Mock `fetch`; assert body and method.

- Requirement: Unread badge on collapsed pill
  - Design element: LocalStore timestamp + stream event counter → badge on pill (Decision 6)
  - Acceptance criteria reference: spec — Scenario: Unread badge appears when dock is collapsed
  - Testability notes: Mock LocalStore; fire stream event; assert badge renders on pill.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No layout regression — `CampaignChat` must remain out of document flow
  - Design element: `fixed`-positioned container preserved from existing shell
  - Acceptance criteria reference: Existing spec — Scenario: Existing tests pass after layout change
  - Testability notes: Full test suite must pass with no layout-related failures.

- Requirement category: reliability
  - Requirement: LocalStore unavailability must not crash the component
  - Design element: All LocalStore calls wrapped in `try/catch`; `unreadCount` degrades to 0 (Decision 6)
  - Acceptance criteria reference: spec — Scenario: LocalStore unavailable — unread count degrades gracefully
  - Testability notes: Mock LocalStore to throw; assert no uncaught exception.

- Requirement category: security
  - Requirement: Composer disabled when stream is disconnected (prevents lost messages)
  - Design element: `disabled` on textarea and Send button when `streamStatus !== 'open'` (Decision 9)
  - Acceptance criteria reference: spec — Scenario: Composer is disabled when stream is not open
  - Testability notes: Set mock stream status to `error`; assert inputs disabled.

- Requirement category: performance
  - Requirement: History not fetched until dock opens
  - Design element: `useEffect` gated on `isExpanded` (Decision 5)
  - Acceptance criteria reference: spec — Scenario: History is not fetched on mount (dock collapsed)
  - Testability notes: Assert `fetch` not called on initial render when dock is collapsed.

- Requirement category: reliability
  - Requirement: Duplicate messages must not appear in feed
  - Design element: ID-keyed deduplication Set (Decision 7)
  - Acceptance criteria reference: spec — Scenario: Duplicate stream event is ignored
  - Testability notes: Add message, fire stream event with same ID; assert feed length unchanged.

## Risks / Trade-offs

- Risk/trade-off: Campaign layout file may break sub-route rendering
  - Impact: High (all campaign pages broken if wrong)
  - Mitigation: Layout passes `{children}` through without modification; test all sub-routes.

- Risk/trade-off: Optimistic message + stream deduplication by ID leaves a brief "double" display
  - Impact: Low (cosmetic, MVP)
  - Mitigation: Accepted for MVP. Future: match on `senderId + text + createdAt` window.

- Risk/trade-off: `@mention` regex on long composer text has minor CPU cost
  - Impact: Negligible — text is short, operation is O(n) on a small string.
  - Mitigation: None needed.

## Rollback / Mitigation

- Rollback trigger: Campaign sub-routes broken, or existing dock unit tests regress.
- Rollback steps:
  1. Delete `app/campaigns/[id]/layout.tsx`.
  2. Restore `<CampaignChat />` in `app/layout.tsx` (no-prop form).
  3. Revert `lib/components/CampaignChat.tsx` to the shell-only version.
- Data migration considerations: None — no schema changes. `LocalStore` keys added but not destructive to remove.
- Verification after rollback: Run `npm test` and confirm existing dock tests pass.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check before proceeding. No exceptions.
- If security checks fail: Treat as a blocker. Investigate and resolve before merge.
- If required reviews are blocked/stale: Ping the reviewer after 24 hours. Escalate to maintainer after 48 hours.
- Escalation path and timeout: After 48 hours of no review activity, flag in the project issue (#315) for maintainer action.

## Open Questions

None. All design decisions resolved in exploration session (2026-06-14). See proposal.md § Open Questions for confirmation.
