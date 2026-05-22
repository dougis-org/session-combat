## Context

- Relevant architecture: Next.js app router, MongoDB via `lib/storage.ts`, NextAuth session for user identity. Existing global monster template pattern (`GLOBAL_USER_ID`, `requireAdmin`, `isGlobal` flag) is the direct model for this feature.
- Dependencies: `lib/constants.ts` (GLOBAL_USER_ID), `lib/api-helpers.ts` (requireAdmin), `lib/storage.ts` (MongoDB operations), `lib/types.ts` (type definitions), `app/campaigns/page.tsx` (dashboard UI), `app/campaigns/CampaignEditor.tsx` (campaign form).
- Interfaces/contracts touched: `Campaign` type (breaking change — removes two fields, adds two), new `CampaignTemplate` type, new `CampaignChapter` type, five new API route files.

## Goals / Non-Goals

### Goals

- Introduce `CampaignTemplate` and `CampaignChapter` types following the established global monster pattern
- Clean up `Campaign` model by replacing `currentChapter`/`currentChapterOrder` with `chapters[]` and `currentChapterId`
- Expose admin-only write routes and a public read route for global campaign templates
- Allow authenticated users to copy a global template into their own campaign list
- Surface the catalog on the campaign dashboard below user-owned campaigns

### Non-Goals

- Seeding the 50-campaign dataset (follow-up migration)
- User-private templates
- Paginated/search catalog UI
- Chapter editing after copy

## Decisions

### Decision 1: Follow global monster template pattern exactly

- Chosen: `CampaignTemplate` uses `userId: GLOBAL_USER_ID`, `isGlobal: true`, `requireAdmin` on write routes, public GET — identical structure to `MonsterTemplate`.
- Alternatives considered: A separate `isTemplate` flag on the `Campaign` model itself (Option B from explore).
- Rationale: Consistency with the established pattern reduces cognitive overhead. Separate collection avoids mixing admin global data with user data in the same query path.
- Trade-offs: New MongoDB collection (`campaignTemplates`) vs. reusing existing. Accepted — clean separation outweighs slight infra cost.

### Decision 2: Remove currentChapter / currentChapterOrder from Campaign

- Chosen: Hard-remove both fields; replace with `chapters: CampaignChapter[]` (default `[]`) and `currentChapterId?: string`.
- Alternatives considered: Keep legacy fields alongside new ones for backward compatibility.
- Rationale: No real data exists in those fields. Keeping them would permanently complicate the model and all downstream code.
- Trade-offs: Breaking change. Mitigated by grepping and fixing all references in the same PR.

### Decision 3: Copy route lives at /api/campaigns/global/[id]/copy

- Chosen: `POST /api/campaigns/global/[id]/copy` creates a user-owned Campaign from a template. Requires session auth (not admin).
- Alternatives considered: A generic `POST /api/campaigns` that accepts a `templateId` param.
- Rationale: Mirrors `/api/monsters/[id]/duplicate`. Clear intent, easy to permission independently.
- Trade-offs: One extra route file vs. overloading the existing campaigns POST. Accepted for clarity.

### Decision 4: Chapter schema fields

- Chosen: `CampaignChapter { id, title, order, description?, levelRange?, location? }`
- Alternatives considered: Richer fields (key NPCs, encounters, notes).
- Rationale: Matches what the source data (campaign list URL) can realistically supply. Fields are all optional beyond `id`, `title`, `order` so templates can be sparse.
- Trade-offs: May require another schema extension if richer chapter data is desired later. Acceptable — additive changes are non-breaking.

### Decision 5: Seed route is a stub PUT on /api/campaigns/global

- Chosen: `PUT /api/campaigns/global` is admin-only and reserved for future seed ingestion. Returns 501 Not Implemented for now.
- Alternatives considered: No route until the seed script is built.
- Rationale: Establishes the pattern and URL now so the follow-up task just fills in the body.
- Trade-offs: Slightly misleading 501 in the API. Acceptable at this stage.

## Proposal to Design Mapping

- Proposal element: New `CampaignChapter` and `CampaignTemplate` types
  - Design decision: Decision 1 (mirror monster template pattern), Decision 4 (chapter schema)
  - Validation approach: Type-level tests; API integration tests for CRUD on `/api/campaigns/global`

- Proposal element: Remove `currentChapter` / `currentChapterOrder`
  - Design decision: Decision 2
  - Validation approach: TypeScript compilation with strict mode catches missed references; integration test on Campaign CRUD

- Proposal element: Admin write routes
  - Design decision: Decision 1 (requireAdmin), Decision 5 (seed stub)
  - Validation approach: Integration tests assert 403 for non-admin, 201 for admin POST

- Proposal element: Copy action
  - Design decision: Decision 3
  - Validation approach: Integration test: POST copy → new Campaign with correct userId, chapters, templateId

- Proposal element: Campaign Catalog UI section
  - Design decision: Decision 3 (where copy flows), Decision 1 (public GET feeds it)
  - Validation approach: Component renders catalog below user campaigns; Copy button triggers POST and refreshes list

## Functional Requirements Mapping

- Requirement: Admin can create a global campaign template
  - Design element: `POST /api/campaigns/global` with `requireAdmin`
  - Acceptance criteria reference: specs/campaign-template-admin/spec.md
  - Testability notes: Integration test with admin session

- Requirement: Any user can view global templates
  - Design element: `GET /api/campaigns/global` (no auth check)
  - Acceptance criteria reference: specs/campaign-template-admin/spec.md
  - Testability notes: Integration test with no session, unauthenticated request returns templates

- Requirement: Authenticated user can copy a template
  - Design element: `POST /api/campaigns/global/[id]/copy`
  - Acceptance criteria reference: specs/campaign-copy/spec.md
  - Testability notes: Integration test verifies new Campaign doc in DB with user's userId, correct templateId, chapters cloned

- Requirement: Campaign model uses chapters[] and currentChapterId
  - Design element: Decision 2 — updated type, storage, editor
  - Acceptance criteria reference: specs/campaign-model-expansion/spec.md
  - Testability notes: TypeScript strict compilation; CRUD integration tests on campaigns API

- Requirement: Catalog section appears below user campaigns on dashboard
  - Design element: `app/campaigns/page.tsx` updated layout
  - Acceptance criteria reference: specs/campaign-catalog-ui/spec.md
  - Testability notes: Unit test for CampaignsContent renders catalog section; Copy button present

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Only admins can create, update, or delete global templates
  - Design element: `requireAdmin` guard on POST, PUT, DELETE routes
  - Acceptance criteria reference: specs/campaign-template-admin/spec.md
  - Testability notes: Integration tests assert 403 for non-admin users on all write routes

- Requirement category: reliability
  - Requirement: Deleting a global template does not affect user campaigns copied from it
  - Design element: No FK constraint; `templateId` on Campaign is a soft reference only
  - Acceptance criteria reference: specs/campaign-copy/spec.md
  - Testability notes: Test: delete template → user campaign still readable with all chapters intact

- Requirement category: operability
  - Requirement: Seed hook is available for future migration
  - Design element: `PUT /api/campaigns/global` stub returns 501
  - Acceptance criteria reference: specs/campaign-template-admin/spec.md
  - Testability notes: Integration test confirms 501 response with admin auth

## Risks / Trade-offs

- Risk/trade-off: Missed references to removed `currentChapter` / `currentChapterOrder` fields
  - Impact: Runtime TypeErrors on campaign display or save
  - Mitigation: Pre-PR grep for both field names across entire codebase; TypeScript strict mode surfaces most at compile time

- Risk/trade-off: New `campaignTemplates` MongoDB collection adds infra surface
  - Impact: Minimal — same pattern as `monsterTemplates`
  - Mitigation: Follows existing storage abstraction; no direct MongoDB calls outside `lib/storage.ts`

## Rollback / Mitigation

- Rollback trigger: Runtime errors on Campaign save/load after deploy; catalog section breaks existing campaign dashboard
- Rollback steps: Revert the PR; redeploy previous image
- Data migration considerations: No data exists in `currentChapter`/`currentChapterOrder` — no rollback migration needed. Any `CampaignTemplate` documents created before rollback would be orphaned but harmless.
- Verification after rollback: Confirm existing campaign dashboard loads correctly; confirm no TypeScript errors on main

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests or type errors before requesting re-review.
- If security checks fail: Do not merge. Escalate to repo owner if check is a false positive.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to repo owner after 48 hours.
- Escalation path and timeout: Repo owner (`dougis`) has final merge authority. No automated merge without passing CI.

## Open Questions

No open questions. All decisions confirmed during explore session and proposal review.
