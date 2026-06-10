---
name: tests
description: Tests for the campaign-chat-dock-shell change
---

# Tests

## Overview

Tests for `CampaignChat` — the collapsible/pinnable chat dock shell. All work follows strict TDD: write a failing test, write the minimum code to pass it, then refactor.

Test file: `tests/unit/components/CampaignChat.test.tsx`

`LocalStore` is mocked at the module level for all tests:
```ts
jest.mock('@/lib/offline/LocalStore', () => ({
  LocalStore: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    remove: jest.fn(),
  },
}));
```

## Testing Steps

For each task, follow the TDD cycle:
1. **Write a failing test** — run `npx jest --testPathPattern=CampaignChat`, confirm it fails
2. **Write minimum implementation** — make the test pass
3. **Refactor** — clean up while keeping tests green

---

## Test Cases

### Task 1 — `CampaignChat` component

#### Render and initial state

- [x] **TC-01** — Pill button present on render
  - Spec: "Pill present on initial render"
  - `render(<CampaignChat />)` → `expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument()`

- [x] **TC-02** — Drawer absent on initial render (no pin stored)
  - Spec: "Drawer absent on initial render (default collapsed)"
  - Mock `LocalStore.get` returning `null` → `expect(screen.queryByRole('complementary')).not.toBeInTheDocument()`

- [x] **TC-03** — Drawer present on mount when pin is stored
  - Spec: "Dock opens on mount when pin is stored"
  - Mock `LocalStore.get` returning `true` → `expect(screen.getByRole('complementary', { name: /campaign chat/i })).toBeInTheDocument()`

#### Expand / collapse

- [x] **TC-04** — Clicking pill expands the drawer
  - Spec: "Expand dock by clicking the pill"
  - `userEvent.click(pill)` → `expect(screen.getByRole('complementary')).toBeInTheDocument()`

- [x] **TC-05** — Clicking close button collapses the drawer
  - Spec: "Collapse dock by clicking the close button"
  - Expand, then `userEvent.click(getByRole('button', { name: /collapse/i }))` → `expect(screen.queryByRole('complementary')).not.toBeInTheDocument()`

- [x] **TC-06** — Pressing Escape collapses the drawer
  - Spec: "Collapse dock via Escape key"
  - Expand, then `fireEvent.keyDown(document, { key: 'Escape' })` → `expect(screen.queryByRole('complementary')).not.toBeInTheDocument()`

- [x] **TC-07** — Pressing Escape when collapsed has no effect
  - Spec: "Escape key does nothing when dock is already collapsed"
  - `fireEvent.keyDown(document, { key: 'Escape' })` → no error; `expect(screen.queryByRole('complementary')).not.toBeInTheDocument()`; `expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument()`

#### Pin control

- [x] **TC-08** — Pin button has `aria-pressed="false"` when not pinned
  - Spec: "Pin button reports pressed state"
  - Expand → `expect(screen.getByRole('button', { name: /pin/i })).toHaveAttribute('aria-pressed', 'false')`

- [x] **TC-09** — Clicking pin sets `aria-pressed="true"` and calls `LocalStore.set`
  - Spec: "Pin button toggles to pinned state"
  - Expand, click pin → `expect(pinButton).toHaveAttribute('aria-pressed', 'true')` and `expect(LocalStore.set).toHaveBeenCalledWith('campaign-chat-pin', true)`

- [x] **TC-10** — Clicking pin again sets `aria-pressed="false"` and calls `LocalStore.remove`
  - Spec: "Pin button toggles to unpinned state"
  - Expand, pin, unpin → `expect(pinButton).toHaveAttribute('aria-pressed', 'false')` and `expect(LocalStore.remove).toHaveBeenCalledWith('campaign-chat-pin')`

- [x] **TC-11** — Unpinning while expanded does not collapse the drawer
  - Spec: "Unpinning while expanded does not collapse the drawer"
  - Expand, pin, unpin → `expect(screen.getByRole('complementary')).toBeInTheDocument()`

#### Accessibility

- [x] **TC-12** — Drawer has `role="complementary"` and `aria-label="Campaign Chat"`
  - Spec: "Drawer has complementary landmark and label"
  - Expand → `expect(screen.getByRole('complementary', { name: 'Campaign Chat' })).toBeInTheDocument()`

- [x] **TC-13** — Pill button is keyboard-activatable (Enter/Space)
  - Spec: "Pill button is focusable and activatable"
  - `userEvent.type(pill, '{enter}')` → drawer appears; collapse; `userEvent.type(pill, ' ')` → drawer appears

### Task 2 — `app/layout.tsx` mount

- [x] **TC-14** — `CampaignChat` import and usage compile without type errors
  - Spec: "No layout regression"
  - `npm run typecheck` — zero errors after adding import and `<CampaignChat />` to `app/layout.tsx`

### Task 3 — Non-functional

- [x] **TC-15** — Full unit suite passes after changes
  - Spec: "Existing tests pass after layout change"
  - `npm run test:unit` — zero test regressions

- [x] **TC-16** — Build succeeds
  - `npm run build` — exits 0
