## Context

- Relevant architecture: Next.js App Router API routes with MongoDB; SSE transport via `emitFiltered`; `CampaignChat` is a client component backed by `useCampaignStream` for live events and `useAuth` for identity; GridFS managed via `lib/gridfs.ts` (established by 7a).
- Dependencies: `feat/gridfs-attachment-upload-serve` must be merged to `main` before this change begins. That branch provides `MessageKind`, `CampaignMessage.{kind, attachmentId}`, `POST /api/campaigns/[id]/attachments`, `GET /api/campaigns/[id]/attachments/[attachmentId]`, and `lib/gridfs.ts`.
- Interfaces/contracts touched:
  - `POST /api/campaigns/[id]/messages` — extended (kind, attachmentId, optional text for scene)
  - `CampaignMessage` (lib/types.ts) — consumed, not modified (7a owns those fields)
  - `CampaignStreamEvent` — consumed, not modified (scene messages use existing `message` event)
  - `CampaignChat` / `ChatFeed` — extended with scene rendering and compose button

## Goals / Non-Goals

### Goals

- DMs can compose and push a scene (image + optional caption) from CampaignChat
- Scene messages are delivered live to all active members via existing SSE
- Scene messages render distinctly in ChatFeed with an enlargeable thumbnail
- Server enforces DM-only access for scene message creation
- Caption/text is optional for scene messages (image-only valid)
- No new dependencies; no new SSE event types

### Non-Goals

- Text-only scene messages (image required via UI; text-only path not exposed)
- Image resizing, cropping, or thumbnail generation server-side
- Per-scene player visibility control
- Rate limiting the messages endpoint

## Decisions

### Decision 1: Extend existing messages POST rather than add a new scene endpoint

- Chosen: Extend `POST /api/campaigns/[id]/messages` to accept `kind: 'scene'`, optional `attachmentId`, and optional `text`.
- Alternatives considered: New `POST /api/campaigns/[id]/scenes` endpoint that wraps both the attachment and message creation.
- Rationale: `CampaignMessage` already models scene via `kind`; the existing endpoint handles SSE emit, member validation, and persistence. A new endpoint would duplicate all of that logic. Keeping one endpoint keeps the feed data model unified.
- Trade-offs: The messages route becomes slightly more complex (branching on `kind`). Acceptable — the branch is localized to validation logic.

### Decision 2: Two-step client submit (upload → message)

- Chosen: Client POSTs to `/attachments` first (gets `attachmentId`), then POSTs to `/messages` with `kind:'scene'`, `attachmentId`, and optional text.
- Alternatives considered: Single atomic server endpoint that accepts multipart (file + metadata) and creates both GridFS entry and message in one request.
- Rationale: 7a was built with the two-step approach; the atomic alternative would require a new endpoint. `deleteOrphanedAttachments` in 7a's upload route already sweeps stale files on each campaign upload, providing adequate orphan protection without additional complexity.
- Trade-offs: An upload-succeed / message-fail scenario leaves an orphaned file until the next upload triggers cleanup. Risk is low (storage waste only, not data loss).

### Decision 3: SceneComposer and SceneFeedItem as separate components

- Chosen: Extract `SceneComposer` (`lib/components/SceneComposer.tsx`) and `SceneFeedItem` (`lib/components/SceneFeedItem.tsx`) rather than adding scene logic inline to `CampaignChat.tsx`.
- Alternatives considered: Keep all scene logic inside `CampaignChat.tsx`.
- Rationale: `CampaignChat.tsx` is already large (~300 lines). Keeping scene compose and scene render inline would make it significantly harder to test and read. Separate files allow isolated unit tests.
- Trade-offs: Two new files. Minimal — this is the established component pattern in the project.

### Decision 4: Tailwind fixed-overlay `<dialog>` for image enlarge

- Chosen: A `<dialog>` element styled with Tailwind (`fixed inset-0 bg-black/80 flex items-center justify-center z-50`), controlled by `showRef.current` / state. Escape key closes via `dialog.close()` native behavior; click-outside also closes.
- Alternatives considered: Third-party lightbox library; CSS-only approach using `:target`.
- Rationale: No library dep; `<dialog>` has native keyboard and focus management (Escape, focus trap). Matches existing project pattern of using Tailwind without UI component libraries.
- Trade-offs: `<dialog>` requires `ref` and `showModal()` / `close()` in React; slight imperative overhead. Acceptable.

### Decision 5: DM gate at server level; button conditionally rendered client-side

- Chosen: Server checks `member.role === 'dm'` when `kind === 'scene'` (403 otherwise). Client renders "Push Scene" button only when the current user is DM (determined via existing member data already fetched by `CampaignChat`).
- Alternatives considered: Client-only gate (no server check).
- Rationale: Defense in depth. The server must enforce the DM constraint regardless of client state.
- Trade-offs: None — this is the established pattern for DM-only actions in this codebase.

## Proposal to Design Mapping

- Proposal element: Extend POST /messages to accept kind/attachmentId
  - Design decision: Decision 1
  - Validation approach: Unit + integration tests on the route handler

- Proposal element: DM-only server gate for scene messages
  - Design decision: Decision 5
  - Validation approach: Integration test POSTing kind:'scene' as non-DM → expect 403

- Proposal element: Two-step client submit
  - Design decision: Decision 2
  - Validation approach: Component test verifying upload call precedes message call; error state tests for each step

- Proposal element: ScenePushButton separate from chat composer
  - Design decision: Decision 3 (extracted components)
  - Validation approach: Component test that button renders only for DM role

- Proposal element: Fullscreen Tailwind overlay for enlarge
  - Design decision: Decision 4
  - Validation approach: Component test that clicking thumbnail opens dialog; Escape closes it

## Functional Requirements Mapping

- Requirement: DM can upload an image and post it as a scene message
  - Design element: SceneComposer → two-step submit (Decisions 2, 3)
  - Acceptance criteria reference: specs/scene-push-render/spec.md — DM compose scenarios
  - Testability notes: Component test mocking fetch calls for both steps; integration test for end-to-end POST sequence

- Requirement: Only DMs can create scene messages
  - Design element: Server role check in messages route (Decision 5)
  - Acceptance criteria reference: specs/scene-push-render/spec.md — authorization scenarios
  - Testability notes: Integration test with non-DM auth token → 403

- Requirement: Scene messages appear in feed for all active members
  - Design element: Existing `emitFiltered` with `canSeeMessage` (group scope); SceneFeedItem rendering (Decision 3)
  - Acceptance criteria reference: specs/scene-push-render/spec.md — feed rendering scenarios
  - Testability notes: Component test with messages array containing kind:'scene' message

- Requirement: Image enlarges on click, closes on Escape / outside click
  - Design element: `<dialog>` overlay (Decision 4)
  - Acceptance criteria reference: specs/scene-push-render/spec.md — enlarge scenarios
  - Testability notes: jsdom dialog mock; user-event click on thumbnail, Escape keypress

- Requirement: Caption is optional; text-only scene rejected (no image)
  - Design element: SceneComposer validation; server accepts empty text when kind='scene'
  - Acceptance criteria reference: specs/scene-push-render/spec.md — validation scenarios
  - Testability notes: Component test Submit disabled when no file selected; server unit test with empty text + kind='scene' → 201

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Non-DMs cannot create scene messages
  - Design element: Decision 5 — server role enforcement
  - Acceptance criteria reference: 403 on POST /messages with kind:'scene' by non-DM
  - Testability notes: Integration test

- Requirement category: reliability
  - Requirement: Upload failure does not crash the compose UI; orphaned files are swept
  - Design element: Decision 2 — two-step client error handling; 7a's `deleteOrphanedAttachments`
  - Acceptance criteria reference: SceneComposer shows error state on upload failure
  - Testability notes: Component test with mocked fetch rejecting on /attachments call

- Requirement category: performance
  - Requirement: Scene images do not block feed scroll for large images
  - Design element: Thumbnail CSS-constrained (`max-h-48`); full image deferred to enlarge click
  - Acceptance criteria reference: SceneFeedItem renders `<img>` with bounded max-height
  - Testability notes: Snapshot / class assertion in component test

- Requirement category: operability
  - Requirement: Merge 7a branch before starting; types must be present
  - Design element: First task in tasks.md is "Verify/merge feat/gridfs-attachment-upload-serve"
  - Testability notes: TypeScript compile succeeds only when 7a types are present

## Risks / Trade-offs

- Risk/trade-off: Orphaned GridFS file if message POST fails after upload succeeds
  - Impact: Minor storage waste; not user-visible
  - Mitigation: 7a's sweep on next upload. Acceptable without additional work.

- Risk/trade-off: `<dialog>` jsdom support is incomplete in some Jest versions
  - Impact: `showModal()` may not be available in test environment
  - Mitigation: Mock `HTMLDialogElement.prototype.showModal` and `.close` in jest.setup.ts if needed

- Risk/trade-off: `CampaignChat.tsx` member role state — DM detection depends on member list already fetched
  - Impact: If member list fetch is slow, button may flash in/out
  - Mitigation: Render button only after members are loaded (existing pattern — members state already gated in chat dock)

## Rollback / Mitigation

- Rollback trigger: Scene messages render incorrectly in feed for existing chat messages; or DM gate fails open.
- Rollback steps: Revert PR. No data migration needed — scene messages are stored with `kind:'scene'`; existing chat messages have no `kind` field and the feed falls back to chat rendering.
- Data migration considerations: None. `kind` is optional; existing messages without it render as chat (default).
- Verification after rollback: Chat feed renders normally; no scene compose button visible.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix failing tests before re-requesting review.
- If security checks fail: Do not merge. Escalate to repo owner (dougis) immediately.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to repo owner after 48 hours.
- Escalation path and timeout: Repo owner (dougis) is final arbiter. Unresolved blocks older than 72 hours should be discussed in the PR thread.

## Open Questions

No open questions. All design decisions are confirmed prior to implementation.
