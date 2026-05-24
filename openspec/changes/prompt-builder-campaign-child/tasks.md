# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/prompt-builder-campaign-child` then immediately `git push -u origin feature/prompt-builder-campaign-child`

## Execution

### Group A — Shared campaign context helper

- [x] **A1 — Add `CampaignContext` and `BuiltPrompt` interfaces to `lib/types.ts`**
  - Add `CampaignContext { campaign, chapter, parties, allMembers, characters }` after the `Party` interface
  - Add `BuiltPrompt { systemPrompt: string; userMessage: string; fullText: string }`
  - Verification: `npx tsc --noEmit` passes

- [x] **A2 — Write unit tests for `fetchCampaignContext` (TDD — tests first)**
  - Create `tests/unit/utils/campaignContext.test.ts`
  - Cover: single party, multiple parties (member merge), no parties, chapter resolved, chapter null, soft-deleted character excluded, parallel fetch ordering
  - Tests will fail until A3 is complete

- [x] **A3 — Implement `lib/utils/campaignContext.ts`**
  - Export `fetchCampaignContext(campaignId: string, fetchImpl?: typeof fetch): Promise<CampaignContext>`
  - Fetch `/api/campaigns/[id]`, `/api/parties`, and `/api/characters` via `Promise.all`
  - Filter parties by `campaignId`, merge `members`, resolve chapter from `campaign.chapters`, filter characters to member IDs (exclude `deletedAt`)
  - Verification: unit tests from A2 pass

- [x] **A4 — Implement `lib/hooks/useCampaignContext.ts`**
  - Export `useCampaignContext(campaignId: string): { context: CampaignContext | null; loading: boolean; error: string | null; refresh: () => void }`
  - Wraps `fetchCampaignContext` with `useState`/`useEffect`/`useCallback`
  - Verification: `npx tsc --noEmit` passes; hook renders without error in a simple test component

### Group B — Prompt templates

- [x] **B1 — Write unit tests for all five templates (TDD — tests first)**
  - Create `tests/unit/prompts/templates.test.ts`
  - For each template: assert `systemPrompt` contains campaign name, chapter title, character names; assert `userMessage` contains key field values; assert `fullText === systemPrompt + "\n\n" + userMessage`
  - Cover: full context, null chapter, empty party
  - Tests will fail until B2 is complete

- [x] **B2 — Implement `lib/prompts/templates.ts`**
  - Export `PromptField`, `PromptTemplate`, and `TEMPLATES: PromptTemplate[]`
  - Implement `buildSystemPrompt(context: CampaignContext): string` (shared across all templates)
  - Port five templates from dm-dashboard JS reference to TypeScript: NPC, Location Description, Shop/Establishment, Magic Item, Room Description
  - Each template's `build()` returns `BuiltPrompt`
  - Verification: unit tests from B1 pass

### Group C — Prompt Builder UI

- [x] **C1 — Write integration test for prompt builder page (TDD — test first)**
  - Create `tests/integration/prompts/promptBuilder.test.tsx`
  - Mock `useCampaignContext`; assert page renders with campaign name, all five tabs visible, NPC tab active by default
  - Select each template; assert its fields render
  - Fill required fields; click Generate; assert prompt textarea contains campaign name and party members
  - Click Copy; assert `navigator.clipboard.writeText` called with `fullText`
  - Assert Save to Library button is present and disabled
  - Tests will fail until C2 is complete

- [x] **C2 — Implement `app/campaigns/[id]/prompts/page.tsx`**
  - `'use client'` — uses `useParams`, `useCampaignContext`, `useState`
  - Wrap in `<ProtectedRoute>`
  - Template selector: tab per template in `TEMPLATES`
  - Dynamic form: render `template.fields` as labeled inputs; track values in state
  - Generate button: validate required fields, call `template.build(fields, context)`, store `BuiltPrompt` in state
  - Display `fullText` in read-only textarea when prompt is generated
  - Copy button: `navigator.clipboard.writeText(builtPrompt.fullText)` + "Copied!" flash
  - Save to Library button: disabled with tooltip "Available with Content Library (#185)"
  - Loading state: `<LoadingState />` from `lib/components/ui`
  - Error state: `<ErrorBanner />` from `lib/components/ui`
  - No-party message: informational callout when `context.parties.length === 0`
  - Verification: integration tests from C1 pass

- [x] **C3 — Add "Prompt Builder" nav link to campaign detail view**
  - In `app/campaigns/page.tsx`, add a "Prompt Builder" link alongside the existing "View all sessions →" link for each campaign card: `href={/campaigns/${campaign.id}/prompts}`
  - Verification: link renders in the campaign card; clicking navigates to the correct route

### Group D — Session logs refactor (fixes #212)

- [x] **D1 — Write regression tests for current session logs behaviour**
  - In `tests/integration/sessions/sessionLogs.test.tsx`, cover: single party membership events, session list renders, editor opens for new session
  - All tests must pass against the current (un-refactored) code before proceeding to D2

- [x] **D2 — Write new multi-party test for session logs**
  - Add scenario to `tests/integration/sessions/sessionLogs.test.tsx`: two parties linked to same campaign, assert NPC events suggested from both parties' members
  - Test will fail until D3 is complete

- [x] **D3 — Refactor `app/campaigns/[id]/sessions/page.tsx` to use `useCampaignContext`**
  - Remove manual `fetch('/api/parties')` + `Array.find()` logic
  - Import and call `useCampaignContext(campaignId)`
  - Replace `party.members` with `context.allMembers` in `buildNpcEventsFromMemberChanges` call
  - Replace `party` null-check warning with `context.parties.length === 0` check
  - Verification: all tests from D1 (regression) and D2 (new multi-party) pass

## Validation

- [ ] `npm run test` — all unit tests pass
- [ ] `npm run test:integration` — all integration tests pass
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npm run build` — build succeeds
- [ ] `npm run lint` — no lint errors
- [ ] All tasks in groups A–D marked complete
- [ ] All steps in Remote push validation below

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- **Type check** — `npx tsc --noEmit` — no errors

If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [ ] Run the required pre-PR self-review from `.agent/skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to `feature/prompt-builder-campaign-child` and push to remote
- [ ] Open PR from `feature/prompt-builder-campaign-child` to `main` — title: "feat: Prompt Builder as campaign child route + shared context helper (fixes #212)"
- [ ] Reference issues #184 and #212 in the PR description
- [ ] Wait 120 seconds for agentic reviewers to post comments
- [ ] **Monitor PR comments** — address each comment, commit fixes, run all validation steps, push; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — fix any failure, commit, run all validation steps, push; repeat until all checks pass
- [ ] Wait for the PR to merge — **never force-merge**; if a human force-merges, continue to Post-Merge

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic reviewers (auto) + dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → diagnose → fix → commit → run validation locally → push → re-check
- Security finding (Codacy) → remediate finding → commit → push → re-scan — do NOT use `--admin` bypass
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main` (`lib/utils/campaignContext.ts`, `lib/hooks/useCampaignContext.ts`, `lib/prompts/templates.ts`, `app/campaigns/[id]/prompts/page.tsx` all exist)
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/` (add `campaign-context`, `prompt-templates`, `prompt-builder-ui`, `session-logs-refactor` specs)
- [ ] Archive the change: move `openspec/changes/prompt-builder-campaign-child/` to `openspec/changes/archive/YYYY-MM-DD-prompt-builder-campaign-child/` — stage both the new location and deletion of old location in a **single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-prompt-builder-campaign-child/` exists and `openspec/changes/prompt-builder-campaign-child/` is gone
- [ ] Commit and push the archive commit to `main`
- [ ] `git fetch --prune` and `git branch -d feature/prompt-builder-campaign-child`
- [ ] Close GitHub issue #184 referencing the merged PR
- [ ] Add comment to GitHub issue #212 noting it is fixed by this change; close if not auto-closed
