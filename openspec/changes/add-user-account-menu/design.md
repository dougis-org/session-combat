## Context

- Relevant architecture:
  - `app/layout.tsx` (RSC) renders `<NavBar />` once for every route, inside
    `<body>`, above the scrollable content area.
  - `lib/components/NavBar.tsx` is a `'use client'` component. It calls
    `useAuth()` and conditionally renders the invitations link, a `?` feedback
    button (`ml-auto`), and a `Logout` button (`data-testid="logout-button"`).
  - `lib/hooks/useAuth.ts` owns all auth state. It fetches `GET /api/auth/me` on
    mount and on `pathname` change, exposing
    `{ user, loading, error, isAuthenticated, login, register, logout }` where
    `user` is `{ userId, email, isAdmin?, username? }`.
  - `logout()` POSTs `/api/auth/logout`, then unconditionally clears
    `LocalStore`, `SyncQueue`, `clientStorage`, resets state, and
    `router.replace('/login')`.
  - Styling is Tailwind v4 utility classes; the nav uses a dark palette
    (`bg-gray-950`, `text-gray-400`, hover `text-white`).
- Dependencies:
  - Runtime: `next@^16.2.6`, `react@^19.2.4`, `react-dom@^19.2.4`.
  - New: an accessible menu primitive (see Decision 1).
  - Dev/test: `@testing-library/react@^16`, `@testing-library/user-event@^14`,
    `jest@^29` + jsdom, `@playwright/test@^1.57`, `eslint-plugin-jsx-a11y`.
- Interfaces/contracts touched:
  - `NavBar` internal composition only. No API, hook, or route contract change.
  - `data-testid="logout-button"` is preserved but relocated onto the menu item;
    the DOM path to it changes (now behind a trigger).
  - New internal contract: `UserMenu` consumes `useAuth()`; a pure display
    helper maps `username -> { label, initials }`.

## Goals / Non-Goals

### Goals

- Show who is logged in via a top-right account trigger (initials, or the full
  username when `<= 8` chars).
- Provide a conventional, accessible account menu whose sole item is `Logout`.
- Introduce a reusable, composable, submenu-capable menu primitive for future
  multi-level navigation.
- Preserve existing logout behavior and the authenticated/loading render gate.
- Keep every existing logout assertion working with a minimal (open-menu) edit.

### Non-Goals

- No profile/settings page or route (deferred follow-up to #611).
- No avatar images.
- No menu items beyond `Logout`.
- No broader nav restructuring or mobile redesign.
- No changes to `useAuth`, `/api/auth/me`, or logout endpoint/semantics.

## Decisions

### Decision 1: Use Radix UI primitives (`radix-ui` package) for the menu

- Chosen: Add the unified `radix-ui` package and build `UserMenu` on
  `DropdownMenu` (`DropdownMenu.Root/Trigger/Portal/Content/Item`). Pin an exact
  version in `package.json` and verify it lists React 19 in its peer range
  during implementation.
- Alternatives considered:
  - Hand-rolled dropdown (`useState` + click-outside + manual ARIA + roving
    tabindex): rejected — the requester explicitly wants best practices, and a
    correct menu-button + submenu + focus-management implementation is exactly
    what these libraries exist to provide.
  - `@headlessui/react` v2: viable and React 19 compatible, but nested submenu
    support is weaker/newer and its `Menu` is less composable for the planned
    multi-level nav.
  - `@base-ui-components/react` (Base UI): promising and from the Radix authors,
    but still pre-1.0 with a moving API — too unstable to standardize on now.
  - Per-component `@radix-ui/react-dropdown-menu`: functionally equivalent;
    the unified `radix-ui` package is preferred so future menus (navigation
    menu, context menu, submenus) come from one versioned dependency.
- Rationale: Radix implements the WAI-ARIA menu button pattern (keyboard nav,
  typeahead, focus return, `Escape`/outside-close), is headless so it takes
  Tailwind classes directly, supports `DropdownMenu.Sub` for the multi-level
  menus the nav will need, is SSR-safe, and is widely used with Next App Router.
- Trade-offs: Adds a dependency and a small amount of first-load JS to the
  shared layout; introduces a portal (content renders at `<body>` end) which
  tests must account for; ties the nav's menu UX to Radix's conventions.

### Decision 2: New `lib/components/UserMenu.tsx` client component

- Chosen: A dedicated `'use client'` component that calls `useAuth()`, renders
  nothing when `!isAuthenticated || loading`, and otherwise renders the Radix
  trigger (the initials/short-name badge) plus a `Content` with one `Item`,
  `Logout`, whose `onSelect` calls `void logout()`. The item keeps
  `data-testid="logout-button"`; the trigger gets
  `data-testid="user-menu-trigger"` and an `aria-label` of the full username.
- Alternatives considered: Inline the menu directly in `NavBar` — rejected;
  `NavBar` is already doing invitations polling + feedback modal, and a separate
  component is independently testable and reusable.
- Rationale: Isolation keeps `NavBar` diff tiny (swap button for `<UserMenu />`),
  gives a clean unit-test target, and matches the existing
  one-component-per-file layout in `lib/components/`.
- Trade-offs: One more file; `UserMenu` re-invokes `useAuth()` (another
  `/api/auth/me` fetch is NOT triggered — the hook fetches per instance, so this
  adds one extra `me` call on mount). Acceptable; can be lifted to context later
  if it matters. Documented as a known minor cost.

### Decision 3: Pure display helper for label + initials

- Chosen: `deriveUserMenuDisplay(username?: string): { label: string; initials: string }`
  in `lib/components/userMenuDisplay.ts`:
  - Trim input. If empty/undefined → `{ label: 'Account', initials: 'AC' }`
    (a person glyph may be rendered instead of `initials` when the source was
    missing — resolved via open question; helper still returns `'AC'`).
  - Split on whitespace into tokens. `initials` = first char of first token +
    first char of last token (single token → just its first char), uppercased,
    max 2 chars.
  - `label` = the trimmed username when `length <= 8`, else `initials`.
  - Non-ASCII: use the first code point of each token as-is (uppercased where
    applicable); never throw.
- Alternatives considered: Do it inline in the component — rejected; edge cases
  (empty, single word, multi word, unicode, overlong) deserve isolated unit
  tests.
- Rationale: Deterministic, trivially testable, no React needed.
- Trade-offs: A second small file; naming/threshold choices are somewhat
  arbitrary but codified here and in specs.

### Decision 4: Trigger visuals and overflow handling

- Chosen: A compact rounded badge button, right-aligned in the nav row (it
  becomes the rightmost element; the `?` feedback button keeps its `ml-auto` and
  sits just left of it). Shows `label`. `max-width` with `truncate`
  (ellipsis) so a long `label` (only possible via the `<= 8` path, so bounded)
  or future content cannot widen the row. Full username always available via
  `aria-label` and `title`. Menu `Content` uses Radix `align="end"` +
  `collisionPadding` so the panel stays within the viewport on narrow screens.
- Alternatives considered: Icon-only trigger with username only in a tooltip —
  rejected; #611 wants the username visible in the icon.
- Rationale: Meets the visible-username requirement while protecting the nav
  layout; Radix collision handling covers small viewports without a custom
  responsive pass.
- Trade-offs: On very narrow screens the badge may show initials only (by
  design); acceptable and consistent with the `> 8` behavior.

## Proposal to Design Mapping

- Proposal element: Add accessible menu/dropdown library.
  - Design decision: Decision 1 (Radix `radix-ui` package, `DropdownMenu`).
  - Validation approach: `next build` succeeds; unit test renders `UserMenu`
    without hydration/peer warnings; `package.json` pins an exact version whose
    peers include React 19.
- Proposal element: New `UserMenu` component replacing the inline Logout button.
  - Design decision: Decision 2.
  - Validation approach: `UserMenu` unit tests (gated render, open/close,
    logout invocation); `NavBar` unit test asserts `<UserMenu />` present and
    the old inline button absent.
- Proposal element: Initials / short-name badge logic.
  - Design decision: Decision 3 (`deriveUserMenuDisplay`).
  - Validation approach: Helper unit tests over the edge-case matrix.
- Proposal element: Wire into `NavBar`, keep feedback button + auth/loading gate.
  - Design decision: Decision 2 + Decision 4.
  - Validation approach: `NavBar` unit tests for authenticated, unauthenticated,
    and `loading` states; feedback button still renders.
- Proposal element: Update unit + e2e tests that target logout.
  - Design decision: Preserve `data-testid="logout-button"` on the menu item
    (Decision 2); enumerate callers in tasks.md.
  - Validation approach: `grep` shows no remaining direct-click logout paths;
    `npm run test:unit` and Playwright logout specs green.
- Proposal element: Housekeeping (`.wolf/anatomy.md`, `.wolf/memory.md`).
  - Design decision: Covered as explicit tasks.
  - Validation approach: Files updated in the change branch.

## Functional Requirements Mapping

- Requirement: Authenticated users see a top-right account trigger showing
  initials, or the full username when `<= 8` characters.
  - Design element: Decision 3 + Decision 4; `UserMenu` trigger.
  - Acceptance criteria reference: `specs/navigation/spec.md` — "Account trigger
    displays user identity".
  - Testability notes: Unit test renders `UserMenu` with mocked `useAuth`
    returning usernames `"Al"`, `"douglas"`, `"Douglas Adams"`, `""`; assert
    visible text and `aria-label`.
- Requirement: Activating the trigger opens a menu with a single `Logout` item
  that runs the existing logout flow.
  - Design element: Decision 1 + Decision 2.
  - Acceptance criteria reference: `specs/navigation/spec.md` — "Account menu
    exposes logout".
  - Testability notes: `user-event` click/Enter on trigger reveals `Logout`;
    activating it calls the mocked `logout` exactly once.
- Requirement: When unauthenticated or while auth is loading, no account trigger
  renders.
  - Design element: Decision 2 render gate.
  - Acceptance criteria reference: `specs/navigation/spec.md` — "Account trigger
    visibility is gated on auth state".
  - Testability notes: Unit tests with `isAuthenticated: false` and with
    `loading: true` assert nothing rendered.
- Requirement: The menu is keyboard and screen-reader operable — opens on
  Enter/Space/ArrowDown, closes on Escape and outside interaction, restores
  focus to the trigger on close, and is announced as a menu.
  - Design element: Decision 1 (Radix ARIA menu-button behavior).
  - Acceptance criteria reference: `specs/navigation/spec.md` — "Account menu is
    accessible".
  - Testability notes: Unit tests for Escape-closes + focus-return and
    outside-click-closes; `eslint-plugin-jsx-a11y` clean; a Playwright check
    tabs to the trigger and operates it by keyboard.
- Requirement: A missing username yields a `"Account"` label and a stable
  non-empty badge.
  - Design element: Decision 3 fallback.
  - Acceptance criteria reference: `specs/navigation/spec.md` — "Account trigger
    handles missing username".
  - Testability notes: Helper unit test for `undefined`/`""`/whitespace input.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: The menu primitive must not materially increase shared-layout
    first-load JS.
  - Design element: Decision 1 — single tree-shakeable package, only
    `DropdownMenu` imported; `UserMenu` is client-only and small.
  - Acceptance criteria reference: design note — record `next build` First Load
    JS delta in the PR; expectation < ~15 kB gzi.
  - Testability notes: Compare `next build` output before/after; note in PR
    description.
- Requirement category: security
  - Requirement: No change to auth/session handling; username is already
    client-exposed via `/api/auth/me`; render it as text (no `dangerouslySet…`).
  - Design element: Decisions 2–4 use plain text nodes and `aria-label`.
  - Acceptance criteria reference: `specs/navigation/spec.md` — "Username is
    rendered as inert text".
  - Testability notes: Unit test with a username containing `<script>`/markup
    asserts it appears as literal text.
- Requirement category: reliability
  - Requirement: Logout still fully clears client state even if the network
    call fails; menu unmounting during logout must not error.
  - Design element: Unchanged `useAuth().logout()`; `UserMenu` unmounts via the
    auth gate after `setUser(null)`.
  - Acceptance criteria reference: `specs/navigation/spec.md` — "Logout from the
    menu preserves existing cleanup semantics".
  - Testability notes: Unit test mocks `logout` to resolve after a tick; assert
    no thrown error and trigger disappears once `isAuthenticated` flips.
- Requirement category: operability
  - Requirement: Accessibility lint stays green; the change is covered by
    unit + e2e tests runnable via the project harness.
  - Design element: `eslint .` includes `jsx-a11y`; tests added under
    `tests/unit` and `tests/e2e`.
  - Acceptance criteria reference: tasks.md verification steps.
  - Testability notes: `npm run lint`, `npm run test:unit`,
    `npm run test:e2e` (logout specs).

## Risks / Trade-offs

- Risk/trade-off: Radix version chosen does not declare React 19 peer support.
  - Impact: Install warnings or runtime incompatibility.
  - Mitigation: During apply, check the exact version's `peerDependencies`;
    pick the latest that includes `react@^19`; render-test before wiring in.
- Risk/trade-off: Portalled menu content trips up tests that query within a
  container.
  - Impact: Flaky/failing unit tests.
  - Mitigation: Query via `screen` (document-wide) in RTL; in Playwright use the
    preserved `data-testid`.
- Risk/trade-off: Extra `/api/auth/me` fetch from a second `useAuth()` consumer.
  - Impact: One additional lightweight request per full load.
  - Mitigation: Accept for now; note a future move of `useAuth` to context.
- Risk/trade-off: First-load JS growth on every route.
  - Impact: Minor TTI cost.
  - Mitigation: Import only `DropdownMenu`; measure and report the delta.
- Risk/trade-off: Missed logout call site keeps clicking a now-hidden button.
  - Impact: Red e2e.
  - Mitigation: Exhaustive `grep` in tasks.md; migrate all before running.

## Rollback / Mitigation

- Rollback trigger: Post-merge accessibility regression, layout breakage in the
  shared nav, or build/bundle problem attributable to the menu primitive.
- Rollback steps: Revert the change's merge commit (single PR). This restores
  the inline `Logout` button and removes the dependency; no other code depends
  on `UserMenu` yet.
- Data migration considerations: None — no schema, storage, or API changes.
- Verification after rollback: `npm run build`, `npm run test:unit`, and the
  Playwright logout spec pass on `main`; the nav shows the original `Logout`
  button.

## Operational Blocking Policy

- If CI checks fail: Fix forward on the change branch; do not merge red. Bundle
  the fix into the same PR. Flaky portal/async menu tests must be stabilized
  (proper `await`/`findBy*`), not retried away.
- If security checks fail: Treat as blocking. This change adds a dependency —
  if dependency scanning flags `radix-ui`, evaluate the advisory; pin to a
  patched version or switch to `@headlessui/react` v2 (Decision 1 alternative)
  before merge. Never `verity waive` on agent judgment.
- If required reviews are blocked/stale: Re-request review after addressing
  comments; resolve every PR comment before merge (project rule). Do not use
  `--admin` / branch-protection bypass.
- Escalation path and timeout: If blocked > 1 working day on an external factor
  (dependency advisory with no fix, reviewer unavailable), comment on #611 with
  the blocker and the two viable library paths, and ask the requester to
  choose.

## Open Questions

- Confirm the menu library: Radix `radix-ui` (recommended) vs `@headlessui/react`
  v2. Non-blocking; apply proceeds with Radix absent an objection.
- Missing-username badge: generic person glyph vs literal `"AC"`. Non-blocking;
  default is a person glyph with `aria-label="Account"`.
- Whether to render a disabled/omitted trigger on `/login` and `/register`.
  Non-blocking; default is omitted (matches current gate).
