# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/campaign-chat-dock-shell` then immediately `git push -u origin feat/campaign-chat-dock-shell`

## Execution

### Task 1 — Create `lib/components/CampaignChat.tsx`

- [x] Create `lib/components/CampaignChat.tsx` as a `'use client'` component
- [x] Implement `isExpanded` state (default `false`)
- [x] On mount (`useEffect`), read `LocalStore.get<boolean>('campaign-chat-pin')` and set `isExpanded` to `true` if result is truthy
- [x] Implement `isPinned` state (default `false`), seeded from the same mount read
- [x] **Collapsed state** — render a `<button>` with:
  - `className="fixed bottom-4 right-4 z-40 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white hover:bg-gray-700"`
  - Accessible name containing "Chat" (e.g., `Chat ›`)
  - `onClick` sets `isExpanded(true)`
- [x] **Expanded state** — render a `<div>` with:
  - `role="complementary"` and `aria-label="Campaign Chat"`
  - `className="fixed bottom-0 right-0 z-40 w-80 flex flex-col bg-gray-800 border-l border-t border-gray-700 rounded-tl-lg"` with inline `style={{ height: '33vh' }}`
  - **Header row** (`flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0`):
    - Title: `<span className="text-sm font-semibold text-white">Campaign Chat</span>`
    - Pin button: `<button aria-pressed={isPinned} aria-label={isPinned ? 'Unpin chat' : 'Pin chat open'} onClick={handlePinToggle}>` — renders a pin icon (inline SVG or `📌` text; prefer inline SVG `20×20` matching existing iconography)
    - Close button: `<button aria-label="Collapse chat" onClick={() => setIsExpanded(false)}>×</button>`
  - **Body** (`flex-1 overflow-y-auto p-4`): placeholder `<p className="text-gray-500 text-sm">No messages yet.</p>`
- [x] Implement `handlePinToggle`:
  - If not pinned: `LocalStore.set('campaign-chat-pin', true)`, `setIsPinned(true)`
  - If pinned: `LocalStore.remove('campaign-chat-pin')`, `setIsPinned(false)`
  - Do NOT change `isExpanded`
- [x] Add Escape key handler: `useEffect` on `isExpanded` — when `true`, attach `keydown` listener on `document`; if `event.key === 'Escape'` call `setIsExpanded(false)`. Clean up on `isExpanded` change or unmount.

### Task 2 — Mount in `app/layout.tsx`

- [x] Import `CampaignChat` in `app/layout.tsx`: `import { CampaignChat } from '@/lib/components/CampaignChat'`
- [x] Add `<CampaignChat />` as the last child of `<body>`, after `<footer>`:
  ```tsx
  <footer .../>
  <CampaignChat />
  ```

### Task 3 — Unit tests `tests/unit/components/CampaignChat.test.tsx`

Write tests covering all spec scenarios. Mock `LocalStore` at the module level.

- [x] **Scenario: Pill present on initial render** — render, assert `getByRole('button', { name: /chat/i })` present
- [x] **Scenario: Drawer absent on initial render** — render with `LocalStore.get` returning `null`, assert `queryByRole('complementary')` is null
- [x] **Scenario: Expand by clicking pill** — click pill, assert `getByRole('complementary', { name: /campaign chat/i })` present
- [x] **Scenario: Collapse by clicking close button** — expand, click close, assert `queryByRole('complementary')` is null
- [x] **Scenario: Collapse via Escape key** — expand, fire `keydown` Escape, assert `queryByRole('complementary')` is null
- [x] **Scenario: Escape does nothing when collapsed** — fire Escape, assert no error and pill still present
- [x] **Scenario: Pin button toggles to pinned** — expand, click pin, assert `aria-pressed="true"` and `LocalStore.set` called with `'campaign-chat-pin'` and `true`
- [x] **Scenario: Pin button toggles to unpinned** — expand, pin, unpin, assert `aria-pressed="false"` and `LocalStore.remove` called with `'campaign-chat-pin'`
- [x] **Scenario: Dock opens on mount when pinned** — mock `LocalStore.get` returning `true`, render, assert drawer present without any click
- [x] **Scenario: Unpinning does not collapse** — mount with pin, unpin, assert drawer still present
- [x] **Scenario: Pin button reports aria-pressed state** — expand, assert pin button has `aria-pressed="false"`; pin it, assert `aria-pressed="true"`
- [x] **Scenario: Drawer has correct landmark and label** — expand, assert `getByRole('complementary', { name: 'Campaign Chat' })`

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm test -- --testPathPattern=CampaignChat` — all new tests pass
- [x] `npm test` — full unit suite passes (no regressions)
- [x] `npx tsc --noEmit` — no type errors in new files
- [x] `npm run build` — build succeeds
- [x] All tasks above marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to `feat/campaign-chat-dock-shell` and push to remote
- [ ] Open PR from `feat/campaign-chat-dock-shell` to `main`. PR body MUST include: `Closes #313`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — poll autonomously; address comments, commit fixes, validate locally, push; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing checks, validate locally, push; wait 180 seconds then repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user

Ownership metadata:

- Implementer: agent (`/opsx:apply`)
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update `openspec/specs/campaign-chat-dock/spec.md` — sync from `openspec/changes/campaign-chat-dock-shell/specs/campaign-chat-dock/spec.md` (update relative paths to `../../changes/archive/YYYY-MM-DD-campaign-chat-dock-shell/design.md` and `tasks.md`)
- [ ] Archive the change: move `openspec/changes/campaign-chat-dock-shell/` to `openspec/changes/archive/YYYY-MM-DD-campaign-chat-dock-shell/` — stage both the new location and deletion of the old in a **single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-campaign-chat-dock-shell/` exists and `openspec/changes/campaign-chat-dock-shell/` is gone
- [ ] **Create doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-campaign-chat-dock-shell` then `git push -u origin doc/archive-YYYY-MM-DD-campaign-chat-dock-shell`
- [ ] Open PR from `doc/archive-YYYY-MM-DD-campaign-chat-dock-shell` to `main` with title `docs: archive campaign-chat-dock-shell (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until it merges (same loop as implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/campaign-chat-dock-shell doc/archive-YYYY-MM-DD-campaign-chat-dock-shell`
