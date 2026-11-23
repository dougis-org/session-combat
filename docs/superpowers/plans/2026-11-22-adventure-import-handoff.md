# Handoff Runbook: Chapter Guide (#846) and Adventure Importer (#847)

For an agent on a Linux machine working from a fresh clone. The design and the
task-by-task steps already exist; this runbook covers only what the plan does
not: machine setup, ordering, hard rules, done criteria and what to report.

- **Spec:** `docs/superpowers/specs/2026-11-22-adventure-import-and-chapter-guide-design.md`
- **Plan (follow it task by task):** `docs/superpowers/plans/2026-11-22-adventure-import-and-chapter-guide.md`
- **Issues:** Part A = #846 (Chapter Guide). Part B = #847 (Adventure importer), blocked by #846.

## 1. Scope

| In scope | Out of scope |
|----------|--------------|
| Part A, Tasks 1-7: one PR, `Closes #846` | Task 13 (first real bundle and the dev-DB import): **owner-run** |
| Part B, Tasks 8-12: one PR, `Closes #847`, started only after Part A is merged | An import UI, map import, section editing, any change to `sanitizeChapters` or the campaign routes |
| Updating docs and OpenSpec artifacts for those changes | Running `--apply` against any real database |

Run Part A and Part B as **two separate sessions**. Part B must branch from
`main` after a human has merged Part A.

## 2. Machine prerequisites

Verify each one before starting. If a check fails, stop and report; do not mock around it.

| Need | Check | Why |
|------|-------|-----|
| git with submodule support | `git --version` | `.github/openspec-shared` is a submodule |
| Node 24+ and npm | `node -v` (`.nvmrc` = 24; `engines` is `>=24`) | build, tests, `npx tsx` |
| Docker daemon running | `docker info` | integration tests start `mongo:8` through Testcontainers (`npm run test:ci`) |
| `gh` logged in with `repo` scope | `gh auth status` | issues, labels, PRs |
| OpenSpec CLI (the owner's machine runs 2.1.1) | `openspec --version` | `openspec validate`, change workflow; it is not in `package.json` |
| Optional: `project` scope | `gh auth refresh -s project` | issue lifecycle moves the project card; without it the agent warns and continues |

## 3. Get the repo ready

```bash
git clone --recurse-submodules https://github.com/dougis-org/session-combat.git
cd session-combat
git submodule update --init --recursive      # no-op if already done
ls -l scripts/init-change.sh openspec/config.yaml   # must be symlinks into .github/openspec-shared
sh .github/openspec-shared/bootstrap.sh       # only if the agent skills/commands are missing
npm install                                   # postinstall runs patch-package
npm run typecheck && npm run test:unit        # record the baseline before changing anything
```

Linux keeps symlinks, so the Windows workaround in plan Task 1 Step 1 and the
`DNS_SERVERS` note in the plan's Global Constraints do not apply. Ignore them.

**Getting the spec and plan.** The documents travel on branch
`docs/adventure-import-plan`. When creating the Part A worktree, bring them in
with `git checkout origin/docs/adventure-import-plan -- docs/superpowers`, then
commit them as plan Task 1 Step 4 says. Skip this once they are on `main`. Part B
needs nothing extra because Part A's PR carries them.

## 4. Order of work

1. **Part A.** Follow plan Tasks 1-7 exactly: assign #846 to yourself, `opsx:propose`
   (change `campaign-chapter-guide`, capability `chapter-guide`), worktree
   `.worktrees/campaign-chapter-guide`, TDD per task, one commit per task, then
   Task 7 and the PR. Do not create a new issue.
2. **Stop and wait** for the human to merge Part A. Handle review comments until
   then (the `pr-reviewer` skill does this). After the merge, run `opsx:apply` to archive
   the change.
3. **Part B**, in a new session: confirm `main` contains Part A, then follow plan
   Tasks 8-12 (change `adventure-importer`, capability `adventure-import`,
   worktree `.worktrees/adventure-importer`) and open the PR with `Closes #847`.
4. **Do not do Task 13.** Hand it back to the owner (section 7).

If the plan skill set (`superpowers:executing-plans`) is installed, use it. If not,
work the plan's checkboxes in order. Either way the plan is the authority on
interfaces, file paths and test names.

## 5. Hard rules

- **The repo is public.** Never put adventure prose, connection strings,
  credentials, tokens or personal details in a file, commit message, issue, PR or
  comment. The only bundle that is ever committed is the synthetic
  `content/adventures/example-adventure/`.
- **No real database.** Tests use Testcontainers. Do not export a real
  `MONGODB_URI` while running them, and never run the importer with `--apply`
  outside a test container.
- **TDD, no exceptions:** a failing test first, minimal code, then refactor.
  Prefer integration tests over mocks and `it.each` for data-driven cases.
- **Gates are never bypassed.** The pre-commit hook runs `npm run build` and
  `npm run test:unit`, so commits are slow. Never use `--no-verify`. Fix the cause.
- **Read the Next.js docs under `node_modules/next/dist/docs/`** before writing
  route or page code (`AGENTS.md`: this Next.js has breaking changes) and mirror
  sibling files.
- **No scope growth.** If the plan and the code disagree (a moved line number, a
  renamed helper), follow the plan's intent, keep the change minimal, and list the
  deviation in the PR body. If the disagreement changes behavior, stop and ask.
- **Issue lifecycle:** after pushing the branch, add the `in-progress` label to the
  issue. On opening the PR, swap it for `in-review`. The PR body contains
  `Closes #<issue>`, a change summary and its rationale, and the test evidence.

## 6. Done criteria (evidence goes in the PR body)

Part A, all green with the output pasted:

- `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:ci`
- `openspec validate campaign-chapter-guide`
- The Review Focus items 1, 2 and 5 from the plan each map to a named passing test
- The guide route test proves a copied campaign's GET and list responses contain no `sections`
- All review threads resolved and required checks green

Part B, the same with `adventure-importer`, and:

- Review Focus items 3 and 4 each map to a named passing test
- `git status` shows nothing under `content/adventures/` except the README and the example bundle
- The end-to-end integration test (import, then copy, then guide route returns sections) passes

## 7. Owner-run: Task 13 (do not attempt)

After Part B merges, the owner authors `content/adventures/wild-sheep-chase/adventure.json`
(gitignored) from their local PDF, runs the CLI as a dry run against the dev
database, reviews the output, and only then runs `--apply`. It needs the source PDF
and `MONGODB_URI` / `MONGODB_DB=session-combat-dev`, none of which the agent has
or should ask for.

## 8. Stop and report instead of guessing

- A baseline check fails on a clean checkout, or Docker is unavailable
- The plan requires an interface that does not exist and the fix is not obvious
- A step needs a secret, a real database, or a decision about adventure content
- A test cannot be made to fail first, which usually means the plan's premise is wrong

## 9. Final report (per part)

PR URL; the evidence block from section 6; the list of deviations from the plan
and why; open questions. Keep it under one page and free of adventure text.

## 10. Kickoff prompt (paste into the agent)

> Work issue #846 in dougis-org/session-combat (Part A only). First run
> `git fetch origin && git checkout origin/docs/adventure-import-plan -- docs/superpowers`
> (skip if those files are already on `main`). Read
> `docs/superpowers/plans/2026-11-22-adventure-import-handoff.md`, then follow
> `docs/superpowers/plans/2026-11-22-adventure-import-and-chapter-guide.md`
> Tasks 1-7 and the spec it names. Verify the machine prerequisites first. Stop
> after opening the PR and resolving its review threads. Do not start Part B and
> do not touch any real database. Report per section 9 of the handoff.

For Part B, start a new session after Part A has merged and use the same prompt
with "#847", "Part B only", and "Tasks 8-12".
