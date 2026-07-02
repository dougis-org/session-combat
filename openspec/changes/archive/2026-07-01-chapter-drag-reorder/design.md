## Context

- Relevant architecture: `app/campaigns/CampaignEditor.tsx` is a client component that manages chapter state locally (`useState`) and persists on explicit Save. Chapter `order` values are 0-based integers re-normalized after every mutation. The file renders all chapter rows inline (no sub-component extracted yet).
- Dependencies: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (new). React 19, Next.js 16 App Router, Tailwind CSS 4.
- Interfaces/contracts touched: Chapter state shape (`{ id, title, order }`) is unchanged. The `onSave` payload already receives `chapters` with `order` values — no API changes required.

## Goals / Non-Goals

### Goals

- Replace ▲/▼ buttons with a ⠿ drag handle supporting mouse, touch (tablet), and keyboard
- Smooth CSS-transform animation (200ms) as rows shift during drag
- Visual elevation on the dragged item while dragging (opacity + shadow)
- Keyboard sorting via arrow keys on the focused handle (a11y)
- Playwright E2E test covering drag-reorder and save persistence
- Delete the now-redundant unit test for move buttons

### Non-Goals

- Any change to the chapter data model or API
- Multi-select drag
- Undo/redo
- Mobile-phone breakpoints

## Decisions

### Decision 1: DnD library — @dnd-kit

- Chosen: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`
- Alternatives considered: Native HTML5 drag-and-drop; react-beautiful-dnd (deprecated)
- Rationale: @dnd-kit is the current React-ecosystem standard. It uses pointer events (not HTML5 DnD API), giving consistent behavior across mouse, touch, and keyboard via pluggable sensors. react-beautiful-dnd is deprecated and has React 18+ issues. Native DnD has no keyboard support and broken touch on iOS.
- Trade-offs: Adds ~15KB gzipped. Justified by touch + keyboard requirements.

### Decision 2: Sensors — Pointer + Touch + Keyboard

- Chosen: Register `PointerSensor`, `TouchSensor`, `KeyboardSensor` with `sortableKeyboardCoordinates`
- Alternatives considered: PointerSensor alone (covers touch on most browsers but less reliable on iOS Safari)
- Rationale: Explicit TouchSensor improves iOS/Android tablet reliability. KeyboardSensor fulfills the a11y requirement without keeping hidden ▲/▼ buttons.
- Trade-offs: Slightly more setup code; no meaningful downside.

### Decision 3: Component structure — inline SortableItem, no new file

- Chosen: Extract a `SortableChapterRow` component inline within `CampaignEditor.tsx` using `useSortable`
- Alternatives considered: Separate file `app/campaigns/SortableChapterRow.tsx`
- Rationale: The component is used in exactly one place. Keeping it in the same file avoids premature extraction and matches the existing pattern (no sub-components are currently extracted). If the file grows, extraction is straightforward.
- Trade-offs: Slightly longer file; acceptable.

### Decision 4: onDragEnd — arrayMove + order renormalization

- Chosen: Use `arrayMove` from `@dnd-kit/sortable` to reorder the array, then `.map((ch, i) => ({ ...ch, order: i }))` to renormalize
- Alternatives considered: Manual splice
- Rationale: Identical pattern to the removed `handleMoveUp`/`handleMoveDown`. `arrayMove` is a pure utility with no side effects.
- Trade-offs: None.

### Decision 5: Unit test deletion — rely on Playwright

- Chosen: Delete `'reorders chapters with move buttons and updates order index'` from `tests/unit/components/CampaignEditor.test.tsx` and replace with Playwright E2E coverage
- Alternatives considered: Keep unit test and add Playwright on top
- Rationale: Drag-and-drop behavior is inherently interactive and poorly suited to jsdom unit tests. The reorder logic itself (`arrayMove` + order normalization) is trivial and already tested by @dnd-kit. Playwright tests the actual user experience.
- Trade-offs: Brief coverage gap if E2E is written after deletion. Mitigation: do both in the same commit.

### Decision 6: Disabled state during save

- Chosen: Pass `disabled={saving}` to the drag handle via a wrapper `div` with `pointer-events-none` and `opacity-50` when saving
- Alternatives considered: Remove sensors during save (more complex)
- Rationale: Consistent with how the existing ▲/▼, Remove, and title input fields are disabled during save.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Replace ▲/▼ buttons with drag handle
  - Design decision: Decision 1 (library), Decision 3 (component structure)
  - Validation approach: Playwright E2E — drag chapter, assert new order

- Proposal element: Desktop + tablet touch support
  - Design decision: Decision 2 (sensors)
  - Validation approach: Playwright E2E (pointer); manual tablet smoke test

- Proposal element: Keyboard accessibility
  - Design decision: Decision 2 (KeyboardSensor)
  - Validation approach: Manual keyboard test; Playwright can simulate arrow-key events on handle

- Proposal element: Smooth animation
  - Design decision: CSS `transition: transform 200ms ease` on row wrapper; `isDragging` elevation styles
  - Validation approach: Visual inspection during implementation

- Proposal element: Order persistence
  - Design decision: Decision 4 (arrayMove + renormalization)
  - Validation approach: Playwright E2E — drag, save, re-open editor, assert order

- Proposal element: Delete move-button unit test
  - Design decision: Decision 5
  - Validation approach: CI confirms test file no longer references `move-up-*` / `move-down-*`

## Functional Requirements Mapping

- Requirement: Drag handle visible on each chapter row
  - Design element: `SortableChapterRow` renders `<span {...listeners} {...attributes}>⠿</span>` as leftmost element
  - Acceptance criteria reference: specs/chapter-drag-reorder/drag-handle.md
  - Testability notes: Playwright `getByTestId('drag-handle-N')` present and visible

- Requirement: Dragging reorders the list with animation
  - Design element: `DndContext` + `SortableContext` + CSS transform transition
  - Acceptance criteria reference: specs/chapter-drag-reorder/drag-reorder.md
  - Testability notes: Playwright `locator.dragTo()` then assert input order

- Requirement: Keyboard sorting works on drag handle
  - Design element: `KeyboardSensor` with `sortableKeyboardCoordinates`
  - Acceptance criteria reference: specs/chapter-drag-reorder/keyboard-a11y.md
  - Testability notes: Playwright `page.keyboard.press('Space')` then arrow keys; assert order

- Requirement: Saving persists new order
  - Design element: `onDragEnd` sets state; existing `handleSave` sends `chapters` array
  - Acceptance criteria reference: specs/chapter-drag-reorder/save-persistence.md
  - Testability notes: Playwright — drag, save, reload, assert order in DB/UI

- Requirement: Drag disabled during save
  - Design element: `pointer-events-none` + `opacity-50` on handle when `saving`
  - Acceptance criteria reference: specs/chapter-drag-reorder/drag-handle.md
  - Testability notes: Playwright — trigger save, assert handle not interactive

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Animation must not cause layout thrash
  - Design element: CSS `transform` only (no top/left changes); GPU-composited
  - Acceptance criteria reference: n/a (implementation quality)
  - Testability notes: Visual inspection; Lighthouse if needed

- Requirement category: accessibility
  - Requirement: Screen-reader-friendly drag handle
  - Design element: `{...attributes}` from `useSortable` includes `role="button"`, `aria-roledescription="sortable"`, `aria-describedby`
  - Acceptance criteria reference: specs/chapter-drag-reorder/keyboard-a11y.md
  - Testability notes: axe-core or manual VoiceOver check

- Requirement category: reliability
  - Requirement: Cancelled drag (Escape) restores original order
  - Design element: @dnd-kit handles cancel internally; state is only updated in `onDragEnd` (not during drag)
  - Acceptance criteria reference: specs/chapter-drag-reorder/drag-reorder.md
  - Testability notes: Playwright press Escape mid-drag; assert original order retained

## Risks / Trade-offs

- Risk/trade-off: `overflow-hidden` on the chapter list container may clip keyboard focus ring or prevent drag-scroll
  - Impact: Keyboard a11y broken; drag near list edges may not scroll
  - Mitigation: Audit container styles; change to `overflow-visible` on inner list if needed

- Risk/trade-off: Playwright `locator.dragTo()` vs `page.mouse` for pointer events
  - Impact: E2E drag test may be flaky on some CI runners
  - Mitigation: Prototype early; use `page.mouse.move/down/up` as fallback

## Rollback / Mitigation

- Rollback trigger: Drag-and-drop broken in production (chapters can't be reordered), or a11y regression reported
- Rollback steps: Revert the commit; ▲/▼ buttons and `handleMoveUp`/`handleMoveDown` were deleted but are small — re-add from git history
- Data migration considerations: None — `order` field schema is unchanged
- Verification after rollback: Open campaign editor, confirm ▲/▼ buttons present and functional

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests/lint before reopening for review.
- If security checks fail: Do not merge. Evaluate whether @dnd-kit dependency introduces any vulnerability; update or replace if needed.
- If required reviews are blocked/stale: Ping reviewer after 48h; escalate to maintainer after 72h.
- Escalation path and timeout: Maintainer (@dougis) has final merge authority after 72h stale review.

## Open Questions

No open questions. All decisions were resolved during exploration prior to this proposal.
