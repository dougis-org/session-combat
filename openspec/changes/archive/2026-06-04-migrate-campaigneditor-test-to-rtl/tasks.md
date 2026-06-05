# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/migrate-campaigneditor-test-to-rtl` then immediately `git push -u origin feat/migrate-campaigneditor-test-to-rtl`

## Execution

### 1. Update `lib/components/ui.tsx` — TextInputField auto-id

- [x] In `TextInputField`, add a helper that converts `label` to a slug: lowercase, replace runs of non-alphanumeric chars with `-`, strip leading/trailing hyphens.
- [x] Compute `resolvedId = id ?? slugify(label)` and pass it to both the `<input id>` and `<FormField htmlFor>`.
- [x] Verify: render `<TextInputField label="Campaign Name *" />` in a test or REPL; confirm `input.id === "campaign-name"` and `label.htmlFor === "campaign-name"`.
- [x] Verify: render with explicit `id="custom"` and confirm `custom` wins.

### 2. Update `app/campaigns/CampaignEditor.tsx` — aria-labels

- [x] Add `aria-label={`Chapter ${index + 1} title`}` to each chapter title `<input>`.
- [x] Add `aria-label={`Remove ${ch.title || `chapter ${index + 1}`}`}` to each remove `<button>`.
- [x] Confirm existing move-up/move-down `aria-label` values follow the pattern `Move chapter N up` / `Move chapter N down` (they already do — this is a verification step only).
- [x] TypeScript: `tsc --noEmit` passes with no new errors.

### 3. Rewrite `tests/unit/components/CampaignEditor.test.tsx`

Work through the file top-to-bottom, replacing each legacy pattern. Complete each sub-step before moving to the next.

#### 3a. File header and imports
- [x] Remove `@jest-environment jsdom` docblock.
- [x] Remove `IS_REACT_ACT_ENVIRONMENT` global assignment.
- [x] Remove imports: `React`, `Root`, `act`, `createReactRoot`, `unmountReactRoot`.
- [x] Add imports: `render`, `screen`, `cleanup` from `@testing-library/react`; `userEvent` from `@testing-library/user-event`.

#### 3b. beforeEach / afterEach
- [x] Remove `beforeEach` (container/root setup) and `afterEach` (unmount + clearAllMocks).
- [x] Add `afterEach(() => { jest.clearAllMocks(); })` — RTL cleanup is automatic, but mocks still need clearing.

#### 3c. Remove helpers, add RTL equivalents
- [x] Delete `render()` wrapper function (was `act(() => root.render(…))`).
- [x] Delete `findButton()` helper.
- [x] Delete `getInput()` helper (was unused — already marked in issue).
- [x] Replace `openChapters()` with RTL version:
  ```ts
  async function openChapters() {
    if (!screen.queryByText('+ Add Chapter')) {
      await userEvent.click(screen.getByRole('button', { name: /chapters/i }));
    }
  }
  ```

#### 3d. Migrate `renderEditor` factory
- [x] Extract a `renderEditor(overrides = {})` helper that calls RTL `render(<CampaignEditor {...props} />)` and returns the mock callbacks:
  ```ts
  function renderEditor(overrides: Partial<Campaign> = {}, extraProps: { isNew?: boolean } = {}) {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    render(
      <CampaignEditor
        campaign={{ ...BASE_CAMPAIGN, ...overrides }}
        onSave={onSave}
        onCancel={onCancel}
        isNew={extraProps.isNew ?? false}
      />
    );
    return { onSave, onCancel };
  }
  ```

#### 3e. Migrate `rendering` describe block (7 tests)
- [x] `shows "Create Campaign" title` → `expect(screen.getByRole('heading', { name: 'Create Campaign' })).toBeInTheDocument()`
- [x] `shows "Edit Campaign" title` → same pattern.
- [x] `populates name input` → `expect(screen.getByRole('textbox', { name: /campaign name/i })).toHaveValue('Test Campaign')`
- [x] `populates moduleName input` → `screen.getByRole('textbox', { name: /module \/ adventure/i })` with `toHaveValue('LMoP')`
- [x] `renders status dropdown` → `expect(screen.getByTestId('status-select')).toHaveValue('on-hold')`
- [x] `renders notes textarea` → `expect(screen.getByTestId('notes-textarea')).toHaveValue('Party at level 5')`
- [x] `notes textarea maxLength` → `expect(screen.getByTestId('notes-textarea')).toHaveAttribute('maxLength', '10000')`
- [x] `character counter` → `expect(screen.getByText('5/10000')).toBeInTheDocument()`

#### 3f. Migrate `validation` describe block (2 tests)
- [x] `save disabled when name empty` → `expect(screen.getByRole('button', { name: /save campaign/i })).toBeDisabled()`
- [x] `save enabled when name has content` → `expect(screen.getByRole('button', { name: /save campaign/i })).not.toBeDisabled()`

#### 3g. Migrate `saving` describe block (4 tests)
- [x] Replace `await act(async () => { findButton('Save Campaign').click(); })` with `await userEvent.click(screen.getByRole('button', { name: /save campaign/i }))`.
- [x] Replace `select.value = 'completed'; select.dispatchEvent(…)` with `await userEvent.selectOptions(screen.getByTestId('status-select'), 'completed')`.
- [x] Same for `on-hold` variant.

#### 3h. Migrate `cancel` describe block (1 test)
- [x] `act(() => { findButton('Cancel').click(); })` → `await userEvent.click(screen.getByRole('button', { name: /cancel/i }))`

#### 3i. Migrate `legacy fields removed` describe block (2 tests)
- [x] `does not render currentChapter input` → `expect(screen.queryByText(/current chapter/i)).not.toBeInTheDocument()`
- [x] `does not render currentChapterOrder input` → `expect(screen.queryByText(/chapter order/i)).not.toBeInTheDocument()`

#### 3j. Migrate `chapters display` describe block (2 tests)
- [x] `renders chapter list when chapters present` → `expect(screen.getByDisplayValue('Arrival')).toBeInTheDocument()` (and same for The Inn, The Dungeon) or use `getByText`.
- [x] `save with no chapters` → click save, assert `onSave.mock.calls[0][0].chapters` equals `[]`.

#### 3k. Migrate `chapters editing` describe block (7 tests)
- [x] `toggles accordion` → `userEvent.click` on accordion button; assert `screen.getByText('+ Add Chapter')` appears then disappears.
- [x] `adds a new chapter row` → `userEvent.click` on `+ Add Chapter`; assert `screen.getAllByRole('textbox', { name: /chapter \d+ title/i })` has length 1.
- [x] `removes a chapter, shifts subsequent` → click `screen.getByRole('button', { name: /remove the inn/i })`; assert remaining inputs via `getByRole('textbox', { name: /chapter 1 title/i })` has value `Arrival`.
- [x] `reorders chapters` → click `screen.getByRole('button', { name: /move chapter 2 up/i })`; assert input order changes.
- [x] `updates currentChapterId` → `userEvent.selectOptions` on `current-chapter-select`.
- [x] `updates chapter title` → `userEvent.clear` + `userEvent.type` on the chapter title input.
- [x] `sets currentChapterId undefined when chapter removed` → click remove; save; assert `currentChapterId` is undefined.

### 4. Run and verify

- [x] `npx jest --testPathPattern CampaignEditor` — all 26 tests pass.
- [x] `npx tsc --noEmit` — no TypeScript errors.
- [x] Grep sanity checks:
  - `grep -n "createReactRoot\|IS_REACT_ACT_ENVIRONMENT\|@jest-environment jsdom\|\.click()\|\.value =" tests/unit/components/CampaignEditor.test.tsx` → zero results.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill on all modified files. The primary agent must automatically address all findings before committing.

## Validation

- [x] `npx jest --testPathPattern CampaignEditor` — all 26 pass.
- [x] `npx jest` — full unit suite passes (no regressions).
- [x] `npx tsc --noEmit` — clean.
- [x] `npm run build` — production build succeeds.
- [x] All tasks in Execution marked complete.

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npx jest`; all tests must pass.
- **Build** — `npm run build`; must succeed with no errors.
- If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure `openspec-review-code` sub-agent was run and all findings addressed before the final commit.
- [x] Commit all changes to `feat/migrate-campaigneditor-test-to-rtl` and push to remote.
- [x] Open PR from `feat/migrate-campaigneditor-test-to-rtl` to `main`. PR body must include `Closes #343`.
- [x] **Immediately** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (never `--admin`).
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments.
- [ ] **Monitor PR comments** — poll autonomously; when comments appear, address, commit fixes, follow remote push validation, push, wait 180 s, repeat.
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing check, follow remote push validation, push, wait 180 s, repeat.
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user. Never force-merge.

Ownership metadata:

- Implementer: AI agent
- Reviewer(s): project maintainer
- Required approvals: 1

Blocking resolution flow:

- CI failure → diagnose test/build output → fix → validate locally → push → re-check.
- Review comment → address → commit → validate locally → push → confirm thread resolved.

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`.
- [x] Verify merged changes appear on `main`.
- [x] Mark all remaining tasks complete.
- [x] No doc updates required beyond this change (test-only + minor a11y attrs).
- [x] Sync approved spec delta: copy `openspec/changes/migrate-campaigneditor-test-to-rtl/specs/rtl-migration/spec.md` to `openspec/specs/rtl-migration/spec.md` (create directory if absent).
- [x] Archive the change: move `openspec/changes/migrate-campaigneditor-test-to-rtl/` to `openspec/changes/archive/2026-06-04-migrate-campaigneditor-test-to-rtl/` **as a single atomic commit** (stage both the new location and the deletion of the old in one commit — never split).
- [x] Confirm `openspec/changes/archive/2026-06-04-migrate-campaigneditor-test-to-rtl/` exists and `openspec/changes/migrate-campaigneditor-test-to-rtl/` is gone.
- [x] Create doc branch: `git checkout -b doc/archive-2026-06-04-migrate-campaigneditor-test-to-rtl` then `git push -u origin doc/archive-…`
- [x] Open PR from doc branch to `main` with title `docs: archive migrate-campaigneditor-test-to-rtl (2026-06-04)`.
- [x] Immediately enable auto-merge on doc PR.
- [x] Monitor doc PR until merged (same loop).
- [x] Prune merged local branches: `git fetch --prune && git branch -d feat/migrate-campaigneditor-test-to-rtl doc/archive-2026-06-04-migrate-campaigneditor-test-to-rtl`
