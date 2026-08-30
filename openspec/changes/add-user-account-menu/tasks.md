# Tasks

Change: `add-user-account-menu` · Issue-driven: `dougis-org/session-combat#611`
· Default branch: `main` · Working branch: `add-user-account-menu`
· Worktree: `.worktrees/add-user-account-menu`

Ownership metadata:

- Implementer: agent (executing `/opsx:apply`)
- Reviewer(s): dougis (human) + `pr-review-toolkit:review-pr` sub-agent gate
- Required approvals: 1 human approval on the implementation PR; doc PR may
  auto-merge after CI

## Preparation

- [x] **Step 1 — Sync default branch:** from the primary checkout,
  `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Working branch already exists:** branch `add-user-account-menu`
  and its worktree `.worktrees/add-user-account-menu` were created during
  propose and pushed to `origin`. Confirm with `git worktree list` and
  `git ls-remote --heads origin add-user-account-menu`; recreate only if absent.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the
  available skills list for `pr-review-toolkit:review-pr`. If it is not listed,
  halt immediately, tell the user the plugin is required, provide installation
  guidance, and do not proceed until the user confirms it is installed.
- [x] Confirm `openspec-review-code` skill is available (used before every
  commit).

## Execution

- [x] **Step 1 — Confirm worktree:** ensure `.worktrees/add-user-account-menu`
  exists and `cd` into it. All implementation happens here, never in the primary
  checkout.
- [x] **Step 2 — Confirm branch pushed:** `git -C .worktrees/add-user-account-menu status -sb`
  shows tracking `origin/add-user-account-menu`; if not, `git push -u origin add-user-account-menu`.
- [x] **Issue lifecycle: mark in-progress** — run
  `gh issue edit 611 --add-label "in-progress"`. Discover the linked GitHub
  Project (`gh project list --owner dougis-org --format json`), resolve the
  status field option matching "In Progress"
  (`gh project field-list <project-number> --owner dougis-org --format json`),
  and move the item via `gh project item-edit`. If no project item is found, log
  a warning and continue. If the `gh` token lacks `project` scope, tell the user
  to run `gh auth refresh -s project` and skip the project-item update (the
  label update still proceeds).

### Dependency

- [x] Add the Radix menu primitive: `npm install radix-ui` (unified package).
  Before committing the lockfile, inspect the resolved version's
  `peerDependencies` and confirm `react@^19` is included; pin an exact version
  in `package.json` (no `^`). If the resolved version does not support React 19,
  fall back to `@headlessui/react@^2` (design Decision 1 alternative) and note
  the substitution in `design.md` and the PR.
  - Verify: `npm ls radix-ui` resolves; `npm run build` still succeeds.

### Display helper (TDD — tests first)

- [x] Write `tests/unit/lib/userMenuDisplay.test.ts` covering
  `deriveUserMenuDisplay`:
  - `"douglas"` → `{ label: "douglas", initials: "D" }`
  - `"Douglas Adams"` → `{ label: "DA", initials: "DA" }`
  - `"stridertheranger"` (>8, single token) → `{ label: "S", initials: "S" }`
  - `"Al"` → `{ label: "Al", initials: "A" }`
  - `undefined`, `""`, `"   "` → `{ label: "Account", initials: "AC" }`
  - `"  jo  bloggs  "` (extra whitespace) → `{ label: "JB", initials: "JB" }`
  - `"<b>x</b>"` → returns literal-derived value, never throws
  - non-ASCII token (e.g. `"Þórr"`) → first code point uppercased, never throws
  - Verify: `npm run test:unit -- userMenuDisplay` fails (red) before implementing.
- [x] Implement `lib/components/userMenuDisplay.ts` exporting
  `deriveUserMenuDisplay(username?: string): { label: string; initials: string }`
  per design Decision 3.
  - Verify: `npm run test:unit -- userMenuDisplay` passes (green).

### UserMenu component (TDD — tests first)

- [x] Write `tests/unit/components/UserMenu.test.tsx` (mock `useAuth`), covering
  spec `user-account-menu` scenarios:
  - renders nothing when `isAuthenticated: false`
  - renders nothing when `loading: true`
  - authenticated + `username: "douglas"` → trigger visible text `"douglas"`,
    `aria-label="douglas"`, `data-testid="user-menu-trigger"`
  - authenticated + `username: "Douglas Adams"` → trigger text `"DA"`,
    `aria-label="Douglas Adams"`
  - authenticated + `username: undefined` → `aria-label="Account"`, non-blank
  - username `"<b>x</b>"` renders as literal text, no `<b>` created from it
  - open via click and via keyboard (`Enter` / `ArrowDown` on focused trigger);
    menu has role `menu`, item has role `menuitem`, trigger reflects
    `aria-expanded`
  - `Escape` closes the menu and returns focus to the trigger
  - outside click closes the menu without activating the item
  - activating `Logout` (which has `data-testid="logout-button"`) calls the
    mocked `logout` exactly once; menu contains no other item
  - `logout` resolving after a tick + auth flip to unauthenticated → trigger
    unmounts with no thrown error
  - Verify: suite is red before implementation.
- [x] Implement `lib/components/UserMenu.tsx` (`'use client'`) per design
  Decisions 2 & 4:
  - gate on `isAuthenticated && !loading`
  - Radix `DropdownMenu` trigger = badge button showing
    `deriveUserMenuDisplay(user.username).label`, `aria-label` + `title` = full
    username (or `"Account"`), `data-testid="user-menu-trigger"`, `truncate` +
    bounded `max-width`
  - `DropdownMenu.Content` with `align="end"` + `collisionPadding`
  - single `DropdownMenu.Item` `Logout`, `data-testid="logout-button"`,
    `onSelect={() => void logout()}`
  - Tailwind classes consistent with the existing dark nav palette
  - Verify: `npm run test:unit -- UserMenu` passes; `npm run lint` (jsx-a11y)
    clean for the new file.

### NavBar wiring

- [x] Update `tests/unit/components/NavBar.test.tsx`:
  - keep "does not show logout button when not authenticated / while loading"
    (now also assert no `user-menu-trigger`)
  - replace "shows logout button when authenticated" with: shows
    `user-menu-trigger` when authenticated and not loading
  - replace "calls logout when logout button clicked" with: open the account
    menu, click `logout-button`, expect `logout` called once
  - add: `?` feedback button still present when authenticated
  - add: no top-level `Logout` button as a direct child of the nav row
  - Verify: suite is red against current `NavBar`.
- [x] Edit `lib/components/NavBar.tsx`: remove the inline `Logout` `<button>`;
  render `<UserMenu />` as the rightmost element (after the `?` button, which
  keeps `ml-auto`). Keep the invitations link and the auth/loading gates.
  - Verify: `npm run test:unit -- NavBar` passes.

### E2E migration

- [x] Update `tests/e2e/helpers/actions.ts`: the post-login authenticated-state
  wait currently asserts `[data-testid="logout-button"]` is visible (lines ~73,
  ~100). Switch to waiting on `[data-testid="user-menu-trigger"]` (the
  logout button is no longer in the DOM until the menu is opened).
- [x] Update `tests/e2e/auth.spec.ts` "logout clears client storage and
  redirects to login" (~line 435): first click
  `[data-testid="user-menu-trigger"]`, then click
  `[data-testid="logout-button"]` inside the opened menu; keep the storage +
  redirect assertions.
- [x] `grep -rn "logout-button" tests/` and confirm every remaining hit either
  opens the menu first or is an absence assertion.
  - Verify: `npm run test:e2e -- auth.spec.ts` passes (use a free port, not
    3000).

### Housekeeping

- [x] Update `.wolf/anatomy.md`: add entries for
  `lib/components/UserMenu.tsx`, `lib/components/userMenuDisplay.ts`,
  `tests/unit/components/UserMenu.test.tsx`,
  `tests/unit/lib/userMenuDisplay.test.ts`; update the `NavBar.tsx` entry.
- [x] Append the session line(s) to `.wolf/memory.md`.
- [x] If any file was edited more than twice or a test/build failed during
  implementation, log it to `.wolf/buglog.json` per project protocol.
- [x] Record the `next build` First Load JS delta (before vs after) for the PR
  description.

- [x] Implement sub-tasks in small, testable increments
- [x] Look for existing tooling or functions in the codebase that can be reused
  or extended before writing new logic from scratch (checked: no existing
  menu/dropdown primitive; `useAuth` reused as-is)
- [x] Confirm every acceptance criterion in
  `openspec/changes/add-user-account-menu/specs/user-account-menu/spec.md` is
  covered by a test

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the
  `openspec-review-code` skill. The primary agent automatically applies all
  clearly-correct findings directly to the code — without stopping, without
  presenting the findings list to the user, and without asking for confirmation.
  Apply fixes, re-run tests to confirm they pass, then commit.

## Validation

- [x] Run unit tests: `npm run test:unit`
- [x] Run integration tests: `npm run test:integration` (via the project
  harness, not Jest directly)
- [x] Run E2E tests: `npm run test:e2e` (at minimum `auth.spec.ts` and any spec
  touching `actions.ts`; use a free port, not 3000)
- [x] Run type checks: `npm run typecheck`
- [x] Run build: `npm run build`
- [x] Run lint / code quality: `npm run lint` (must be clean, incl. jsx-a11y)
- [x] Run any Verity / Codacy gate required by project standards
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Determine whether the change is **docs-only**: `git diff --name-only main...HEAD`
— if every changed file ends in `.md`, use the docs-only path; otherwise the
full path. (This change touches `.tsx`/`.ts`/`package.json` → **full path**.)

**Full path:**

- **Unit tests** — `npm run test:unit`; all pass
- **Integration tests** — `npm run test:integration`; all pass
- **Regression / E2E tests** — `npm run test:e2e`; all pass
- **Build** — `npm run build`; succeeds with no errors

**Docs-only path:** build only; skip integration and E2E.

If ANY required step fails, iterate and fix before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings
  addressed before the final commit
- [x] Commit all changes to `add-user-account-menu` and push to remote
- [x] Open PR from `add-user-account-menu` to `main`. **PR body MUST include
  `Closes #611`** (unconditionally). Include the First Load JS delta and the
  chosen menu library + version.
- [x] **Issue lifecycle: mark in-review** — run
  `gh issue edit 611 --add-label "in-review" --remove-label "in-progress"`, then
  move the project item to the status column matching "In Review" via
  `gh project item-edit` (same discovery as in-progress; warn and skip if not
  found).
- [x] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all
  findings (commit, run [Remote push validation], push, re-run) until zero
  findings remain. If findings persist after 3+ iterations with no progress,
  report the stall with remaining findings and wait for human guidance.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):**
  `gh pr merge <PR-URL> --auto --merge` (NEVER `--admin`, never bypass branch
  protection)
- [ ] **Iterate until merged** — repeat until
  `gh pr view <PR-URL> --json state` returns `MERGED` (if `CLOSED`, exit and
  notify the user):
  1. **Build and tests** — run [Remote push validation]; fix failures, commit,
     push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address
     every unresolved thread, commit, validate, push, wait 180s; repeat until
     all resolved. Resolve every comment before merge (project rule).
  3. **CI check failures** — after comments are resolved, poll
     `gh pr checks <PR-URL>`; fix failing required checks, commit, validate,
     push, wait 180s; restart from step 1

Blocking resolution flow:

- CI failure → diagnose → fix → commit → validate locally → push → re-run checks
- Security finding (e.g. dependency advisory on the menu library) → remediate
  (pin patched version or switch to the Headless UI alternative) → commit →
  validate → push → re-scan. Never `verity waive` on agent judgment.
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (README nav
  screenshots/notes if any; `.wolf/anatomy.md` already updated)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy
  `openspec/changes/add-user-account-menu/specs/user-account-menu/spec.md` to
  `openspec/specs/user-account-menu/spec.md`, and rewrite relative links —
  `../../design.md` → `../../changes/archive/YYYY-MM-DD-add-user-account-menu/design.md`
  (and similarly for `../../tasks.md`). Also update the "MODIFIED Requirements"
  content against the real navigation capability if one is later introduced.
- [ ] Archive the change: move
  `openspec/changes/add-user-account-menu/` to
  `openspec/changes/archive/YYYY-MM-DD-add-user-account-menu/` and stage the new
  location + deletion of the old location in a **single** commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-add-user-account-menu/`
  exists and `openspec/changes/add-user-account-menu/` is gone
- [ ] Create a doc branch: `git checkout -b doc/archive-YYYY-MM-DD-add-user-account-menu`
  then `git push -u origin doc/archive-YYYY-MM-DD-add-user-account-menu`
- [ ] Open a PR from that doc branch to `main` titled
  `docs: archive add-user-account-menu (YYYY-MM-DD)` — do NOT push directly to
  `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR:
  `gh pr merge <DOC-PR-URL> --auto --merge` (never `--admin`)
- [ ] Monitor the doc PR until merged (same loop as the implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and
  `git branch -D add-user-account-menu doc/archive-YYYY-MM-DD-add-user-account-menu`
- [ ] Remove the change's worktree:
  `git worktree remove .worktrees/add-user-account-menu` (use `--force` if the
  openspec-shared submodule blocks removal, per known project gotcha)
- [ ] If a `verity reflect` / post-task reflection is requested, run it
