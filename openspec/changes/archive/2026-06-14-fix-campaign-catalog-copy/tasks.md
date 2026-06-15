# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/campaign-catalog-copy` then immediately `git push -u origin fix/campaign-catalog-copy`

## Execution

### Task 1 — Fix copy route: add member record creation with rollback

File: `app/api/campaigns/global/[id]/copy/route.ts`

After `await storage.saveCampaign(campaign)`, add:

```ts
try {
  await storage.addMember({
    id: randomUUID(),
    campaignId: campaign.id,
    userId: auth.userId,
    role: 'dm',
    status: 'active',
    history: [{ action: 'active' as const, by: auth.userId, at: new Date() }],
  });
} catch (memberError) {
  try {
    await storage.deleteCampaign(campaign.id, auth.userId);
  } catch (rollbackError) {
    console.error('Failed to rollback campaign creation after member insert error:', rollbackError);
  }
  throw memberError;
}
```

Verify: `POST /api/campaigns/global/<templateId>/copy` → `GET /api/campaigns/<newId>` returns 200.

### Task 2 — Sort global campaign templates alphabetically

File: `lib/storage.ts`, method `loadGlobalCampaignTemplates`

Add `.sort({ name: 1 })` to the MongoDB query:

```ts
.find({ userId: GLOBAL_USER_ID })
.sort({ name: 1 })
.toArray()
```

Verify: GET /api/campaigns/global returns templates in alphabetical order.

### Task 3 — Add search input to campaign catalog UI

File: `app/campaigns/page.tsx`

- Add state: `const [catalogSearch, setCatalogSearch] = useState('');`
- Derive filtered list: `const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(catalogSearch.toLowerCase()));`
- Replace `templates.map(...)` in the catalog grid with `filteredTemplates.map(...)`
- Add a search input above the grid (inside the catalog section, below the `<h2>`):

```tsx
<input
  type="text"
  placeholder="Search templates..."
  value={catalogSearch}
  onChange={(e) => setCatalogSearch(e.target.value)}
  className="w-full md:w-80 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm mb-4 focus:outline-none focus:border-blue-500"
/>
```

- Add empty state when `filteredTemplates.length === 0` and `catalogSearch` is non-empty:
  ```tsx
  <p className="text-gray-400">No templates match your search.</p>
  ```

Verify: typing in the search input filters the displayed templates without a network call.

### Task 4 — Integration test: copy campaign from catalog → campaign accessible

File: `tests/integration/campaigns-catalog-copy.test.ts` (new file)

Test: `POST /api/campaigns/global/<templateId>/copy`
- Creates a test global campaign template (or uses a seeded one)
- Calls the copy endpoint as an authenticated user
- Asserts response status 201 and returns a campaign with a valid `id`
- Calls `GET /api/campaigns/<newId>` and asserts 200
- Queries `campaignMembers` collection directly and asserts a record exists with `{ campaignId: <newId>, userId: <user>, role: 'dm', status: 'active' }`
- Cleans up: deletes the campaign and member record after test

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Apply all clearly-correct findings directly to the code without stopping or asking for confirmation. Re-run tests to confirm they pass, then commit.

## Validation

- [x] `npm run test:ci -- --testPathPattern=campaigns-catalog-copy` — integration test passes
- [x] `npm run test:unit` — full unit test suite passes
- [x] `npm run build` — build succeeds
- [x] `npx tsc --noEmit` — no type errors (pre-existing errors in unrelated test files only)
- [x] Manual smoke: copy a template from the UI catalog → navigate to the copied campaign → no error
- [x] Manual smoke: search in catalog filters results without page reload
- [x] All completed tasks marked as complete

## Remote push validation

**Full path** (non-`.md` files changed):

- **Unit tests** — `npm test`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors

If any step fails, iterate and fix before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings addressed before the final commit
- [x] Commit all changes to `fix/campaign-catalog-copy` and push to remote
- [x] Open PR from `fix/campaign-catalog-copy` to `main`. PR body must include: **Closes #419**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash`
- [x] Wait 180 seconds for CI and agentic reviewers
- [x] **Iterate until merged** — repeat continuously until `gh pr view <PR-URL> --json state` returns `MERGED`:
  1. Run [Remote push validation]; fix failures, commit, push
  2. Poll `gh pr view <PR-URL> --json reviewThreads`; address all unresolved threads, commit, push, wait 180s
  3. Poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, push, wait 180s

Ownership metadata:

- Implementer: dougis
- Reviewer(s): automated CI + agentic reviewer
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on `main`
- [x] Mark all remaining tasks as complete
- [x] Sync approved spec deltas to `openspec/specs/`:
  - Copy `openspec/changes/archive/2026-06-14-fix-campaign-catalog-copy/specs/campaign-catalog-copy/spec.md` → `openspec/specs/campaign-catalog-copy/spec.md`
  - Copy `openspec/changes/archive/2026-06-14-fix-campaign-catalog-copy/specs/campaign-catalog/spec.md` → `openspec/specs/campaign-catalog/spec.md`
  - Update relative links in both files: replace `../../design.md` with `../../changes/archive/2026-06-14-fix-campaign-catalog-copy/design.md`
- [x] Archive: move `openspec/changes/fix-campaign-catalog-copy/` to `openspec/changes/archive/2026-06-14-fix-campaign-catalog-copy/` — stage both the new location and deletion of the old in a **single commit**
- [x] Confirm archive exists and original location is gone
- [x] Create doc branch: `git checkout -b doc/archive-2026-06-14-fix-campaign-catalog-copy` → `git push -u origin doc/archive-2026-06-14-fix-campaign-catalog-copy`
- [ ] Open PR from doc branch to `main` with title `docs: archive fix-campaign-catalog-copy (YYYY-MM-DD)` — **do NOT push directly to main**
- [ ] **IMMEDIATELY** enable auto-merge on doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor doc PR until merged; address any comments or CI failures
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix/campaign-catalog-copy doc/archive-YYYY-MM-DD-fix-campaign-catalog-copy`
