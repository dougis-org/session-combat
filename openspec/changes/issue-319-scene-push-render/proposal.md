## GitHub Issues

- dougis-org/session-combat#319
- dougis-org/session-combat#299 (Phase 7 epic)

## Why

- Problem statement: DMs have no way to share maps, images, or scene-setting text with their players during a live session. Scene content is communicated outside the app (screen share, external links), leaving no record in campaign history.
- Why now: Both upstream dependencies are complete — 5b (live chat dock, #315) and 7a (GridFS upload/serve, #318) are done. This is the last sub-issue to close Phase 7.
- Business/user impact: Enables DMs to push visual scene content (maps, tokens, handouts) directly into the session feed. Connected players see it live; it persists in campaign history for future reference.

## Problem Space

- Current behavior: `CampaignMessage` has `kind` and `attachmentId` fields (added by 7a) but the messages POST endpoint ignores them. There is no UI for composing or rendering scene content. `ChatFeed` renders all messages identically as text bubbles.
- Desired behavior: DMs see a "Push Scene" button in `CampaignChat`. Clicking it opens an inline scene composer (image picker + optional caption). On submit, the image is uploaded via `POST /attachments`, then a `scene` message is created via `POST /messages`. All active members see the scene inline in the feed (thumbnail + caption, distinct styling). Clicking the image opens a fullscreen overlay; pressing Escape or clicking outside closes it.
- Constraints:
  - Only DMs may create `kind: 'scene'` messages; the server enforces this (403 for non-DMs).
  - Caption (text) is optional for scene messages; image-only and text-only scenes are both valid.
  - Upload limits from 7a: JPEG/PNG/WebP/GIF only, 5 MB max.
  - Scene messages ride the existing `message` SSE event — no new event type.
  - No lightbox library; image enlarge uses a Tailwind fixed-overlay `<dialog>`.
  - 7a branch (`feat/gridfs-attachment-upload-serve`) must be merged to `main` before this work begins.
- Assumptions:
  - `MessageKind = 'chat' | 'scene'` and `CampaignMessage.{kind, attachmentId}` are available (established by 7a).
  - DM role is determined via the existing `assertCampaignAccess` / member `role` pattern.
  - `canSeeMessage` visibility filter is unchanged — scene messages use `scope: 'group'` (all active members).
  - Client identifies itself as DM via the existing `useAuth` + member lookup; the "Push Scene" button is conditionally rendered.
- Edge cases considered:
  - Upload succeeds but message POST fails → orphaned GridFS file; mitigated by 7a's `deleteOrphanedAttachments` sweep on the next upload. No additional client retry logic needed.
  - Scene with no image and no text → rejected client-side before submit (at least one required).
  - Non-DM member somehow reaches POST /messages with kind:'scene' → 403 from server.
  - Image load failure in feed → graceful fallback (broken-image placeholder, caption still visible).
  - SSE delivers scene message before image bytes are fully available → `<img>` lazy loads naturally.

## Scope

### In Scope

- Extend `POST /api/campaigns/[id]/messages` to accept `kind: 'scene'`, optional `attachmentId`, and optional `text` when kind is scene
- DM-only server-side gate for scene messages (403 for non-DMs)
- "Push Scene" button in `CampaignChat` — DM-only, separate from chat composer
- Inline scene composer component (file picker + caption textarea + Send/Cancel)
- Client-side file validation (type, size) before upload attempt
- Two-step submit: POST /attachments → POST /messages
- Scene message rendering in `ChatFeed` (thumbnail + caption, distinct bubble)
- Fullscreen image overlay (`<dialog>`, Tailwind, keyboard-accessible)
- Scene messages persist in campaign history (loaded via existing pagination)
- Unit tests for updated messages route handler
- Integration tests for POST /messages with kind:'scene'
- Component tests for scene composer and scene feed rendering

### Out of Scope

- Text-only scene messages without an image are supported (caption-only is valid); only fully empty scenes (no image and no caption) are disallowed
- Per-scene visibility (show to subset of players)
- Additional attachment types beyond images (audio, video, PDF)
- Image editing, cropping, or annotation
- Rate limiting on the messages endpoint
- Read receipts or "scene viewed" tracking

## What Changes

- `app/api/campaigns/[id]/messages/route.ts` — accept and persist `kind` / `attachmentId`; DM gate for scene; make `text` optional when kind is scene
- `lib/components/CampaignChat.tsx` — add `ScenePushButton`, `SceneComposer`, update `ChatFeed` to branch on `kind === 'scene'`
- `lib/components/SceneComposer.tsx` — new: inline scene compose form (file picker, caption, submit/cancel)
- `lib/components/SceneFeedItem.tsx` — new: renders a scene message (thumbnail, caption, enlarge overlay)
- `tests/unit/api/campaigns/[id]/messages.route.test.ts` — extend with scene cases
- `tests/integration/campaigns/messages.integration.test.ts` — extend with scene cases
- `tests/unit/components/SceneComposer.test.tsx` — new
- `tests/unit/components/SceneFeedItem.test.tsx` — new

## Risks

- Risk: GridFS branch not merged before 7b starts; `kind`/`attachmentId` types missing from main.
  - Impact: Type errors; attachment endpoint missing.
  - Mitigation: Make merging `feat/gridfs-attachment-upload-serve` a hard prerequisite (first task).

- Risk: Upload-then-message race leaves orphaned GridFS files if message POST fails.
  - Impact: Storage waste; not a data-loss risk for users.
  - Mitigation: Already handled by 7a's `deleteOrphanedAttachments` sweep. Acceptable without additional work.

- Risk: Large images slow the feed for low-bandwidth players.
  - Impact: Poor UX for players on slow connections.
  - Mitigation: Thumbnail is CSS-constrained (max-height); full image only loads on enlarge click. Future: server-side resizing (out of scope).

## Open Questions

No unresolved ambiguity. All design decisions are confirmed:
- Two-step upload approach (confirmed, matches 7a implementation).
- Separate "Push Scene" button (confirmed, not a composer mode toggle).
- Simple Tailwind `<dialog>` for enlarge (confirmed, no library).
- Scene messages use existing `message` SSE event (confirmed).

## Non-Goals

- Server-side image resizing or thumbnail generation.
- Multi-image scenes or scene galleries.
- Scene "reveal" or staged reveal to players.
- Archiving or tagging scenes separately from campaign message history.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
