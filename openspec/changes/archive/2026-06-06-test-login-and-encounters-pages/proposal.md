## GitHub Issues

- #377

## Why

- **Problem statement:** `app/login/page.tsx` and `app/encounters/page.tsx` have zero unit test coverage. The gap was surfaced by Codacy during the PR #375 review but pre-dates that PR.
- **Why now:** Coverage gaps in authentication and core feature pages carry real regression risk. The Codacy report makes the gap visible; closing it now prevents silent breakage as these pages evolve.
- **Business/user impact:** LoginPage is the entry point for all users. EncountersContent + EncounterEditor manage a core game-play resource. Regressions here are high-visibility and user-facing.

## Problem Space

- **Current behavior:** No test files exist for `app/login/page.tsx` or `app/encounters/page.tsx`. `EncounterEditor` is a private function inside `page.tsx`, making it untestable without source changes.
- **Desired behavior:** LoginPage, EncountersContent, and EncounterEditor each have dedicated unit test files under `tests/unit/components/`, exercising rendering, user interactions, API calls, error handling, and navigation.
- **Constraints:**
  - Tests must live under `tests/unit/components/` to be picked up by `npm run test:unit`
  - Must follow the established RTL + `userEvent.setup()` pattern (not static calls)
  - Must mock `fetch`, `useRouter`, `useAuth`, `ProtectedRoute`, and heavy sub-components consistent with existing page tests
- **Assumptions:**
  - `EncounterEditor` will be extracted to `app/encounters/EncounterEditor.tsx` (named export) following the `CampaignEditor` convention — this is a prerequisite for the test file
  - `EncountersContent` will be exported as a named export from `app/encounters/page.tsx`
  - `MonsterEditor` (the 5-field inline editor inside EncounterEditor) is intentionally excluded — it will be consolidated and expanded in future work (#378, #379)
- **Edge cases considered:**
  - LoginPage redirect when already authenticated (useEffect on `isAuthenticated`)
  - EncountersContent delete confirmation via `window.confirm`
  - EncounterEditor Save button disabled when name is empty
  - EncounterEditor showing Create vs Edit title based on `isNew` prop

## Scope

### In Scope

- Extract `EncounterEditor` → `app/encounters/EncounterEditor.tsx` (named export)
- Export `EncountersContent` as a named export from `app/encounters/page.tsx`
- `tests/unit/components/LoginPage.test.tsx` — full coverage of LoginPage
- `tests/unit/components/EncountersPage.test.tsx` — coverage of EncountersContent (list, CRUD, error handling)
- `tests/unit/components/EncounterEditor.test.tsx` — coverage of EncounterEditor form behavior

### Out of Scope

- `MonsterEditor` tests — excluded; component will be replaced by consolidated editor in #378/#379
- `MonsterTemplateEditor` extraction — tracked separately in #378
- `app/monsters/` changes of any kind
- Moving `tests/unit/monstersPage.test.tsx` — deferred to #378
- End-to-end or integration tests

## What Changes

- `app/encounters/page.tsx`: add `export` to `EncountersContent`; remove `EncounterEditor` (moved to own file)
- `app/encounters/EncounterEditor.tsx`: new file — extracted `EncounterEditor` component with named export
- `tests/unit/components/LoginPage.test.tsx`: new test file
- `tests/unit/components/EncountersPage.test.tsx`: new test file
- `tests/unit/components/EncounterEditor.test.tsx`: new test file

## Risks

- Risk: Extraction of `EncounterEditor` introduces a regression if imports are mis-wired
  - Impact: Medium — EncounterEditor would silently stop rendering
  - Mitigation: Run full test suite after extraction before writing new tests; verify app compiles

- Risk: `window.confirm` mock for delete tests may behave differently across test environments
  - Impact: Low — jest.spyOn pattern is well-established in the project
  - Mitigation: Follow pattern from existing tests that mock browser APIs

- Risk: `EncounterEditor` uses `useAuth` to get `user.userId` for `QuickCombatantModal` — mock must provide this
  - Impact: Low — mock shape is simple
  - Mitigation: Document required mock shape in test file

## Open Questions

No unresolved ambiguity. All decisions were made during exploration:
- MonsterEditor exclusion: confirmed — excluded, pending #378/#379
- EncounterEditor extraction: confirmed — follows CampaignEditor convention
- Test file locations: confirmed — `tests/unit/components/`
- Test patterns: confirmed — RTL + jest.mock (mirrors RegisterPage, CampaignsPage, CampaignEditor)

## Non-Goals

- Increasing coverage of `MonsterEditor` in its current form
- Any UI or UX changes to the pages under test
- Changes to API routes or server-side code
- Fixing the `monstersPage.test.tsx` location issue (tracked in #378)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
