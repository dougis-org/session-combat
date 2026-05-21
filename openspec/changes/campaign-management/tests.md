---
name: tests
description: Tests for campaign-management
---

# Tests

## Overview

Tests for the `campaign-management` change. All work follows a strict TDD process: write a failing test, make it pass with the simplest code, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before any implementation code, write the test and confirm it fails.
2. **Write code to pass the test** — simplest implementation that makes it green.
3. **Refactor** — improve structure while keeping the test passing.

## Test Cases

### Task 2: Storage layer (`lib/storage.ts`)

Maps to: `specs/campaign-crud/spec.md`

- [ ] `loadCampaigns` returns all campaigns for the given userId
- [ ] `loadCampaigns` returns an empty array when no campaigns exist for the user
- [ ] `loadCampaigns` does not return campaigns belonging to other users
- [ ] `saveCampaign` persists a new campaign retrievable by `loadCampaignById`
- [ ] `saveCampaign` updates an existing campaign when called with the same `id`
- [ ] `loadCampaignById` returns the campaign when id and userId match
- [ ] `loadCampaignById` returns null when id exists but userId does not match
- [ ] `loadCampaignById` returns null when id does not exist
- [ ] `deleteCampaign` removes the campaign so subsequent `loadCampaignById` returns null
- [ ] `deleteCampaign` is a no-op (no error) when the campaign does not exist

### Task 3: API — `GET /api/campaigns`

Maps to: `specs/campaign-crud/spec.md` — Scenario: Listing campaigns returns only the user's own

- [ ] Returns 200 with an array of the authenticated user's campaigns
- [ ] Returns 200 with an empty array when the user has no campaigns
- [ ] Does not include campaigns belonging to other users
- [ ] Returns 401 for an unauthenticated request

### Task 3: API — `POST /api/campaigns`

Maps to: `specs/campaign-crud/spec.md` — Scenarios: creating a campaign

- [ ] Returns 201 with the created campaign object when all fields are provided
- [ ] Returns 201 with correct defaults (`moduleName: ""`, `currentChapter: ""`, `currentChapterOrder: 0`, `active: false`) when only `name` is provided
- [ ] Returns 400 when `name` is missing
- [ ] Returns 400 when `name` is blank/whitespace
- [ ] Returns 401 for an unauthenticated request

### Task 3: API — `GET /api/campaigns/[id]`

Maps to: `specs/campaign-crud/spec.md` — Scenarios: getting a single campaign

- [ ] Returns 200 with the campaign when it belongs to the authenticated user
- [ ] Returns 404 when the campaign does not exist
- [ ] Returns 404 when the campaign exists but belongs to a different user
- [ ] Returns 401 for an unauthenticated request

### Task 3: API — `PATCH /api/campaigns/[id]`

Maps to: `specs/campaign-crud/spec.md` — Scenarios: patching a campaign

- [ ] Returns 200 with the updated campaign when a single field is patched
- [ ] Does not change fields that are not included in the PATCH body
- [ ] Updates `updatedAt` on every PATCH
- [ ] Two campaigns can both have `active: true` simultaneously (no uniqueness error)
- [ ] Returns 404 when the campaign does not exist or belongs to another user
- [ ] Returns 401 for an unauthenticated request

### Task 3: API — `DELETE /api/campaigns/[id]`

Maps to: `specs/campaign-crud/spec.md` — Scenario: deleting a campaign

- [ ] Returns 200/204 on successful delete
- [ ] Subsequent `GET /api/campaigns/[id]` returns 404
- [ ] Returns 404 when the campaign does not exist or belongs to another user
- [ ] Returns 401 for an unauthenticated request

### Task 6: Party + Campaign association (integration)

Maps to: `specs/campaign-party-association/spec.md`

- [ ] Creating a party with a valid `campaignId` persists and returns the `campaignId`
- [ ] Creating a party without a `campaignId` succeeds; `campaignId` is absent/undefined
- [ ] Existing parties (no `campaignId` field) load without error after the migration
- [ ] Deleting a campaign does not delete associated parties; the party still loads after the campaign is gone

### Task 4: Campaign Dashboard (E2E / smoke)

Maps to: `specs/campaign-dashboard/spec.md`

- [ ] Navigating to `/` lands on the Campaign Dashboard (not the previous default page)
- [ ] "Campaigns" is the first nav link rendered
- [ ] Empty state with "New Campaign" CTA is shown when the user has no campaigns
- [ ] Creating a campaign from the dashboard form adds it to the list without full page reload
- [ ] Deleting a campaign from the dashboard removes it from the list

### Task 5: Parties UI — campaign selector (E2E / smoke)

Maps to: `specs/campaign-party-association/spec.md` — Scenarios: Parties UI shows campaign selector

- [ ] Campaign selector in party form lists all user campaigns plus a "None" option
- [ ] Party created with a selected campaign shows the campaign name in the parties list
- [ ] Party whose `campaignId` references a deleted campaign shows "No Campaign" without error
