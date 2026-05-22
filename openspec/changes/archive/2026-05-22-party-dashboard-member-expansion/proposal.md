## GitHub Issues

- dougis-org/session-combat#195

## Why

- Problem statement: The party list on the parties page shows members as a comma-separated name list only. Now that `characterType` exists (`character`, `npc`, `companion`), the party view does not surface which members are Player Characters, Travelling NPCs, or Companions — and shows no stats at all.
- Why now: Issue #183 (Travelling NPCs — `characterType` field + parties UI split) closed on 2026-05-22. The field, API filter, and editor grouping are all in place; the read-only party card is the remaining gap.
- Business/user impact: DMs cannot see at a glance which party members are NPCs or companions, nor their key combat stats (AC, HP), without opening the full character editor.

## Problem Space

- Current behavior: Each party card renders `Members: N` and a comma list of names via `getCharacterNames()`. No stats, no type grouping.
- Desired behavior: Each party card renders members grouped by type (Player Characters / Travelling NPCs / Companions) with a compact mini-summary card per member showing name, race/type badge, class + level, AC, and HP. Groups with no members are hidden.
- Constraints:
  - `CreatureStatBlock` already renders AC/HP inline; extracting a shared `CombatStatsRow` primitive must not change any existing visual output.
  - All character data is already fetched in `PartiesContent` state — no additional API calls needed for the party list.
  - `CHARACTER_TYPE_ORDER`, `CHARACTER_TYPE_LABELS`, and `getCharacterType` are already imported in `app/parties/page.tsx`.
- Assumptions:
  - The `Character` type carries `characterType`, `race`, `classes` (array), `ac`, `hp`, `maxHp` — all available in the fetched character state.
  - "Level" for the mini-summary is the sum of levels across `classes` (multiclass support already in the type).
- Edge cases considered:
  - Party with members of only one type — other groups hidden, not rendered empty.
  - Character with no `characterType` set defaults to `'character'` via `getCharacterType()`.
  - Character with no race or no classes — render gracefully with fallbacks (e.g., "—").
  - Party with zero members — existing empty state unchanged.

## Scope

### In Scope

- Extract `CombatStatsRow` primitive component from `CreatureStatBlock` (AC, acNote, HP/maxHP display)
- Update `CreatureStatBlock` to use `CombatStatsRow` — no visual change
- Create `CharacterMiniSummary` component (name, race, characterType badge, class + level, AC, HP) using `CombatStatsRow`
- Update party list cards in `app/parties/page.tsx` to replace `getCharacterNames()` with grouped `CharacterMiniSummary` sections
- Unit tests for `CombatStatsRow`, `CharacterMiniSummary`, and the updated party card grouping

### Out of Scope

- Prompt builder context filtering by `characterType` (deferred — no prompt builder exists yet)
- Any changes to the campaigns dashboard (`app/campaigns/page.tsx`)
- Changes to how characters are created or edited
- New `characterType` values beyond `character`, `npc`, `companion`
- Combat or encounter views

## What Changes

- New file: `lib/components/CombatStatsRow.tsx`
- New file: `lib/components/CharacterMiniSummary.tsx`
- Modified: `lib/components/CreatureStatBlock.tsx` — use `CombatStatsRow` instead of inline AC/HP JSX
- Modified: `app/parties/page.tsx` — replace `getCharacterNames()` party card section with grouped `CharacterMiniSummary` rendering

## Risks

- Risk: Extracting `CombatStatsRow` breaks existing `CreatureStatBlock` visual output
  - Impact: Regression in combat/encounter views that use `CreatureStatBlock`
  - Mitigation: Pure refactor — same JSX, same Tailwind classes, same props. Covered by existing unit tests + a snapshot/visual check.
- Risk: Character data missing fields (race, classes) in older records
  - Impact: Mini-summary renders broken or throws
  - Mitigation: Defensive fallbacks (`race ?? '—'`, `classes?.length ? ... : '—'`)

## Open Questions

No unresolved ambiguity. All design decisions were confirmed during explore mode:
- Component decomposition (`CombatStatsRow` as shared primitive) — confirmed
- `CharacterMiniSummary` as standalone, not embedded in `CreatureStatBlock` — confirmed
- Lighter mini-summary (not full compact `CreatureStatBlock`) — confirmed
- Prompt builder deferred — confirmed

## Non-Goals

- Full stat block display in party list (ability scores, skills, saving throws, etc.)
- Editable stats inline in the party list
- Prompt builder integration

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
