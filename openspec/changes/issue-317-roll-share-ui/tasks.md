# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/issue-317-roll-share-ui` then immediately `git push -u origin feature/issue-317-roll-share-ui`

## Execution

### Task 1 — Add `activeSessionId` prop to `CampaignChat` and pass it from the campaign page

Files: `lib/components/CampaignChat.tsx`, caller component (campaign page).

- [x] Add `activeSessionId: string | null` to the `CampaignChat` props signature.
- [x] Update the campaign page to pass `campaign.activeSessionId ?? null` to `<CampaignChat>`.
- [x] Confirm: `CampaignChat` compiles; existing message functionality unaffected.

Acceptance criteria: spec scenario "activeSessionId null disables roll functionality", "activeSessionId non-null enables roll functionality".

---

### Task 2 — Unify feed state as `FeedItem` discriminated union

Files: `lib/components/CampaignChat.tsx`.

- [x] Define `type FeedItem = { kind: 'message'; data: CampaignMessage } | { kind: 'roll'; data: CampaignRoll }` locally in `CampaignChat.tsx`.
- [x] Replace `messages: CampaignMessage[]` state with `feed: FeedItem[]`.
- [x] Update `seenIds` ref to track both message ids and roll ids (no change needed to the ref itself — ids are already strings; ensure roll id is added on stream receipt and on history load).
- [x] Update `onStreamEvent` to handle `e.type === 'roll'`: wrap in `{ kind: 'roll', data: e.data }` and append to feed (same dedup guard as messages).
- [x] Update `ChatFeed` props from `messages: CampaignMessage[]` to `feed: FeedItem[]`.
- [x] Update `ChatFeed` render loop to branch on `item.kind` — message items render existing markup; roll items delegate to `RollFeedItem` (stub returning `null` at this stage is fine).
- [x] Unit tests: `onStreamEvent` with `type: "roll"` appends to feed; duplicate roll id is ignored.

Acceptance criteria: spec scenarios "Stream roll event appended after existing feed", "Duplicate roll id from stream is ignored".

---

### Task 3 — Implement `RollFeedItem` sub-component

Files: `lib/components/CampaignChat.tsx`.

- [x] Add `function RollFeedItem({ roll }: { roll: CampaignRoll })` inside `CampaignChat.tsx`.
- [x] Display: roller name (`roll.rollerName`), formatted timestamp, visibility marker (`[DM]` if `dm-only`, nothing if `group`), formula (`roll.formula`), breakdown (`roll.rolls.join(', ')` wrapped in `[…]`), total.
- [x] Apply visual distinction: a dice icon (`🎲` or SVG) and a subtle background tint (e.g., `bg-gray-700/50 rounded`) to differentiate from message items.
- [x] Wire `RollFeedItem` into the `ChatFeed` render loop (replace the `null` stub from Task 2).
- [x] Unit/render tests: given a `CampaignRoll` fixture, assert formula, breakdown, total, roller name, and visibility marker are rendered; assert group-scoped roll shows no marker.

Acceptance criteria: spec scenarios "Roll feed item shows formula breakdown and total", "Group-scoped roll shows no visibility marker", "Roll feed item is visually distinct from a message item".

---

### Task 4 — Implement `RollEntryStrip` sub-component

Files: `lib/components/CampaignChat.tsx`, `lib/utils/dice.ts` (import only).

- [x] Add `interface RollEntryStripProps` with: `campaignId: string`, `activeSessionId: string | null`, `streamStatus: 'connecting' | 'open' | 'error'`, `members` (for visibility selector — not needed, RollVisibility has no `direct`), `onRollPosted: (roll: CampaignRoll) => void`.
- [x] Add `function RollEntryStrip(props: RollEntryStripProps)` with state: `modifier: number` (default 0), `visibility: RollVisibility` (default `{ scope: 'group' }`), `isRolling: boolean`, `error: string | null`.
- [x] Render: a row of six buttons labelled "d4", "d6", "d8", "d10", "d12", "d20"; a `<input type="number">` for modifier; a `<select>` for visibility (Group / DM-only); and conditional error text.
- [x] Disabled condition: `activeSessionId === null || streamStatus !== 'open' || isRolling`. Show "No active session" label when `activeSessionId === null`.
- [x] On die button click: implemented per spec.
- [x] Wire `RollEntryStrip` into `CampaignChat`'s expanded drawer below `ChatComposer`, passing `onRollPosted` which wraps the roll in a `FeedItem` and appends to feed (with dedup guard).
- [x] Unit tests: button click with modifier=3 produces correct formula/total; modifier=0 omits sign; negative modifier uses minus sign; disabled when `activeSessionId` is null; 409 shows inline error; successful roll calls `onRollPosted`.

Acceptance criteria: all Roll-entry strip spec scenarios.

---

### Task 5 — Fetch roll history in parallel with message history on dock expand

Files: `lib/components/CampaignChat.tsx`.

- [x] In the `useEffect` that fires on `isExpanded`, replace the single `fetch` call with `Promise.all([fetchMessages(), fetchRolls()])` when `activeSessionId` is non-null; otherwise keep the single message fetch.
- [x] `fetchRolls`: `GET /api/campaigns/${campaignId}/rolls?sessionId=${activeSessionId}&limit=30` — returns `{ rolls: CampaignRoll[], nextCursor?: string }` (consult existing API route for exact shape).
- [x] Merge results: map messages to `FeedItem` (kind: 'message') and rolls to `FeedItem` (kind: 'roll'), combine arrays, sort by `createdAt` ascending, dedup via `seenIds`, set as initial `feed`.
- [x] Keep `isLoadingHistory` flag gated on both fetches completing.
- [x] Unit tests: verify `GET /rolls` is called with correct `sessionId`; verify merged feed sorted by timestamp; verify no rolls fetch when `activeSessionId` is null.

Acceptance criteria: spec scenarios "Roll history fetched with active sessionId on expand", "Roll history skipped when no active session", "History messages and rolls merged and sorted by createdAt".

---

### Task 6 — Run tests, type check, and build

- [x] `npm run test:unit` — all tests pass.
- [x] `npm run test:integration` — requires `npm run build` first; all tests pass.
- [x] `npx tsc --noEmit` — no type errors (only pre-existing test file errors unchanged from main).
- [x] `npm run build` — build succeeds.

---

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill on the staged/modified files. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] `npm run test:unit` — all suites pass
- [ ] `npm run build` — succeeds
- [ ] `npm run test:integration` — all suites pass (run after build)
- [ ] `npx tsc --noEmit` — no errors
- [ ] Roll strip renders enabled when `activeSessionId` is non-null
- [ ] Roll strip renders disabled with "No active session" label when `activeSessionId` is null
- [ ] Clicking a die button posts correct formula/rolls/total to the API
- [ ] Roll appears in the feed interleaved with messages by timestamp
- [ ] DM-only roll shows `[DM]` marker; group roll shows no marker
- [ ] Duplicate roll id from stream/history does not appear twice

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- `npm run test:unit` — all tests must pass
- `npm run build` — build must succeed
- `npm run test:integration` — all tests must pass (requires build)

**Docs-only path** (every changed file is `.md`):

- `npm run build` — build must succeed
- Skip integration tests

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to `feature/issue-317-roll-share-ui` and push
- [ ] Open PR from `feature/issue-317-roll-share-ui` to `main`. PR body must include: `Closes #317`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Iterate until merged** — repeat continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED`, exit and notify the user:
  1. **Build and tests** — run all steps in [Remote push validation]; fix failures, commit, push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address each unresolved thread, commit, run [Remote push validation], push, wait 180 seconds; repeat until all resolved
  3. **CI check failures** — only after all comments resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, run [Remote push validation], push, wait 180 seconds; restart loop from step 1

Ownership metadata:

- Implementer: (assigned at apply time)
- Reviewer(s): repo owner (dougis)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas: copy `openspec/changes/issue-317-roll-share-ui/specs/roll-share-ui/spec.md` to `openspec/specs/roll-share-ui/spec.md`; update relative links in the copied file: replace `../../design.md` → `../../changes/archive/YYYY-MM-DD-issue-317-roll-share-ui/design.md` and `../../tasks.md` → `../../changes/archive/YYYY-MM-DD-issue-317-roll-share-ui/tasks.md`
- [ ] Archive the change: move `openspec/changes/issue-317-roll-share-ui/` to `openspec/changes/archive/YYYY-MM-DD-issue-317-roll-share-ui/` — **stage both the copy and the deletion in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-issue-317-roll-share-ui/` exists and `openspec/changes/issue-317-roll-share-ui/` is gone
- [ ] **Create doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-issue-317-roll-share-ui` then `git push -u origin doc/archive-YYYY-MM-DD-issue-317-roll-share-ui`
- [ ] Open PR from `doc/archive-YYYY-MM-DD-issue-317-roll-share-ui` to `main` with title `docs: archive issue-317-roll-share-ui (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until merged (same loop — address comments/CI, push to doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feature/issue-317-roll-share-ui doc/archive-YYYY-MM-DD-issue-317-roll-share-ui`
