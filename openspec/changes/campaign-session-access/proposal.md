## GitHub Issues

- #442

## Why

- Problem statement: Sessions are hard to find from the Campaign screen. Users must scroll to the all-campaigns grid at the bottom of `/campaigns` and locate the "Session Log" button there. The prominent Active Campaigns Dashboard has no direct session entry point unless sessions already exist (in which case a small "View all sessions →" link appears). The per-campaign sub-pages (`/campaigns/[id]/*`) have no navigation between Members, Sessions, Prompts, and Library.
- Why now: Sessions are a core workflow — DMs log sessions after every game. Burying the entry point behind the full campaign list creates unnecessary friction for the most frequent action.
- Business/user impact: Reduces clicks-to-sessions for active campaigns from 3+ to 1. Surfaces sessions even when none exist yet, prompting first-time use.

## Problem Space

- Current behavior:
  - Active Campaigns Dashboard shows session info only when sessions already exist (conditional render), with a small text link "View all sessions →"
  - No "Session Log" button in the Active Campaigns Dashboard action row
  - Campaign sub-pages (`/campaigns/[id]`, `/campaigns/[id]/sessions`, etc.) have no sub-navigation — each page only has "Back to Campaigns" which drops the user back to the root list
- Desired behavior:
  - Active Campaigns Dashboard always shows a session section: last session info if sessions exist, or a "Log First Session" CTA if not
  - "Session Log" button always present in the Active Campaigns Dashboard action row
  - All campaign sub-pages share a tab bar showing: Members | Sessions | Prompts | Library, with the campaign name displayed as a header
- Constraints:
  - No backend changes — purely frontend navigation and discoverability
  - The layout at `app/campaigns/[id]/layout.tsx` already fetches `/api/campaigns/${id}`; extend it to read `name` alongside `activeSessionId`
  - Active tab detection via `usePathname()` in the layout
- Assumptions:
  - Session numbers are sequential, so `lastSession.sessionNumber` is a reliable proxy for total session count
  - The `/encounters` route for Combat is intentionally separate and should NOT appear in the campaign sub-nav
- Edge cases considered:
  - Campaign with no sessions: session section shows CTA instead of session card
  - Campaign with sessions: last session shown with "View all sessions →"
  - Layout fetch failure (campaign name unavailable): sub-nav renders without the name header, tabs still function

## Scope

### In Scope

- Add "Session Log" button to Active Campaigns Dashboard action row (`app/campaigns/page.tsx`)
- Make session section always render in Active Campaigns Dashboard (with CTA when empty)
- Add campaign name header and Members | Sessions | Prompts | Library tab bar to `app/campaigns/[id]/layout.tsx`
- Active tab highlighting via `usePathname()`

### Out of Scope

- Backend API changes
- Combat / Encounters tab in sub-nav (Encounters is a separate `/encounters` route)
- Session count endpoint or displaying exact session count
- Any changes to session data, forms, or session page content
- Mobile/responsive layout overhaul

## What Changes

- `app/campaigns/page.tsx`: session section in Active Campaigns Dashboard always renders; add "Session Log" `<Link>` to action button row
- `app/campaigns/[id]/layout.tsx`: fetch and display campaign name as section header; add tab bar component with four tabs (Members, Sessions, Prompts, Library) using `usePathname()` for active state

## Risks

- Risk: Layout fetch adds a network call on every campaign sub-page load
  - Impact: Minor — `/api/campaigns/${id}` is already called by the layout for `activeSessionId`; this just reads an additional field from the same response
  - Mitigation: No extra fetch needed; parse `data?.name` from the existing response

- Risk: `usePathname()` active-tab detection may be fragile if route structure changes
  - Impact: Low — wrong tab highlighted, not a functional break
  - Mitigation: Use `pathname.endsWith('/sessions')` style matching, which is explicit and easy to update

## Open Questions

No unresolved ambiguity. All decisions were confirmed during exploration:
- Session section always renders (empty state CTA confirmed)
- Combat excluded from sub-nav (Encounters is separate, confirmed)
- Campaign name in sub-nav header (confirmed)

## Non-Goals

- Redesigning the campaign cards or overall campaigns page layout
- Adding session analytics or summaries to the dashboard
- Real-time session count via new API endpoint
- Any Encounters / Combat integration into campaign nav

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
