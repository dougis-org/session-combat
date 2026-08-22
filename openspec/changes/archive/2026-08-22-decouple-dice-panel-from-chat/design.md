## Context

- Relevant architecture: `app/layout.tsx` (root layout, wraps every page, already hosts `NavBar`); `app/campaigns/[id]/layout.tsx` (mounts `CampaignChat`); `lib/components/CampaignChat.tsx` (owns dice pool UI, `useDicePool`, `handleRoll`, feed rendering, scroll); `lib/utils/dice.ts` (`rollDie`/`rollDicePool`, crypto rejection sampling); `lib/hooks/useAuth.ts` (client auth state via `/api/auth/me`); `app/api/campaigns/[id]/rolls/route.ts` (POST/GET, fully authenticated and validated today).
- Dependencies: `useAuth()` for gating the fab; `rollDicePool()` for roll computation; existing SSE/session-state machinery inside `CampaignChat` (`activeSessionId`, `streamStatus`) as the source of presence.
- Interfaces/contracts touched: none server-side. New client-only module `lib/dice/diceSessionBridge.ts`. New client component (name TBD at implementation, e.g. `lib/components/GlobalDiceFab.tsx`). `CampaignChat.tsx` gains two effects (announce/clear presence, subscribe to roll requests) but its existing props, POST payload shape, and route contract are unchanged.

## Goals / Non-Goals

### Goals

- Make dice rolling available from any page, to any logged-in user, without a campaign/session dependency.
- Preserve 100% of existing `CampaignChat`-internal dice behavior (pool UI, POST, dedupe, scroll) untouched and passing its current tests.
- Keep the server route as the sole trust boundary; the new client bridge carries no authority.
- Keep the presence/roll-request contract scoped (`campaignId` + `sessionId`) so multi-tab/multi-campaign scenarios cannot cross-deliver.

### Non-Goals

- A generic reusable pub/sub/event-bus abstraction for future features.
- Cross-campaign or cross-session roll delivery/picker.
- Any change to `/api/campaigns/[id]/rolls` or other server routes.
- Server-side persistence of rolls made with no active session.

## Decisions

### Decision 1: Global fab + modal as a new standalone component, mounted at the root layout

- Chosen: New `GlobalDiceFab` client component, rendered once in `app/layout.tsx` alongside `NavBar`, gated by `useAuth()` (renders nothing / is inert when `user === null`).
- Alternatives considered: (a) Making `CampaignChat`'s existing panel portal itself to the root via a shared context so it can render outside `app/campaigns/[id]`; (b) per-page opt-in inclusion.
- Rationale: `app/layout.tsx` is the only layout guaranteed to wrap every route. A standalone component keeps `CampaignChat` focused on chat/session concerns and avoids threading campaign-scoped state through a component meant to run with no campaign context.
- Trade-offs: Two dice-pool UIs now exist in the codebase (the fab's standalone builder and `CampaignChat`'s in-chat builder). Accepted because their triggering conditions, disabled-states, and lifecycles are genuinely different (global vs. session-scoped), and the proposal explicitly rules out merging/replacing `CampaignChat`'s own UI.

### Decision 2: Client-only, purpose-built, typed bridge module for presence + roll-request

- Chosen: `lib/dice/diceSessionBridge.ts` exporting:
  - `announcePresence(presence: { campaignId: string; sessionId: string }): void`
  - `clearPresence(): void`
  - `onPresenceChange(cb: (presence: { campaignId: string; sessionId: string } | null) => void): () => void`
  - `requestRoll(payload: { campaignId: string; sessionId: string; roll: { formula: string; rolls: number[]; total: number; visibility: RollVisibility } }): void`
  - `onRollRequested(cb: (payload) => void): () => void`
  Implemented as a tiny in-memory singleton (module-scoped state + listener sets), not `window` `CustomEvent`s, so it stays type-safe and testable without DOM event plumbing, and trivially resettable between tests.
- Alternatives considered: (a) React Context provided from `app/campaigns/[id]/layout.tsx` and consumed by the fab — rejected because the fab and `CampaignChat` do not share a common React subtree below the root, so context would have to be hoisted to `app/layout.tsx` anyway, which recreates the same singleton-module shape with extra indirection; (b) `window.dispatchEvent(new CustomEvent(...))` — rejected as untyped and harder to unit test in isolation; (c) lifting full session state (the option considered and rejected during explore) — rejected as unnecessarily heavy for a boolean-ish presence signal.
- Rationale: A minimal, explicitly-typed, two-channel module matches the actual coupling need (one boolean-ish presence signal out, one roll-request in) without introducing a general-purpose abstraction (see Non-Goals).
- Trade-offs: A module-level singleton is effectively global mutable state; must be carefully reset in tests (`resetDiceSessionBridge()` test-only export) and must not leak between campaign mounts — mitigated by Decision 3's scoping rule.

### Decision 3: Roll-request delivery is scoped by exact `{campaignId, sessionId}` match; presence is authoritative from `CampaignChat`, not inferred from route/pathname

- Chosen: `CampaignChat` calls `announcePresence({campaignId, sessionId: activeSessionId})` whenever it has a non-null `activeSessionId` and an open SSE stream, and calls `clearPresence()` on unmount and whenever `activeSessionId` becomes null or the stream drops. `GlobalDiceFab` subscribes via `onPresenceChange` and only renders "send to session chat" while presence is non-null. When the user chooses to send, the fab calls `requestRoll({campaignId, sessionId, roll})` using the ids from the *current* presence value (not cached from an earlier one). `CampaignChat` subscribes via `onRollRequested` and only acts (runs its existing POST/append/scroll tail) if the payload's `campaignId`/`sessionId` both equal its own current `campaignId`/`activeSessionId` at the time the event arrives.
- Alternatives considered: Inferring campaign context in the fab from `usePathname()` and calling the rolls API directly from the fab — rejected because it duplicates `CampaignChat`'s POST/append/dedupe/scroll logic in a second place and reintroduces the risk items called out in explore-mode review (stale/duplicate logic, scroll-rule divergence).
- Rationale: Matches the "dice UI emits, chat consumes and owns persistence + scrolling" ownership split. Double-checking ids on the consuming side (not just gating visibility on the producing side) defends against the specific multi-tab/late-event race called out in the proposal's risks.
- Trade-offs: Slightly more bookkeeping in `CampaignChat` (two extra `useEffect`s), justified by closing the cross-delivery risk without any server-side change.

### Decision 4: No server-side changes; bridge is explicitly documented as non-authoritative

- Chosen: `app/api/campaigns/[id]/rolls/route.ts` is untouched. The bridge's `campaignId`/`sessionId`/`visibility` values are never trusted as authorization — they only decide *whether `CampaignChat` calls the same `fetch()` it already calls today*. The actual POST body and headers sent are identical in shape to today's in-chat roll, and go through the same `withAuthAndParams` → membership → `assertCampaignAccess` → active-session-409 → payload-validation pipeline already in the route.
- Alternatives considered: Adding a lightweight "roll origin" field for telemetry — rejected as unnecessary for this change; can be a follow-up if analytics are wanted.
- Rationale: Keeps the change's blast radius entirely client-side, and keeps the existing, already-correct server trust boundary as the single source of truth.
- Trade-offs: None material — this is a constraint, not a compromise.

## Proposal to Design Mapping

- Proposal element: Persistent d20 icon on every page, requires login.
  - Design decision: Decision 1.
  - Validation approach: Component test rendering `GlobalDiceFab` under `useAuth()` mocked as unauthenticated (icon absent/inert) vs authenticated (icon present); manual check across a few representative routes.
- Proposal element: Center-screen modal, pool builder, Escape/outside-click close, no timeout.
  - Design decision: Decision 1.
  - Validation approach: Component test simulating Escape keydown and outside pointerdown closing the modal; assert no timer-based close exists (no `setTimeout` closing path in the component).
- Proposal element: Rolling with no active session shows result locally, no network call.
  - Design decision: Decision 1 (fab computes via `rollDicePool()` directly; only calls `requestRoll` when the user explicitly picks "send to chat" and presence is non-null).
  - Validation approach: Test asserting `fetch`/`requestRoll` is not called on a plain roll with no presence.
- Proposal element: "Send to session chat" option appears only while on that campaign's page with an active session.
  - Design decision: Decision 3 (presence announce/clear).
  - Validation approach: Test: mount `CampaignChat` with `activeSessionId` set + stream open → assert `announcePresence` called with correct ids; unmount or set `activeSessionId` to null → assert `clearPresence` called.
- Proposal element: Roll sent to chat uses existing persistence/dedupe/scroll path unchanged.
  - Design decision: Decision 3 (`onRollRequested` feeds into existing `handleRoll` tail).
  - Validation approach: Existing `CampaignChat.dicePool.test.tsx` / `CampaignChat.roll.test.tsx` continue passing unmodified; new test drives a roll via `requestRoll(...)` instead of the in-chat trigger and asserts identical POST/append/scroll outcome.
- Proposal element: Roll requested for a non-matching campaign/session is ignored.
  - Design decision: Decision 3 (id-match check on the consuming side).
  - Validation approach: Test: mount `CampaignChat` for campaign A/session X; call `requestRoll` with campaign B/session Y; assert no `fetch` call, no feed mutation.
- Proposal element: Server route remains sole trust boundary, unaffected by trigger source.
  - Design decision: Decision 4.
  - Validation approach: Existing route tests for `app/api/campaigns/[id]/rolls/route.ts` (auth/membership/active-session/validation) run unmodified and continue passing; no new route test needed since no route code changes, but explicitly re-run as a regression gate in `tasks.md`.

## Functional Requirements Mapping

- Requirement: Logged-in user can open a dice pool + roll from any page.
  - Design element: `GlobalDiceFab` (Decision 1).
  - Acceptance criteria reference: proposal AC 1, 3.
  - Testability notes: Component-level render/interaction tests; no route involved.
- Requirement: Unauthenticated user cannot access the panel.
  - Design element: `useAuth()` gating in `GlobalDiceFab` (Decision 1).
  - Acceptance criteria reference: proposal AC 2.
  - Testability notes: Mock `useAuth` to return `user: null`; assert fab not interactive/not rendered.
- Requirement: Modal closes on Escape/outside-click only, no timeout.
  - Design element: `GlobalDiceFab` modal (Decision 1), reusing the outside-click/Escape pattern already proven in `useDicePool`'s existing `handlePointerDown`/`handleKeyDown` effect.
  - Acceptance criteria reference: proposal AC 5.
  - Testability notes: Simulate both close paths; assert no `setTimeout`/`setInterval` in the component driving closure.
- Requirement: "Send to session chat" appears/disappears correctly based on presence.
  - Design element: Decision 3.
  - Acceptance criteria reference: proposal AC 6, 7.
  - Testability notes: Bridge unit tests (announce/clear) + fab test subscribing and toggling UI.
- Requirement: Cross-campaign/session roll requests are ignored.
  - Design element: Decision 3 (id-match guard).
  - Acceptance criteria reference: proposal AC 8.
  - Testability notes: Bridge/`CampaignChat` test with mismatched ids, as above.
- Requirement: Existing in-chat dice behavior unaffected.
  - Design element: `CampaignChat`'s own `useDicePool`/`DicePoolPanel`/`DiceTriggerButton`/`handleRoll` untouched (Decision 3, additive-only change).
  - Acceptance criteria reference: proposal AC 9.
  - Testability notes: Existing `CampaignChat.dicePool*.test.tsx` suite run unmodified as a regression gate.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Client-side bridge must never function as, or be mistaken for, an authorization mechanism.
  - Design element: Decision 4.
  - Acceptance criteria reference: proposal AC 10 (route auth/session checks unaffected).
  - Testability notes: Route-level tests unchanged and re-run as a regression gate; design doc explicitly documents this so future reviewers/agents don't add trust to the bridge.
- Requirement category: reliability
  - Requirement: No stale-listener or cross-tab/cross-campaign misdelivery.
  - Design element: Decision 3 (scoped ids, explicit unsubscribe on unmount).
  - Acceptance criteria reference: proposal AC 8.
  - Testability notes: Lifecycle tests covering mount/unmount/re-mount with different ids.
- Requirement category: operability/maintainability
  - Requirement: Bridge stays a narrow, purpose-built module rather than growing into a general event system.
  - Design element: Decision 2 (two named functions per direction, no generic `emit(topic, payload)` API).
  - Acceptance criteria reference: proposal "Non-Goals".
  - Testability notes: Code review checklist item at PR time; not independently automatable.
- Requirement category: performance
  - Requirement: Adding a persistent fab to every page must not introduce noticeable layout shift or re-render cost.
  - Design element: `GlobalDiceFab` renders a small fixed-position button plus a conditionally-rendered modal (mounted only when open), matching the existing body-portal pattern already used for dice popouts.
  - Acceptance criteria reference: proposal Risks (visual collision item).
  - Testability notes: Manual visual check across representative pages during implementation; no automated perf test planned for this change.

## Risks / Trade-offs

- Risk/trade-off: Two separate dice-pool UI implementations (fab vs. in-chat) increase surface area and could drift in look/behavior over time.
  - Impact: Inconsistent UX between the two entry points if one is updated without the other.
  - Mitigation: Extract shared, presentation-only pieces (e.g., the per-die-size stepper row) into a small shared component/hook if/when drift becomes a maintenance burden; not required for this change since scopes and disabled-states genuinely differ.
- Risk/trade-off: Module-singleton bridge state persists across test files if not reset.
  - Impact: Flaky tests if one test's `announcePresence` bleeds into another.
  - Mitigation: Export a test-only `resetDiceSessionBridge()` and call it in `afterEach` in the relevant test files.

## Rollback / Mitigation

- Rollback trigger: Regression in existing `CampaignChat` dice/chat tests, or a production report of a roll being misdelivered/lost, or visual regression from the fab that can't be quickly fixed.
- Rollback steps: Revert the `app/layout.tsx` mounting line for `GlobalDiceFab` (removes the new UI entirely) and revert the two new effects in `CampaignChat.tsx` (presence announce/clear, roll-request subscription). Both are additive diffs against `CampaignChat.tsx`, so reverting them is a clean, isolated revert. `lib/dice/diceSessionBridge.ts` and the new fab component can be deleted or left dormant (unused) with no effect on existing behavior since nothing else imports them.
- Data migration considerations: None — no schema, storage, or API changes.
- Verification after rollback: Existing `CampaignChat` test suite passes; manual check that in-chat dice rolling still works exactly as before.

## Operational Blocking Policy

- If CI checks fail: Do not merge; fix the failing test/lint/build in the same PR. Given the change is additive and scoped to two new files plus small additive edits to `CampaignChat.tsx`, failures are expected to be locally reproducible and fast to fix.
- If security checks fail: Treat any finding touching `app/api/campaigns/[id]/rolls/route.ts` as a hard blocker requiring investigation, since this change is designed to touch that route not at all — any diff there is unexpected and must be explained before proceeding.
- If required reviews are blocked/stale: Ping the reviewer once; if no response within the team's normal review SLA, escalate per existing team process (no special-case process introduced by this change).
- Escalation path and timeout: Standard project PR review process; no new escalation mechanism introduced by this change.

## Open Questions

- None blocking. See proposal.md's "Open Questions" for the one non-blocking follow-up (fab visual placement details), to be resolved during implementation/visual review rather than before tasks/specs.
