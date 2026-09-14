## GitHub Issues

- #726

## Why

- Problem statement: Expandable/collapsible UI elements throughout the app give the
  user no consistent visual cue that they are interactive. Session log entries
  (#726) have no indicator at all. Where an indicator does exist, it was hand-rolled
  independently at each call site, producing three different conventions (no
  indicator, a text label, two different unicode glyph pairs).
- Why now: #726 is a small, concrete instance of a pattern that has already drifted
  six ways across the codebase. Fixing only the session-log card would add a
  seventh variant instead of converging on one.
- Business/user impact: Users (players and DMs) miss that session log titles,
  chapter lists, character summaries, and stat-block sections are expandable,
  leading to missed content and a perception that the UI is inconsistent/rough.

## Problem Space

- Current behavior: six independent expand/collapse implementations exist, each
  with its own state variable and its own (or absent) visual indicator:
  - `app/campaigns/[id]/sessions/page.tsx` (`SessionEntryCard`) — no indicator (issue #726 target)
  - `lib/components/combatant-card/ConditionControls.tsx` — no indicator, only a count in text
  - `lib/components/CharacterCard.tsx` — text label ("Expand"/"Collapse")
  - `app/campaigns/CampaignEditor.tsx` (chapters section) — unicode `▲`/`▼`
  - `app/campaigns/[id]/library/page.tsx` — unicode `▲`/`▼`
  - `lib/components/CreatureStatsForm.tsx` — unicode `▶`/`▼`, repeated across 5 independent sections
- Desired behavior: every disclosure control in the app uses the same shared
  component, with a consistent rotating chevron icon and consistent
  `aria-expanded` semantics, sourced from a real icon library rather than
  hand-rolled unicode glyphs or bespoke SVGs.
- Constraints:
  - No icon library is currently installed (`package.json` has none of
    lucide-react/heroicons/radix-icons); the only existing icon module,
    `lib/components/icons/dice.tsx`, is explicitly scoped to vendored dice-face
    SVGs per its own header comment and is not a general-purpose icon home.
  - `lib/components/ui.tsx` is the existing home for small, dependency-free,
    shared UI primitives (`ErrorBanner`, `FormField`, `SubmitButton`, etc.) and is
    the natural place for a new shared `Disclosure` component.
  - The app is Next.js/React with Tailwind for styling; no CSS-in-JS or component
    library (e.g. Radix, shadcn) is in use.
- Assumptions:
  - `lucide-react` is an acceptable new runtime dependency (tree-shakeable,
    single-purpose icon set, no CSS requirements) — this proposal introduces it
    for the first time.
  - The 6 call sites above are the complete set of disclosure patterns in the app
    as of this proposal; a repo-wide grep for expand/collapse state and unicode
    glyphs was used to build this list (see Open Questions for a caveat).
- Edge cases considered:
  - `CampaignChat`'s dock has its own expand/collapse affordance (pill ⇄ drawer),
    but it is a distinct interaction (a floating dock, not a disclosure list item)
    and is intentionally excluded from migration — see Non-Goals.
  - `CreatureStatsForm` manages 5 independent toggle sections via one
    `expandedSections` record; the shared `Disclosure` component must support
    being driven by external open/toggle state (not just its own internal
    `useState`) so this call site can keep one state object instead of 5 separate
    component instances each owning their own state.
  - `ConditionControls` only shows its toggle button when
    `combatant.conditions.length > 0`; the shared component must not force a
    change to that conditional-render behavior.

## Scope

### In Scope

- Add `lucide-react` as a project dependency.
- Add a shared `Disclosure` (and/or `Chevron`) component to `lib/components/ui.tsx`
  built on `lucide-react` icons, supporting both self-managed and externally
  controlled open state.
- Migrate all 6 identified call sites to the shared component:
  - `SessionEntryCard` (`app/campaigns/[id]/sessions/page.tsx`) — closes #726
  - `ConditionControls` (`lib/components/combatant-card/ConditionControls.tsx`)
  - `CharacterCard` (`lib/components/CharacterCard.tsx`)
  - `CampaignEditor` chapters section (`app/campaigns/CampaignEditor.tsx`)
  - Campaign library page (`app/campaigns/[id]/library/page.tsx`)
  - `CreatureStatsForm`, all 5 sections (`lib/components/CreatureStatsForm.tsx`)
- Remove the unicode-glyph and text-label indicators being replaced.

### Out of Scope

- Any new disclosure/expand-collapse UI not already present in the app today.
- Visual/behavioral redesign of the content revealed by these disclosures (only
  the toggle affordance changes).
- `CampaignChat` dock expand/collapse (pill ⇄ drawer) — different interaction
  pattern, not a list-item disclosure.

## What Changes

- New dependency: `lucide-react`.
- New shared component(s) in `lib/components/ui.tsx`: a `Disclosure` wrapper
  (button + rotating chevron + `aria-expanded`) and/or a standalone `Chevron`
  icon component for cases needing more layout control than the wrapper allows.
- 6 existing files updated to consume the shared component instead of their
  bespoke toggle/indicator code.
- No change to `lib/components/icons/dice.tsx` (vendored dice-face SVGs remain
  as-is; migrating those to lucide is explicitly out of scope — see Non-Goals).

## Risks

- Risk: `lucide-react` adds bundle size for a single icon's worth of value.
  - Impact: marginal increase in client JS bundle.
  - Mitigation: lucide-react ships per-icon ESM exports and is tree-shakeable;
    only the `ChevronDown`/`ChevronRight` (or equivalent) icons actually used
    will be bundled.
- Risk: `CreatureStatsForm`'s 5-section `expandedSections` record requires the
  shared component to support externally controlled state, which is a slightly
  more complex API than a self-contained toggle.
  - Impact: if the API is designed too narrowly (self-state only), that one file
    can't adopt it cleanly and would keep a bespoke pattern, undermining the
    goal of full convergence.
  - Mitigation: design the `Disclosure` API to accept controlled
    (`open`/`onToggle`) props with sensible uncontrolled defaults, verified
    against this call site specifically before implementation.
- Risk: visual regression — six call sites styled independently (different
  spacing/colors around the old indicators) means the new shared chevron may
  look inconsistent in surrounding context even if the component itself is
  consistent.
  - Impact: minor visual polish issues post-migration.
  - Mitigation: manual visual check of each migrated call site during
    implementation; no automated visual regression tooling exists in this repo
    today, so this is a manual QA step, not a gate.

## Open Questions

None remaining. Both questions raised during drafting were resolved by the
project owner before design work began:

- Whether `lib/components/icons/dice.tsx` should migrate to `lucide-react`:
  resolved — no. `lucide-react` has no polyhedral-dice icon set, so there is
  nothing to migrate to; the vendored dice-face SVGs stay as-is (see Non-Goals).
- Whether the 6-site call list is exhaustive enough to lock scope: resolved —
  yes, proceed with the 6 sites already identified. Any additional disclosure
  pattern found later is a fast-follow change, not a blocker here.

## Non-Goals

- Replacing or restyling `lib/components/icons/dice.tsx`'s vendored dice-face
  icons with `lucide-react` equivalents (lucide has no dice-face icon set;
  these are domain-specific and vendored for a reason unrelated to this change).
- Migrating `CampaignChat`'s dock expand/collapse pill-to-drawer interaction to
  the new `Disclosure` component — it is a different UI pattern, not a
  collapsible list/section.
- Introducing a broader UI/icon design system (e.g. adopting shadcn or Radix)
  beyond the single `lucide-react` dependency needed for this change.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
