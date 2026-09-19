# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during proposal — worktree `.worktrees/validate-session-post-body` created from `origin/main`
- [x] **Step 2 — Create and publish working branch:** done during proposal — `validate-session-post-body` branch pushed to `origin`

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — this change is issue-driven (GitHub #562). Run `gh issue edit 562 --add-label "in-progress"`. Then discover the GitHub Project linked to `dougis-org/session-combat` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, instruct the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] **1. `zodErrorResponse` shared helper (TDD)**
  - [ ] Write failing tests at `tests/unit/lib/server/zodErrorResponse.test.ts`: given a `ZodError` with issues (with and without a `path`), assert the returned `NextResponse` has `status: 400` and body `{ error: "<field>: <message>" }` or `{ error: "<fallbackMessage>" }` when no path — matching today's inline logic in `app/api/campaigns/[id]/rolls/route.ts:30-35` exactly
  - [ ] Implement `lib/server/zodErrorResponse.ts` exporting `zodErrorResponse(error: z.ZodError, fallbackMessage: string): NextResponse`
  - [ ] Confirm new tests pass
- [ ] **2. Refactor `rolls/route.ts` to use `zodErrorResponse` (no behavior change)**
  - [ ] Replace the inline block at `app/api/campaigns/[id]/rolls/route.ts:31-35` (POST) with `zodErrorResponse(parsed.error, 'Invalid roll payload')`
  - [ ] Replace the inline block at `app/api/campaigns/[id]/rolls/route.ts:97-101` (GET) with `zodErrorResponse(parsedQuery.error, 'sessionId is required')`
  - [ ] Run existing `tests/unit/api/campaigns/[id]/rolls.route.test.ts` — must pass unmodified (proves byte-identical extraction); do not edit this test file as part of this step
- [ ] **3. `sessionLogSubmissionSchema` (TDD)**
  - [ ] Write failing tests at `tests/unit/lib/validation/sessionLog.test.ts` covering every scenario in `openspec/changes/validate-session-post-body/specs/session-log-validation/spec.md`: missing/unparseable `datePlayed`; valid ISO `datePlayed`; oversized/at-bound/omitted `title` (200-char bound); oversized/at-bound/omitted `summary` (10,000-char bound); event with invalid `type`; event missing `description`; event with oversized `description` (2,000-char bound); non-array `events`; full-shape `combat_completed` event accepted; minimal `custom` event accepted; omitted `events` defaults to `[]`; oversized/at-bound `events` array (200-element bound)
  - [ ] Implement `lib/validation/sessionLog.ts`: `sessionEventSchema` (mirrors `SessionEvent` in `lib/types.ts:689-700` field-for-field) and `sessionLogSubmissionSchema` (`datePlayed`, `title`, `summary`, `events` only — per design.md Decision 1, does NOT include `sessionNumber`/`milestone`/`newLevel`), following `lib/validation/rollSubmission.ts`'s style (bound constants as named, documented exports; `zod`-only imports, no `next/*` or storage imports)
  - [ ] Confirm new tests pass
- [ ] **4. Rewrite `sessions/route.ts` POST body handling (TDD)**
  - [ ] Write failing tests at `tests/unit/api/campaigns/[id]/sessions.route.test.ts` (extend existing file if present) covering: 413 on oversized body; 400 on each validation failure from step 3, surfaced through the actual route; 201 on a valid payload with the full event shape; 201 on a valid payload with a minimal custom event; **regression** — invalid/missing `sessionNumber` still resolves via `getNextSessionNumber` fallback (unchanged); **regression** — `getNextSessionNumber` throwing still returns `503`/`SESSION_NUMBER_UNAVAILABLE` (unchanged)
  - [ ] Add `SESSION_BODY_MAX_BYTES = 64 * 1024` constant to `app/api/campaigns/[id]/sessions/route.ts` (mirrors `ROLL_BODY_MAX_BYTES` in `rolls/route.ts:15`)
  - [ ] Replace `const body = await request.json();` and the inline `datePlayed`/`title`/`summary`/`events` handling with: `readBoundedJson(request, SESSION_BODY_MAX_BYTES)` → on failure, mirror `rolls/route.ts`'s 413/400/500 handling for `oversize`/`invalid-json`/other → `sessionLogSubmissionSchema.safeParse(read.value)` → on failure, `zodErrorResponse(parsed.error, 'Invalid session log payload')`
  - [ ] Leave the `sessionNumber`/`getNextSessionNumber`/`SESSION_NUMBER_UNAVAILABLE` block (current lines ~34-46) and the `milestone`/`newLevel` handling completely untouched — only the surrounding field extraction changes from destructuring raw `body` to destructuring `parsed.data` plus the still-raw `sessionNumber`/`milestone`/`newLevel` from `read.value`
  - [ ] Confirm new and existing session-route tests pass
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — confirmed during design: reuse `readBoundedJson`, `zod`, and the `rollSubmission.ts`/`rolls/route.ts` pattern rather than introducing new validation machinery
- [ ] Confirm acceptance criteria are covered — cross-check every scenario in `openspec/changes/validate-session-post-body/specs/session-log-validation/spec.md` against the tests written in steps 1-4

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests — `npm run test:unit` (per project convention; do not use `npm test`, no such script exists)
- [ ] Run E2E tests (if applicable) — not applicable; this change is server-side validation logic with no UI surface change
- [ ] Run type checks
- [ ] Run build
- [ ] Run security/code quality checks required by project standards — Verity gate must pass without a waive (this change exists specifically to resolve a Verity finding)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change modifies `.ts` files, so the **full path** applies.

**Full path**:

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `validate-session-post-body` to `main`. PR body MUST include `Closes #562`.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 562 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (this repo's ruleset only allows squash merges — `--merge` causes a BLOCKED state; NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, and resolve the thread via the GraphQL `resolveReviewThread` mutation after replying (per prior project experience: replying alone does not resolve a thread); wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: Claude (this session), on behalf of doug@dougis.com
- Reviewer(s): `pr-review-toolkit:review-pr` automated gate; human reviewer per repo branch protection
- Required approvals: per repo branch protection rules (squash-merge only, per prior project convention)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan (per repo CLAUDE.md: fix the finding; only `verity waive` with an explicit human-approved, cited reason — never on own judgment or to get past a block)
- Review comment → address → commit → validate locally → push → confirm resolved (reply AND resolve via GraphQL `resolveReviewThread`)

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change — none expected (internal validation hardening, no public API/doc surface change)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `openspec/changes/validate-session-post-body/specs/session-log-validation/spec.md` to `openspec/specs/session-log-validation/spec.md`, updating its `[design.md](../../design.md)` reference to `[design.md](../../changes/archive/YYYY-MM-DD-validate-session-post-body/design.md)`
- [ ] Archive the change: move `openspec/changes/validate-session-post-body/` to `openspec/changes/archive/YYYY-MM-DD-validate-session-post-body/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-validate-session-post-body/` exists and `openspec/changes/validate-session-post-body/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-validate-session-post-body` then `git push -u origin doc/archive-YYYY-MM-DD-validate-session-post-body`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-validate-session-post-body` to `main` with title `docs: archive validate-session-post-body (YYYY-MM-DD)` — **do NOT push directly to `main`**. Per prior project experience: this PR must be docs-only — any accompanying code fix belongs on a separate hotfix branch, never mixed into the archive branch.
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Close out issue lifecycle: confirm #562 was auto-closed by `Closes #562` on merge; if not, close manually and remove the "in-review" label
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D validate-session-post-body doc/archive-YYYY-MM-DD-validate-session-post-body`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/validate-session-post-body`

Required cleanup after archive: `git fetch --prune` and `git branch -D validate-session-post-body doc/archive-YYYY-MM-DD-validate-session-post-body`
