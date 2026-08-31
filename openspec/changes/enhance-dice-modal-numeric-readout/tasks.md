# Tasks

Change: `enhance-dice-modal-numeric-readout`
Default branch: `main`
Working branch: `enhance-dice-modal-numeric-readout`
Worktree: `.worktrees/enhance-dice-modal-numeric-readout`
Issue-driven: yes — #634

Ownership metadata:

- Implementer: TBD (assigned at apply time)
- Reviewer(s): repo CODEOWNERS + `pr-review-toolkit:review-pr` gate
- Required approvals: 1 human approval + green `pr-review-toolkit:review-pr`
  (zero findings) before auto-merge is enabled

## Preparation

- [x] **Step 1 — Confirm the dedicated worktree:** verify
      `.worktrees/enhance-dice-modal-numeric-readout` exists (created during
      propose) and `cd` into it. If missing: from the primary checkout run
      `git fetch origin main` then
      `git worktree add .worktrees/enhance-dice-modal-numeric-readout -b enhance-dice-modal-numeric-readout origin/main`.
      Never checkout a different branch in the primary checkout.
- [x] **Step 2 — Confirm the working branch is pushed:** from inside the
      worktree, `git status -sb` must show it tracking
      `origin/enhance-dice-modal-numeric-readout`; if not, run
      `git push -u origin enhance-dice-modal-numeric-readout`.
- [x] **Step 3 — Submodule sync:** ensure `.github/openspec-shared` is checked
      out in the worktree (`git submodule update --init .github/openspec-shared`)
      so the `sdd-with-feedback-loop` schema resolves.
- [ ] **Step 4 — Issue-driven hooks:** `gh issue edit 634 --add-label "in-progress"`.
      Discover the linked GitHub Project (`gh project list --owner dougis-org
      --format json`), resolve the status option matching "In Progress"
      (`gh project field-list <n> --owner dougis-org --format json`), and move the
      item (`gh project item-edit`). If no project item is found, log a warning
      and continue. If the token lacks `project` scope, tell the user to run
      `gh auth refresh -s project` and skip the project-item move (the label
      update still applies).

## Preflight

- [x] Verify `pr-review-toolkit:review-pr` is available in the current
      environment. If it is not, **halt**, inform the user the plugin is
      required, provide installation guidance, and do not proceed until the user
      confirms it is installed.
- [x] Verify `gh` is authenticated (`gh auth status`) and can edit issue #634.
- [x] Confirm `npm ci` completes cleanly in the worktree.

## Execution

Implement in small, testable increments. All edits inside the worktree.

- [x] **E0 — Reuse before writing:** before adding new markup or logic, check
      `DiceRollOverlay.tsx`, `lib/components/dice/`, and `lib/utils/dice.ts` for
      an existing chip / label / formatting helper (e.g. a `d{sides}` formatter,
      a shared readout container) that can be reused or extended rather than
      written from scratch.
- [x] **E1 — Rewrite `StaticRollResult` (pool path):** in
      `lib/components/dice/DiceRollOverlay.tsx`, replace the icon-plus-overlay
      rendering with a single numeric-chip path for every die in
      `built.breakdown.slice(0, DICE_ANIM_CAP)`: the `die.value` as the dominant
      text (keep `data-testid="die-face"`), a smaller `d{die.sides}` label. Delete
      the `const Icon = DIE_ICONS[...]` lookup and the `if (!Icon)` /
      `data-testid="fallback-die"` branch. Reuse the existing
      `flex flex-row flex-wrap justify-center items-center gap-4 ... max-w-[80vw]`
      container.
- [x] **E2 — Percentile path:** replace the two
      `<div class="relative w-16 h-16"><DiceD10Icon/><span/></div>` cells with two
      numeric chips showing the existing `tens` / `ones` strings, each labelled
      `d%`. Remove the `mt-2` nudge.
- [x] **E3 — Keep the cap:** leave `built.breakdown.slice(0, DICE_ANIM_CAP)`, the
      `remainder` computation, and the
      `data-testid="dice-readout-remainder"` `+{remainder} more` note unchanged.
      Confirm `DICE_ANIM_CAP` is still the only import needed from
      `lib/dice/toDiceBoxNotation.ts`.
- [x] **E4 — Drop dead imports:** remove
      `import { DIE_ICONS, DiceD10Icon } from '@/lib/components/icons/dice'` and
      the now-unused `DieSides` import from `DiceRollOverlay.tsx` if nothing else
      in the file uses them. Do **not** touch `lib/components/icons/dice.tsx`,
      `DieGlyph.tsx`, or `DiePoolButton.tsx`.
- [x] **E5 — Tests:** `git grep -n -E "DIE_ICONS|DiceD10Icon|die-face|fallback-die|dice-readout-remainder" tests/`
      and update every result:
  - [x] `tests/unit/components/DiceRollOverlay.test.tsx` — remove assertions that
        a die-face `<svg>` renders in the modal; add: (a) each `die-face` chip's
        text equals the corresponding `breakdown` value; (b) a `d{sides}` label
        per chip; (c) `role="dialog"` subtree has no die-face `<svg>`; (d)
        percentile → two chips `d%`, no `DiceD10Icon`; (e) `breakdown.length` 20 →
        15 chips + `+5 more`, total = full-pool total; (f) readout identical
        across the four reveal triggers.
  - [x] `tests/e2e/dice-roll-animation.spec.ts` — only adjust selectors if they
        key off an icon; keep all per-die **value** assertions.
- [x] **E6 — Review for duplication / unnecessary complexity:** the pool chip and
      percentile chip should share one small presentational sub-component or
      className constant rather than duplicating markup.
- [x] Confirm every acceptance scenario in
      `specs/global-dice-fab/spec.md` is covered by a test.

## Pre-Commit Code Review

- [x] Before **every** commit, spawn a sub-agent to run the
      `openspec-review-code` skill (per
      `skills/openspec-apply-change/SKILL.md`) over the working-tree diff. The
      primary agent automatically applies all clearly-correct findings to the
      code — without pausing, without presenting the finding list to the user,
      without asking for confirmation. Apply fixes, re-run the Validation suite,
      then commit. This step is mandatory and never skipped.

## Validation

Non-`.md` files change here, so the full path applies.

- [x] **V1 — Unit tests:** `npm run test:unit` — all pass (watch coverage
      thresholds for `DiceRollOverlay.tsx`).
- [x] **V2 — Integration tests:** `npm run test:integration` — all pass.
- [x] **V3 — E2E / regression:** `npm run test:e2e` — all pass (in particular
      `dice-roll-animation.spec.ts`).
- [x] **V4 — Type check:** `npm run typecheck` — clean.
- [x] **V5 — Lint:** `npm run lint` — clean (no unused-import warning from the
      removed `DIE_ICONS` line).
- [x] **V6 — Build:** `npm run build` — succeeds; no new chunk/asset.
- [ ] **V7 — Visual check:** run `openwolf designqc` (or a manual roll in the
      fab) at a `15d6` pool and at 375px viewport width; confirm the chips wrap
      cleanly, the values are legible, and the modal is not obscured by the
      settled dice.
- [ ] **V8 — Project quality gate:** run the Verity pre-commit/pre-push gate;
      fix findings (do not waive on agent judgement).
- [ ] All completed tasks marked `- [x]`.
- [ ] All steps in [Remote push validation] pass.

If **any** required step fails, iterate and fix before pushing.

## Remote push validation

Determine whether the current change is **docs-only**: run
`git diff --name-only HEAD` (or compare the working branch against `main`) and
check whether every changed file ends in `.md`.

- **This change is NOT docs-only** — it edits `lib/components/dice/DiceRollOverlay.tsx`
  and `tests/**`, so the **full path** applies on every push:
  - **Unit tests** — `npm run test:unit`; all pass
  - **Integration tests** — `npm run test:integration`; all pass
  - **Regression / E2E tests** — `npm run test:e2e` (incl.
    `dice-roll-animation.spec.ts`); all pass
  - **Build** — `npm run build`; succeeds with no errors
- **Docs-only path** (would apply only if a later revision changes nothing but
  `.md` files): run `npm run build` only; skip integration and E2E.

If **any** required step fails, iterate and address it before pushing.

## PR and Merge

- [ ] Run the Pre-Commit Code Review step, apply findings, re-run Validation,
      then commit all changes to `enhance-dice-modal-numeric-readout` and push.
- [ ] Open a PR from `enhance-dice-modal-numeric-readout` → `main`. The PR body
      MUST include `Closes #634`. Use the repo PR template if one exists
      (`.github/PULL_REQUEST_TEMPLATE*`).
- [ ] Issue-driven hooks: `gh issue edit 634 --add-label "in-review" --remove-label "in-progress"`,
      then move the project item to the status matching "In Review" (same
      discovery pattern as Preparation Step 4; warn and skip if not found).
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments.
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`. Address every
      finding, commit, re-run Validation, push, and re-run the review until zero
      findings remain. If findings persist after 3+ review-fix-push iterations
      with no progress, report the stall to the user with the remaining findings
      and wait for guidance.
- [ ] Only after the review gate is green (zero findings): enable auto-merge with
      `gh pr merge <PR-URL> --auto --merge`. Never force-merge.
- [ ] **Iterate until merged** — loop until `gh pr view <PR-URL> --json state`
      returns `MERGED` (if `CLOSED`, exit and notify the user):
  1. Build and tests — run all steps in [Remote push validation]; fix any
     failure, commit, and push before anything else in the iteration.
  2. PR comments — address every unresolved thread, commit, re-validate, push,
     wait 180s; repeat until all resolved.
  3. CI failures — only after comments are clear, fix each failing required
     check, commit, re-validate, push, wait 180s; restart from step 1.

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

Perform in order:

- [ ] From the **primary checkout**, `git checkout main` and `git pull --ff-only`.
- [ ] Verify the merged changes appear on `main`.
- [ ] Mark all remaining tasks complete (`- [x]`).
- [ ] Update any repository docs impacted by the change (none expected — note if
      so).
- [ ] Sync the approved spec delta into the global spec: apply the MODIFIED
      requirement + scenarios from
      `openspec/changes/enhance-dice-modal-numeric-readout/specs/global-dice-fab/spec.md`
      into `openspec/specs/global-dice-fab/spec.md`. Update relative links so
      they resolve from the archive location — `../../design.md` →
      `../../changes/archive/YYYY-MM-DD-enhance-dice-modal-numeric-readout/design.md`,
      likewise for `../../tasks.md`.
- [ ] Archive the change: move
      `openspec/changes/enhance-dice-modal-numeric-readout/` to
      `openspec/changes/archive/YYYY-MM-DD-enhance-dice-modal-numeric-readout/`
      and stage the copy **and** the deletion of the original in a **single**
      commit — do not commit the copy and delete separately.
- [ ] Confirm the archive dir exists and the original is gone.
- [ ] **Create a doc branch** for the archive + spec sync:
      `git checkout -b doc/archive-YYYY-MM-DD-enhance-dice-modal-numeric-readout`
      then `git push -u origin doc/archive-YYYY-MM-DD-enhance-dice-modal-numeric-readout`.
      **Do NOT push the archive/spec commit directly to `main`.**
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-enhance-dice-modal-numeric-readout`
      → `main` with title
      `docs: archive enhance-dice-modal-numeric-readout (YYYY-MM-DD)`.
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR:
      `gh pr merge <DOC-PR-URL> --auto --merge` (never `--admin`).
- [ ] Monitor the doc PR until it merges — same loop as the implementation PR:
      run [Remote push validation] before each push, address every unresolved
      comment and failing required check, push to the same doc branch, repeat
      until `gh pr view <DOC-PR-URL> --json state` returns `MERGED`.
- [ ] Remove the worktree: `git worktree remove .worktrees/enhance-dice-modal-numeric-readout`
      (use `--force` if it refuses because of the `.github/openspec-shared`
      submodule).
- [ ] Prune the merged branches: `git fetch --prune` and
      `git branch -D enhance-dice-modal-numeric-readout doc/archive-YYYY-MM-DD-enhance-dice-modal-numeric-readout`.
- [ ] Issue-driven hooks: confirm #634 auto-closed via `Closes #634`; move the
      project item to "Done".

## Completion Checklist

- [ ] Docs updated (or explicitly N/A)
- [ ] Approved spec delta synced into `openspec/specs/global-dice-fab/spec.md`
- [ ] Change directory archived under `openspec/changes/archive/`
- [ ] Archive + spec sync committed as a single atomic commit on a
      `doc/archive-YYYY-MM-DD-…` branch (NOT pushed directly to `main`)
- [ ] Doc PR opened, auto-merge enabled, and merged into `main`
- [ ] Worktree `.worktrees/enhance-dice-modal-numeric-readout` removed
- [ ] Merged local branches (`enhance-dice-modal-numeric-readout` and the doc
      branch) pruned
- [ ] Issue #634 closed and project item moved to Done
