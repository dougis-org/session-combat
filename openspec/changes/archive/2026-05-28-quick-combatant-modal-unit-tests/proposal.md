## GitHub Issues

- #258
- #242

## Why

- Problem statement: `QuickCombatantModal.tsx` is 656 lines with 0% test coverage. It is the primary user-facing surface for adding monsters and characters to combat encounters — a high-traffic, high-risk interaction path.
- Why now: Issue #242 targets `lib/components` statement coverage ≥ 70%. `QuickCombatantModal` is the largest single file holding that metric back. It is explicitly called out in #258 as the highest-priority zero-coverage file.
- Business/user impact: Bugs in search, filter, or selection logic go undetected until manual QA or production. The component owns Fuse.js fuzzy search, creator-based filtering, and custom combatant form validation — all branchy logic that benefits significantly from automated verification.

## Problem Space

- Current behavior: `QuickCombatantModal.tsx` has no automated test coverage. Regressions in search, filter, tab switching, callback invocation, or form validation are invisible to CI.
- Desired behavior: A comprehensive RTL unit test suite covers all three tabs (monsters, characters, custom), all filter and search paths, all selection callbacks, and all custom-form validation branches. Statement coverage ≥ 70%, branch coverage ≥ 55%.
- Constraints:
  - Issue #264 (switch global jest env to jsdom) is open but not yet merged. The `@jest-environment jsdom` per-file docblock is the current workaround and remains valid until #264 lands.
  - The issue description mentions a "count spinner" — this control does not exist in the current component. Tests must cover actual code, not speculative UI.
  - Fuse.js fuzzy search uses a 0.3 threshold — test fixtures must use names that produce predictable match/no-match results.
- Assumptions:
  - RTL (`@testing-library/react`) and `@testing-library/jest-dom` are already installed (confirmed via `jest.setup.ts` and `CombatStatsRow.rtl.test.tsx`).
  - `@testing-library/user-event` is available for interaction simulation.
  - `next/link` requires a module mock in jsdom.
  - `crypto.randomUUID` requires a spy for deterministic id assertions.
- Edge cases considered:
  - All three creator filter values (`mine`, `global`, `other`) plus the default `all`.
  - `onAddCharacter` prop omitted (optional) — the component logs to console and does nothing.
  - `showToast=false` suppresses the success toast.
  - The duplicate `ac < 1` validation check on line 215 is dead code (line 200 fires first) — no special test needed.
  - Tab switching resets `searchQuery` and `creatorFilter` — must be verified.
  - Initiative field is optional — empty string omits it from the Monster payload; a filled value includes it.

## Scope

### In Scope

- New test file: `tests/unit/components/QuickCombatantModal.test.tsx`
- All three tabs: Monsters, Party Members, Create New
- Loading and empty states for Monsters and Party Members tabs
- Fuse.js search filtering (monsters and characters)
- Creator filter (all / mine / global / other) for both tabs
- Monster selection callback (`onAddMonster`) with payload shape verification
- Character selection callback (`onAddCharacter`) with payload shape verification
- Custom form: happy path, all validation error branches, optional initiative
- Toast display on success (showToast=true vs showToast=false)
- Backdrop click and close-button behavior
- Tab switching resets search and filter state
- Documentation: update `tests/unit/components/` convention in `.wolf/anatomy.md`

### Out of Scope

- Toast auto-dismiss timer (`useEffect` + `setTimeout`) — well-established browser behavior, not worth fake-timer setup
- `onAddCharacter` undefined path (console.log branch) — low value, not a user-visible behavior
- Error path in `handleAddFromLibrary` try/catch — requires forcing `onAddMonster` to throw; low ROI
- RTL migration of existing tests (tracked in #260–263)
- Switching global jest env to jsdom (tracked in #264)
- Any changes to `QuickCombatantModal.tsx` production code

## What Changes

- New file: `tests/unit/components/QuickCombatantModal.test.tsx`
- `.wolf/anatomy.md`: add entry for the new test file
- `.wolf/memory.md`: session log entry

## Risks

- Risk: Fuse.js fuzzy matching with test fixtures produces unexpected results
  - Impact: Search-filter tests become flaky or require exact-match workarounds
  - Mitigation: Use fixture names that are clearly distinct (e.g., "Goblin", "Orc", "Troll") and search terms that are unambiguous exact prefixes; verify locally before committing

- Risk: `next/link` module mock breaks if Next.js internals change
  - Impact: Test setup fails; unrelated to coverage goal
  - Mitigation: Use a minimal mock (`({ href, children }) => <a href={href}>{children}</a>`) that doesn't depend on Next.js internals

- Risk: `crypto.randomUUID` unavailable in jsdom
  - Impact: `handleAddFromLibrary` throws at runtime during tests
  - Mitigation: `jest.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid')` in `beforeEach`

- Risk: Issue #264 lands mid-implementation and removes the per-file jsdom docblock
  - Impact: Merge conflict or test environment change
  - Mitigation: Low impact — the docblock becoming redundant after #264 is harmless; no action needed

## Open Questions

No unresolved ambiguity exists. All decisions were made during the explore session:
- Test pattern: RTL (`render` + `screen` + `userEvent`), not `createRoot`
- File location: `tests/unit/components/QuickCombatantModal.test.tsx`
- Toast auto-dismiss: not tested
- Count spinner: not present in code, not tested
- Coverage depth: as comprehensive as realistic (see Scope)

## Non-Goals

- Increasing coverage of any other component in `lib/components/`
- Modifying the component's production behavior
- Achieving 100% branch coverage (the dead-code duplicate AC check and the console.log-only onAddCharacter-undefined path are explicitly excluded)
- E2E or integration-level testing of the modal within a full combat session

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
