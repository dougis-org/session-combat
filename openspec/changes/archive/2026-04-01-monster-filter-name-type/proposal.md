## Why

The monster screen now contains 334 SRD monsters plus any user-created templates, making it
difficult to find specific monsters without scrolling through the entire list. Issue #108 identifies
filtering as a high-priority UX improvement, particularly for the monster screen.

## What Changes

- Add a filter bar to `app/monsters/page.tsx` with two controls: a text input (name substring
  match) and a type dropdown (exact match from the monster's `type` field).
- Both "My Monsters" and "Global Monster Library" sections filter simultaneously from the same
  controls.
- Filtering is entirely client-side — no API changes required.
- When no filter is active, all monsters display as today.

## Capabilities

### New Capabilities

- `monster-filter`: Client-side name + type filtering on the monsters list screen, covering both
  user-owned and global template sections.

### Modified Capabilities

<!-- None — no existing spec-level behavior changes. -->

## Impact

- **Modified file**: `app/monsters/page.tsx` (state + derived lists + filter UI)
- **New file**: `lib/hooks/useMonsterFilter.ts` (or inline `useMemo` — decided in design)
- **No API changes**: all data is already fetched and held in component state
- **No database changes**
- **No auth changes**

## Scope

**In scope:**
- Name filter (case-insensitive substring)
- Type filter (dropdown populated from distinct types present in loaded data)
- Filters apply to both user and global template sections simultaneously
- Monsters screen only (issue #108 mentions other screens; those are out of scope for this change)

**Out of scope:**
- Challenge rating filter
- Other screens (characters, encounters, parties)
- Server-side filtering / API query params
- Persisting filter state across page navigation

## Risks

- **Type list length**: If many unique types exist across 334+ monsters, a plain `<select>` dropdown
  could be unwieldy. Mitigation: sort alphabetically and include an "All types" default option.
- **Empty-state messaging**: After filtering, both sections could show zero results; the UI should
  clearly communicate "no results match your filter" vs. "you have no monsters."

## Open Questions

No unresolved ambiguity. The following decisions are confirmed:
- Name filter: substring, case-insensitive
- Type filter: exact match (not substring), populated from loaded data
- Scope: monsters screen only
- No API changes

## Non-Goals

- Filtering other collection screens (deferred to a follow-on change per issue #108)
- Advanced filters (CR range, alignment, size, legendary status)
- Saved/bookmarked filter state

---
*If scope changes after approval, proposal, design, specs, and tasks must be updated before apply.*
