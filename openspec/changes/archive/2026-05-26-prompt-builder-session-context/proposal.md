## GitHub Issues

- #188

## Why

- Problem statement: The Prompt Builder generates AI prompts with campaign name, chapter, and party composition, but has no awareness of what actually happened in recent sessions. A DM writing a prompt for a new NPC or location has to mentally re-type context ("the party just defeated the Betrayer and reached level 11") every single time.
- Why now: Steps 1–4 and 6–7 of issue #188 are fully implemented. Session logs exist in the database and the API supports fetching them. Step 5 (Prompt Builder integration) is the only remaining gap.
- Business/user impact: Prompts become dramatically more relevant without extra DM effort. The AI has enough context to reference recent events, adjust tone to current story beats, and avoid narrative contradictions.

## Problem Space

- Current behavior: `buildSystemPrompt()` in `lib/prompts/templates.ts` emits campaign name, module, current chapter, and active party members. No session history is included. All five prompt templates (`npc`, `location`, `shop`, `magic-item`, `room`) use this function.
- Desired behavior: When session logs exist for a campaign, `buildSystemPrompt()` appends a "Recent sessions:" block summarising the last 3 sessions. All templates benefit automatically since they all call `buildSystemPrompt()`.
- Constraints: Sessions are fetched from an already-existing API endpoint (`GET /api/campaigns/[id]/sessions?limit=3`). `recentSessions` must be optional on `CampaignContext` so no existing consumer breaks.
- Assumptions: 3 recent sessions is the right default (matches issue spec). Sessions are already sorted descending by `sessionNumber` from the API. The Prompt Builder page's loading state is user-visible and should reflect the additional fetch.
- Edge cases considered: Campaign with zero session logs — block is omitted entirely. Sessions with no title — fall back to "Untitled Session". Sessions with `milestone: true` — milestone note is appended. The `?limit` query param already exists in the sessions API route.

## Scope

### In Scope

- Add `recentSessions?: SessionLog[]` to `CampaignContext` in `lib/types.ts`
- Fetch `GET /api/campaigns/[id]/sessions?limit=3` inside `fetchCampaignContext()` in `lib/utils/campaignContext.ts` (blocking, in the main `Promise.all`)
- Extend `buildSystemPrompt()` in `lib/prompts/templates.ts` to append a formatted "Recent sessions:" block when `recentSessions` is present and non-empty
- Update the loading label in `app/campaigns/[id]/prompts/page.tsx` from `"Loading campaign context..."` to `"Loading campaign and session history..."`
- Unit tests: sessions endpoint mock in `fetchCampaignContext` tests, `buildSystemPrompt` session block rendering

### Out of Scope

- Changing the number of sessions fetched (3 is fixed per issue spec; a user control is a future enhancement)
- Per-template control over whether sessions appear
- Saving sessions as part of the Content Library
- Combat event auto-capture (#190, explicitly deferred)
- Any changes to the sessions API, storage layer, or session journal UI (all done in prior steps)

## What Changes

- `lib/types.ts` — `CampaignContext` gains `recentSessions?: SessionLog[]`
- `lib/utils/campaignContext.ts` — `fetchCampaignContext()` adds sessions to `Promise.all`, includes result in return value
- `lib/prompts/templates.ts` — `buildSystemPrompt()` appends session block when `recentSessions` present
- `app/campaigns/[id]/prompts/page.tsx` — loading label string updated
- `tests/unit/utils/campaignContext.test.ts` (or equivalent) — sessions mock added
- `tests/unit/prompts/templates.test.ts` (or equivalent) — session block rendering tested

## Risks

- Risk: Existing tests for `fetchCampaignContext` or `buildSystemPrompt` may not mock the sessions endpoint, causing them to fail after this change.
  - Impact: CI failure.
  - Mitigation: Audit existing test files before implementing; add sessions mock upfront.
- Risk: Sessions API response fails (e.g. network error) and blocks the entire Prompt Builder load.
  - Impact: DM cannot use Prompt Builder if sessions endpoint is temporarily unavailable.
  - Mitigation: Treat a failed sessions fetch as an empty list rather than a hard error — `recentSessions` defaults to `[]` on failure. Log the error but do not propagate it.

## Open Questions

No unresolved ambiguity. All decisions have been confirmed:
- Blocking fetch (not secondary useEffect): confirmed by user.
- Sessions context available for all templates (via `buildSystemPrompt`): confirmed by user.
- 3 sessions limit: specified in issue #188.
- Failed sessions fetch → empty list, not error propagation: derived from the "non-blocking dashboard" pattern established in #186 and the principle that sessions are enrichment, not required data.

## Non-Goals

- Per-template opt-in/opt-out of session context
- User-configurable session count
- Surfacing session context outside the Prompt Builder (dashboard already handles its own session fetch independently)
- Any UI changes to the session journal itself

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
