# Tasks

Change: `migrate-content-reference-storage-domains` — issue-driven (#504, epic #499).
Worktree: `.worktrees/migrate-content-reference-storage-domains` (branch
`migrate-content-reference-storage-domains`, already published).
Default branch: `main` (squash-only ruleset; required checks `ci-gate` + Codacy;
0 approvals; never use `--admin`).

## Preparation

- [x] **Step 1 — Sync default branch:** from the primary checkout,
  `git fetch origin main`. (Do NOT `git checkout main` in the primary checkout —
  another agent's branch is checked out there. All work happens in the worktree.)
- [x] **Step 2 — Confirm working branch published:** in
  `.worktrees/migrate-content-reference-storage-domains`, run
  `git status` and `git rev-parse --abbrev-ref --symbolic-full-name @{u}` to
  confirm the branch tracks `origin/migrate-content-reference-storage-domains`.
  If the worktree is missing, recreate it:
  `git worktree add .worktrees/migrate-content-reference-storage-domains -b migrate-content-reference-storage-domains origin/main`
  then `git push -u origin migrate-content-reference-storage-domains`. Confirm
  `.github/openspec-shared` submodule is checked out
  (`git submodule update --init --force .github/openspec-shared`).

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the
  available skills list for `pr-review-toolkit:review-pr`. If not listed, halt,
  inform the user the plugin is required, provide installation guidance, and do
  not proceed until the user confirms installation.
- [x] **Verify `openspec-review-code` is available** — required before every
  commit. Halt and prompt if missing.
- [x] **Open Questions resolved (@dougis, 2026-09-02)** — no Preflight action
  needed; recorded in `proposal.md` / `design.md`:
  - `storage.load()` → **remove entirely**.
  - `storage.clear()` → **wrap in `runStorageOp`**, relocate to
    `lib/storage/storageMisc.ts`.
  - Four list reads → **set** `isEmpty: (r) => r.length === 0`.

## Execution

- [x] **Step 1 — Enter worktree:** `cd .worktrees/migrate-content-reference-storage-domains`.
  All subsequent work happens here.
- [x] **Step 2 — Confirm branch pushed:** `git push -u origin migrate-content-reference-storage-domains`
  if not already tracking remote.
- [x] **Issue lifecycle: mark in-progress** — `gh issue edit 504 --add-label "in-progress"`.
  Then `gh project list --owner dougis-org --format json`, resolve the status
  field option matching "In Progress" via
  `gh project field-list <n> --owner dougis-org --format json`, and move the
  #504 item with `gh project item-edit`. If no project item / no `project`
  scope: warn, tell the user to run `gh auth refresh -s project`, skip the
  project move (label edit still applies).

- [x] **Step 3 — Re-verify the inventory (spec: per-domain repos).**
  Cross-check every cluster entry in `docs/storage-refactor/inventory.json`
  against the current `lib/storage.ts` source: behavior, sentinel, line,
  callers. Run the method-count check (compare `inventory.json` entry count to
  the live method count on `storage`). Record any drift (e.g.
  `getNextSessionNumber` is already on `runStorageOp`) in a scratch note for
  the PR description.

- [x] **Step 4 — Caller audit (spec: failures surface as StorageError).**
  Enumerate every non-test call site of the six swallow methods
  (`loadSessionLogs`, `listSharesForCampaign`, `listAllSharesForCampaign`,
  `loadSpells`, `loadSpellById`, `spellExistsByNameAndSource`) and the two
  no-try roll methods. For each, confirm it sits inside a `try/catch` or
  Next.js error boundary that yields a sensible HTTP status. Known call sites:
  `app/api/campaigns/[id]/sessions/route.ts`,
  `app/api/campaigns/[id]/characters/route.ts`,
  `app/api/campaigns/[id]/members/[userId]/route.ts`,
  `app/api/spells/route.ts`, `app/api/spells/[id]/route.ts`,
  `app/api/campaigns/[id]/rolls/route.ts`, `lib/import/dedupeEngine.ts`.
  List any unguarded caller as a sub-task to fix in this change.

- [x] **Step 5 — TDD: `sessionLogRepo.ts`.**
  - [x] Write `tests/unit/lib/storage/sessionLogRepo.test.ts` first: for each of
    `loadSessionLogs`, `getNextSessionNumber`, `saveSessionLog`,
    `updateSessionLog`, `deleteSessionLog` — a reject-path test
    (`rejects.toThrow(StorageError)` with `op`/`collection`, one
    `logStorageEvent` error) and a not-found/empty-path test
    (`loadSessionLogs` → `[]` / `not_found`; `updateSessionLog` → `null`;
    `deleteSessionLog` → `false`). Confirm tests fail.
  - [x] Create `lib/storage/sessionLogRepo.ts` with the five functions on
    `runStorageOp` (`collection: "sessionLogs"`, `isEmpty` on `loadSessionLogs`).
    Move `getNextSessionNumber` verbatim from its current `runStorageOp` form.
  - [x] Point `lib/storage.ts` at `sessionLogRepo.*`. Tests green.

- [x] **Step 6 — TDD: `shareRepo.ts`.**
  - [x] Write `tests/unit/lib/storage/shareRepo.test.ts` first: `addShare`
    duplicate-key (`{ code: 11000 }` → `rejects.toThrow(DuplicateShareError)`)
    and generic failure (→ `StorageError`); `removeShare` reject → `StorageError`,
    missing row → `false`; `listSharesForCampaign` /
    `listAllSharesForCampaign` reject → `StorageError`, empty → `[]` /
    `not_found`. Confirm failing.
  - [x] Create `lib/storage/shareRepo.ts`: four functions on `runStorageOp`
    (`collection: "campaignCharacterShares"`), `addShare` with
    `rethrowAsIs: (e) => e instanceof DuplicateShareError` and the inner
    `code === 11000` translation preserved, list methods with `isEmpty`.
  - [x] Point `lib/storage.ts` at `shareRepo.*`. Tests green.
  - [x] Confirm `tests/unit/lib/storage-shares.test.ts` passes unmodified.

- [x] **Step 7 — TDD: `spellRepo.ts`.**
  - [x] Write `tests/unit/lib/storage/spellRepo.test.ts` first: `loadSpells`
    reject → `StorageError`, empty → `[]`; `loadSpellById` reject →
    `StorageError`, missing doc → `null` / `not_found`, bad-shape id → `null`
    with **no** `getDatabase`/`logStorageEvent` call; `saveSpellTemplate` /
    `deleteSpellTemplate` reject → `StorageError`, `deleteSpellTemplate`
    bad-shape id → no-op no-DB; `spellExistsByNameAndSource` reject →
    `StorageError`, no match → `false`. Confirm failing.
  - [x] Create `lib/storage/spellRepo.ts`: functions on `runStorageOp`
    (`collection: "spellTemplates"`). Keep the pre-DB id-shape guard in
    `loadSpellById` and `deleteSpellTemplate` **outside** `runStorageOp`.
    `isEmpty` on `loadSpells` and `loadSpellById` (`(r) => !r`).
  - [x] Point `lib/storage.ts` at `spellRepo.*`. Tests green.

- [x] **Step 8 — TDD: `rollRepo.ts`.**
  - [x] Write `tests/unit/lib/storage/rollRepo.test.ts` first: `saveCampaignRoll`
    reject → `StorageError` (`collection: "campaignRolls"`) + one error event;
    `listCampaignRolls` reject → `StorageError`; happy path → identical
    `{ rolls, nextCursor? }` shape; a cursor round-trip test (limit+1 → `pop()`
    → `nextCursor`); a non-DM visibility-filter test asserting the `$or` clause
    is unchanged. Port any existing `listCampaignRolls` assertions from
    `tests/unit/lib/storage.test.ts`. Confirm failing.
  - [x] Create `lib/storage/rollRepo.ts`: both functions on `runStorageOp`,
    moving all pagination/visibility/cursor logic verbatim into the callback.
    No `isEmpty` (an empty page is `success`).
  - [x] Point `lib/storage.ts` at `rollRepo.*`. Tests green.

- [x] **Step 9 — Remove `load`; migrate `clear` (spec: REMOVED storage.load;
  per-domain repos).**
  - [x] `git grep -n "storage\.load\b\|\.load(" app/ lib/ scripts/` — confirm
    zero non-test callers before deleting.
  - [x] Delete `storage.load()` from `lib/storage.ts`. Update
    `tests/unit/lib/storage/facadeShape.test.ts` and any test referencing
    `storage.load` to expect the method absent / the count down by one.
  - [x] TDD `tests/unit/lib/storage/storageMisc.test.ts`: `clear` — one
    `deleteMany` rejects → `rejects.toThrow(StorageError)` (`op === "clear"`)
    + one error event; success → all seven collections get
    `deleteMany({ userId })`. Confirm failing.
  - [x] Create `lib/storage/storageMisc.ts` with `clear(userId)` on
    `runStorageOp` (`name: "clear"`, `collection: "storageMisc"`). Point
    `lib/storage.ts` at `storageMisc.clear`. Tests green.

- [x] **Step 10 — Rewrite `loadSpellById` characterization test (spec:
  characterization coverage).** In
  `tests/unit/lib/storage.characterization.test.ts`, change the DB-error case
  from `resolves.toBeNull()` to `rejects.toThrow(StorageError)`; keep
  genuine-not-found and bad-id cases asserting `null`. Update the section
  header comment to note the intentional `#504` behavior flip.

- [x] **Step 11 — Spell route test (spec: spell-by-id route distinguishes
  outage from not-found).** In `tests/unit/api/spells/[id].route.test.ts`
  (create if absent): mock `storage.loadSpellById` to reject with a
  `StorageError` → assert `500` + `"Failed to load spell"` + `console.error`;
  mock to resolve `null` → assert `404` + `"Spell not found"`. Confirm the
  route handler needs **no logic change**; if the audit found otherwise, make
  the minimal change and note it.

- [x] **Step 12 — `dedupeEngine.ts` caller fix (spec: dedupe tolerates a thrown
  existence check).** Make `lib/import/dedupeEngine.ts` fail the import cleanly
  when `spellExistsByNameAndSource` rejects (no silent "not a duplicate"
  path). Add/extend a dedupe-engine unit test for the rejecting case.

- [x] **Step 13 — Facade guardrails (spec: facade shape preserved).** Confirm
  no cluster method body in `lib/storage.ts` still calls `getDatabase(`. Update
  the method-count expectation in `tests/unit/lib/storage/facadeShape.test.ts`
  to reflect exactly one removed method (`load`) and run it. Run the full
  existing `storage`-mocking suites unmodified (`storage.test.ts`,
  `storage-shares.test.ts`, `storage.characters.test.ts`,
  `storage.campaignEncounters.test.ts`, `storage.characterization.test.ts`,
  spell/session route tests).

- [x] Confirm every acceptance scenario in
  `openspec/changes/migrate-content-reference-storage-domains/specs/storage-content-reference-domains/spec.md`
  has corresponding coverage.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the
  `openspec-review-code` skill. The primary agent automatically applies all
  clearly-correct findings directly to the code — without stopping, without
  presenting the list, without asking for confirmation. Apply fixes, re-run
  the affected tests, then commit.

## Validation

- [x] Run unit/integration tests (project command, e.g. `npm test`) — full unit
  suite green (3467 tests) after `npm ci` in the worktree; the sole prior
  failure (`d4EnginePatch`) was a missing dice-box patch, fixed by the install
  and unrelated to this change.
- [x] Run E2E tests if the caller audit touched any route behavior; otherwise
  note "not applicable — storage-layer refactor, no UI/route logic change".
  Not applicable: no route handler logic changed (spell route already wrapped
  `loadSpellById` in try/catch → 500).
- [x] Run type checks (`npm run typecheck` / `tsc --noEmit`) — clean.
- [x] Run build (`npm run build`) — compiled successfully, 42/42 pages.
- [ ] Run security / code-quality checks required by project standards
  (Codacy CLI; Verity pre-commit/pre-push gate — fix findings, do not waive on
  agent judgment)
- [ ] All completed tasks marked complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Determine docs-only vs full: `git diff --name-only HEAD` — this change touches
`.ts` files, so the **full path** always applies here.

**Full path:**

- **Unit tests** — full unit suite must pass
- **Integration tests** — full integration suite must pass
- **Regression / E2E tests** — must pass (or documented not-applicable per
  Validation)
- **Build** — `npm run build` must succeed with no errors

If ANY step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent ran and all findings were
  addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `migrate-content-reference-storage-domains` to `main`. PR
  body MUST include `Closes #504`. Call out the intentional behavior changes:
  the six swallow→throw methods, the two no-try roll methods now wrapped, the
  `loadSpellById` characterization-test flip, the `dedupeEngine` behavior
  change, the removal of `storage.load()`, and `clear` moving to
  `storageMisc.ts`. Note any `inventory.json` drift
  found in Step 3.
- [ ] **Issue lifecycle: mark in-review** — `gh issue edit 504 --add-label "in-review" --remove-label "in-progress"`,
  then move the #504 project item to the "In Review" column (same discovery as
  the in-progress step; warn and skip if not found)
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all
  findings (commit, push, re-run) until zero remain. If findings persist after
  ≥3 iterations with no progress, report the stall with remaining findings and
  wait for human guidance.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):**
  `gh pr merge <PR-URL> --auto --squash` (squash-only ruleset; NEVER `--admin`)
- [ ] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state`
  is `MERGED` (if `CLOSED`, exit and notify the user); never wait for a human
  to report the merge, never force-merge:
  1. **Build and tests** — run [Remote push validation]; fix failures, commit,
     push first
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address
     every unresolved thread, commit, run [Remote push validation], push, wait
     180s; repeat until all resolved
  3. **CI check failures** — after comments are clear, poll
     `gh pr checks <PR-URL>`; fix failing required checks (`ci-gate`, Codacy),
     commit, run [Remote push validation], push, wait 180s; restart from step 1

Ownership metadata:

- Implementer: @dougis (or delegated agent)
- Reviewer(s): @dougis; `pr-review-toolkit:review-pr` sub-agent (automated gate)
- Required approvals: 0 (repo ruleset) + green `ci-gate` + green Codacy +
  zero `pr-review-toolkit:review-pr` findings

Blocking resolution flow:

- CI failure → diagnose → fix → commit → [Remote push validation] → push →
  re-run checks
- Security / Verity finding → remediate in code → commit → validate → push →
  re-scan. Waive only to relay a risk a named human review / ADR / the user
  explicitly accepted, citing the source in `--reason`; use
  `verity feedback finding … false_positive` for pattern-level false positives
- Review comment → address → commit → validate → push → confirm thread resolved

## Post-Merge

- [ ] From the primary checkout: `git fetch origin main` and confirm the
  squash-merge commit is on `main` (do not `git checkout main` there while
  another branch is active — inspect via `git log origin/main`)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (note the cluster
  as migrated in any `docs/storage-refactor/` tracking doc; update
  `.wolf/anatomy.md` / `.wolf/memory.md` per project instructions)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy
  `openspec/changes/migrate-content-reference-storage-domains/specs/storage-content-reference-domains/spec.md`
  to `openspec/specs/storage-content-reference-domains/spec.md`, then rewrite
  relative links — `../../design.md` →
  `../../changes/archive/YYYY-MM-DD-migrate-content-reference-storage-domains/design.md`,
  same for `../../tasks.md`
- [ ] Archive the change: move
  `openspec/changes/migrate-content-reference-storage-domains/` to
  `openspec/changes/archive/YYYY-MM-DD-migrate-content-reference-storage-domains/`
  and stage the new location + deletion of the old in a **single** commit
- [ ] Confirm the archive directory exists and the original is gone
- [ ] **Create a doc branch:**
  `git checkout -b doc/archive-YYYY-MM-DD-migrate-content-reference-storage-domains`
  then `git push -u origin doc/archive-YYYY-MM-DD-migrate-content-reference-storage-domains`
- [ ] Open a PR from the doc branch to `main` titled
  `docs: archive migrate-content-reference-storage-domains (YYYY-MM-DD)` — do
  NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR:
  `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER `--admin`)
- [ ] Monitor the doc PR until merged (same loop as the implementation PR)
- [ ] Remove the change's worktree:
  `git worktree remove .worktrees/migrate-content-reference-storage-domains`
  (use `--force` if the `openspec-shared` submodule blocks removal)
- [ ] Prune merged local branches: `git fetch --prune` and
  `git branch -D migrate-content-reference-storage-domains doc/archive-YYYY-MM-DD-migrate-content-reference-storage-domains`
- [ ] Close #504 (auto-closed by `Closes #504` on merge; verify), and move the
  project item to "Done"
