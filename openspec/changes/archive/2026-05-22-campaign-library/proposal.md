## GitHub Issues

- #196

## Why

- Problem statement: Users must manually fill in all campaign details (name, module, chapters) from scratch when starting a new campaign. There is no way to start from a well-known published adventure.
- Why now: The campaign model is new and the party-association feature just landed, making this the right moment to enrich it before user data accumulates.
- Business/user impact: Reduces friction for new users who want to run a popular D&D adventure — they get a structured shell instantly rather than spending time on data entry.

## Problem Space

- Current behavior: Campaign creation requires the user to enter all fields manually. There is no chapter list — only a single `currentChapter` string and a `currentChapterOrder` integer tracking where the party currently is.
- Desired behavior: An admin-managed catalog of campaign templates (global, public) appears below the user's own campaigns on the dashboard. Each template holds a full ordered chapter list with metadata. Users can copy any template into their own campaign list with one click. On copy the new campaign is pre-populated with the template's chapters and the user can rename it before saving.
- Constraints:
  - Admin auth must use the existing `requireAdmin` / `GLOBAL_USER_ID` pattern (same as global monster templates).
  - No real data exists in the current `currentChapter` / `currentChapterOrder` fields so those fields can be cleanly removed and replaced.
  - Data ingestion of the 50-campaign list is a follow-up migration; the infrastructure ships first.
- Assumptions:
  - "Admin" means a user whose record has the existing `isAdmin` flag — no new role concept needed.
  - A campaign template is always globally visible (no per-user private templates in this iteration).
  - Chapter detail fields are limited to what the source list can reasonably provide: title, order, description, levelRange, location.
- Edge cases considered:
  - User renames the copied campaign — that rename must not affect the source template.
  - Admin deletes a template — existing user campaigns copied from it are unaffected (no FK constraint).
  - Template with zero chapters — still valid; user simply gets an empty chapter list to fill in.
  - Duplicate copy — user copies the same template twice; both copies are independent campaigns.

## Scope

### In Scope

- New `CampaignChapter` type: `id`, `title`, `order`, `description?`, `levelRange?`, `location?`
- New `CampaignTemplate` type: `id`, `userId` (GLOBAL_USER_ID), `isGlobal`, `name`, `moduleName`, `description?`, `chapters: CampaignChapter[]`, `createdAt`, `updatedAt`
- Expand `Campaign` type: replace `currentChapter: string` and `currentChapterOrder: number` with `chapters: CampaignChapter[]` and `currentChapterId?: string`; add `templateId?: string`
- Storage layer: `loadGlobalCampaignTemplates`, `saveCampaignTemplate`, `deleteCampaignTemplate`
- API routes mirroring `/api/monsters/global`:
  - `GET /api/campaigns/global` — public
  - `POST /api/campaigns/global` — admin only (create template)
  - `PUT /api/campaigns/global` — admin only (future seed hook)
  - `DELETE /api/campaigns/global/[id]` — admin only
  - `POST /api/campaigns/global/[id]/copy` — authenticated user, creates a Campaign from the template
- Campaign dashboard UI: "Campaign Catalog" section below user campaigns, showing all global templates with a Copy button
- CampaignEditor updated to handle `chapters[]` and `currentChapterId` instead of legacy fields

### Out of Scope

- Initial data ingestion of the 50-campaign list (follow-up migration task)
- User-created private campaign templates
- Chapter editing within a copied campaign (post-copy editing is a future enhancement)
- Pagination or search within the catalog (catalog is small initially)

## What Changes

- `lib/types.ts` — add `CampaignChapter`, `CampaignTemplate`; modify `Campaign`
- `lib/storage.ts` — add three global campaign template storage functions
- `app/api/campaigns/global/route.ts` — GET (public), POST (admin), PUT (admin seed stub)
- `app/api/campaigns/global/[id]/route.ts` — DELETE (admin)
- `app/api/campaigns/global/[id]/copy/route.ts` — POST (authenticated user)
- `app/campaigns/page.tsx` — add Campaign Catalog section below user campaigns
- `app/campaigns/CampaignEditor.tsx` — replace legacy chapter fields with chapters array UI

## Risks

- Risk: Removing `currentChapter` / `currentChapterOrder` breaks any existing query or display code that references those fields.
  - Impact: Runtime errors on campaign display or save if references are missed.
  - Mitigation: Grep entire codebase for both field names before removal; fix all call sites as part of the same PR.

- Risk: Global template GET returns all templates to any unauthenticated caller, exposing admin-entered data publicly.
  - Impact: Low — campaign names and chapter lists are not sensitive; this is the same pattern used for global monsters.
  - Mitigation: Intentional design; document clearly in the route.

## Open Questions

No unresolved ambiguity. All decisions confirmed during explore session:
- Admin pattern: use existing `requireAdmin` / `GLOBAL_USER_ID` ✓
- Model cleanup: `currentChapter` / `currentChapterOrder` can be removed (no real data) ✓
- Chapter fields: title, order, description, levelRange, location ✓
- UI placement: catalog section below user campaigns ✓
- Seed ingestion: follow-up task ✓

## Non-Goals

- Real-time sync with an external campaign database
- User ratings or reviews of catalog entries
- Admin UI for bulk-editing catalog entries (API-only for now)
- Chapter-by-chapter progress tracking beyond `currentChapterId`

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
