## Context

- Relevant architecture: `CampaignChat` is a self-contained client component at `lib/components/CampaignChat.tsx`. It owns dock state (expanded/pinned), message state, SSE subscription via `useCampaignStream`, history pagination, and the `ChatComposer`. The SSE stream (`CampaignStreamEvent`) already carries `type: "roll"` events. Roll persistence and visibility enforcement live in the API (`app/api/campaigns/[id]/rolls/route.ts`) and `lib/utils/campaignRolls.ts`. Dice rolling uses `lib/utils/dice.ts` (`rollDie(sides)`).
- Dependencies: `CampaignRoll` and `RollVisibility` types in `lib/types.ts`; `rollDie()` in `lib/utils/dice.ts`; rolls API at `/api/campaigns/[id]/rolls`.
- Interfaces/contracts touched:
  - `CampaignChat` props: add `activeSessionId: string | null`.
  - Internal feed state: replace `messages: CampaignMessage[]` with `feed: FeedItem[]`.
  - SSE handler: extend to handle `type: "roll"`.
  - Campaign page component: pass `activeSessionId` prop to `CampaignChat`.

## Goals / Non-Goals

### Goals

- Interleaved feed of messages and rolls sorted by `createdAt`.
- Roll-entry strip with d4/d6/d8/d10/d12/d20 quick buttons, flat modifier field, and group/dm-only visibility selector.
- Strip disabled (greyed, labelled "No active session") when `activeSessionId` is null.
- Rolls broadcast and received live via SSE; history loaded on dock expand.
- Roll feed items visually distinct: formula, per-die breakdown, total, roller handle, timestamp, visibility marker.

### Non-Goals

- Free-text formula input, multi-die formulas, advantage/disadvantage.
- Roll history across sessions other than the active one.
- Optimistic roll entries.
- Unread count for roll events.

## Decisions

### Decision 1: FeedItem discriminated union defined locally in CampaignChat.tsx

- Chosen: Define `type FeedItem = { kind: 'message'; data: CampaignMessage } | { kind: 'roll'; data: CampaignRoll }` in `CampaignChat.tsx`, not exported from `lib/types.ts`.
- Alternatives considered: Export from `lib/types.ts` for potential reuse.
- Rationale: No other component currently consumes a mixed feed. Keeping it local avoids premature abstraction in the shared type file. Can be promoted later if needed.
- Trade-offs: If a second component needs a mixed feed, the type must be moved. Acceptable given current scope.

### Decision 2: activeSessionId passed as a prop

- Chosen: `CampaignChat` accepts `activeSessionId: string | null` as a prop from its parent (the campaign page).
- Alternatives considered: (a) Fetch the campaign inside `CampaignChat`; (b) Derive from SSE `change` events inside the component.
- Rationale: The campaign page already holds campaign state. Passing it as a prop is the simplest, most testable approach and avoids a redundant fetch. Staleness of `activeSessionId` (DM starts/ends session mid-visit) is flagged as a follow-up; the SSE `change` event handler in the parent should update the prop when the campaign changes.
- Trade-offs: Parent must be updated to pass the prop. If the parent does not subscribe to `change` events for the campaign, the strip may lag behind. Acceptable for MVP.

### Decision 3: Sorted insert for feed updates

- Chosen: On initial history load, merge messages and rolls, sort by `createdAt` ascending, set as `feed`. On stream events, append to end of `feed` (stream events arrive in order). On history prepend (infinite scroll), sort the prepended batch then prepend the block.
- Alternatives considered: Re-sort the entire array on every update.
- Rationale: Avoids O(n log n) re-sort on every SSE event. Stream events are always newer than existing feed items, so append is correct. History pagination prepend requires a sort of the fetched page only (≤100 items), not the full feed.
- Trade-offs: Assumes stream events arrive in chronological order (valid per SSE semantics). Slightly more complex insertion logic.

### Decision 4: Roll history fetched in parallel with message history

- Chosen: On dock expand, fire both `GET /api/campaigns/[id]/messages` and `GET /api/campaigns/[id]/rolls?sessionId=<activeSessionId>` concurrently via `Promise.all`. If `activeSessionId` is null, skip the rolls fetch and load messages only.
- Alternatives considered: Sequential fetch (simpler, slower); single merged API endpoint (out of scope).
- Rationale: Both fetches are independent. Parallel reduces perceived latency on first expand.
- Trade-offs: Two loading states must both resolve before the merged feed renders. Implement a single `isLoadingHistory` flag gated on both promises resolving.

### Decision 5: Client-side rolling with rollDie()

- Chosen: On die-button click, call `rollDie(sides, 1)` client-side, compute `total = result + modifier`, build `formula` string (`"1dX"` or `"1dX+M"` / `"1dX-M"` for non-zero modifier), POST to API.
- Alternatives considered: Send only formula to server and have server roll (would require API change).
- Rationale: API contract expects pre-computed `rolls[]` and `total`. `rollDie()` uses crypto-secure randomness. No API changes needed.
- Trade-offs: Roll result is computed client-side before the API persists it; a network failure means the roll is lost (no optimistic entry). Acceptable for MVP.

### Decision 6: Roll-entry strip as a sibling section below ChatComposer

- Chosen: Render `RollEntryStrip` below `ChatComposer` in the dock, separated by a border. The strip holds: a row of die buttons (d4 d6 d8 d10 d12 d20), a modifier `<input type="number">`, a visibility `<select>` (Group / DM-only), and a spinner/error state. When `activeSessionId` is null, the entire strip is `disabled` with a tooltip label "No active session".
- Alternatives considered: Integrate roll controls into `ChatComposer` (clutters composer); separate tab (adds navigation complexity).
- Rationale: Minimal surface area, visually distinct from text composition, easy to disable atomically.
- Trade-offs: Dock height increases slightly. At `33vh` this is acceptable; if cramped, the strip can collapse.

## Proposal to Design Mapping

- Proposal element: Unified feed type replacing `messages` state
  - Design decision: Decision 1 (FeedItem local type), Decision 3 (sorted insert)
  - Validation approach: Unit test feed merge/sort logic; E2E confirms ordering in rendered feed

- Proposal element: Roll-entry strip with die buttons, modifier, visibility, disabled state
  - Design decision: Decision 5 (client-side rolling), Decision 6 (strip placement)
  - Validation approach: Unit tests for strip render/disable; integration test for POST flow

- Proposal element: SSE stream extended to consume roll events
  - Design decision: Decision 3 (append on stream event)
  - Validation approach: Unit test onStreamEvent with roll event type

- Proposal element: Roll history fetch on expand
  - Design decision: Decision 4 (parallel fetch)
  - Validation approach: Unit test with mocked fetch; verify merged sort order

- Proposal element: activeSessionId as prop
  - Design decision: Decision 2
  - Validation approach: Prop passed correctly from campaign page; strip disabled when null

## Functional Requirements Mapping

- Requirement: Active member can roll a die and share to group or DM-only
  - Design element: RollEntryStrip (Decision 6), rollDie() (Decision 5), POST /rolls
  - Acceptance criteria reference: specs/roll-share-ui/spec.md — roll submission scenarios
  - Testability notes: Unit test button click → fetch called with correct body; integration test end-to-end post

- Requirement: Roll appears in feed interleaved with messages by time
  - Design element: FeedItem union (Decision 1), sorted insert (Decision 3)
  - Acceptance criteria reference: specs/roll-share-ui/spec.md — feed rendering scenarios
  - Testability notes: Unit test feed merge with known timestamps; render test for RollFeedItem

- Requirement: Roll feed item shows formula, breakdown, total, roller, visibility marker
  - Design element: RollFeedItem sub-component
  - Acceptance criteria reference: specs/roll-share-ui/spec.md — roll feed item rendering
  - Testability notes: Snapshot/render test with known CampaignRoll fixture

- Requirement: Strip disabled when no active session
  - Design element: Decision 2 (activeSessionId prop), Decision 6 (strip disabled)
  - Acceptance criteria reference: specs/roll-share-ui/spec.md — no active session scenario
  - Testability notes: Render test with activeSessionId=null; assert buttons and inputs disabled

- Requirement: Live roll delivery via SSE
  - Design element: Extended onStreamEvent handler, Decision 3
  - Acceptance criteria reference: specs/roll-share-ui/spec.md — live roll delivery
  - Testability notes: Unit test onStreamEvent dispatches roll into feed; dedup by id

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Feed updates must not re-sort the entire array on each SSE event
  - Design element: Decision 3 — append-only for stream events
  - Acceptance criteria reference: Implicit; no perceptible jank on rapid roll events
  - Testability notes: Manual verification; no automated perf test required for MVP

- Requirement category: reliability
  - Requirement: Duplicate roll events (stream + history overlap) must not appear twice
  - Design element: `seenIds` ref extended to cover roll ids alongside message ids
  - Acceptance criteria reference: specs/roll-share-ui/spec.md — dedup scenario
  - Testability notes: Unit test: add roll via history, then deliver same id via stream; assert feed length unchanged

- Requirement category: security
  - Requirement: Rolls not visible to ineligible users must not be rendered
  - Design element: Server enforces visibility on SSE emit; client uses `canSeeRoll` as a secondary guard if a roll event arrives unexpectedly
  - Acceptance criteria reference: specs/roll-share-ui/spec.md — visibility enforcement
  - Testability notes: Unit test canSeeRoll (already tested in utils); integration test DM-only roll invisible to player

## Risks / Trade-offs

- Risk/trade-off: `activeSessionId` staleness when DM starts/ends session mid-visit
  - Impact: Strip stays greyed (or enabled) incorrectly until page refresh
  - Mitigation: Parent should update prop from SSE `change` events. If not already done, flag as a follow-up issue; MVP ships with the known limitation documented.

- Risk/trade-off: Dock height with roll strip added
  - Impact: Less vertical space for the feed at 33vh
  - Mitigation: Roll strip is compact (single row ~40px). If cramped, strip can be made collapsible in a follow-up.

## Rollback / Mitigation

- Rollback trigger: Roll-entry POST causes unexpected 409s in production; or feed merge introduces a regression in message rendering.
- Rollback steps: Revert `CampaignChat.tsx` to prior version (messages-only feed); the rolls API is unaffected and can stay.
- Data migration considerations: None — this change is purely additive UI.
- Verification after rollback: Confirm chat messages render and send correctly; confirm no JS errors on the campaign page.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check. All unit and integration tests must pass, and `npm run build` must succeed.
- If security checks fail: Do not merge. Investigate before proceeding.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to repo owner after 48 hours.
- Escalation path and timeout: Repo owner (dougis) is the escalation path; no external stakeholders for this change.

## Open Questions

- No open questions. All design decisions are resolved. The `activeSessionId` staleness issue is acknowledged and deferred to a follow-up.
