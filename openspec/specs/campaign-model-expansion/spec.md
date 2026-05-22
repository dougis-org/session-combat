## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED CampaignChapter type

The system SHALL define a `CampaignChapter` interface in `lib/types.ts` with fields: `id: string`, `title: string`, `order: number`, `description?: string`, `levelRange?: string`, `location?: string`.

#### Scenario: CampaignChapter is well-formed

- **Given** a chapter object is constructed
- **When** it has `id`, `title`, and `order` populated
- **Then** TypeScript accepts it as a valid `CampaignChapter` with optional fields omitted

#### Scenario: CampaignChapter with all fields

- **Given** a chapter object is constructed
- **When** all fields including `description`, `levelRange`, and `location` are provided
- **Then** TypeScript accepts all fields without type error

---

### Requirement: ADDED CampaignTemplate type

The system SHALL define a `CampaignTemplate` interface in `lib/types.ts` with fields: `id: string`, `userId: string`, `isGlobal: boolean`, `name: string`, `moduleName: string`, `description?: string`, `chapters: CampaignChapter[]`, `createdAt: Date`, `updatedAt: Date`.

#### Scenario: CampaignTemplate with chapters

- **Given** a `CampaignTemplate` is constructed with `userId: GLOBAL_USER_ID`, `isGlobal: true`, and a non-empty `chapters` array
- **When** TypeScript compiles
- **Then** no type errors are raised

#### Scenario: CampaignTemplate with empty chapter list

- **Given** a `CampaignTemplate` is constructed with `chapters: []`
- **When** TypeScript compiles
- **Then** no type errors are raised

---

### Requirement: ADDED chapters and currentChapterId to Campaign

The system SHALL add `chapters: CampaignChapter[]` (default `[]`) and `currentChapterId?: string` to the `Campaign` interface in `lib/types.ts`.

#### Scenario: Campaign with chapter list

- **Given** a Campaign is saved with `chapters` containing two entries and `currentChapterId` pointing to the first chapter's id
- **When** the campaign is retrieved from storage
- **Then** the returned object contains the full `chapters` array and the correct `currentChapterId`

#### Scenario: Campaign with no chapters

- **Given** a Campaign is saved with `chapters: []` and no `currentChapterId`
- **When** the campaign is retrieved from storage
- **Then** `chapters` is an empty array and `currentChapterId` is undefined

---

### Requirement: ADDED templateId to Campaign

The system SHALL add `templateId?: string` to the `Campaign` interface to record the source template when a campaign is created via copy.

#### Scenario: Campaign copied from template retains templateId

- **Given** a user copies a global template
- **When** the resulting Campaign document is fetched from storage
- **Then** `templateId` equals the source template's `id`

#### Scenario: Manually created campaign has no templateId

- **Given** a user creates a Campaign via the standard create flow (not a copy)
- **When** the resulting Campaign document is fetched from storage
- **Then** `templateId` is undefined

## MODIFIED Requirements

### Requirement: MODIFIED Campaign model removes legacy chapter fields

The system SHALL remove `currentChapter: string` and `currentChapterOrder: number` from the `Campaign` interface and all storage/API code.

#### Scenario: Campaign save no longer accepts legacy fields

- **Given** code attempts to set `currentChapter` or `currentChapterOrder` on a Campaign object
- **When** TypeScript compiles
- **Then** a type error is raised for each removed field

## REMOVED Requirements

### Requirement: REMOVED currentChapter and currentChapterOrder fields

Reason for removal: These fields tracked a single chapter as a freeform string and integer order. The richer `chapters[]` + `currentChapterId` model replaces them entirely. No real data exists in these fields so no migration is required.

## Traceability

- Proposal element "expand Campaign model" -> Requirements: ADDED chapters/currentChapterId, ADDED templateId, MODIFIED removes legacy fields
- Design decision 2 (remove currentChapter/currentChapterOrder) -> Requirement: MODIFIED Campaign model removes legacy fields
- Design decision 4 (chapter schema fields) -> Requirement: ADDED CampaignChapter type
- Requirement ADDED CampaignTemplate -> Task: Add types to lib/types.ts
- Requirement ADDED chapters/currentChapterId -> Task: Update Campaign type, storage, and API

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: No sensitive data in chapter fields

- **Given** a CampaignChapter or CampaignTemplate document
- **When** it is returned from a public GET endpoint
- **Then** all fields are campaign metadata only (title, description, etc.) — no PII or credentials are present

### Requirement: Reliability

#### Scenario: Legacy campaign documents without chapters field

- **Given** an existing Campaign document in MongoDB that predates this change (has no `chapters` field)
- **When** it is read by the application
- **Then** it is returned with `chapters` defaulting to `[]` and `currentChapterId` as undefined, without error
