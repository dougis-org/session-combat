## GitHub Issues

- #814

## Why

- Problem statement: The "Select Encounter" dropdown on combat setup lists encounters in API/insertion order with no way to narrow it. DMs with many encounters must scroll an unsorted list.
- Why now: Campaign seeding added dozens of encounters per campaign (e.g. Mad Mage with 82), making the unsorted `<select>` impractical.
- Business/user impact: Faster combat start for DMs; less friction at the table.

## Problem Space

- Current behavior: `lib/components/CombatSetupView.tsx` renders `<select>` over `encounters` from `useCombat` unsorted; no search.
- Desired behavior: Options are sorted alphabetically (case-insensitive) and a search box above the select filters options by name (case-insensitive substring).
- Constraints: Same view serves `/combat` and `/campaigns/[id]/combat`. Existing unit tests query `getByDisplayValue('No encounter')`, so the control remains a native `<select>`.
- Assumptions: Client-side filtering is sufficient (encounter lists are already fully loaded by `useCombat`). Pattern mirrors `app/monsters/filterUtils.ts`.
- Edge cases considered:
  - Selected encounter filtered out by the search text must remain selected and visible in the select.
  - Zero matches shows a "No encounters match" message.
  - Mixed-case names sort together; whitespace-only query treated as empty.
  - Campaign-scoped empty state (no linked encounters) is unchanged and shows no search box.

## Scope

### In Scope

- Alphabetical sort of encounter options in `CombatSetupView`.
- Search input filtering the options, always visible when the select is shown.
- Pure helper `filterAndSortEncounters` with unit tests; component tests; E2E coverage of the picker.

### Out of Scope

- Replacing the `<select>` with a combobox/listbox (option B).
- Sorting/searching in the campaign encounters management page or the "Link Existing Encounter" picker.
- Server-side sorting/search; changes to `useCombat` data order.
- Party select.

## What Changes

- New helper `lib/utils/encounterFilter.ts` exporting `filterAndSortEncounters(encounters, query, selectedId)`.
- `lib/components/CombatSetupView.tsx`: local `encounterQuery` state, search input, memoized derived options, no-match message.
- New tests under `tests/unit/`; extend `tests/unit/components/CombatSetupView.test.tsx`; one E2E scenario.

## Risks

- Risk: Selected encounter hidden by filter causes the select to show "No encounter" while a different encounter is still selected.
  - Impact: DM starts combat with an unexpected encounter.
  - Mitigation: Helper always retains the selected encounter in the output.
- Risk: Existing tests break from DOM changes.
  - Impact: Red CI.
  - Mitigation: Keep native `<select>` and its current option/value semantics.

## Open Questions

- Question: Show the search box always or only above a threshold?
  - Needed from: Requester (resolved in explore: always show).
  - Blocker for apply: no
- All other questions raised during exploration (selection retention, empty result, sort comparator, sort location) were resolved in favor of the stated recommendations.

## Non-Goals

- A custom combobox, fuzzy matching, or highlighting matches.
- Persisting the search text across sessions.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
