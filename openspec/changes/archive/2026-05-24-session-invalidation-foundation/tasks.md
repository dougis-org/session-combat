# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/session-invalidation-foundation` then `git push -u origin feat/session-invalidation-foundation`

## Implementation

- [x] Add `tokenVersion: number` to `User` and `AuthPayload` interfaces in `lib/types.ts`
- [x] Update `generateToken()` in `lib/auth.ts` to accept and include `tokenVersion` in payload
- [x] Add async `tokenVersion` DB check inside `withAuth` and `withAuthAndParams` in `lib/middleware.ts`
- [x] Mark `requireAuth` and `verifyAuth` as `@deprecated` in `lib/middleware.ts`
- [x] Update login route (`app/api/auth/login/route.ts`) to read `tokenVersion` from user doc
- [x] Update register route (`app/api/auth/register/route.ts`) to write `tokenVersion: 0` and pass to `generateToken()`
- [x] Migrate all ~35 direct `requireAuth` / `verifyAuth` callers to `withAuth` / `withAuthAndParams`

## Validation

- [x] Lint passes
- [x] TypeScript typecheck passes
- [x] Unit tests pass
- [x] Integration tests pass (all auth-protected routes still work)
- [x] Manual smoke test: reset tokenVersion in DB, verify old JWT is rejected

## PR and Merge

- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `feat/session-invalidation-foundation` to `main`
- [x] Wait 120 seconds for agentic reviewers to post comments
- [x] **Monitor PR comments** — address, commit fixes, validate locally, push; repeat until no unresolved comments
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — diagnose and fix failures, push, repeat until all checks pass
- [x] Wait for the PR to merge — never force-merge

Ownership metadata:
- Implementer:
- Reviewer(s):
- Required approvals:

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on main
- [x] Mark all remaining tasks as complete
- [x] Update repository documentation impacted by the change
- [x] Sync approved spec deltas into `openspec/specs/`
- [x] Archive the change with `openspec archive`
- [x] Prune merged local branch: `git fetch --prune` and `git branch -d feat/session-invalidation-foundation`
