## Context

The monsters screen (`app/monsters/page.tsx`) fetches all monster templates on mount and holds
them in two React state arrays: `userTemplates` (user-owned) and `globalTemplates` (SRD + admin
content, currently 334 entries). There is no existing filtering. All data is client-side after
the initial fetch, so filtering requires no API changes.

**Proposal mapping:**
| Proposal element | Design decision |
|---|---|
| Name filter (substring) | `filterText` state, `useMemo` derived lists |
| Type filter (exact) | `filterType` state, dropdown from union of both arrays |
| Both sections filter simultaneously | Single shared filter state, two derived arrays |
| Client-side only | `useMemo` — no fetch/debounce needed at current data scale |
| No API changes | Confirmed — all data already in state post-mount |

## Goals / Non-Goals

**Goals:**
- Filter both monster sections simultaneously with one set of controls
- Name: case-insensitive substring match against `MonsterTemplate.name`
- Type: exact match against `MonsterTemplate.type` (e.g. "dragon", "undead")
- Type dropdown options derived from the union of loaded user + global templates
- Empty-state message when a section has results filtered to zero
- No visual regressions on existing cards, edit forms, or admin controls

**Non-Goals:**
- Server-side filtering or API query params
- Other collection screens (characters, encounters, parties)
- Persisted filter state (URL params, localStorage)
- CR range, size, alignment, or multi-field type filters

## Decisions

### D1: Inline state + useMemo (no hook extraction)

**Decision**: Add `filterText` and `filterType` directly to `MonstersContent` state. Derive
`filteredUserTemplates` and `filteredGlobalTemplates` via `useMemo`.

**Rationale**: The filter logic is 4–6 lines and used in exactly one component. Extracting a
`useMonsterFilter` hook at this scope would be premature — there is no second consumer. If
filtering is later added to other screens (characters, encounters), a shared hook can be extracted
at that time.

**Alternatives considered**: Generic `useFilter<T>` hook — rejected as over-engineering for a
single screen change.

### D2: Type dropdown options derived from loaded data (not hardcoded)

**Decision**: Compute the distinct `type` values from `[...userTemplates, ...globalTemplates]` via
`useMemo`. Sort alphabetically. Prepend "All types" (empty string value).

**Rationale**: The monster type field is a free-form string in `MonsterTemplate`. Hardcoding a
list would diverge from actual data. Deriving from loaded data ensures the dropdown always
reflects what is present, including any custom user-created types.

**Risk**: If many rare types exist, the dropdown is long but still usable. Acceptable for v1.

### D3: Type filter uses exact match

**Decision**: `filterType === '' || template.type === filterType`

**Rationale**: Monster types are short, consistent tokens (e.g. "dragon", "humanoid", "undead").
Substring matching on type would produce confusing results (e.g. "construct" matching "deconstruct"
if a user named a type that way). Exact match is predictable.

### D4: Empty-state per section, not global

**Decision**: When filters reduce a section to zero results, show a per-section message:
"No monsters match your filter." The section heading remains visible so the user knows which
section is empty.

**Rationale**: Hiding the section entirely when filtered to zero could confuse users ("where did
Global Library go?"). Keeping the heading with an empty-state message is clearer.

### D5: Filter controls placement

**Decision**: Filter bar placed above the "My Monsters" section heading, spanning full width,
styled consistently with existing Tailwind patterns in the file (dark background, gray/purple
accents).

**Rationale**: A single top-of-page filter communicates that it applies to the whole screen.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Type list becomes very long (100+ types) | Sort alphabetically; acceptable for v1. A search-within-select can be added later if needed. |
| `useMemo` dependencies miss an update | Include both `userTemplates`/`globalTemplates` and filter state in deps arrays — standard React pattern, low risk. |
| Empty-state messaging confusing when filtering | Per-section "no results" message distinguishes filter-zero from "no data" state. |

## Rollback / Mitigation

This is a purely additive UI change with no data or API surface. Rollback = revert the component
file. No migration needed.

## Open Questions

None. All decisions confirmed during explore phase.
