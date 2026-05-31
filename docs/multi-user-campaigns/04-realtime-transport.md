# Phase 4 — Real-time transport

**Goal:** Stand up the real-time pipe — a per-campaign SSE stream backed by MongoDB
Change Streams (prod/Atlas) with a polling fallback (local dev) — plus the client
hook and the collapsible chat dock shell. **No product features yet**, just the
plumbing everything else plugs into.

**Depends on:** Phase 1 (1e access). Items 4a/4b/4c can largely proceed in parallel.

> **Tracking:** epic [#296](https://github.com/dougis-org/session-combat/issues/296).

## Component layout

```mermaid
flowchart TB
    subgraph Browser
        Dock["CampaignChat dock (4c)"]
        Hook["useCampaignStream (4b)"]
        ES["EventSource"]
        Dock --> Hook --> ES
    end
    subgraph Server["Next.js (Fly.io)"]
        SSE["GET /campaigns/:id/stream (4a)"]
        AUTH["assertCampaignAccess (1e)"]
        TA["Transport abstraction<br/>subscribe(campaignId, onEvent)"]
        SSE --> AUTH
        SSE --> TA
    end
    subgraph Mongo["MongoDB"]
        CS["Change Streams (Atlas)"]
        POLL["since-timestamp poll (local dev)"]
    end
    ES -- "HTTP text/event-stream" --> SSE
    TA -->|prod| CS
    TA -->|fallback| POLL
```

## Transport selection (4a)

The same `subscribe()` interface picks its source at runtime so clients never change:

```mermaid
flowchart TD
    start(["subscribe(campaignId)"]) --> q{"Mongo is a<br/>replica set?"}
    q -->|yes · Atlas| cs["watch() change stream<br/>filtered to campaignId"]
    q -->|no · standalone dev| poll["poll collections since<br/>last-seen timestamp"]
    cs --> emit["emit typed campaign events"]
    poll --> emit
    emit --> sse["write SSE frames + heartbeat"]
    sse --> close{"client<br/>disconnected?"}
    close -->|no| emit
    close -->|yes| teardown["close cursor / stop poll"]
```

## Deliverables (sub-issues)

### 4a. SSE stream endpoint + transport abstraction · [#311](https://github.com/dougis-org/session-combat/issues/311)
- `GET /api/campaigns/[id]/stream` returning a `text/event-stream` `ReadableStream`;
  caller must pass `assertCampaignAccess`.
- Transport abstraction in `lib/server/` (or `lib/api/`): a `subscribe(campaignId,
  onEvent)` that uses **MongoDB Change Streams** when available (Atlas) and a
  **`since`-timestamp DB poll** otherwise. Emits typed events scoped to the campaign.
- **Multiplex one stream per campaign (not per connection):** keep an in-process
  subscriber registry so each server instance opens **one** change stream per active
  campaign (or a single collection-wide stream) and fans events out to all that
  campaign's SSE connections. Opening a cursor per connection scales linearly with
  connected users and exhausts Atlas connection / change-stream limits.
  Reference-count subscribers and close the stream when a campaign's last connection
  drops.
- Heartbeat/keepalive comments; clean teardown on disconnect; respects Fly's
  request lifecycle.
- **Depends on:** 1e.
- **Acceptance:** an authorized member receives events for their campaign and
  nothing for campaigns they're not in; multiple connections to one campaign share a
  single change stream; works against Atlas (change streams) and a standalone Mongo
  (polling); connections close cleanly and the shared stream closes when the last
  one drops.

### 4b. Client `useCampaignStream` hook · [#312](https://github.com/dougis-org/session-combat/issues/312)
- React hook in `lib/hooks/` wrapping `EventSource` with auto-reconnect/backoff,
  connection state, and typed event dispatch.
- **Acceptance:** components can subscribe to a campaign and receive typed events;
  reconnects after transient drops; tears down on unmount.

### 4c. Collapsible / pinnable chat dock shell · [#313](https://github.com/dougis-org/session-combat/issues/313)
- `CampaignChat` component in `lib/components/`: fixed dock that toggles
  collapsed pill ↔ expanded drawer, with a **pin-open** control persisted to
  `localStorage`. No data wiring yet — layout, states, and a11y only.
- Follows Tailwind semantic tokens (`--color-party`, etc.) and existing component
  patterns.
- **Acceptance:** dock collapses/expands, pin state survives reload, doesn't
  obstruct the page when collapsed, keyboard-accessible.
