# Phase 4 — Real-time transport

**Goal:** Stand up the real-time pipe — a per-campaign SSE stream backed by MongoDB
Change Streams (prod/Atlas) with a polling fallback (local dev) — plus the client
hook and the collapsible chat dock shell. **No product features yet**, just the
plumbing everything else plugs into.

**Depends on:** Phase 1 (1e access). ✅ Phase 1 complete. Items 4a/4b/4c can largely proceed in parallel.

> **Tracking:** epic [#296](https://github.com/dougis-org/session-combat/issues/296) — OPEN
> **Status:** Not started. 4b and 4c have no upstream dependencies beyond Phase 1 and can begin immediately.

## Component layout

Each server instance is independent (Fly.io can run more than one machine
concurrently), so the transport has two delivery paths that run side by side:

- **Same-instance fast path:** the route handler that processed a write
  (`messages`, `rolls`, `sessions/active`) calls `emitFiltered()` synchronously,
  reaching same-instance subscribers with near-zero latency.
- **Cross-instance-safe path:** a single **database-level** change stream (or,
  on standalone Mongo, a since-timestamp poll) per instance independently
  observes writes to `campaigns`, `campaignMessages`, and `campaignRolls` —
  regardless of which instance made the write — and re-delivers the
  corresponding event to that instance's own subscribers.

Because a write can be observed via both paths, the client (`CampaignChat`'s
`seenIds`-keyed dedup) drops the second, redundant delivery by id. `session`
events are derived from `activeSessionId` field-level changes on `campaigns`
documents rather than being their own collection, and are idempotent to
re-apply.

```mermaid
flowchart TB
    subgraph Browser
        Dock["CampaignChat dock (4c)"]
        Hook["useCampaignStream (4b)"]
        ES["EventSource"]
        Dock --> Hook --> ES
    end
    subgraph Server["Next.js instance (Fly.io)"]
        ROUTE["messages/rolls/sessions route handlers"]
        SSE["GET /api/campaigns/[id]/stream (4a)"]
        AUTH["assertCampaignAccess (1e)"]
        REG["Subscriber registry<br/>(demux by campaignId + collection)"]
        TA["Transport abstraction<br/>subscribe(campaignId, userId, onEvent)"]
        ROUTE -->|"fast path: emitFiltered()"| REG
        SSE --> AUTH
        SSE --> TA
        TA --> REG
    end
    subgraph Mongo["MongoDB"]
        CS["ONE shared db-level watch()<br/>per instance (Atlas) — campaigns,<br/>campaignMessages, campaignRolls"]
        POLL["since-timestamp poll of all three<br/>collections (local dev)"]
        SESS["activeSessionId field-diff<br/>→ derived 'session' event"]
    end
    ES -- "HTTP text/event-stream" --> SSE
    REG -->|prod · single cursor| CS
    REG -->|fallback| POLL
    CS -. "change/message/roll events<br/>demux'd by ns.coll + campaignId,<br/>visibility-filtered per subscriber" .-> REG
    CS --> SESS
    POLL --> SESS
    SESS -. "cross-instance-safe path<br/>(dedup'd client-side against<br/>the fast path above)" .-> REG
```

## Transport selection (4a)

The same `subscribe()` interface picks its source at runtime so clients never change:

```mermaid
flowchart TD
    start(["subscribe(campaignId, userId)"]) --> q{"Mongo is a<br/>replica set?"}
    q -->|yes · Atlas| cs["one shared db.watch() per instance<br/>(campaigns + campaignMessages +<br/>campaignRolls) → demux by ns.coll + campaignId"]
    q -->|no · standalone dev| poll["poll all three collections since<br/>last-seen timestamp, per subscription"]
    cs --> sess{"activeSessionId<br/>changed?"}
    poll --> sess
    sess -->|yes| sessEvt["emit derived 'session' event"]
    sess -->|no| vis
    sessEvt --> vis{"message/roll?"}
    vis -->|yes| filt["canSeeMessage / canSeeRoll<br/>per subscriber"]
    vis -->|no · change| emit
    filt --> emit["emit typed campaign event"]
    emit --> sse["write SSE frames + heartbeat"]
    sse --> close{"client<br/>disconnected?"}
    close -->|no| emit
    close -->|yes| teardown["close cursor / stop poll;<br/>drop per-campaign session state<br/>if last subscriber"]
```

Route handlers (`messages`, `rolls`, `sessions/active`) additionally call
`emitFiltered()` synchronously right after their write, as a same-instance
fast path that runs independently of (and faster than) the diagram above.
The client dedups by event id so a same-instance subscriber that receives
both the fast-path delivery and the later Mongo-observed delivery only
renders the item once.

## Deliverables (sub-issues)

### 🟡 4a. SSE stream endpoint + transport abstraction · [#311](https://github.com/dougis-org/session-combat/issues/311) — OPEN
- `GET /api/campaigns/[id]/stream` returning a `text/event-stream` `ReadableStream`;
  caller must pass `assertCampaignAccess`.
- Transport abstraction in `lib/server/` (or `lib/api/`): a `subscribe(campaignId,
  onEvent)` that uses **MongoDB Change Streams** when available (Atlas) and a
  **`since`-timestamp DB poll** otherwise. Emits typed events scoped to the campaign.
- **One shared change stream per process (multiplex across campaigns *and*
  connections):** each server instance opens a **single** change stream over the
  relevant collections — **not** filtered by campaign — and demultiplexes events to
  per-campaign subscriber sets in-process via a registry keyed by `campaignId`.
  Never one cursor per connection *or* per campaign; both scale with load and
  exhaust Atlas connection / change-stream limits. Keep the count of streams to
  Mongo as low as possible (ideally one per instance). The shared stream opens lazily
  on the first SSE connection and closes when the instance's last connection drops.
- Heartbeat/keepalive comments; clean teardown on disconnect; respects Fly's
  request lifecycle.
- **Depends on:** 1e.
- **Acceptance:** an authorized member receives events for their campaign and
  nothing for campaigns they're not in; connections across **multiple** campaigns on
  one instance share a **single** change stream (verified by cursor count); works
  against Atlas (change streams) and a standalone Mongo (polling); connections close
  cleanly and the shared stream closes when the instance's last connection drops.

### 🟡 4b. Client `useCampaignStream` hook · [#312](https://github.com/dougis-org/session-combat/issues/312) — OPEN
- React hook in `lib/hooks/` wrapping `EventSource` with auto-reconnect/backoff,
  connection state, and typed event dispatch.
- **Acceptance:** components can subscribe to a campaign and receive typed events;
  reconnects after transient drops; tears down on unmount.

### 🟡 4c. Collapsible / pinnable chat dock shell · [#313](https://github.com/dougis-org/session-combat/issues/313) — OPEN
- `CampaignChat` component in `lib/components/`: fixed dock that toggles
  collapsed pill ↔ expanded drawer, with a **pin-open** control persisted to
  `localStorage`. No data wiring yet — layout, states, and a11y only.
- Follows Tailwind semantic tokens (`--color-party`, etc.) and existing component
  patterns.
- **Acceptance:** dock collapses/expands, pin state survives reload, doesn't
  obstruct the page when collapsed, keyboard-accessible.
