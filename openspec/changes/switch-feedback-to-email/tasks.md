# Tasks

Change: `switch-feedback-to-email` · Issue-driven: **#650** · Default branch: `main`

Ownership metadata:

- Implementer: agent (via `/opsx:apply`)
- Reviewer(s): `@dougis` + `pr-review-toolkit:review-pr` gate + Codacy
- Required approvals: 0 (repo ruleset on `main` — squash-only, `ci-gate` + Codacy required checks)

## Preparation

- [x] **Step 1 — Sync default branch:** from the primary checkout, `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Working branch:** branch `switch-feedback-to-email` and its worktree `.worktrees/switch-feedback-to-email` were created during propose and pushed to origin. Confirm `git worktree list` shows it and `git ls-remote --heads origin switch-feedback-to-email` returns a ref.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list. If not listed, halt, tell the user the `pr-review-toolkit` plugin is required, provide installation guidance, and do not proceed until they confirm it is installed.
- [x] Confirm `.worktrees/` is in `.gitignore` (it is — line ~99) and all work happens inside `.worktrees/switch-feedback-to-email`.

## Execution

- [x] **Step 1 — Worktree:** confirm `.worktrees/switch-feedback-to-email` exists and `cd` into it. If missing, from the primary checkout: `git fetch origin main` then `git worktree add .worktrees/switch-feedback-to-email switch-feedback-to-email`. Never checkout the feature branch in the primary checkout.
- [x] **Step 2 — Remote branch:** confirm `switch-feedback-to-email` is on origin; if not, `git push -u origin switch-feedback-to-email` from inside the worktree.
- [ ] **Step 3 — Issue lifecycle: mark in-progress:** run `gh issue edit 650 --add-label "in-progress"`. Discover the repo's GitHub Project via `gh project list --owner dougis-org --format json`, resolve the status field option matching "In Progress" via `gh project field-list <project-number> --owner dougis-org --format json`, and move the item with `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks `project` scope, tell the user to run `gh auth refresh -s project` and skip the project-item move (the label edit still proceeds).

### Implementation (strict TDD — write the failing test first, then the code)

- [x] **T1 — `lib/email.ts`: shared sender helper.** Extract the `MAILTRAP_FROM_EMAIL` → `noreply@session-combat.app` fallback (plus the existing `console.warn`) into a private helper used by `sendPasswordResetEmail`. Test: `tests/unit/lib/email.test.ts` — assert `from.email` is the env value when set and the fallback (with warn) when unset. No behavior change to password reset.
- [x] **T2 — `lib/email.ts`: `sendFeedbackEmail`.** Add `export async function sendFeedbackEmail({ to, replyTo, subject, text }: FeedbackEmailInput): Promise<void>` calling `getClient().send({ from: { email: <helper>, name: "Session Combat" }, to: [{ email: to }], reply_to: { email: replyTo }, category: "feedback", subject, text })`. Tests: asserts `client.send` (the **live** send method) is invoked with exactly those fields; asserts it rejects/propagates when `client.send` rejects; asserts `getClient()` throwing (no `MAILTRAP_TOKEN`) propagates.
  - Covers spec: "POST /api/feedback — sends feedback email" (sender, reply_to, category).
- [x] **T3 — `app/api/feedback/route.ts`: rename `buildIssueBody` → `buildFeedbackBody`.** Implementation unchanged (context block + `---` + description; context-only when description empty). Keep `sanitizeIssueText` and the page-URL clamp exactly as-is.
  - Covers spec: "Auto-context in feedback email" (all three scenarios).
- [x] **T4 — `app/api/feedback/route.ts`: replace the GitHub sink.**
  - Remove `const githubToken = process.env.GITHUB_FEEDBACK_TOKEN` and the `fetch('https://api.github.com/...')` block.
  - After the rate-limit gate: `const to = process.env.FEEDBACK_TO_EMAIL;` and check `process.env.MAILTRAP_TOKEN`. If either is falsy → `console.error(...)` naming the missing var and `return NextResponse.json({ error: 'Feedback is not available.' }, { status: 503 })`.
  - Build `const subject = sanitizeIssueText(\`[\${type === 'bug' ? 'Bug' : 'Feature'}] \${title.trim()}\`, 200);`
  - Build `const text = buildFeedbackBody(submittedBy, pageUrlStr, userAgent, descriptionStr);`
  - `try { await sendFeedbackEmail({ to, replyTo: email, subject, text }); } catch (err) { console.error('Feedback email send failed:', err); return NextResponse.json({ error: 'Failed to send feedback. Please try again later.' }, { status: 502 }); }`
  - `return NextResponse.json({ ok: true }, { status: 201 });`
  - Tests (`tests/unit/app/api/feedback/route.test.ts`, mock `@/lib/email`): success → 201 `{ ok: true }`, `sendFeedbackEmail` called once with expected args, **no `fetch` to github**; `type` bug vs feature → subject prefix; title with newlines/control chars/>200 chars → sanitized+truncated subject; `FEEDBACK_TO_EMAIL` unset → 503, not called; `MAILTRAP_TOKEN` unset → 503; `sendFeedbackEmail` rejects → 502; rate-limited → 429, not called; malformed body → 400; bad `pageUrl` (`//evil`, `http://`, `javascript:`) → excluded from body.
  - Covers spec: "POST /api/feedback — sends feedback email" (all scenarios), "MODIFIED IP rate limiting", "MODIFIED Reliability", "MODIFIED Security".
- [x] **T5 — `lib/components/FeedbackModal.tsx`: success copy.** Change the success `<p>` from "Your report has been submitted and a GitHub issue has been created." to "Your feedback has been sent. Thank you!" Keep the `response.status === 201` branch. Remove any read of `issueUrl` (there is none beyond the sentence). Test (`tests/unit/components/FeedbackModal.test.tsx`): success branch renders the new text and does **not** contain "GitHub" or "issue"; error branch still shows the server `error` string; 502 response renders the retry affordance.
  - Covers spec: scenario "Modal shows success state after submission", "Modal shows error state on send failure".
- [x] **T6 — `.env.example`:** add under the Mailtrap section:
  `# FEEDBACK_TO_EMAIL=dnd@dougis.com   # required — recipient for in-app bug/feature feedback`
  and drop or comment the now-unused `# GITHUB_FEEDBACK_TOKEN=` line (leave a one-line note that it is no longer used).
- [x] **T7 — grep sweep:** `grep -rn "GITHUB_FEEDBACK_TOKEN\|issueUrl\|api.github.com/repos/dougis-org/session-combat/issues" app lib tests` returns only intentional references (tests asserting absence, comments). Update `README.md` / `CONTRIBUTING.md` / `docs/` if they document the feedback-creates-an-issue behavior.
- [x] Confirm every acceptance scenario in `openspec/changes/switch-feedback-to-email/specs/feedback-help-menu/spec.md` maps to a passing test above.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent automatically applies all clearly-correct findings to the code — without stopping, without presenting the findings list to the user, without asking for confirmation. Apply fixes, re-run `npm run test:unit`, then commit. Mandatory, never skipped.

## Validation

- [x] `npm run test:unit` — all pass, coverage not regressed for touched files
- [x] `npm run typecheck` — clean
- [x] `npm run lint` — clean
- [x] `npm run build` — succeeds
- [ ] `npm run test:integration` — all pass (non-`.md` code changed → full path)
- [ ] `npm run test:e2e` — feedback-related specs pass (use a free port, not 3000 — other threads occupy 3000)
- [x] `openspec validate switch-feedback-to-email` — valid
- [ ] Verity pre-commit / pre-push gate — PASS (fix findings; do not waive)
- [ ] All completed tasks marked `- [x]`
- [ ] All steps in [Remote push validation]

## Remote push validation

Determine docs-only via `git diff --name-only main...HEAD`; this change touches `.ts`/`.tsx` so the **full path** applies:

- **Unit tests** — `npm run test:unit`; all pass
- **Integration tests** — `npm run test:integration`; all pass
- **Regression / E2E tests** — `npm run test:regression`; all pass
- **Build** — `npm run build`; succeeds with no errors

If ANY step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Confirm the `openspec-review-code` sub-agent ran and all findings were addressed before the final commit
- [ ] Commit all changes to `switch-feedback-to-email` and push
- [ ] Open PR `switch-feedback-to-email` → `main`. **PR body MUST include `Closes #650`.** Summarize: feedback backend switched from GitHub issue to Mailtrap live email; new `FEEDBACK_TO_EMAIL` env var (must be set in Fly secrets before/with deploy); `MAILTRAP_FROM_EMAIL` domain must be verified for live sending.
- [ ] **Issue lifecycle: mark in-review:** `gh issue edit 650 --add-label "in-review" --remove-label "in-progress"`; move the project item to "In Review" (same discovery pattern as in-progress; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit → [Remote push validation] → push → re-run) until zero remain. If findings persist after 3+ iterations with no progress, report the stall with remaining findings and wait for human guidance.
- [ ] **After the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (repo ruleset is squash-only; NEVER `--admin`)
- [ ] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` returns `MERGED` (if `CLOSED`, exit and notify user); never wait for a human, never force-merge:
  1. **Build and tests** — run [Remote push validation]; fix failures, commit, push first
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, [Remote push validation], push, wait 180s; repeat until all resolved
  3. **CI check failures** — after comments are clear, poll `gh pr checks <PR-URL>`; fix failing required checks (`ci-gate`, Codacy), commit, [Remote push validation], push, wait 180s; restart from step 1

Blocking resolution flow:

- CI failure → diagnose → fix → commit → validate locally → push → re-run checks
- Security / Codacy finding → remediate (do not waive on agent judgment) → commit → validate → push → re-scan
- Review comment → address → commit → validate → push → confirm thread resolved
- Escalation: ping `@dougis` on the PR; if no response within 1 business day and CI is green, maintainer may self-merge per the 0-approval ruleset

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (README / CONTRIBUTING / docs feedback section)
- [ ] Sync approved spec deltas into `openspec/specs/feedback-help-menu/spec.md`: apply the ADDED/MODIFIED/REMOVED deltas from `openspec/changes/switch-feedback-to-email/specs/feedback-help-menu/spec.md`. After copying, rewrite relative links so they resolve from the archive location — `../../design.md` → `../../changes/archive/YYYY-MM-DD-switch-feedback-to-email/design.md`, likewise for `../../tasks.md`.
- [ ] Archive: move `openspec/changes/switch-feedback-to-email/` → `openspec/changes/archive/YYYY-MM-DD-switch-feedback-to-email/`, staging the new location **and** the deletion of the old in a **single** commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-switch-feedback-to-email/` exists and `openspec/changes/switch-feedback-to-email/` is gone
- [ ] Create a doc branch: `git checkout -b doc/archive-YYYY-MM-DD-switch-feedback-to-email` then `git push -u origin doc/archive-YYYY-MM-DD-switch-feedback-to-email`
- [ ] Open a PR `doc/archive-YYYY-MM-DD-switch-feedback-to-email` → `main`, title `docs: archive switch-feedback-to-email (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER `--admin`)
- [ ] Monitor the doc PR until merged (same loop as the implementation PR)
- [ ] `git worktree remove .worktrees/switch-feedback-to-email` — use `--force` if it fails on the `openspec-shared` submodule
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D switch-feedback-to-email doc/archive-YYYY-MM-DD-switch-feedback-to-email`
- [ ] Post-deploy smoke test: with `FEEDBACK_TO_EMAIL` set in Fly secrets, submit a real feedback item and confirm the email arrives at `dnd@dougis.com` with a working reply-to
