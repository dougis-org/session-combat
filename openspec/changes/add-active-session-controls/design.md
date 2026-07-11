## Context

- Relevant architecture: `app/campaigns/[id]/layout.tsx` (`CampaignLayout`) is a client component mounted once per campaign (`key={id}` on its `CampaignChat` child, not on itself, but `id` is stable across all campaign tabs). It already fetches `GET /api/campaigns/[id]` once on mount to seed `activeSessionId`/`campaignName`, and already owns `activeSessionId` state that is kept in sync via `CampaignChat`'s `onSessionChange` callback, which fires when a `session` SSE event arrives (`lib/hooks/useCampaignStream.ts` already registers a `session` event listener; `app/api/campaigns/[id]/sessions/active/route.ts` already emits it via `emitFiltered` on both POST and DELETE). DM-role detection is not currently available in the layout; the existing precedent is `app/campaigns/[id]/page.tsx`, which fetches `/api/campaigns/[id]/members`, finds the member matching `useAuth().user.userId`, and computes `isDM = currentMember?.role === 'dm' && currentMember?.status === 'active'`.
- Dependencies: `POST`/`DELETE /api/campaigns/[id]/sessions/active` (existing, unchanged), `GET /api/campaigns/[id]/members` (existing, unchanged), `lib/hooks/useAuth.ts` (existing, unchanged), `useCampaignStream`'s `session` event (existing, unchanged).
- Interfaces/contracts touched: `app/campaigns/[id]/layout.tsx` only, plus one new presentational/interactive component for the control. No API, type, or storage changes.

## Goals / Non-Goals

### Goals

- Give the DM a working way to flip `activeSessionId` from null → session id → null, from any campaign tab.
- Keep the control's displayed state always consistent with the single source of truth (`activeSessionId` in `CampaignLayout`, itself driven by the initial fetch + `session` SSE events) rather than tracking separate optimistic state that can drift.
- Handle the route's existing 409/404 responses as reconciliation signals, not user-facing errors, since they indicate someone else already changed the state.
- Provide a clearly-separate recovery action for a stale `activeSessionId` (`DELETE ?force=true`), so a crashed DM session doesn't lock out new sessions.

### Non-Goals

- Redesigning the SSE/session-event transport (PRs #454/#488 already fixed it).
- Merging the "active session" concept with the "Session Journal" manual entries (`app/campaigns/[id]/sessions/page.tsx`); this design only makes the existing `sessions/active` API reachable from the UI.
- Building a generic role/permissions context; this design adds the minimum member fetch needed to gate one control, following the existing pattern in `page.tsx` rather than introducing a new abstraction.

## Decisions

### Decision 1: Control lives in `CampaignLayout`'s header row, as a new `SessionControl` client component

- Chosen: A new component, `lib/components/SessionControl.tsx`, rendered inside the existing `header` block in `app/campaigns/[id]/layout.tsx` (next to the campaign name `<h1>`), so it appears identically across Members/Sessions/Prompts/Library and in both the compact and `isLarge` layout branches (the `header` variable is reused in both `return` branches already).
- Alternatives considered:
  1. Embed the control directly inline in `layout.tsx` — rejected: `layout.tsx` is already handling nav/header/chat composition; a self-contained component keeps the fetch-members-and-render logic testable in isolation and matches this codebase's existing pattern of extracting `CampaignChat` as its own component.
  2. Put the control in `CampaignChat`'s dock header — rejected per explicit user direction ("camlayout header") and because the control needs to be visible even when the chat dock is collapsed/closed.
  3. Put the control on the Sessions page only — rejected: user wants it visible on every tab, and conflating it with the Sessions page risks worsening the "New Session vs. Start Session" confusion flagged in the proposal.
- Rationale: Matches explicit scope decision from the user (camlayout header) and existing componentization pattern (`CampaignChat` is already a sibling extracted component).
- Trade-offs: One more client component and one more member fetch on every campaign page load; acceptable given `page.tsx` already pays this same cost today for the same reason.

### Decision 2: DM detection via a new `useIsDM(campaignId)` hook wrapping `GET /api/campaigns/[id]/members`

- Chosen: Add `lib/hooks/useIsDM.ts` that fetches `/api/campaigns/[id]/members`, compares against `useAuth().user.userId`, and returns `{ isDM, loading }`, following the exact `currentMember?.role === 'dm' && currentMember?.status === 'active'` logic already used in `app/campaigns/[id]/page.tsx:223`. `SessionControl` uses this hook and renders nothing (`null`) while loading or when `isDM` is false.
- Alternatives considered:
  1. Extend `GET /api/campaigns/[id]` to also return the caller's role — rejected: touches an existing, already-relied-upon API contract and route (out of scope per proposal; risk of breaking other consumers of that endpoint's shape).
  2. Duplicate the fetch-and-compute logic inline in `SessionControl` — rejected: identical logic already exists in `page.tsx`; extracting a hook avoids a second copy-paste and gives both call sites one place to fix if member-role logic changes later.
  3. Lift `isDM` computation into `CampaignLayout` and pass as a prop — rejected: layout doesn't otherwise need member data, and `SessionControl` owning its own gating keeps `layout.tsx`'s diff minimal.
- Rationale: Reuses a proven pattern instead of inventing a new permissions mechanism, keeps `layout.tsx` changes minimal, and does not touch any existing API contract.
- Trade-offs: A second network call to `/members` beyond what `page.tsx` already does when the Members tab happens to be active — acceptable, this data is small and already fetched by that page independently.

### Decision 3: `SessionControl` is driven entirely by props (`activeSessionId`, `onSessionChange`) from `CampaignLayout` — no local session-id state

- Chosen: `SessionControl` receives `activeSessionId: string | null` and `onSessionChange: (id: string | null) => void` as props (the same values/callback `CampaignLayout` already threads to `CampaignChat`). On click, it calls the route, and on a successful response updates via `onSessionChange` so `CampaignLayout`'s state (the single source of truth also used by `CampaignChat`/`RollEntryStrip`) updates once, in one place. It does not maintain a separate "pending"/optimistic session id — only a local `busy: boolean` (in-flight request) and `error: string | null` for its own button/label state.
- Alternatives considered:
  1. `SessionControl` maintains its own `activeSessionId` state, independent from `CampaignLayout`'s — rejected: would create two sources of truth that could visibly disagree with the roll strip's disabled state, reintroducing a variant of the exact bug class this change fixes.
  2. Rely solely on the SSE `session` event to update state after POST/DELETE (ignore the HTTP response body) — rejected: adds a needless round-trip delay for the DM's own action; using the response directly (like `CampaignLayout`'s initial `GET` fetch already does) gives immediate feedback, while the SSE event remains authoritative for *other* tabs/instances (unchanged, already working).
- Rationale: Keeps exactly one state variable (`CampaignLayout.activeSessionId`) as ground truth, matching the existing architecture and avoiding drift/race bugs.
- Trade-offs: `SessionControl` must handle the case where its own optimistic call and a near-simultaneous SSE event both call `onSessionChange` with the same value — harmless no-op re-render, no special-casing needed.

### Decision 4: 409/404/stale-session handling via response-driven reconciliation, plus an explicit "Force Reset" affordance

- Chosen:
  - `POST` returning 409 ("A session is already active") → treat as "someone already started it"; re-fetch `GET /api/campaigns/[id]` once to pick up the real `activeSessionId` and call `onSessionChange` with it, no error shown to the DM.
  - `DELETE` returning 404 ("No active session") → treat as "already ended"; call `onSessionChange(null)`, no error shown.
  - A visible "Force Reset" action (secondary, low-emphasis button/link, only shown once a session is already showing as active) calls `DELETE ...?force=true`, then `onSessionChange(null)` on success. This exists specifically for the "DM crashed mid-session, `activeSessionId` is stuck but everyone believes no session is live" case described in the route's own risk mitigation. It is not the default End Session action — it is a distinct, clearly-labeled fallback (e.g. "Force end (recovery)") to avoid it being clicked accidentally in place of the normal End Session button.
  - Any other non-2xx (e.g. 500) → surfaced as a small inline error string near the control, matching the existing error-display convention used by `RollEntryStrip` (`error && <p className="text-xs text-red-400 ...">`).
- Alternatives considered:
  1. Surface 409/404 as hard errors requiring manual dismissal — rejected: these are expected, benign races in a multi-tab/multi-DM scenario, not failures; treating them as errors would be noisy and misleading.
  2. Auto-force-reset on any 409 — rejected: would silently kill a session another DM or the same DM's other tab legitimately just started, which is worse than the current bug.
- Rationale: Matches the route's own documented risk/mitigation design (`DELETE ?force=true` as an explicit escape hatch, from the original `campaign-active-session-lifecycle` proposal) and keeps state reconciliation centered on `activeSessionId`, consistent with Decision 3.
- Trade-offs: One extra `GET` round-trip specifically on the 409 path; acceptable given 409 is an edge case, not the common path.

## Proposal to Design Mapping

- Proposal element: DM-only Start/End Session control in `CampaignLayout` header, visible on every tab
  - Design decision: Decision 1
  - Validation approach: Component test rendering `CampaignLayout` (or `SessionControl` directly) across route pathnames/tabs; visual check control appears in both compact and `isLarge` render branches.
- Proposal element: Wiring to `POST`/`DELETE /api/campaigns/[id]/sessions/active`, reusing existing `activeSessionId` state
  - Design decision: Decision 3
  - Validation approach: Unit tests asserting `onSessionChange` is called with the response's session id / `null` on success, and that `RollEntryStrip` becomes enabled once `CampaignLayout.activeSessionId` is non-null (integration-style test through `CampaignLayout`).
- Proposal element: Handling 409/404/stale-session responses with reconciliation, not raw errors
  - Design decision: Decision 4
  - Validation approach: Unit tests mocking `fetch` to return 409/404 and asserting no error text renders and `onSessionChange` is called with the reconciled value; a 500 case asserting the inline error string does render.
- Proposal element: Force-reset affordance for stuck `activeSessionId`
  - Design decision: Decision 4
  - Validation approach: Unit test clicking "Force end (recovery)" asserts `fetch` called with `?force=true` and `onSessionChange(null)` afterward.
- Proposal element: Determining DM role client-side
  - Design decision: Decision 2
  - Validation approach: Unit tests for `useIsDM` (DM member present/active → true; non-DM/invited/absent → false; loading state) and a `SessionControl` test asserting it renders nothing for a non-DM.
- Proposal element: Must not duplicate/conflict with the manual "Session Journal" entry flow
  - Design decision: Non-Goals + Decision 1 (kept as a separate control from the Sessions page's "+ New Session" button)
  - Validation approach: No shared code path introduced; existing Sessions-page tests remain unaffected (regression check only, no new coupling to assert).

## Functional Requirements Mapping

- Requirement: DM can start a session from any campaign tab.
  - Design element: `SessionControl` in `CampaignLayout` header (Decision 1).
  - Acceptance criteria reference: specs/session-controls/spec.md — Scenario "DM starts a session".
  - Testability notes: Render `CampaignLayout` (or a thin harness around `SessionControl`) with a mocked DM member response, click "Start Session", assert `POST` called and `onSessionChange` invoked with the created session id.
- Requirement: DM can end an active session from any campaign tab.
  - Design element: `SessionControl` End Session action (Decision 3).
  - Acceptance criteria reference: specs/session-controls/spec.md — Scenario "DM ends a session".
  - Testability notes: With `activeSessionId` set, click "End Session", assert `DELETE` called (no `force`) and `onSessionChange(null)` invoked.
- Requirement: Non-DM members never see the control.
  - Design element: `useIsDM` gating (Decision 2).
  - Acceptance criteria reference: specs/session-controls/spec.md — Scenario "Non-DM member does not see the control".
  - Testability notes: Mock members response with current user as `player`, assert `SessionControl` renders `null`.
- Requirement: Control reflects sessions started/ended by other tabs, devices, or the DM elsewhere, without a page reload.
  - Design element: Props-driven state from `CampaignLayout.activeSessionId`, already updated by the existing `session` SSE event (Decision 3, reusing existing plumbing).
  - Acceptance criteria reference: specs/session-controls/spec.md — Scenario "Control updates reactively on session SSE event".
  - Testability notes: Render `CampaignLayout`, simulate `onSessionChange` being invoked (as the existing `CampaignChat` → SSE path already does), assert `SessionControl` label flips from Start to End without any new fetch.
- Requirement: Concurrent start/end races (409/404) resolve to correct state without a scary error.
  - Design element: Decision 4 reconciliation logic.
  - Acceptance criteria reference: specs/session-controls/spec.md — Scenario "Race with another DM tab is reconciled silently".
  - Testability notes: Mock 409/404 responses, assert reconciliation fetch/`onSessionChange` call and absence of error text.
- Requirement: DM can recover from a stuck/stale `activeSessionId`.
  - Design element: Force Reset action (Decision 4).
  - Acceptance criteria reference: specs/session-controls/spec.md — Scenario "DM force-resets a stale session".
  - Testability notes: Unit test as described in mapping above.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: The control must never show a state that contradicts `RollEntryStrip`'s enabled/disabled state, since both are driven by the same `activeSessionId`.
  - Design element: Single source of truth in `CampaignLayout.activeSessionId` (Decision 3); no independent state in `SessionControl`.
  - Acceptance criteria reference: specs/session-controls/spec.md — Scenario "Control state matches RollEntryStrip state".
  - Testability notes: Integration test rendering `CampaignLayout` with `CampaignChat`, asserting `SessionControl`'s label and `RollEntryStrip`'s disabled attribute always agree after any state transition.
- Requirement category: security
  - Requirement: Only an active DM member may trigger start/end/force-reset, both visually and functionally (defense in depth — UI gate plus existing server-side 404 gate).
  - Design element: `useIsDM` gating (Decision 2) on top of the route's pre-existing `role !== 'dm' → 404` check (unchanged).
  - Acceptance criteria reference: specs/session-controls/spec.md — Scenario "Non-DM member does not see the control".
  - Testability notes: Existing route-level DM tests are unchanged/unaffected (no server code modified); new UI-level test covers the client gate.
- Requirement category: operability
  - Requirement: Session-state changes must not introduce polling; must continue to rely on the existing SSE `session` event.
  - Design element: Decision 3 (props-driven, no new fetch loop).
  - Acceptance criteria reference: specs/session-controls/spec.md — Scenario "Control updates reactively on session SSE event".
  - Testability notes: Code review check — no `setInterval`/polling introduced; test asserts state updates via the existing callback path only.

## Risks / Trade-offs

- Risk/trade-off: Extra `/members` fetch per campaign-page load solely to gate one control.
  - Impact: Marginal added network/render cost on every campaign tab, not just the Members tab.
  - Mitigation: Reuses the same lightweight endpoint `page.tsx` already calls; no new backend cost. Acceptable given the alternative (widening a shared API contract) is higher-risk.

- Risk/trade-off: "Force end (recovery)" being visually adjacent to "End Session" could still be clicked by mistake despite distinct labeling.
  - Impact: A DM could force-clear a session another DM legitimately started.
  - Mitigation: Only render Force Reset as a secondary, visually de-emphasized action, separate from the primary button, and only when needed (design will confirm exact copy/placement during implementation, but the two actions must not share a click target).

- Risk/trade-off: Confusion between this control and the Sessions page's "+ New Session" journal button remains (explicitly out of scope to fix the underlying overlap).
  - Impact: DMs may still create redundant `SessionLog` rows via both paths.
  - Mitigation: Clear, distinct copy on the new control (e.g. "Start Session" vs. the journal's "+ New Session"); full reconciliation deferred to a future change per proposal's Non-Goals.

## Rollback / Mitigation

- Rollback trigger: The control causes incorrect DM gating (e.g. non-DM sees/uses it) or destabilizes `activeSessionId` state (e.g. flips `RollEntryStrip` incorrectly) in production.
- Rollback steps: Revert the commit(s) adding `SessionControl.tsx`, `useIsDM.ts`, and the `layout.tsx` header wiring. No API, storage, or type changes are made by this change, so no server-side rollback is needed and no other feature depends on these new files.
- Data migration considerations: None — no schema or storage changes. `activeSessionId` semantics and the `sessions/active` route are entirely unchanged.
- Verification after rollback: Confirm `activeSessionId` can still be observed correctly via existing tests (route/storage/SSE tests, unaffected), and that the Sessions journal page and chat dock continue to function exactly as before this change (pre-existing regression suite).

## Operational Blocking Policy

- If CI checks fail: Do not merge; fix the failing unit/integration test or lint/type error before proceeding. No override of CI gating is authorized for this change.
- If security checks fail: Treat any finding related to the DM-only gate (e.g., a way for a non-DM to trigger the route) as a release blocker — this change deliberately adds a second, client-side layer on top of the pre-existing server-side 404 gate, and the server-side gate must never be weakened to accommodate the UI.
- If required reviews are blocked/stale: Follow standard project PR process (see `CLAUDE.md` / `.claude/rules`); do not bypass branch protection or use admin merge overrides for this change, per existing project policy.
- Escalation path and timeout: If blocked more than one business day, flag to the requester (the user/dougis) for a decision rather than proceeding unilaterally, consistent with this change's low-risk/no-backend-change profile — there is no urgent operational reason to fast-track past normal review.

## Open Questions

- Whether ending a session should navigate the DM to the Sessions page (proposal's first Open Question) remains unresolved; design defaults to "no forced navigation, stay in place" per proposal.md, revisit if the user disagrees during apply.
- Exact copy/microcopy for the Force Reset action ("Force end (recovery)" is a placeholder) — to be finalized during implementation, not a blocker for tasks/tests.
