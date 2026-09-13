# Tasks

Change: `bound-rolls-api-validation` · Issue-driven: **yes** (#577; follow-up #712 is out of scope). Default branch: `main`. Working branch: `bound-rolls-api-validation` (worktree `.worktrees/bound-rolls-api-validation`).

Ownership metadata:

- Implementer: TBD (assign at apply time)
- Reviewer(s): dougis; `pr-review-toolkit:review-pr` gate
- Required approvals: 0 human approvals required by ruleset; `ci-gate` + Codacy required checks must pass; `pr-review-toolkit:review-pr` must reach zero findings before auto-merge

## Preparation

- [ ] **Step 1 — Confirm worktree:** verify `.worktrees/bound-rolls-api-validation` exists (created during propose) and `cd` into it. If missing, from the primary checkout run `git fetch origin main` then `git worktree add .worktrees/bound-rolls-api-validation -b bound-rolls-api-validation origin/main`. Never checkout this branch in the primary checkout.
- [ ] **Step 2 — Confirm branch is published:** `git -C .worktrees/bound-rolls-api-validation status -sb` shows tracking `origin/bound-rolls-api-validation`; if not, `git push -u origin bound-rolls-api-validation` from inside the worktree. (Branch was pushed during propose.)
- [ ] **Step 3 — Confirm submodule:** `.github/openspec-shared/openspec/schemas/sdd-with-feedback-loop/` is present in the worktree (force-checked-out during propose); if missing, `git submodule update --init --force .github/openspec-shared`.
- [ ] **Step 4 — Rebase check:** `git fetch origin main` and rebase the working branch if `main` has moved significantly.

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list. If not listed, halt, tell the user the `pr-review-toolkit` plugin is required, provide installation guidance, and do not proceed until they confirm it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 577 --add-label "in-progress"`. Then `gh project list --owner dougis-org --format json`, resolve the status field option matching "In Progress" via `gh project field-list <project-number> --owner dougis-org --format json`, and move the item with `gh project item-edit`. If no project item is found, log a warning and continue. If the token lacks `project` scope, tell the user to run `gh auth refresh -s project` and skip the project-item update (label update still proceeds).

### Slice 1 — Shared validator (`lib/validation/rollSubmission.ts`)  _(spec: "Shared roll-submission validator with dice-derived bounds")_

- [x] **1a (test first):** add `tests/unit/lib/validation/rollSubmission.test.ts`. Failing cases: exported bounds `>=` computed maxima from `@/lib/utils/dice` (`MAX_DICE_IN_ROLL >= MAX_PER_DIE * DIE_SIDES.length`; `MAX_DIE_VALUE >= Math.max(...SUPPORTED_SIDES)`; `MAX_TOTAL_MAGNITUDE >= MAX_DICE_IN_ROLL * MAX_DIE_VALUE + MAX_MODIFIER`); `MAX_LABEL_LENGTH === 128`; schema accepts a standard pool roll, a `d%` roll, the 120-dice + 999-modifier max pool, an empty `rolls` array, and a roll whose `total` != sum(`rolls`); schema rejects oversized `formula`, oversized `rolls` length, non-integer / `<1` / `>MAX_DIE_VALUE` entry, non-finite / over-magnitude `total`, 129-char `label`, and bad `visibility.scope`.
- [x] **1b:** implement `lib/validation/rollSubmission.ts` per design Decision 1 & 2 — `rollSubmissionSchema` + exported constants, each constant commented with its `lib/utils/dice.ts` derivation. Import only `zod` and `@/lib/utils/dice`.
- [x] **1c:** add an assertion (test or lint) that the module's imports are limited to `zod` and `@/lib/utils/dice` (no `next/*`, no `@/lib/storage`) — supports future issue #712.
- [x] **1d:** run `npx vitest run tests/unit/lib/validation/rollSubmission.test.ts` (or project test runner) — green.

### Slice 2 — Bounded JSON body read (`lib/server/readBoundedJson.ts`)  _(spec: "Rolls API caps the request body size")_

- [x] **2a (test first):** add `tests/unit/lib/server/readBoundedJson.test.ts`. Cases: body under cap → `{ ok: true, value }`; body over cap → `{ ok: false, reason: 'oversize' }` and the mock reader's `cancel()` was called; oversized `Content-Length` header → `{ ok: false, reason: 'oversize' }` with the stream never read; invalid JSON under cap → `{ ok: false, reason: 'invalid-json' }`; missing body stream → `{ ok: false, reason: 'error' }`.
- [x] **2b:** implement `lib/server/readBoundedJson.ts` modeled on `readBoundedText` in `app/api/monsters/upload/shared.ts` (stream via `request.body.getReader()`, abort once `total > maxBytes`, `Content-Length` short-circuit), then `JSON.parse`. Export `readBoundedJson`.
- [x] **2c:** run the new unit test — green.

### Slice 3 — Wire into the rolls route (`app/api/campaigns/[id]/rolls/route.ts`)  _(specs: "rejects out-of-bounds", "caps the request body size", "accepts well-formed rolls unchanged", "preserves existing auth and session errors")_

- [x] **3a (test first):** in the route's test file (`tests/**/campaigns*rolls*` — locate existing; create if absent), add/adjust cases: body > `ROLL_BODY_MAX_BYTES` → `413`, `storage.saveCampaignRoll` and `emitFiltered` not called; oversized `Content-Length` → `413`; each invalid field (formula/rolls length/die value/total/label/scope) → `400`, no persist/broadcast; `400` body is a single concise `error` string (no raw zod dump); malformed JSON → `400` `Invalid JSON`; non-object body → `400`; non-member → `403`; no active session → `409`; normal pool roll → `201` (persist + broadcast once); `d%` roll → `201`; `total` != sum(`rolls`) → `201` stored verbatim; empty `rolls` → `201`.
- [x] **3b:** define `ROLL_BODY_MAX_BYTES = 16 * 1024` (in the route or alongside `readBoundedJson` — design leaves it in the route). Replace `await request.json()` + inline `typeof`/`Array.isArray`/`Number.isFinite`/`scope` checks with: `readBoundedJson(request, ROLL_BODY_MAX_BYTES)` → `413` / `400 Invalid JSON` / `500` per design Decision 4 step 1; then `rollSubmissionSchema.safeParse(value)` → `400` with concise message per Decision 4 step 2; then use `parsed.data` downstream (Decision 4 step 3). Keep the `403`/`409`/build/`saveCampaignRoll`/`emitFiltered`/`201` flow unchanged.
- [x] **3c:** run the route test file — green.
- [x] **3d:** confirm no other caller relied on the removed inline behavior (`rg "saveCampaignRoll|/rolls'" --type ts`); the client hook `lib/dice/useRollSubmission.ts` is untouched (that is #712).

- [x] **Confirm acceptance criteria covered** — every scenario in `specs/roll-submission-validation/spec.md` maps to a passing test (see `tests.md`).

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill on the staged + unstaged diff. Automatically apply all clearly-correct findings directly to the code — do not stop, do not present the list, do not ask for confirmation. Apply fixes, re-run the affected tests, then commit.

## Validation

- [x] Unit/integration tests: run the project unit suite (`npm test` / `npx vitest run`) — all pass
- [ ] E2E tests: run project E2E suite if the route is covered — all pass (use a free port, not 3000)
- [x] Type checks: `npm run typecheck` (or `tsc --noEmit`) — clean
- [x] Build: `npm run build` — succeeds
- [x] Security / code quality: Codacy + Verity pre-commit/pre-push gate — pass; fix findings, do **not** waive (waive only for a human-accepted, cited risk)
- [x] All completed tasks marked complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Determine docs-only vs full via `git diff --name-only origin/main...HEAD`. This change touches `.ts` files → **full path**:

- **Unit tests** — project unit suite; all pass
- **Integration tests** — project integration suite; all pass
- **Regression / E2E tests** — project E2E suite; all pass
- **Build** — `npm run build`; succeeds

If any step fails, iterate and fix before pushing. Use the commands documented in `README` / `CLAUDE.md`.

## PR and Merge

- [ ] Ensure `openspec-review-code` sub-agent ran and all findings were addressed before the final commit
- [ ] Commit all changes to `bound-rolls-api-validation` and push
- [ ] Open PR → `main`. **PR body MUST include `Closes #577`** (and note "Follow-up tracked in #712 — client-side defense-in-depth, out of scope here"). Use the repo PR template if present.
- [ ] **Issue lifecycle: mark in-review** — `gh issue edit 577 --add-label "in-review" --remove-label "in-progress"`, then move the project item to the "In Review" column (same discovery as in-progress; warn and skip if not found)
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, run [Remote push validation], push, re-run) until zero findings remain. If findings persist after 3+ iterations with no progress, report the stall with remaining findings and wait for human guidance.
- [ ] **After the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (main is squash-only; NEVER `--admin`)
- [ ] **Iterate until merged** — loop until `gh pr view <PR-URL> --json state` returns `MERGED` (if `CLOSED`, exit and notify the user); never wait for a human, never force-merge:
  1. **Build and tests** — run [Remote push validation]; fix failures, commit, push first
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address each unresolved thread, commit, validate, push, wait 180s; repeat until all resolved
  3. **CI check failures** — after comments are clear, poll `gh pr checks <PR-URL>`; fix failing required checks (`ci-gate`, Codacy), commit, validate, push, wait 180s; restart from step 1

Blocking resolution flow:

- CI failure → diagnose → fix → commit → local [Remote push validation] → push → re-check
- Security finding → remediate → commit → local validate → push → re-scan
- Review comment → address → commit → local validate → push → confirm thread resolved
- Stalled > 2 working days → escalate to dougis with the specific blocker; #577 stays `in-progress`/`in-review`

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Update any repo documentation impacted (API notes / route docs if present)
- [ ] Sync approved spec delta into the global spec: copy `openspec/changes/bound-rolls-api-validation/specs/roll-submission-validation/spec.md` to `openspec/specs/roll-submission-validation/spec.md`, updating relative links to point into `../../changes/archive/YYYY-MM-DD-bound-rolls-api-validation/` (design.md, tasks.md)
- [ ] Archive: move `openspec/changes/bound-rolls-api-validation/` to `openspec/changes/archive/YYYY-MM-DD-bound-rolls-api-validation/`, staging both the new location and the deletion in a **single** commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-bound-rolls-api-validation/` exists and the original is gone
- [ ] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-bound-rolls-api-validation` and `git push -u origin doc/archive-YYYY-MM-DD-bound-rolls-api-validation`
- [ ] Open PR → `main`, title `docs: archive bound-rolls-api-validation (YYYY-MM-DD)`; do NOT push directly to `main`
- [ ] Immediately `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER `--admin`)
- [ ] Monitor the doc PR until merged (same loop as the implementation PR)
- [ ] Remove the worktree: `git worktree remove .worktrees/bound-rolls-api-validation --force` (submodule present → `--force` needed)
- [ ] Prune branches: `git fetch --prune` and `git branch -D bound-rolls-api-validation doc/archive-YYYY-MM-DD-bound-rolls-api-validation`
- [ ] Confirm issue #577 auto-closed via `Closes #577`; #712 remains open for the follow-up
