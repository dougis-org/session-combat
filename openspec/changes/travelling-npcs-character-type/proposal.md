## GitHub Issues

- dougis-org/session-combat#183

## Why

- Problem statement: The `Party` model stores a flat list of `characterIds` with no way to distinguish player characters from travelling NPCs or companions. The DM has no mechanism to flag a character as an NPC or companion, and all party views render every member identically.
- Why now: Campaign Management (#182) is complete. The next logical feature is surfacing the active party on the dashboard — which requires knowing which members are PCs, NPCs, and companions before that work begins (#195).
- Business/user impact: DMs regularly run sessions with travelling NPCs (hired guides, rescued prisoners, allied sages) and companions (familiars, beast companions, sidekicks). Without this distinction, the prompt builder cannot correctly scope "the party" and the dashboard cannot present a meaningful party overview.

## Problem Space

- Current behavior: `Character` has no type field. All characters added to a party are treated identically in every UI and in the prompt builder context.
- Desired behavior: Each character carries a `characterType` of `'character'`, `'npc'`, or `'companion'`. The characters list and party views group members by type. The API supports filtering by type. The prompt builder can address each group independently.
- Constraints:
  - NPCs and companions must use the full `CreatureStats` + `Character` stat block — no thin model.
  - Existing characters must default to `'character'` with no migration needed.
  - The `Party` data model (`characterIds: string[]`) does not change.
- Assumptions:
  - `'companion'` covers familiars, beast companions, and sidekicks; no further sub-typing is needed at this stage.
  - The existing `CreatureStatsForm` is sufficient for all three types; no new form is needed.
  - Dashboard integration (#195) is out of scope here.
- Edge cases considered:
  - A character created before this change has no `characterType` field — the Mongoose default ensures it reads as `'character'`.
  - A party may contain only NPCs or only companions — the UI should not render empty section headings.
  - The API filter value `all` (or omitting the param) returns every character regardless of type.

## Scope

### In Scope

- Add `characterType?: 'character' | 'npc' | 'companion'` to `Character` interface in `lib/types.ts`
- Add `characterType` field to the `Character` Mongoose model in `lib/server/models/Character.ts` (default `'character'`)
- Update `CharacterInput` / create/update DTOs to accept `characterType`
- `GET /api/characters` — add optional `?characterType=character|npc|companion|all` query param
- `POST /api/characters` and `PUT /api/characters/[id]` — persist `characterType`
- `CharacterEditor` form — add Type selector (Player Character / Travelling NPC / Companion)
- Characters list (`app/characters/page.tsx`) — group by `characterType`, add filter control
- Parties UI (`app/parties/page.tsx`) — split party member display into typed sections; hide empty sections
- Unit and integration tests as defined in Step 6 of #183

### Out of Scope

- Dashboard integration — tracked in #195
- Any new `characterType` values beyond the three defined here
- Changes to `Party` data model
- Changes to Monster or encounter types
- Import from D&D Beyond (not currently scoped to carry `characterType`)

## What Changes

- `lib/types.ts` — `Character` interface gains `characterType`
- `lib/server/models/Character.ts` — Mongoose schema gains `characterType`
- `app/api/characters/route.ts` and `app/api/characters/[id]/route.ts` — accept and filter by `characterType`
- `app/characters/page.tsx` — type selector in editor, grouped list, filter control
- `app/parties/page.tsx` — party member list split by type

## Risks

- Risk: Existing characters default to `'character'` via Mongoose, but serialized API responses for cached/persisted documents without the field may omit it.
  - Impact: Frontend rendering falls back to showing the character in an "unknown" group.
  - Mitigation: Coerce missing/undefined `characterType` to `'character'` in the API response serializer.

- Risk: The three-type enum is extended in future without updating all filter paths.
  - Impact: New type values pass through unfiltered or silently dropped.
  - Mitigation: Use TypeScript literal union and Mongoose enum; adding a value forces a TS error at every switch/conditional.

## Open Questions

No unresolved ambiguity. The field name, enum values, API filter shape, and UI grouping are all confirmed. Dashboard integration is explicitly deferred to #195.

## Non-Goals

- Sub-typing companions (familiar vs. beast companion vs. sidekick)
- Per-type permissions or visibility rules
- Prompt builder changes (will be addressed in #195 alongside dashboard)
- Any UI outside characters and parties pages

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
