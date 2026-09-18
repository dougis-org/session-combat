## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED No local test helper shadows a `helpers.tsx` export name

Within `tests/unit/components/CampaignChat/`, a `*.test.tsx` file's file-scoped (non-imported) helper function SHALL NOT share its identifier with any export of `helpers.tsx`, unless it is the actual imported export being used.

#### Scenario: Local resize-drag helper no longer collides with the shared `openDock` export

- **Given** `tests/unit/components/CampaignChat/helpers.tsx` exports a function named `openDock`
- **When** `CampaignChat.resize.test.tsx` is inspected for its own file-scoped function declarations
- **Then** no function named `openDock` is declared locally in `CampaignChat.resize.test.tsx`; the local render-and-toggle helper is named `openDockLocal` instead

#### Scenario: Renamed helper is used consistently at every call site

- **Given** `CampaignChat.resize.test.tsx` previously called its local `openDock()` at 4 sites (lines 132, 168, 174, 197)
- **When** the rename to `openDockLocal` is applied
- **Then** all 4 call sites invoke `openDockLocal()` and no call site still references the old `openDock` identifier

### Requirement: ADDED Existing resize-test behavior is preserved across the rename

The system SHALL preserve all existing `CampaignChat.resize.test.tsx` test behavior and assertions unchanged after the helper rename.

#### Scenario: All resize tests continue to pass with unchanged assertions

- **Given** `CampaignChat.resize.test.tsx` has 13 passing tests prior to this change, exercising expand/collapse, drag-resize clamping, height resolution, and persistence save/load logic
- **When** the local helper is renamed from `openDock` to `openDockLocal` and its 4 call sites are updated
- **Then** all tests in the file still pass, with no changes to any test's assertions, rendered output expectations, or mock setup

### Requirement: ADDED `helpers.tsx` documents the naming-collision risk for local test helpers

The system SHALL include a comment in `helpers.tsx`, near its exported helper functions, warning future editors that a `CampaignChat.*.test.tsx` file's local helper must not reuse a `helpers.tsx` export name.

#### Scenario: Guardrail comment is present and visible near the exports

- **Given** `helpers.tsx` exports `openDock`, `openDockWithSession`, `openDockWithSessionViaRealFetch`, `mockActiveSessionIdCore`, and other test helpers
- **When** a developer opens `helpers.tsx` to add or review its exports
- **Then** a comment is present near those exports stating that local test-file helpers in sibling `CampaignChat.*.test.tsx` files must not reuse any of these export names

## Traceability

- Proposal element: rename `resize.test.tsx`'s local `openDock` to `openDockLocal` and update 4 call sites -> Requirement: "No local test helper shadows a `helpers.tsx` export name"
- Proposal element: preserve existing test behavior -> Requirement: "Existing resize-test behavior is preserved across the rename"
- Proposal element: add guardrail comment to `helpers.tsx` -> Requirement: "`helpers.tsx` documents the naming-collision risk for local test helpers"
- Design decision: Decision 1 (rename local helper) -> Requirement: "No local test helper shadows a `helpers.tsx` export name"
- Design decision: Decision 3 (guardrail comment) -> Requirement: "`helpers.tsx` documents the naming-collision risk for local test helpers"
- Requirement: "No local test helper shadows a `helpers.tsx` export name" -> Task(s): rename function, update call sites
- Requirement: "Existing resize-test behavior is preserved across the rename" -> Task(s): run `resize.test.tsx` before and after, confirm identical pass/fail results
- Requirement: "`helpers.tsx` documents the naming-collision risk for local test helpers" -> Task(s): add comment to `helpers.tsx`

## Non-Functional Acceptance Criteria

No performance, security, or reliability properties are affected by this change — it is a test-only rename plus a comment addition, with no runtime, network, or data-handling behavior involved. No NFAC scenarios apply.
