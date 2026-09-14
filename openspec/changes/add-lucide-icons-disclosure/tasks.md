# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during proposal — fetched `origin/main`.
- [x] **Step 2 — Create and publish working branch:** done during proposal —
  worktree created at `.worktrees/add-lucide-icons-disclosure`, branch
  `add-lucide-icons-disclosure` created from `origin/main` and pushed
  (`git push -u origin add-lucide-icons-disclosure`).

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available
  skills list for `pr-review-toolkit:review-pr`. If the skill is not listed,
  halt immediately, inform the user that the plugin is required, provide
  installation guidance, and do not proceed until the user confirms it is
  installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — this change is issue-driven
  (#726). Run `gh issue edit 726 --add-label "in-progress"`. Then discover the
  GitHub Project linked to `dougis-org/session-combat`
  (`gh project list --owner dougis-org --format json`), resolve the status
  field option semantically matching "In Progress"
  (`gh project field-list <project-number> --owner dougis-org --format json`),
  and move the item via `gh project item-edit`. If no project item is found,
  log a warning and continue. If the `gh` token lacks the `project` scope,
  instruct the user to run `gh auth refresh -s project` and skip the
  project-item update (issue label update still proceeds).

- [x] **Task 1 — Add `lucide-react` dependency**
  - Run `npm install lucide-react` from project root.
  - Verify: `package.json`/`package-lock.json` show the new dependency;
    `npm run typecheck` still passes.
  - Covers: NFAC "Lucide import stays limited to the chevron icon" (verified
    at Task 2, where the only import is added).

- [x] **Task 2 — Add `Chevron` and `Disclosure` to `lib/components/ui.tsx`**
  - Add `Chevron({ expanded, className? })`: renders lucide's `ChevronRight`,
    applying a `rotate-90` (or equivalent) Tailwind class plus
    `transition-transform` when `expanded` is `true`. Import only
    `ChevronRight` from `lucide-react`.
  - Add `Disclosure({ label, open, onToggle, className?, labelClassName? })`:
    a controlled `<button>` (no internal `useState`) rendering `label` and a
    trailing `Chevron`, with `onClick={onToggle}` and
    `aria-expanded={open}`.
  - Write BDD-style unit tests first (TDD) in `tests/unit/components/ui.test.tsx`
    (new file if it does not exist) covering the "ADDED Shared chevron
    indicator component" and "ADDED Shared controlled disclosure wrapper
    component" scenarios from `specs/disclosure-indicator/spec.md`.
  - Verify: `npm run test:unit -- ui.test` passes; `npm run typecheck` passes.

- [x] **Task 3 — Migrate `SessionEntryCard` (closes #726)**
  - File: `app/campaigns/[id]/sessions/page.tsx`.
  - Embed `Chevron` (not the full `Disclosure` wrapper, per Design Decision 2)
    at the trailing end of the existing title button's content, after the
    session number/title/date/milestone badge row. Add `aria-expanded` to the
    existing title `<button>`, matching `expanded` state.
  - Update/extend `tests/unit/components/SessionsPage.test.tsx` to cover the
    "ADDED Session log entries expose a visible expand/collapse indicator"
    scenarios (collapsed state, expand rotates chevron, collapse rotates back).
  - Verify: `npm run test:unit -- SessionsPage` passes.

- [x] **Task 4 — Migrate `ConditionControls`**
  - File: `lib/components/combatant-card/ConditionControls.tsx`.
  - Embed `Chevron` after the "Conditions (N)" label inside the existing
    toggle button; add `aria-expanded` to that button. Preserve the existing
    `combatant.conditions.length > 0` conditional render around the whole
    button (Design Decision 5) — do not change when the button appears.
  - Update/extend `tests/unit/components/combatant-card/ConditionControls.test.tsx`
    to cover the "ADDED Condition list toggle exposes a visible expand/collapse
    indicator" scenarios, including the zero-conditions case (toggle and
    chevron both absent).
  - Verify: `npm run test:unit -- ConditionControls` passes.

- [x] **Task 5 — Migrate `CharacterCard`**
  - File: `lib/components/CharacterCard.tsx`.
  - Replace the text-only "Expand"/"Collapse" `<button>` with `Disclosure`,
    passing `open={isExpanded}` and `onToggle={() => setIsExpanded(!isExpanded)}`.
    Choose a label (e.g. "Stat Block" or similar) — confirm wording doesn't
    regress any existing test assertions on button text; update those
    assertions if the label text changes.
  - Update/extend `tests/unit/components/CharacterCard.test.tsx` to cover the
    "ADDED Character card stat-block toggle uses the shared disclosure
    component" scenarios.
  - Verify: `npm run test:unit -- CharacterCard` passes.

- [x] **Task 6 — Migrate `CampaignEditor` chapters section**
  - File: `app/campaigns/CampaignEditor.tsx`.
  - Replace the unicode `▲`/`▼` `<span>` with `Chevron` (keeping the existing
    "📖 Chapters (N)" label and surrounding button/layout, per Design Decision 2
    — this button already has custom multi-part content), preserving the
    existing `aria-expanded` attribute (already present) and revealed content.
  - Update/extend `tests/unit/components/CampaignEditor.test.tsx` to cover the
    "ADDED Campaign editor chapters section uses the shared disclosure
    component" scenarios.
  - Verify: `npm run test:unit -- CampaignEditor` passes.

- [x] **Task 7 — Migrate campaign library entries**
  - File: `app/campaigns/[id]/library/page.tsx`.
  - Replace the unicode `▲`/`▼` `<span>` with `Chevron` inside the existing
    entry button (keeping the type label, title, chapter, date, and saved-result
    check-mark already rendered there), preserving the existing
    `aria-expanded` attribute and revealed content.
  - Update/extend `tests/unit/libraryPage.test.tsx` to cover the "ADDED
    Campaign library entries use the shared disclosure component" scenarios.
  - Verify: `npm run test:unit -- libraryPage` passes.

- [x] **Task 8 — Migrate `CreatureStatsForm` (5 sections)**
  - File: `lib/components/CreatureStatsForm.tsx`.
  - For each of the 5 sections (abilities, skills, resistances, senses, and
    the fifth independently-toggled section), replace the leading `▶`/`▼`
    `<span>` + label with `Disclosure` (label = existing section title,
    `open`/`onToggle` wired to the existing `expandedSections` record entry
    via `toggleSection(key)`, or to the fifth section's own `expanded`/
    `setExpanded` state), moving the chevron from leading to trailing position
    per Design Decision 4.
  - Update/extend `tests/unit/components/CreatureStatsForm.test.tsx` to cover
    both "ADDED Creature stats form sections use the shared disclosure
    component" scenarios (independent per-section state, one toggle doesn't
    affect others).
  - Verify: `npm run test:unit -- CreatureStatsForm` passes.
  - Manual visual check: confirm the leading-to-trailing chevron move (an
    intentional visual change per Design Decision 4) looks correct in a
    running dev server for all 5 sections.

- [x] Look for existing tooling or functions in the codebase that can be
  reused or extended before writing new logic from scratch (in particular:
  confirm no other shared chevron/disclosure helper already exists elsewhere
  before adding a new one — repo-wide grep performed during proposal found
  none, but re-check at implementation time).
- [x] Confirm all acceptance criteria in `specs/disclosure-indicator/spec.md`
  are covered by the tests added/extended in Tasks 2–8.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the
  `openspec-review-code` skill. The primary agent must automatically apply all
  clearly-correct findings directly to the code — without stopping, without
  presenting the findings list to the user, and without asking for
  confirmation. Apply fixes, re-run tests to confirm they pass, then proceed
  to commit.

## Validation

- [x] Run unit/integration tests: `npm run test:unit`, `npm run test:ci`
- [x] Run E2E tests (if applicable): existing session-log/campaign-library/
  character/combatant E2E specs under `tests/e2e/`, if any exercise these
  components — `npm run test:e2e` (or a filtered subset)
- [x] Run type checks: `npm run typecheck`
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards (Verity
  gate runs automatically on commit/push per project CLAUDE.md; address
  findings rather than waiving unless a human has explicitly accepted a risk)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run
`git diff --name-only HEAD` (or compare the working branch against `main`)
and check whether every changed file ends in `.md`. This change modifies
`.tsx` files and `package.json`, so it is **not** docs-only — use the full
path.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:regression` (or `npm run
  test:e2e` for the targeted specs); all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before
pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings
  were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `add-lucide-icons-disclosure` to `main`. The PR body MUST
  include `Closes #726`.
- [x] **Issue lifecycle: mark in-review** — run
  `gh issue edit 726 --add-label "in-review" --remove-label "in-progress"`.
  Then move the project item to the status column semantically matching
  "In Review" via `gh project item-edit` (same project/field/option discovery
  as the in-progress lifecycle step above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all
  findings (commit, push, re-run) until zero findings remain. If findings
  persist after three or more iterations with no progress, report the stall
  with remaining findings listed and wait for human guidance before
  continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):**
  `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the
  merge)
- [ ] **Iterate until merged** — repeat the following priority loop
  continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if
  it returns `CLOSED` exit and notify the user — never wait for a human to
  report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any
     failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for
     every unresolved thread, address the feedback, commit fixes, run [Remote
     push validation], push, wait 180 seconds; continue until all threads are
     resolved
  3. **CI check failures** — only after all comments are resolved, poll
     `gh pr checks <PR-URL> --json isRequired,state`; fix any failing
     required checks, commit, run [Remote push validation], push, wait 180
     seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before
pushing any fix.

Ownership metadata:

- Implementer: agent executing this change (assigned to dougis, per proposal
  ticket-assignment note)
- Reviewer(s): project owner (dougis) via PR review; automated
  `pr-review-toolkit:review-pr` gate
- Required approvals: 0 human approvals required to merge per
  `main`'s branch ruleset (squash-only, `ci-gate` + Codacy required checks),
  but auto-merge only enables after the `pr-review-toolkit:review-pr` gate
  passes with zero findings

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm
  resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout,
  not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected —
  this is a purely internal UI/component change with no user-facing docs)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy
  `specs/disclosure-indicator/spec.md` to
  `openspec/specs/disclosure-indicator/spec.md`, updating the relative link to
  `design.md` to point to
  `../../changes/archive/YYYY-MM-DD-add-lucide-icons-disclosure/design.md`
- [ ] Archive the change: move
  `openspec/changes/add-lucide-icons-disclosure/` to
  `openspec/changes/archive/YYYY-MM-DD-add-lucide-icons-disclosure/` and stage
  both the new location and the deletion of the old location in a single
  commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-add-lucide-icons-disclosure/`
  exists and `openspec/changes/add-lucide-icons-disclosure/` is gone
- [ ] **Create a doc branch** for the archive and spec updates:
  `git checkout -b doc/archive-YYYY-MM-DD-add-lucide-icons-disclosure` then
  `git push -u origin doc/archive-YYYY-MM-DD-add-lucide-icons-disclosure`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-add-lucide-icons-disclosure` to
  `main` with title
  `docs: archive add-lucide-icons-disclosure (YYYY-MM-DD)` — do NOT push
  directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR:
  `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the
  merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR —
  address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and
  `git branch -D add-lucide-icons-disclosure doc/archive-YYYY-MM-DD-add-lucide-icons-disclosure`
- [ ] Remove the change's dedicated worktree:
  `git worktree remove .worktrees/add-lucide-icons-disclosure`
