# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b test/rtl-migration-campaign-editor` then immediately `git push -u origin test/rtl-migration-campaign-editor`

## Execution

- [x] **1. Add imports and remove legacy boilerplate**
  - Remove imports: `Root` from `react-dom/client`, `act` from `react`, `createReactRoot`/`unmountReactRoot` from `@/tests/unit/helpers/reactRoot`
  - Add imports: `render`, `screen` from `@testing-library/react`; `userEvent` from `@testing-library/user-event`
  - Remove module-level `container: HTMLDivElement` and `root: Root` variables
  - Remove `beforeEach` and `afterEach` blocks entirely
  - Verify: `grep 'reactRoot\|createReactRoot\|unmountReactRoot' tests/unit/components/CampaignEditor.test.tsx` returns no output

- [x] **2. Write `renderEditor` helper**
  - Add above the test suite:
    ```ts
    function renderEditor(props: Partial<Parameters<typeof CampaignEditor>[0]> = {}) {
      return render(
        <CampaignEditor
          campaign={BASE_CAMPAIGN}
          onSave={jest.fn()}
          onCancel={jest.fn()}
          isNew={false}
          {...props}
        />
      );
    }
    ```
  - Verify: calling `renderEditor()` in a quick smoke test renders without error

- [x] **3. Write `openChapters` helper**
  - Add below `renderEditor`:
    ```ts
    async function openChapters() {
      if (!screen.queryByText('+ Add Chapter')) {
        await userEvent.setup().click(
          screen.getByRole('button', { name: /chapters/i }),
        );
      }
    }
    ```
  - Note: each call to `userEvent.setup()` here is a one-off for the accordion click; individual tests create their own `user` instances for subsequent interactions.

- [x] **4. Migrate `rendering` describe block** (7 tests)
  - Replace each `render({ ... })` call with `renderEditor({ ... })` (or `renderEditor({ campaign: { ...BASE_CAMPAIGN, ... } })`)
  - `container.querySelector('h2')?.textContent` → `screen.getByRole('heading', { level: 2 }).textContent`
  - `container.querySelectorAll('input[type="text"]')[0].value` → `(screen.getByLabelText('Campaign Name *') as HTMLInputElement).value`
  - `container.querySelectorAll('input[type="text"]')[1].value` → `(screen.getByLabelText('Module / Adventure') as HTMLInputElement).value`
  - `container.querySelector('select[data-testid="status-select"]')?.value` → `(screen.getByTestId('status-select') as HTMLSelectElement).value`
  - `container.querySelector('textarea[data-testid="notes-textarea"]')?.value` → `(screen.getByTestId('notes-textarea') as HTMLTextAreaElement).value`
  - `container.querySelector('textarea[data-testid="notes-textarea"]')?.maxLength` → `(screen.getByTestId('notes-textarea') as HTMLTextAreaElement).maxLength`
  - `container.textContent?.toContain('5/10000')` → `expect(screen.getByText('5/10000')).toBeInTheDocument()`
  - Run: `npm test -- --testPathPattern=CampaignEditor`; all 7 rendering tests must pass

- [x] **5. Migrate `validation` describe block** (2 tests)
  - Replace render calls with `renderEditor({ campaign: { ...BASE_CAMPAIGN, name: '' } })`
  - `findButton('Save Campaign').disabled` → `expect(screen.getByRole('button', { name: 'Save Campaign' })).toBeDisabled()`
  - `findButton('Save Campaign').disabled === false` → `expect(screen.getByRole('button', { name: 'Save Campaign' })).not.toBeDisabled()`
  - Run tests; both validation tests must pass

- [x] **6. Migrate `saving` describe block** (4 tests)
  - Add `const user = userEvent.setup()` at top of each `it` block
  - `await act(async () => { findButton('Save Campaign').click(); })` → `await user.click(screen.getByRole('button', { name: 'Save Campaign' }))`
  - Status dropdown interaction: `select.value = X; select.dispatchEvent(...)` → `await user.selectOptions(screen.getByTestId('status-select'), X)`
  - Remove all `act()` wrappers and raw `dispatchEvent` calls
  - Run tests; all 4 saving tests must pass

- [x] **7. Migrate `cancel` describe block** (1 test)
  - `act(() => { findButton('Cancel').click(); })` → `await user.click(screen.getByRole('button', { name: 'Cancel' }))`
  - Make `it` callback `async`
  - Run test; must pass

- [x] **8. Migrate `legacy fields removed` describe block** (2 tests)
  - `Array.from(container.querySelectorAll('label')).map(l => l.textContent)` → `screen.queryByText(/Current Chapter/)`, `screen.queryByText(/Chapter Order/)`
  - `expect(labels.some(l => l?.includes(...))).toBe(false)` → `expect(screen.queryByText(/Current Chapter/)).not.toBeInTheDocument()`
  - Run tests; both must pass

- [x] **9. Migrate `chapters display` describe block** (2 tests)
  - "renders chapter list when chapters present": replace `container.textContent.toContain('Arrival')` etc. with `expect(screen.getByDisplayValue('Arrival')).toBeInTheDocument()` (chapters auto-expand since `chapters.length > 0`)
  - "save with no chapters": replace `render({ ... })` → `renderEditor()`; button click via `user.click`
  - Run tests; both must pass

- [x] **10. Migrate `chapters editing` describe block** (6 tests)
  - Each test: add `const user = userEvent.setup()`
  - `await openChapters()` — keep using the RTL helper from step 3
  - `accordionBtn.click()` → `await user.click(screen.getByRole('button', { name: /chapters/i }))`
  - `addBtn.click()` → `await user.click(screen.getByText('+ Add Chapter'))`
  - `removeBtn.click()` → `await user.click(screen.getByTestId('remove-chapter-1'))`
  - `moveUpBtn.click()` → `await user.click(screen.getByTestId('move-up-1'))`
  - `moveDownBtn.click()` → `await user.click(screen.getByTestId('move-down-0'))`
  - `select.value = X; dispatchEvent(...)` → `await user.selectOptions(screen.getByTestId('current-chapter-select'), X)`
  - `input.value = X; dispatchEvent(...)` → `await user.clear(input); await user.type(input, 'New Arrival')`; assert with `expect(input).toHaveValue('New Arrival')`
  - `container.querySelectorAll('input[data-testid="chapter-title-input"]')` → `screen.getAllByTestId('chapter-title-input')`
  - `container.querySelector('button[data-testid="..."]')` → `screen.getByTestId('...')`
  - `container.querySelector('select[data-testid="current-chapter-select"]')` → `screen.getByTestId('current-chapter-select')`
  - `container.textContent.includes('+ Add Chapter')` checks → `screen.queryByText('+ Add Chapter')` null checks
  - Run tests; all 6 must pass

- [x] **11. Remove unused `findButton`, `getInput`, and legacy `render` function**
  - Delete the three local helper functions that are no longer called
  - Verify no references remain: `grep 'findButton\|getInput\|function render' tests/unit/components/CampaignEditor.test.tsx`
  - Run full test suite: `npm test -- --testPathPattern=CampaignEditor`; all 25 tests must pass

- [x] **12. Verify no legacy imports remain**
  - `grep 'reactRoot\|createReactRoot\|unmountReactRoot\|from.*react.*act\b' tests/unit/components/CampaignEditor.test.tsx` → no output

## Pre-Commit Code Review

- [x] **Before every commit**, spawn the `openspec-review-code` sub-agent. The primary agent must automatically address all findings (complexity, duplication, quality) before committing.

## Validation

- [x] `npm test -- --testPathPattern=CampaignEditor` — all 25 tests pass
- [x] `npm test` — full suite passes with zero regressions
- [x] `npx tsc --noEmit` — no type errors
- [x] `grep 'reactRoot' tests/unit/components/CampaignEditor.test.tsx` — no output
- [x] `grep 'userEvent\.[a-z]' tests/unit/components/CampaignEditor.test.tsx | grep -v 'setup'` — no static API calls remain
- [x] All tasks above marked `[x]`

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Run `openspec-review-code` sub-agent; address all findings before final commit
- [x] Commit: `git add tests/unit/components/CampaignEditor.test.tsx && git commit -m "test: migrate CampaignEditor.test.tsx to RTL (closes #356)"`
- [x] Push: `git push`
- [x] Open PR from `test/rtl-migration-campaign-editor` to `main` with body: `Closes #356`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (never `--admin`)
- [x] Wait 180 seconds for CI and agentic reviewers
- [x] **Monitor PR comments** — address each, commit fixes, validate locally, push, wait 180 seconds, repeat until no unresolved comments
- [x] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing checks, commit, validate locally, push, wait 180 seconds, repeat
- [x] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed; if `CLOSED` notify user

Ownership metadata:
- Implementer: AI agent
- Reviewer(s): @dougis
- Required approvals: 1

Blocking resolution flow:
- CI failure → fix → commit → `npm test && npm run build` → push → re-check
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify `CampaignEditor.test.tsx` on `main` has no `reactRoot` imports
- [x] Mark all tasks `[x]`
- [x] No documentation updates needed (test-only change)
- [ ] Sync approved spec delta: copy `openspec/changes/rtl-migration-campaign-editor/specs/rtl-migration/spec.md` → `openspec/specs/rtl-migration/campaign-editor.md` (or merge into existing `openspec/specs/` RTL spec if present)
- [ ] Archive: move `openspec/changes/rtl-migration-campaign-editor/` to `openspec/changes/archive/YYYY-MM-DD-rtl-migration-campaign-editor/` — stage both copy and deletion in **one commit**
- [ ] Confirm archive exists and original path is gone
- [ ] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-rtl-migration-campaign-editor` → push
- [ ] Open PR from doc branch to `main` with title `docs: archive rtl-migration-campaign-editor (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR
- [ ] Monitor doc PR until merged (same loop as implementation PR)
- [ ] Prune: `git fetch --prune && git branch -d test/rtl-migration-campaign-editor doc/archive-YYYY-MM-DD-rtl-migration-campaign-editor`
