# Phase 7 — Scene content (maps / images)

**Goal:** Let the DM push scene-setting content — maps, images, text — to the
group during a session. Scene content is modeled as a message (campaign-persistent)
with an optional image attachment stored in GridFS.

**Depends on:** Phase 5 (5b dock + feed). Scene messages reuse the `CampaignMessage`
model (`kind: 'scene'`).

## Deliverables (sub-issues)

### 7a. GridFS attachment upload/serve
- Endpoints to upload a scene image to **MongoDB GridFS** and stream it back by id,
  with access gated by `assertCampaignAccess`.
- Constraints: allowed image types, max size, basic validation; returns an
  `attachmentId` usable as `CampaignMessage.attachmentId`.
- **Acceptance:** an authorized DM can upload an image and any active member can
  fetch it; non-members cannot; oversized/invalid files rejected; bytes survive a
  Fly machine restart (persisted in Mongo, not local disk).

### 7b. DM "push scene" + render
- DM action in `CampaignChat` (or campaign view) to push a `scene` message
  (text and/or image) to the group; renders inline in the feed with an enlargeable
  image.
- **Depends on:** 5b, 7a.
- **Acceptance:** DM pushes a map/image/text and connected members see it live;
  scene content remains in campaign history; image renders and can be enlarged.

## Future (out of scope, design stays open for)
- Additional message kinds (handouts, links, audio cues).
- Additional shared-item types beyond rolls.
- Per-scene visibility (reveal to a subset of players).
- Read receipts / typing indicators.
