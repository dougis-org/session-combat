## Context

- **Relevant architecture:** MongoDB persistence via `lib/storage.ts` (native driver, no Mongoose). Auth middleware in `lib/middleware.ts`. Next.js App Router API routes under `app/api/`. All campaign-child pages under `app/campaigns/[id]/`.
- **Dependencies:** Campaign Management (complete), Prompt Builder (complete — `lib/prompts/templates.ts`, `app/campaigns/[id]/prompts/page.tsx` with disabled Save stub, `lib/hooks/useCampaignContext.ts`).
- **Interfaces/contracts touched:** `lib/types.ts` (new type), `lib/storage.ts` (new ops), new API routes, two modified pages.

## Goals / Non-Goals

### Goals

- Persist generated prompts with all three fields (systemPrompt, userMessage, fullText) per campaign.
- Provide a campaign-scoped library UI with type filtering and expandable cards.
- Let DMs paste AI responses and add notes to saved items.
- Wire the existing disabled Save to Library button in the prompt builder.

### Non-Goals

- Cross-campaign library view.
- Direct Claude API calls or automatic AI response capture.
- Full-text search, tagging beyond type, export, or sharing.

## Decisions

### Decision 1: Storage pattern — extend lib/storage.ts, no Mongoose

- **Chosen:** Add a `savedContent` object to `lib/storage.ts` following the exact `sessionLogs` pattern (MongoDB native driver, `getDatabase()`, typed filter helpers).
- **Alternatives considered:** Separate storage file for content; Mongoose models (as referenced in dm-dashboard).
- **Rationale:** Project has no Mongoose dependency. `lib/storage.ts` is the single source of storage operations. Consistency outweighs size concerns.
- **Trade-offs:** File grows further (~80 additional lines). Acceptable given the established pattern.

### Decision 2: Store all three prompt fields

- **Chosen:** `SavedContent` stores `systemPrompt: string`, `userMessage: string`, and `prompt: string` (fullText).
- **Alternatives considered:** Store `prompt` (fullText) only.
- **Rationale:** The library card visually differentiates system context (muted monospace) from the user request (bright monospace). This requires both parts at read time. Storing fullText separately avoids reconstruction on every read.
- **Trade-offs:** Slightly more storage per document; fullText is derivable from the other two but stored for copy-convenience.

### Decision 3: Route as campaign-child, not top-level

- **Chosen:** `app/campaigns/[id]/library/page.tsx` — library is scoped to a campaign.
- **Alternatives considered:** `/library` top-level with campaignId dropdown filter.
- **Rationale:** Prompts embed campaign-specific context (party members, chapter, module name). Cross-campaign browsing has no useful meaning. Campaign-child route is consistent with Sessions and Prompt Builder.
- **Trade-offs:** DMs cannot browse all saved content across campaigns in one view (accepted as non-goal).

### Decision 4: Type union matches template IDs exactly

- **Chosen:** `'npc' | 'location' | 'shop' | 'magic-item' | 'room'`
- **Alternatives considered:** `'item'` instead of `'magic-item'` (as originally specced in issue).
- **Rationale:** Template IDs are the source of truth (`lib/prompts/templates.ts`). Mismatching would require a mapping layer at save time.
- **Trade-offs:** Filter tab label for this type is "Magic Item" (display label), not "magic-item" (the stored value).

### Decision 5: Title is DM-supplied with a suggestion

- **Chosen:** Save panel shows a text input pre-filled with the first non-empty template field value (e.g., the NPC's role, the location type). DM edits before saving. Title is required.
- **Alternatives considered:** Auto-generate title without DM input; add `defaultTitle(fields)` to `PromptTemplate`.
- **Rationale:** `PromptTemplate` has no name field for NPC (uses role/location) — a generated title would be awkward. DM-supplied titles are more meaningful for retrieval.
- **Trade-offs:** One extra step for the DM at save time.

### Decision 6: Save panel is inline in prompt builder, not a modal

- **Chosen:** Clicking "Save to Library" expands an inline panel below the prompt output: title input + Save/Cancel buttons.
- **Alternatives considered:** Modal dialog.
- **Rationale:** Inline is lighter, keeps the prompt visible for reference while the DM types a title, and avoids z-index/focus management complexity.
- **Trade-offs:** Takes vertical space; acceptable since the prompt output is already above it.

## Proposal to Design Mapping

- Proposal element: No Mongoose, use `lib/storage.ts`
  - Design decision: Decision 1
  - Validation approach: No `lib/server/models/` directory created; storage ops follow `sessionLogs` pattern exactly.

- Proposal element: Store all prompt fields
  - Design decision: Decision 2
  - Validation approach: Unit test that saved item contains `systemPrompt`, `userMessage`, `prompt` all non-empty.

- Proposal element: Campaign-scoped library route
  - Design decision: Decision 3
  - Validation approach: Page renders correctly at `/campaigns/[id]/library`; only shows items for that campaignId.

- Proposal element: Type union matching template IDs
  - Design decision: Decision 4
  - Validation approach: TypeScript compiler enforces; integration test saves one item of each type.

- Proposal element: Title from first field
  - Design decision: Decision 5
  - Validation approach: Integration test: generate NPC prompt, open save panel, assert title input pre-filled with role value.

- Proposal element: Inline save panel
  - Design decision: Decision 6
  - Validation approach: Integration test: click Save to Library, assert panel appears without navigation.

## Functional Requirements Mapping

- **Requirement:** DM can save a generated prompt with a title to the library.
  - Design element: Save panel (Decision 6) + `POST /api/content` + `storage.savedContent.create`
  - Acceptance criteria reference: specs/content-library/spec.md — Save flow scenarios
  - Testability notes: Integration test renders prompt builder, generates prompt, saves, asserts item appears in library.

- **Requirement:** Library shows saved items filterable by type.
  - Design element: `app/campaigns/[id]/library/page.tsx` filter tabs
  - Acceptance criteria reference: specs/content-library/spec.md — Filter scenarios
  - Testability notes: Unit test filter logic; integration test renders library with mixed types and asserts filter tabs work.

- **Requirement:** DM can paste AI response and add notes to a saved item.
  - Design element: Expanded card with editable textareas + `PUT /api/content/[id]`
  - Acceptance criteria reference: specs/content-library/spec.md — Edit scenarios
  - Testability notes: Integration test expands card, fills response and notes, saves, re-renders, asserts values persisted.

- **Requirement:** DM can delete a saved item.
  - Design element: Delete button + `DELETE /api/content/[id]`
  - Acceptance criteria reference: specs/content-library/spec.md — Delete scenarios
  - Testability notes: Integration test deletes item, asserts it disappears from list.

- **Requirement:** Card shows system and user message with visual differentiation.
  - Design element: Expanded card renders `systemPrompt` in muted monospace, `userMessage` in bright monospace.
  - Acceptance criteria reference: specs/content-library/spec.md — Card display scenarios
  - Testability notes: Integration test asserts both sections render with correct content.

## Non-Functional Requirements Mapping

- **Requirement category:** Security
  - Requirement: All API routes require authentication; users can only access their own content.
  - Design element: Existing auth middleware applied to all `/api/content` routes; `userId` filter on all queries.
  - Acceptance criteria reference: specs/content-library/spec.md — Auth scenarios
  - Testability notes: Integration test: unauthenticated request to `GET /api/content` returns 401.

- **Requirement category:** Performance
  - Requirement: Library list loads without blocking the campaign page.
  - Design element: Library is a separate page; no data fetched on campaign list page.
  - Acceptance criteria reference: N/A (no perf test; acceptable given small dataset per campaign).
  - Testability notes: No formal perf test required for v1.

- **Requirement category:** Reliability
  - Requirement: Save failure shows an error; DM does not lose the generated prompt.
  - Design element: Save panel shows error banner on API failure; prompt remains visible.
  - Acceptance criteria reference: specs/content-library/spec.md — Error scenarios
  - Testability notes: Integration test mocks `POST /api/content` 500, asserts error banner shown.

## Risks / Trade-offs

- **Risk/trade-off:** `lib/storage.ts` grows further.
  - Impact: Maintenance friction over time.
  - Mitigation: Follow existing pattern exactly; no new abstractions introduced.

- **Risk/trade-off:** Wiring Save button modifies a shipped page.
  - Impact: Potential regression in prompt generation flow.
  - Mitigation: Save panel is additive; generate flow untouched. Integration test covers the full generate → save path.

## Rollback / Mitigation

- **Rollback trigger:** API routes returning unexpected errors in production; library page crashing.
- **Rollback steps:** Revert `app/api/content/`, `app/campaigns/[id]/library/`, nav button, and Save panel wiring. `SavedContent` documents in MongoDB are left in place (safe; no foreign-key constraints). Type and storage additions in `lib/types.ts` and `lib/storage.ts` can be reverted without data loss.
- **Data migration considerations:** None — new collection, no existing data affected.
- **Verification after rollback:** Prompt builder renders with disabled Save stub (pre-change state); library route 404s.

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix failing tests or type errors before proceeding.
- **If security checks fail:** Do not merge. Auth middleware must be applied to all new routes; any unauthenticated access is a blocker.
- **If required reviews are blocked/stale:** Ping reviewer after 24 hours; escalate to maintainer after 48 hours.
- **Escalation path and timeout:** Maintainer (dougis) resolves within 72 hours of escalation or change is deferred to next sprint.

## Open Questions

No open questions. All design decisions were confirmed during the exploration session prior to proposal.
