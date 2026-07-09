## GitHub Issues

- #484

## Why

- Problem statement: On campaign sub-pages (`/campaigns/[id]`, `/sessions`, `/prompts`, `/library`), the shared header and tab bar rendered by `app/campaigns/[id]/layout.tsx` have no background color of their own. They rely on the surrounding page being dark-themed, but the actual page background is the browser/body default (white). The active tab's label uses `text-white`, which becomes invisible against that white background, and the campaign name header is likewise hard to read. Visually this looks like "navigation is broken" (per the reported screenshot on the Prompts page, where the active "Prompts" label disappears, leaving only a floating blue underline).
- Why now: This is a visible, user-reported regression affecting every campaign sub-page; it's a small, contained fix.
- Business/user impact: Users lose the ability to tell which tab is active, and the header/nav area looks visually broken/unstyled, undermining trust in the app on every campaign visit.

## Problem Space

- Current behavior: `app/campaigns/[id]/layout.tsx` renders `{header}` (`text-white` `<h1>`) and `{nav}` (underline-indicator tab links, active tab `text-white`, inactive `text-gray-400`) with no background wrapper. Each of the five campaign sub-page files independently wraps its own content in `min-h-screen bg-gray-900 text-white`:
  - `app/campaigns/[id]/page.tsx`
  - `app/campaigns/[id]/sessions/page.tsx`
  - `app/campaigns/[id]/prompts/page.tsx`
  - `app/campaigns/[id]/library/page.tsx`
  - `app/campaigns/[id]/combat/page.tsx`
  This means the header/nav area (owned by the layout) sits on a different (unstyled/white) background than the content below it (owned by each page), producing a visible seam and invisible active-tab text.
- Desired behavior: The header, tab bar, page content, and campaign chat panel all render on one continuous `bg-gray-900` dark surface, owned once by the shared layout. The tab bar itself is restyled from underline-indicator links to filled-pill tabs: the active tab renders as a solid `bg-blue-600` chip, inactive tabs render as plain gray text — matching the existing sub-tab style already used inside Prompt Builder (`Location Description` / `Shop / Establishment` / etc. tabs).
- Constraints:
  - Must not change the tab bar's routing behavior (four tabs: Members, Sessions, Prompts, Library; active-tab matching logic via `usePathname()` stays the same).
  - Must not regress the existing chat panel (`CampaignChat`) layout behavior, including the "large chat" side-by-side mode (`isChatLarge`).
  - `combat/page.tsx` is a campaign sub-route but is not one of the four nav tabs; it currently has its own `min-h-screen bg-gray-900 ... flex items-center justify-center` loading state markup that must be reconciled with the centralized background without duplicating it.
- Assumptions:
  - `bg-gray-900` is the correct/intended single source of truth for the dark background (it's what four of the five pages already use).
  - No other route depends on the sub-page background being scoped separately from the layout (i.e., nothing intentionally renders a lighter background inside `/campaigns/[id]/*`).
- Edge cases considered:
  - Campaign name fetch failure (header renders empty/omitted) — background must still look correct with no header content.
  - `isChatLarge` layout branch in `layout.tsx` renders a different DOM structure (flex row with `<main>` wrapper) — the centralized background must cover both the flex and non-flex return branches.
  - Pages that have their own inner dark elements (e.g., `bg-gray-900` on a `<textarea>` or `<pre>` in `library/page.tsx`) are unrelated nested elements and must not be touched.

## Scope

### In Scope

- Move the dark background/theme wrapper (`bg-gray-900 min-h-screen text-white`, or equivalent) from the five individual campaign sub-page files up into `app/campaigns/[id]/layout.tsx`, so it wraps header + nav + `{children}` + chat as one continuous surface, in both the `isChatLarge` and default layout branches.
- Remove the now-duplicate `min-h-screen bg-gray-900 text-white` wrapper from each of the five page files, keeping only what's needed for their own inner layout (e.g., padding, flex structure), without changing their functional structure otherwise.
- Restyle the tab bar in `layout.tsx` from underline-indicator links (`border-b-2 border-blue-400` / `text-white` / `text-gray-400`) to filled-pill tabs: active tab = solid `bg-blue-600` chip with rounded corners and padding; inactive tabs = plain gray text, no border/underline.
- Verify visually (or via test) that the active tab is legible on all four campaign sub-pages, and that the header/nav/content/chat area shows no visual seam.

### Out of Scope

- Any change to the top-level `NavBar` (the black "Campaigns / Encounters / Parties / ..." bar) — it is unaffected by this bug and already renders correctly.
- Any change to the tab bar's active-route matching logic (`pathname === ...` / `pathname.startsWith(...)`) — this already works correctly per existing spec `openspec/specs/campaign-subnav/spec.md`.
- Any change to `CampaignChat` component internals beyond it continuing to render correctly on the new shared background.
- Broader design-system work (e.g., introducing a shared `Tabs` component for reuse elsewhere in the app) — this change only touches the campaign sub-nav.
- Adding `combat/page.tsx` as a fifth visible tab, or otherwise changing which routes are considered "campaign sub-pages" for nav purposes.

## What Changes

- `app/campaigns/[id]/layout.tsx`: wrap `header`, `nav`, `{children}`, and `chat` in a single `bg-gray-900 min-h-screen text-white` container (applied consistently across both the `isChatLarge` and default return branches); restyle the tab-rendering `.map()` to output filled-pill tabs instead of underline-indicator links.
- `app/campaigns/[id]/page.tsx`: remove the page's own `min-h-screen bg-gray-900 text-white` wrapper div (now redundant).
- `app/campaigns/[id]/sessions/page.tsx`: same removal.
- `app/campaigns/[id]/prompts/page.tsx`: same removal (both the loading-state wrapper and the main content wrapper at line ~231 and ~240).
- `app/campaigns/[id]/library/page.tsx`: same removal (the outer wrapper only; inner `bg-gray-900` on `<pre>`/`<textarea>` elements stays untouched).
- `app/campaigns/[id]/combat/page.tsx`: same removal, including its loading-state branch, reconciled so the loading text still renders centered without its own background.
- Update `openspec/specs/campaign-subnav/spec.md` with new/changed requirements for background ownership and tab visual style (handled in the `specs` artifact of this change).

## Risks

- Risk: Removing the per-page `min-h-screen` wrapper could change scroll/height behavior on pages whose content is shorter than the viewport (e.g., an empty Library page), if the layout's new wrapper doesn't also carry `min-h-screen`.
  - Impact: Page background could stop short of the viewport bottom, reintroducing a visible seam under different conditions.
  - Mitigation: Apply `min-h-screen` (or equivalent) at the layout level so it's guaranteed regardless of per-page content height; verify visually on a short-content page (e.g., a campaign with an empty Library).
- Risk: The `isChatLarge` branch in `layout.tsx` has a different DOM structure (`<div className="flex h-screen overflow-hidden">` wrapping `<main>` + chat) than the default branch; applying the background in only one branch would leave the other broken.
  - Impact: Bug could persist or reappear specifically when chat is expanded to "large" mode.
  - Mitigation: Apply the background wrapper consistently to both branches, or refactor so both branches share one common wrapper.
  - How to apply: verify the fix on both branches — with chat expanded and text change on prompt.
- Risk: `combat/page.tsx` has a distinct loading-state markup (`flex items-center justify-center`) combined with its own background; removing the background without checking this specific branch could leave the loading state unstyled or misaligned.
  - Impact: Combat page loading state could regress even though it isn't one of the four nav tabs and wasn't explicitly reported in the issue.
  - Mitigation: Explicitly check `combat/page.tsx`'s loading branch during implementation and tests.

## Open Questions

- Question: Should `min-h-screen` move to the layout's outer wrapper only, or does anything downstream (e.g., `CampaignChat` sizing logic) assume a `min-h-screen` ancestor exists at the *page* level specifically?
  - Needed from: codebase verification during design/implementation (not expected to block, but calling it out).
  - Blocker for apply: no
- Question: Confirmed — no other unresolved ambiguity on styling or scope; tab style (filled-pill, active = solid `bg-blue-600`) and background centralization approach were explicitly confirmed by the requester during exploration.
  - Needed from: n/a
  - Blocker for apply: no

## Non-Goals

- Introducing a reusable/shared `Tabs` UI component for use elsewhere in the app.
- Changing which routes appear in the campaign sub-nav (still exactly Members, Sessions, Prompts, Library).
- Any accessibility audit beyond not regressing existing behavior (no new a11y requirements introduced by this change).
- Redesigning the campaign name header's typography/layout beyond ensuring it's legible on the new shared background.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
