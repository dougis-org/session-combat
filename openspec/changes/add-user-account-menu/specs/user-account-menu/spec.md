## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Account trigger displays user identity

The system SHALL render, in the top-right of the global navigation bar, an
account trigger control that shows the authenticated user's identity: the full
username when it is 8 characters or fewer after trimming, otherwise the user's
initials (first character of the first and last whitespace-separated tokens,
uppercased, at most two characters).

#### Scenario: Short username shown in full

- **Given** an authenticated user whose username is `"douglas"`
- **When** the navigation bar renders
- **Then** the account trigger is visible at the right end of the nav row
- **And** its visible text is `"douglas"`
- **And** its accessible name (`aria-label`) is `"douglas"`

#### Scenario: Long username shown as initials

- **Given** an authenticated user whose username is `"Douglas Adams"`
- **When** the navigation bar renders
- **Then** the account trigger's visible text is `"DA"`
- **And** its accessible name is `"Douglas Adams"`

#### Scenario: Single long token shown as initials

- **Given** an authenticated user whose username is `"stridertheranger"`
- **When** the navigation bar renders
- **Then** the account trigger's visible text is `"S"`
- **And** its accessible name is `"stridertheranger"`

### Requirement: ADDED Account trigger handles missing username

The system SHALL fall back to the label `"Account"` when the authenticated
user has no username (absent, empty, or whitespace-only), and SHALL still render
a non-empty, stable trigger.

#### Scenario: Missing username falls back to Account

- **Given** an authenticated user whose username is `undefined`
- **When** the navigation bar renders
- **Then** the account trigger renders
- **And** its accessible name is `"Account"`
- **And** the trigger is not blank (it shows a person glyph or the letters `"AC"`)

### Requirement: ADDED Account menu exposes logout

The system SHALL open a menu when the account trigger is activated, containing
exactly one item, `Logout`, which invokes the existing client logout flow
(`useAuth().logout()`) exactly once per activation, preserving all current
browser-side cleanup and redirect behavior.

#### Scenario: Logout via the account menu

- **Given** an authenticated user with the navigation bar rendered
- **When** the user activates the account trigger
- **Then** a menu appears containing a single item labelled `"Logout"`
- **And** the item carries `data-testid="logout-button"`
- **When** the user activates the `Logout` item
- **Then** `useAuth().logout()` is invoked exactly once
- **And** no other menu item is present

#### Scenario: Menu unmounts cleanly during logout

- **Given** the account menu is open and `logout()` resolves after a short delay
- **When** the user activates `Logout` and auth state transitions to
  unauthenticated
- **Then** the account trigger and menu are removed from the DOM
- **And** no error is thrown during unmount

### Requirement: ADDED Account trigger visibility is gated on auth state

The system SHALL render the account trigger only when the user is authenticated
and authentication state is not loading, matching the pre-existing gate on the
former inline logout button.

#### Scenario: Hidden when unauthenticated

- **Given** an unauthenticated visitor
- **When** the navigation bar renders
- **Then** no account trigger and no `data-testid="logout-button"` element exist

#### Scenario: Hidden while auth is loading

- **Given** authentication state is still loading
- **When** the navigation bar renders
- **Then** no account trigger is rendered

### Requirement: ADDED Account menu is accessible

The system SHALL implement the account menu using the WAI-ARIA menu-button
pattern: the trigger opens the menu on `Enter`, `Space`, or `ArrowDown`; the
menu closes on `Escape` and on outside pointer interaction; closing returns
focus to the trigger; and the menu and its items expose correct roles.

#### Scenario: Keyboard open and close

- **Given** keyboard focus is on the account trigger
- **When** the user presses `Enter` (or `Space`, or `ArrowDown`)
- **Then** the menu opens and focus moves into it
- **When** the user presses `Escape`
- **Then** the menu closes
- **And** focus returns to the account trigger

#### Scenario: Outside interaction closes the menu

- **Given** the account menu is open
- **When** the user clicks outside the menu
- **Then** the menu closes
- **And** no menu item is activated

#### Scenario: Menu roles are correct

- **Given** the account menu is open
- **Then** the menu container has role `menu`
- **And** the `Logout` control has role `menuitem`
- **And** the trigger exposes `aria-haspopup` and reflects `aria-expanded`

### Requirement: ADDED Username is rendered as inert text

The system SHALL render the username only as plain text content and accessible
attributes, never as interpreted HTML.

#### Scenario: Markup in username is not interpreted

- **Given** an authenticated user whose username is `"<b>x</b>"`
- **When** the navigation bar renders
- **Then** the account trigger shows the literal characters `<b>x</b>` (or the
  initials derived from them), and no bold element is created from the username

### Requirement: ADDED Account menu primitive supports future submenus

The system SHALL provide the account menu via a reusable, composable menu
primitive that supports nested submenus, so subsequent navigation menus can be
built on the same dependency without introducing another menu library.

#### Scenario: Primitive exposes submenu composition

- **Given** the menu primitive dependency added by this change
- **Then** it exposes submenu/nested-menu composition (e.g. a `Sub` /
  `SubTrigger` / `SubContent` API or equivalent)
- **And** it declares support for React 19 in its peer dependencies

## MODIFIED Requirements

### Requirement: MODIFIED Navigation bar authenticated controls

The system SHALL, for authenticated users, present logout through the account
menu described above instead of a standalone text button in the navigation row.
The feedback (`?`) button and the invitations link are unchanged.

#### Scenario: No standalone logout button remains

- **Given** an authenticated user with the navigation bar rendered
- **When** the nav row is inspected
- **Then** there is no top-level `Logout` button as a direct child of the nav row
- **And** the `?` feedback button is still present
- **And** logout remains reachable via the account menu

## REMOVED Requirements

None.

## Traceability

- Proposal element "Add accessible menu/dropdown library" -> Requirement
  "Account menu primitive supports future submenus".
- Proposal element "New UserMenu component replacing the inline Logout button"
  -> Requirements "Account menu exposes logout", "Navigation bar authenticated
  controls".
- Proposal element "Initials / short-name badge logic" -> Requirements
  "Account trigger displays user identity", "Account trigger handles missing
  username".
- Proposal element "Wire into NavBar, keep feedback button + auth/loading gate"
  -> Requirements "Account trigger visibility is gated on auth state",
  "Navigation bar authenticated controls".
- Proposal element "Update unit + e2e tests that target logout" -> Requirement
  "Account menu exposes logout" (preserved `data-testid`).
- Design Decision 1 (Radix primitives) -> Requirements "Account menu is
  accessible", "Account menu primitive supports future submenus".
- Design Decision 2 (UserMenu component) -> Requirements "Account menu exposes
  logout", "Account trigger visibility is gated on auth state".
- Design Decision 3 (deriveUserMenuDisplay helper) -> Requirements "Account
  trigger displays user identity", "Account trigger handles missing username",
  "Username is rendered as inert text".
- Design Decision 4 (trigger visuals / overflow) -> Requirement "Account trigger
  displays user identity".
- Requirement "Account trigger displays user identity" -> Tasks: helper
  implementation + helper unit tests + UserMenu render tests.
- Requirement "Account trigger handles missing username" -> Tasks: helper
  fallback + helper unit tests.
- Requirement "Account menu exposes logout" -> Tasks: UserMenu implementation,
  UserMenu unit tests, NavBar wiring, e2e logout migration.
- Requirement "Account trigger visibility is gated on auth state" -> Tasks:
  UserMenu gate, NavBar unit tests.
- Requirement "Account menu is accessible" -> Tasks: adopt Radix DropdownMenu,
  accessibility unit tests, keyboard e2e check, a11y lint.
- Requirement "Username is rendered as inert text" -> Tasks: UserMenu unit test
  with markup username.
- Requirement "Account menu primitive supports future submenus" -> Tasks: add +
  pin dependency, verify peer range.
- Requirement "Navigation bar authenticated controls" -> Tasks: NavBar wiring,
  NavBar unit tests, e2e logout migration.

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Shared-layout first-load JS budget

- **Given** a production build (`next build`) before and after this change
- **When** the First Load JS for a representative route is compared
- **Then** the increase attributable to the menu primitive is at most ~15 kB
  gzipped
- **And** the measured delta is recorded in the pull request description

### Requirement: Security

#### Scenario: Access control

- No new access-control surface is introduced. Authentication and logout
  semantics are unchanged. See functional scenarios: "Account trigger visibility
  is gated on auth state" (hidden when unauthenticated) and "Username is
  rendered as inert text".

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** the `POST /api/auth/logout` network call fails
- **When** the user activates `Logout` from the account menu
- **Then** client-side session data is still fully cleared (local store, sync
  queue, client storage) and the app redirects to `/login`
- **And** this matches the behavior of the previous standalone logout button
