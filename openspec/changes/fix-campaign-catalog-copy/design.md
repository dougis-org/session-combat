## Context

- Relevant architecture: Next.js API routes + MongoDB via `lib/storage.ts`. Campaign access is gated by `assertCampaignAccess` which requires an active `campaignMembers` record. The campaign list page (`app/campaigns/page.tsx`) loads templates from `GET /api/campaigns/global` and copies via `POST /api/campaigns/global/[id]/copy`.
- Dependencies: `storage.saveCampaign`, `storage.addMember`, `storage.deleteCampaign` (rollback), `storage.loadGlobalCampaignTemplates`
- Interfaces/contracts touched:
  - `POST /api/campaigns/global/[id]/copy` — response shape unchanged, side-effects expand
  - `GET /api/campaigns/global` — response shape unchanged, order changes
  - `app/campaigns/page.tsx` — new search input, filtered template list render

## Goals / Non-Goals

### Goals

- Every campaign copy from the catalog creates a valid `campaignMembers` record (role: dm, status: active) atomically with the campaign
- Global template list is always returned sorted alphabetically by name
- Catalog UI exposes a search input that filters templates by name (case-insensitive)
- Integration test confirms end-to-end: copy → campaign accessible → member record exists

### Non-Goals

- Server-side search or pagination
- Changing template creation/management
- Migrating existing orphaned campaigns via code

## Decisions

### Decision 1: Member record creation in copy route — match existing POST /api/campaigns pattern exactly

- Chosen: After `storage.saveCampaign(campaign)`, call `storage.addMember(...)` with the same shape as the campaigns POST route. On member insert failure, call `storage.deleteCampaign` to roll back, then rethrow.
- Alternatives considered: (a) Shared helper function for "save campaign + add dm member". (b) DB transaction.
- Rationale: The existing `POST /api/campaigns` route uses inline rollback and it's the established pattern. No shared helper exists and introducing one is out of scope. MongoDB transactions require replica sets; the project doesn't use them elsewhere.
- Trade-offs: Two places with nearly identical rollback logic. Acceptable given scope; a future refactor could extract a helper.

### Decision 2: Sort templates server-side in storage layer

- Chosen: Add `.sort({ name: 1 })` to the MongoDB query in `storage.loadGlobalCampaignTemplates()`.
- Alternatives considered: Sort in the API route after fetching. Sort client-side.
- Rationale: Sorting at the DB level is cheaper and ensures consistent ordering regardless of caller. The storage method is the single source of truth.
- Trade-offs: Minor: DB sort adds a tiny index scan cost (negligible for a small curated collection).

### Decision 3: Client-side search with controlled input in catalog UI

- Chosen: Add a `catalogSearch` state string. Filter `templates` array before render using `name.toLowerCase().includes(search.toLowerCase())`. Place a text input above the grid.
- Alternatives considered: Query param on `GET /api/campaigns/global`. Debounced fetch.
- Rationale: Catalog is small and fully loaded on page mount. Client-side filtering is instant and requires no API change.
- Trade-offs: All templates are loaded even when filtering — acceptable given catalog size.

## Proposal to Design Mapping

- Proposal element: Fix copy route to create member record with rollback
  - Design decision: Decision 1
  - Validation approach: Integration test (copy → GET campaign → assert 200 + member in DB)

- Proposal element: Alphabetize catalog list
  - Design decision: Decision 2
  - Validation approach: Unit test on `loadGlobalCampaignTemplates` asserting sorted order; or verify via existing integration test response

- Proposal element: Add search/filter to catalog UI
  - Design decision: Decision 3
  - Validation approach: Component test — render with templates, type in search input, assert filtered results

## Functional Requirements Mapping

- Requirement: Copy creates accessible campaign
  - Design element: Decision 1 — `addMember` call in copy route
  - Acceptance criteria reference: specs/campaign-catalog-copy/spec.md — Scenario: successful copy
  - Testability notes: Integration test hits real DB; asserts `GET /api/campaigns/[newId]` returns 200

- Requirement: Copy failure leaves no orphan
  - Design element: Decision 1 — rollback via `deleteCampaign` on `addMember` failure
  - Acceptance criteria reference: specs/campaign-catalog-copy/spec.md — Scenario: member insert failure
  - Testability notes: Unit test mocking `addMember` to throw; assert `deleteCampaign` called and 500 returned

- Requirement: Catalog sorted alphabetically
  - Design element: Decision 2 — `.sort({ name: 1 })` in storage
  - Acceptance criteria reference: specs/campaign-catalog/spec.md — Scenario: list is alphabetized
  - Testability notes: Unit test with templates inserted out of order; assert returned array is sorted

- Requirement: Catalog filterable by name
  - Design element: Decision 3 — client-side search state
  - Acceptance criteria reference: specs/campaign-catalog/spec.md — Scenario: search filters results
  - Testability notes: Component test with React Testing Library; type search term, assert only matching templates render

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No orphaned campaigns on partial failure
  - Design element: Decision 1 rollback
  - Acceptance criteria reference: specs/campaign-catalog-copy/spec.md — Scenario: member insert failure
  - Testability notes: Unit test with mocked storage

- Requirement category: performance
  - Requirement: Catalog search is instant
  - Design element: Decision 3 — in-memory filter, no network round-trip
  - Acceptance criteria reference: n/a (non-functional)
  - Testability notes: No explicit test needed; inherent to client-side approach

## Risks / Trade-offs

- Risk/trade-off: Two places with inline rollback logic (campaigns POST + catalog copy)
  - Impact: Low — small duplication, easy to spot
  - Mitigation: Comment noting the pattern; future ticket to extract shared helper if a third caller appears

## Rollback / Mitigation

- Rollback trigger: Copy route returns 500 to client on any unhandled error
- Rollback steps: On `addMember` failure, `deleteCampaign` is called before rethrowing. No partial state should persist.
- Data migration considerations: None — this is additive behavior only
- Verification after rollback: Confirm `campaignMembers` collection has no record for the failed campaign id; confirm `campaigns` collection has no record either

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check before proceeding.
- If security checks fail: Do not merge. Escalate to repo owner.
- If required reviews are blocked/stale: Ping reviewer after 24h; escalate to repo owner after 48h.
- Escalation path and timeout: Repo owner (dougis) is final escalation. No timeout on security failures.

## Open Questions

No open questions. All design decisions are resolved.
