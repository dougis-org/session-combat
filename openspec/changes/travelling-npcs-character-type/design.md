## Context

- Relevant architecture: `CreatureStats` base interface → `Character extends CreatureStats` → Mongoose `CharacterModel`. Party stores only `characterIds: string[]`; member type is carried on the character itself.
- Dependencies: #183 is self-contained. #195 (dashboard integration) depends on this change being shipped first.
- Interfaces/contracts touched:
  - `lib/types.ts` — `Character` interface, `CharacterInput` type
  - `lib/server/models/Character.ts` — Mongoose schema
  - `app/api/characters/route.ts` — GET filter, POST body
  - `app/api/characters/[id]/route.ts` — PUT body
  - `app/characters/page.tsx` — CharacterEditor, character list
  - `app/parties/page.tsx` — PartyEditor party member display

## Goals / Non-Goals

### Goals

- Introduce `characterType` enum on `Character` with no data migration required
- Expose `characterType` through the full CRUD API surface
- Group characters by type in characters and parties UIs
- Keep all NPCs and companions as full `CreatureStats` + `Character` objects

### Non-Goals

- Dashboard integration (deferred to #195)
- Sub-typing within `'companion'`
- Changes to `Monster`, `Party`, or encounter data models

## Decisions

### Decision 1: Field shape — enum string over boolean

- Chosen: `characterType: 'character' | 'npc' | 'companion'` (optional, Mongoose default `'character'`)
- Alternatives considered: `isNPC: boolean` (original issue proposal)
- Rationale: A boolean cannot represent companions; an enum is forward-compatible and makes every conditional branch explicit. TypeScript enforces exhaustiveness.
- Trade-offs: Slightly more verbose than a boolean; no meaningful downside given the type is a union of three well-known values.

### Decision 2: No Party model change

- Chosen: `Party.characterIds` stays as `string[]`; type grouping is derived at display time from `Character.characterType`
- Alternatives considered: Separate `npcIds` and `companionIds` arrays on `Party`
- Rationale: Storing IDs once avoids sync issues when a character's type is changed after being added to a party. Display logic is a `reduce` over party characters.
- Trade-offs: Every party-member render requires the character objects to be loaded (already the case in the current UI).

### Decision 3: API filter shape — `?characterType=<value>|all`

- Chosen: Single query param `?characterType=character|npc|companion|all`; omitting the param is equivalent to `all`
- Alternatives considered: Separate boolean params (`?isNPC=true`); multiple values via comma-list
- Rationale: Matches the enum exactly; `all` is an explicit escape hatch; single param is simplest to validate and document. Extendable if new types are added.
- Trade-offs: A caller cannot request "npc + companion" in one call without using `all`. Not needed now; can be addressed with a multi-value param later if required.

### Decision 4: Coerce missing field to `'character'` in API response

- Chosen: API serializer sets `characterType = document.characterType ?? 'character'` before returning
- Alternatives considered: Rely solely on Mongoose default
- Rationale: Documents saved before this change have no `characterType` field at the BSON level even after Mongoose applies defaults for new writes. Explicit coercion in the read path is a one-line defensive guard.
- Trade-offs: Minimal; this is idempotent and transparent.

### Decision 5: UI grouping — sections with hidden empty groups

- Chosen: Characters list and PartyEditor render one `<section>` per `characterType`; sections with no members are not rendered
- Alternatives considered: Always render all three sections; render a single flat list with type badges
- Rationale: Hiding empty sections keeps the UI clean for users who have no NPCs or companions. Badges alone (without grouping) don't give spatial separation that helps DMs scan a party at a glance.
- Trade-offs: Users don't see empty sections as affordance to add that type — acceptable because the editor's Type selector already surfaces all three options.

## Proposal to Design Mapping

- Proposal element: `characterType` field on `Character`
  - Design decision: Decision 1
  - Validation approach: Unit test — default is `'character'`; all three values are accepted; invalid value is rejected by Mongoose enum

- Proposal element: No migration for existing characters
  - Design decision: Decision 1 (Mongoose default) + Decision 4 (API coercion)
  - Validation approach: Integration test — fetch a pre-existing character doc; confirm response carries `characterType: 'character'`

- Proposal element: `Party.characterIds` unchanged
  - Design decision: Decision 2
  - Validation approach: Existing party regression tests continue to pass; no new schema migration

- Proposal element: `GET /api/characters?characterType=...` filter
  - Design decision: Decision 3
  - Validation approach: Integration tests — `?characterType=npc` returns only NPCs; `?characterType=all` and omitted param return all

- Proposal element: Characters list grouped by type
  - Design decision: Decision 5
  - Validation approach: Integration test — characters of each type appear in correct section; empty sections absent from DOM

- Proposal element: Parties UI split by type
  - Design decision: Decision 2 + Decision 5
  - Validation approach: Integration test — party with mixed types renders three sections; party with only PCs renders one section

## Functional Requirements Mapping

- Requirement: `characterType` persists through create and update
  - Design element: Mongoose schema field + API POST/PUT handlers
  - Acceptance criteria reference: specs/character-type/spec.md — CRUD persistence scenarios
  - Testability notes: Integration test POST → GET round-trip; PUT changes value → GET reflects new value

- Requirement: `GET /api/characters?characterType=npc` returns only NPCs
  - Design element: Decision 3 — query param filter in GET handler
  - Acceptance criteria reference: specs/character-type/spec.md — API filter scenarios
  - Testability notes: Seed DB with one of each type; assert response array length and `characterType` values

- Requirement: Characters list groups by type; empty sections hidden
  - Design element: Decision 5
  - Acceptance criteria reference: specs/character-type/spec.md — UI grouping scenarios
  - Testability notes: Integration test renders page with known fixture data; assert section headings present/absent

- Requirement: PartyEditor splits members by type; empty sections hidden
  - Design element: Decision 2 + Decision 5
  - Acceptance criteria reference: specs/character-type/spec.md — party split scenarios
  - Testability notes: Integration test with party containing mixed types

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Existing characters without `characterType` in DB must not break the UI
  - Design element: Decision 4 — API coercion
  - Acceptance criteria reference: specs/character-type/spec.md — backward-compat scenario
  - Testability notes: Integration test with a document that has no `characterType` field at the BSON level

- Requirement category: type safety
  - Requirement: New `characterType` values cannot be added without updating all consumers
  - Design element: Decision 1 — TypeScript literal union + Mongoose enum
  - Acceptance criteria reference: TypeScript compile-time enforcement (no runtime test needed)
  - Testability notes: `tsc --noEmit` in CI

## Risks / Trade-offs

- Risk/trade-off: Caller requests `?characterType=companion` but no companions exist — returns empty array
  - Impact: Callers must handle empty results gracefully
  - Mitigation: Already the norm for filtered list endpoints in this codebase

- Risk/trade-off: `all` is a magic string that must not appear in the Mongoose enum
  - Impact: Passing `all` to Mongoose would fail validation
  - Mitigation: API handler branches on `all` before constructing the Mongoose query; `all` never reaches the DB layer

## Rollback / Mitigation

- Rollback trigger: API errors on character create/update, or characters disappearing from UI after deploy
- Rollback steps: Revert the PR; no DB migration to undo (field addition is additive; Mongoose ignores unknown fields on read)
- Data migration considerations: None — rollback leaves `characterType` fields in place but code ignores them; no data loss
- Verification after rollback: Smoke-test character list and party list; confirm existing characters still appear

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check before requesting re-review.
- If security checks fail: Escalate to repo owner immediately; do not merge under any circumstance.
- If required reviews are blocked/stale: Ping reviewer after 48 h; escalate to repo owner after 72 h.
- Escalation path and timeout: Repo owner (@dougis) is final approver; no bypass of required checks.

## Open Questions

No open questions. All design decisions are resolved.
