---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `campaign-encounters-management-screen`
change. All work should follow a strict TDD (Test-Driven Development)
process. All tests are unit tests (jsdom + Jest, mocked `fetch`), matching
the existing pattern in `tests/unit/api/campaigns/[id]/encounters/**` and
`tests/unit/components/PartyEditor.test.tsx`. No new E2E coverage is added
by this change — the underlying API contract is already covered by
integration tests under #536, and this change is UI-only composition of
components (`EncounterEditor`) and API calls that are each independently
tested elsewhere.

New test file: `tests/unit/app/campaigns/[id]/encounters/page.test.tsx`
(mirrors the existing `tests/unit/app/characters/[id]/page.test.tsx`
naming convention for dynamic-route page tests).

Modified test file: existing test coverage for
`app/campaigns/[id]/layout.tsx`, if any exists today — extend it; if none
exists, add `tests/unit/app/campaigns/[id]/layout.test.tsx` scoped only to
nav rendering (do not attempt to test `CampaignChat`/`SessionControl`
integration, which is out of scope).

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task A — Nav tabs in `app/campaigns/[id]/layout.tsx`

- [ ] Renders an "Encounters" link with `href="/campaigns/[id]/encounters"` alongside the existing four tabs.
      Maps to spec scenario: "Both new tabs render and link correctly" (`specs/campaign-encounter-management-ui/spec.md`).
- [ ] Renders a "Combat" link with `href="/campaigns/[id]/combat"`.
      Maps to spec scenario: "Both new tabs render and link correctly".
- [ ] When the current pathname is `/campaigns/[id]/encounters`, the "Encounters" tab has `aria-current="page"` and the others do not.
      Maps to spec scenario: "Active tab highlighting works for the new routes".

### Task C — Linked-encounters list

- [ ] On mount, calls `GET /api/campaigns/[id]/encounters` exactly once and renders each returned encounter's name.
      Maps to spec scenario: "Campaign with linked encounters".
- [ ] When the API returns `[]`, renders the empty-state message with "Link Existing Encounter" and "Create New Encounter" actions, and renders no error banner.
      Maps to spec scenario: "Campaign with zero linked encounters".
- [ ] When the fetch fails (non-2xx or network error), renders an error banner instead of an empty list, and does not crash.
      Maps to design.md Non-Functional Requirements Mapping (security/reliability row — errors surfaced, not silent).

### Task D — "Link Existing Encounter" picker

- [ ] Opening the picker triggers exactly one `GET /api/encounters` call.
      Maps to spec (NFAC) scenario: "Picker fetch happens once per open, not per keystroke".
- [ ] Given owned encounters `e1,e2,e3` and linked `["e1"]`, the picker renders only `e2` and `e3`.
      Maps to spec scenario: "Picker excludes already-linked encounters".
- [ ] Typing "gob" into the picker's search input, with owned unlinked encounters "Goblin Ambush" and "Owlbear Den" both visible, filters the render to only "Goblin Ambush"; no additional `fetch` call is made after the initial `GET /api/encounters`.
      Maps to spec scenarios: "Picker search filters by name" and "Picker fetch happens once per open, not per keystroke".
- [ ] Given every owned encounter is already linked, the picker renders the "all owned encounters are already linked" message and no selectable rows.
      Maps to spec scenario: "All owned encounters are already linked".
- [ ] Selecting an unlinked encounter and confirming calls `POST /api/campaigns/[id]/encounters` with body `{ encounterId }`; on success, triggers a refetch of `GET /api/campaigns/[id]/encounters` and the newly linked encounter appears in the rendered linked list.
      Maps to spec scenario: "DM links an encounter from the picker".
- [ ] When the link `POST` resolves `404`, an inline error renders, no refetch of the linked list occurs, and the picker stays open with the encounter still selectable.
      Maps to spec scenario: "Linking an encounter the DM no longer owns fails visibly".
- [ ] Clicking the link control twice in quick succession (before the first request resolves) results in exactly one `POST /api/campaigns/[id]/encounters` call; the control is disabled while in flight.
      Maps to spec scenario: "Double-click on link does not double-submit".

### Task E — "Create New Encounter" via `EncounterEditor`

- [ ] Opening "Create New Encounter" renders `EncounterEditor` with `isNew={true}` and no `campaignId`-shaped prop passed to it (asserting the component itself receives no new/changed props).
      Maps to design.md Decision 4 (no `EncounterEditor` prop change).
- [ ] Saving via `EncounterEditor`'s `onSave` results in a `POST /api/encounters` call whose body includes `campaignId` equal to the current campaign id, alongside `name`/`description`/`monsters`.
      Maps to spec scenario: "Create and link succeeds".
- [ ] On a plain `201` response (no `linkWarning`), the create panel closes and `GET /api/campaigns/[id]/encounters` is refetched.
      Maps to spec scenario: "Create and link succeeds".
- [ ] On a `201` response that includes a `linkWarning` field, a distinct non-blocking warning renders (visually/structurally distinguishable from the hard-error banner used elsewhere on the page), the create panel still closes, and the linked list is still refetched.
      Maps to spec scenario: "Encounter created but linking failed (linkWarning)".

### Task F — "Unlink" per row

- [ ] Clicking "Unlink" invokes `window.confirm` with text that includes both the encounter's name and an explicit statement that it will not be deleted / remains on the global Encounters list.
      Maps to spec scenario: "Confirmation copy states the encounter is not deleted".
- [ ] When `window.confirm` returns `true`, calls `DELETE /api/campaigns/[id]/encounters/[encounterId]` with the correct id; on success, refetches the linked list and the encounter no longer renders.
      Maps to spec scenario: "DM confirms and unlinks".
- [ ] When `window.confirm` returns `false`, no `DELETE` request is made and the encounter remains rendered in the linked list.
      Maps to spec scenario: "DM cancels the confirmation".

## Traceability Check

- [ ] Every ADDED/MODIFIED requirement scenario in
      `specs/campaign-encounter-management-ui/spec.md` has at least one
      corresponding test case above (cross-checked by requirement name in
      each "Maps to spec scenario" line).
- [ ] Every task in `tasks.md` Execution section (Tasks A, C–F; Task B is
      pure scaffolding with no independent behavior to test) has at least
      one test case above.
