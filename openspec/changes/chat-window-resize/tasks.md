# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/chat-window-resize` then immediately `git push -u origin feat/chat-window-resize`

## Execution

### 1. Extend DockState and dockReducer

File: `lib/components/CampaignChat.tsx`

- [x] Add `isLarge: boolean` and `customHeight: number | null` to `DockState`
- [x] Add `TOGGLE_SIZE` and `SET_HEIGHT` actions to `DockAction` union
- [x] Update `dockReducer`:
  - `TOGGLE_SIZE`: toggle `isLarge`; if collapsing from large, return to `customHeight` or 33vh (no state to clear — height resolution handles it)
  - `SET_HEIGHT`: set `customHeight: Math.max(150, payload)`, clear `isLarge: false`
- [x] Update initial state: `{ isExpanded: false, isPinned: false, isLarge: false, customHeight: null }`
- [x] Add height resolution helper: `isLarge → 'calc(100vh - 60px)'`, `customHeight → '${customHeight}px'`, default `'33vh'`

### 2. Implement localStorage persistence for custom height

File: `lib/components/CampaignChat.tsx`

- [x] Define constant `CHAT_SIZE_KEY = 'campaign-chat-size'`
- [x] Define type `PersistedSize = { height: number; screenWidth: number; screenHeight: number }`
- [x] On mount (`useEffect` with `[]`), read `safeGet<PersistedSize>(CHAT_SIZE_KEY)`. If present and `Math.abs(saved.screenWidth - window.innerWidth) <= 100 && Math.abs(saved.screenHeight - window.innerHeight) <= 100`, dispatch `SET_HEIGHT(saved.height)`
- [x] After drag completes (mouseup), call `safeSet(CHAT_SIZE_KEY, { height: customHeight, screenWidth: window.innerWidth, screenHeight: window.innerHeight })`

### 3. Add drag-to-resize handle sub-component

File: `lib/components/CampaignChat.tsx`

- [x] Create `DragHandle` sub-component (internal to file): a `<div>` 8px tall, full width, `cursor: ns-resize`, with a subtle visual indicator (e.g., 2-column centered dots or a thin line)
- [x] On `mousedown`: record `startY = e.clientY`, `startHeight = currentHeightPx` (resolved from state)
- [x] Attach `mousemove` and `mouseup` handlers to `document` inside the mousedown callback
- [x] On `mousemove`: compute `newHeight = startHeight - (e.clientY - startY)`, dispatch `SET_HEIGHT(newHeight)` (reducer clamps to 150px)
- [x] On `mouseup`: remove `mousemove` and `mouseup` listeners; persist size to localStorage
- [x] Add cleanup effect: on unmount, remove any lingering drag listeners (track them in a ref)
- [x] Render `DragHandle` at the top of the expanded drawer, only when `!isLarge`

### 4. Add expand toggle button to header

File: `lib/components/CampaignChat.tsx`

- [x] Add a square expand/contract icon button to the chat header row (between pin and close buttons)
- [x] Use `aria-label={isLarge ? 'Collapse to compact view' : 'Expand to full height'}`
- [x] On click: dispatch `TOGGLE_SIZE`; call `onSizeChange?.(!isLarge)`
- [x] SVG icon: a simple four-corner expand square (⛶ — or an inline SVG with four outward-pointing arrows, consistent with existing pin icon style)

### 5. Add onSizeChange prop and wire to layout

File: `lib/components/CampaignChat.tsx`

- [x] Add `onSizeChange?: (isLarge: boolean) => void` to component props
- [x] Call `onSizeChange?.(true)` when transitioning to large mode
- [x] Call `onSizeChange?.(false)` when transitioning to compact mode
- [x] Update the expanded drawer's className/style to use resolved height and position:
  - Compact: `fixed bottom-0 right-0 … w-80`, `style={{ height: resolvedHeight }}`
  - Large: remove `fixed` positioning — render as a normal `h-full w-80` flex child (the layout handles positioning)

### 6. Update CampaignLayout for side-by-side

File: `app/campaigns/[id]/layout.tsx`

- [x] Add `isChatLarge` state: `const [isChatLarge, setIsChatLarge] = useState(false)`
- [x] Wrap the layout's content area in a conditional flex container:
  - When `isChatLarge`: `<div className="flex h-screen overflow-hidden"> <main className="flex-1 overflow-auto">…children…</main> <CampaignChat … onSizeChange={setIsChatLarge} /> </div>`
  - When compact: current structure unchanged, `<CampaignChat … onSizeChange={setIsChatLarge} />` rendered as a floating child
- [x] Pass `onSizeChange={setIsChatLarge}` to `CampaignChat`
- [x] Read the current layout file before editing — confirm the exact JSX structure

### 7. Write unit tests

Files: `tests/unit/components/CampaignChat.resize.test.tsx` (new file)

- [x] Test `dockReducer`:
  - `TOGGLE_SIZE` from compact sets `isLarge: true`
  - `TOGGLE_SIZE` from large sets `isLarge: false`
  - `SET_HEIGHT(400)` sets `customHeight: 400, isLarge: false`
  - `SET_HEIGHT(50)` sets `customHeight: 150` (minimum clamp)
- [x] Test height resolution helper:
  - `isLarge: true` → `'calc(100vh - 60px)'`
  - `isLarge: false, customHeight: 400` → `'400px'`
  - `isLarge: false, customHeight: null` → `'33vh'`
- [x] Test persistence load logic:
  - Matching screen dims → `SET_HEIGHT` dispatched
  - Mismatched screen dims (>100px diff) → no dispatch, default height
  - `localStorage` throws → no crash, default height
- [x] Test expand button:
  - RTL: render `CampaignChat`, click expand button, assert `onSizeChange(true)` called
  - Assert panel style changes to `calc(100vh - 60px)`
- [x] Test collapse from large:
  - RTL: click expand to large, click again to compact, assert `onSizeChange(false)` called
  - Assert panel returns to compact style
- [x] Test drag handle minimum clamp:
  - RTL: simulate mousedown on drag handle + mousemove that would result in <150px height
  - Assert final height is 150px

### 8. Update existing CampaignChat tests

File: `tests/unit/components/CampaignChat.test.tsx`

- [x] Update any tests that assert on the expanded drawer's className or style (new `isLarge` default = false, so compact tests should be unaffected)
- [x] If `onSizeChange` prop is required in any test render, add it as `undefined` or a jest mock

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm run test:unit` — all tests pass (including new resize tests)
- [x] `npm run build` — build succeeds with no type errors
- [x] Manual smoke: open a campaign page, verify compact chat renders at bottom-right; click expand, verify side-by-side layout; drag handle adjusts height; reload, verify height persists; change viewport size >100px, reload, verify default height
- [x] All completed tasks marked as complete

## Remote push validation

**Full path** (non-`.md` files changed):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `feat/chat-window-resize` to `main`. PR body must include: `Closes #444`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED` exit and notify user — **never wait for a human; never force-merge**:
  1. **Build and tests** — run all steps in Remote push validation; fix failures, commit, push before proceeding
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address each unresolved thread, commit, validate, push, wait 180s
  3. **CI failures** — after comments resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failures, commit, validate, push, wait 180s; restart loop from step 1

Ownership metadata:

- Implementer: assigned agent
- Reviewer(s): @dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → `npm run test:unit && npm run build` → push → re-run checks
- Security finding → remediate → commit → validate → push → re-scan
- Review comment → address → commit → validate → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync spec delta to global specs: copy `openspec/changes/chat-window-resize/specs/chat-window-resize/spec.md` → `openspec/specs/chat-window-resize/spec.md`; update relative links to point to archive location
- [ ] Archive the change: move `openspec/changes/chat-window-resize/` to `openspec/changes/archive/YYYY-MM-DD-chat-window-resize/` **in a single atomic commit** (stage both copy and deletion together)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-chat-window-resize/` exists and `openspec/changes/chat-window-resize/` is gone
- [ ] **Create a doc branch**: `git checkout -b doc/archive-YYYY-MM-DD-chat-window-resize` then `git push -u origin doc/archive-YYYY-MM-DD-chat-window-resize`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-chat-window-resize` to `main` with title `docs: archive chat-window-resize (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until merged (same loop — address comments and CI failures, push to doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` && `git branch -D feat/chat-window-resize doc/archive-YYYY-MM-DD-chat-window-resize`
