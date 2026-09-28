# Tasks

## Preparation

- [ ] **Step 1 — Confirm dedicated worktree exists:** the worktree `.worktrees/fix-party-campaign-authz` (branch `fix-party-campaign-authz`, based on `origin/main`) was created during `/opsx:propose`. Confirm it still exists (`git worktree list`); if missing, recreate with `git fetch origin main && git worktree add .worktrees/fix-party-campaign-authz -b fix-party-campaign-authz origin/main` from the primary checkout.
- [ ] **Step 2 — Confirm working branch is published:** from inside `.worktrees/fix-party-campaign-authz`, confirm `fix-party-campaign-authz` exists on `origin` (`git ls-remote --heads origin fix-party-campaign-authz`); if not, `git push -u origin fix-party-campaign-authz`.

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If not listed, halt, inform the user the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 782 --add-label "in-progress"`. Discover the GitHub Project linked to `dougis-org/session-combat` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the item via `gh project item-edit`. If no project item is found for issue #782, log a warning and continue. If the `gh` token lacks the `project` scope, instruct the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] **Task 1 — Add `PartyCampaignAuthorizationError`:** in `lib/storage/errors.ts`, add `export class PartyCampaignAuthorizationError extends Error` constructed with `campaignId` and `userId` fields, following the existing `StorageError` style (name set in constructor, `Error.captureStackTrace` guard). *(Design: Decision 2)*
- [ ] **Task 2 — Add `campaignId` classification helper:** in `lib/validation/core.ts`, add a helper (e.g. `parseCampaignIdInput(value: unknown): { kind: 'omit' } | { kind: 'invalid' } | { kind: 'set'; value: string }`) implementing: `undefined` → `omit`; `typeof value === 'string'` → `set` with `value.trim()`; anything else → `invalid`. *(Design: Decision 3)*
- [ ] **Task 3 — Gate `addPartyToCampaign` on active DM membership:** in `lib/storage/partyRepo.ts`, change `addPartyToCampaign(campaignId: string, partyId: string)` to `addPartyToCampaign(campaignId: string, partyId: string, callerId: string)`. As the first step inside `runStorageOp`'s callback, call `getMember(campaignId, callerId)` (already imported in this file) and throw `PartyCampaignAuthorizationError` unless the result has `role === 'dm'` and `status === 'active'`. *(Design: Decision 1)*
- [ ] **Task 4 — Extract `reassignPartyCampaign` into `partyRepo`, authorizing both the removal and the addition:** move the `reassignCampaign` function body out of `app/api/parties/[id]/route.ts` into `lib/storage/partyRepo.ts` as `export async function reassignPartyCampaign(updatedParty: Party, campaignId: unknown, existingCampaignId: string | undefined, callerId: string): Promise<void>`, using `parseCampaignIdInput` (Task 2) in place of the current ad hoc `typeof campaignId === 'string' ? campaignId.trim() : ''` coercion:
  - `omit` → return immediately (no change requested; no `getMember` lookup at all).
  - `invalid` → throw a validation error the route can map to 400 (or, simpler, keep classification in the route and only pass already-validated `set`/`omit` results into this function — implementer's call, document the choice actually taken).
  - `set` (link, relink, or unlink) → **before** calling `removePartyFromAllCampaigns`, if `existingCampaignId` is present, call `getMember(existingCampaignId, callerId)` and throw `PartyCampaignAuthorizationError` unless the result has `role === 'dm'` and `status === 'active'` — this is what authorizes the removal side and closes the gap where a non-DM could unlink `campaignId: ''` without being DM of the campaign being removed. Skip this check only when there is no `existingCampaignId` (nothing to remove). Then, if the new value is non-empty, call `addPartyToCampaign(value, updatedParty.id, callerId)` (which independently authorizes the *new* campaign per Task 3).
  *(Design: Decision 1, Decision 3 — this task directly implements the fix for the Verity pre-commit finding that the original unlink path had no authorization at all.)*
- [ ] **Task 5 — Update `POST /api/parties`:** in `app/api/parties/route.ts`, after existing `characterIds` validation, run the new `campaignId` classification (Task 2); on `invalid`, return 400 immediately. Pass `auth.userId` as the new `callerId` argument to `partyRepo.addPartyToCampaign`. Wrap the existing `addPartyToCampaign` call (and its existing compensating `deleteParty` rollback) so a caught `PartyCampaignAuthorizationError` still triggers rollback and returns 403 instead of falling through to the generic 500 handler. *(Design: Decisions 1-3)*
- [ ] **Task 6 — Update `PUT /api/parties/[id]`:** in `app/api/parties/[id]/route.ts`, immediately after `await request.json()` and before destructuring, add the body-shape guard (`typeof body === 'object' && body !== null && !Array.isArray(body)`), returning 400 on failure. Replace the call to the now-removed local `reassignCampaign` with `partyRepo.reassignPartyCampaign(updatedParty, campaignId, existingParty.campaignId, auth.userId)`. Catch `PartyCampaignAuthorizationError` before the generic `catch (error)` block and return 403. *(Design: Decision 1, Decision 3, body-shape guard)*
- [ ] **Task 7 — Update existing unit tests:** in `tests/unit/api/parties/route.test.ts`, update the `jest.mock("@/lib/storage/partyRepo", ...)` mock to include `reassignPartyCampaign` and reflect `addPartyToCampaign`'s new 3-arg signature; update any existing assertions that checked `addPartyToCampaign`/`removePartyFromAllCampaigns` call arguments for the old 2-arg shape.
- [ ] **Task 8 — Add new unit tests per `specs/party-campaign-authorization/spec.md`:** add test cases (in `tests/unit/api/parties/route.test.ts` for route-level behavior, and in `partyRepo`'s own test file, e.g. `tests/unit/storage/partyRepo.test.ts` if it exists or a new file if not, for repo-level behavior) covering every scenario listed in the spec: non-DM rejected (403), DM-of-different-campaign rejected (403), non-string `campaignId` rejected (400) for each of `null`/number/boolean/array/object, omitted `campaignId` is a no-op with no `getMember` lookup performed, empty-string `campaignId` unlink succeeds *only* when the caller is an active DM of the currently-linked campaign, a **non-DM (or DM of an unrelated campaign) sending `campaignId: ''` is rejected with 403 and `removePartyFromAllCampaigns` is never called** (this is the negative test for the removal-side authorization added in Task 4), valid DM link/relink succeeds, non-object PUT body rejected (400) for each of `null`/array/string/number, direct `partyRepo.addPartyToCampaign` call (not through a route) with non-DM `callerId` throws, direct `partyRepo.reassignPartyCampaign` call with non-DM `callerId` for the existing campaign throws before removal.
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — confirmed during design: reuse `membershipRepo.getMember` (already imported in `partyRepo.ts`) rather than adding a new membership-lookup path; reuse `lib/validation/core.ts` as the home for the new `campaignId` validator rather than creating a new validation module.
- [ ] Confirm acceptance criteria in `specs/party-campaign-authorization/spec.md` are covered by the tests added in Task 8.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests: `npm run test:unit` and `npm run test:integration`
- [ ] Run E2E tests: not applicable — no UI change in this PR; skip `test:e2e`
- [ ] Run type checks: `npm run typecheck`
- [ ] Run build: `npm run build`
- [ ] Run security/code quality checks required by project standards: Verity pre-commit/pre-push gate (runs automatically via `.husky/_` hooks — do not bypass with `--no-verify`); resolve any findings per `CLAUDE.md`'s waiver policy if a human explicitly accepts one
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against `main`) and check whether every changed file ends in `.md`. This change touches `.ts` files, so the **full path** applies.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — not applicable (no UI change); skip
- **Build** — `npm run build`; must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix-party-campaign-authz` to `main`. PR body **must include `Closes #782`**.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 782 --add-label "in-review" --remove-label "in-progress"`. Move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same discovery pattern as the in-progress step; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`; use `--squash` per repo convention if the ruleset requires it — confirm merge method allowed by the repo's branch protection before running)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved (remember: after replying, resolve threads via the `resolveReviewThread` GraphQL mutation — replying alone does not resolve them)
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): `pr-review-toolkit:review-pr` (automated), plus any human reviewer the repo's branch protection requires
- Required approvals: per repo branch protection ruleset on `main`

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change — none expected (no `docs/` content describes party-campaign linking authorization today); confirm during apply and add a note only if a relevant doc is found
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `openspec/changes/fix-party-campaign-authz/specs/party-campaign-authorization/spec.md` to `openspec/specs/party-campaign-authorization/spec.md`, updating relative links to `../../changes/archive/YYYY-MM-DD-fix-party-campaign-authz/design.md` and `.../tasks.md`
- [ ] Archive the change: move `openspec/changes/fix-party-campaign-authz/` to `openspec/changes/archive/YYYY-MM-DD-fix-party-campaign-authz/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-party-campaign-authz/` exists and `openspec/changes/fix-party-campaign-authz/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-fix-party-campaign-authz` then `git push -u origin doc/archive-YYYY-MM-DD-fix-party-campaign-authz`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-fix-party-campaign-authz` to `main` with title `docs: archive fix-party-campaign-authz (YYYY-MM-DD)` — **do NOT push directly to `main`**. This PR must be docs-only (no code changes) per project convention.
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin`; use `--squash`)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix-party-campaign-authz doc/archive-YYYY-MM-DD-fix-party-campaign-authz`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/fix-party-campaign-authz`

Required cleanup after archive: `git fetch --prune` and `git branch -D fix-party-campaign-authz doc/archive-YYYY-MM-DD-fix-party-campaign-authz`
