## GitHub Issues

- dougis-org/session-combat#187

## Why

- **Problem statement**: DMs running a campaign are locked to read-only chapter configurations after copying a template, and DMs creating a custom campaign have no way of adding chapters. Furthermore, there is no way to select or modify which chapter is currently active, and the active chapter is not displayed on the landing page.
- **Why now**: The campaign model, campaign templates, and party associations are now in place. Dynamic chapter editing and active chapter tracking are the final missing links to complete the campaign management workflow.
- **Business/user impact**: Dungeon Masters gain the freedom to run customized campaigns, adapt published modules to their own pacing, and visual-track session progress directly from their primary dashboard.

## Problem Space

- **Current behavior**: Campaign chapters are read-only and static after a campaign is created from a template. There is no chapter editor inside the campaign form, and `currentChapterId` is unmodifiable. The campaigns landing page displays a count of chapters but not the current active chapter.
- **Desired behavior**: DMs can add, edit, remove, and reorder chapters inline when creating or editing any campaign. A clean dropdown select picker is provided in the editor to set the active chapter from the list of chapters. The landing page card displays the active chapter's title.
- **Constraints**: 
  - Leverage the existing database-backed Campaign Catalog/Templates for pre-populating chapters—do NOT introduce a client-side redundant `chapterPresets.ts` file.
  - Maintain robust schema validation in API endpoints.
  - Graceful backward compatibility for campaigns with empty chapter lists (one-shots/homebrews with no chapters).
- **Assumptions**: 
  - There is no prompt builder in the codebase yet (deferred in prior PRs), so UI and API changes will focus on dashboard visibility and data model compliance.
- **Edge cases considered**:
  - User deletes a chapter that is currently marked as the active chapter: The editor and API validation will automatically reset `currentChapterId` to undefined.
  - Campaigns with zero chapters: The active chapter selector will render an informative placeholder explaining that chapters must be added first.

## Scope

### In Scope

- Collapsible **Chapter List Editor** section inside `CampaignEditor.tsx` with title inputs, delete row button, and Up/Down reordering buttons.
- **Current Chapter Selector** dropdown in `CampaignEditor.tsx` when chapters exist.
- API validation and persistence of `chapters` and `currentChapterId` fields in POST `/api/campaigns` and PATCH `/api/campaigns/[id]`.
- Landing page (`app/campaigns/page.tsx`) card updates to resolve and display the active chapter title.
- Unit and integration tests covering the new UI interactions, picker fallbacks, and API persistence.

### Out of Scope

- A client-side static presets file (`lib/prompts/chapterPresets.ts`) is explicitly excluded as the database-backed catalog already serves this purpose.
- Prompt builder injection (deferred as the prompt builder does not yet exist).
- Post-delete cascade actions on other entities (e.g. scoping encounters to chapters is a future enhancement).

## What Changes

- `app/api/campaigns/route.ts` — POST route updated to extract, sanitize, and validate chapters and currentChapterId.
- `app/api/campaigns/[id]/route.ts` — PATCH route updated to extract, sanitize, and validate chapters and currentChapterId.
- `app/campaigns/CampaignEditor.tsx` — Updated to include the active chapter selector and collapsible interactive chapter list editor.
- `app/campaigns/page.tsx` — Cards updated to display the current active chapter title.
- `tests/unit/components/CampaignEditor.test.tsx` — Unit tests for chapter add, delete, reorder, and active picker logic.
- `tests/integration/campaigns.integration.test.ts` — Integration tests for REST API endpoints.

## Risks

- **Risk**: Deleting the chapter that is currently selected as active.
  - **Impact**: `currentChapterId` refers to a non-existent chapter ID, causing display bugs.
  - **Mitigation**: Form save logic and API validation will verify `currentChapterId` belongs to the list of chapters; if not found, it is set to `undefined`.

- **Risk**: Ordering index drift during manual reordering.
  - **Impact**: Chapters rendered out of logical order.
  - **Mitigation**: State updates will explicitly re-map the `order` field (0-indexed) for all elements in the array on any swap or removal.

## Open Questions

- **Question**: Are there any remaining ambiguities or unresolved requirements?
  - **Needed from**: Developer / Requester
  - **Blocker for apply**: No. All details (including omitting client-side presets) have been explicitly resolved and approved.

## Non-Goals

- User-created private templates.
- Deep chapter progress tracking (e.g. checkbox completion per chapter).
- Prompt builder integration (deferred).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
