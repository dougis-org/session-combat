# Tasks

Change: `legendary-badge-opens-detail` · Issue: #695 · Schema: sdd-with-feedback-loop

Ownership metadata:

- Implementer: (unassigned — Doug or delegated agent)
- Reviewer(s): Doug; automated `pr-review-toolkit:review-pr`
- Required approvals: 1 human approval + green review gate

## Preparation

- [ ] **Step 1 — Confirm the dedicated worktree exists:** verify `.worktrees/legendary-badge-opens-detail` exists (created during propose) and `cd` into it. If missing, from the primary checkout run `git fetch origin main` then `git worktree add .worktrees/legendary-badge-opens-detail -b legendary-badge-opens-detail origin/main`. Never checkout this branch inside the primary checkout.
- [ ] **Step 2 — Confirm the branch is published:** `git -C .worktrees/legendary-badge-opens-detail rev-parse --abbrev-ref --symbolic-full-name @{u}` resolves to `origin/legendary-badge-opens-detail`. If not, `git push -u origin legendary-badge-opens-detail` from inside the worktree. (Already done during propose — verify only.)
- [ ] **Step 3 — Restore local OpenSpec tooling in the worktree:** ensure `.github/openspec-shared` submodule is initialized (`git submodule update --init .github/openspec-shared`) so `openspec/config.yaml`, `openspec/schemas`, and `openspec/templates` symlinks resolve.
- [ ] **Step 4 — Install deps in the worktree:** `npm ci` (worktree has its own `node_modules`; if `next build` later fails on a symlinked `node_modules`, use the hardlink-copy workaround noted in project memory).

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list. If not listed, halt, tell the user the plugin is required, provide installation guidance, and do not proceed until confirmed installed.

## Execution

All work happens inside `.worktrees/legendary-badge-opens-detail`.

- [ ] **Issue lifecycle: mark in-progress** — `gh issue edit 695 --add-label "in-progress"`. Then discover the repo's GitHub Project (`gh project list --owner dougis-org --format json`), resolve the status option matching "In Progress" (`gh project field-list <n> --owner dougis-org --format json`), and move the item via `gh project item-edit`. If no project item, warn and continue. If the token lacks `project` scope, tell the user to run `gh auth refresh -s project` and skip the project move (label still applied).
- [ ] **Audit existing badge assertions** — `grep -rn "legendary-action-badge" tests/` and inspect `tests/unit/components/CombatantCard*.test.tsx` and any `ActiveCombatView` test referencing it. Note assertions that hard-code the `span` tag or exact markup; they will need updating in the test task below.
- [ ] **Convert badge to a button** — in `lib/components/CombatantCard.tsx` (currently `:551-558`), replace the `<span data-testid="legendary-action-badge">` with `<button type="button" data-testid="legendary-action-badge" aria-label={`Open ${combatant.name} details — legendary actions`} title="Legendary actions — open details">`. Preserve the `⚡ {combatant.legendaryActionsRemaining ?? combatant.legendaryActionCount}/{combatant.legendaryActionCount}` content and the `text-sm font-semibold text-amber-400 whitespace-nowrap` classes; add Tailwind resets (`p-0 border-0 bg-transparent leading-none`) and an affordance (`cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400`). Keep the enclosing `(combatant.legendaryActionCount ?? 0) > 0` guard.
- [ ] **Wire the badge onClick to `onShowDetails`** — mirror the combatant-name button at `CombatantCard.tsx:483-486`:
  ```tsx
  onClick={(e) => {
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    onShowDetails?.(combatant.id, { top: rect.bottom, left: rect.left });
  }}
  ```
  Do **not** add a new prop; `onShowDetails` already exists (`CombatantCard.tsx:23`) and is already passed by `ActiveCombatView` (`:173-176`).
- [ ] **Remove dead imports** — delete lines importing `LegendaryActionsPanel` and `LairActionsSlot` from `lib/components/CombatantCard.tsx` (`:8-9`). Confirm `grep -n "LegendaryActionsPanel\|LairActionsSlot" lib/components/CombatantCard.tsx` returns nothing.
- [ ] **Do not touch** `lib/components/ActiveCombatView.tsx`, `CombatantDetailPanel.tsx`, `LegendaryActionsPanel.tsx`, `LairActionsSlot.tsx`, `lib/utils/combat.ts`, or any combat state/persistence.
- [ ] **Reuse check** — confirm no existing helper already wraps "open detail from a rect" that should be extracted; if the name button and badge now duplicate the same 4-line handler, extract a local `openDetail(e)` closure in the component body (keep it minimal, no new file).
- [ ] **Update `.wolf/anatomy.md`** entry for `lib/components/CombatantCard.tsx` (badge now interactive; dead imports removed) and append a line to `.wolf/memory.md`.
- [ ] **Confirm acceptance criteria** in `openspec/changes/legendary-badge-opens-detail/specs/legendary-action-tracking/spec.md` are all covered by code + tests before moving on.

### Test tasks

- [ ] **Update pre-existing assertions** flagged in the audit step so they expect a `button` (keep `R/N` text assertions).
- [ ] **Add `CombatantCard` badge component tests** (RTL, `tests/unit/components/`):
  - Badge renders as `getByRole('button', { name: /legendary actions/i })` for `{ legendaryActionCount: 3, legendaryActionsRemaining: 2 }` and shows `2/3`.
  - Clicking the badge calls a mocked `onShowDetails` with `combatant.id` as the first arg.
  - Keyboard activation (`userEvent.keyboard('{Enter}')` and `' '` while focused) calls `onShowDetails`.
  - Rendering without `onShowDetails` and activating the badge does not throw and has no side effects.
  - Badge is absent when `legendaryActionCount` is `0` / `undefined`.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings to the code — no stopping, no presenting the list, no confirmation. Apply fixes, re-run tests, then commit.

## Validation

- [ ] `npm run test:unit` — all pass (note: repo has **no** `npm test` script)
- [ ] `npm run lint` — clean (the removed imports should no longer be flagged)
- [ ] `npm run typecheck` (or `tsc --noEmit` per project config) — clean; confirm `CombatantCardProps` is unchanged
- [ ] `npm run build` — succeeds
- [ ] `openwolf designqc` (or a manual screenshot of a legendary combatant row) — badge appearance preserved, hover/focus affordance visible, no layout shift
- [ ] Security / code-quality checks required by project standards (Verity gate) pass; do not self-waive findings
- [ ] E2E: not applicable (component-only change) — skip
- [ ] All completed tasks marked complete
- [ ] All steps in [Remote push validation] pass

## Remote push validation

Determine docs-only vs full: `git diff --name-only origin/main...HEAD`. This change touches `.tsx` files, so use the **full path**:

- **Unit tests** — `npm run test:unit`; all pass
- **Integration tests** — run project integration suite (`npm run test:integration` if present); all pass
- **Regression / E2E** — component-only change; run affected unit tests. Full E2E only if CI requires it.
- **Build** — `npm run build`; succeeds with no errors

If any required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Confirm the `openspec-review-code` sub-agent ran and findings were addressed before the final commit
- [ ] Commit all changes in the worktree and push to `origin/legendary-badge-opens-detail`
- [ ] Open PR → `main`. PR body **must** include `Closes #695`. Summarize: badge → button opening the existing detail panel (option C from #695), dead imports removed, no prop/behavior contract change.
- [ ] **Issue lifecycle: mark in-review** — `gh issue edit 695 --add-label "in-review" --remove-label "in-progress"`; move the project item to the "In Review" column (same discovery pattern; warn and skip if not found).
- [ ] Wait 60s for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero remain. If no progress after 3+ iterations, report the stall with remaining findings and wait for human guidance.
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
- [ ] Sync the approved spec delta into the global spec: apply the MODIFIED "Counter badge visible in combatant row" requirement into `openspec/specs/legendary-action-tracking/spec.md`. Update relative links in the promoted file to point at `../../changes/archive/YYYY-MM-DD-legendary-badge-opens-detail/design.md` / `tasks.md`.
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
- [ ] Approved spec delta synced to `openspec/specs/legendary-action-tracking/spec.md`
- [ ] Change archived in a single atomic commit
- [ ] Worktree removed and merged local branches pruned
