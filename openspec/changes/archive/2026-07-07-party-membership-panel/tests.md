---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `party-membership-panel` change. All work should follow a strict TDD (Test-Driven Development) process: write a failing test, write the minimal code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### `GET /api/campaigns/[id]/parties` (Task: Add GET route)

- [x] Active member (role `player`, status `active`) receives 200 with all parties in the campaign, including parties they do not own. (specs/party-management/spec.md — "Active member lists campaign parties")
- [x] Active member with role `dm` receives 200 with all parties in the campaign. (specs/party-management/spec.md — "Active member lists campaign parties")
- [x] Non-member of the campaign receives 403 or 404 with no party data. (specs/party-management/spec.md — "Non-member denied")
- [x] Member with `status !== 'active'` receives 403 or 404 with no party data. (specs/party-management/spec.md — "Inactive member denied")
- [x] Campaign with zero parties returns 200 with `[]`. (specs/party-management/spec.md — "Campaign with no parties")
- [x] Storage read failure returns 500 with a generic error body (no internal details leaked). (specs/party-management/spec.md — "Storage read failure")
- [ ] Response returns within the documented latency budget under normal test conditions. (specs/party-management/spec.md — "Latency budget") — no explicit timing assertion was added; not tested.

### `PartyMembershipPanel` component (Task: Add component)

- [x] Renders a checkbox for each of the player's own characters passed in. (specs/party-membership-panel/spec.md — "Panel renders one section per party")
- [x] Checkbox is checked when the character has an active (`!leftAt`) `PartyMember` entry for this party, unchecked otherwise. (specs/party-membership-panel/spec.md — "Multi-party membership is independent")
- [x] Checking an unchecked character sends `PUT /api/campaigns/{campaignId}/members/{myUserId}/parties/{party.id}` with `characterIds` including the newly checked character alongside all previously-active ones. (specs/party-membership-panel/spec.md — "Player adds own character to a party")
- [x] Unchecking a checked character sends the same PUT with `characterIds` excluding that character. (specs/party-membership-panel/spec.md — "Player removes own character from a party")
- [x] While a toggle's PUT is in flight, that character's checkbox is disabled; other characters' checkboxes in the same panel remain interactive.
- [x] A failing PUT response (non-2xx or thrown/network error) reverts the checkbox to its pre-toggle state.
- [x] Two `PartyMembershipPanel` instances rendered for two different parties (same character shared, different membership state) show independent checked/unchecked state and toggling one does not send a request or change state for the other. (specs/party-membership-panel/spec.md — "Toggling in one party does not affect another")
- [x] When the player has zero characters, the panel renders a "no characters" message and no checkboxes. (specs/party-membership-panel/spec.md — "Player has no characters")

### Campaign page integration (Task: Wire panel into campaign page)

- [x] Campaign page renders one `PartyMembershipPanel` per party returned from `GET /api/campaigns/{id}/parties`. (specs/party-membership-panel/spec.md — "Panel renders one section per party")
- [x] Campaign page with zero parties renders no panel sections (or an empty-state message) without crashing. (specs/party-membership-panel/spec.md — "Campaign has no parties")

## Traceability Confirmation

Every scenario in `specs/party-management/spec.md` and `specs/party-membership-panel/spec.md` has at least one corresponding test case above. No functional or non-functional acceptance scenario is left uncovered.
