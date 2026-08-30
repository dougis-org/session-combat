## GitHub Issues

- dougis-org/session-combat#611

## Why

- Problem statement: When a user is logged in there is no visible indication of
  *who* is logged in, and no obvious place to sign out. The logout control is a
  bare text button crowded into the end of the primary nav, with no account
  context and no room to grow.
- Why now: Issue #611 asks for a visible username and a place to hang account
  actions. It is also a prerequisite for later account work (profile/settings
  page, user-uploaded avatars) which needs a stable "account menu" anchor.
- Business/user impact: Users can confirm which account they are in (important
  for players who share a device or run multiple campaigns), and reach logout
  through a conventional top-right account menu. Establishes a reusable,
  accessible, multi-level menu primitive the nav will build on over time.

## Problem Space

- Current behavior:
  - `lib/components/NavBar.tsx` renders a single flex row of `Link`s. When
    authenticated it appends a `?` feedback button (`ml-auto`) and a `Logout`
    text button (`data-testid="logout-button"`).
  - `lib/hooks/useAuth.ts` already exposes `user.username`, `user.email`,
    `isAdmin`, `loading`, `isAuthenticated`, and `logout()`.
  - `GET /api/auth/me` already returns `username` (may be `undefined` on very
    old records, though registration has long required it).
  - There is no dropdown / menu / popover primitive anywhere in the codebase and
    no menu library in `package.json`.
- Desired behavior:
  - Top-right of the nav shows an account trigger: a small badge showing the
    user's initials, or their full username when it is 8 characters or fewer.
  - Activating the trigger opens a menu whose only item (for now) is **Logout**,
    invoking the existing `logout()` flow.
  - The trigger exposes the username to assistive tech and on hover/focus.
  - The menu is keyboard operable, screen-reader announced, closes on Escape and
    outside click/blur, and is responsive on narrow viewports.
  - When unauthenticated or while `loading`, no account trigger renders (same
    gate as today's Logout button).
- Constraints:
  - Next.js 16 App Router, React 19, Tailwind v4, `eslint-plugin-jsx-a11y`
    active. Any new dependency must support React 19 and SSR/RSC-safe usage in a
    `'use client'` component.
  - Follow accessibility best practices (WAI-ARIA menu / menu button pattern).
    A hand-rolled dropdown is explicitly *not* wanted here — see design.md.
  - Must keep the existing `logout()` semantics and browser-side cleanup.
  - Existing tests select `data-testid="logout-button"` directly; those and any
    e2e specs that click logout must be updated to open the menu first.
- Assumptions:
  - `username` is present for effectively all active users; `"Account"` is an
    acceptable fallback label and initials source when it is missing.
  - Initials = first character of each whitespace-separated token of the
    username, max 2, uppercased. Full username shown instead when
    `username.length <= 8`.
  - The menu library chosen now will also serve future multi-level nav menus, so
    submenu support and composability matter more than bundle minimalism.
- Edge cases considered:
  - `username` undefined/empty → label `"Account"`, initials `"AC"` (or a
    generic person glyph — resolved in design).
  - Single-word vs multi-word usernames for initials.
  - Very long usernames → trigger must not blow out the nav row; truncate with
    ellipsis and rely on `aria-label`/`title` for the full value.
  - Rapid auth state change (login → the menu appears on next route change, as
    `useAuth` already re-checks on `pathname`).
  - Logout while the menu is open → menu unmounts with the nav's auth gate;
    ensure no focus-trap error is thrown.
  - Narrow screens where nav links wrap → account trigger stays right-aligned
    and the panel stays within the viewport.
  - Keyboard: Tab to trigger, Enter/Space/ArrowDown opens, ArrowUp/Down move,
    Enter activates, Escape closes and restores focus to the trigger.

## Scope

### In Scope

- Add an accessible menu/dropdown library dependency (evaluated in design.md;
  Radix UI `@radix-ui/react-dropdown-menu` is the leading candidate).
- New client component (e.g. `lib/components/UserMenu.tsx`) rendering the
  account trigger + menu with a single `Logout` item.
- Initials/short-name badge logic (small pure helper, unit tested).
- Wire `UserMenu` into `lib/components/NavBar.tsx`, replacing the standalone
  `Logout` button; keep the `?` feedback button.
- Update unit tests for `NavBar` and add unit tests for `UserMenu` + the
  initials helper.
- Update any Playwright e2e specs that interact with logout to go through the
  menu.
- Update `.wolf/anatomy.md` and `.wolf/memory.md` per project protocol.

### Out of Scope

- Any profile or account-settings page or route (issue #611 explicitly defers
  this; it is follow-up work built on this menu).
- User-uploaded avatars / profile images.
- Additional menu items beyond `Logout` (theme switch, admin links, etc.).
- Restructuring the rest of the nav into multi-level menus (this change only
  introduces the primitive and the account menu).
- Changes to `useAuth`, `/api/auth/me`, or the logout endpoint/semantics.
- Mobile hamburger / full nav responsive redesign.

## What Changes

- `package.json`: add the chosen menu primitive dependency (+ lockfile).
- `lib/components/UserMenu.tsx`: new client component — account trigger (initials
  or short username), dropdown menu, single `Logout` item calling
  `useAuth().logout()`.
- `lib/components/userMenuDisplay.ts` (or colocated helper): pure function
  deriving the trigger label + initials from `username`.
- `lib/components/NavBar.tsx`: render `<UserMenu />` in the top-right slot;
  remove the inline `Logout` button; keep feedback button and auth/loading gate.
- `tests/unit/components/NavBar.*`: update logout expectations to drive the menu.
- `tests/unit/components/UserMenu.*` + helper test: new coverage.
- `tests/e2e/*`: update logout interactions to open the account menu first.
- `.wolf/anatomy.md`, `.wolf/memory.md`: housekeeping updates.

## Risks

- Risk: New menu library incompatible with React 19 / Next 16 RSC boundaries.
  - Impact: Build or hydration failures; wasted integration effort.
  - Mitigation: design.md pins a specific library + version verified against
    React 19; component is `'use client'`; smoke-test build + a rendered unit
    test before wiring into the nav.
- Risk: Existing unit/e2e tests that select `logout-button` break.
  - Impact: Red CI until every caller is migrated.
  - Mitigation: `grep` for `logout-button` / logout interactions up front; list
    them in tasks.md; keep the `data-testid="logout-button"` on the menu item so
    assertions only need an extra "open menu" step.
- Risk: Bundle size / first-load JS increase in the shared layout.
  - Impact: Marginally slower initial load on every page.
  - Mitigation: Prefer a tree-shakeable primitive (single Radix package, not the
    whole kit); measure `next build` output delta and note it in the PR.
- Risk: Accessibility regressions (focus not restored, menu not announced).
  - Impact: Keyboard/screen-reader users worse off than the current plain
    button.
  - Mitigation: Use a library that implements the ARIA menu-button pattern;
    add tests for open/close, Escape, and focus return; run `eslint-jsx-a11y`.
- Risk: Initials logic produces confusing/empty output for odd usernames.
  - Impact: Ugly or blank badge.
  - Mitigation: Pure helper with unit tests covering empty, single-word,
    multi-word, non-ASCII, and overlong inputs; always fall back to `"Account"`.

## Open Questions

- Question: Confirm Radix UI (`@radix-ui/react-dropdown-menu`) as the primitive,
  vs Headless UI v2 or Base UI. Design.md recommends Radix for submenu support +
  composability; any objection?
  - Needed from: requester (dougis)
  - Blocker for apply: no (design.md will proceed with Radix unless told
    otherwise; swapping later is a localized change)
- Question: When `username` is missing, is a generic person glyph acceptable in
  the badge, or must it be the literal `"AC"` initials of `"Account"`?
  - Needed from: requester (dougis)
  - Blocker for apply: no (default: person glyph with `aria-label="Account"`)
- Question: Should the account trigger also appear (disabled/omitted) on
  `/login` and `/register`? Current assumption: omitted entirely, matching the
  existing Logout gate.
  - Needed from: requester (dougis)
  - Blocker for apply: no

No further unresolved ambiguity is expected to block design and specs; the open
questions above have safe documented defaults.

## Non-Goals

- Not building a profile/settings page or any account-management UI beyond
  logout.
- Not adding avatar image support.
- Not redesigning the overall navigation or its responsive behavior.
- Not changing authentication, session, or logout behavior.
- Not adding menu items for admins, theming, or campaign switching.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
