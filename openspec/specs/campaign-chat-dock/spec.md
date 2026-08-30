# Campaign Chat Dock — Specification

This document is the canonical specification for the `CampaignChat` dock shell feature (Phase 4c / Phase 5). Implementation: `lib/components/CampaignChat.tsx`, mounted in `app/campaigns/[id]/layout.tsx` (scoped to campaign routes). Design rationale: `openspec/changes/archive/2026-06-09-campaign-chat-dock-shell/design.md`. Live-data wiring: `openspec/specs/campaign-chat-wire/spec.md`.

**Note (Phase 5, issue #315):** `CampaignChat` now requires a `campaignId: string` prop and is mounted in `app/campaigns/[id]/layout.tsx`, not `app/layout.tsx`. The dock shell behavior below is unchanged; live-data requirements are specified in `openspec/specs/campaign-chat-wire/spec.md`.

---

## Requirement: CampaignChat dock shell renders on campaign pages

The system SHALL render a `CampaignChat` component on all campaign routes (`/campaigns/[id]/…`) via `app/campaigns/[id]/layout.tsx`. The component requires a `campaignId: string` prop.

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

- Corner pill (`fixed bottom-4 right-4 z-40`) → Requirement: CampaignChat dock shell renders on campaign pages
- Expanded drawer (`w-80`, height `33vh` via inline style) → Requirement: Collapse/expand toggle
- Pin persisted via LocalStore → Requirement: Pin-open control persisted to LocalStore
- Keyboard accessible → Requirement: Keyboard accessibility
- Design D2 (render on campaign routes) → Requirement: dock renders on campaign pages → `app/campaigns/[id]/layout.tsx`
- Design D3 (LocalStore key `campaign-chat-pin`) → Requirement: pin persisted → `CampaignChat` pin toggle
- Design D5 (unpin = don't collapse) → Scenario: Unpinning while expanded does not collapse
- Design D6 (Escape always collapses) → Scenario: Collapse dock via Escape key
- Implementation: `lib/components/CampaignChat.tsx`, `app/campaigns/[id]/layout.tsx`
- Tests: decomposed under `tests/unit/components/CampaignChat/` (see `campaign-chat-wire/spec.md`)

---

## MODIFIED Requirements

### Requirement: MODIFIED Test suite location for CampaignChat dock shell

The unit tests verifying the `CampaignChat` dock shell behavior (drawer visibility, collapse/expand toggle, pin state persistence, and keyboard accessibility) SHALL be located in a dedicated test file under the `tests/unit/components/CampaignChat/` folder.

#### Scenario: Dock shell unit tests run and pass in drawer suite

- **Given** the `CampaignChat.test.tsx` file is decomposed
- **When** `npm run test:unit` is executed
- **Then** all 13 dock shell tests in [`tests/unit/components/CampaignChat/CampaignChat.drawer.test.tsx`](../../../tests/unit/components/CampaignChat/CampaignChat.drawer.test.tsx) pass without modification to their original assertions.

## Traceability

- Proposal element: Decomposing tests into focused files -> Requirement: MODIFIED Test suite location
- Design decision: Centralized helpers.ts File -> Requirement: MODIFIED Test suite location
- Requirement -> Task(s): Decompose CampaignChat dock shell tests to CampaignChat.drawer.test.tsx

---

## ADDED Requirements (2026-08-29, `decouple-dice-roll-capability`)

### Requirement: ADDED Source location for CampaignChat submodules

The source implementing the `CampaignChat` dock shell, feed, composer, and dock-state logic SHALL be organized under `lib/components/CampaignChat/` as `index.tsx` (coordinator), `ChatFeed.tsx`, `Composer.tsx`, `useDockState.ts`, `useChatFeed.ts`, `useHistoryPagination.ts`, `useComposer.ts`, `useMembers.ts`, and `DragHandle.tsx`, in place of the single `lib/components/CampaignChat.tsx` file, with **no dice-pool selection, roll-submission, or dice-pool-wiring hook** remaining in any of these files. The `useCampaignDice.ts` hook that previously lived here was deleted by `remove-chat-docked-dice` (2026-08-30); all dice-pool and roll-submission logic lives in `lib/dice/` and is consumed only by `GlobalDiceFab` (see `dice-pool-shared-state` and `global-dice-fab` capabilities). The public import `import { CampaignChat } from '@/lib/components/CampaignChat'` SHALL continue to resolve unchanged.

#### Scenario: Public import path is unaffected by the split

- **Given** `lib/components/CampaignChat.tsx` has been decomposed into
  `lib/components/CampaignChat/`
- **When** any existing file imports `{ CampaignChat }` from
  `'@/lib/components/CampaignChat'`
- **Then** the import resolves to the same exported component with no change to the import
  statement required

#### Scenario: No file in the split exceeds the project's readability/size guidance

- **Given** the split is complete
- **When** each file under `lib/components/CampaignChat/` is measured
- **Then** none of them trips the Verity quality gate's size threshold that originally
  flagged the single 1054-line file

#### Scenario: Dock/drawer behavior is unchanged after the split

- **Given** the `CampaignChat` dock shell (collapse/expand, pin, keyboard accessibility,
  drag-resize, persisted size) is exercised
- **When** `npm run test:unit` is executed against the decomposed files
- **Then** all existing dock-shell test files under `tests/unit/components/CampaignChat/`
  pass without modification to their original assertions

#### Scenario: No dice-pool, roll-submission, or dice-wiring code remains in the CampaignChat submodules

- **Given** the split is complete and `remove-chat-docked-dice` (2026-08-30) has landed
- **When** every file under `lib/components/CampaignChat/` is inspected
- **Then** none of them defines dice-pool selection state, a POST call to
  `/api/campaigns/[id]/rolls`, an import of `useDicePoolState` / `useRollSubmission`, or a
  render of `DicePoolPanel` / `DiceTriggerButton`
- **And** `lib/components/CampaignChat/useCampaignDice.ts` does not exist

### Traceability

- Proposal "Scope" (CampaignChat.tsx split into submodules) → Requirements: ADDED Source
  location for CampaignChat submodules
- Design decision 4 (submodule layout) → Requirements: ADDED Source location for
  CampaignChat submodules
- Mirrors the existing "MODIFIED Test suite location for CampaignChat dock shell"
  requirement's pattern (companion source-file split following the already-completed
  test-file split from issue #518)
- Requirement → Task(s): see `openspec/changes/archive/2026-08-29-decouple-dice-roll-capability/tasks.md`, "Split CampaignChat.tsx" task group
