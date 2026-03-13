## Context

The application currently supports authenticated character CRUD through
`app/characters/page.tsx`, `app/api/characters/route.ts`, and
`app/api/characters/[id]/route.ts`. Characters are stored in the existing
`Character` model defined in `lib/types.ts`, with validation centered around the
local app's enums and required combat fields.

Issue #39 adds a new ingestion path: import a public D&D Beyond character by
URL. This is cross-cutting because it affects UI, API, remote fetch/parsing,
domain normalization, duplicate resolution, and test coverage. The source is a
third-party website outside our control, so the design must contain explicit
constraints around parsing reliability, validation, and failure handling.

The initial supported URL shape is the canonical public character format,
`https://www.dndbeyond.com/characters/<characterId>/<shareCode>`, as in the
example provided by the requester. During implementation, we verified that this
canonical page resolves to a public D&D Beyond character-service JSON endpoint,
which is more stable and testable than scraping rendered HTML.

### Proposal To Design Mapping

- Public URL import flow → D1, D2, D5
- Normalize imported data into `Character` → D2, D3
- Same-name abort-or-overwrite behavior → D4
- Clear validation and failure behavior → D3, D5
- Automated coverage for success and failure paths → D6

## Goals / Non-Goals

**Goals:**

- Accept a supported public D&D Beyond character URL from the characters UI
- Fetch and parse the character server-side
- Normalize imported data into a valid local `Character` payload
- Detect existing same-name characters for the authenticated user
- Require an explicit user choice to abort or overwrite when a duplicate name is
  found
- Keep the import flow testable with unit, integration, and UI coverage

**Non-Goals:**

- Authenticated scraping of private D&D Beyond characters
- Ongoing sync between local characters and D&D Beyond
- Partial merges between imported and existing records
- General-purpose third-party import framework

## Decisions

### D1: Add a dedicated server-side import endpoint

Add a dedicated authenticated endpoint under `app/api/characters/import/route.ts`
instead of overloading the existing POST create route.

Rationale:

- Import has different inputs and failure modes than local character creation.
- Server-side fetch avoids browser CORS and keeps remote parsing logic out of the
  client bundle.
- A dedicated route provides a stable contract for duplicate detection and
  conflict resolution.

Alternative considered:

- Extend `POST /api/characters` with an `{ importUrl }` mode. Rejected because it
  weakens input validation and mixes two distinct workflows behind one endpoint.

Testability notes:

- Integration tests can exercise the import route independently of manual create.
- Remote fetch can be mocked at the network boundary while still validating the
  route's auth, conflict, and persistence behavior.

### D2: Split import into fetch, parse, and normalize stages

Implement the import pipeline as separable functions under `lib/`, for example:

- `fetchDndBeyondCharacter(url)`
- `parseDndBeyondCharacterDocument(source)`
- `normalizeImportedCharacter(parsed)`

Implementation constraint:

- `fetchDndBeyondCharacter(url)` validates the canonical public character URL,
  extracts the character ID, and fetches the public character-service payload.
- `parseDndBeyondCharacterDocument(source)` becomes payload normalization logic
  over the public character-service response rather than rendered HTML scraping.

Rationale:

- The upstream integration remains brittle because it depends on a third-party
  service contract, even though the JSON payload is more stable than rendered
  page HTML.
- Separating normalization from parsing keeps the local `Character` contract
  explicit and unit-testable.
- This makes it easier to swap parsing strategies later if D&D Beyond exposes a
  more stable public data source.

Alternative considered:

- Implement one monolithic import function. Rejected because it obscures which
  failures come from network access, parsing, or local validation.

Testability notes:

- Parser and normalizer tests can use stored character-service JSON fixtures.
- Normalizer tests can assert defaulting and enum coercion behavior without any
  HTTP dependency.

### D3: Normalize into the existing `Character` model with explicit defaults

The importer must output a valid local `Character` shape before persistence.
Missing optional source data is defaulted; missing required local data causes an
import failure.

Expected normalization behavior:

- Preserve imported `name` as the local identity key for duplicate detection.
- Map classes into existing `CharacterClass[]` entries.
- Coerce unsupported race/class/alignment values to safe local defaults where a
  valid fallback exists, and collect user-visible normalization warnings.
- Default required combat fields if the source omits them and safe defaults are
  acceptable.

Normalization output must include both the local `Character` payload and a list
of warnings describing any coerced, dropped, or defaulted fields that the UI
should surface after import.

Alternative considered:

- Loosen the local `Character` model to accept partial imports. Rejected because
  it would spread nullable handling across the UI and combat flows.

Testability notes:

- Unit tests must cover valid mapping, safe defaults, coercion warnings, and
  invalid-source rejection.

### D4: Duplicate resolution is explicit and name-based

Before persistence, the import route loads the authenticated user's existing
characters and checks for a case-insensitive name match. If no match exists, the
route creates a new character. If a match exists, the route returns a conflict
response unless the request explicitly asks to overwrite.

Overwrite semantics:

- Overwrite is a complete replacement of the stored character's mutable data.
- No field merge is attempted.
- The implementation preserves the existing character record ID so references
  remain stable.

Alternative considered:

- Client-side duplicate detection only. Rejected because it is race-prone and
  cannot be authoritative.

Testability notes:

- Integration tests must cover create-without-conflict, conflict response,
  abort/no-write, and overwrite/write paths.

### D5: UI uses a two-step import flow

The characters page adds an import action that:

1. Prompts for a public D&D Beyond URL
2. Calls the import API
3. If the API reports a name conflict, prompts the user to abort or confirm
   overwrite
4. Refreshes the character list and displays success or failure feedback,
  including any normalization warnings returned by the import flow

Rationale:

- Keeps the conflict decision explicit for the user.
- Avoids optimistic UI state for a workflow that depends on remote parsing.

Alternative considered:

- Silent overwrite if names match. Rejected because the issue explicitly
  requires user choice.

Testability notes:

- UI tests should verify that conflict prompts only appear on conflict and that
  abort leaves the list unchanged.

### D6: Block release on unresolved import reliability issues

This change introduces third-party parsing risk, so quality gates must be
stricter than a normal CRUD change.

Operational blocking policy:

- Do not apply or merge while import route tests, character UI tests, lint, or
  security checks are failing.
- If a new parsing dependency is introduced, its license and security scan must
  be clean before approval.
- If live-source parsing proves unstable during implementation, the change is
  blocked until the parser is hardened or scope is reduced and the proposal,
  design, specs, and tasks are updated accordingly.

## Risks / Trade-offs

- Third-party payload instability → Isolate the fetch/normalize logic, use
  fixtures in tests, and keep failure messages explicit.
- Unsupported or missing source fields → Fail for missing required identity/
  class data; otherwise coerce to safe defaults and return explicit user-facing
  warnings.
- Name-based overwrite ambiguity → Require explicit confirmation and scope the
  lookup to the authenticated user's characters only.
- Slow or failing remote fetches → Add timeouts and surface actionable errors to
  the UI.
- Public endpoint availability risk → Keep the import client isolated behind a
  single module so the source strategy can change without rewriting the route
  and UI flow.
- Warning fatigue if too many fields are normalized → Aggregate warnings into a
  concise post-import summary instead of surfacing one toast per field.

## Rollback / Mitigation

Rollback plan:

1. Remove the import UI entry point from `app/characters/page.tsx`
2. Remove the import API route and parser utilities
3. Remove related tests and any new dependency added solely for import parsing

Mitigation plan if implementation blocks:

- If parsing is too brittle, narrow supported URL/page variants and update the
  spec before continuing.
- If normalization cannot safely map source data into the current `Character`
  shape, fail import with a clear error rather than persisting partial records.

## Open Questions

- None at this time.