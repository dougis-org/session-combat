## Context

- Relevant architecture: `app/campaigns/CampaignEditor.tsx` is a pure React client component (`'use client'`). All chapter state is local — `chapters`, `currentChapterId`, `setCurrentChapterId`. No server calls are involved in this change.
- Dependencies: No external icon library. Project uses inline emoji and Unicode (▲, ▼, 📖). Tailwind CSS for styling.
- Interfaces/contracts touched: `data-testid="current-chapter-select"` is removed. New test IDs introduced: `current-chapter-display`, `activate-chapter-{id}`, `active-chapter-indicator-{id}`.

## Goals / Non-Goals

### Goals

- Replace the `<select>` with a display-only block showing the resolved active chapter name
- Add a per-row active indicator (green "ACTIVE" pill) when a chapter is active
- Add a per-row activate button (🚩, tooltip "Mark as current chapter") when a chapter is inactive
- Keep ▲/▼ move buttons unchanged

### Non-Goals

- Drag-and-drop reordering (tracked in #462)
- API or data model changes
- Any changes outside `app/campaigns/CampaignEditor.tsx` and its test file

## Decisions

### Decision 1: Display-only current chapter block

- Chosen: Replace `<select>` with a `<div>` containing a `<p>` (or `<span>`) that resolves the active chapter title. When `currentChapterId` is set, show `Ch. N: <title>` (same format as the former select option). When unset, show "-- No active chapter --" in dimmed, italic style (`text-gray-500 italic`).
- Alternatives considered: Hide the block entirely when nothing is active (cleaner but removes discoverability of the concept for new users).
- Rationale: Dimmed text matches the existing UI's convention for empty/placeholder states and keeps the layout stable.
- Trade-offs: Slightly more JSX than hiding entirely, but better first-time-user experience.

### Decision 2: Per-row active indicator — green pill

- Chosen: A `<span>` with `data-testid="active-chapter-indicator-{ch.id}"` styled as a small green pill: `bg-green-900/40 text-green-400 border border-green-800/40 text-xs rounded px-2 py-0.5 font-semibold`. Text: "ACTIVE".
- Alternatives considered: A colored left border on the row, a filled star emoji (★).
- Rationale: Pill matches the "Remove" button's visual pattern (same sizing/border idiom). Green communicates "currently active" clearly. Text label is unambiguous vs. an icon alone.
- Trade-offs: Adds a fixed-width element to the row; slightly more crowded, but the activate button is hidden for this row, so net width change is minimal.

### Decision 3: Per-row activate button — flag emoji

- Chosen: A `<button>` with `data-testid="activate-chapter-{ch.id}"`, emoji `🚩`, `title="Mark as current chapter"`, calling `setCurrentChapterId(ch.id)`. Styled similarly to move buttons: `px-2 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs rounded text-gray-300 transition-all cursor-pointer`. Disabled when `saving`.
- Alternatives considered: Text label "Set Active" (more explicit but wide), ▶ or ⚡ emoji.
- Rationale: 🚩 is universally understood as "flag/mark this" and is compact. The `title` tooltip provides full context for screen readers and hover users.
- Trade-offs: Emoji rendering can vary across OS/browser, but this is already the project's pattern (📖 in accordion header).

### Decision 4: Row layout order

- Chosen: `[Ch.N] [title input] [ACTIVE pill OR 🚩 button] [▲][▼] [Remove]`
- Rationale: Grouping the chapter-identity controls (title, active state) together before the reorder controls (▲▼) and destructive control (Remove) follows a left-to-right logical flow: identify → status → reorder → delete.
- Trade-offs: None significant.

## Proposal to Design Mapping

- Proposal element: Replace `<select>` with display-only block
  - Design decision: Decision 1
  - Validation approach: Unit test asserts `current-chapter-display` renders the resolved name; asserts no `current-chapter-select` in DOM.

- Proposal element: Green "ACTIVE" pill per active row
  - Design decision: Decision 2
  - Validation approach: Unit test asserts `active-chapter-indicator-{id}` present only for the active chapter.

- Proposal element: 🚩 activate button per inactive row
  - Design decision: Decision 3
  - Validation approach: Unit test clicks `activate-chapter-{id}` and asserts `current-chapter-display` updates; asserts button absent for already-active chapter.

- Proposal element: ▲/▼ unchanged
  - Design decision: Decision 4 (layout order)
  - Validation approach: Existing move-button tests continue to pass.

## Functional Requirements Mapping

- Requirement: Display-only current chapter block shows active chapter name
  - Design element: Decision 1 — `<div>` with resolved title
  - Acceptance criteria reference: specs/chapter-active-indicator/spec.md
  - Testability notes: Render with `currentChapterId` set; assert display text matches chapter title.

- Requirement: Display-only block shows dimmed placeholder when no active chapter
  - Design element: Decision 1 — conditional italic/dimmed text
  - Acceptance criteria reference: specs/chapter-active-indicator/spec.md
  - Testability notes: Render with `currentChapterId` undefined; assert placeholder text present.

- Requirement: Active chapter row shows ACTIVE pill
  - Design element: Decision 2
  - Acceptance criteria reference: specs/chapter-active-indicator/spec.md
  - Testability notes: Assert `active-chapter-indicator-{id}` present for active chapter, absent for others.

- Requirement: Inactive chapter row shows activate button
  - Design element: Decision 3
  - Acceptance criteria reference: specs/chapter-active-indicator/spec.md
  - Testability notes: Assert `activate-chapter-{id}` present for inactive chapters, absent for active chapter.

- Requirement: Clicking activate button sets that chapter as active
  - Design element: Decision 3 — `setCurrentChapterId(ch.id)` onClick
  - Acceptance criteria reference: specs/chapter-active-indicator/spec.md
  - Testability notes: Click `activate-chapter-{id}`; assert display block updates and ACTIVE pill moves to that row.

## Non-Functional Requirements Mapping

- Requirement category: accessibility
  - Requirement: Activate button must have a visible tooltip and be keyboard-focusable
  - Design element: `title="Mark as current chapter"` attribute; standard `<button>` element is natively focusable
  - Acceptance criteria reference: specs/chapter-active-indicator/spec.md
  - Testability notes: Assert `title` attribute on activate button. Full keyboard nav is out of scope for automated tests but should be manually verified.

- Requirement category: consistency
  - Requirement: New UI elements must match existing visual patterns
  - Design element: Pill and button use same Tailwind sizing/border patterns as existing "Remove" button and move buttons
  - Testability notes: Visual review; no automated test needed.

## Risks / Trade-offs

- Risk/trade-off: Removing `data-testid="current-chapter-select"` breaks existing tests
  - Impact: CI failure if tests are not updated simultaneously
  - Mitigation: Tasks artifact explicitly pairs JSX change with test update in the same step.

## Rollback / Mitigation

- Rollback trigger: Post-merge regression in campaign save flow or active chapter persistence.
- Rollback steps: Revert the PR. The change is purely UI-layer; no migrations or data changes exist.
- Data migration considerations: None.
- Verification after rollback: Run `npm run test:unit` and manually verify campaign edit screen renders the select again.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing test or lint error before requesting re-review.
- If security checks fail: Do not merge. This change has no server-side impact, so security failures likely indicate an unrelated issue — investigate before merging.
- If required reviews are blocked/stale: Ping reviewer after 24 hours. Escalate to team lead after 48 hours.
- Escalation path and timeout: If blocked >48 hours, raise in team standup.

## Open Questions

No open questions. All design decisions confirmed during explore session.
