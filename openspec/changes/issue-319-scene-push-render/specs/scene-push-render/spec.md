## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Scene message creation via POST /messages

The system SHALL accept `kind: 'scene'` on `POST /api/campaigns/[id]/messages`, with optional `text` and optional `attachmentId`, and SHALL reject scene creation by non-DM members with 403.

#### Scenario: DM posts a scene message with image and caption

- **Given** an authenticated DM of campaign `C` with an `attachmentId` returned by a prior `/attachments` upload
- **When** the DM POSTs `{ kind: 'scene', attachmentId: '<id>', text: 'The tavern interior' }` to `/api/campaigns/C/messages`
- **Then** the response is 201 with the stored `CampaignMessage` containing `kind: 'scene'`, `attachmentId`, and `text`; and a `message` SSE event is emitted to all active members of `C`

#### Scenario: DM posts a scene message with image only (no caption)

- **Given** an authenticated DM of campaign `C` with a valid `attachmentId`
- **When** the DM POSTs `{ kind: 'scene', attachmentId: '<id>' }` with no `text` field
- **Then** the response is 201; the stored message has `kind: 'scene'`, `attachmentId`, and `text` is empty or absent; SSE event emitted

#### Scenario: DM posts a scene message with caption only (no image)

- **Given** an authenticated DM of campaign `C`
- **When** the DM POSTs `{ kind: 'scene', text: 'Read the description below...' }` with no `attachmentId`
- **Then** the response is 201; the stored message has `kind: 'scene'` and `text`; no `attachmentId`; SSE event emitted

#### Scenario: Non-DM member attempts to post a scene message

- **Given** an authenticated active player member (not DM) of campaign `C`
- **When** the player POSTs `{ kind: 'scene', text: 'Sneaky scene' }` to `/api/campaigns/C/messages`
- **Then** the response is 403

#### Scenario: Scene message with no text and no attachmentId rejected

- **Given** an authenticated DM of campaign `C`
- **When** the DM POSTs `{ kind: 'scene' }` with neither `text` nor `attachmentId`
- **Then** the response is 400 with an error indicating at least one of text or attachmentId is required

#### Scenario: Existing chat message POST behaviour unchanged

- **Given** an authenticated active member of campaign `C`
- **When** the member POSTs `{ text: 'Hello', visibility: { scope: 'group' } }` (no `kind` field)
- **Then** the response is 201 with a message where `kind` is absent or `'chat'`; existing validation (text required, non-empty) applies as before

---

### Requirement: ADDED Push Scene button in CampaignChat (DM only)

The system SHALL render a "Push Scene" button in the `CampaignChat` dock visible only to the DM, and SHALL NOT render it for non-DM members.

#### Scenario: DM sees Push Scene button

- **Given** `CampaignChat` is mounted with the current user identified as DM
- **When** the dock is expanded
- **Then** a "Push Scene" button is visible; the scene composer is not open

#### Scenario: Non-DM member does not see Push Scene button

- **Given** `CampaignChat` is mounted with the current user identified as a non-DM member
- **When** the dock is expanded
- **Then** no "Push Scene" button is rendered

---

### Requirement: ADDED SceneComposer — compose and submit a scene

The system SHALL provide a `SceneComposer` component that accepts a file, validates it client-side, and submits via two-step POST (attachments then messages).

#### Scenario: DM selects a valid image and submits

- **Given** `SceneComposer` is rendered and the DM selects a JPEG file ≤ 5 MB
- **When** the DM optionally enters a caption and clicks "Send"
- **Then** `POST /attachments` is called first; on success, `POST /messages` is called with `kind:'scene'`, `attachmentId`, and the caption; on success the composer closes and the new message appears in the feed

#### Scenario: DM selects an oversized file

- **Given** `SceneComposer` is rendered
- **When** the DM selects a file > 5 MB
- **Then** an inline error is shown before any network call is made; the Send button is disabled

#### Scenario: DM selects an unsupported file type

- **Given** `SceneComposer` is rendered
- **When** the DM selects a non-image file (e.g., PDF)
- **Then** an inline error is shown before any network call; Send button is disabled

#### Scenario: Upload step fails

- **Given** `SceneComposer` has a valid file selected
- **When** `POST /attachments` returns an error
- **Then** an error message is displayed; no `/messages` call is made; the composer remains open

#### Scenario: Message step fails after successful upload

- **Given** `SceneComposer` has uploaded an image and received `attachmentId`
- **When** `POST /messages` returns an error
- **Then** an error message is displayed; the composer remains open; the DM can retry

#### Scenario: DM cancels the composer

- **Given** `SceneComposer` is open
- **When** the DM clicks "Cancel"
- **Then** the composer closes with no network calls made

---

### Requirement: ADDED Scene message rendering in ChatFeed

The system SHALL render `CampaignMessage` entries with `kind: 'scene'` with a distinct visual style, including the image (if present) as a clickable thumbnail and caption text.

#### Scenario: Scene message with image and caption renders in feed

- **Given** `ChatFeed` contains a message with `kind: 'scene'`, `attachmentId: 'abc'`, and `text: 'The dungeon entrance'`
- **When** the feed renders
- **Then** an `<img>` with `src` pointing to `/api/campaigns/[id]/attachments/abc` is rendered within a visually distinct scene bubble; the caption text `'The dungeon entrance'` is shown below the image

#### Scenario: Scene message with image only renders without caption

- **Given** a scene message with `attachmentId` and no `text`
- **When** the feed renders
- **Then** the image renders; no caption element is shown

#### Scenario: Scene message with caption only renders without image

- **Given** a scene message with `text` and no `attachmentId`
- **When** the feed renders
- **Then** caption text renders in the scene bubble; no `<img>` element is present

#### Scenario: Regular chat messages are unaffected

- **Given** `ChatFeed` contains messages with no `kind` or `kind: 'chat'`
- **When** the feed renders
- **Then** those messages render using the existing chat bubble style, not the scene style

---

### Requirement: ADDED Enlargeable image overlay

The system SHALL allow any member to click a scene image thumbnail to open it fullscreen, and SHALL allow closing via Escape key or clicking outside the image.

#### Scenario: Clicking a scene image thumbnail opens fullscreen overlay

- **Given** a scene message with an image is rendered in the feed
- **When** the user clicks the thumbnail
- **Then** a fullscreen overlay opens displaying the full-size image via `showModal()` on the `<dialog>` element

#### Scenario: Pressing Escape closes the overlay

- **Given** the fullscreen overlay is open
- **When** the user presses the Escape key
- **Then** the dialog closes (native `<dialog>` Escape behavior)

#### Scenario: Clicking outside the image closes the overlay

- **Given** the fullscreen overlay is open
- **When** the user clicks the backdrop (outside the image)
- **Then** the dialog closes

## MODIFIED Requirements

### Requirement: MODIFIED POST /messages — text field

The system SHALL accept an empty or absent `text` when `kind === 'scene'`, while continuing to require non-empty `text` for `kind === 'chat'` or when `kind` is absent.

#### Scenario: Chat message with empty text still rejected

- **Given** a POST to `/messages` with `{ text: '', visibility: { scope: 'group' } }` (no `kind`)
- **When** the server processes the request
- **Then** the response is 400 (existing behaviour preserved)

## REMOVED Requirements

None. No existing requirements are removed by this change.

## Traceability

- Proposal: "Extend POST /messages" → Requirement: ADDED Scene message creation
- Proposal: "DM-only server gate" → Requirement: ADDED Scene message creation (non-DM 403 scenario)
- Proposal: "Push Scene button, separate from composer" → Requirement: ADDED Push Scene button
- Proposal: "Two-step submit, error handling" → Requirement: ADDED SceneComposer
- Proposal: "Scene rendering in ChatFeed" → Requirement: ADDED Scene message rendering
- Proposal: "Enlargeable image, Tailwind dialog" → Requirement: ADDED Enlargeable image overlay
- Design Decision 1 → MODIFIED POST /messages; ADDED Scene message creation
- Design Decision 2 → ADDED SceneComposer (upload step, message step)
- Design Decision 3 → ADDED SceneComposer; ADDED Scene message rendering
- Design Decision 4 → ADDED Enlargeable image overlay
- Design Decision 5 → ADDED Scene message creation (non-DM 403 scenario); ADDED Push Scene button (DM-only render)
- ADDED Scene message creation → tasks: T1 (extend route), T4 (unit tests), T5 (integration tests)
- ADDED Push Scene button → tasks: T2 (ScenePushButton in CampaignChat), T6 (component tests)
- ADDED SceneComposer → tasks: T3 (SceneComposer component), T6 (component tests)
- ADDED Scene message rendering → tasks: T3 (SceneFeedItem), T6 (component tests)
- ADDED Enlargeable image overlay → tasks: T3 (SceneFeedItem dialog), T6 (component tests)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Scene image does not block feed scroll

- **Given** a feed containing scene messages with large images
- **When** the feed renders
- **Then** each scene `<img>` has a CSS max-height constraint (≤ `max-h-48`) so oversized images are clamped in the feed view; the full image is deferred to the enlarge overlay

### Requirement: Security

See functional scenarios: "Non-DM member attempts to post a scene message" (403 on server), "DM sees Push Scene button / Non-DM member does not see Push Scene button" (client-side conditional render).

No additional security properties beyond those functional scenarios.

### Requirement: Reliability

#### Scenario: Image load failure in feed

- **Given** a scene message with `attachmentId` is rendered but the attachment endpoint returns a non-200 response
- **When** the `<img>` fails to load
- **Then** a broken-image placeholder or alt text is shown; caption (if any) remains visible; the rest of the feed is unaffected
