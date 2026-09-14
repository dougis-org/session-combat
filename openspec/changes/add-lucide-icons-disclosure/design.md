## Context

- Relevant architecture: Next.js (App Router) + React function components, Tailwind
  for styling, no component library. Shared low-level UI primitives
  (`ErrorBanner`, `FormField`, `SubmitButton`, `textInputClass`, etc.) live in
  `lib/components/ui.tsx` as plain, dependency-free function components. The
  only existing icon module, `lib/components/icons/dice.tsx`, is a vendored,
  domain-specific SVG set (dice faces) and is not touched by this change.
- Dependencies: adds `lucide-react` (tree-shakeable, per-icon ESM exports, no
  required CSS/runtime setup) as a new `dependencies` entry.
- Interfaces/contracts touched:
  - `lib/components/ui.tsx` — new exports: `Chevron`, `Disclosure`.
  - `app/campaigns/[id]/sessions/page.tsx` (`SessionEntryCard`)
  - `lib/components/combatant-card/ConditionControls.tsx`
  - `lib/components/CharacterCard.tsx`
  - `app/campaigns/CampaignEditor.tsx` (chapters accordion section)
  - `app/campaigns/[id]/library/page.tsx`
  - `lib/components/CreatureStatsForm.tsx` (5 sections: abilities, skills,
    resistances, senses, and one further `expanded`/`setExpanded` section)
  - No public API, route, or data-model contract is touched — this is a
    client-side, presentational-only change.

## Goals / Non-Goals

### Goals

- Establish `lucide-react` as the project's icon library, added by this change
  and used for its first (and, for now, only) consumer: a chevron/disclosure
  indicator.
- Provide one shared, accessible disclosure primitive in `lib/components/ui.tsx`
  that covers every existing expand/collapse call site, replacing 3 divergent
  ad hoc conventions (no indicator, text label, two different unicode glyph
  pairs) with one visual and interaction pattern.
- Close GitHub issue #726 as the first migrated call site.

### Non-Goals

- Migrating `lib/components/icons/dice.tsx` to `lucide-react` — lucide has no
  polyhedral dice-face icon set, so there is nothing to migrate to (confirmed
  with project owner during proposal review).
- Migrating `CampaignChat`'s dock pill⇄drawer control — a different interaction
  pattern (floating dock), not a list/section disclosure.
- Any new disclosure UI not already present in the app today.
- Adopting a broader component/design system (Radix, shadcn, etc.).

## Decisions

### Decision 1: Single rotating icon, not a pair of swapped icons

- Chosen: Use one lucide icon, `ChevronRight`, and rotate it 90° via a Tailwind
  `rotate-90` class (with `transition-transform`) when the disclosure is open,
  rather than importing and conditionally swapping between two icons (e.g.
  `ChevronRight`/`ChevronDown`).
- Alternatives considered: swap between `ChevronRight` (closed) and
  `ChevronDown` (open) components based on state.
- Rationale: a single rotated icon is one import instead of two, animates
  smoothly between states (a swap cannot transition, it jumps), and matches
  the existing `transition-transform duration-300` class already present at
  one of the migration sites (`CampaignEditor.tsx:277`), so the visual
  language this change converges on was already partly anticipated in the
  codebase.
- Trade-offs: callers must pass a boolean (`expanded`) rather than choosing an
  icon directly; this is intentional — it's the whole point of centralizing
  the behavior.

### Decision 2: Two exports — a bare `Chevron` icon and a full `Disclosure` wrapper

- Chosen: export both:
  - `Chevron({ expanded, className? })` — a small presentational component
    (lucide `ChevronRight` + rotation), no button/state of its own. For call
    sites whose clickable button already renders complex custom content
    (title, badges, dates, counts) and only needs the icon dropped in.
  - `Disclosure({ label, open, onToggle, className?, contentClassName? })` (as
    a controlled component — see Decision 3) — a full `<button>` wrapping a
    label and a trailing `Chevron`, with `aria-expanded` wired up, for call
    sites that are a plain "label + indicator" row.
- Alternatives considered: a single all-in-one `Disclosure` component that
  always renders the button and requires every call site to fit its
  label/children slot shape.
- Rationale: `SessionEntryCard` and `ConditionControls` have custom button
  content (session metadata row; "Conditions (N)" count) that doesn't fit a
  generic `label` prop cleanly, but should still gain the same chevron and
  rotation behavior. Forcing everything through one rigid wrapper would either
  under-serve those two sites or over-complicate the wrapper's API with slots.
  Two focused exports keep both the simple and custom cases clean.
- Trade-offs: two exports to maintain instead of one; acceptable given they
  share the same underlying `Chevron` (the `Disclosure` wrapper is implemented
  in terms of `Chevron` internally, so there is one true visual definition).

### Decision 3: `Disclosure` takes controlled `open`/`onToggle` props, no internal state

- Chosen: `Disclosure` is a controlled component — the caller owns the
  boolean state (`useState`, or a record entry as in `CreatureStatsForm`) and
  passes `open` + `onToggle`. `Disclosure` does not call `useState` internally.
- Alternatives considered: an uncontrolled component with internal `useState`
  and an optional `defaultOpen` prop, mirroring how most of today's call sites
  already work (each owns its own `useState`).
- Rationale: `CreatureStatsForm` drives 5 sections from one
  `expandedSections` record via a single `toggleSection(key)` function — it
  cannot cleanly hand ownership of that state to 5 independent uncontrolled
  component instances. Every other call site (`CharacterCard`,
  `CampaignEditor`, library page) already holds its own `useState` and can
  trivially pass it through as `open`/`onToggle`. A controlled-only API
  therefore covers every site with one shape instead of needing both
  controlled and uncontrolled variants.
- Trade-offs: callers keep one line of `useState` boilerplate each (no net
  reduction in state management code) — the value of this change is the
  shared visual/interaction contract and accessibility wiring, not state
  elimination.

### Decision 4: Chevron position — trailing (end of row), not leading

- Chosen: the chevron sits at the end of the clickable row/button, after the
  label or custom content, consistently across every migrated call site.
- Alternatives considered: leading placement (chevron before the label), which
  is how `CreatureStatsForm` currently does it (`▶ Ability Scores`) — 2 of the
  3 existing indicator sites already use trailing placement
  (`CampaignEditor.tsx`, library `page.tsx`), so trailing is both the majority
  existing convention and the more common "accordion row" idiom (label left,
  disclosure indicator right, mirroring an OS file-tree or settings-list row).
- Rationale: `SessionEntryCard`'s title button already lays out session
  metadata left-to-right ending near the Edit/Delete controls — a trailing
  chevron fits at the end of that flex row without disrupting the existing
  metadata order. `CreatureStatsForm` will visibly change from leading to
  trailing placement as part of this migration; this is an intentional,
  expected visual change (the point of convergence), not an oversight.
- Trade-offs: none significant; this is a one-time visual adjustment at 5
  sub-sections in one file.

### Decision 5: `ConditionControls`'s conditional render is preserved

- Chosen: the button (and therefore its `Chevron`) continues to render only
  when `combatant.conditions.length > 0`, exactly as today. `Disclosure`/
  `Chevron` are not responsible for this business-logic gate — the call site
  still wraps them in its own `{combatant.conditions.length > 0 && (...)}`.
- Alternatives considered: pushing a `hidden`/`visible` prop into the shared
  component to handle this.
- Rationale: this is call-site-specific business logic (don't show a
  conditions toggle when there are no conditions), not a property of the
  disclosure primitive itself. Keeping it at the call site matches how the
  rest of the app already separates concerns.
- Trade-offs: none.

## Proposal to Design Mapping

- Proposal element: Add `lucide-react` dependency.
  - Design decision: Decision 1 (single `ChevronRight` icon, rotated).
  - Validation approach: `package.json`/lockfile diff; import resolves at
    build/typecheck time.
- Proposal element: Shared `Disclosure`/`Chevron` component in `ui.tsx`.
  - Design decision: Decision 2 (two exports), Decision 3 (controlled API).
  - Validation approach: unit test(s) for `Chevron` rotation class and
    `Disclosure` rendering `aria-expanded` + calling `onToggle` on click.
- Proposal element: Migrate `SessionEntryCard` (closes #726).
  - Design decision: Decision 2 (`Chevron` embedded in existing custom
    button), Decision 4 (trailing placement).
  - Validation approach: existing/extended component test asserting a chevron
    renders in the title row and rotates on click; manual visual check.
- Proposal element: Migrate `ConditionControls`.
  - Design decision: Decision 2 (`Chevron` in existing custom button),
    Decision 5 (conditional-render preserved).
  - Validation approach: existing/extended test verifying the toggle button
    (and its chevron) is absent with zero conditions and present with one.
- Proposal element: Migrate `CharacterCard`, `CampaignEditor` chapters,
  library page, and `CreatureStatsForm`'s 5 sections.
  - Design decision: Decision 2 (`Disclosure` wrapper), Decision 3 (controlled
    `open`/`onToggle`), Decision 4 (trailing placement).
  - Validation approach: existing/extended tests per file verifying expand/
    collapse still toggles the same content it did before migration, plus
    `aria-expanded` reflects state; manual visual check for the 5-section
    `CreatureStatsForm` since it changes from leading to trailing placement.

## Functional Requirements Mapping

- Requirement: Every migrated disclosure control visually indicates it is
  expandable/collapsible via a chevron that rotates on toggle.
  - Design element: `Chevron` (Decision 1), used directly or via `Disclosure`.
  - Acceptance criteria reference: specs — disclosure-indicator capability.
  - Testability notes: assert the rotation class (or `aria-expanded`) changes
    on click for each of the 6 migrated call sites.
- Requirement: Toggling a disclosure control does not change what content it
  reveals or the conditions under which it is shown (e.g. `ConditionControls`'
  zero-conditions gate, `CreatureStatsForm`'s per-section content).
  - Design element: Decision 5; call sites keep their existing gating/content
    logic, only the indicator/button chrome changes.
  - Acceptance criteria reference: specs — disclosure-indicator capability,
    "no behavior regression" scenarios per call site.
  - Testability notes: reuse/extend each file's existing expand/collapse tests
    (if present) asserting revealed content is unchanged; add tests where none
    existed before (see Risks).

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: adding `lucide-react` must not meaningfully increase client
    bundle size.
  - Design element: Decision 1 — only `ChevronRight` is imported
    (`import { ChevronRight } from 'lucide-react'`), which tree-shakes to a
    single small icon component.
  - Acceptance criteria reference: specs — dependency-footprint scenario.
  - Testability notes: no automated bundle-size gate exists in this repo;
    verify via `next build` output / bundle analyzer only if the reviewer
    requests it — not a blocking automated check.
- Requirement category: accessibility
  - Requirement: every disclosure control exposes `aria-expanded` reflecting
    current state, on the actual interactive `<button>` element.
  - Design element: `Disclosure` sets `aria-expanded={open}` on its internal
    button; `Chevron`-only call sites (`SessionEntryCard`, `ConditionControls`)
    must set `aria-expanded` themselves on their existing custom `<button>`
    (neither currently does this — this is a small accessibility improvement
    picked up incidentally by the migration).
  - Acceptance criteria reference: specs — disclosure-indicator capability,
    accessibility scenario.
  - Testability notes: assert `aria-expanded` attribute value on the button in
    each migrated call site's test.

## Risks / Trade-offs

- Risk: `lucide-react` adds bundle size for one icon's worth of value.
  - Impact: marginal client JS increase.
  - Mitigation: single named import only (Decision 1); no other lucide icons
    are introduced by this change.
- Risk: `CreatureStatsForm`'s controlled-state requirement could have forced a
  more complex dual (controlled + uncontrolled) API.
  - Impact: avoided — Decision 3 settles on controlled-only, which every call
    site can satisfy with a `useState` it already owns or a trivial one added.
  - Mitigation: n/a, resolved by design.
- Risk: visual inconsistency risk from six independently-styled surrounding
  layouts (different spacing/colors) even after the chevron itself is
  standardized.
  - Impact: minor visual polish gaps post-migration.
  - Mitigation: manual visual check of each of the 6 call sites during
    implementation (no automated visual regression tooling exists in this
    repo); called out per-file in `tasks.md`.
- Risk: some call sites (`SessionEntryCard`, `ConditionControls`) have no
  existing automated test coverage for their expand/collapse behavior, so a
  regression during migration could go undetected without new tests.
  - Impact: silent behavior break possible if migration is not paired with
    test coverage.
  - Mitigation: `tasks.md`/`tests.md` require adding or extending a test for
    each of the 6 call sites confirming toggle behavior and revealed content
    are unchanged post-migration.

## Rollback / Mitigation

- Rollback trigger: visual regression, accessibility regression, or
  broken toggle behavior found in review or post-merge that isn't a quick
  forward-fix.
- Rollback steps: this change is additive-and-substitutive per file with no
  data migration — revert the PR (or the specific file's commit) to restore
  the prior bespoke indicator code; remove the `lucide-react` dependency only
  if reverting entirely (no other code will depend on it, per Non-Goals).
- Data migration considerations: none — no persisted data, schema, or API
  contract is touched by this change.
- Verification after rollback: confirm the reverted file renders and toggles
  as it did before this change (manual check); confirm `lucide-react` import
  is fully removed from the dependency tree if the whole change is reverted.

## Operational Blocking Policy

- If CI checks fail: fix the underlying issue (type errors, lint, unit tests)
  before merge; this is a low-risk UI change with no justification for
  bypassing CI.
- If security checks fail: not expected to trigger any (no new
  network/data/auth surface); if a scanner flags the new dependency itself,
  evaluate the specific finding before deciding whether to proceed — do not
  waive without a reviewed reason, per project policy on quality-gate waivers.
- If required reviews are blocked/stale: this is a small, contained UI change;
  ping the reviewer directly rather than proceeding without approval.
- Escalation path and timeout: no formal SLA for this project; if blocked more
  than a few days, raise with the project owner (dougis) directly.

## Open Questions

None. Both questions raised while drafting the proposal were resolved by the
project owner before design work began (dice icons stay vendored/unmigrated;
the 6-site scope is locked as final).
