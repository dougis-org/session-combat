---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `campaign-encounter-edit-parity` change
(GitHub issue dougis-org/session-combat#606). All work follows strict TDD: write
the failing test from the spec scenario first, make it pass with the simplest
implementation, then refactor.

Test locations:
- Component/unit: `tests/unit/**` — run with `npm run test:unit`.
- Integration: `tests/integration/**` — run with `npm run test:integration`
  (project harness; never invoke `jest` directly — it skips MongoDB/Next lifecycle).

Fixtures: reuse `tests/fixtures/**`. Any test server must bind a free port, not 3000.

## Testing Steps

For each task in `openspec/changes/campaign-encounter-edit-parity/tasks.md`:

1. **Write a failing test** capturing the spec scenario. Run it; confirm it fails
   for the right reason.
2. **Write the minimal code** to make it pass.
3. **Refactor** while keeping the test green.

## Test Cases

### Task A — Shared `EncounterCard`
_Spec: "Linked-encounter cards show the encounter's monster roster"; "MODIFIED Campaign encounters page lists only the current campaign's linked encounters" (card presentation)._

- [ ] **A1** — `EncounterCard` renders the encounter name and, when present, the description.
- [ ] **A2** — `EncounterCard` renders a `Monsters (N)` heading and one row per monster, each showing name and HP/AC, for an encounter with 3 monsters (N = 3).
  - Scenario: "Linked encounter with monsters"
- [ ] **A3** — `EncounterCard` for an encounter with an empty `monsters` array renders `Monsters (0)` and zero monster rows, no error.
  - Scenario: "Linked encounter with no monsters"
- [ ] **A4** — `EncounterCard` renders whatever actions the caller passes in its actions slot, and renders nothing in that slot when none are passed.
- [ ] **A5** — Regression: `app/encounters/EncountersContent` refactored to use `EncounterCard` still renders each encounter with `data-testid="encounter-card"`, an `Edit` button, and a `Delete` button; existing global-encounters component tests still pass.

### Task B — DM-awareness / read-only path
_Spec: "Campaign encounters page renders read-only for non-DM members"; "MODIFIED ..." (non-DM scenario)._

- [ ] **B1** — With `useIsDM` mocked to `{ isDM: true, loading: false }`, the campaign encounters page shows the "Link Existing Encounter" and "Create New Encounter" actions, and each linked-encounter card shows `Edit` and `Unlink`.
  - Scenario: "DM sees full management controls"
- [ ] **B2** — With `useIsDM` mocked to `{ isDM: false, loading: false }`, the page renders each linked encounter with name, description, and monster roster, and shows none of Link / Create / Edit / Unlink, and no error banner.
  - Scenario: "Non-DM member sees a read-only list"
- [ ] **B3** — With `useIsDM` mocked to `{ isDM: false, loading: true }`, the linked-encounters list renders with no management controls; no control appears and is then removed once the mock flips to resolved.
  - Scenario: "Controls are hidden until role resolves"
- [ ] **B4** — The page issues at most one request to `GET /api/campaigns/[id]/members/me` (via `useIsDM`) and does not fetch the full member roster.
  - Scenario: NFAC Performance — "At most one extra membership request per visit"

### Task C — Inline edit
_Spec: "DM edits a linked encounter inline from the campaign encounters page" (all scenarios); "Campaign encounters page offers no encounter-deletion action"._

- [ ] **C1** — Clicking `Edit` on a linked-encounter card mounts `EncounterEditor` with that encounter's data and `isNew={false}`.
- [ ] **C2** — Saving the editor issues `PUT /api/encounters/e1` with the updated `name`, `description`, and `monsters`; on a 2xx response the editor closes, `GET /api/campaigns/[id]/encounters` is called again, and the card shows the updated name.
  - Scenario: "DM edits a linked encounter and saves"
- [ ] **C3** — When `PUT /api/encounters/e1` returns a non-2xx with `{ "error": "Encounter name is required" }`, the page error banner shows that message, the editor stays open, and `GET /api/campaigns/[id]/encounters` is NOT called again.
  - Scenario: "Edit save fails"
- [ ] **C4** — With the editor open for encounter "Goblin Ambush", clicking `Edit` on "Dragon's Lair" closes the first editor and opens the second; at most one `EncounterEditor` is mounted.
  - Scenario: "Only one encounter editor is open at a time"
- [ ] **C5** — With `useIsDM` → `{ isDM: false }`, no `Edit` control renders on any card.
  - Scenario: "Edit is hidden for a non-DM member"
- [ ] **C6** — No `Delete` control renders on any linked-encounter card, and there is no UI path that initiates `DELETE /api/encounters/[id]` from the campaign encounters page.
  - Scenario: "No delete control on the campaign screen"
- [ ] **C7** — Opening `Edit` closes an open create form / link picker (mutually exclusive panels).

### Task D — Server-side authorization guard
_Spec: NFAC Security — "Non-owner edit attempt is rejected by the server"._

- [ ] **D1** (integration, harness) — `PUT /api/encounters/e1` authenticated as a user who does not own `e1` returns `404` and the encounter is unchanged when re-read.

### Task E — Campaign edit integration
_Spec: "DM edits a linked encounter and saves"; NFAC Reliability — "List stays consistent after a failed edit"._

- [ ] **E1** (integration, harness) — Seed a campaign with a DM-owned linked encounter; `PUT` an edit (new name + added monster); reload linked encounters via `GET /api/campaigns/[id]/encounters`; assert the returned encounter reflects the edit.
- [ ] **E2** (component) — When `handleEditSave`'s `fetch` rejects (network error), the page shows an error, does not refetch, and the previously loaded list stays rendered unchanged (no optimistic/partial update).
  - Scenario: NFAC Reliability — "List stays consistent after a failed edit"

## Traceability (test case → task → spec scenario)

| Test | Task | Spec scenario |
|------|------|---------------|
| A1–A4 | A | Linked-encounter cards show the encounter's monster roster |
| A5 | A | MODIFIED ... lists only the current campaign's linked encounters |
| B1 | B | DM sees full management controls |
| B2 | B | Non-DM member sees a read-only list |
| B3 | B | Controls are hidden until role resolves |
| B4 | B | NFAC Performance — one extra membership request |
| C1, C2 | C | DM edits a linked encounter and saves |
| C3 | C | Edit save fails |
| C4 | C | Only one encounter editor is open at a time |
| C5 | C | Edit is hidden for a non-DM member |
| C6 | C | No delete control on the campaign screen |
| C7 | C | (supports single-panel invariant) |
| D1 | D | NFAC Security — non-owner edit rejected by the server |
| E1 | E | DM edits a linked encounter and saves (persistence) |
| E2 | E | NFAC Reliability — list stays consistent after a failed edit |

## Exit criteria

- Every test case above is implemented and passing.
- `npm run test:unit`, `npm run test:integration`, `npm run typecheck`, `npm run lint`, and `npm run build` all succeed.
- No changes under `app/api/**` other than added tests (this change is frontend-only).
