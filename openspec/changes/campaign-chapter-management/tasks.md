# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/campaign-chapter-management` then immediately `git push -u origin feat/campaign-chapter-management`

## Execution

- [x] **Task 1 — Add Unit Tests (TDD):** Implement failing Jest unit tests in `tests/unit/components/CampaignEditor.test.tsx` covering:
  - Collapsible accordion toggle.
  - Adding a new chapter to the local chapters array.
  - Removing a chapter from the array and ensuring order index reassignment.
  - Up/Down swap reordering and index re-mapping.
  - Active chapter selector dropdown populated with chapters, and selection state updates.
- [x] **Task 2 — Implement Campaign Form Components:** Update `app/campaigns/CampaignEditor.tsx` to fulfill the unit tests:
  - Add collapsible Chapters section using a local state toggle.
  - Add inline fields for editing chapter titles.
  - Build reordering logic (Up/Down) that recalculates sequence indexes.
  - Build removal logic that resets `currentChapterId` to undefined if the active chapter is deleted.
  - Add `<select>` dropdown picker for `currentChapterId` when chapters exist.
- [x] **Task 3 — Dashboard Displays Active Chapter:** Update campaign list cards in `app/campaigns/page.tsx` to dynamically lookup `campaign.currentChapterId` in `campaign.chapters` and render the resolved title `📖 Current Chapter: Ch. N: Title`.
- [x] **Task 4 — POST API Route Updates:** Update POST `/api/campaigns/route.ts` to extract, sanitize, and validate the `chapters` array and `currentChapterId` from request body before saving.
- [x] **Task 5 — PATCH API Route Updates:** Update PATCH `/api/campaigns/[id]/route.ts` to support partial updates for `chapters` and `currentChapterId` with strict server-side validation.
- [x] **Task 6 — Add API Integration Tests:** Write integration tests in `tests/integration/campaigns.integration.test.ts` verifying that POST and PATCH payloads correctly persist and return the new chapters array and active chapter ID.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b feat/campaign-chapter-management` → `git push -u origin feat/campaign-chapter-management`

## Validation

- [x] Run unit/integration tests: `npm run test:unit` and `npm run test:integration`
- [x] Run type checks: `npm run typecheck` or `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`
- [ ] Wait for 120 seconds for the Agentic reviewers to post their comments
- [ ] **Monitor PR comments** — when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; repeat until all checks pass
- [ ] Wait for the PR to merge — **never force-merge**; if a human force-merges, continue to Post-Merge

The comment and CI resolution loops are iterative: address → validate locally → push → sleep for 120 seconds → re-check → repeat until the PR is fully clean. If a human force-merges before the PR is clean, proceed directly to Post-Merge steps.

Ownership metadata:

- Implementer: Antigravity AI
- Reviewer(s): dougis (Doug Hubbard)
- Required approvals: 1 approval from dougis

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/campaign-chapter-management/` to `openspec/changes/archive/2026-05-22-campaign-chapter-management/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/2026-05-22-campaign-chapter-management/` exists and `openspec/changes/campaign-chapter-management/` is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d feat/campaign-chapter-management`

Required cleanup after archive: `git fetch --prune` and `git branch -d feat/campaign-chapter-management`
