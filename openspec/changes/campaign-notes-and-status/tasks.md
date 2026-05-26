# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/campaign-notes-and-status` then immediately `git push -u origin feature/campaign-notes-and-status`

## Execution

### Phase 1 — Data model and API (type-safe foundation first)

- [x] **1.1 — Update `lib/types.ts`**
  - Remove `active: boolean` from the `Campaign` interface (line ~550)
  - Add `notes: string` (default `''`)
  - Add `status: 'planning' | 'active' | 'on-hold' | 'completed'` (default `'active'`)
  - Verify: `npx tsc --noEmit` — compile errors now point to every stale `active` reference

- [x] **1.2 — Fix POST route (`app/api/campaigns/route.ts`)**
  - Replace `active` destructure with `status`
  - Default `status` to `'active'` when omitted
  - Accept `notes`, default to `''`
  - Ensure `active` is not present in the constructed campaign object

- [x] **1.3 — Fix PATCH route (`app/api/campaigns/[id]/route.ts`)**
  - Replace `active` destructure with `status`
  - Validate `status` against the four allowed values; return 400 if invalid
  - Add `notes` destructure; enforce max 10,000 chars inline; return 400 if over limit
  - Add backwards-compat guard: `const currentStatus = campaign.status ?? 'active'`
  - Remove `active` from the spread update object

- [x] **1.4 — Fix global copy route (`app/api/campaigns/global/[id]/copy/route.ts`)**
  - Replace `active: false` with `status: 'planning'`

### Phase 2 — UI components

- [x] **2.1 — Update `CampaignEditor.tsx`**
  - Replace the active checkbox with a `<select>` status dropdown
  - Options: Planning (`planning`) / Active (`active`) / On Hold (`on-hold`) / Completed (`completed`)
  - Add a notes `<textarea>` with `maxLength={10000}` and a character counter (`{notes.length}/10000`)
  - Update `onChange` handlers and the value passed to `onSave`
  - Ensure no reference to `active` remains in the component

- [x] **2.2 — Update `app/campaigns/page.tsx`**
  - Replace `c.active` filter with `c.status === 'active'` (two locations: session fetch effect and render)
  - Add inline status badge to each campaign row in the management list:
    ```tsx
    <span className={`px-2 py-1 text-xs rounded text-white ${statusBadgeClass(campaign.status)}`}>
      {statusLabel(campaign.status)}
    </span>
    ```
  - Add a `statusBadgeClass` helper (inline or small local function):
    - `planning` → `bg-slate-600`
    - `active` → `bg-green-700`
    - `on-hold` → `bg-yellow-600`
    - `completed` → `bg-gray-600`
  - Update "No active campaigns" CTA text: replace "mark one active or create a new one" with "set one to Active or create a new one"
  - Add status badge to Active Campaign Dashboard card headers (next to campaign name)
  - Add DM Notes snippet card to Active Campaign Dashboard: render first 3–4 lines of `campaign.notes` with a link to edit; hide section when `notes` is empty or whitespace

### Phase 3 — Tests

- [x] **3.1 — Update test fixtures** (replace `active: boolean` with `status: string` in all BASE_CAMPAIGN objects)
  - `tests/unit/components/CampaignsPage.test.tsx` — `active: false` → `status: 'planning'`
  - `tests/unit/components/CampaignEditor.test.tsx` — `active: false` → `status: 'planning'`; `active: true` → `status: 'active'`
  - `tests/unit/utils/campaignContext.test.ts` — `active: true` → `status: 'active'`
  - `tests/unit/storage/campaigns.test.ts` — `active: true` → `status: 'active'`
  - `tests/unit/campaigns-dashboard.test.tsx` — `active: true` → `status: 'active'`; `INACTIVE_CAMPAIGN` → `status: 'planning'`

- [x] **3.2 — Update CampaignEditor tests**
  - Remove "renders active checkbox unchecked/checked" tests
  - Add: renders status dropdown with current value selected
  - Add: onSave called with updated status when dropdown changes
  - Add: notes textarea renders with current value
  - Add: notes textarea has `maxLength={10000}`

- [x] **3.3 — Update CampaignsPage tests**
  - Replace active-based badge assertions with status badge assertions
  - Add: each of the four status values renders with the correct `bg-*` class

- [x] **3.4 — Update campaigns-dashboard tests**
  - Replace `c.active` filter assertions with `c.status === 'active'` semantics
  - Update "No active campaigns" CTA text assertion to match new wording
  - Add: campaign with non-empty notes renders DM Notes snippet
  - Add: campaign with empty notes renders no DM Notes section

- [x] **3.5 — Add API validation tests** (integration tests)
  - PATCH with `status: 'running'` returns 400
  - PATCH with `notes` of 10,001 chars returns 400
  - PATCH with `notes` of 10,000 chars returns 200
  - PATCH with `status: 'completed'` returns 200 with updated status
  - POST with no `status` returns campaign with `status: 'active'`
  - Copy route returns campaign with `status: 'planning'`
  - Neither POST nor PATCH response includes `active` field

- [x] **3.6 — Grep verification** — after all changes, run:
  ```bash
  grep -rn "\.active\b\|active:" app/ lib/ tests/ --include="*.ts" --include="*.tsx" | grep -i "campaign"
  ```
  Result must be zero matches (or only legitimate matches unrelated to the `active` boolean field).

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Review its report and apply fixes for duplication, complexity, and completeness before committing.

## Validation

- [x] `npx tsc --noEmit` — zero type errors
- [x] `npm run test:unit` — all unit tests pass
- [ ] `npm run test:integration` — all integration tests pass
- [x] `npm run build` — build succeeds
- [x] `npm run lint` — zero lint errors
- [x] All completed tasks marked as complete
- [ ] All steps in [Remote push validation] pass

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Type check** — `npx tsc --noEmit` — zero errors
- **Build** — `npm run build` — must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `feature/campaign-notes-and-status` to `main`. PR body must include: `Closes #189`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; address them, commit fixes, follow all steps in [Remote push validation], push; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll using `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, follow all steps in [Remote push validation], push; wait 180 seconds then repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: doug@dougis.com
- Reviewer(s): automated CI + agentic reviewers
- Required approvals: per repo branch protection settings

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/`
- [ ] Archive the change: move `openspec/changes/campaign-notes-and-status/` to `openspec/changes/archive/YYYY-MM-DD-campaign-notes-and-status/` **in a single atomic commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-campaign-notes-and-status/` exists and `openspec/changes/campaign-notes-and-status/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-campaign-notes-and-status` then `git push -u origin doc/archive-YYYY-MM-DD-campaign-notes-and-status`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-campaign-notes-and-status` to `main` with title `docs: archive campaign-notes-and-status (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until it merges; address comments and CI failures, push to the same doc branch, repeat
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feature/campaign-notes-and-status doc/archive-YYYY-MM-DD-campaign-notes-and-status`
