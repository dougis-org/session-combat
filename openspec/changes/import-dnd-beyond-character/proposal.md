## Why

Users can create and edit characters manually today, but there is no way to
import a public D&D Beyond character into the app. That creates duplicate data
entry for a workflow users already maintain elsewhere. Adding a guided import
flow reduces manual effort and makes character onboarding materially faster.

## Problem Space

The current character experience only supports manual CRUD through the
characters page and the authenticated `/api/characters` endpoints. Issue #39
adds a new ingestion path with two behavior constraints that do not exist in the
current system:

- Accept a user-supplied URL for a public D&D Beyond character and import that
  character into the authenticated user's character list.
- If a character with the same name already exists for that user, do not merge.
  The user must be able to abort the import or fully overwrite the existing
  character.

This change also needs clear failure behavior for invalid URLs, non-public
characters, fetch/parse failures, and incomplete source data.

## What Changes

- Add a D&D Beyond character import flow that accepts a public character URL.
- Add backend fetch, parsing, and normalization that maps imported data into the
  app's existing `Character` shape.
- Resolve the canonical public character URL to D&D Beyond's public
  character-service payload rather than scraping rendered browser HTML.
- Add duplicate-name detection scoped to the authenticated user's character
  list.
- Add an explicit conflict resolution step with only two outcomes: abort import
  or overwrite the existing same-name character.
- Coerce unsupported imported values to safe local defaults where possible and
  alert the user when any imported fields were normalized or downgraded.
- Add validation and user-facing error handling for unsupported URLs,
  inaccessible public characters, parse failures, and malformed imported data.
- Add automated test coverage for import success, duplicate-name overwrite,
  duplicate-name abort, and failure cases.

## Scope

In scope:

- Importing a single public D&D Beyond character from a canonical URL of the
  form `https://www.dndbeyond.com/characters/<characterId>/<shareCode>`
- Mapping imported data into the existing `Character` model used by storage and
  UI
- Overwriting an existing same-name character as a complete replacement while
  preserving the existing local character ID
- Alerting the user when unsupported imported values were replaced with safe
  defaults during normalization
- User feedback for import progress, conflicts, and failures
- API and UI tests covering the new workflow

Out of scope:

- Importing private or authenticated-only D&D Beyond characters
- Partial merges between imported and existing character records
- Ongoing sync with D&D Beyond after import
- Bulk imports or campaign-wide imports
- Supporting arbitrary third-party character sheet providers

## Non-Goals

- Reworking the existing manual character editor
- Expanding the `Character` domain model beyond fields required for a reliable
  import
- Solving every possible D&D Beyond page variant in the first iteration if the
  source data is unavailable or unstable

## Capabilities

### New Capabilities

- `dnd-beyond-character-import`: Import a public D&D Beyond character from a
  URL, normalize it into the app's `Character` model, detect same-name
  conflicts, and require the user to abort or overwrite on conflict.

### Modified Capabilities

- None.

## Impact

- **UI**: `app/characters/page.tsx` needs an import entry point, conflict
  handling, and import error/success states.
- **API**: character routes under `app/api/characters/` likely need a dedicated
  import endpoint or equivalent server-side import handling.
- **Domain mapping**: import normalization will touch `lib/types.ts` and likely
  introduce a D&D Beyond parsing/transform utility under `lib/`.
- **Storage behavior**: import must create a new character or replace an
  existing same-name record without merge semantics.
- **Tests**: unit tests for parsing/normalization and integration tests for API
  conflict behavior and end-to-end user flow.
- **Dependencies**: no additional parsing dependency is required if the public
  character-service payload remains available from the canonical character URL.

## Risks

- D&D Beyond may change or remove the public character-service endpoint used by
  the canonical character page.
- Public character pages may omit fields the local `Character` model expects,
  requiring defaults or lossy normalization.
- User-visible coercion warnings can add UI complexity, but hiding them would
  make imports harder to trust.
- Name-based overwrite is simple but can replace the wrong record if users keep
  multiple distinct versions under the same name.
- Remote fetches can fail or be slow, so timeout and error behavior must be
  explicit.

## Change Control

This proposal must be reviewed and explicitly approved by a human before design,
specs, tasks, or apply are treated as implementation authority. If scope changes
after approval, `proposal.md`, `design.md`, `specs/`, and `tasks.md` must be
updated before `/opsx:apply` proceeds.