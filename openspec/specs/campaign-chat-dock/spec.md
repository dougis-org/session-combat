# Campaign Chat Dock — Specification

This document is the canonical specification for the `CampaignChat` dock shell feature (Phase 4c). Implementation: `lib/components/CampaignChat.tsx`, mounted globally in `app/layout.tsx`. Design rationale: `openspec/changes/archive/2026-06-09-campaign-chat-dock-shell/design.md`.

---

## Requirement: CampaignChat dock shell renders globally

The system SHALL render a `CampaignChat` component on every page of the application via `app/layout.tsx`.

#### Scenario: Pill present on initial render

- **Given** the application is loaded on any route
- **When** the page renders
- **Then** a button with accessible name matching `/chat/i` is present in the document

#### Scenario: Drawer absent on initial render (default collapsed)

- **Given** `LocalStore` has no stored pin preference
- **When** the component mounts
- **Then** the element with `role="complementary"` and `aria-label="Campaign Chat"` is not present in the document

---

## Requirement: Collapse/expand toggle

The system SHALL toggle between collapsed (pill) and expanded (drawer) states on user interaction.

#### Scenario: Expand dock by clicking the pill

- **Given** the dock is in collapsed state
- **When** the user clicks the pill button
- **Then** the element with `role="complementary"` and `aria-label="Campaign Chat"` is present in the document

#### Scenario: Collapse dock by clicking the close button

- **Given** the dock is in expanded state
- **When** the user clicks the close button (accessible name `/close/i` or `/collapse/i`)
- **Then** the element with `role="complementary"` is removed from the document

#### Scenario: Collapse dock via Escape key

- **Given** the dock is in expanded state
- **When** the user presses the Escape key
- **Then** the element with `role="complementary"` is removed from the document

#### Scenario: Escape key does nothing when dock is already collapsed

- **Given** the dock is in collapsed state
- **When** the user presses the Escape key
- **Then** no error occurs and the dock remains collapsed

---

## Requirement: Pin-open control persisted to LocalStore

The system SHALL persist the pin preference using `LocalStore` under the key `campaign-chat-pin`, and restore it on mount.

#### Scenario: Pin button toggles to pinned state

- **Given** the dock is expanded and not pinned
- **When** the user clicks the pin button
- **Then** the pin button has `aria-pressed="true"` and `LocalStore.set` is called with key `campaign-chat-pin` and value `true`

#### Scenario: Pin button toggles to unpinned state

- **Given** the dock is expanded and pinned (`aria-pressed="true"`)
- **When** the user clicks the pin button
- **Then** the pin button has `aria-pressed="false"` and `LocalStore.remove` is called with key `campaign-chat-pin`

#### Scenario: Dock opens on mount when pin is stored

- **Given** `LocalStore.get('campaign-chat-pin')` returns `true`
- **When** the component mounts
- **Then** the element with `role="complementary"` is present in the document (drawer expanded)

#### Scenario: Dock starts collapsed when pin is not stored

- **Given** `LocalStore.get('campaign-chat-pin')` returns `null`
- **When** the component mounts
- **Then** the element with `role="complementary"` is not present in the document

#### Scenario: Unpinning while expanded does not collapse the drawer

- **Given** the dock is expanded and pinned
- **When** the user clicks the pin button to unpin
- **Then** the element with `role="complementary"` is still present in the document (drawer remains expanded)

---

## Requirement: Keyboard accessibility

The system SHALL be fully operable via keyboard with appropriate ARIA attributes.

#### Scenario: Pill button is focusable and activatable

- **Given** the dock is collapsed
- **When** the user focuses the pill button and presses Enter or Space
- **Then** the drawer expands (same result as click)

#### Scenario: Drawer has complementary landmark and label

- **Given** the dock is expanded
- **When** the DOM is queried
- **Then** an element with `role="complementary"` and `aria-label="Campaign Chat"` is present

#### Scenario: Pin button reports pressed state

- **Given** the dock is expanded
- **When** the DOM is queried
- **Then** the pin button has `aria-pressed` attribute reflecting current pin state (`"true"` when pinned, `"false"` when not pinned)

---

## Non-Functional Requirements

### Reliability — SSR safety

#### Scenario: No localStorage access during server render

- **Given** the component is rendered in a Node.js (non-browser) environment
- **When** the module is imported and the component tree is server-rendered
- **Then** no `localStorage` access is attempted (verified by `LocalStore`'s `isBrowser()` guard and `useEffect`-gated mount logic)

### Reliability — no layout regression

#### Scenario: Existing tests pass after layout change

- **Given** `<CampaignChat />` is added to `app/layout.tsx`
- **When** the full unit and integration test suite is run
- **Then** no previously passing test fails (the dock is `fixed`-positioned and out of document flow)

### Security

No authentication, authorization, or sensitive data is involved in this component. The dock renders static UI with no user-supplied input beyond button clicks.

---

## Traceability

- Corner pill (`fixed bottom-4 right-4 z-40`) → Requirement: CampaignChat dock shell renders globally
- Expanded drawer (`w-80 h-[33vh]`) → Requirement: Collapse/expand toggle
- Pin persisted via LocalStore → Requirement: Pin-open control persisted to LocalStore
- Keyboard accessible → Requirement: Keyboard accessibility
- Design D2 (always render) → Requirement: dock renders globally → `app/layout.tsx`
- Design D3 (LocalStore key `campaign-chat-pin`) → Requirement: pin persisted → `CampaignChat` pin toggle
- Design D5 (unpin = don't collapse) → Scenario: Unpinning while expanded does not collapse
- Design D6 (Escape always collapses) → Scenario: Collapse dock via Escape key
- Implementation: `lib/components/CampaignChat.tsx`, `app/layout.tsx`
- Tests: `tests/unit/components/CampaignChat.test.tsx`
