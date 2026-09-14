---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `add-lucide-icons-disclosure` change.
All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a
    test that captures the requirements of the task. Run the test and ensure
    it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make
    the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the
    test still passes.

## Test Cases

### Task 2 — `Chevron` and `Disclosure` in `lib/components/ui.tsx`

File: `tests/unit/components/ui.test.tsx`

- [ ] Test case: `Chevron` rendered with `expanded={false}` renders lucide's
  `ChevronRight` with no rotation class applied.
  (Maps to spec scenario: "Chevron renders closed by default")
- [ ] Test case: `Chevron` rendered with `expanded={true}` renders the same
  icon with a 90-degree rotation class applied.
  (Maps to spec scenario: "Chevron rotates when expanded")
- [ ] Test case: `Disclosure` rendered with `open={true}` renders a button
  with `aria-expanded="true"` and an open-orientation `Chevron`.
  (Maps to spec scenario: "Disclosure reflects controlled open state")
- [ ] Test case: `Disclosure` rendered with `open={false}` renders a button
  with `aria-expanded="false"` and a closed-orientation `Chevron`.
  (Maps to spec scenario: "Disclosure reflects controlled closed state")
- [ ] Test case: clicking a `Disclosure` rendered with `open={false}` calls
  the supplied `onToggle` exactly once and does not itself flip any rendered
  `aria-expanded`/chevron state (no internal state).
  (Maps to spec scenario: "Disclosure delegates toggling to the caller")
- [ ] Test case: `Chevron`'s implementation imports only `ChevronRight` from
  `lucide-react` (source-level assertion, e.g. via a static import check or
  snapshot of the import statement).
  (Maps to NFAC scenario: "Lucide import stays limited to the chevron icon")

### Task 3 — `SessionEntryCard` migration (closes #726)

File: `tests/unit/components/SessionsPage.test.tsx`

- [ ] Test case: a session log entry in its default (collapsed) state renders
  a closed-orientation `Chevron` in the title row and the title button has
  `aria-expanded="false"`.
  (Maps to spec scenario: "Collapsed session log entry shows a closed
  chevron")
- [ ] Test case: clicking a collapsed session log entry's title row reveals
  its summary/events content, sets `aria-expanded="true"` on the title
  button, and rotates the `Chevron` open.
  (Maps to spec scenario: "Clicking a session log entry's title expands it
  and rotates the chevron")
- [ ] Test case: clicking an expanded session log entry's title row again
  hides its summary/events content, returns `aria-expanded` to `"false"`, and
  rotates the `Chevron` back closed.
  (Maps to spec scenario: "Clicking an expanded session log entry's title
  collapses it again")

### Task 4 — `ConditionControls` migration

File: `tests/unit/components/combatant-card/ConditionControls.test.tsx`

- [ ] Test case: a combatant with zero conditions renders no toggle button and
  no `Chevron`.
  (Maps to spec scenario: "Conditions toggle is absent with zero conditions")
- [ ] Test case: a combatant with one or more conditions, list collapsed,
  renders the condition count, a closed-orientation `Chevron`, and
  `aria-expanded="false"` on the toggle button.
  (Maps to spec scenario: "Conditions toggle shows a chevron reflecting
  state")
- [ ] Test case: clicking the toggle button on a combatant with conditions
  reveals the conditions list, sets `aria-expanded="true"`, and rotates the
  `Chevron` open.
  (Maps to spec scenario: "Expanding the conditions list rotates the
  chevron")

### Task 5 — `CharacterCard` migration

File: `tests/unit/components/CharacterCard.test.tsx`

- [ ] Test case: a character card in its default (collapsed) state renders
  its toggle via `Disclosure` with `aria-expanded="false"` and a
  closed-orientation `Chevron`.
  (Maps to spec scenario: "Character card toggle shows a labeled disclosure
  with chevron")
- [ ] Test case: clicking the disclosure toggle reveals the same
  `CreatureStatBlock` content/props as before migration, sets
  `aria-expanded="true"`, and rotates the `Chevron` open.
  (Maps to spec scenario: "Expanding a character card reveals the same stat
  block as before")

### Task 6 — `CampaignEditor` chapters section migration

File: `tests/unit/components/CampaignEditor.test.tsx`

- [ ] Test case: the chapters section header renders `aria-expanded` matching
  its current state and a `Chevron` (not a unicode glyph) in the matching
  orientation, for both collapsed and expanded states.
  (Maps to spec scenario: "Chapters section shows a chevron reflecting
  state")
- [ ] Test case: clicking the chapters section header reveals the same
  chapter content (current chapter display, chapter list) as before
  migration, and rotates the `Chevron` open.
  (Maps to spec scenario: "Toggling the chapters section preserves existing
  revealed content")

### Task 7 — Campaign library entries migration

File: `tests/unit/libraryPage.test.tsx`

- [ ] Test case: a collapsed library entry renders `aria-expanded="false"` and
  a closed-orientation `Chevron` (not a unicode glyph) alongside its existing
  metadata (type label, title, chapter, date, saved-result indicator).
  (Maps to spec scenario: "Library entry shows a chevron reflecting state")
- [ ] Test case: clicking a collapsed library entry's button reveals the same
  prompt/response content as before migration, sets `aria-expanded="true"`,
  and rotates the `Chevron` open.
  (Maps to spec scenario: "Toggling a library entry preserves existing
  revealed content")

### Task 8 — `CreatureStatsForm` migration (5 sections)

File: `tests/unit/components/CreatureStatsForm.test.tsx`

- [ ] Test case: with some sections expanded and others collapsed, each
  section's header independently shows `aria-expanded` and `Chevron`
  orientation matching that section's own state.
  (Maps to spec scenario: "Each stats form section shows a chevron reflecting
  its own state")
- [ ] Test case: with all sections collapsed, clicking the "Skills" section
  header reveals only the skills section's content and rotates only its
  `Chevron` open, leaving the other four sections collapsed with
  closed-orientation chevrons.
  (Maps to spec scenario: "Toggling one stats form section does not affect
  the others")

## Traceability Check

Every scenario in `specs/disclosure-indicator/spec.md` (functional and
non-functional) has at least one corresponding test case above; every test
case above maps to exactly one task in `tasks.md` (Tasks 2 through 8).
