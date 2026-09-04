# Tasks

Change: `legendary-badge-opens-detail` · Issue: #695 · Schema: sdd-with-feedback-loop

Ownership metadata:

- Implementer: (unassigned — Doug or delegated agent)
- Reviewer(s): Doug; automated `pr-review-toolkit:review-pr`
- Required approvals: 1 human approval + green review gate

## Preparation

- [x] **Step 1 — Confirm the dedicated worktree exists:** verify `.worktrees/legendary-badge-opens-detail` exists (created during propose) and `cd` into it. If missing, from the primary checkout run `git fetch origin main` then `git worktree add .worktrees/legendary-badge-opens-detail -b legendary-badge-opens-detail origin/main`. Never checkout this branch inside the primary checkout.
- [x] **Step 2 — Confirm the branch is published:** `git -C .worktrees/legendary-badge-opens-detail rev-parse --abbrev-ref --symbolic-full-name @{u}` resolves to `origin/legendary-badge-opens-detail`. If not, `git push -u origin legendary-badge-opens-detail` from inside the worktree. (Already done during propose — verify only.)
- [x] **Step 3 — Restore local OpenSpec tooling in the worktree:** ensure `.github/openspec-shared` submodule is initialized (`git submodule update --init .github/openspec-shared`) so `openspec/config.yaml`, `openspec/schemas`, and `openspec/templates` symlinks resolve.
- [x] **Step 4 — Install deps in the worktree:** `npm ci` (worktree has its own `node_modules`; if `next build` later fails on a symlinked `node_modules`, use the hardlink-copy workaround noted in project memory).

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list. If not listed, halt, tell the user the plugin is required, provide installation guidance, and do not proceed until confirmed installed.

## Execution

All work happens inside `.worktrees/legendary-badge-opens-detail`.

- [x] **Issue lifecycle: mark in-progress** — `gh issue edit 695 --add-label "in-progress"`. Then discover the repo's GitHub Project (`gh project list --owner dougis-org --format json`), resolve the status option matching "In Progress" (`gh project field-list <n> --owner dougis-org --format json`), and move the item via `gh project item-edit`. If no project item, warn and continue. If the token lacks `project` scope, tell the user to run `gh auth refresh -s project` and skip the project move (label still applied).
- [x] **Audit existing badge assertions** — `grep -rn "legendary-action-badge" tests/` and inspect `tests/unit/components/CombatantCard*.test.tsx`, `tests/unit/components/CombatantCard.hp.test.tsx:263-264`, `tests/e2e/combat.spec.ts` (lines ~391-461), and any `ActiveCombatView` / `CombatantDetailPanel` test. Note assertions that hard-code the `span` tag or exact markup. (Prior audit: current tests query by `data-testid` / text only — expected no changes needed, re-verify.)

**`lib/components/CombatantCard.tsx`:**

- [x] **Widen the `onShowDetails` prop type** (`CombatantCard.tsx:23`) to `onShowDetails?: (combatantId: string, position: { top: number; left: number }, options?: { focusSection?: 'legendary' }) => void`. Additive only — do not touch the existing name-button call site (`:483-486`).
- [x] **Convert badge to a button** — replace the `<span data-testid="legendary-action-badge">` (`:551-558`) with `<button type="button" data-testid="legendary-action-badge" aria-label={`Open ${combatant.name} details — legendary actions`} title="Legendary actions — open details">`. Preserve the `⚡ {combatant.legendaryActionsRemaining ?? combatant.legendaryActionCount}/{combatant.legendaryActionCount}` content and `text-sm font-semibold text-amber-400 whitespace-nowrap`; add Tailwind resets (`p-0 border-0 bg-transparent leading-none`) and an affordance (`cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400`). Keep the `(combatant.legendaryActionCount ?? 0) > 0` guard.
- [x] **Wire the badge onClick** — mirror the name button's `getBoundingClientRect()` pattern but pass the focus option:
  ```tsx
  onClick={(e) => {
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    onShowDetails?.(combatant.id, { top: rect.bottom, left: rect.left }, { focusSection: 'legendary' });
  }}
  ```
- [x] **Remove dead imports** — delete the `LegendaryActionsPanel` and `LairActionsSlot` import lines (`:8-9`). Confirm `grep -n "LegendaryActionsPanel\|LairActionsSlot" lib/components/CombatantCard.tsx` returns nothing.

**`lib/components/ActiveCombatView.tsx`:**

- [x] Add `const [detailFocusSection, setDetailFocusSection] = useState<'legendary' | undefined>(undefined)` alongside the existing `detailPosition` state. (Implemented in `useCombat.ts`, the hook that actually owns this state — `ActiveCombatView` consumes it via the hook, not local `useState`.)
- [x] In the `onShowDetails` handler (`:173-176`), add `setDetailFocusSection(options?.focusSection)` (accept the third arg).
- [x] On the panel's `onClose` (`:400`), also call `setDetailFocusSection(undefined)`.
- [x] Pass `focusSection={detailFocusSection}` to `<CombatantDetailPanel>` (`:393-400`).

**`lib/components/CombatantDetailPanel.tsx`:**

- [x] Add optional prop `focusSection?: 'legendary'` to `CombatantDetailPanelProps`.
- [x] Wrap the existing `<LegendaryActionsPanel .../>` (`:95-98`) in `<div ref={legendaryRef} data-testid="detail-legendary-section" tabIndex={-1}>`.
- [x] Add a `useEffect` keyed on `[combatant.id, focusSection]`: when `focusSection === 'legendary'` and `legendaryRef.current` has a focusable descendant, call `legendaryRef.current.scrollIntoView?.({ block: 'start' })` (guarded), then focus the first focusable control inside (`querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')`), falling back to `legendaryRef.current.focus()`. Do nothing when `focusSection` is undefined.
- [x] Do **not** modify `LegendaryActionsPanel.tsx` or `LairActionsSlot.tsx`.

**Cross-cutting:**

- [x] **Reuse check** — if the badge and name-button onClick now share the rect→handler shape, extract a small local closure `openDetail(e, options?)` in `CombatantCard`'s body (no new file). (Kept as two small independent onClick handlers — the shapes diverge slightly (third-arg literal vs none) and extracting a closure would not shrink the diff meaningfully; declined per "small, low-value extraction" judgment call.)
- [x] **Update `.wolf/anatomy.md`** entries for the three changed components and append a line to `.wolf/memory.md`.
- [x] **Confirm every scenario** in `openspec/changes/legendary-badge-opens-detail/specs/legendary-action-tracking/spec.md` is covered by code + a test before moving on.

### Test tasks

- [x] **Update any pre-existing assertions** flagged in the audit (expected: none — confirmed).
- [x] **`CombatantCard` badge tests** (`tests/unit/components/CombatantCard.legendary-badge.test.tsx`, reuse `renderCard` helper):
  - Badge is `getByRole('button', { name: /legendary actions/i })` for `{ legendaryActionCount: 3, legendaryActionsRemaining: 2 }` and shows `2/3`; the element is a `BUTTON` with `type="button"`.
  - Click calls a mocked `onShowDetails` with `(combatant.id, { top, left }, { focusSection: 'legendary' })`.
  - `userEvent.keyboard('{Enter}')` and `' '` while focused each call `onShowDetails`.
  - No `onShowDetails` prop → activating the badge does not throw.
  - Badge absent for `legendaryActionCount` `0` and `undefined`, including when `lairActions` is non-empty.
- [x] **`CombatantDetailPanel` scroll/focus tests** (`tests/unit/components/CombatantDetailPanel.focusSection.test.tsx`):
  - Before each: `Element.prototype.scrollIntoView = jest.fn()`.
  - `focusSection="legendary"` + populated `legendaryActions` → `scrollIntoView` called on the section wrapper; `document.activeElement` is within `getByTestId('detail-legendary-section')`.
  - No `focusSection` → `scrollIntoView` not called; focus not inside the section.
  - `focusSection="legendary"` + empty `legendaryActions` (panel renders null) → no throw, panel still renders.
- [x] **`ActiveCombatView` wiring test** (`tests/unit/components/ActiveCombatView.legendaryFocus.test.tsx`, new file — extends the `combat` prop mock rather than an existing file, since `detailFocusSection` lives in the `useCombat` hook, not local `ActiveCombatView` state):
  - Mock `scrollIntoView`; render active combat with a legendary combatant; click the badge; assert the detail panel appears and `scrollIntoView` was called.
  - Open the same panel via the combatant-name control; assert `scrollIntoView` not called.
- [x] **Static check** — `grep` for the removed imports returns nothing; `npm run lint` clean for `CombatantCard.tsx`.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings to the code — no stopping, no presenting the list, no confirmation. Apply fixes, re-run tests, then commit.

## Validation

- [x] `npm run test:unit` — all pass: 288 suites / 3625 tests (note: repo has **no** `npm test` script)
- [x] `npm run lint` — clean (0 errors, 2 pre-existing warnings in unrelated `SceneFeedItem.tsx`; removed imports no longer flagged)
- [x] `npm run typecheck` (`tsc --noEmit`) — clean; `onShowDetails` widening is additive (existing call sites untouched) and `CombatantDetailPanelProps` only gained an optional prop
- [x] `npm run build` — succeeds (43 routes generated, no errors)
- [ ] `openwolf designqc` (or manual screenshots) — not run: no `.wolf/` in this worktree (gitignored, primary-checkout only) and no running dev server in this session; deferred to CI/manual QA before merge — flagging as an open item rather than skipping silently
- [x] Security / code-quality checks required by project standards (Verity gate) pass — Verity pre-commit gate: PASS on the first commit, WARN (non-blocking) on the review-fix commit; no self-waive used
- [ ] E2E: no new specs; run the existing `tests/e2e/combat.spec.ts` legendary specs and confirm they stay green (badge located by `data-testid`, still valid as a `button`) — not run locally in this worktree (no Playwright browsers installed); will confirm via CI's E2E job before merge
- [x] All completed tasks marked complete (up to this point)
- [ ] All steps in [Remote push validation] pass — pending CI results on the current push (048a904f)

## Remote push validation

Determine docs-only vs full: `git diff --name-only origin/main...HEAD`. This change touches `.tsx` files, so use the **full path**:

- **Unit tests** — `npm run test:unit`; all pass
- **Integration tests** — run project integration suite (`npm run test:integration` if present); all pass
- **Regression / E2E** — run affected unit tests plus the existing `combat.spec.ts` legendary specs; full E2E if CI requires it.
- **Build** — `npm run build`; succeeds with no errors

If any required step fails, iterate and fix before pushing.

## PR and Merge

- [x] Confirm the `openspec-review-code` sub-agent ran and findings were addressed before the final commit
- [x] Commit all changes in the worktree and push to `origin/legendary-badge-opens-detail`
- [x] Open PR → `main`. PR body **must** include `Closes #695`. Summarize: legendary-action badge → button that opens the existing detail panel scrolled to + focused on the Legendary Actions section (option C from #695, with auto-scroll/focus per requester); `onShowDetails` widened additively with an optional `{ focusSection }`; `CombatantDetailPanel` gains an optional `focusSection` prop; dead imports removed; name-button open path unchanged. → PR #704.
- [x] **Issue lifecycle: mark in-review** — `gh issue edit 695 --add-label "in-review" --remove-label "in-progress"`; move the project item to the "In Review" column (same discovery pattern; warn and skip if not found).
- [x] Wait 60s for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero remain. If no progress after 3+ iterations, report the stall with remaining findings and wait for human guidance. (code-reviewer + pr-test-analyzer + silent-failure-hunter dispatched. Fixed: aria-label dropped the R/N count (a11y); missing coverage for the two detailFocusSection reset paths (Escape, panel close). Not fixed — accepted as spec'd: badge can open a panel whose legendary section is empty when legendaryActionCount > 0 but legendaryActions is empty, which is the explicit "Focus request with no legendary content is a safe no-op" scenario in specs/legendary-action-tracking/spec.md. Deferred as non-blocking polish: literal-type dedup, focus target choice (Restore All vs section container), conditional wrapper rendering.)
- [ ] **Enable auto-merge only after the review gate passes:** `gh pr merge <PR-URL> --auto --squash` (repo ruleset allows squash only; NEVER `--merge`, NEVER `--admin`)
- [ ] **Iterate until merged** — loop until `gh pr view <PR-URL> --json state` returns `MERGED` (if `CLOSED`, exit and notify the user); never wait for a human to report the merge, never force-merge:
  1. **Build and tests** — run [Remote push validation]; fix failures, commit, push first
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, run [Remote push validation], push, wait 180s; repeat until all resolved (reply + resolve each thread via the `resolveReviewThread` GraphQL mutation)
  3. **CI failures** — only after comments are resolved, poll `gh pr checks <PR-URL>`; fix failing required checks, commit, run [Remote push validation], push, wait 180s; restart from step 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate (or `verity feedback finding ... false_positive` if genuinely a false positive) → commit → validate → push → re-scan
- Review comment → address → commit → validate → push → reply + resolve thread

## Post-Merge

- [ ] From the **primary checkout**: `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged change appears on `main`
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Update any repo docs impacted (none expected beyond `.wolf/*`)
- [ ] Sync the approved spec delta into `openspec/specs/legendary-action-tracking/spec.md`: apply the MODIFIED "Counter badge visible in combatant row" requirement (new scenarios + legendary-only text) and add the ADDED "Detail panel focuses the legendary section on request" requirement. Update relative links in the promoted file to point at `../../changes/archive/YYYY-MM-DD-legendary-badge-opens-detail/design.md` / `tasks.md`.
- [ ] Archive: move `openspec/changes/legendary-badge-opens-detail/` → `openspec/changes/archive/YYYY-MM-DD-legendary-badge-opens-detail/`, staging the copy and the deletion in a **single** commit
- [ ] Confirm the archive dir exists and the original is gone
- [ ] Create the doc branch: `git checkout -b doc/archive-YYYY-MM-DD-legendary-badge-opens-detail` then `git push -u origin doc/archive-YYYY-MM-DD-legendary-badge-opens-detail` (docs-only: spec sync + archive move — **no code**)
- [ ] Open a PR `docs: archive legendary-badge-opens-detail (YYYY-MM-DD)` → `main`; do **not** push directly to `main`
- [ ] Immediately enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until merged (same loop; push fixes to the doc branch)
- [ ] **Issue lifecycle: close** — once both PRs merge, confirm #695 is closed by `Closes #695`; move the project item to "Done" if not automatic
- [ ] Remove the worktree: `git worktree remove .worktrees/legendary-badge-opens-detail`
- [ ] Prune merged branches: `git fetch --prune` and `git branch -D legendary-badge-opens-detail doc/archive-YYYY-MM-DD-legendary-badge-opens-detail`

### Completion checklist

- [ ] `.wolf/anatomy.md` + `.wolf/memory.md` updated
- [ ] Docs updated (if any)
- [ ] Approved spec delta (MODIFIED + ADDED requirements) synced to `openspec/specs/legendary-action-tracking/spec.md`
- [ ] Change archived in a single atomic commit
- [ ] Worktree removed and merged local branches pruned
