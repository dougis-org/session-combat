---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `hide-session-edit-controls-for-non-dm` change. All work should follow a strict TDD (Test-Driven Development) process.

Target file: `tests/unit/components/SessionsPage.test.tsx` (existing file covering `app/campaigns/[id]/sessions/page.tsx`). Mock `useIsDM` the same way `tests/unit/components/SessionControl.test.tsx` does:

```ts
const useIsDMMock = jest.fn()
jest.mock('@/lib/hooks/useIsDM', () => ({
  useIsDM: (campaignId: string) => useIsDMMock(campaignId),
}))
```

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

Maps to `tasks.md` Task 1 (add `isDM` prop to `SessionEntryCard`) and Task 5 (unit tests for `SessionEntryCard`). Acceptance scenarios: `specs/session-log/spec.md` → "DM sees full create/edit/delete controls", "Non-DM member sees no write controls", "Non-DM member can still read session details".

- [ ] **T1** — `useIsDMMock.mockReturnValue({ isDM: true, loading: false })`; render `SessionsPage` with a fixture log; assert the rendered session card shows both "Edit" and "Delete" buttons (`getByText`/`queryByText`).
- [ ] **T2** — `useIsDMMock.mockReturnValue({ isDM: false, loading: false })`; render `SessionsPage` with a fixture log; assert the rendered session card shows **neither** "Edit" nor "Delete" (`queryByText(...)` returns `null`).
- [ ] **T3** — With `isDM: false`, click the session card's title/expand control; assert the card expands and its `summary` text becomes visible — proves read access is untouched by the gating change.
- [ ] **T4** — With `isDM: false`, assert clicking anywhere on the collapsed card does not throw and does not attempt to call `onEdit`/`onDelete` (no such controls exist to click) — regression guard that the component doesn't render a hidden/disabled version that could still fire handlers.

Maps to `tasks.md` Task 2 (wire `useIsDM` into `SessionsContent`) and Task 3 (gate "+ New Session" button) and Task 6 (unit tests for `SessionsContent`). Acceptance scenarios: `specs/session-log/spec.md` → "DM sees full create/edit/delete controls", "Non-DM member sees no write controls".

- [ ] **T5** — `useIsDMMock.mockReturnValue({ isDM: true, loading: false })`; render `SessionsPage`; assert the "+ New Session" button is present.
- [ ] **T6** — `useIsDMMock.mockReturnValue({ isDM: false, loading: false })`; render `SessionsPage`; assert the "+ New Session" button is absent.
- [ ] **T7** — Confirm `useIsDM` is called with the page's `campaignId` (assert `useIsDMMock` was invoked with the expected id), matching the existing pattern already verified for `SessionControl` on this same page.

Maps to `tasks.md` Task 3/Task 6 (fail-closed while `useIsDM` is loading). Acceptance scenario: `specs/session-log/spec.md` → "Write controls stay hidden while DM status is still resolving".

- [ ] **T8** — `useIsDMMock.mockReturnValue({ isDM: false, loading: true })`; render `SessionsPage`; assert "+ New Session" is absent and no session card shows "Edit"/"Delete".
- [ ] **T9** — Start with `useIsDMMock.mockReturnValue({ isDM: false, loading: true })`, render, assert controls hidden; then `rerender`/update the mock to `{ isDM: true, loading: false }` and re-render; assert the controls now appear (proves resolution un-hides controls without requiring a full remount/reload).

Maps to `tasks.md` Task 4 (verification — no other entry point bypasses the gate). No new implementation expected; this is a regression check.

- [ ] **T10** — With `isDM: false`, assert there is no way in the rendered DOM to reach the `SessionForm` (no "+ New Session" button, no per-card "Edit" button) — i.e. `showForm`/`editingLog` state is unreachable via user interaction for a non-DM viewer.

Maps to `tasks.md` "Confirm acceptance criteria are covered" and the NFAC "DM-detection failure fails closed" scenario in `specs/session-log/spec.md`.

- [ ] **T11** — `useIsDMMock.mockReturnValue({ isDM: false, loading: false })` (the same shape `useIsDM` resolves to on a fetch error, per its own implementation) — reuses T2/T6 assertions; no separate error-injection test is needed since `useIsDM` already normalizes all failure modes to this same `{ isDM: false }` shape before `SessionsPage` ever sees it.
