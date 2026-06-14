## GitHub Issues

- dougis-org/session-combat#419

## Why

- Problem statement: Copying a campaign from the global catalog silently creates a broken campaign — it appears in the user's campaign list but cannot be opened. Additionally, the catalog has no sort order or search, making it hard to find templates.
- Why now: The copy bug affects every user who tries to use the campaign catalog. Each copy attempt results in a permanently inaccessible campaign. Two legacy campaigns in production are also broken for the same underlying reason.
- Business/user impact: Users cannot use the campaign template library at all. Any campaign copied from the catalog is dead on arrival.

## Problem Space

- Current behavior: `POST /api/campaigns/global/[id]/copy` saves a new campaign document but never inserts a `campaignMembers` record. `assertCampaignAccess` (used by all campaign detail routes) requires an active member record — so the copied campaign immediately returns 404 on access. The catalog list is also returned in arbitrary DB insertion order with no search capability.
- Desired behavior: Copying a template creates a fully accessible campaign with the requesting user as DM. The catalog is alphabetized and filterable by name.
- Constraints: Member record creation must be atomic with campaign creation — if member insert fails, the campaign must be rolled back (matching the pattern in `POST /api/campaigns`).
- Assumptions: The catalog is small enough that client-side filtering is sufficient (no need for server-side search pagination).
- Edge cases considered: Template not found (already handled with 404). Member insert failure (needs rollback). Empty search string (show all). Case-insensitive search.

## Scope

### In Scope

- Fix `POST /api/campaigns/global/[id]/copy` to create a `campaignMembers` record with `role: 'dm'`, `status: 'active'`, including rollback on failure
- Sort the global campaign template list alphabetically by name (server-side, `GET /api/campaigns/global`)
- Add client-side search/filter to the campaign catalog UI
- Integration test: copying a campaign from the catalog results in a persisted, accessible campaign with a valid member record

### Out of Scope

- Fixing the two legacy orphaned campaigns in production (handled via direct DB repair, not code)
- Pagination of the catalog
- Server-side search
- Any changes to how templates are created or managed

## What Changes

- `app/api/campaigns/global/[id]/copy/route.ts` — add `storage.addMember(...)` after `saveCampaign`, with rollback on failure
- `app/api/campaigns/global/route.ts` — sort campaign templates by `name` ascending before returning
- Campaign catalog UI (wherever the copy button lives) — add a search input that filters the displayed list client-side
- `tests/integration/` — new test: POST to copy endpoint → assert campaign accessible via GET `/api/campaigns/[id]` and member record exists in DB

## Risks

- Risk: Rollback on member insert failure leaves the system in a clean state, but if `deleteCampaign` also fails, the campaign document is orphaned (same risk exists in the campaigns POST route).
  - Impact: Low — this is an existing accepted risk pattern in the codebase.
  - Mitigation: Log the rollback failure clearly; consistent with existing approach.

- Risk: Client-side search breaks if the catalog grows very large.
  - Impact: Low for now — catalog is small and curated.
  - Mitigation: Noted as a future server-side search migration point if needed.

## Open Questions

No unresolved ambiguity. The root cause is confirmed, the fix pattern is established (matching the existing `POST /api/campaigns` route), and the catalog UI location has been identified.

## Non-Goals

- Migrating the two production orphaned campaigns via code (DB repair is sufficient)
- Server-side search or pagination
- Changing catalog template management (add/edit/delete templates)
- Any changes to the member invitation or multi-user campaign flows

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
