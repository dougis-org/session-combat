# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/extract-isuseradmin-permissions` then immediately `git push -u origin feat/extract-isuseradmin-permissions`

## Execution

### 1. Create `lib/permissions.ts`

- [x] Create `lib/permissions.ts` exporting `isUserAdmin(userId: string): Promise<boolean | null>`
- [x] Implement: `getDatabase()` → `users` collection → `findOne({ _id: new ObjectId(userId) })` → return `user?.isAdmin === true`
- [x] On catch (including ObjectId parse error): return `null`
- [x] Verify TypeScript compiles: `npx tsc --noEmit`

### 2. Write integration test (TDD — before touching routes)

- [x] Create `tests/integration/permissions.test.ts`
- [x] Reuse testcontainer + Next.js server lifecycle from `tests/integration/monsters.integration.test.ts`
- [x] Seed admin user: register via API, then directly set `isAdmin: true` in `users` collection
- [x] Test: admin user → `isUserAdmin` returns `true`
- [x] Test: non-admin user → `isUserAdmin` returns `false`
- [x] Test: unknown userId → `isUserAdmin` returns `false`
- [x] Run: `npm run test:integration` — confirm tests pass

### 3. Update `app/api/monsters/global/route.ts`

- [x] Remove local `isUserAdmin` function definition (lines ~11–22)
- [x] Add import: `import { isUserAdmin } from '@/lib/permissions';`
- [x] At each call site (`admin = await isUserAdmin(...)`), add null check: `if (admin === null) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });`
- [x] Verify TypeScript compiles: `npx tsc --noEmit`

### 4. Update `app/api/monsters/global/[id]/route.ts`

- [x] Remove local `isUserAdmin` function definition (lines ~8–19)
- [x] Add import: `import { isUserAdmin } from '@/lib/permissions';`
- [x] At each call site, add null check → 500 (same pattern as above)
- [x] Verify TypeScript compiles: `npx tsc --noEmit`

### 5. Review for duplication and unnecessary complexity

- [x] Confirm no other `isUserAdmin` definitions remain: `grep -r "isUserAdmin" app/`
- [x] Confirm single export in `lib/permissions.ts`
- [x] Confirm all acceptance criteria covered (specs/permissions/spec.md, specs/routes/spec.md)

## Validation

- [x] `npx tsc --noEmit` — no type errors
- [x] `npm run test:unit` — all unit tests pass
- [x] `npm run test:integration` — `permissions.test.ts` passes alongside existing integration tests
- [x] `npm run build` — production build succeeds
- [x] `grep -r "function isUserAdmin" app/` returns empty (no local definitions remain)
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run required pre-PR self-review before committing
- [x] Commit all changes to `feat/extract-isuseradmin-permissions` and push to remote
- [x] Open PR from `feat/extract-isuseradmin-permissions` to `main`; reference `#134` in PR body
- [x] Wait 120 seconds for agentic reviewers to post comments
- [x] **Monitor PR comments** — address each comment, commit fixes, validate locally (remote push validation), push; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — if any check fails, diagnose, fix, commit, validate locally, push; repeat until all checks pass
- [x] Wait for PR to merge — **never force-merge**; if human force-merges, continue to Post-Merge

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic reviewers + dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No doc updates required (no public API change)
- [x] Sync approved spec deltas into `openspec/specs/` (global spec) if applicable
- [x] Archive: move `openspec/changes/extract-isuseradmin-permissions-helper/` to `openspec/changes/archive/YYYY-MM-DD-extract-isuseradmin-permissions-helper/` — stage both copy and deletion in a single commit
- [x] Confirm archive exists and original path is gone
- [x] Commit and push archive to `main` in one commit
- [x] Prune: `git fetch --prune` and `git branch -d feat/extract-isuseradmin-permissions`
- [x] Close GitHub issue #134
