# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/issue-443-cross-instance-transport` then immediately `git push -u origin fix/issue-443-cross-instance-transport`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress**: run `gh issue edit 443 --add-label "in-progress"`. Then discover the GitHub Project linked to `dougis-org/session-combat` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item for issue #443 via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).

### T1 — `transport.test.ts`: two-instance simulation harness (test infra only)

- [x] Add a test helper in `tests/unit/server/transport.test.ts` that constructs two independent instances of the transport module (e.g. via `jest.isolateModules` twice, each with its own mocked Mongo client/cursor/collection stubs) sharing a single fake underlying "database" (an in-memory doc store the mocks read/write through), so a write made against instance A's mocked collection is visible to instance B's mocked `watch()`/poll query.
- [x] Verify the harness alone (no product code changes yet) can prove two separate `registry` Maps exist and are independent — write a throwaway assertion, then remove it once confirmed.

### T2 — Broaden the Atlas change-stream path (Decision 1)

- [x] Write failing tests (BDD, per `specs/transport/spec.md`): "Single shared cursor covers all three collections", "Event routed to correct campaign subscribers regardless of source collection", "Session event delivered cross-instance (change-stream path)", "Roll event delivered cross-instance (change-stream path)", "Message event delivered cross-instance (change-stream path)".
- [x] Implement: change `openStream()` in `lib/server/transport.ts` from `client.db().collection('campaigns').watch(...)` to `client.db().watch(...)` (db-level), and update `demux()` to branch on `event.ns.coll` (`'campaigns'` / `'campaignMessages'` / `'campaignRolls'`) to build the correct `CampaignStreamEvent` shape (`change` / `message` / `roll`) instead of assuming `campaigns`.
- [x] Confirm existing scenarios "First subscription opens the shared change stream", "Subsequent subscriptions reuse the existing stream", "Cursor count bounded to one per process" (from `openspec/specs/transport/spec.md`) still pass unmodified against the db-level watch.
- [x] Run the new tests; iterate until green.

### T3 — Broaden the polling path (Decision 1)

- [x] Write failing tests: "Session, roll, and message events delivered cross-instance (polling path)", "Polling observes new messages and rolls, not just campaign changes".
- [x] Implement: extend `pollFn()` in `lib/server/transport.ts` to additionally query `campaignMessages` and `campaignRolls` by `campaignId` + `createdAt > since`, alongside the existing `campaigns` query, and emit the corresponding typed events.
- [x] Confirm existing scenarios "Polling emits new events since last check", "Polling skips events for other campaigns", "Polling teardown stops the interval" still pass.
- [x] Run the new tests; iterate until green.

### T4 — Session event derivation from `activeSessionId` (Decision 3)

- [x] Write failing tests: "Unrelated campaign field change does not emit a spurious session event", "activeSessionId change emits a session event", "Per-campaign session state is cleaned up when the last subscriber tears down" — for both the change-stream and polling branches.
- [x] Implement: add a per-`campaignId` last-known-`activeSessionId` map in `lib/server/transport.ts`, colocated with `registry` (per Decision 3/Open Questions — same file, same lifecycle). In the change-stream branch, use `updateDescription.updatedFields` (available via `fullDocument: 'updateLookup'`, already in use) to detect `activeSessionId` was part of the write before comparing/emitting. In the polling branch, compare the polled `campaigns` document's `activeSessionId` against the remembered value unconditionally. Remove the per-campaign entry when the last subscriber for that campaign tears down (mirror existing registry cleanup in the teardown function returned by `subscribe()`).
- [x] Run the new tests; iterate until green.

### T5 — Visibility replication in the Mongo-observed path (Decision 4)

- [x] Write failing tests: "DM-only roll withheld from a non-DM subscriber via the change-stream path", "DM-only roll delivered to the DM subscriber via the change-stream path", "Visibility enforcement applies identically in the polling path" (mirror for messages using `canSeeMessage`).
- [x] Implement: in `demux()` (change-stream branch) and the extended `pollFn()` (polling branch), when handling a `campaignMessages`/`campaignRolls` document, call `storage.listMembersForCampaign(campaignId)` (memoized per poll/change-batch to avoid redundant DB round-trips) and evaluate `canSeeMessage`/`canSeeRoll` per-subscriber (`sub.userId` in the registry case; the subscription's own `userId` in the polling case) before invoking the handler.
- [x] Run the new tests; iterate until green.

### T6 — Same-instance fast path + client-side dedup (Decision 2)

- [x] Confirm (no production code change expected here) that `app/api/campaigns/[id]/messages/route.ts`, `.../rolls/route.ts`, `.../sessions/active/route.ts` keep their existing direct `emitFiltered()` calls unchanged.
- [x] Write failing tests in `tests/unit/server/transport.test.ts`: "Same-instance subscriber receives the fast-path delivery immediately" (assert the handler is called synchronously within the `emitFiltered()` call, independent of any change-stream/poll cycle).
- [x] Write failing tests in `tests/unit/components/CampaignChat.test.tsx`: "Duplicate delivery deduped by id" — deliver the same roll/message `id` twice through `onStreamEvent` (simulating fast-path + Mongo-observed redelivery) and assert the feed length increases by exactly one.
- [x] Verify `onSessionChange`/`setActiveSessionId` is naturally idempotent under redelivery of the same `activeSessionId` value (add a small assertion/test if not already covered) — no new dedup logic expected to be needed here.
- [x] Run the new tests; iterate until green.

### T7 — Update architecture docs

- [x] Update `docs/multi-user-campaigns/04-realtime-transport.md`: revise the "Component layout" and "Transport selection" mermaid diagrams and surrounding text to reflect the db-level watch across `campaigns`/`campaignMessages`/`campaignRolls`, the derived `session` event, and the dual-path (fast path + cross-instance-safe path) delivery model with client-side dedup.

### General

- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (in particular: reuse `canSeeMessage`/`canSeeRoll`/`storage.listMembersForCampaign` as-is rather than re-implementing visibility logic in `transport.ts`).
- [x] Confirm all acceptance criteria in `specs/transport/spec.md` (this change's delta) are covered by passing tests.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable) — not applicable: no existing E2E specs cover chat/rolls/sessions transport
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards — `npm run lint` clean (0 errors), no new dependencies
- [x] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change touches `lib/server/transport.ts`, route/test files, and `CampaignChat.tsx`, so the **full path** applies.

**Full path**:

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:regression` (Playwright); all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix/issue-443-cross-instance-transport` to `main`. The PR body MUST include `Closes #443`.
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 443 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis (or assigned agent session)
- Reviewer(s): `pr-review-toolkit:review-pr` automated gate; repo owner (dougis) for final approval
- Required approvals: 1 (repo owner) plus automated review gate at zero findings

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (confirm `docs/multi-user-campaigns/04-realtime-transport.md` update from T7 landed)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `openspec/changes/fix-cross-instance-transport-delivery/specs/transport/spec.md` merged content into `openspec/specs/transport/spec.md` (merging ADDED/MODIFIED requirements into the existing capability spec, not overwriting unrelated existing requirements). Update relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-fix-cross-instance-transport-delivery/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/fix-cross-instance-transport-delivery/` to `openspec/changes/archive/YYYY-MM-DD-fix-cross-instance-transport-delivery/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-cross-instance-transport-delivery/` exists and `openspec/changes/fix-cross-instance-transport-delivery/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-fix-cross-instance-transport-delivery` then `git push -u origin doc/archive-YYYY-MM-DD-fix-cross-instance-transport-delivery`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-fix-cross-instance-transport-delivery` to `main` with title `docs: archive fix-cross-instance-transport-delivery (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix/issue-443-cross-instance-transport doc/archive-YYYY-MM-DD-fix-cross-instance-transport-delivery`

Required cleanup after archive: `git fetch --prune` and `git branch -D fix/issue-443-cross-instance-transport doc/archive-YYYY-MM-DD-fix-cross-instance-transport-delivery`
