## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-20-gridfs-attachment-upload-serve/design.md) document, not a replacement.

### Requirement: ADDED `MessageKind` type exported from `lib/types.ts`

The system SHALL export a `MessageKind` union type `'chat' | 'scene'` for use in `CampaignMessage` and future message kinds.

#### Scenario: TypeScript consumers can import MessageKind

- **Given** `lib/types.ts` exports `MessageKind`
- **When** a TypeScript file imports `MessageKind` from `@/lib/types`
- **Then** it compiles without error and the type constrains values to `'chat'` or `'scene'`

## MODIFIED Requirements

### Requirement: MODIFIED `CampaignMessage` interface — add optional `kind` and `attachmentId` fields

The system SHALL extend the `CampaignMessage` interface with `kind?: MessageKind` and `attachmentId?: string` as optional fields, preserving backward compatibility with all existing messages (where `kind` is undefined, implying `'chat'`).

#### Scenario: Existing messages without kind remain valid

- **Given** a `CampaignMessage` document in the database with no `kind` or `attachmentId` field
- **When** it is deserialized into a `CampaignMessage` TypeScript interface
- **Then** TypeScript compilation succeeds and `kind` is `undefined`

#### Scenario: Scene message with attachmentId is valid

- **Given** a `CampaignMessage` with `kind: 'scene'` and `attachmentId: '<hex-string>'`
- **When** it is assigned to a `CampaignMessage` variable
- **Then** TypeScript compilation succeeds without error

#### Scenario: All existing unit tests continue to pass

- **Given** the type extension is applied to `lib/types.ts`
- **When** `npm run test:unit` is run
- **Then** all tests pass (no regressions from the additive type change)

## REMOVED Requirements

None.

## Traceability

- Proposal element "returns an `attachmentId` usable as `CampaignMessage.attachmentId`" → Requirement: MODIFIED CampaignMessage
- Proposal element "Extend CampaignMessage with kind and attachmentId" → both requirements above
- Design decision (additive type change, no migration needed) → backward-compat scenarios
- Requirement → Task: T0 (lib/types.ts changes)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No database migration required

- **Given** the `kind` and `attachmentId` fields are optional on `CampaignMessage`
- **When** the change is deployed to production
- **Then** existing `campaignMessages` documents without these fields remain readable and functional without any migration script
