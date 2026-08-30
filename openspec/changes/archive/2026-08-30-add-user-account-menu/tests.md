---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `add-user-account-menu` change. All
work follows a strict TDD process: write a failing test, write the simplest
code to pass it, then refactor.

Test commands (from project README / CLAUDE.md):

- Unit: `npm run test:unit`
- Integration: `npm run test:integration` (project harness — never Jest directly)
- E2E: `npm run test:e2e` (use a free port, not 3000)
- Lint (incl. jsx-a11y): `npm run lint`
- Types: `npm run typecheck`
- Build: `npm run build`

Spec reference:
`openspec/changes/add-user-account-menu/specs/user-account-menu/spec.md`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** capturing the task's requirement; run it and confirm
   it fails for the right reason.
2. **Write the simplest code** to make it pass.
3. **Refactor** while keeping the test green.

## Test Cases

### `deriveUserMenuDisplay` helper — `tests/unit/lib/userMenuDisplay.test.ts`

Task: "Display helper (TDD)" · Scenarios: "Account trigger displays user
identity", "Account trigger handles missing username", "Username is rendered as
inert text".

- [ ] `"douglas"` → `{ label: "douglas", initials: "D" }` (<=8, single token)
- [ ] `"Al"` → `{ label: "Al", initials: "A" }`
- [ ] `"douglas8"` (exactly 8 chars) → `{ label: "douglas8", initials: "D" }`
- [ ] `"Douglas Adams"` → `{ label: "DA", initials: "DA" }` (>8, multi-token)
- [ ] `"stridertheranger"` → `{ label: "S", initials: "S" }` (>8, single token)
- [ ] `"  jo   bloggs  "` → `{ label: "JB", initials: "JB" }` (whitespace
  collapse, first+last token)
- [ ] `"a b c d"` → `initials: "AD"` (first + last token only, capped at 2)
- [ ] `undefined` → `{ label: "Account", initials: "AC" }`
- [ ] `""` → `{ label: "Account", initials: "AC" }`
- [ ] `"   "` → `{ label: "Account", initials: "AC" }`
- [ ] `"<b>x</b>"` → does not throw; returns a value derived from the literal
  string
- [ ] `"Þórr Odinson"` (non-ASCII) → does not throw; initials are the
  uppercased first code points (`"ÞO"`)

### `UserMenu` component — `tests/unit/components/UserMenu.test.tsx`

Mocks `useAuth`. Uses `screen` (document-wide) queries because the menu content
is portalled.

Task: "UserMenu component (TDD)".

- [ ] **Gate — unauthenticated:** `isAuthenticated: false` → nothing rendered;
  no `user-menu-trigger`, no `logout-button`. (Scenario: "Hidden when
  unauthenticated")
- [ ] **Gate — loading:** `loading: true` → nothing rendered. (Scenario:
  "Hidden while auth is loading")
- [ ] **Trigger — short username:** `username: "douglas"` → trigger visible text
  `"douglas"`, `aria-label="douglas"`, `data-testid="user-menu-trigger"`.
  (Scenario: "Short username shown in full")
- [ ] **Trigger — long username:** `username: "Douglas Adams"` → trigger text
  `"DA"`, `aria-label="Douglas Adams"`. (Scenario: "Long username shown as
  initials")
- [ ] **Trigger — single long token:** `username: "stridertheranger"` → text
  `"S"`, `aria-label="stridertheranger"`. (Scenario: "Single long token shown as
  initials")
- [ ] **Trigger — missing username:** `username: undefined` → `aria-label`
  `"Account"`, trigger not blank. (Scenario: "Missing username falls back to
  Account")
- [ ] **Inert text:** `username: "<b>x</b>"` → literal characters present; no
  `<b>` element created from the username. (Scenario: "Markup in username is not
  interpreted")
- [ ] **Open on click:** click trigger → menu with role `menu` appears;
  contains one item role `menuitem` labelled `"Logout"` with
  `data-testid="logout-button"`; trigger `aria-expanded="true"`,
  `aria-haspopup` present. (Scenarios: "Logout via the account menu", "Menu
  roles are correct")
- [ ] **Open on keyboard:** focus trigger, press `Enter` → menu opens, focus
  moves into it. Repeat for `ArrowDown` and `Space`. (Scenario: "Keyboard open
  and close")
- [ ] **Escape closes + focus return:** open menu, press `Escape` → menu closed,
  focus back on trigger. (Scenario: "Keyboard open and close")
- [ ] **Outside click closes:** open menu, click outside → menu closed, `logout`
  not called. (Scenario: "Outside interaction closes the menu")
- [ ] **Logout invocation:** open menu, activate `Logout` → mocked `logout`
  called exactly once; no second menu item exists. (Scenario: "Logout via the
  account menu")
- [ ] **Clean unmount during logout:** `logout` mock resolves after a tick;
  after activation, re-render with `isAuthenticated: false` → trigger/menu gone,
  no error thrown/logged. (Scenario: "Menu unmounts cleanly during logout")

### `NavBar` component — `tests/unit/components/NavBar.test.tsx` (updated)

Task: "NavBar wiring". Scenario: "No standalone logout button remains" and the
gate scenarios.

- [ ] Unauthenticated → no `user-menu-trigger`, no `logout-button` (existing
  test, extended)
- [ ] `loading: true` → no `user-menu-trigger` (existing test, extended)
- [ ] Authenticated + not loading → `user-menu-trigger` present
- [ ] Authenticated → `?` feedback button (`data-testid="feedback-button"`)
  still present
- [ ] Authenticated → no element with text `Logout` is a direct child of the
  nav row (only reachable inside the opened menu)
- [ ] Authenticated → open the account menu, click `logout-button`, expect
  mocked `logout` called once (replaces the old direct-click test)

### E2E — `tests/e2e/auth.spec.ts` + `tests/e2e/helpers/actions.ts` (updated)

Task: "E2E migration". Scenario: "Logout via the account menu", NFAC
Reliability "Recovery behavior".

- [ ] `actions.ts` post-login wait targets
  `[data-testid="user-menu-trigger"]` instead of `[data-testid="logout-button"]`
- [ ] `auth.spec.ts` "logout clears client storage and redirects to login":
  click `user-menu-trigger`, then `logout-button` inside the menu; assert client
  storage cleared and redirect to `/login` (unchanged assertions)
- [ ] `grep -rn "logout-button" tests/` — every hit either opens the menu first
  or is an absence assertion
- [ ] Playwright keyboard check: `Tab` to the account trigger, open it by
  keyboard, activate `Logout` by keyboard → redirected to `/login`

### Dependency / non-functional

Task: "Dependency", "Housekeeping". Scenarios: "Account menu primitive supports
future submenus", NFAC "Performance".

- [ ] `npm ls radix-ui` (or the fallback lib) resolves to the exact pinned
  version; `package.json` has no `^` on it
- [ ] The pinned version's `peerDependencies` include `react@^19` (manual check,
  recorded in PR)
- [ ] The primitive exposes submenu composition (`DropdownMenu.Sub` /
  `SubTrigger` / `SubContent` or equivalent) — asserted by a smoke import in a
  unit test or documented in the PR
- [ ] `next build` First Load JS delta measured before/after; increase ≤ ~15 kB
  gzipped; value recorded in the PR description

### Full-suite gates (Validation section of tasks.md)

- [ ] `npm run test:unit` green
- [ ] `npm run test:integration` green (unchanged; no integration surface added)
- [ ] `npm run test:e2e` green (at least `auth.spec.ts` + specs using
  `actions.ts`)
- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean (jsx-a11y included)
- [ ] `npm run build` succeeds
