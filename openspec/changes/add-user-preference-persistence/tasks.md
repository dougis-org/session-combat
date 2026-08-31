# Tasks

Change: `add-user-preference-persistence` · Issue-driven: **#619** · Default branch: `main` · Working branch: `add-user-preference-persistence`

## Preparation

- [ ] **Step 1 — Sync default branch:** from the primary checkout, `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** the worktree branch `add-user-preference-persistence` was created during propose; confirm it exists on remote. If not: `git push -u origin add-user-preference-persistence` from inside `.worktrees/add-user-preference-persistence`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance (`/plugin` → install `pr-review-toolkit`), and do not proceed until the user confirms it is installed.
- [ ] Confirm the dedicated worktree `.worktrees/add-user-preference-persistence` exists and the `.github/openspec-shared` submodule is checked out inside it (needed for the `sdd-with-feedback-loop` schema). If missing: `git -C .worktrees/add-user-preference-persistence submodule update --init --force .github/openspec-shared`.
- [ ] Confirm `openspec validate add-user-preference-persistence` passes.

## Execution

All implementation runs inside `.worktrees/add-user-preference-persistence`.

- [ ] **Step 1 — Confirm worktree:** ensure `.worktrees/add-user-preference-persistence` exists (created during propose) and `cd` into it. If absent, from the primary checkout: `git fetch origin main` then `git worktree add .worktrees/add-user-preference-persistence -b add-user-preference-persistence origin/main`. Never checkout the working branch inside the primary checkout.
- [ ] **Step 2 — Confirm branch pushed:** `git rev-parse --abbrev-ref --symbolic-full-name @{u}` resolves to `origin/add-user-preference-persistence`; if not, `git push -u origin add-user-preference-persistence`.
- [ ] **Issue lifecycle: mark in-progress** _(issue-driven)_: run `gh issue edit 619 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, tell the user to run `gh auth refresh -s project` and skip only the project-item update (the label update still proceeds).

### Follow strict BDD/TDD — write the failing test from the spec scenario first, then implement.

- [ ] **T1 — Preference schema module** (`lib/preferences/schema.ts`)
  - [ ] Tests first (`lib/preferences/__tests__/schema.test.ts`): defaults shape; `resolvePreferences` merges deltas onto defaults, drops unknown keys, repairs wrong types, handles older `schemaVersion`; `validatePreferencePatch` rejects non-object/array/null/malformed, rejects wrong types, rejects out-of-range `chat.size`, strips unknown keys, validates `dice.color` as a short hex or `null`.
  - [ ] Implement `PreferenceValues` type, `DEFAULT_PREFERENCES`, `PREFERENCES_SCHEMA_VERSION`, `resolvePreferences(stored)`, `validatePreferencePatch(body)`.
  - [ ] v1 keys only: `dice.sendToChat: boolean`, `dice.disableAnimation: boolean | null`, `chat.pinned: boolean`, `chat.size: number` (clamp to the dock's existing min/max — reuse the constant from `lib/components/CampaignChat/useDockState.ts`), reserved `dice.color: string | null` (default `null`).
  - Covers: spec "Invalid preference updates are rejected", "User model carries optional preferences", NFAC "Corrupt or stale-version stored data".
  - Verify: `npx jest lib/preferences/__tests__/schema.test.ts`
- [ ] **T2 — User type** (`lib/types.ts`)
  - [ ] Add `preferences?: { schemaVersion: number; values: Partial<PreferenceValues>; updatedAt: Date }` to the `User` interface (import the value type from `lib/preferences/schema.ts` or co-locate).
  - Covers: spec MODIFIED "User model carries optional preferences".
  - Verify: `npm run typecheck`
- [ ] **T3 — Server storage helpers** (`lib/storage.ts` or a new `lib/storage/userPreferencesRepo.ts`)
  - [ ] Tests first (integration, `jest.integration.config.js`): `getUserPreferences(userId)` returns resolved defaults for a user with no `preferences`; `updateUserPreferences(userId, patchValues)` `$set`s only the provided nested keys plus `preferences.updatedAt` and `preferences.schemaVersion`; round-trip persist→read; both run through the storage-op/telemetry seam (spy on `runStorageOp`).
  - [ ] Implement both helpers, keyed by `_id`, executing through `runStorageOp` (decision n020). Reuse `getDatabase()` and existing `ObjectId` validation patterns (`InvalidUserIdError`).
  - Covers: spec "Preferences persist across sessions and devices", NFAC "Preference storage operations are observable".
  - Verify: `npm run test:integration -- userPreferences`
- [ ] **T4 — API route** (`app/api/me/preferences/route.ts`)
  - [ ] Tests first: 401 when unauthenticated; `GET` returns resolved defaults + `schemaVersion` for a new user; `GET` returns merged deltas for a user with stored values; `PATCH` valid partial persists and echoes the resolved result; `PATCH` non-object/array/null/malformed body → 400 with no write; `PATCH` wrong type / out-of-range → 400 no write; `PATCH` unknown keys stripped, known keys persisted; user A's `PATCH` never touches user B's document.
  - [ ] Implement `GET` and `PATCH` handlers wrapped in `withAuth` (`lib/middleware.ts`). Parse JSON with a null fallback; reject non-object before field access (decisions n021). `GET` sets `Cache-Control: no-store`. Update is `_id`-scoped from `auth.userId`; body carries no user identifier.
  - Covers: spec "Preferences load on authentication", "Changing a preference persists it" (server side), "Invalid preference updates are rejected", NFAC "Preferences are scoped to the authenticated user", "Stored preference values cannot inject markup downstream".
  - Verify: `npm run test:integration -- me/preferences` (or unit route test per repo convention)
- [ ] **T5 — Client preferences provider** (`lib/preferences/usePreferences.tsx`)
  - [ ] Tests first (`lib/preferences/__tests__/usePreferences.test.tsx`) with mocked `fetch` and `localStorage`:
    - hydration order: mirror read → `GET /api/me/preferences` → reconcile → mirror write;
    - exactly one `GET` per auth transition; none on route change;
    - `setPreference` → optimistic state + mirror write + single debounced `PATCH` (fake timers); rapid changes coalesce to one `PATCH` with the final value;
    - adoption: legacy key present + server key unset → single seeding `PATCH`; server key set → server wins, no `PATCH`;
    - cross-tab: synthetic `storage` event updates context, no `PATCH`;
    - logged-out: no `GET`/`PATCH`, mirror still read/written;
    - degradation: `localStorage` throws → in-memory update, warning logged, no throw; `PATCH` rejects → values still update, logged, retried on next `setPreference`/hydration.
  - [ ] Implement `PreferencesProvider`, `usePreferences()` returning `{ preferences, setPreference, ready }`. Reuse `LocalStore` + `safeGet`/`safeSet` semantics; single mirror key (e.g. `preferences`). Debounced PATCH; diff-before-dispatch on `storage`; never re-PATCH values received via `storage`. Read the four legacy keys (`dice-fab-send-to-chat`, `dice-fab-disable-animation`, `campaign-chat-pin`, `campaign-chat-size`) once during adoption only.
  - Covers: spec "Preferences load on authentication", "Changing a preference persists it", "Existing local preferences are adopted on first login", "Preferences sync across tabs", "Anonymous users use local-only preferences", "Preference persistence degrades gracefully", NFAC "First paint does not wait on the network", "Recovery behavior after a failed sync".
  - Verify: `npx jest lib/preferences/__tests__/usePreferences.test.tsx`
- [ ] **T6 — Mount the provider** in the App Router provider tree under the auth boundary so it hydrates once per authenticated session (locate the existing client provider wrapper via `.wolf/anatomy.md`; likely `app/` layout/providers).
  - [ ] Test: preference-bound UI renders from the mirror before the fetch resolves.
  - Covers: NFAC "Startup preference load cost" (fires concurrently with other bootstrap fetches), "First paint does not wait on the network".
  - Verify: `npm run build` + affected component tests
- [ ] **T7 — Refactor `useDiceFabPreferences`** (`lib/dice/useDiceFabPreferences.ts`)
  - [ ] Keep the exported `DiceFabPreferences` shape and the `disableAnimation` tri-state/`prefers-reduced-motion` fallback exactly as today.
  - [ ] Re-point the backing store at `usePreferences()` (`dice.sendToChat`, `dice.disableAnimation`); updates call `setPreference`.
  - [ ] Update `lib/dice/__tests__/useDiceFabPreferences*.test.ts(x)` to render within a `PreferencesProvider` test wrapper; assert existing behavior unchanged and that updates route through `setPreference`.
  - Covers: spec "Existing preference hooks keep their contract".
  - Verify: `npx jest useDiceFabPreferences`
- [ ] **T8 — Refactor `useDockState`** (`lib/components/CampaignChat/useDockState.ts`)
  - [ ] Keep the exported hook shape and pin/size semantics unchanged; map to `chat.pinned` / `chat.size` via `usePreferences()`; updates call `setPreference`.
  - [ ] Update the hook's existing test suite to use the provider wrapper.
  - Covers: spec "Existing preference hooks keep their contract".
  - Verify: `npx jest useDockState`
- [ ] **T9 — Verify `/api/auth/me` unchanged**
  - [ ] Add/confirm a test asserting the `GET /api/auth/me` body contains only `authenticated`, `userId`, `email`, `isAdmin`, `username` (no preference fields).
  - Covers: spec scenario "auth/me payload unchanged".
  - Verify: `npm run test:integration -- auth/me`
- [ ] **T10 — Docs & housekeeping**
  - [ ] Update `.wolf/anatomy.md` with the new files (`lib/preferences/schema.ts`, `lib/preferences/usePreferences.tsx`, `app/api/me/preferences/route.ts`, any new repo file) and token estimates.
  - [ ] Append implementation entries to `.wolf/memory.md`.
  - [ ] Add a `.wolf/cerebrum.md` Key Learnings entry for the preferences persistence pattern (schema + provider + mirror + storage seam).
  - [ ] Log any bug/rework to `.wolf/buglog.json` per project rules.
  - [ ] Update `README.md` / `docs/` only if a user-facing behavior description changes (no new UI expected).
- [ ] Look for existing tooling or functions to reuse before writing new logic (`LocalStore`, `runStorageOp`, `withAuth`, `getUserById`, dock size constants, `safeGet`/`safeSet` patterns).
- [ ] Confirm every acceptance scenario in `specs/user-preferences/spec.md` maps to at least one passing test.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run the affected tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit tests: `npm run test:unit`
- [ ] Run integration tests: `npm run test:integration`
- [ ] Run E2E/regression tests: `npm run test:e2e` (or `npm run test:regression`) — required (non-`.md` changes)
- [ ] Run type checks: `npm run typecheck`
- [ ] Run lint: `npm run lint`
- [ ] Run build: `npm run build`
- [ ] Run security/code-quality checks required by project standards (Codacy analysis on changed files — see `codacy` MCP / `.codacy.yml`)
- [ ] `openspec validate add-user-preference-persistence` passes
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only main...HEAD` and check whether every changed file ends in `.md`. This change touches `.ts`/`.tsx` files, so the **full path** applies.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors

**Docs-only path** (every changed file is `.md`): build only; skip integration and E2E.

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to `add-user-preference-persistence` and push to remote
- [ ] Open PR from `add-user-preference-persistence` to `main`. **PR body MUST include `Closes #619`** (unconditional). Search for and apply any `.github/pull_request_template.md`.
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 619 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress step; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (`main` is a squash-only ruleset; NEVER use `--admin`)
- [ ] **Iterate until merged** — repeat continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED`, exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, push before anything else this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit, run [Remote push validation], push, wait 180 seconds; continue until all threads resolved
  3. **CI check failures** — only after all comments resolved, poll `gh pr checks <PR-URL>`; fix failing required checks (`ci-gate`, Codacy), commit, run [Remote push validation], push, wait 180 seconds; restart from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing.

Ownership metadata:

- Implementer: agent (apply phase), overseen by @doug
- Reviewer(s): @doug + `pr-review-toolkit:review-pr` automated gate + Codacy
- Required approvals: 0 enforced by ruleset; human review by @doug expected before auto-merge given the surface area (new API route, user-model change)

Blocking resolution flow:

- CI failure → diagnose → fix → commit → [Remote push validation] → push → re-run checks
- Security finding (Codacy / security-review) on the new route or schema → treat as blocking → remediate (input validation, auth scoping) → commit → validate → push → re-scan; no suppression without a reviewed justification
- Review comment → address → commit → validate → push → confirm thread resolved
- Escalation: if any gate stays blocked > 1 working day, escalate to @doug with failing check names + logs; pause. Never push to protected branches; never `--admin` merge.

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (`.wolf/anatomy.md`, `.wolf/cerebrum.md`, README/docs if user-facing text changed)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `openspec/changes/add-user-preference-persistence/specs/user-preferences/spec.md` to `openspec/specs/user-preferences/spec.md`, updating relative links — replace `../../design.md` with `../../changes/archive/2026-08-31-add-user-preference-persistence/design.md` and `../../tasks.md` similarly. Hand-merge if `openspec archive` aborts on pre-existing malformed live specs (use `--skip-specs`).
- [ ] Archive the change: move `openspec/changes/add-user-preference-persistence/` to `openspec/changes/archive/2026-08-31-add-user-preference-persistence/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/2026-08-31-add-user-preference-persistence/` exists and `openspec/changes/add-user-preference-persistence/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-2026-08-31-add-user-preference-persistence` then `git push -u origin doc/archive-2026-08-31-add-user-preference-persistence`
- [ ] Open a PR from that doc branch to `main` titled `docs: archive add-user-preference-persistence (2026-08-31)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER `--admin`)
- [ ] Monitor the doc PR until merged (same loop as the implementation PR)
- [ ] Remove the worktree: `git worktree remove .worktrees/add-user-preference-persistence`
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D add-user-preference-persistence doc/archive-2026-08-31-add-user-preference-persistence`

Required cleanup after archive: `git fetch --prune` and `git branch -D add-user-preference-persistence doc/archive-2026-08-31-add-user-preference-persistence`, plus `git worktree remove .worktrees/add-user-preference-persistence`.
