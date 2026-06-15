## GitHub Issues

- #420

## Why

- Problem statement: Campaign cards in both the campaign list and active campaigns dashboard suffer from layout overlap — the status chip collides with action link chips when titles are long or the viewport is narrow, and action buttons compress or overflow their container.
- Why now: The issue was filed 2026-06-14 with a screenshot showing the problem in production. The layout is the first thing users see when managing campaigns and it degrades trust in the app.
- Business/user impact: Users cannot reliably click action links; the status badge (a key at-a-glance signal) is obscured by overlapping elements.

## Problem Space

- Current behavior: Each campaign card uses a single `flex justify-between` row that holds both `[Title + Status chip]` on the left and `[Action buttons]` on the right. Neither side has `flex-shrink-0` or `min-w-0`, so on narrow viewports (or with long campaign names) the two sides compete for space — chips and buttons overlap or flow outside the card boundary.
- Desired behavior: Campaign cards use a two-row layout. The top row shows the campaign name, status chip, and (in future) access-level chip. The bottom row shows action buttons, left-aligned with consistent spacing. The two rows never compete for horizontal space.
- Constraints: Must not break the existing `md:grid-cols-2` grid used in the campaign list. Must work on the same Tailwind / Next.js stack already in use. Must not require new data fetching — the access-level chip is a future extension point only.
- Assumptions: Both the campaign list section and the active campaigns dashboard section need the same fix, though the active campaigns cards are larger and have different action sets.
- Edge cases considered:
  - Very long campaign names (should truncate with ellipsis, not push chips off-screen)
  - Many action buttons (4 is the current max; wrapping is acceptable on mobile)
  - Status values: planning, active, on-hold, completed — all must render clearly
  - Campaigns with no module name or chapter info (header row should collapse gracefully)

## Scope

### In Scope

- Refactor `app/campaigns/page.tsx`: campaign list cards (lines 428–474) to two-row layout
- Refactor `app/campaigns/page.tsx`: active campaigns cards (lines 234–390) to two-row layout
- Status chip: retain as a chip in the header row (not inlined into the title text)
- Header row designed to accommodate a future access-level chip without further restructuring
- `min-w-0` / `truncate` on title to handle long names gracefully
- Unit test update: `tests/unit/components/CampaignsPage.test.tsx` to reflect new DOM structure if selectors break

### Out of Scope

- Access-level chip implementation (data not currently fetched in this view)
- Any changes to campaign API or data model
- Active campaigns action button set rationalization (Members, Prompt Builder, Library, Start Encounter)
- Responsive breakpoint redesign beyond fixing the existing two-column grid

## What Changes

- `app/campaigns/page.tsx`: campaign list card inner layout restructured from single flex row to two-row (header + actions)
- `app/campaigns/page.tsx`: active campaigns card header restructured to same two-row pattern
- `tests/unit/components/CampaignsPage.test.tsx`: update any DOM queries that relied on old layout structure

## Risks

- Risk: Existing unit test selectors may query buttons by position relative to the title
  - Impact: Tests fail after refactor
  - Mitigation: Review `CampaignsPage.test.tsx` before and after; update selectors to use `data-testid` or accessible text queries

- Risk: Two-row layout adds vertical height to each card, potentially making the list feel taller
  - Impact: Minor UX change; list feels more spacious
  - Mitigation: Acceptable trade-off; cards gain clarity. No padding changes beyond what the new row requires.

## Open Questions

No unresolved ambiguity. Design direction confirmed in explore session: Option B (two-row), status as chip, header designed for future access-level chip extension.

## Non-Goals

- Adding access-level (DM / Player / Observer) chip to the header — this is a confirmed future extension, not part of this change
- Changing the action button set or their ordering
- Introducing new API calls or state

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
