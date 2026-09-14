# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only` (done during proposal: worktree created from freshly-fetched `origin/main`)
- [x] **Step 2 — Create and publish working branch:** `git worktree add .worktrees/fix-chat-session-awareness -b fix-chat-session-awareness origin/main` then `git push -u origin fix-chat-session-awareness` (done during proposal)

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 721 --add-label "in-progress"`. Then discover the GitHub Project linked to `dougis-org/session-combat` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).

- [x] **T1 — Write failing tests for `useActiveSessionId`/`useActiveSessionIdCore` first (TDD):** create `tests/unit/hooks/useActiveSessionId.test.tsx` covering, per `design.md` Decision 1 (core/wrapper split) and the `session-controls` capability spec delta: `useActiveSessionIdCore` — initial fetch resolves `activeSessionId`; `handleStreamEvent` given a `session`-typed event updates it (and is a no-op for other event types); `setActiveSessionId` updates it immediately; a stale fetch resolving after `handleStreamEvent` or `setActiveSessionId` is discarded; a duplicate confirming event after an optimistic set causes no flicker; state resets to `undefined` and re-fetches when `campaignId` changes; **and that `useActiveSessionIdCore` never calls `useCampaignStream`/opens an `EventSource`**. `useActiveSessionId` (wrapper) — calls `useCampaignStream` exactly once and forwards received events into the same core logic (can be tested by asserting it delegates to `useActiveSessionIdCore`'s behavior end-to-end). Confirm these tests fail (module doesn't exist yet).

- [x] **T2 — Implement `lib/hooks/useActiveSessionId.ts`:** export `useActiveSessionIdCore(campaignId)` — fetches `/api/campaigns/${campaignId}` for the initial `activeSessionId`; exposes `handleStreamEvent(e: CampaignStreamEvent)` that updates state on `session`-typed events only; tracks a `receivedAuthoritative` ref (reset alongside state on `campaignId` change) so a stale fetch response is discarded once `handleStreamEvent` or `setActiveSessionId` has been called; returns `{ activeSessionId, setActiveSessionId, handleStreamEvent }`; opens no subscription itself. Export `useActiveSessionId(campaignId)` as a thin wrapper: `const core = useActiveSessionIdCore(campaignId); useCampaignStream(campaignId, core.handleStreamEvent); return core`. Follow the existing `lib/hooks/useIsDM.ts` conventions (cancelled-flag guard, `console.error` on unexpected fetch failures, plain-object return). Run T1's tests to green.

- [x] **T3 — Write failing tests for `SessionControl`'s new contract:** update `tests/unit/components/SessionControl.test.tsx` and `tests/unit/components/SessionControlReactive.test.tsx` to mock `@/lib/hooks/useActiveSessionId` (matching the existing `useIsDM` mocking convention already in these files) instead of driving state via an `initialSessionId` prop; assert `SessionControl` renders nothing while the hook's `activeSessionId` is `undefined`, and that `handleStart`/`handleEnd`/`handleForceEnd`/`reconcileFromCampaign` call the hook's `setActiveSessionId`.

- [x] **T4 — Refactor `lib/components/SessionControl.tsx`:** change `SessionControlProps` to `{ campaignId: string }` only; replace the local `useState(initialSessionId)` and the manual `useCampaignStream(campaignId, handleEvent)` subscription (current lines ~13-31) with `const { activeSessionId, setActiveSessionId } = useActiveSessionId(campaignId)`; render `null` while `activeSessionId === undefined` (in addition to the existing `loading || !isDM` gate); replace every existing `setActiveSessionId(...)` call site (`handleStart`, `reconcileFromCampaign`, `terminateSession`) with the hook's setter — these call sites are unchanged in behavior, only the setter's origin changes. Run T3's tests to green.

- [x] **T5 — Update `SessionControl`'s call sites:** `app/campaigns/[id]/layout.tsx:34` and `app/campaigns/[id]/sessions/page.tsx:392` both currently pass `initialSessionId` — remove that prop from both call sites (`<SessionControl campaignId={id} />` / `<SessionControl campaignId={campaignId} />`). Update `tests/unit/components/SessionsPage.test.tsx` and `tests/unit/campaignLayoutNav.test.tsx` if they assert on the old prop.

- [x] **T6 — Write failing tests for `CampaignChat`'s new contract:** update the `CampaignChat` test suite (`tests/unit/components/CampaignChat/**`) to mock `@/lib/hooks/useActiveSessionId`'s `useActiveSessionIdCore` export (NOT the self-subscribing `useActiveSessionId` wrapper — `CampaignChat` must not gain a second SSE subscription; see `design.md` Decision 3) instead of passing `activeSessionId`/`onSessionChange` as props. Include, adapted from the deleted `TC-3.11`/`TC-3.12` (`tests/unit/components/CampaignLayout.test.tsx`, removed in commit `3c53030`): a test asserting `CampaignChat` reflects an already-active `activeSessionId` resolved by the core's mocked fetch with no prior stream event (regression guard for issue #721), and a test asserting a `session` stream event delivered to `useChatFeed`'s existing `useCampaignStream` mock and forwarded to `handleStreamEvent` updates `CampaignChat`'s rendered state (roll-history gating, presence announcement, "No active session" footer) on both start and end, matching the `roll-share-ui` spec delta's scenarios. Add a test asserting `useCampaignStream` is called exactly once from within `CampaignChat`'s render tree (i.e. `useActiveSessionIdCore` itself never calls it).

- [x] **T7 — Refactor `lib/components/CampaignChat/index.tsx`:** remove `activeSessionId` and `onSessionChange` from `CampaignChatProps`; call `const { activeSessionId, handleStreamEvent } = useActiveSessionIdCore(campaignId)` internally (the **core**, not the self-subscribing wrapper); pass `activeSessionId` into `useChatFeed` as before, and pass `handleStreamEvent` through so `useChatFeed`'s single `useCampaignStream` subscription can feed it (see T8).

- [x] **T8 — Refactor `lib/components/CampaignChat/useChatFeed.ts`:** remove the `onSessionChange` parameter from `UseChatFeedArgs`; add a `handleSessionStreamEvent: (e: CampaignStreamEvent) => void` parameter (the core's `handleStreamEvent`, threaded through from `CampaignChat`/T7); replace the `else if (e.type === 'session') { onSessionChange?.(...) }` branch in `onStreamEvent` (`useChatFeed.ts:82-84`) with an unconditional `handleSessionStreamEvent(e)` call at the top of `onStreamEvent` (it no-ops for non-`session` types) so the *existing* single `useCampaignStream(campaignId, onStreamEvent)` call in `useChatFeed` — unchanged, not duplicated — is the one subscription that now serves both message/roll feed updates and session-state updates. Run T6's tests to green, including the "exactly one `useCampaignStream` call" assertion.

- [x] **T9 — Write failing tests for `CampaignLayout`'s simplified wiring:** update `tests/unit/components/CampaignLayout.test.tsx` — remove the `capturedOnSessionChange`/`initialSessionId`-fetch-driven mocks that no longer apply; add assertions (replacing the deleted `TC-3.11`/`TC-3.12`/`T3-3`) that `CampaignLayout` renders `<SessionControl campaignId={id} />` and `<CampaignChat campaignId={id} onSizeChange={...} />` with no `activeSessionId`, `onSessionChange`, or `initialSessionId` prop passed to either — i.e. assert the coupling is gone, not merely that it still "works."

- [x] **T10 — Refactor `app/campaigns/[id]/layout.tsx`:** remove the `initialSessionId` state and its fetch-effect logic (`useState<string | null | undefined>`, the `setInitialSessionId(data?.activeSessionId ?? null)` line); keep the existing fetch only for `campaignName`; render `<SessionControl campaignId={id} />` unconditionally in the header (no more `initialSessionId !== undefined &&` gate — `SessionControl` now self-gates via T4); leave the `<CampaignChat campaignId={id} onSizeChange={setIsChatLarge} />` call site as-is (it already has no session props to remove). Run T9's tests to green.

- [x] **T11 — Repo-wide confirmation sweep:** re-run `grep -rn "<CampaignChat" --include="*.tsx" --include="*.ts" .` and `grep -rn "<SessionControl" --include="*.tsx" .` (excluding `tests/` and `node_modules`) to confirm no other call site was missed and every remaining call site matches the new prop contracts from T4/T7. Also re-run `grep -rn "useCampaignStream(" --include="*.ts" --include="*.tsx" lib/ | grep -v tests/` and confirm exactly two production call sites remain (`lib/hooks/useActiveSessionId.ts`'s `useActiveSessionId` wrapper — reached at runtime via `SessionControl`'s call to it — and `lib/components/CampaignChat/useChatFeed.ts`) — i.e. this change added zero net new `useCampaignStream` call sites versus today's two (previously one inside `SessionControl.tsx` directly, one inside `useChatFeed.ts`), confirming the fix for the subscription-count issue caught during design review (see `design.md` Decision 1's revision note).

- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — confirmed during design: no new endpoint, no transport-layer change; reuse `GET /api/campaigns/:id` and the existing `session` `CampaignStreamEvent` as-is.
- [x] Confirm acceptance criteria are covered: cross-check every scenario in `specs/session-controls/spec.md`, `specs/session-event/spec.md`, and `specs/roll-share-ui/spec.md` (this change) against the tests added in T1, T3, T6, T9.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable) — not applicable: no e2e spec exercises SessionControl/CampaignChat/session state (confirmed via repo search); coverage for this change is the 123 new/updated unit tests plus the full integration suite (357 passing)
- [x] Run type checks
- [x] Run build
- [ ] Run security/code quality checks required by project standards
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change modifies `.ts`/`.tsx` files, so the **full path** applies:

- **Unit tests** — run the project's unit test suite (`npm test` or project-documented equivalent); all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script (`npm run build`); build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `fix-chat-session-awareness` to `main`. PR body MUST include `Closes #721`. → https://github.com/dougis-org/session-combat/pull/724
- [x] **Issue lifecycle: mark in-review**: run `gh issue edit 721 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated gate) + repo owner (human, via standard PR review)
- Required approvals: per repo branch ruleset for `main` (squash-only, `ci-gate` + Codacy required checks, 0 human approvals required per current ruleset — see project memory on `main`'s squash-only ruleset)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (check `docs/multi-user-campaigns/` for any diagram/description referencing the old `activeSessionId` prop-drilling path through `CampaignLayout`; update if found)
- [ ] Sync approved spec deltas into `openspec/specs/`: `openspec/specs/session-controls/spec.md`, `openspec/specs/session-event/spec.md`, `openspec/specs/roll-share-ui/spec.md`. After copying each `spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-fix-chat-session-awareness/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/fix-chat-session-awareness/` to `openspec/changes/archive/YYYY-MM-DD-fix-chat-session-awareness/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-chat-session-awareness/` exists and `openspec/changes/fix-chat-session-awareness/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-fix-chat-session-awareness` then `git push -u origin doc/archive-YYYY-MM-DD-fix-chat-session-awareness`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-fix-chat-session-awareness` to `main` with title `docs: archive fix-chat-session-awareness (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix-chat-session-awareness doc/archive-YYYY-MM-DD-fix-chat-session-awareness`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/fix-chat-session-awareness`

Required cleanup after archive: `git fetch --prune` and `git branch -D fix-chat-session-awareness doc/archive-YYYY-MM-DD-fix-chat-session-awareness`
