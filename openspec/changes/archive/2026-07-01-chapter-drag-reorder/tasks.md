# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/chapter-drag-reorder` then immediately `git push -u origin feat/chapter-drag-reorder`

## Execution

### Task 1 — Install @dnd-kit dependencies

- [x] `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [x] Verify package.json has three new entries and `package-lock.json` is updated
- [x] Run `npm run build` — must succeed

### Task 2 — Refactor CampaignEditor: extract SortableChapterRow + wire DnD

- [x] In `app/campaigns/CampaignEditor.tsx`:
  - Remove `handleMoveUp` and `handleMoveDown` functions
  - Add `handleDragEnd` using `arrayMove` from `@dnd-kit/sortable` and renormalize `order` values
  - Import `DndContext`, `closestCenter`, `PointerSensor`, `TouchSensor`, `KeyboardSensor`, `useSensor`, `useSensors` from `@dnd-kit/core`
  - Import `SortableContext`, `verticalListSortingStrategy`, `useSortable`, `arrayMove` from `@dnd-kit/sortable`
  - Import `CSS` from `@dnd-kit/utilities`
  - Define `SortableChapterRow` component inline (above the main component) using `useSortable(id)`
  - The drag handle `<span>` receives `{...listeners}` and `{...attributes}` from `useSortable`; add `data-testid="drag-handle-{index}"` and title/aria-label "Drag to reorder"
  - Row wrapper receives `ref={setNodeRef}` and `style={{ transform: CSS.Transform.toString(transform), transition }}`
  - While `isDragging`: apply `opacity-50` and a subtle box-shadow for elevation
  - When `saving`: apply `pointer-events-none opacity-50` to the drag handle
  - Replace the inline chapter row `divs` with `<SortableChapterRow>` instances
  - Wrap the chapter list with `<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>` + `<SortableContext items={chapters.map(ch => ch.id)} strategy={verticalListSortingStrategy}>`
  - Remove the `▲` / `▼` button `<div className="flex gap-1">` block entirely
- [x] Verify chapter list renders and existing non-drag interactions still work (title edit, activate, remove, add)

### Task 3 — Delete the move-button unit test

- [x] In `tests/unit/components/CampaignEditor.test.tsx`, delete the test `'reorders chapters with move buttons and updates order index'` (lines ~227–257)
- [x] Run `npm run test:unit -- --testPathPattern=CampaignEditor` — must pass with no references to `move-up-*` / `move-down-*`

### Task 4 — Write Playwright E2E spec for drag-reorder

Create `tests/e2e/campaigns.spec.ts` covering:

- [x] **Setup**: Create a campaign with 3 chapters (use existing fixture/helper patterns from `tests/e2e/helpers/`)
- [x] **Scenario: drag reorder**: Drag `data-testid="drag-handle-0"` onto `data-testid="drag-handle-2"` using `locator.dragTo()`; assert chapter title inputs are in the new order
- [x] **Scenario: save persistence**: After drag reorder, click "Save Campaign"; navigate away and reopen the editor; assert chapters display in the saved order
- [x] **Scenario: active chapter identity preserved**: Mark a chapter as active, reorder, assert ACTIVE badge follows the correct chapter by ID
- [x] If `locator.dragTo()` is unreliable for pointer events, fall back to `page.mouse.move/down/up` sequence
- [x] Run `npx playwright test tests/e2e/campaigns.spec.ts` — must pass

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings to the code without presenting findings to the user or asking for confirmation. Re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm run test:unit` — all unit tests pass
- [x] `npx playwright test` — all E2E tests pass (including new campaigns.spec.ts)
- [x] `npm run build` — build succeeds with no type errors
- [x] `npm run lint` (if configured) — no lint errors
- [x] No `data-testid="move-up-*"` or `data-testid="move-down-*"` remain in `app/campaigns/CampaignEditor.tsx`
- [x] `data-testid="drag-handle-{n}"` present on each chapter row in the rendered output
- [x] Keyboard sorting works: Tab to handle, Space to lift, ArrowDown, Space to drop — order changes

## Remote push validation

**Full path** (non-.md files changed):

- **Unit tests** — `npm run test:unit` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **E2E tests** — `npx playwright test` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/chapter-drag-reorder` and push to remote
- [x] Open PR from `feat/chapter-drag-reorder` to `main`. PR body must include `Closes #462`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED` exit and notify user:
  1. **Build and tests** — run all steps in Remote push validation; fix failures, commit, push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads; address each unresolved thread, commit, run validation, push, wait 180s; continue until all threads resolved
  3. **CI check failures** — only after comments resolved, poll `gh pr checks <PR-URL>`; fix failures, commit, run validation, push, wait 180s; restart loop from step 1

Ownership metadata:

- Implementer: @dougis
- Reviewer(s): (assign as appropriate)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec deltas into `openspec/specs/`:
  - Copy `openspec/changes/chapter-drag-reorder/specs/drag-handle/spec.md` → `openspec/specs/drag-handle/spec.md`
  - Copy `openspec/changes/chapter-drag-reorder/specs/drag-reorder/spec.md` → `openspec/specs/drag-reorder/spec.md`
  - Copy `openspec/changes/chapter-drag-reorder/specs/keyboard-a11y/spec.md` → `openspec/specs/keyboard-a11y/spec.md`
  - Copy `openspec/changes/chapter-drag-reorder/specs/save-persistence/spec.md` → `openspec/specs/save-persistence/spec.md`
  - Update relative links in each copied spec: replace `../../design.md` with `../../changes/archive/2026-07-01-chapter-drag-reorder/design.md` and `../../tasks.md` with `../../changes/archive/2026-07-01-chapter-drag-reorder/tasks.md`
- [x] Archive the change: move `openspec/changes/chapter-drag-reorder/` to `openspec/changes/archive/2026-07-01-chapter-drag-reorder/` — stage both the copy and deletion in a **single commit**
- [x] Confirm `openspec/changes/archive/2026-07-01-chapter-drag-reorder/` exists and `openspec/changes/chapter-drag-reorder/` is gone
- [x] **Create a doc branch**: `git checkout -b doc/archive-2026-07-01-chapter-drag-reorder` then `git push -u origin doc/archive-2026-07-01-chapter-drag-reorder`
- [x] Open PR from `doc/archive-2026-07-01-chapter-drag-reorder` to `main` with title `docs: archive chapter-drag-reorder (2026-07-01)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin`)
- [x] Monitor doc PR until merged; address any comments or CI failures by pushing to the same doc branch
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D feat/chapter-drag-reorder doc/archive-2026-07-01-chapter-drag-reorder`
