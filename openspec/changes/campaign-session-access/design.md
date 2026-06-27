## Context

- Relevant architecture:
  - `app/campaigns/page.tsx` — client component rendering Active Campaigns Dashboard and campaign grid. Already fetches `/api/campaigns/${campaign.id}/sessions?limit=1` per active campaign to populate `sessionsByCampaign` state.
  - `app/campaigns/[id]/layout.tsx` — client layout wrapping all campaign sub-pages. Already fetches `/api/campaigns/${id}` on mount to read `activeSessionId`.
  - `app/campaigns/[id]/page.tsx` — Members page (campaign sub-page)
  - `app/campaigns/[id]/sessions/page.tsx` — Session Journal page (campaign sub-page)
  - `app/campaigns/[id]/prompts/page.tsx` — Prompt Builder page (campaign sub-page)
  - `app/campaigns/[id]/library/page.tsx` — Library page (campaign sub-page)
- Dependencies: Next.js `Link`, `usePathname` (next/navigation), existing UI primitives from `@/lib/components/ui`
- Interfaces/contracts touched: No API changes. Read-only use of existing `/api/campaigns/${id}` response shape (adds `name` field read).

## Goals / Non-Goals

### Goals

- Always surface a session entry point on the Active Campaigns Dashboard, regardless of session count
- Add "Session Log" button to Active Campaigns Dashboard action row
- Add campaign name header + tab bar (Members | Sessions | Prompts | Library) to all campaign sub-pages via layout

### Non-Goals

- No new API endpoints or backend changes
- No Combat/Encounters tab
- No session count endpoint
- No changes to session page content or forms

## Decisions

### Decision 1: Session section always renders in Active Campaigns Dashboard

- Chosen: Render session section unconditionally. When `lastSession` is null, show "No sessions logged yet." and a "Log First Session →" `<Link>` to `/campaigns/${campaign.id}/sessions`. When `lastSession` exists, render the existing session card with "View all sessions →".
- Alternatives considered: Keep conditional render, only add a button to the action row. This was rejected because it still leaves the session section invisible when no sessions exist.
- Rationale: Confirmed by user — empty state CTA prompts first-time use and makes the sessions feature discoverable from day one.
- Trade-offs: Slightly more markup per campaign card, but negligible; no extra fetch needed.

### Decision 2: "Session Log" button added to Active Campaigns action row

- Chosen: Add `<Link href={`/campaigns/${campaign.id}/sessions`}>Session Log</Link>` styled consistently with existing action buttons (green, matching the "Session Log" button already present in the campaign grid).
- Alternatives considered: Remove from the grid and only show in the dashboard. Rejected — no reason to remove discoverability from the grid.
- Rationale: The campaign grid already has this button. Parity is the right default.
- Trade-offs: Button row becomes 5 items; wraps on small screens, which is already the case with 4 items.

### Decision 3: Campaign name + sub-nav tab bar in layout

- Chosen: Extend `app/campaigns/[id]/layout.tsx` to read `data?.name` from the existing `/api/campaigns/${id}` fetch (same request already in flight for `activeSessionId`). Render the name as an `<h1>` or section header above a tab bar. Tab bar uses `usePathname()` to detect active tab: exact match on `/campaigns/${id}` for Members, `.startsWith('/campaigns/${id}/sessions')` for Sessions, `.startsWith('/campaigns/${id}/prompts')` for Prompts, `.startsWith('/campaigns/${id}/library')` for Library.
- Alternatives considered: Move nav into each individual page. Rejected — layout is the right abstraction; avoids duplication across 4 pages.
- Rationale: Zero extra network cost (name comes from existing fetch). `usePathname()` is the Next.js idiomatic approach for active link detection in client layouts.
- Trade-offs: Layout is already `'use client'` so `usePathname()` is available without RSC concerns. If campaign name fetch fails, header gracefully omits name (empty string fallback).

### Decision 4: Active tab matching strategy

- Chosen: Path-based string matching — `pathname === `/campaigns/${id}`` for Members (exact), `pathname.startsWith(`/campaigns/${id}/sessions`)` for Sessions, `/prompts` for Prompts, `/library` for Library.
- Alternatives considered: Segment-based matching. More robust but adds complexity not warranted here.
- Rationale: Route structure is stable; the matching strings are explicit and easy to update if routes change.
- Trade-offs: Would need manual update if sub-routes are added (e.g., `/sessions/[sessionId]`), but `startsWith` already handles that case.

## Proposal to Design Mapping

- Proposal element: Session section always renders in Active Campaigns Dashboard
  - Design decision: Decision 1
  - Validation approach: Test renders campaign card with no sessions → CTA link visible; with sessions → session card visible
- Proposal element: "Session Log" button in Active Campaigns action row
  - Design decision: Decision 2
  - Validation approach: Test action row contains "Session Log" link pointing to correct URL
- Proposal element: Campaign name header in sub-nav
  - Design decision: Decision 3
  - Validation approach: Mock layout fetch; assert campaign name renders in header
- Proposal element: Tab bar with Members | Sessions | Prompts | Library
  - Design decision: Decision 3 + 4
  - Validation approach: Test each route pathname produces correct active tab highlight
- Proposal element: No backend changes
  - Design decision: Decisions 1–4 all pure frontend
  - Validation approach: No new API routes introduced; verified by file inspection

## Functional Requirements Mapping

- Requirement: Session Log link always present on active campaign cards
  - Design element: Decision 1 + 2
  - Acceptance criteria reference: specs/campaign-dashboard-sessions.md
  - Testability notes: Unit test CampaignsContent with `sessionsByCampaign` set to `{}` (no sessions); assert link present

- Requirement: Empty state CTA shown when campaign has no sessions
  - Design element: Decision 1
  - Acceptance criteria reference: specs/campaign-dashboard-sessions.md
  - Testability notes: Assert "Log First Session" link renders when `lastSession === null`

- Requirement: Tab bar visible on all campaign sub-pages
  - Design element: Decision 3
  - Acceptance criteria reference: specs/campaign-subnav.md
  - Testability notes: Unit test layout component with each pathname; assert all four tabs render

- Requirement: Active tab highlighted based on current route
  - Design element: Decision 4
  - Acceptance criteria reference: specs/campaign-subnav.md
  - Testability notes: Parameterized tests across four pathnames; assert correct tab has active class

- Requirement: Campaign name shown in sub-nav header
  - Design element: Decision 3
  - Acceptance criteria reference: specs/campaign-subnav.md
  - Testability notes: Mock fetch returning `{ name: "Test Campaign" }`; assert name visible in rendered layout

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: No additional network requests introduced
  - Design element: Reuse existing `/api/campaigns/${id}` fetch in layout; read `name` from same response
  - Acceptance criteria reference: n/a (verified by code review)
  - Testability notes: Confirm single fetch call in layout tests; no new `fetch` calls added

- Requirement category: reliability
  - Requirement: Sub-nav degrades gracefully if campaign name fetch fails
  - Design element: Decision 3 — empty string fallback for name
  - Acceptance criteria reference: specs/campaign-subnav.md
  - Testability notes: Mock fetch failure; assert tabs still render, name header omitted

## Risks / Trade-offs

- Risk/trade-off: Tab bar adds visible chrome to all campaign sub-pages
  - Impact: Minor visual change; existing pages gain a header they didn't have
  - Mitigation: Styling should match existing dark theme; reviewed in browser before merge

- Risk/trade-off: `startsWith` path matching could highlight Sessions tab for nested session sub-routes (future)
  - Impact: Correct behaviour — highlighting Sessions when inside a session is desirable
  - Mitigation: No action needed; document in code comment

## Rollback / Mitigation

- Rollback trigger: Regression in campaign pages (layout breaks, tabs error, missing content)
- Rollback steps: Revert commits to `app/campaigns/page.tsx` and `app/campaigns/[id]/layout.tsx`; no data migration needed
- Data migration considerations: None — frontend-only change
- Verification after rollback: Confirm Active Campaigns Dashboard and campaign sub-pages render as before

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests or type errors before proceeding.
- If security checks fail: Do not merge. Escalate to project maintainer.
- If required reviews are blocked/stale: Ping reviewer after 24h; escalate to maintainer after 48h.
- Escalation path and timeout: Project maintainer (@dougis) is the final escalation point.

## Open Questions

No open questions. All decisions confirmed during exploration phase before proposal was written.
