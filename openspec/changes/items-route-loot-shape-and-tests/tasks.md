# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/items-route-loot-shape-and-tests` then immediately `git push -u origin feat/items-route-loot-shape-and-tests`

## Execution

### 1. Update `app/api/items/route.ts`

- [x] Add `ItemType` union type above the `Item` interface:
  ```ts
  type ItemType = 'weapon' | 'armor' | 'potion' | 'scroll' | 'wondrous' | 'ammunition' | 'gear' | 'tool' | 'other';
  type ItemRarity = 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact';
  const VALID_TYPES: ItemType[] = ['weapon', 'armor', 'potion', 'scroll', 'wondrous', 'ammunition', 'gear', 'tool', 'other'];
  const VALID_RARITIES: ItemRarity[] = ['common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact'];
  ```
- [x] Expand `Item` interface to include: `type`, `rarity`, `quantity`, `value?`, `weight?`, `attunement`, `equipped`, `properties?`, `notes?`
- [x] In the POST handler, after the `name` validation, add validation for `type` (missing → 400 `"Item type is required"`, invalid → 400 `"Invalid item type"`) and `rarity` (missing → 400 `"Item rarity is required"`, invalid → 400 `"Invalid item rarity"`)
- [x] Apply defaults in the POST item construction: `quantity: quantity ?? 1`, `attunement: attunement ?? false`, `equipped: equipped ?? false`
- [x] Destructure all new fields from `body` in the POST handler

### 2. Write unit tests — `tests/unit/api/items/route.test.ts`

- [x] Create `tests/unit/api/items/` directory
- [x] Scaffold test file with `@jest-environment node`, mock `@/lib/middleware` (explicit `withAuth` factory), mock `@/lib/db`
- [x] **GET tests:**
  - [x] Returns 200 with items array from mocked DB
  - [x] Returns 500 when DB throws
- [x] **POST tests:**
  - [x] Returns 400 when `name` is missing
  - [x] Returns 400 when `name` is whitespace-only
  - [x] Returns 400 when `type` is missing
  - [x] Returns 400 when `type` is not a valid enum value
  - [x] Returns 400 when `rarity` is missing
  - [x] Returns 400 when `rarity` is not a valid enum value
  - [x] Returns 201 with full item shape on valid request (all fields provided)
  - [x] Returns 201 with defaults applied when only required fields provided (`quantity: 1`, `attunement: false`, `equipped: false`)
  - [x] Returns 500 when DB throws on insert

### 3. Write integration tests — `tests/integration/api/items.test.ts`

- [x] Scaffold test file following `tests/integration/content.integration.test.ts` pattern
- [x] Register two test users via `registerTestUser` in `beforeAll`
- [x] **Auth tests:**
  - [x] GET without auth cookie → 401
  - [x] POST without auth cookie → 401
- [x] **Functional tests:**
  - [x] POST with valid body → 201; returned item has correct fields including defaults
  - [x] POST then GET round-trip: created item appears in GET response
- [x] **User isolation test:**
  - [x] User A creates an item; User B calls GET; User B's response does not contain User A's item

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] `npm test -- --testPathPattern="tests/unit/api/items"` — all unit tests pass
- [x] `npm run test:integration -- --testPathPattern="tests/integration/api/items"` — all integration tests pass
- [x] `npm run type-check` (or `npx tsc --noEmit`) — no type errors
- [x] `npm run build` — build succeeds
- [x] Full unit suite: `npm test` — no regressions
- [x] Full integration suite: `npm run test:integration` — no regressions

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to `feat/items-route-loot-shape-and-tests` and push to remote
- [ ] Open PR from `feat/items-route-loot-shape-and-tests` to `main`. PR body **MUST** include `Closes #245`.
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: dougis
- Reviewer(s): automated CI + agentic review
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/items-route-loot-shape-and-tests/` to `openspec/changes/archive/YYYY-MM-DD-items-route-loot-shape-and-tests/` **in a single commit that includes both the copy and deletion**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-items-route-loot-shape-and-tests/` exists and `openspec/changes/items-route-loot-shape-and-tests/` is gone
- [ ] **Create a doc branch**: `git checkout -b doc/archive-YYYY-MM-DD-items-route-loot-shape-and-tests` then `git push -u origin doc/archive-YYYY-MM-DD-items-route-loot-shape-and-tests`
- [ ] Open a PR from the doc branch to `main` with title `docs: archive items-route-loot-shape-and-tests (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor doc PR until merged; address any comments or CI failures on the doc branch
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/items-route-loot-shape-and-tests doc/archive-YYYY-MM-DD-items-route-loot-shape-and-tests`
