## Context

- **Relevant architecture:** session-combat is a Next.js 14 app using the App Router. Data persistence uses the raw `mongodb` Node.js driver (no Mongoose). All server-side data access goes through `lib/storage.ts`. Auth is JWT-based via `requireAuth` from `lib/middleware`. Types are plain TypeScript interfaces in `lib/types.ts`. The existing Party and Encounter patterns are the reference for all new work.
- **Dependencies:** `mongodb`, Next.js App Router, `lib/middleware` (auth), `lib/storage.ts`, `lib/types.ts`, `lib/db.ts` (getDatabase)
- **Interfaces/contracts touched:** `lib/types.ts` (Campaign + Party), `lib/storage.ts` (new functions), `app/api/campaigns/`, `app/campaigns/page.tsx`, `app/layout.tsx`, `app/parties/page.tsx`

## Goals / Non-Goals

### Goals

- Add a `Campaign` data model following the existing Party/Encounter pattern
- Add full CRUD API for campaigns
- Build a Campaign Dashboard as the new app landing page
- Associate parties with campaigns (optional `campaignId` on Party)
- Make "Campaigns" the first nav item

### Non-Goals

- Scoping encounters or characters to a campaign
- Campaign limits, paid-tier gating, or sharing between users
- Chapter management as a sub-entity

## Decisions

### Decision 1: Data model — plain TypeScript interface, not Mongoose

- **Chosen:** Add a `Campaign` interface to `lib/types.ts` following the `Party` shape. Storage functions in `lib/storage.ts` use `getDatabase()` directly.
- **Alternatives considered:** Mongoose ODM (used by the dm-dashboard reference project)
- **Rationale:** The codebase has no Mongoose dependency and uses the raw mongodb driver throughout. Introducing Mongoose would be a significant architectural divergence with no benefit.
- **Trade-offs:** No schema-level validation from Mongoose; validation happens at the API route layer (same as existing routes).

```ts
export interface Campaign {
  _id?: string;
  id: string;
  userId: string;
  name: string;
  moduleName: string;
  currentChapter: string;
  currentChapterOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Decision 2: No uniqueness enforcement on `active`

- **Chosen:** `active` is a personal preference flag stored as a plain boolean. No deactivation side-effect, no unique index.
- **Alternatives considered:** Enforce one-active-per-user via application logic (deactivate others on save) or a MongoDB partial unique index.
- **Rationale:** DMs commonly run multiple campaigns simultaneously. Enforcing uniqueness would be a UX blocker. Gating is a future paid-tier concern.
- **Trade-offs:** UI must handle displaying multiple active campaigns gracefully (not assume exactly one).

### Decision 3: `currentChapter` as string + order

- **Chosen:** `currentChapter: string` for the display label (e.g., `"Chapter 4: The Sunken Temple"`), `currentChapterOrder: number` as a sortable integer (default 0).
- **Alternatives considered:** `currentChapter: number` (too rigid), a chapters sub-array (over-engineered for this scope).
- **Rationale:** Adventure modules use varied naming conventions. A free-form string accommodates all of them. The order field enables list sorting without parsing the label.
- **Trade-offs:** No validation of chapter label format; DMs enter whatever is meaningful to them.

### Decision 4: Campaign Dashboard as app landing page

- **Chosen:** `app/campaigns/page.tsx` becomes the default route. "Campaigns" is the first item in the nav in `app/layout.tsx`.
- **Alternatives considered:** Keep existing landing page, add Campaigns as a secondary nav item.
- **Rationale:** Campaigns are the primary organizing concept for DM session management. Making it the entry point reflects that priority.
- **Trade-offs:** Any existing bookmarks to the old default route may redirect or land somewhere unexpected (low impact — no documented deep links).

### Decision 5: Party → Campaign association

- **Chosen:** Add `campaignId?: string` to the `Party` interface. The parties UI gets a campaign selector in the create/edit form. Deletion of a campaign leaves dangling `campaignId` references on parties — handled gracefully in the UI (display "No Campaign").
- **Alternatives considered:** Cascade delete parties when a campaign is deleted (too destructive); enforce referential integrity at the API layer (adds complexity with no clear benefit).
- **Rationale:** Soft reference is consistent with the app's existing patterns (e.g., `characterIds` on Party). Keeps the data model simple.
- **Trade-offs:** Stale `campaignId` values after campaign deletion; UI must handle missing campaign gracefully.

### Decision 6: API route pattern

- **Chosen:** Follow `app/api/parties/route.ts` exactly — `requireAuth`, extract `userId`, call `storage.*`, return `NextResponse.json(...)`. Use `crypto.randomUUID()` for new campaign IDs.
- **Alternatives considered:** None — the existing pattern is established and consistent.
- **Trade-offs:** None.

## Proposal to Design Mapping

- Proposal element: Campaign data model
  - Design decision: Decision 1 (TypeScript interface in `lib/types.ts`)
  - Validation approach: Unit tests for storage functions; API integration tests

- Proposal element: No uniqueness enforcement on `active`
  - Design decision: Decision 2
  - Validation approach: Integration test — create two campaigns both with `active: true`, verify both persist

- Proposal element: `currentChapter` as string + order
  - Design decision: Decision 3
  - Validation approach: API test — POST campaign with string chapter and numeric order; verify both stored and returned

- Proposal element: Campaign Dashboard as landing page + first nav
  - Design decision: Decision 4
  - Validation approach: E2E smoke test — app root navigates to Campaign Dashboard; "Campaigns" is first nav link

- Proposal element: Party → Campaign association
  - Design decision: Decision 5
  - Validation approach: Integration test — create party with `campaignId`; verify it persists and is returned

## Functional Requirements Mapping

- **Requirement:** DM can create a campaign with name, moduleName, currentChapter (string), currentChapterOrder (number), active (boolean)
  - Design element: `POST /api/campaigns` → `storage.saveCampaign`
  - Acceptance criteria reference: `specs/campaign-crud/spec.md`
  - Testability notes: Integration test with valid and missing-name payloads

- **Requirement:** DM can list all their campaigns
  - Design element: `GET /api/campaigns` → `storage.loadCampaigns(userId)`
  - Acceptance criteria reference: `specs/campaign-crud/spec.md`
  - Testability notes: Integration test — create 2 campaigns, GET returns both

- **Requirement:** DM can update a campaign (all fields patchable)
  - Design element: `PATCH /api/campaigns/[id]`
  - Acceptance criteria reference: `specs/campaign-crud/spec.md`
  - Testability notes: Integration test — PATCH a single field, verify others unchanged

- **Requirement:** DM can delete a campaign
  - Design element: `DELETE /api/campaigns/[id]`
  - Acceptance criteria reference: `specs/campaign-crud/spec.md`
  - Testability notes: Integration test — DELETE then GET returns 404

- **Requirement:** Campaign Dashboard shows all campaigns; supports create/edit/delete inline
  - Design element: `app/campaigns/page.tsx`
  - Acceptance criteria reference: `specs/campaign-dashboard/spec.md`
  - Testability notes: E2E smoke test

- **Requirement:** Party can be associated with a campaign
  - Design element: `campaignId?` on `Party`; campaign selector in parties UI
  - Acceptance criteria reference: `specs/campaign-party-association/spec.md`
  - Testability notes: Integration test — POST party with campaignId; verify stored

## Non-Functional Requirements Mapping

- **Requirement category:** Security
  - Requirement: All campaign API routes require authentication; campaigns are scoped to `userId`
  - Design element: `requireAuth` on every route handler; all queries filter by `userId`
  - Acceptance criteria reference: `specs/campaign-crud/spec.md`
  - Testability notes: Integration test — unauthenticated request returns 401; authenticated user cannot access another user's campaign

- **Requirement category:** Reliability
  - Requirement: Deleting a campaign does not corrupt party data
  - Design element: Soft reference (`campaignId?` is optional); UI handles missing campaign
  - Acceptance criteria reference: `specs/campaign-party-association/spec.md`
  - Testability notes: Integration test — delete campaign, verify party still loads with null/missing campaignId handled

## Risks / Trade-offs

- **Risk/trade-off:** Dangling `campaignId` on parties after campaign deletion
  - **Impact:** Low — no data loss, UI must handle gracefully
  - **Mitigation:** UI shows "No Campaign" for unresolved campaignIds; no cascade delete

- **Risk/trade-off:** `currentChapterOrder` field unused or ignored by DMs
  - **Impact:** Minimal — cosmetic sort order only
  - **Mitigation:** Default to 0; field is optional in the form

## Rollback / Mitigation

- **Rollback trigger:** Critical bug in Campaign Dashboard affecting existing app functionality (encounters, parties, characters)
- **Rollback steps:**
  1. Revert the `app/layout.tsx` nav change and default route change
  2. The `campaigns` MongoDB collection can be left in place (additive change, no existing collections modified)
  3. The `campaignId` field on parties is optional — existing data unaffected
- **Data migration considerations:** None — all changes are additive. No existing documents are modified.
- **Verification after rollback:** Confirm encounters and parties pages load normally; confirm nav does not show Campaigns link

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix the failing check before proceeding. No bypasses.
- **If security checks fail:** Treat as a blocker. Review the auth scoping in the failing route.
- **If required reviews are blocked/stale:** Re-request review after 24h. Escalate to repo owner if still blocked after 48h.
- **Escalation path and timeout:** If blocked for more than 48h, flag in the GitHub issue thread.

## Open Questions

No open questions. All decisions confirmed during proposal exploration.
