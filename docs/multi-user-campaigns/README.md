# Multi-User Campaigns

> Status: **Planning** · Owner: DM (campaign owner) · Last updated: 2026-05-31

This initiative turns campaigns from a single-owner artifact into a shared space
where a DM (the campaign owner) invites a group of players who participate during
sessions. It is intentionally built foundations-first as small, independently
deliverable pieces so work can proceed in parallel and the design can keep growing
over time.

## Goals

The group of users attached to a campaign serves these purposes:

1. **Parties from real players** — the DM can pull players' characters into the
   parties they build.
2. **Scene-setting** — the DM can push information to the group during a session
   (maps, images, text) to set the scene.
3. **Shared rolls** — players can share dice rolls (and similar) with either the
   DM directly or the whole group (e.g. a saving throw that only the DM sees).
4. **Group & direct messaging** — members can message each other or the entire
   group.
5. **Always-available chat UI** — a collapsible messaging panel that can be pinned
   open, so it doesn't permanently consume screen space.

This is **not** a complete requirements set. The data model and APIs are designed
to expand (new message kinds, new visibility scopes, new shared item types) without
reshaping the foundations.

## Architecture decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Real-time transport | **Server-Sent Events (SSE)** from a per-campaign stream endpoint; client→server stays plain `POST` | Next.js App Router supports streaming responses with no custom server; broadcast-shaped feature set; works behind Fly's HTTPS proxy; zero new infra/cost |
| Real-time backplane | **MongoDB Change Streams** with a **DB-polling fallback** behind a transport abstraction | We already run MongoDB; change streams cost nothing and work across machines. Polling fallback keeps standalone/dev Mongo and non-replica-set deploys working |
| Fly scale-to-zero | No special handling | Open SSE connections keep the machine warm during a session; idle = nobody connected = nothing to deliver |
| Scene/image storage | **MongoDB GridFS** | No binary store exists today; GridFS needs no S3/bucket, survives Fly's ephemeral disk, stays zero-cost |
| Membership | **Invite + accept**; players own their own characters and **opt them in** per campaign | Consent-based; players maintain their own sheets |
| Owner role | The existing `campaign.userId` owner is treated as the **DM** | No migration of ownership; layer membership on top |
| Message persistence | **Persistent, campaign-scoped** (scene content/images are messages, so also campaign-scoped) | History / recap; scene assets stay available across sessions |
| Roll persistence | **Session-scoped** (tied to existing `sessionLogs`) | Rolls belong to the session they happened in |

## Resolved decisions

- **Production MongoDB is Atlas** (a replica set), so **Change Streams are
  available at no extra cost** — the SSE backplane uses them directly in prod. The
  DB-polling fallback is retained only for standalone/local-dev Mongo (which is not
  a replica set), kept behind the Phase 4 transport abstraction so it stays a config
  detail.

## Real-time data flow

How a live update reaches members, end to end. Client→server is a normal `POST`;
server→clients is the SSE push driven by the MongoDB change stream (Atlas) or the
polling fallback (local dev).

```mermaid
sequenceDiagram
    autonumber
    participant P as Player (browser)
    participant DM as DM (browser)
    participant API as Next.js route<br/>POST /messages
    participant DB as MongoDB (Atlas)
    participant ST as SSE stream<br/>GET /campaigns/:id/stream

    Note over DM,ST: On campaign open, each member's<br/>EventSource connects (after assertCampaignAccess)
    DM->>ST: open EventSource
    P->>ST: open EventSource

    P->>API: POST message { body, visibility }
    API->>API: assertCampaignAccess(campaignId, userId)
    API->>DB: insert campaignMessages doc
    API-->>P: 201 Created
    DB-->>ST: change stream event (insert)
    ST->>ST: filter by campaignId + visibility
    ST-->>DM: SSE: message event
    ST-->>P: SSE: message event (echo)
    Note right of ST: dm-only / direct messages are<br/>only pushed to the allowed recipients
```

> Local dev (standalone Mongo, no replica set) swaps the change-stream feed for a
> `since`-timestamp DB poll behind the same transport interface — clients are
> unaffected. See [Phase 4](./04-realtime-transport.md).

## Data model (target shapes)

New/changed types in `lib/types.ts` and new MongoDB collections (indexes follow the
existing `lib/db.ts` pattern):

- `User.username?: string` — unique, searchable handle (sparse unique index; backfilled).
- `CampaignMember` — `{ campaignId, userId, role: 'dm'|'player', status: 'invited'|'active'|'declined'|'removed', invitedBy, invitedAt, respondedAt? }`. Unique `{campaignId,userId}`.
- `CampaignCharacterShare` — `{ campaignId, userId, characterId, sharedAt }`. Unique `{campaignId,characterId}`. Player opt-in of a character into a campaign.
- `CampaignMessage` — `{ campaignId, senderId, kind: 'text'|'scene', visibility: {scope:'group'|'direct'|'dm-only', toUserId?}, body?, attachmentId? }`. Index `{campaignId,createdAt}`. Persistent.
- `CampaignRoll` — `{ campaignId, sessionId, rollerId, label?, formula, rolls[], total, visibility: {scope:'group'|'dm-only'|'direct', toUserId?} }`. Index `{campaignId,sessionId,createdAt}`. Session-scoped.
- `Campaign.activeSessionId?: string` — **NEW**: the session currently open for live play (set when the DM starts a session, cleared when it ends). Phase 6 rolls are scoped to it; with no active session, roll submission is rejected rather than silently dropped.

The relationships between the existing entities (grey-ish: `User`, `Campaign`,
`Character`, `Party`, `SessionLog`) and the new ones introduced by this initiative:

```mermaid
erDiagram
    User ||--o{ Campaign : "owns (DM)"
    User ||--o{ Character : owns
    User ||--o{ CampaignMember : "is"
    Campaign ||--o{ CampaignMember : has
    Campaign ||--o{ Party : has
    Campaign ||--o{ SessionLog : has
    Campaign ||--o{ CampaignCharacterShare : has
    Character ||--o{ CampaignCharacterShare : "shared via"
    Party }o--o{ Character : includes
    Campaign ||--o{ CampaignMessage : has
    User ||--o{ CampaignMessage : sends
    CampaignMessage |o--o| SceneAttachment : "may attach (GridFS)"
    Campaign ||--o{ CampaignRoll : has
    SessionLog ||--o{ CampaignRoll : scopes
    User ||--o{ CampaignRoll : rolls

    User {
        string id
        string email
        string username "NEW: unique, searchable"
    }
    Campaign {
        string id
        string userId "owner = DM"
        string activeSessionId "NEW: open session, scopes rolls"
    }
    CampaignMember {
        string campaignId
        string userId
        enum role "dm | player"
        enum status "invited|active|declined|removed"
    }
    CampaignCharacterShare {
        string campaignId
        string characterId
        string userId "owner who opted in"
    }
    CampaignMessage {
        string campaignId
        string senderId
        enum kind "text | scene"
        json visibility "group|direct|dm-only"
        string attachmentId "GridFS id, scene only"
    }
    CampaignRoll {
        string campaignId
        string sessionId "session-scoped"
        string rollerId
        json visibility "group|dm-only|direct"
    }
    SceneAttachment {
        string id "GridFS file id"
        string contentType
    }
```

## Access-control change (the spine)

Campaign reads are currently `{ userId, id }` (single owner). This becomes
**"requester is the DM *or* an active member"** via a new
`assertCampaignAccess(campaignId, userId)` helper in `lib/utils/campaign.ts` that
returns the member's role. Party building gains a rule: the DM may add a
`characterId` to a party only if that character is shared into the campaign by an
active member. Phase 1e ([#304](https://github.com/dougis-org/session-combat/issues/304))
delivers this refactor; most later phases depend on it.

## Phase roadmap

Each phase is an epic (parent issue). Each deliverable is a sub-issue that can ship
on its own. `→` marks hard dependencies; everything else can run in parallel.

| Phase | Theme | Epic | Sub-issues | Depends on |
|-------|-------|------|------------|------------|
| 1 | Identity & membership foundations | [#293](https://github.com/dougis-org/session-combat/issues/293) | [1a #300](https://github.com/dougis-org/session-combat/issues/300) · [1b #301](https://github.com/dougis-org/session-combat/issues/301) · [1c #302](https://github.com/dougis-org/session-combat/issues/302) · [1d #303](https://github.com/dougis-org/session-combat/issues/303) · [1e #304](https://github.com/dougis-org/session-combat/issues/304) | — |
| 2 | Invite & accept flow | [#294](https://github.com/dougis-org/session-combat/issues/294) | [2a #305](https://github.com/dougis-org/session-combat/issues/305) · [2b #306](https://github.com/dougis-org/session-combat/issues/306) · [2c #307](https://github.com/dougis-org/session-combat/issues/307) · [2d #308](https://github.com/dougis-org/session-combat/issues/308) | Phase 1 |
| 3 | Cross-user characters into parties | [#295](https://github.com/dougis-org/session-combat/issues/295) | [3a #309](https://github.com/dougis-org/session-combat/issues/309) · [3b #310](https://github.com/dougis-org/session-combat/issues/310) | Phase 1 |
| 4 | Real-time transport | [#296](https://github.com/dougis-org/session-combat/issues/296) | [4a #311](https://github.com/dougis-org/session-combat/issues/311) · [4b #312](https://github.com/dougis-org/session-combat/issues/312) · [4c #313](https://github.com/dougis-org/session-combat/issues/313) | Phase 1 |
| 5 | Messaging | [#297](https://github.com/dougis-org/session-combat/issues/297) | [5a #314](https://github.com/dougis-org/session-combat/issues/314) · [5b #315](https://github.com/dougis-org/session-combat/issues/315) | Phase 4 |
| 6 | Shared dice rolls (session-scoped) | [#298](https://github.com/dougis-org/session-combat/issues/298) | [6a #316](https://github.com/dougis-org/session-combat/issues/316) · [6b #317](https://github.com/dougis-org/session-combat/issues/317) | Phase 5 |
| 7 | Scene content (maps/images) | [#299](https://github.com/dougis-org/session-combat/issues/299) | [7a #318](https://github.com/dougis-org/session-combat/issues/318) · [7b #319](https://github.com/dougis-org/session-combat/issues/319) | Phase 5 |

### Dependency graph

Arrows are hard dependencies (a node can't start until its predecessors merge).
Nodes with no inbound arrow at the same level can be built in parallel — e.g. the
Phase 1 identity track (1a→1b, 1a→1c) runs alongside the membership track
(1d→1e), and the Phase 4 dock shell (4c) and hook (4b) need nothing upstream.

```mermaid
flowchart LR
    subgraph P1["Phase 1 · Identity & membership"]
        direction TB
        n1a["1a username model"]
        n1b["1b username set/edit"]
        n1c["1c user search"]
        n1d["1d campaignMembers"]
        n1e["1e assertCampaignAccess"]
        n1a --> n1b
        n1a --> n1c
        n1d --> n1e
    end
    subgraph P2["Phase 2 · Invite & accept"]
        n2a["2a invite API"]
        n2b["2b accept/decline + inbox"]
        n2c["2c member mgmt UI"]
        n2d["2d invitations inbox UI"]
        n2a --> n2c
        n2b --> n2d
    end
    subgraph P3["Phase 3 · Cross-user characters"]
        n3a["3a character sharing"]
        n3b["3b party builder"]
        n3a --> n3b
    end
    subgraph P4["Phase 4 · Real-time transport"]
        n4a["4a SSE + transport"]
        n4b["4b useCampaignStream"]
        n4c["4c chat dock shell"]
    end
    subgraph P5["Phase 5 · Messaging"]
        n5a["5a messages API"]
        n5b["5b wire dock"]
    end
    subgraph P6["Phase 6 · Shared rolls"]
        n6a["6a rolls API"]
        n6b["6b roll UI"]
    end
    subgraph P7["Phase 7 · Scene content"]
        n7a["7a GridFS"]
        n7b["7b push scene"]
    end

    n1c --> n2a
    n1d --> n2a
    n1e --> n2a
    n1d --> n2b
    n1e --> n3a
    n1e --> n4a
    n3a --> n3b
    n1e --> n5a
    n4b --> n5b
    n4c --> n5b
    n5a --> n5b
    n1e --> n6a
    n5b --> n6b
    n6a --> n6b
    n5b --> n7b
    n7a --> n7b
```

### Build order & parallelism (waves)

The dependency graph above shows *what blocks what*; this view shows *when each
sub-issue can start* and *what runs concurrently*. A "wave" is the earliest point a
sub-issue can begin assuming unlimited parallel hands (each bar ≈ one deliverable;
bars in the same column run in parallel). Exact edges remain authoritative in the
dependency graph — the waves are the schedule those edges imply.

```mermaid
gantt
    title Earliest-start schedule (overlap = can be built in parallel)
    dateFormat YYYY-MM-DD
    axisFormat W%d

    section Phase 1 · Identity & membership
    1a username model          :done1a, 2026-01-01, 1d
    1d campaignMembers         :done1d, 2026-01-01, 1d
    1b username set/edit       :after done1a, 1d
    1c user search             :done1c, after done1a, 1d
    1e assertCampaignAccess    :done1e, after done1d, 1d

    section Phase 2 · Invite & accept
    2b accept/decline + inbox  :done2b, after done1d, 1d
    2a invite API              :done2a, after done1c done1e, 1d
    2c member mgmt UI          :after done2a, 1d
    2d invitations inbox UI    :after done2b, 1d

    section Phase 3 · Cross-user characters
    3a character sharing       :done3a, after done1e, 1d
    3b party builder           :after done3a, 1d

    section Phase 4 · Real-time transport
    4b useCampaignStream       :done4b, 2026-01-01, 1d
    4c chat dock shell         :done4c, 2026-01-01, 1d
    4a SSE + transport         :done4a, after done1e, 1d

    section Phase 5 · Messaging
    5a messages API            :done5a, after done1e, 1d
    5b wire dock               :done5b, after done4b done4c done5a, 1d

    section Phase 6 · Shared rolls
    6a rolls API               :done6a, after done1e, 1d
    6b roll UI                 :after done5b done6a, 1d

    section Phase 7 · Scene content
    7a GridFS upload/serve     :done7a, 2026-01-01, 1d
    7b push scene              :after done5b done7a, 1d
```

| Wave | Can start | Notes |
|------|-----------|-------|
| 1 | **1a, 1d, 4b, 4c, 7a** | All dependency-free — the UI shell (4c), stream hook (4b), and GridFS (7a) need nothing upstream, so they parallelize the Phase 1 foundations |
| 2 | **1b, 1c, 1e, 2b** | `1e` (access spine) unlocks most of the rest; `2b` only needs `1d` |
| 3 | **2a, 2d, 3a, 4a, 5a, 6a** | Widest fan-out — six independent tracks once `1e` lands |
| 4 | **2c, 3b, 5b** | `5b` is the integration point (needs `4b` + `4c` + `5a`) |
| 5 | **6b, 7b** | Feature UIs that sit on top of messaging (`5b`) |

See the per-phase docs for deliverables, acceptance criteria, and affected files:

- [Phase 1 — Identity & membership](./01-identity-and-membership.md)
- [Phase 2 — Invite & accept](./02-invite-and-accept.md)
- [Phase 3 — Cross-user characters](./03-cross-user-characters.md)
- [Phase 4 — Real-time transport](./04-realtime-transport.md)
- [Phase 5 — Messaging](./05-messaging.md)
- [Phase 6 — Shared dice rolls](./06-shared-rolls.md)
- [Phase 7 — Scene content](./07-scene-content.md)

## How we work

- This folder is the human-readable source of truth for approach and progress.
- GitHub issues track delivery: 7 phase epics, each with fine-grained sub-issues.
- An **OpenSpec change** (`openspec/changes/…`) is opened **per issue, as we pick it
  up**, following the existing proposal → tasks → specs convention.
