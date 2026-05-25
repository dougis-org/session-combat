## GitHub Issues

- dougis-org/session-combat#185

## Why

- **Problem statement:** The Prompt Builder (#184) generates rich, campaign-contextualised prompts but has no persistence. DMs lose their work the moment they navigate away. There is no way to paste an AI response back alongside the prompt that produced it, or add notes for future reference.
- **Why now:** The Prompt Builder is complete and ships with a disabled "Save to Library" stub button explicitly awaiting this change. All prerequisites (Campaign Management, Prompt Builder) are done.
- **Business/user impact:** DMs can build a personal library of AI-generated content scoped to each campaign — NPCs, locations, shops, items, room descriptions — with the AI response and their own notes attached. This transforms the app from a prompt-generation tool into a campaign content reference.

## Problem Space

- **Current behavior:** Prompts are generated and displayed but not persisted. The "Save to Library" button is rendered but disabled. Navigating away loses the generated prompt entirely.
- **Desired behavior:** After generating a prompt the DM can save it with a title. The saved item appears in a per-campaign library at `/campaigns/[id]/library`. The DM can later expand any item, re-copy the full prompt, paste in the AI response, add notes, and save.
- **Constraints:**
  - No Mongoose — project uses raw MongoDB via `lib/storage.ts` (native driver). No `lib/server/models/` directory exists or should be created.
  - All routes must be protected by existing auth middleware.
  - Library is campaign-scoped; no cross-campaign view is needed (prompts embed campaign-specific context so cross-campaign browsing adds no value).
- **Assumptions:**
  - `campaignId` is always available in the prompt builder (it is — the page is already a campaign child route).
  - Chapter name is captured at save time from the active campaign context; it is not updated if the campaign advances chapters later.
  - DMs paste AI responses manually — no direct API integration in this change.
- **Edge cases considered:**
  - Save with empty title: blocked client-side; title is required.
  - Save before generating a prompt: button only enabled after a `BuiltPrompt` exists.
  - Delete with unsaved edits: warn or discard — no autosave.
  - Campaign with no saved content: library shows empty state, not an error.
  - Concurrent saves from two tabs: last-write-wins via MongoDB `updatedAt`.

## Scope

### In Scope

- `SavedContent` TypeScript interface in `lib/types.ts`
- `savedContent` CRUD in `lib/storage.ts` (list by campaignId, create, update, delete)
- `GET /api/content?campaignId=…` and `POST /api/content`
- `PUT /api/content/[id]` and `DELETE /api/content/[id]`
- `app/campaigns/[id]/library/page.tsx` — library UI with filter tabs and expandable cards
- Nav "Library" button added to each campaign card in `app/campaigns/page.tsx`
- Wire the disabled Save to Library stub in `app/campaigns/[id]/prompts/page.tsx`
- Unit and integration tests

### Out of Scope

- Direct Claude API integration (DM pastes responses manually)
- Cross-campaign library view
- Full-text search of saved content
- Tagging beyond the existing type filter
- Export or sharing of saved content
- Soft-delete / trash / undo delete

## What Changes

- **New type**: `SavedContent` in `lib/types.ts`
- **New storage ops**: `savedContent` object in `lib/storage.ts`
- **New API routes**: `app/api/content/route.ts`, `app/api/content/[id]/route.ts`
- **New page**: `app/campaigns/[id]/library/page.tsx`
- **Modified**: `app/campaigns/page.tsx` — Library nav button per campaign card
- **Modified**: `app/campaigns/[id]/prompts/page.tsx` — wire Save to Library stub

## Risks

- **Risk:** `lib/storage.ts` is already large (777 lines). Adding more operations increases maintenance surface.
  - **Impact:** Low — pattern is well-established and copy-paste consistent.
  - **Mitigation:** Follow the existing `sessionLogs` block exactly; no new abstractions.

- **Risk:** Wiring the Save to Library button in the prompt builder changes a shipped page.
  - **Impact:** Medium — regression could break prompt generation.
  - **Mitigation:** Save panel is an additive UI element; generate flow is unchanged. Cover with integration test.

- **Risk:** `type` mismatch between template IDs and `SavedContent.type` union.
  - **Impact:** Low — caught at type-check time.
  - **Mitigation:** Type union uses template IDs exactly: `'npc' | 'location' | 'shop' | 'magic-item' | 'room'`.

## Open Questions

No unresolved ambiguity. All design decisions were made during exploration:
- Route confirmed as `/campaigns/[id]/library` (campaign-child, not top-level).
- Data model confirmed as storing all three prompt fields (`systemPrompt`, `userMessage`, `prompt`).
- Type union confirmed to match template IDs (`'magic-item'` not `'item'`).
- Card layout confirmed with system/user visual split and Copy Full Prompt button.

## Non-Goals

- Replacing the DM's AI agent — the library stores prompts for manual use, not for calling the Claude API.
- Cross-campaign content organisation.
- Content versioning or history.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
