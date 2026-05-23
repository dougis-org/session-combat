## GitHub Issues

- #188
- #186 (Party members refactor impacts dashboard)

## Why

- **Problem statement:** DMs have no way to record what happened in a session. After each session the only state available is the combat tracker and party composition — there is no place to capture which NPCs were encountered, what decisions the party made, whether they levelled up, or what plot threads were advanced.
- **Why now:** The Prompt Builder (#184) is the next major feature. Without session history, prompts can only include campaign name and chapter — richer AI output requires recent session context. Building the journal now means the Prompt Builder can consume it immediately on arrival.
- **Business/user impact:** DMs lose continuity between sessions. Each session they must reconstruct context from memory. AI-generated content (NPCs, locations, encounters) is generic rather than tailored to where the campaign actually is.

## Problem Space

- **Current behavior:** No session log exists. Party membership is stored as a flat `characterIds: string[]` with no timestamps — it is impossible to know when an NPC joined or left.
- **Desired behavior:** DMs can create a session log entry after each session. The journal create form auto-populates NPC join/departure events from party membership history. Session logs are queryable per campaign and injectable into AI prompts.
- **Constraints:**
  - Storage layer uses `lib/storage.ts` + MongoDB directly — no separate model files or Mongoose
  - Party refactor (`characterIds` → `members`) must land first; it is a prerequisite for NPC auto-capture
  - Combat auto-capture is blocked by `CombatState` having no `campaignId` and no history — deferred to #206
- **Assumptions:**
  - A campaign has at most one active party at a time for NPC auto-capture purposes
  - Session numbers are per-campaign sequential integers; no two sessions for the same campaign share a number
  - Race conditions on session number are not a concern (single DM per campaign)
  - Existing party records migrate safely with `addedAt = party.createdAt` as the default join time
- **Edge cases considered:**
  - Party with no `members` after migration (empty `characterIds`) — treat as empty party, no events
  - First session (no previous `datePlayed`) — auto-capture queries from epoch; effectively captures all current party members as joined
  - DM saves a session log with no events — valid, summary alone is sufficient
  - `leftAt` set when a character is soft-deleted — cascade in `lib/storage.ts` must set `leftAt` instead of `$pull`

## Scope

### In Scope

- `PartyMember` type with `characterId`, `addedAt`, `leftAt?`
- Replace `Party.characterIds` with `Party.members: PartyMember[]`
- Migration default: `addedAt = party.createdAt` for existing members
- Cascade on character delete: set `leftAt` instead of `$pull`
- `SessionLog` and `SessionEvent` types in `lib/types.ts`
- Storage functions in `lib/storage.ts` for session log CRUD
- API routes: `GET/POST /api/campaigns/[id]/sessions`, `PATCH/DELETE /api/campaigns/[id]/sessions/[sessionId]`
- Session journal UI at `app/campaigns/[id]/sessions/page.tsx`
- NPC join/departure auto-populate on journal create form
- Summary textarea with nudge placeholder text
- "Session Log" link on campaign cards
- Unit and integration tests

### Out of Scope

- Combat event auto-capture (blocked by #206)
- Prompt Builder integration (blocked by #184)
- Active Campaign Dashboard last-session card (blocked by #186)
- Multi-party campaigns (single party per campaign assumed)

## What Changes

- `lib/types.ts` — add `PartyMember`, `SessionLog`, `SessionLogInput`, `SessionEvent`; replace `Party.characterIds` with `Party.members`
- `lib/utils/partySelection.ts` — `expandPartyToCharacters` uses active members
- `app/api/parties/route.ts` — POST builds `members[]` from input
- `app/api/parties/[id]/route.ts` — PUT diffs and timestamps instead of replacing
- `app/parties/page.tsx` — derive active ids from `members` (5 spots)
- `lib/storage.ts` — add session log CRUD; update character-delete cascade
- `app/api/campaigns/[id]/sessions/route.ts` — new GET/POST
- `app/api/campaigns/[id]/sessions/[sessionId]/route.ts` — new PATCH/DELETE
- `app/campaigns/[id]/sessions/page.tsx` — new UI
- `app/campaigns/page.tsx` — add "Session Log" link to campaign cards

## Risks

- Risk: Party `characterIds` → `members` migration breaks existing party data
  - Impact: Parties appear empty after deploy; users lose party composition
  - Mitigation: Migration reads existing `characterIds` and writes `members` with `addedAt = party.createdAt`; run as a startup migration or lazy-migrate on first read

- Risk: `$pull { characterIds }` in character-delete cascade is replaced by array-filter update — MongoDB syntax is more complex
  - Impact: Characters not properly removed from parties on delete
  - Mitigation: Covered by integration test; MongoDB array filter syntax is well-documented

- Risk: NPC auto-populate queries parties by `campaignId` — parties without a `campaignId` set produce no auto-capture events
  - Impact: DMs who haven't linked a party to a campaign see no auto-populated events
  - Mitigation: Form shows empty events list with an explanatory message if no linked party found; DM can add custom events manually

## Open Questions

No unresolved ambiguity. All design decisions were made during exploration:
- Storage pattern: confirmed as `lib/storage.ts` (not model files)
- Party refactor: confirmed — `characterIds` replaced by `members`; alpha project, refactor is acceptable
- Session number strategy: confirmed as `MAX(sessionNumber) + 1`, editable, no race-condition concern
- Combat capture: confirmed deferred to #206
- Dashboard/Prompt Builder integration: confirmed deferred to their respective issues

## Non-Goals

- Real-time collaborative session logging
- Session log sharing between users
- Versioning or history of session log edits
- Combat event capture (separate issue #206)
- XP-based levelling tracking (milestone only)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
