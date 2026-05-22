## Context

- **Relevant architecture**: Client-side campaign management dashboard (`app/campaigns/page.tsx`), CampaignEditor form (`app/campaigns/CampaignEditor.tsx`), and REST API routes under `app/api/campaigns/`.
- **Dependencies**: MongoDB collection `campaigns` for storage. Jest and Testing Library for unit/integration tests.
- **Interfaces/contracts touched**: `Campaign` interface in `lib/types.ts`. GET, POST, and PATCH API routes in `app/api/campaigns`.

## Goals / Non-Goals

### Goals

- Allow DMs to create and edit custom chapter lists inline within the campaign form.
- Provide interactive controls: Add chapter, Delete chapter, Move Up (▲), and Move Down (▼).
- Offer a robust selector for setting the campaign's `currentChapterId`.
- Resolve and display the current active chapter title on the landing page cards.
- Sanitize and persist chapter lists and the selected active chapter ID in the database.

### Non-Goals

- Creating a client-side static presets file (explicitly rejected in favor of the existing database catalog copying flow).
- Integrating with a prompt builder (deferred, as none exists).
- Deep chapter progress tracking features.

## Decisions

### Decision 1: CampaignEditor.tsx state & UI for Chapters

- **Chosen**: Maintain local `chapters` state (`CampaignChapter[]`) and `currentChapterId` state inside the editor. Render a collapsible "Chapter List" accordion using a boolean `chaptersExpanded` state.
  - Add Chapter: Appends a new chapter with a generated UUID (`crypto.randomUUID()`) and sets its `order` to `chapters.length`.
  - Delete Chapter: Filters the array and dynamically re-maps `order` values to ensure contiguous 0-indexed sequences. If the deleted chapter was the active chapter, resets `currentChapterId` to `undefined`.
  - Reorder Chapters: Swaps the selected element with its neighbor (order index `- 1` or `+ 1`), then updates all order values.
- **Alternatives considered**: Prop-drilling state to `CampaignsContent` (rejected to maintain strong encapsulation inside the editor).
- **Rationale**: Keeps form validation and state isolated in the editor until the final Save action.
- **Trade-offs**: Local changes are lost on Cancel, which is standard and expected behavior for modal editors.

### Decision 2: API Route Validation & Sanitization

- **Chosen**: Add strict chapter and `currentChapterId` extraction and validation in `app/api/campaigns/route.ts` (POST) and `app/api/campaigns/[id]/route.ts` (PATCH). If `chapters` is provided, filter out invalid elements, map fields to expected types, and verify `currentChapterId` exists within the final chapter set (setting it to `undefined` if absent).
- **Alternatives considered**: Implicit saving (rejected due to TypeScript type guarantees and risk of malformed database payloads).
- **Rationale**: Server-side normalization protects data integrity and guarantees client UI consistency.
- **Trade-offs**: Slight increase in API route code size.

### Decision 3: Client-side Active Chapter Resolution on Dashboard

- **Chosen**: In `app/campaigns/page.tsx`'s render function, dynamically find the active chapter on the client:
  ```typescript
  const currentCh = campaign.chapters?.find(ch => ch.id === campaign.currentChapterId);
  ```
  If found, render `Current Chapter: Ch. {currentCh.order + 1}: {currentCh.title}` on the card.
- **Alternatives considered**: Denormalizing the title on the `Campaign` model (rejected to avoid sync errors when chapters are renamed).
- **Rationale**: Normalization guarantees that renaming a chapter in the editor instantly propagates to the card list.
- **Trade-offs**: Extremely minor array lookup runtime overhead during render.

## Proposal to Design Mapping

- **Proposal element**: Collapsible Chapter List Editor section
  - **Design decision**: Decision 1 (Chapters state/collapsible Accordion)
  - **Validation approach**: Unit test verifying toggle rendering, chapter addition, deletion, and order swaps.
- **Proposal element**: Current Chapter Selector dropdown
  - **Design decision**: Decision 1 (Active Picker state/select element)
  - **Validation approach**: Unit test verifying select element is rendered and changes `currentChapterId`.
- **Proposal element**: API validation and persistence
  - **Design decision**: Decision 2 (Strict API Sanitization)
  - **Validation approach**: Integration tests sending malformed payloads and validating expected responses/persistence.
- **Proposal element**: Display active chapter on landing page
  - **Design decision**: Decision 3 (Client-side Resolution)
  - **Validation approach**: UI test asserting active chapter text appears on the card when active chapter is set.

## Functional Requirements Mapping

- **Requirement**: Define a custom chapter list (add, edit, remove, reorder)
  - **Design element**: Collapsible list with text inputs, remove click, and order swaps in `CampaignEditor.tsx`.
  - **Acceptance criteria reference**: `specs/campaign-model-expansion/spec.md`
  - **Testability notes**: Verify DOM updates and State changes inside Jest unit tests.
- **Requirement**: Current chapter picker shows own chapter titles
  - **Design element**: Dropdown `<select>` mapping list of chapters.
  - **Acceptance criteria reference**: `specs/campaign-model-expansion/spec.md`
  - **Testability notes**: Verify selected option matches `currentChapterId` inside Jest unit tests.
- **Requirement**: Active campaign dashboard displays chapter title
  - **Design element**: Client-side lookup and card render in `app/campaigns/page.tsx`.
  - **Acceptance criteria reference**: `specs/campaign-dashboard/spec.md`
  - **Testability notes**: Verify element with test text in unit tests.

## Non-Functional Requirements Mapping

- **Requirement category**: Reliability
  - **Requirement**: Backward compatibility with empty chapter lists and legacy documents.
  - **Design element**: Normalize empty arrays and fallback picker interfaces.
  - **Acceptance criteria reference**: `specs/campaign-model-expansion/spec.md`
  - **Testability notes**: Verify that campaign save/load with empty chapters runs successfully.

## Risks / Trade-offs

- **Risk/trade-off**: Chapter ID deletion causes dangling active chapter reference.
  - **Impact**: Picker and dashboard crash or fail to find.
  - **Mitigation**: Standard active chapter resolution uses conditional finding, and save logic actively resets `currentChapterId` if it is not present in the chapter list.

## Rollback / Mitigation

- **Rollback trigger**: Save failures or crashes on campaigns dashboard load.
- **Rollback steps**: Revert commit using `git revert` and redeploy.
- **Data migration considerations**: No schema migration required; the database uses MongoDB and handles legacy/empty schemas natively via our validation/normalization layers.
- **Verification after rollback**: Verify existing Campaigns Page mounts and loads successfully.

## Operational Blocking Policy

- **If CI checks fail**: Do not merge. Must resolve all linting or test suite errors.
- **If security checks fail**: Stop work, investigate dependencies, and patch immediately.
- **If required reviews are blocked/stale**: Proactively request reviews from maintainers before proceeding.
- **Escalation path and timeout**: Escalate to lead maintainer within 24 hours if blocked.

## Open Questions

- None. All requirements have been successfully aligned and approved.
