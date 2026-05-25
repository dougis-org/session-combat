# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/content-library` then immediately `git push -u origin feature/content-library`

## Execution

### Task 1 — Add SavedContent type to lib/types.ts

- [x] Add `SavedContent` interface to `lib/types.ts` after `SessionLog`:
  ```ts
  export interface SavedContent {
    _id?: string;
    id: string;
    userId: string;
    campaignId: string;
    type: 'npc' | 'location' | 'shop' | 'magic-item' | 'room';
    title: string;
    systemPrompt: string;
    userMessage: string;
    prompt: string;        // fullText — combined for copy convenience
    result?: string;
    notes?: string;
    chapter?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  ```
- [x] Verify: `npm run typecheck` passes with no new errors

### Task 2 — Add savedContent CRUD to lib/storage.ts

- [x] Add `savedContent` object to `lib/storage.ts` following the `sessionLogs` pattern:
  - `list(campaignId: string, userId: string): Promise<SavedContent[]>` — query `{ campaignId, userId }`, sort `{ createdAt: -1 }`
  - `create(item: Omit<SavedContent, 'id' | '_id' | 'createdAt' | 'updatedAt'>): Promise<SavedContent>` — insert with timestamps
  - `update(id: string, userId: string, patch: Pick<SavedContent, 'result' | 'notes'>): Promise<void>` — update `result`, `notes`, `updatedAt`
  - `remove(id: string, userId: string): Promise<void>` — delete by `{ _id, userId }`
- [x] All queries include `userId` filter (security requirement)
- [x] Verify: `npm run typecheck` passes

### Task 3 — Add API routes

- [x] Create `app/api/content/route.ts`:
  - `GET` — extract `campaignId` from query params, call `storage.savedContent.list`, return 200 JSON array
  - `POST` — parse body, call `storage.savedContent.create`, return 201 with created item
  - Both protected by existing auth middleware (pattern: copy from `app/api/campaigns/route.ts`)
- [x] Create `app/api/content/[id]/route.ts`:
  - `PUT` — parse body `{ result, notes }`, call `storage.savedContent.update`, return 200
  - `DELETE` — call `storage.savedContent.remove`, return 204
  - Both protected by auth middleware
- [x] Verify: `npm run typecheck` passes

### Task 4 — Write integration tests for API routes (before UI)

Follow BDD/TDD: write tests before implementing the UI.

- [x] Create `lib/api/__tests__/content.test.ts` (or equivalent test location used by the project):
  - POST creates item; response contains all fields including `systemPrompt`, `userMessage`, `prompt`
  - GET lists items for campaignId, newest first
  - GET filters by userId (item from another user not returned)
  - PUT updates `result` and `notes`; `updatedAt` advances
  - DELETE removes item; subsequent GET does not include it
  - GET with no auth returns 401
  - DELETE with no auth returns 401
- [x] Verify: `npm run test:unit` passes

### Task 5 — Build library page app/campaigns/[id]/library/page.tsx

- [x] Create `app/campaigns/[id]/library/page.tsx`:
  - Wrap in `ProtectedRoute` (same pattern as `app/campaigns/[id]/prompts/page.tsx`)
  - On mount: `GET /api/content?campaignId=[id]`
  - Filter tabs: All / NPC / Location / Shop / Magic Item / Room
  - Render items as collapsed cards (newest first)
  - Collapsed card: type badge, title, chapter (if set), created date, result checkmark if `result` is non-empty
  - Clicking a card expands it:
    - `systemPrompt` section — label "SYSTEM", monospace, muted color (e.g. `text-gray-400 font-mono`)
    - `userMessage` section — label "USER", monospace, brighter color (e.g. `text-gray-100 font-mono`)
    - "Copy Full Prompt" button — copies `prompt` (fullText) to clipboard
    - "Response" textarea — pre-filled with `result`, editable
    - "Notes" textarea — pre-filled with `notes`, editable
    - "Save" button — `PUT /api/content/[id]`; show success/error feedback
    - "Delete" button — `DELETE /api/content/[id]`; remove card from list on success
  - Empty state message when no items
  - Error banner on load failure
- [x] Verify: `npm run typecheck` passes

### Task 6 — Write integration tests for library page

- [x] Integration test: renders library page with mocked GET returning mixed-type items; all items appear
- [x] Integration test: filter tab click shows only matching type items
- [x] Integration test: clicking a card expands it and shows systemPrompt in muted section, userMessage in bright section
- [x] Integration test: "Copy Full Prompt" copies `prompt` field value
- [x] Integration test: editing response and clicking Save calls PUT; success message shown
- [x] Integration test: Delete calls DELETE; item removed from list
- [x] Integration test: empty state renders when GET returns empty array
- [x] Verify: `npm run test:unit` passes

### Task 7 — Add Library nav button to campaign cards

- [x] In `app/campaigns/page.tsx`, add a "Library" button alongside "Prompt Builder" in the campaign card action row:
  ```tsx
  <Link
    href={`/campaigns/${campaign.id}/library`}
    className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-sm"
  >
    Library
  </Link>
  ```
- [x] Verify: campaigns page renders with Library button visible on each card

### Task 8 — Wire Save to Library button in Prompt Builder

- [x] In `app/campaigns/[id]/prompts/page.tsx`, replace the disabled stub with functional save panel:
  - Button enabled only when `builtPrompt` is non-null
  - Clicking opens an inline save panel (not a modal):
    - Title text input — pre-filled with the first non-empty template field value
    - "Save" button — `POST /api/content` with `{ campaignId, type: template.id, title, systemPrompt: builtPrompt.systemPrompt, userMessage: builtPrompt.userMessage, prompt: builtPrompt.fullText, chapter }`
    - "Cancel" button — closes panel, no API call
  - On save success: show confirmation with a link to `/campaigns/[id]/library`
  - On save failure: show error banner; panel stays open, prompt remains visible
- [x] Capture `chapter` from `context.chapter?.title` (available via `useCampaignContext`)
- [x] Verify: `npm run typecheck` passes

### Task 9 — Write integration tests for Save to Library flow

- [x] Integration test: "Save to Library" button is disabled before generate
- [x] Integration test: after generate, clicking "Save to Library" opens save panel with pre-filled title
- [x] Integration test: editing title then saving calls POST with the edited title
- [x] Integration test: successful save shows confirmation with library link
- [x] Integration test: API failure shows error banner and panel stays open
- [x] Integration test: Cancel closes panel without API call
- [x] Verify: `npm run test:unit` passes

---

## Validation

- [x] `npm run typecheck` — no type errors
- [x] `npm run test:unit` — all unit and integration tests pass (including new tests from Tasks 4, 6, 9)
- [x] `npm run build` — production build succeeds
- [ ] Manual smoke test: generate a prompt → save to library → navigate to library → expand card → paste response → save → delete
- [ ] Auth check: confirm unauthenticated requests to `/api/content` return 401
- [x] All tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all integration tests must pass
- **Build** — `npm run build`; must succeed with no errors
- **Type check** — `npm run typecheck`; zero errors

If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [x] Run required pre-PR self-review before committing
- [ ] Commit all changes to `feature/content-library` and push to remote
- [ ] Open PR from `feature/content-library` to `main` — title: "feat: Content Library (#185)"
- [ ] Wait 120 seconds for agentic reviewers to post comments
- [ ] **Monitor PR comments** — address each comment, commit fixes, run all validation steps, push; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — diagnose and fix any failure, commit, run validation, push; repeat until all checks pass
- [ ] Wait for PR to merge — never force-merge

Ownership metadata:
- Implementer: dougis
- Reviewer(s): agentic review + maintainer
- Required approvals: 1

Blocking resolution flow:
- CI failure → diagnose → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on main (library page accessible, nav button present)
- [ ] Mark all remaining tasks complete
- [ ] Update `docs/feature_list.md` if Content Library should appear there
- [ ] Sync approved spec deltas into `openspec/specs/content-library/` (copy `specs/content-library/spec.md`)
- [ ] Archive the change: move `openspec/changes/content-library/` to `openspec/changes/archive/YYYY-MM-DD-content-library/` **in a single atomic commit** (stage both the new location and deletion of the old location together — never split into two commits)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-content-library/` exists and `openspec/changes/content-library/` is gone
- [ ] Commit and push the archive commit to main
- [ ] `git fetch --prune` and `git branch -d feature/content-library`
