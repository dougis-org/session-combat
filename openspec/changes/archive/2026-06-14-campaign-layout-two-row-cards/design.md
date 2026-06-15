## Context

- Relevant architecture: `app/campaigns/page.tsx` is a single Next.js client component containing the full campaigns page. It renders two distinct campaign card contexts: (1) the "Active Campaigns" dashboard section (large cards with party rosters) and (2) the "All Campaigns" list section (compact `md:grid-cols-2` grid). Both share the same layout bug.
- Dependencies: Tailwind CSS (utility classes only, no custom components). `lib/components/ui.tsx`, `lib/components/CampaignChapterInfo.tsx`, `lib/components/CharacterRosterCard.tsx` are rendered inside the cards but are not themselves changed.
- Interfaces/contracts touched: DOM structure of campaign cards in `app/campaigns/page.tsx`. `tests/unit/components/CampaignsPage.test.tsx` queries may need updating.

## Goals / Non-Goals

### Goals

- Eliminate chip/button overlap in campaign cards at all viewport widths
- Establish a stable two-row card header pattern (info row + action row) extensible for future chips
- Preserve all existing functionality and data rendering
- Keep tests green

### Non-Goals

- Access-level chip implementation
- Action button set changes
- New API calls or data fetching
- Responsive redesign beyond fixing the existing grid

## Decisions

### Decision 1: Two-row card layout (header row + action row)

- Chosen: Split each card's top section into two flex rows — a header row containing `[title] [status chip]` and an action row containing `[action buttons]`.
- Alternatives considered:
  - Single row with `flex-shrink-0` on buttons only (Option C from explore) — stops overflow but doesn't give the header room to grow for future chips
  - Inline status in title text — user explicitly rejected; reduces evolvability
- Rationale: Eliminates horizontal competition entirely. Header row can independently accommodate additional chips (access level, etc.) without touching the action row.
- Trade-offs: Cards are slightly taller. Vertical space is cheap on this page; horizontal correctness is essential.

### Decision 2: Header row structure

- Chosen: `flex items-center gap-2 flex-wrap` row containing `<h2/h3>` with `min-w-0 truncate` and the status chip with `flex-shrink-0`.
- Alternatives considered: Grid layout — more complex, no benefit over flex here.
- Rationale: `min-w-0` on the title allows `truncate` to engage when the title is very long. `flex-shrink-0` on the chip ensures it is never squeezed out. `flex-wrap` is a safety valve for extreme cases (very long title + multiple future chips).
- Trade-offs: Long titles will truncate; tooltip is not added in this change (non-goal).

### Decision 3: Action row structure

- Chosen: `flex flex-wrap gap-2 mt-3` row containing all action buttons/links, left-aligned.
- Alternatives considered: Right-aligned buttons — current convention in the single-row layout, but left-alignment reads more naturally in a stacked context.
- Rationale: `flex-wrap` ensures buttons reflow gracefully on mobile without overflow. `mt-3` provides consistent visual separation from the header row.
- Trade-offs: Left-aligned buttons is a minor visual change from the current right-aligned style. Acceptable given the layout fix it enables.

### Decision 4: Apply same pattern to both card contexts

- Chosen: Apply the two-row pattern to both the campaign list cards and the active campaigns dashboard cards.
- Alternatives considered: Fix list cards only — does not address the active campaigns chip overflow reported in the screenshot.
- Rationale: Both contexts share the root cause. Consistent pattern across the page is easier to maintain.
- Trade-offs: Slightly more code changed, but both sections are in the same file.

## Proposal to Design Mapping

- Proposal element: Status chip collides with action buttons
  - Design decision: Decision 1 (two-row layout)
  - Validation approach: Visual test — render card with long name + 4 buttons; confirm no overlap

- Proposal element: Long campaign names overflow
  - Design decision: Decision 2 (`min-w-0 truncate` on title)
  - Validation approach: Unit test with a 100-character name; confirm truncation

- Proposal element: Header designed for future access-level chip
  - Design decision: Decision 2 (`flex-wrap` header row with `flex-shrink-0` chips)
  - Validation approach: No test needed for the extension point itself; structure is validated by chip rendering test

- Proposal element: Both card contexts affected
  - Design decision: Decision 4
  - Validation approach: Unit tests cover both list and active campaigns sections

## Functional Requirements Mapping

- Requirement: Status chip always visible alongside campaign name
  - Design element: Header row, chip with `flex-shrink-0`
  - Acceptance criteria reference: specs/campaign-card-layout/spec.md — FR1
  - Testability notes: RTL query by status chip text; assert it is in the document

- Requirement: Action buttons never overlap header content
  - Design element: Separate action row below header
  - Acceptance criteria reference: specs/campaign-card-layout/spec.md — FR2
  - Testability notes: RTL — assert buttons are present and header text is present (DOM order confirms separation)

- Requirement: Long titles truncate rather than overflow
  - Design element: `min-w-0 truncate` on title element
  - Acceptance criteria reference: specs/campaign-card-layout/spec.md — FR3
  - Testability notes: Render with long name; assert `truncate` class applied to title element

- Requirement: All existing action links/buttons remain functional
  - Design element: Action row contains same elements as before, only container changes
  - Acceptance criteria reference: specs/campaign-card-layout/spec.md — FR4
  - Testability notes: Click each button/link in RTL; assert callback/navigation triggered

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: No new dependencies introduced
  - Design element: Pure Tailwind utility class changes inside existing component
  - Acceptance criteria reference: No new packages in package.json
  - Testability notes: `git diff package.json` — no changes

- Requirement category: reliability
  - Requirement: Existing tests remain green
  - Design element: Update selectors in CampaignsPage.test.tsx to match new DOM structure
  - Acceptance criteria reference: `npm run test:unit` passes
  - Testability notes: Run unit suite before and after; assert no regressions

## Risks / Trade-offs

- Risk/trade-off: Test selectors break due to DOM restructure
  - Impact: CI fails
  - Mitigation: Review `CampaignsPage.test.tsx` before writing code; identify all button/chip queries and update to role or text-based queries

- Risk/trade-off: Active campaigns card height increases noticeably
  - Impact: Minor visual change; page is slightly longer
  - Mitigation: Acceptable — fix correctness first. If user objects, padding can be tuned.

## Rollback / Mitigation

- Rollback trigger: Visual regression reported in prod or CI unit tests fail after merge
- Rollback steps: Revert the PR; single-file change makes this trivial
- Data migration considerations: None — pure UI change
- Verification after rollback: Run `npm run test:unit`; visually confirm campaign list renders

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing test or build error first.
- If security checks fail: Do not merge. This change has no security surface (pure layout), so any security failure is unrelated and must be investigated separately.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to maintainer after 48 hours.
- Escalation path and timeout: If blocked >48 hours, maintainer (dougis) has authority to approve.

## Open Questions

No open questions. Design is fully specified and confirmed.
