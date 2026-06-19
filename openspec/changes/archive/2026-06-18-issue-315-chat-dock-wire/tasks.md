# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/issue-315-chat-dock-wire` then immediately `git push -u origin feat/issue-315-chat-dock-wire`

## Execution

### T1 — Move CampaignChat to campaign layout

- [x] **T1a** — Create `app/campaigns/[id]/layout.tsx`:
  - Mark `"use client"` (needed to pass `params.id` as prop to `CampaignChat`).
  - Accept `{ params, children }: { params: { id: string }; children: React.ReactNode }`.
  - Render `<CampaignChat campaignId={params.id} />` and `{children}`.
- [x] **T1b** — Remove `<CampaignChat />` import and render from `app/layout.tsx`.
- [x] **T1c** — Add `campaignId: string` prop to `CampaignChat` in `lib/components/CampaignChat.tsx`; remove the no-prop signature.
- [x] **T1d** — Verify: `npm run build` passes; existing `tests/unit/components/CampaignChat.test.tsx` still passes (update test fixtures to pass `campaignId` prop).

### T2 — Connect to SSE stream and accumulate messages

- [x] **T2a** — Import `useCampaignStream` and `CampaignStreamEvent` in `lib/components/CampaignChat.tsx`.
- [x] **T2b** — Add `messages: CampaignMessage[]` state (useState). Maintain a `seenIds: Set<string>` ref for deduplication.
- [x] **T2c** — Call `useCampaignStream(campaignId, onEvent)` inside `CampaignChat`. In `onEvent`: if `e.type === "message"` and `!seenIds.has(e.data.id)`, add to `seenIds` and append `e.data` to `messages`.
- [x] **T2d** — Expose stream `status` from hook return for use in composer disabled logic (T6).
- [x] **T2e** — Write unit tests: mock `useCampaignStream`; simulate `"message"` event → assert message added to feed; simulate duplicate → assert feed length unchanged; simulate `"heartbeat"` → assert no change.

### T3 — Fetch members on mount

- [x] **T3a** — Add `members: CampaignMember[]` state. On mount (`useEffect` with `[campaignId]` dep), call `GET /api/campaigns/${campaignId}/members`. On success, set members (filter to `status === "active"`). On failure, leave members empty — no crash.
- [x] **T3b** — Import `CampaignMember` from `@/lib/types`.
- [x] **T3c** — Write unit tests: mock `fetch`; assert `GET /api/campaigns/[id]/members` called once on mount; assert failure leaves members as `[]`.

### T4 — History load on open + infinite scroll

- [x] **T4a** — Add state: `page: number` (starts at 1), `hasMore: boolean` (starts at true), `isLoadingHistory: boolean`.
- [x] **T4b** — In a `useEffect` on `isExpanded`: when `isExpanded` becomes `true` and `messages.length === 0`, call `GET /api/campaigns/${campaignId}/messages?page=1&perPage=30`. Parse response, set `messages`, set `hasMore = results.length === 30`, mark `seenIds` for all returned IDs.
- [x] **T4c** — Attach a `scroll` handler to the feed container ref. When `scrollTop === 0` and `hasMore && !isLoadingHistory`: set `isLoadingHistory = true`, fetch `?page=${page+1}&perPage=30`, save `scrollHeight` before prepend, prepend (deduplicating by seenIds), restore `scrollTop` by `newScrollHeight - prevScrollHeight`, update `page`, set `hasMore = results.length === 30`, set `isLoadingHistory = false`.
- [x] **T4d** — Write unit tests: mock `fetch`; assert called on expand; assert not called on initial mount (collapsed); assert second page fetched on scroll-to-top; assert `hasMore = false` when result count < 30.

### T5 — Unread badge

- [x] **T5a** — Add `unreadCount: number` state (starts at 0). Add `lastOpenKey` constant: `` `campaign-chat-last-open-${campaignId}` ``.
- [x] **T5b** — On mount: read `LocalStore.get<string>(lastOpenKey)` (wrap in try/catch). Parse as `Date`. Store as `lastOpenRef`.
- [x] **T5c** — In the stream `onEvent` handler: if dock is collapsed (`!isExpanded`) and `e.type === "message"` and `new Date(e.data.createdAt) > lastOpenRef`, increment `unreadCount`.
- [x] **T5d** — On dock expand (`EXPAND` action): write `new Date().toISOString()` to `LocalStore.set(lastOpenKey, ...)` (try/catch), update `lastOpenRef`, reset `unreadCount` to 0.
- [x] **T5e** — In the collapsed pill render: if `unreadCount > 0`, show a badge element (e.g., `<span aria-label="unread messages">{unreadCount}</span>`) alongside the "Chat ›" label.
- [x] **T5f** — Write unit tests: mock LocalStore; fire stream event while collapsed → assert badge count; open dock → assert badge gone and LocalStore updated; fire stream event while expanded → assert count stays 0; LocalStore throws → assert no crash.

### T6 — Composer shell + visibility selector

- [x] **T6a** — Add composer state: `composerText: string`, `visibility: MessageVisibility` (default `{ scope: "group" }`), `isSending: boolean`.
- [x] **T6b** — Render a `ChatComposer` sub-component (non-exported function in same file). Props: `composerText`, `onTextChange`, `visibility`, `onVisibilityChange`, `isSending`, `streamStatus`, `members`, `onSend`, `mentionQuery`, `mentionResults`, `onMentionSelect`.
- [x] **T6c** — Inside `ChatComposer`: render `<textarea>` and a visibility `<select>` with three options: `group` ("Group"), `dm-only` ("DM-only"), `direct` ("Whisper"). Disable textarea and Send button when `streamStatus !== "open"` or `isSending`. Show a small status line "Reconnecting…" when stream is not open.
- [x] **T6d** — On visibility `<select>` change to `direct`: do not set `toUserId` yet (that comes from @mention or a separate whisper select). On change away from `direct`: clear any `mentionQuery` and reset visibility to the new scope with no `toUserId`.
- [x] **T6e** — Write unit tests: assert three visibility options present; selecting DM-only sets `visibility.scope = "dm-only"`; disabled state when `streamStatus = "error"`.

### T7 — @mention autocomplete

- [x] **T7a** — Add state: `mentionQuery: string | null`, `mentionAnchorIndex: number`.
- [x] **T7b** — In textarea `onChange`: run `/@(\w*)$/.exec(text.slice(0, selectionStart))`. If matched, set `mentionQuery` to the capture group; else set `mentionQuery = null`.
- [x] **T7c** — Derive `mentionResults: CampaignMember[]` from members filtered by `username.toLowerCase().startsWith(mentionQuery.toLowerCase())` when `mentionQuery !== null`.
- [x] **T7d** — Render `MentionDropdown` sub-component (non-exported, same file) when `mentionResults.length > 0`. Renders a floating `<ul>` with one `<li>` per matching member. On item click: replace `@{mentionQuery}` in `composerText` with `@{member.username}`, set `mentionQuery = null`, set `visibility = { scope: "direct", toUserId: member.userId }`.
- [x] **T7e** — On blur of textarea or press of Escape: clear `mentionQuery` (close dropdown without selecting).
- [x] **T7f** — Second @mention selection replaces `visibility.toUserId` with the new member's ID.
- [x] **T7g** — If `@mention` text is subsequently deleted from textarea (regex no longer matches): reset `visibility` to `{ scope: "group" }`.
- [x] **T7h** — Write unit tests: type `@al` → assert dropdown appears with matching member; select → assert visibility and text updated; no match → dropdown hidden; delete @mention → visibility reset; second selection → toUserId replaced.

### T8 — Send message

- [x] **T8a** — Implement `handleSend` in `CampaignChat`: guard on `composerText.trim() !== ""` and `streamStatus === "open"` and `!isSending`. Set `isSending = true`.
- [x] **T8b** — Optimistically append a `CampaignMessage` to `messages` with `id = \`pending-${Date.now()}\``, `senderId = user.userId`, `senderName = user.username ?? user.email`, `text = composerText`, `visibility`, `createdAt = new Date()`.
- [x] **T8c** — Call `POST /api/campaigns/${campaignId}/messages` with `{ text: composerText.trim(), visibility }`. On completion (success or error): set `isSending = false`. On success: clear `composerText`, reset `visibility` to `{ scope: "group" }`, clear `mentionQuery`.
- [x] **T8d** — Wire Send button `onClick` and textarea `onKeyDown` (Enter without Shift) to `handleSend`.
- [x] **T8e** — Write unit tests: mock `fetch`; assert POST called with correct body; assert composer cleared on success; assert no POST when text is empty; assert button disabled during `isSending`.

### T9 — Message feed render (ChatFeed)

- [x] **T9a** — Render a `ChatFeed` sub-component (non-exported, same file). Props: `messages`, `isLoadingHistory`, `feedRef` (for scroll listener).
- [x] **T9b** — Each message: render `senderName`, formatted `createdAt` (locale time string), visibility marker, and `text`.
  - `scope = "group"` → no marker
  - `scope = "dm-only"` → label `[DM]`
  - `scope = "direct"` → label `[→ @{resolvedUsername}]` (look up `toUserId` in members to find username; fall back to `toUserId` if not found)
- [x] **T9c** — Show a loading indicator at the top of the feed when `isLoadingHistory = true`.
- [x] **T9d** — Write unit tests: assert group message renders no marker; dm-only renders `[DM]`; direct renders `[→ @username]`; loading indicator present when `isLoadingHistory`.

### T10 — Update existing spec and anatomy

- [x] **T10a** — Update `openspec/specs/campaign-chat-dock/spec.md` to note that `CampaignChat` now requires `campaignId` prop and is mounted in `app/campaigns/[id]/layout.tsx`, not `app/layout.tsx`. Add a forward-reference to the new spec.
- [x] **T10b** — Update `.wolf/anatomy.md` with entry for `app/campaigns/[id]/layout.tsx`.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm test` — all unit tests pass (including updated CampaignChat shell tests with new `campaignId` prop)
- [x] `npm run test:integration` — integration tests pass
- [x] `npx tsc --noEmit` — no TypeScript errors (3 pre-existing errors in unrelated test files)
- [x] `npm run build` — build succeeds with no errors
- [x] `npm run lint` — no lint errors (1 pre-existing warning in unrelated file)
- [x] Manually open `/campaigns/[id]` in browser: confirm dock pill appears; open dock; confirm "No messages yet" replaced by live feed or history
- [x] Manually verify dock pill absent on `/` and `/parties`
- [x] All tasks above marked complete

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test:unit` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Build** — `npm run build` — build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build` — build must succeed with no errors
- Skip integration and regression/E2E tests

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/issue-315-chat-dock-wire` and push to remote
- [x] Open PR from `feat/issue-315-chat-dock-wire` to `main`. PR body MUST include `Closes #315`.
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, push before anything else this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address each unresolved thread, commit fixes, run validation, push, wait 180 seconds; repeat until all threads resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, validate, push, wait 180 seconds; restart loop from step 1

Ownership metadata:

- Implementer: (assigned at apply time)
- Reviewer(s): (assigned at apply time)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update `openspec/specs/campaign-chat-dock/spec.md` with final merged behavior (prop change, layout mount point)
- [x] Sync `openspec/changes/issue-315-chat-dock-wire/specs/campaign-chat-wire/spec.md` → `openspec/specs/campaign-chat-wire/spec.md`. After copying, update relative links: replace `../../design.md` with `../../changes/archive/2026-06-18-issue-315-chat-dock-wire/design.md` and `../../tasks.md` with `../../changes/archive/2026-06-18-issue-315-chat-dock-wire/tasks.md`.
- [x] Archive the change: move `openspec/changes/issue-315-chat-dock-wire/` to `openspec/changes/archive/2026-06-18-issue-315-chat-dock-wire/` **in a single atomic commit** (stage both new location and deletion of old location together — never split into two commits).
- [x] Confirm `openspec/changes/archive/2026-06-18-issue-315-chat-dock-wire/` exists and `openspec/changes/issue-315-chat-dock-wire/` is gone.
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-06-18-issue-315-chat-dock-wire` then `git push -u origin doc/archive-2026-06-18-issue-315-chat-dock-wire`
- [x] Open a PR from `doc/archive-…` to `main` with title `docs: archive issue-315-chat-dock-wire (2026-06-18)` — **do NOT push directly to `main`**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [x] Monitor the doc PR until it merges (same loop as implementation PR)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D feat/issue-315-chat-dock-wire doc/archive-2026-06-18-issue-315-chat-dock-wire`
