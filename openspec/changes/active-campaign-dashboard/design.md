## Context

- Relevant architecture: Next.js App Router with client components. Data layer via MongoDB through `lib/storage.ts`. Auth via `withAuth`/`requireAuth` middleware. All existing campaign/party/character pages are client-side fetching with `useState`/`useEffect`.
- Dependencies: `lib/types.ts` (Campaign, Party, PartyMember, Character, SessionLog), `/api/campaigns`, `/api/parties`, `/api/characters`, `/api/campaigns/[id]/sessions` — all exist, no new endpoints needed.
- Interfaces/contracts touched:
  - `app/campaigns/page.tsx` — extended state and fetch logic, new dashboard UI section
  - `lib/components/CharacterRosterCard.tsx` — new component, public props interface
  - `lib/components/CampaignChapterInfo.tsx` — new component, public props interface

## Goals / Non-Goals

### Goals

- Active campaigns visible immediately on page load at `/campaigns`
- Each active campaign card shows: name, module/chapter, party members grouped by type, and (lazily) last session
- New `CharacterRosterCard` component is the canonical roster display (no combat stats)
- `CharacterMiniSummary` is unchanged — combat-only
- No new API endpoints

### Non-Goals

- HP/AC display in the dashboard
- Real-time state or websockets
- Modifying the existing campaign management list
- Creating session logs from the dashboard

## Decisions

### Decision 1: Roster display — new CharacterRosterCard, not CharacterMiniSummary

- Chosen: New `lib/components/CharacterRosterCard.tsx` that renders name, race, class/level summary, and NPC/Companion type badge. No AC, no HP, no `CombatStatsRow`.
- Alternatives considered: (A) Reuse `CharacterMiniSummary` as-is showing AC/HP. (B) Add a `showCombatStats` prop to `CharacterMiniSummary`.
- Rationale: Between sessions, HP/AC are stale or meaningless. A separate component keeps the combat widget pure and avoids prop-proliferation on `CharacterMiniSummary`. The roster card is also simpler — no imports from `CombatStatsRow`.
- Trade-offs: Two components to maintain instead of one. Acceptable — they serve distinct contexts (roster identity vs live combat state).

### Decision 2: CampaignChapterInfo as a new simple component

- Chosen: New `lib/components/CampaignChapterInfo.tsx` that accepts `chapters: CampaignChapter[]` and `currentChapterId?: string` and renders `Module · Chapter: <title>`. Falls back gracefully to "No chapter set" when `currentChapterId` is absent or references a missing chapter.
- Alternatives considered: Inline the chapter display directly in the campaign card JSX.
- Rationale: Reusable — the same display could appear in other contexts (session log, prompt builder). Keeps the campaign card JSX readable.
- Trade-offs: Small overhead of an additional file for a ~10-line component.

### Decision 3: Parallel Promise.all fetch with client-side joins

- Chosen: Replace the two separate `fetchCampaigns()` / `fetchTemplates()` calls with a single `Promise.all([fetch('/api/campaigns'), fetch('/api/parties'), fetch('/api/characters'), fetch('/api/campaigns/global')])`. All joins (party→campaign, character→party member) happen client-side.
- Alternatives considered: New server-side aggregation API endpoint that returns the full denormalized dashboard payload.
- Rationale: Consistent with the existing app pattern. User data sets (parties, characters) are small. Avoids backend changes and keeps the scope contained.
- Trade-offs: N+1 is not a concern here (all fetched in parallel), but total payload size grows. Acceptable for typical DM data sets.

### Decision 4: Lazy secondary useEffect for session data

- Chosen: After the main dashboard renders, a second `useEffect` (keyed on active campaign IDs) fires `Promise.all` of `GET /api/campaigns/[id]/sessions?limit=1` for each active campaign. Results stored in `Record<string, SessionLog | null>`. Last Session card renders only when `sessionsByCampaign[id]` is defined and non-null.
- Alternatives considered: Include session fetch in the main `Promise.all` (blocks main render). Fetch sessions in a single dedicated route (not currently available).
- Rationale: Main render path must not block on session data. Session data is additive context, not core content.
- Trade-offs: Multiple small requests fire after render. Acceptable for typical campaign counts (1–3).

### Decision 5: PC vs NPC grouping logic

- Chosen: Within each party sub-card, active members (`members.filter(m => !m.leftAt)`) are split:
  - **Player Characters**: `characterType === 'character'` or `characterType` undefined (backwards-compatible)
  - **Travelling NPCs & Companions**: `characterType === 'npc'` or `characterType === 'companion'`
  - Sections with zero members are hidden.
- Alternatives considered: Show all members in a flat list.
- Rationale: Matches the existing grouping pattern on the parties page and the issue spec intent.
- Trade-offs: None significant.

## Proposal to Design Mapping

- Proposal element: New `CharacterRosterCard` (no combat stats)
  - Design decision: Decision 1
  - Validation approach: Unit test renders correct fields; AC/HP are absent from output.

- Proposal element: New `CampaignChapterInfo` component
  - Design decision: Decision 2
  - Validation approach: Unit test with present/missing `currentChapterId`; fallback text verified.

- Proposal element: Parallel fetch for campaigns, parties, characters
  - Design decision: Decision 3
  - Validation approach: Unit test with mocked fetch; verify all three responses consumed.

- Proposal element: Lazy Last Session card
  - Design decision: Decision 4
  - Validation approach: Unit test — secondary useEffect not triggered until active campaigns known; card absent when session data null.

- Proposal element: PC vs NPC grouping
  - Design decision: Decision 5
  - Validation approach: Unit test — characters split correctly by `characterType`; sections hidden when empty.

## Functional Requirements Mapping

- Requirement: Active campaigns shown at top of `/campaigns`
  - Design element: Dashboard section above management list in `app/campaigns/page.tsx`
  - Acceptance criteria reference: specs/dashboard.md — "active campaigns section"
  - Testability notes: Unit test renders `n` campaign cards when `n` campaigns have `active: true`.

- Requirement: No active campaigns → CTA card
  - Design element: Conditional render in dashboard section
  - Acceptance criteria reference: specs/dashboard.md — "empty state"
  - Testability notes: Unit test — zero active campaigns renders CTA, no campaign cards.

- Requirement: Party members split by type, active members only
  - Design element: Decision 5 grouping logic
  - Acceptance criteria reference: specs/roster.md — "member grouping"
  - Testability notes: Unit test — members with `leftAt` excluded; `characterType` split verified.

- Requirement: Last Session card conditional on data
  - Design element: Decision 4 lazy fetch
  - Acceptance criteria reference: specs/session-card.md — "conditional render"
  - Testability notes: Unit test — card absent when session null; renders session N, title, date, milestone badge when present.

- Requirement: `CharacterRosterCard` shows name, race, class/level, type badge; no AC/HP
  - Design element: Decision 1
  - Acceptance criteria reference: specs/roster.md — "roster card fields"
  - Testability notes: Unit test — snapshot or field-presence assertions.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Main dashboard render must not block on session data
  - Design element: Decision 4 (lazy secondary useEffect)
  - Acceptance criteria reference: specs/session-card.md — "non-blocking"
  - Testability notes: Unit test — main render completes before session useEffect fires.

- Requirement category: reliability
  - Requirement: Missing/null session data must not crash or show error state
  - Design element: `sessionsByCampaign[id]` null-guard before rendering Last Session card
  - Acceptance criteria reference: specs/session-card.md — "absent on null"
  - Testability notes: Unit test — null session data results in card absence, no thrown error.

- Requirement category: operability
  - Requirement: `CampaignChapterInfo` must not crash on missing chapter
  - Design element: Decision 2 — defensive lookup with fallback
  - Acceptance criteria reference: specs/chapter-info.md — "fallback"
  - Testability notes: Unit test — `currentChapterId` referencing non-existent chapter renders fallback text.

## Risks / Trade-offs

- Risk/trade-off: Client-side joins on full party/character lists may be slow for large datasets.
  - Impact: Low — DM datasets are small by nature.
  - Mitigation: No mitigation needed now; can add server-side filtering later if profiling reveals an issue.

- Risk/trade-off: Two roster components (`CharacterRosterCard` + `CharacterMiniSummary`) may drift.
  - Impact: Low — they serve distinct purposes.
  - Mitigation: Both are small, well-typed components. The roster card has no combat-state props so divergence is by design.

## Rollback / Mitigation

- Rollback trigger: Dashboard section causes runtime errors on the campaigns page, or breaks existing campaign management flows.
- Rollback steps: Revert `app/campaigns/page.tsx` to the pre-feature version. The two new components (`CharacterRosterCard`, `CampaignChapterInfo`) can remain — they are unused without the page changes.
- Data migration considerations: None — no schema changes, no new collections, no data written.
- Verification after rollback: `/campaigns` page loads, campaign list renders, create/edit/delete functions work.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check before proceeding. Do not use `--no-verify` or `--admin` merge.
- If security checks fail: Do not merge. Treat as a blocker regardless of urgency.
- If required reviews are blocked/stale: Re-request review after 24 hours. Escalate to maintainer after 48 hours.
- Escalation path and timeout: If blocked for more than 72 hours with no response, raise in project discussion and consider splitting the PR.

## Open Questions

No open questions. All decisions confirmed in the explore session.
