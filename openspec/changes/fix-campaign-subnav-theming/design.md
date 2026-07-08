## Context

- Relevant architecture: Next.js App Router. `app/campaigns/[id]/layout.tsx` is a client component (`'use client'`) shared by all campaign sub-routes. It renders a computed `header`, `nav`, `{children}` (the active route's page component), and a `chat` (`CampaignChat`) element, with two possible return branches depending on `isChatLarge` state.
- Dependencies: `next/navigation` (`useParams`, `usePathname`), `next/link` (`Link`), `@/lib/components/CampaignChat`. No new dependencies introduced.
- Interfaces/contracts touched: Only JSX/Tailwind class structure inside `layout.tsx` and the five sub-page files (`page.tsx`, `sessions/page.tsx`, `prompts/page.tsx`, `library/page.tsx`, `combat/page.tsx`). No props, API contracts, or data-fetching logic change.

## Goals / Non-Goals

### Goals

- Single source of truth for the campaign sub-page dark background (`bg-gray-900` + `min-h-screen` + `text-white`), owned by `layout.tsx`, covering header, nav, page content, and chat.
- Tab bar visually legible in both active and inactive states on every campaign sub-page, using filled-pill styling instead of underline-indicator styling.
- No behavior change to routing, active-tab detection, or `CampaignChat` sizing/interaction.

### Non-Goals

- No new shared `Tabs` component/abstraction.
- No change to which routes participate in the sub-nav.
- No accessibility redesign beyond preserving current semantics (still `<Link>` elements, still visually indicating active state).

## Decisions

### Decision 1: Move the dark background wrapper from each page to `layout.tsx`

- Chosen: Wrap the layout's entire rendered output (header + nav + children + chat) in one container with `bg-gray-900 min-h-screen text-white`, applied identically in both the `isChatLarge` branch and the default branch. Remove the equivalent wrapper (`min-h-screen bg-gray-900 text-white`) from each of the five sub-page files' top-level return.
- Alternatives considered:
  1. Set `bg-gray-900` on `<body>` globally in `app/layout.tsx`. Rejected: affects routes outside `/campaigns/[id]/*` (e.g., top-level dashboard, auth pages) which may intentionally use a different background; broadens blast radius beyond the reported bug.
  2. Leave background on each page but also add it to `layout.tsx`'s header/nav specifically (two separate dark boxes). Rejected: still risks a visible seam between the header/nav box and content box if colors or padding drift; doesn't satisfy "centralize" direction the requester chose.
- Rationale: The requester explicitly chose to centralize the background at a higher level and remove it from sub-pages (proposal "What Changes"). `layout.tsx` is the natural single owner since it wraps `{children}` for all five routes already.
- Trade-offs: Every sub-page's return JSX loses its own outer wrapper div, which is a mechanical edit across 5 files; must confirm no sub-page relies on that div for anything besides background/min-height (e.g., a ref, a test selector, or padding-only styling that must be preserved separately).

### Decision 2: Where exactly to place the background container in `layout.tsx`'s two branches

- Chosen: Introduce one variable, e.g. `content` = `<div className="bg-gray-900 min-h-screen text-white">{header}{nav}{children}</div>`, and reuse it in both branches:
  - Default branch: return `<>{content}{chat}</>`.
  - `isChatLarge` branch: `<div className="flex h-screen overflow-hidden"><main className="flex-1 overflow-auto p-4 bg-gray-900 text-white">{header}{nav}{children}</main>{chat}</div>` — background/text-color classes added to the existing `<main>` rather than nesting an extra div, since `<main>` already serves as the equivalent container in that branch.
- Alternatives considered: A single shared wrapper component used identically in both branches (e.g., always rendering `<main>` even in the non-large-chat case). Rejected for this change to minimize diff size — non-large-chat branch already uses a fragment `<>...</>`, and preserving that structure while just adding a background div is the smaller, lower-risk change.
- Rationale: Both branches must visually match; the risk called out in the proposal (isChatLarge branch has a different DOM structure) is addressed explicitly rather than only fixing the default branch.
- Trade-offs: Slight duplication of `bg-gray-900 text-white` class strings between the two branches instead of one shared JSX variable; acceptable given the branches already diverge structurally (flex row vs. fragment).

### Decision 3: Tab bar restyle to filled-pill tabs

- Chosen: Replace the current per-tab className:
  `${isActive ? 'border-b-2 border-blue-400 text-white' : 'text-gray-400'} px-2 py-1`
  with:
  `${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'} px-3 py-1.5 rounded-md text-sm font-medium transition-colors`
  (exact Tailwind values may be adjusted slightly during implementation to visually match the existing Prompt Builder sub-tabs, but the mechanism — solid background chip for active, plain text for inactive, no bottom border — is fixed.)
- Alternatives considered: Segmented control with an outer bordered container (considered and explicitly rejected by the requester in favor of the filled-pill option during exploration).
- Rationale: Matches requester's explicit choice and the existing visual language already present in Prompt Builder's own sub-tabs, giving the app one consistent tab idiom instead of two.
- Trade-offs: None significant; this is a pure Tailwind class swap on existing `<Link>` elements, no structural change to the tab list itself.

### Decision 4: `combat/page.tsx` loading-state background removal

- Chosen: Remove `min-h-screen bg-gray-900` from the loading-state div (`app/campaigns/[id]/combat/page.tsx:12`), keeping `flex items-center justify-center text-white` so the loading text stays centered and legible against the now-centralized layout background.
- Alternatives considered: Leave `combat/page.tsx`'s background untouched since it's out of scope (not one of the four nav tabs). Rejected: `combat/page.tsx` is still rendered inside the same `layout.tsx` (`{children}`), so leaving its own `bg-gray-900` would just reintroduce a redundant (harmless but inconsistent) nested background — better to remove for consistency with the other four pages, matching proposal's "What Changes" which explicitly includes this file.
- Rationale: Keeps all five sub-page files following the identical pattern; avoids one file being the odd one out.
- Trade-offs: None — purely a class removal with no behavior change; `min-h-screen` on this loading div wasn't load-bearing since the parent layout now guarantees `min-h-screen`.

## Proposal to Design Mapping

- Proposal element: Centralize `bg-gray-900 min-h-screen text-white` in `layout.tsx`, remove from 5 page files.
  - Design decision: Decision 1, Decision 2.
  - Validation approach: Manual visual check (or Playwright screenshot) on all four nav routes plus `/combat`, confirming a single continuous dark background with no white seam; unit/snapshot test asserting `layout.tsx`'s root element carries `bg-gray-900`.
- Proposal element: Restyle tab bar to filled-pill tabs (active = solid `bg-blue-600` chip, inactive = plain gray text).
  - Design decision: Decision 3.
  - Validation approach: Component/unit test asserting the active tab's `<Link>` has `bg-blue-600` class and inactive tabs do not; visual check for legibility against `bg-gray-900`.
- Proposal element: Reconcile `combat/page.tsx`'s loading-state background with the centralized approach.
  - Design decision: Decision 4.
  - Validation approach: Manual check that the "Loading combat data..." text still renders centered and readable; confirm no leftover `bg-gray-900` class on that div.
- Proposal element: Preserve `isChatLarge` branch behavior.
  - Design decision: Decision 2.
  - Validation approach: Manual check (or existing test if present) that expanding chat to large mode still shows the dark background across header/nav/content in the flex-row layout.

## Functional Requirements Mapping

- Requirement: All four campaign sub-pages (Members, Sessions, Prompts, Library) render header, nav, and content on one continuous `bg-gray-900` surface with no visible seam.
  - Design element: Decision 1, Decision 2.
  - Acceptance criteria reference: `specs/campaign-subnav/spec.md` (to be updated with new scenario: "Header, nav, and content share one background").
  - Testability notes: Can assert via DOM query that the layout's outermost content wrapper (or `<main>`, in the large-chat branch) has `bg-gray-900`, and that none of the five page components render their own `min-h-screen bg-gray-900` wrapper anymore (regression guard).
- Requirement: Active tab is visually distinguishable via solid background chip, not text color alone.
  - Design element: Decision 3.
  - Acceptance criteria reference: `specs/campaign-subnav/spec.md` (updated scenario replacing "border-b-2" active-state description with "bg-blue-600 chip").
  - Testability notes: Assert active tab's class list includes `bg-blue-600`; assert inactive tabs' class list does not include `bg-blue-600` and does not include the old `border-b-2` classes.
- Requirement: Combat page loading state remains centered and legible without its own background.
  - Design element: Decision 4.
  - Acceptance criteria reference: N/A (combat page is out-of-scope for the nav spec itself; covered only as an implementation/regression check in tasks.md and tests.md).
  - Testability notes: Manual/visual verification; optionally a lightweight render test asserting the loading div no longer has `bg-gray-900`.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No visual regression (seam/invisible text) across any of the five campaign sub-routes after the change.
  - Design element: Decision 1, Decision 2.
  - Acceptance criteria reference: `specs/campaign-subnav/spec.md` updated scenarios.
  - Testability notes: Verified via manual visual check across all five routes (four nav tabs + combat) in both `isChatLarge` states (true/false), since this is a pure CSS/JSX layout change not easily unit-tested for pixel appearance.
- Requirement category: performance
  - Requirement: No additional network requests or re-renders introduced.
  - Design element: N/A (no data-fetching or state logic changes in any decision).
  - Acceptance criteria reference: Existing `specs/campaign-subnav/spec.md` "Single fetch for both name and activeSessionId" requirement remains unaffected.
  - Testability notes: Code review confirms no new `useEffect`/`fetch` calls added; existing test (if any) for single-fetch behavior continues to pass unmodified.

## Risks / Trade-offs

- Risk/trade-off: Mechanical removal of wrapper divs across 5 files could accidentally remove non-background styling bundled in the same className (e.g., `container mx-auto px-4 py-8` in `prompts/page.tsx` is on an *inner* div, not the one being removed, but must be double-checked per file rather than pattern-matched blindly).
  - Impact: Loss of intended padding/container width on one or more pages.
  - Mitigation: Review each of the 5 files individually during implementation (tasks.md breaks this out per-file) rather than a single global find-replace; keep any inner `container mx-auto px-4 py-8`-style divs intact, only removing the outer `min-h-screen bg-gray-900 text-white` div/class.
- Risk/trade-off: Two different DOM shapes (`<>fragment</>` vs `<div className="flex ...">` with `<main>`) for the `isChatLarge` branches means the background must be added in two places, risking drift if only one is updated.
  - Impact: Background centralization looks fixed but one branch (e.g., only reachable when a session's chat is manually expanded) still shows the bug.
  - Mitigation: Explicit task and test step to verify both `isChatLarge: true` and `isChatLarge: false` states.

## Rollback / Mitigation

- Rollback trigger: Visual regression reported after deploy (e.g., padding lost, seam reappears, or a page's content overlaps the nav).
- Rollback steps: Revert the merged commit(s) for this change via `git revert`; since this is a pure CSS/JSX change with no data migrations, a revert fully restores prior (broken-but-known) behavior with no side effects.
- Data migration considerations: None — no persisted data, schema, or API contracts touched.
- Verification after rollback: Confirm the five sub-pages return to their pre-change appearance (each independently backgrounded, underline-indicator tabs) and that no console/build errors are introduced by the revert.

## Operational Blocking Policy

- If CI checks fail: Investigate and fix the underlying issue (e.g., lint/type errors from the className changes, or a snapshot test needing update to match the new tab markup); do not bypass CI to merge.
- If security checks fail: Not expected to be relevant (no new dependencies, no data handling, no auth-surface changes); if a scanner flags something, treat as a false positive to be reviewed manually before dismissing.
- If required reviews are blocked/stale: Follow standard repo process — request re-review, do not use admin-merge/override, per existing project convention of fixing the blocking check rather than bypassing branch protection.
- Escalation path and timeout: If blocked more than one business day awaiting review, ping the requester (repo owner) directly; this is a small, low-risk visual fix so escalation should be rare.

## Open Questions

- None blocking. The one open question carried from proposal.md (whether `min-h-screen` needs to live at the layout level specifically vs. relying on page-level assumptions) is resolved by Decision 1/2: `min-h-screen` moves to the layout-level wrapper (and to `<main>` in the large-chat branch), so it's guaranteed regardless of any individual page's content height.
