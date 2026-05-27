# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/prompt-builder-dm-notes-toggle` then immediately `git push -u origin feat/prompt-builder-dm-notes-toggle`

## Execution

### Step 3 — Extend `buildSystemPrompt` in `lib/prompts/templates.ts`

- [x] Add `opts?: { includeNotes?: boolean }` as a second parameter to `buildSystemPrompt(context: CampaignContext, opts?: { includeNotes?: boolean }): string`
- [x] After the existing `sessionSection` assembly, add:
  ```ts
  const notesSection = opts?.includeNotes && context.campaign.notes.trim()
    ? `Current campaign context (DM notes):\n${context.campaign.notes}`
    : '';
  ```
- [x] Include `notesSection` in the `.filter(Boolean).join('\n')` array

### Step 4 — Update `PromptTemplate.build` interface in `lib/prompts/templates.ts`

- [x] Add `opts?: { includeNotes?: boolean }` as a third parameter to the `build` method on the `PromptTemplate` interface
- [x] Thread `opts` through each of the five template `build` implementations (`npc`, `location`, `shop`, `magic-item`, `room`): `return makePrompt(buildSystemPrompt(context, opts), userMessage)`

### Step 5 — Add `includeNotes` state and checkbox to `app/campaigns/[id]/prompts/page.tsx`

- [x] In `PromptBuilderContent`, add: `const [includeNotes, setIncludeNotes] = useState(false);`
- [x] Add a `hasNotes` derived boolean: `const hasNotes = Boolean(context?.campaign.notes.trim());`
- [x] After the template tab buttons and before `<TemplateForm>`, conditionally render the checkbox when `hasNotes`:
  ```tsx
  {hasNotes && (
    <label className="flex items-center gap-2 text-sm text-gray-300 mb-4">
      <input
        type="checkbox"
        checked={includeNotes}
        onChange={e => {
          setIncludeNotes(e.target.checked);
          setBuiltPrompt(null);
        }}
        className="w-4 h-4"
      />
      Include DM notes in prompt
    </label>
  )}
  ```
- [x] Update `handleGenerate` to pass opts: `setBuiltPrompt(activeTemplate.build(fields, ctx, { includeNotes }))`

### Step 6 — Write unit tests

Add to `tests/unit/prompts/templates.test.ts`:

- [x] Test: checkbox not rendered when `campaign.notes` is empty (render `PromptBuilderContent` with mock context where `notes = ''` — assert checkbox absent)
- [x] Test: checkbox rendered when `campaign.notes` is non-empty
- [x] Test: generated prompt does not contain notes block when `opts.includeNotes` is `false` (call `buildSystemPrompt(ctx)` directly, assert no `"Current campaign context"` string)
- [x] Test: generated prompt contains notes block when `opts.includeNotes` is `true` (call `buildSystemPrompt(ctx, { includeNotes: true })`, assert notes block present with correct header)
- [x] Test: notes block is formatted correctly — header is exactly `"Current campaign context (DM notes):"` on its own line

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Review its report and apply fixes for duplication, complexity, and completeness before committing.

## Validation

- [x] `npm test` — all existing unit tests pass, five new tests pass
- [x] `npm run test:integration` — no regressions
- [x] `npx tsc --noEmit` — no type errors
- [x] `npm run build` — build succeeds
- [x] `npm run lint` — no lint errors
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `feat/prompt-builder-dm-notes-toggle` to `main`. PR body must state: `Closes #231`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: AI agent
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on main
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec deltas into `openspec/specs/` (copy `specs/dm-notes-toggle/spec.md` to `openspec/specs/prompt-builder-dm-notes-toggle/dm-notes-toggle/spec.md`)
- [x] Archive the change: move `openspec/changes/prompt-builder-dm-notes-toggle/` to `openspec/changes/archive/YYYY-MM-DD-prompt-builder-dm-notes-toggle/` **in a single commit** — stage both the new location and the deletion of the old location together
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-prompt-builder-dm-notes-toggle/` exists and `openspec/changes/prompt-builder-dm-notes-toggle/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-prompt-builder-dm-notes-toggle` then `git push -u origin doc/archive-YYYY-MM-DD-prompt-builder-dm-notes-toggle`
- [x] Open a PR from the doc branch to `main` with title `docs: archive prompt-builder-dm-notes-toggle (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Monitor the doc PR until it merges
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/prompt-builder-dm-notes-toggle doc/archive-YYYY-MM-DD-prompt-builder-dm-notes-toggle`
