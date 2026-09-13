---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `member-visible-campaign-list` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Sub-task 1 — `campaignRepo.loadCampaigns` membership-based query

- [ ] Owner (DM) of a campaign appears in `loadCampaigns(userId)` results with `memberRole: "dm"`, `memberStatus: "active"`.
  — Task: Sub-task 1 · Spec scenario: "DM-owned campaign is labeled with role \"dm\""
- [ ] User with an `active`, `player` `CampaignMember` row for a campaign they do not own appears in `loadCampaigns(userId)` results with `memberRole: "player"`, `memberStatus: "active"`, and full campaign fields (`name`, `moduleName`, `status`, `chapters`, `notes`).
  — Task: Sub-task 1 · Spec scenario: "Campaign a user actively participates in as a player is labeled with role \"player\""
- [ ] User with an `invited`, `player` `CampaignMember` row appears in results with `memberRole: "player"`, `memberStatus: "invited"`.
  — Task: Sub-task 1 · Spec scenario: "Campaign a user has been invited to but not yet accepted is labeled with status \"invited\""
- [ ] User with a `declined` `CampaignMember` row for a campaign does not have that campaign in results.
  — Task: Sub-task 1 · Spec scenario: "Declined or removed memberships are excluded from the list"
- [ ] User with a `removed` `CampaignMember` row for a campaign does not have that campaign in results.
  — Task: Sub-task 1 · Spec scenario: "Declined or removed memberships are excluded from the list"
- [ ] User with zero `CampaignMember` rows for a given campaign never sees that campaign in results, even when another user owns it.
  — Task: Sub-task 1 · Spec scenario: "A user with no membership in a campaign never sees it"
- [ ] `loadCampaigns(userId)` for a user with no memberships at all returns an empty array.
  — Task: Sub-task 1 · Spec scenario: "Listing campaigns when none exist" (existing scenario, unaffected by this change)
- [ ] `listCampaignsForMember` and `CampaignMemberSummary` are removed from the codebase with no remaining references (`lib/storage/campaignRepo.ts`, `lib/storage.ts`, `lib/types.ts`).
  — Task: Sub-task 1 · Traceability: design.md Decision 1 (deletion, no other consumer found)

### Sub-task 2 — `GET /api/campaigns` route

- [ ] `GET /api/campaigns` returns a flat array (not a wrapper object) where each entry is a full `Campaign` plus `memberRole` and `memberStatus`.
  — Task: Sub-task 2 · Spec scenario: "Listing campaigns returns owned and member campaigns, not unrelated ones"
- [ ] `GET /api/campaigns` for user B, where user A owns campaign X and user B holds an active player membership on campaign Y (owned by user C), returns campaign Y annotated `memberRole: "player"` and does not return campaign X.
  — Task: Sub-task 2 · Spec scenario: "Listing campaigns returns owned and member campaigns, not unrelated ones"
- [ ] `GET /api/campaigns` excludes campaigns behind `declined`/`removed` memberships at the route level (integration test, not just repo unit test).
  — Task: Sub-task 2 · Spec scenario: "Declined or removed memberships are excluded from the list"
- [ ] `GET /api/campaigns/[id]` for a campaign the caller has no membership in still returns 404 (existing behavior, `assertCampaignAccess` unchanged — regression check).
  — Task: Sub-task 2 · Spec scenario: "Getting a campaign that belongs to another user" (existing, unmodified scenario)

### Sub-task 3 — Shared card header extraction

- [ ] `CampaignCardHeader` (or equivalent shared component) renders title, status badge, module name, and chapter info identically to the current inline markup, given the same `Campaign` props.
  — Task: Sub-task 3 · Traceability: design.md Decision 3
- [ ] The existing full DM card (`app/campaigns/page.tsx`) renders unchanged — all six action links (Members, Prompt Builder, Library, Session Log, Encounters, Start Combat), notes snippet, and party roster sections still present and functional after extraction.
  — Task: Sub-task 3 · Traceability: design.md Goals ("DM-owned campaigns keep today's full-featured card unchanged")

### Sub-task 4 — `PlayerCampaignCard` component

- [ ] Given `memberRole: "player"`, `memberStatus: "active"`, the card renders a "Player" badge and a link to Session Log only — no Edit/Delete/Members links.
  — Task: Sub-task 4 · Spec scenario: "Campaign a user actively participates in as a player is labeled with role \"player\""
- [ ] Given `memberStatus: "invited"`, the card renders an "Invited" badge, Accept and Decline buttons, and no `href` link to `/campaigns/[id]` or any of its sub-pages.
  — Task: Sub-task 4 · Spec scenario: "Invited entries do not link to the campaign detail page"

### Sub-task 5 — Accept/decline wiring

- [ ] Clicking Accept on an invited card calls `PATCH /api/campaigns/[id]/members/me` with `{ action: "accept" }`, and on success triggers a list refresh (`loadAll()` or equivalent) after which the campaign shows `memberStatus: "active"`.
  — Task: Sub-task 5 · Spec scenario: "Accepting an invitation from the campaign list"
- [ ] Clicking Decline on an invited card calls `PATCH /api/campaigns/[id]/members/me` with `{ action: "decline" }`, and on success triggers a list refresh after which the campaign no longer appears.
  — Task: Sub-task 5 · Spec scenario: "Declining an invitation from the campaign list"

### Sub-task 6 — Page-level grouping

- [ ] `CampaignsContent`, given a mocked `GET /api/campaigns` response containing one DM row, one active-player row, and one invited row, renders three distinct groupings/labels (DM, Player, Invited), each with the correct card variant.
  — Task: Sub-task 6 · Spec scenarios: "DM-owned campaign is labeled with role \"dm\"", "Campaign a user actively participates in as a player is labeled with role \"player\"", "Campaign a user has been invited to but not yet accepted is labeled with status \"invited\""
- [ ] `CampaignsContent`, given a mocked response where declined/removed campaigns are absent (per the API contract), renders no trace of them — no separate client-side filtering needed since the route already excludes them.
  — Task: Sub-task 6 · Spec scenario: "Declined or removed memberships are excluded from the list"
- [ ] The DM grouping remains visually first/primary in the rendered page (ordering regression check per design.md risk mitigation).
  — Task: Sub-task 6 · Traceability: design.md Risks / Trade-offs ("Keep DM section visually primary/first")

### Sub-task 7 — Unaffected consumers

- [ ] Existing `app/parties/page.tsx` tests (or a new minimal test if none exist) pass unmodified against the new additive `GET /api/campaigns` response shape — the id→name map it builds from `campaigns` is unaffected by the added `memberRole`/`memberStatus` fields.
  — Task: Sub-task 7 · Traceability: design.md Non-Functional Requirements Mapping (reliability — existing consumers do not regress)
- [ ] No test asserts on or attempts to fix `lib/components/ActiveCampaignBanner.tsx`'s pre-existing `data.campaigns` bug — confirmed explicitly out of scope, tracked only as a design.md observation.
  — Task: Sub-task 7 · Traceability: proposal.md Non-Goals

## Full Validation Pass

- [ ] `npm run test:unit` passes with zero failures after all sub-tasks are implemented.
- [ ] `npm run build` succeeds with no errors.
- [ ] Manual/E2E smoke (if the project's E2E suite covers `/campaigns`): a seeded active-player membership and a seeded invited membership both render correctly and the invited accept action transitions the row to the player grouping without a full page reload.
