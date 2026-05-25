## GitHub Issues

- #184
- #212

## Why

- **Problem statement:** DMs using session-combat must manually re-type campaign name, module, chapter, and party composition every time they want AI assistance for generating NPCs, locations, shops, magic items, or room descriptions. There is no way to assemble context-rich prompts from the live session data that already exists in the app.
- **Why now:** Campaign Management (#182) is complete, giving us the data model (`Campaign`, `CampaignChapter`, `Party`, `Character`) needed to drive contextual prompts. Issue #184 is open and prioritised. A related data bug (#212) in session logs was discovered during exploration — this change fixes it cleanly via a shared helper rather than a one-off patch.
- **Business/user impact:** DMs save significant prep time. The app becomes a starting point for AI-assisted content creation rather than just a combat tracker. The agentic-ready architecture (structured `{ systemPrompt, userMessage, fullText }` output) future-proofs the feature for direct Claude API integration without requiring template rewrites.

## Problem Space

- **Current behavior:**
  - No prompt builder exists.
  - Session logs page fetches parties with `Array.find()`, silently dropping all but the first party linked to a campaign (#212).
  - Party member IDs are never resolved to character names — NPC auto-events show raw `characterId` strings.
- **Desired behavior:**
  - DMs navigate to a campaign and click a "Prompt Builder" link (alongside the existing "Sessions" link).
  - The page loads all parties linked to that campaign, resolves member IDs to full `Character` objects, and resolves `currentChapterId` to a `CampaignChapter`.
  - DM picks a template, fills a short form, clicks Generate — a complete prompt appears ready to copy.
  - Session logs page uses the same shared data helper, fixing the multi-party bug.
- **Constraints:**
  - No new backend required for prompt generation in v1 — all assembly is client-side.
  - Must not break existing session logs functionality.
  - Template architecture must support a future `/api/prompts/generate` agentic route without requiring template rewrites.
- **Assumptions:**
  - A campaign may have zero, one, or many linked parties. All are included.
  - Character data is fetched via the existing `/api/characters` endpoint and filtered client-side.
  - "Save to Library" (#185) is out of scope; the button can exist as a disabled stub.
- **Edge cases considered:**
  - Campaign with no linked parties: show informational message, templates still usable with empty party roster.
  - Campaign with no current chapter set: chapter field in prompt omitted gracefully.
  - Character deleted (soft-delete): excluded from member resolution.
  - Multiple parties linked to same campaign: all members merged for prompt context.

## Scope

### In Scope

- `lib/utils/campaignContext.ts` — `fetchCampaignContext(campaignId)` async helper
- `lib/hooks/useCampaignContext.ts` — React hook wrapping the helper
- `lib/prompts/templates.ts` — 5 templates (NPC, Location, Shop, Magic Item, Room) returning `BuiltPrompt`
- `app/campaigns/[id]/prompts/page.tsx` — Prompt Builder UI as a child route
- Nav link to Prompt Builder added to campaign detail view alongside Sessions
- Refactor `app/campaigns/[id]/sessions/page.tsx` to use `useCampaignContext()`, fixing #212
- Unit tests for all `build()` functions in `templates.ts`
- Unit tests for `fetchCampaignContext` (mock fetch)
- Integration test: render prompt builder, select each template, fill form, assert generated prompt contains campaign name and party members
- Integration test: session logs page uses merged member list from all linked parties

### Out of Scope

- Saving prompts to a Content Library (#185)
- `/api/prompts/generate` agentic route (future)
- Direct Claude API calls from the UI
- Prompt history or versioning
- Any changes to the Campaign, Party, or Character data models

## What Changes

- New file: `lib/utils/campaignContext.ts`
- New file: `lib/hooks/useCampaignContext.ts`
- New file: `lib/prompts/templates.ts`
- New file: `app/campaigns/[id]/prompts/page.tsx`
- Modified: `app/campaigns/[id]/sessions/page.tsx` — replace manual fetch+find with `useCampaignContext()`
- Modified: `app/campaigns/page.tsx` — add Prompt Builder nav link in campaign detail view
- New test files for templates, campaignContext, and the prompt builder page

## Risks

- **Risk:** Refactoring session logs to use `useCampaignContext()` breaks existing session log behavior.
  - **Impact:** High — session logs is a used feature.
  - **Mitigation:** Write regression tests for session logs before refactoring; refactor as a distinct task that can be reverted independently.

- **Risk:** Character fetch adds a second round-trip on the prompt builder page, increasing load time.
  - **Impact:** Low — characters list is small for typical DM usage.
  - **Mitigation:** Fetch characters and parties in parallel via `Promise.all`.

- **Risk:** Template `systemPrompt` / `userMessage` split doesn't map cleanly to the Claude API message format when agentic support is added later.
  - **Impact:** Medium — templates may need minor adjustments.
  - **Mitigation:** The `BuiltPrompt` interface is defined in `lib/prompts/templates.ts` and can be evolved without changing callers if we keep `fullText` stable.

## Open Questions

No unresolved ambiguity remains. The following were resolved during exploration:

- **Route location**: confirmed as `app/campaigns/[id]/prompts/page.tsx` (child of campaign, mirrors sessions).
- **Multi-party handling**: confirmed — include all parties, merge members.
- **Template return type**: confirmed — `{ systemPrompt, userMessage, fullText }` for agentic readiness.
- **Save to Library button**: confirmed out of scope for this change; stub/disabled is acceptable.
- **Character resolution**: confirmed — fetch all characters, filter to member IDs client-side.

## Non-Goals

- Agentic prompt execution (calling Claude from the app)
- Content Library storage (#185)
- Prompt editing or versioning
- Mobile-specific layout optimisations
- Sharing prompts between users

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
