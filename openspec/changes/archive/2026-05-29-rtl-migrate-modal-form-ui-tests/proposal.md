## GitHub Issues

- #261

## Why

- **Problem statement:** Three component test files (`ui.test.tsx`, `TargetActionModal.test.tsx`, `CreatureStatsForm.test.tsx`) still use the legacy `createRoot` + `act` + `container.querySelector*` pattern. The project adopted React Testing Library (RTL) as the standard in #254, and all new tests are written in RTL. These files are the final wave of medium-complexity tests that must be migrated to eliminate the legacy pattern from the component test suite.
- **Why now:** RTL infrastructure (#254) is complete and merged. The simpler files (issue #260) are being migrated in parallel on a separate thread. This is the natural next step to fully retire the legacy pattern.
- **Business/user impact:** Unified test style lowers contributor friction and makes test failures easier to diagnose. RTL's `userEvent` is more faithful to real browser interaction than synthetic `dispatchEvent`, improving confidence in these tests. Retiring the legacy pattern also removes the `helpers/reactRoot.ts` file and the `IS_REACT_ACT_ENVIRONMENT` globals.

## Problem Space

- **Current behavior:** `ui.test.tsx`, `TargetActionModal.test.tsx`, and `CreatureStatsForm.test.tsx` use `createRoot`, `Root`, `act()` for rendering, and `container.querySelector*` or raw `.click()` for interaction. `ui.test.tsx` uses the `createReactRoot` / `unmountReactRoot` helper from `tests/unit/helpers/reactRoot.ts`. `TargetActionModal.test.tsx` contains a custom `findButton()` helper and a `changeInputValue()` function that uses native prototype setters to bypass React's synthetic event system.
- **Desired behavior:** All three files use `@testing-library/react` (`render`, `screen`, `within`) and `@testing-library/user-event` exclusively. No `createRoot`, `Root`, `container`, `act`, `IS_REACT_ACT_ENVIRONMENT`, or native-setter hacks. Tests remain async where interactions are involved. Coverage is maintained or improved.
- **Constraints:**
  - `TargetActionModal` has no `aria-label` on its number/text inputs — only `placeholder` attributes and an `aria-label` on the damage-type `<select>`. Tests will use `getByPlaceholderText` for unlabelled inputs; the select uses `getByRole('combobox', { name: /damage type/i })`.
  - `CreatureStatsForm` renders three groups of 13 damage-type checkboxes (39 total). Checkbox names repeat across groups (e.g. "fire" appears in Vulnerabilities, Resistances, and Immunities). Scoped queries via `within()` are required to disambiguate.
  - `EditorShell` buttons have no explicit `aria-label`; they carry text content ("Save" / saveLabel, "Cancel"). `getByRole('button', { name: /save/i })` and `getByRole('button', { name: /cancel/i })` work correctly.
- **Assumptions:**
  - RTL cleanup between tests is automatic (no manual `afterEach` teardown required).
  - `@jest-environment jsdom` doc comment is still required per jest config.
  - `IS_REACT_ACT_ENVIRONMENT = true` global can be removed — RTL wraps act internally.
  - Test case count may change if the structure is improved, as long as coverage is maintained or increased.
- **Edge cases considered:**
  - `CreatureStatsForm` pre-selected resistance rendering: with RTL, `within()` scoping on the section container is needed to count or target checked checkboxes per group.
  - `TargetActionModal` damage apply with a type changes the button label to `Apply (fire)` — RTL regex `getByRole('button', { name: /apply/i })` must be precise enough to not match the "Apply Damage" button on the main screen (that button is gone after navigation).
  - `TextInputField.onChange` test currently uses the native prototype setter hack. RTL's `userEvent.type` replaces this cleanly.

## Scope

### In Scope

- Migrate `tests/unit/components/ui.test.tsx` to RTL
- Migrate `tests/unit/components/TargetActionModal.test.tsx` to RTL
- Migrate `tests/unit/components/CreatureStatsForm.test.tsx` to RTL (resistances section only — the existing tests only cover the resistances/immunities subsection; ability scores and skills are not currently tested and are out of scope for new test cases)
- Remove `IS_REACT_ACT_ENVIRONMENT` global and dead `createRoot`/`Root`/`act` imports from migrated files
- Delete `tests/unit/helpers/reactRoot.ts` once it has no remaining consumers (confirm after #260 completes or check at implementation time)

### Out of Scope

- Adding new test cases beyond what's needed to match or improve current coverage
- Migrating any test files not listed above
- Adding `aria-label` or other accessibility attributes to the source components (a separate concern)
- Migrating `AlignmentSelect.test.tsx`, `NavBar.test.tsx`, `CreatureStatBlock.test.tsx` (those are issue #260)

## What Changes

- `tests/unit/components/ui.test.tsx` — full rewrite in RTL; removes `createReactRoot`/`unmountReactRoot` helper usage
- `tests/unit/components/TargetActionModal.test.tsx` — full rewrite in RTL; removes `findButton()`, `changeInputValue()`, `createRoot`/`Root`/`act`
- `tests/unit/components/CreatureStatsForm.test.tsx` — full rewrite in RTL; uses `within()` for checkbox scoping
- `tests/unit/helpers/reactRoot.ts` — deleted if no remaining consumers after #260 migration (verified at implementation time)

## Risks

- **Risk:** Test coverage regression on `CreatureStatsForm` (currently 32% statement coverage).
  - **Impact:** Medium — existing tests are already sparse; migration must at minimum preserve them.
  - **Mitigation:** Run `npm test -- --coverage` before and after; fail the PR if coverage drops.

- **Risk:** RTL's `userEvent.type` behaves differently from the native setter hack for controlled inputs — React state may update differently.
  - **Impact:** Low — RTL's simulation is more realistic; the component's `onChange` handlers respond to native input events which `userEvent` fires correctly.
  - **Mitigation:** Run all tests after each file migration and address failures before moving on.

- **Risk:** `within()` scoping logic for `CreatureStatsForm` is structurally coupled to the component's DOM layout. If the layout changes, tests break.
  - **Impact:** Low — this is a known RTL tradeoff for components without explicit region roles.
  - **Mitigation:** Document the scoping approach in the test file with a short comment explaining the DOM dependency.

- **Risk:** `helpers/reactRoot.ts` may still be used by files not yet migrated in #260 at implementation time.
  - **Impact:** Low — safe to leave the file in place if consumers remain; delete only when count is zero.
  - **Mitigation:** `grep -r "reactRoot"` at implementation time; delete only if the result is empty.

## Open Questions

No unresolved ambiguity exists. The user confirmed:
- Migration order: `ui.test.tsx` first, then `TargetActionModal.test.tsx`, then `CreatureStatsForm.test.tsx`
- Test structure may change (not required to be 1:1 with the old tests)
- Goal is same or better coverage using RTL, not strict case-by-case preservation
- `helpers/reactRoot.ts` deletion is conditional on zero remaining consumers
- Issue #260 (simpler files) is being handled on a separate thread in parallel

## Non-Goals

- Adding new source code features or fixing bugs in the migrated components
- Full coverage improvement for `CreatureStatsForm` (that is a separate issue)
- Enforcing RTL for test files outside the three listed
- Touching CI configuration

## Change Control

If scope changes after proposal approval, update `openspec/changes/rtl-migrate-modal-form-ui-tests/proposal.md`, `design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.
