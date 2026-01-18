# Issue #39 Implementation Plan: D&D Beyond Character Import

## 1) Summary

- **Ticket**: #39
- **One-liner**: Enable users to import D&D Beyond public character URLs directly into their character list with conflict resolution (overwrite existing characters by name)
- **Related milestone(s)**: NA
- **Out of scope**:
  - Private (non-public) D&D Beyond character imports
  - Merge/partial update conflict resolution (overwrite only, no manual merge UI)
  - Import history/audit logs
  - Batch import of multiple characters
  - D&D Beyond account linking or API key storage

---

## 2) Assumptions & Open Questions

### Assumptions

- **D&D Beyond API availability**: D&D Beyond public character pages are scrapeable or parseable from HTML (no official public API assumed; will use web scraping or character sheet extraction)
- **Character data structure**: Imported character will be transformed into the application's `Character` type (with `classes`, `race`, `abilityScores`, etc.)
- **Conflict by name**: Conflict detection uses character `name` field only (case-sensitive match against existing characters)
- **No authentication required**: Users can import any public D&D Beyond character URL without account linking
- **Rollback if scraping breaks**: Feature flag `spcs.characters.dnd_beyond_import.enabled` (default OFF) allows disabling import if D&D Beyond page structure changes
- **Error handling**: Import failures display user-friendly messages; detailed logs captured for debugging

### Blocking Questions (AWAITING CLARIFICATION)

1. **D&D Beyond Integration Method**: Should we:
   - Scrape HTML from D&D Beyond character sheet pages (brittle, no API key needed)?
   - Use an unofficial API endpoint if available (e.g., `dndbeyond.com/api/character/:id`)?
   - Use a third-party library for D&D Beyond integration?
   - **Recommendation**: Start with HTML scraping as fallback; if unofficial API found during implementation, propose refactor.

2. **Character ID extraction from URL**: What is the expected URL format?
   - Example: `https://dndbeyond.com/characters/12345678/name`
   - Should we support shortlinks or only full URLs?

3. **Partial character data**: If some fields are missing from D&D Beyond export (e.g., saving throws, skills), should we:
   - Fail the import (safest)?
   - Use D&D default values for missing fields?
   - Allow import with partial data and let user fill in gaps?

**If these cannot be answered immediately, proceeding with reasonable assumptions listed above; plan can be adjusted post-clarification.**

---

## 3) Acceptance Criteria (Normalized)

1. **URL Input & Validation**: User can enter or paste a D&D Beyond public character URL in the Characters page; invalid URLs display a clear error
2. **Character Data Extraction**: The system successfully extracts core character data from the D&D Beyond URL (name, class, race, ability scores, AC, HP, skills, etc.)
3. **Character Mapping**: Extracted D&D Beyond character data is transformed into the application's `Character` type with all required fields
4. **Conflict Detection**: When importing, the system checks if a character with the same name already exists in the user's character list
5. **Conflict Resolution UI**: If conflict exists, user is presented with options to:
   - **Cancel**: Abort the import, no changes made
   - **Overwrite**: Replace existing character completely (no merge, full PUT replacement)
6. **Successful Import**: On successful import (or overwrite), the character appears in the character list immediately
7. **Error Handling**: Network errors, invalid D&D Beyond pages, and parsing failures display specific, actionable error messages to the user
8. **Feature Flag Wiring**: The import functionality is behind a feature flag (`spcs.characters.dnd_beyond_import.enabled`, default OFF) that can be toggled server-side
9. **Test Coverage**: Unit and integration tests cover happy path (successful import), conflict scenarios, and error conditions
10. **Documentation**: README updated with import feature description and D&D Beyond URL format expectations

---

## 4) Approach & Design Brief

### Current State

- **Character management**: Characters are created manually via form in the Characters page or loaded from localStorage/MongoDB
- **Character types**: Characters extend `CreatureStats` with multiclass support (`classes: CharacterClass[]`) and D&D-specific fields (race, background, alignment)
- **API routes**: `/api/characters` (GET, POST) and `/api/characters/[id]` (GET, PUT, DELETE) handle CRUD operations
- **Validation**: Existing validation for character classes, races, ability scores in `lib/types.ts`; monster upload validation pattern in `lib/validation/monsterUpload.ts` provides reusable structure

### Proposed Changes

#### High-Level Architecture

```
User enters D&D Beyond URL
       ↓
[Client] Import form input + validation
       ↓
[API] POST /api/characters/import
  - Fetch & parse D&D Beyond page
  - Extract character JSON/data
  - Transform to Character type
  - Check for existing character (by name)
  - If conflict: return conflict info
  - If no conflict: save character
       ↓
[Client] Handle response
  - If conflict: show modal with Overwrite/Cancel options
  - If overwrite: POST /api/characters/import with force=true
  - On success: add to character list, refresh
  - On error: display error message
```

#### Data Model / Schema

- **No schema changes needed**: Existing `Character` interface in `lib/types.ts` is sufficient
- **Feature flag in config**: Add `NEXT_PUBLIC_DND_BEYOND_IMPORT_ENABLED` (default: `false`)

#### APIs & Contracts

**New Endpoint**: `POST /api/characters/import`

**Request body:**
```json
{
  "url": "https://dndbeyond.com/characters/12345678/character-name",
  "force": false
}
```

**Response (success, no conflict):**
```json
{
  "success": true,
  "character": {
    "id": "...",
    "name": "Character Name",
    "class": "Fighter",
    "level": 3,
    ...
  }
}
```

**Response (conflict detected):**
```json
{
  "success": false,
  "conflict": true,
  "existingCharacter": {
    "id": "...",
    "name": "Character Name",
    "class": "Fighter",
    ...
  },
  "importedCharacter": {
    "name": "Character Name",
    "class": "Rogue",
    ...
  }
}
```

**Response (error):**
```json
{
  "success": false,
  "error": "Invalid D&D Beyond URL format",
  "details": "..."
}
```

#### Feature Flags

- **Flag name**: `spcs.characters.dnd_beyond_import.enabled`
- **Default**: `OFF` (false)
- **Rationale**: Allows disable if D&D Beyond page structure changes; can enable gradually for testing

#### Config

- **Environment variable**: `NEXT_PUBLIC_DND_BEYOND_IMPORT_ENABLED=false` (can be overridden per deployment)
- **No new secrets needed** (no authentication for D&D Beyond)

#### External Dependencies

- **jsdom** (optional): For server-side HTML parsing if scraping D&D Beyond pages
  - Alternative: Use a headless browser library (e.g., puppeteer) if dynamic content loading required
  - **Decision**: Start with `jsdom` for static content; add puppeteer if initial approach fails
  - **Latest version** (as of Jan 2026): jsdom ^20.0.3; puppeteer ^21.0.0

#### Backward Compatibility

- **No breaking changes**: All existing character CRUD operations remain unchanged
- **New endpoint** only used by import UI; legacy character creation continues as-is

#### Observability

- **Metrics**:
  - `characters.import.attempts` (counter: total import attempts)
  - `characters.import.success` (counter: successful imports)
  - `characters.import.conflicts` (counter: conflicts detected)
  - `characters.import.errors` (counter: errors; tagged by error type)
  - `characters.import.duration_ms` (histogram: import latency)

- **Logs**:
  - `[import] Parsing D&D Beyond URL: <url>`
  - `[import] Character extracted: <name>, <class> <level>`
  - `[import] Conflict detected: <existing_id> vs new character`
  - `[import] Import successful: <character_id>`
  - `[import] Error: <error_message>` (at error log level)

- **Alerts** (optional, post-MVP):
  - High error rate (>5% of imports failing)
  - D&D Beyond page parse failures (indicates possible breaking change)

#### Security & Privacy

- **Input validation**: Whitelist D&D Beyond domain; reject non-HTTPS URLs; validate URL format before fetching
- **PII/Privacy**: Imported characters are user-owned; no data sharing or public exposure without explicit action
- **Rate limiting**: Consider rate limit on import endpoint (e.g., 10 imports per minute per user) to prevent abuse
- **No credentials stored**: No D&D Beyond login or API key stored; public character data only

#### Alternatives Considered

1. **Direct D&D Beyond API (if public available)**: More reliable than scraping but would require API key management; deferred pending official API availability
2. **CSV/JSON upload from D&D Beyond export**: Requires users to manually export first; simpler but less user-friendly; could be added as secondary import method
3. **Browser extension for one-click import**: Out of scope; would require separate extension maintenance

---

## 5) Step-by-Step Implementation Plan (TDD)

### Phase 1: RED (Test Creation & Initial Failures)

**Goal**: Define test boundaries; ensure tests fail before implementation.

#### 5.1.1 Unit Tests: D&D Beyond URL Parsing

**File**: `tests/unit/dndBeyondImport.test.ts` (new)
**Data source**: Parameterized test provider in `tests/unit/data/dndBeyondTestDataProvider.ts`

Tests (all should FAIL initially):
- `parseCharacterId` extracts ID from valid D&D Beyond URLs
  - Valid URLs (parameterized): `https://dndbeyond.com/characters/<id>/<name>`, shortlinks, various formats
  - Invalid URLs: malformed, wrong domain, missing ID
  - Edge cases: URLs with special characters, very long IDs
- `validateDnDBeyondUrl` returns true/false for valid/invalid URLs
- Error handling: Clear error messages for invalid inputs

**Data provider** (`tests/unit/data/dndBeyondTestDataProvider.ts`):
```typescript
export const validDnDBeyondUrls = [
  'https://dndbeyond.com/characters/12345678/my-fighter',
  'https://www.dndbeyond.com/characters/87654321/another-char',
];
export const invalidUrls = [
  'https://google.com',
  'https://dndbeyond.com/abc',
];
```

#### 5.1.2 Unit Tests: Character Data Transformation

**File**: `tests/unit/dndBeyondTransform.test.ts` (new)
**Data source**: `tests/unit/data/dndBeyondCharacterFixtures.json`

Tests (all should FAIL initially):
- `transformDnDBeyondData` converts D&D Beyond JSON/HTML-extracted data to `Character` type
  - Happy path: Full character data → valid Character with all fields
  - Partial data: Missing optional fields (traits, actions) → valid Character with defaults
  - Class mapping: D&D Beyond class names → application `VALID_CLASSES`
  - Race mapping: D&D Beyond races → application `VALID_RACES`
  - Ability scores: Numerical mapping preserved
  - Multiclass handling: If D&D Beyond data includes multiple classes
- Error cases: Invalid class/race → clear error

**Test fixture** (`tests/unit/data/dndBeyondCharacterFixtures.json`):
```json
{
  "validCharacter": {
    "name": "Ulgrim",
    "class": "Fighter",
    "level": 5,
    "race": "Dwarf",
    "ac": 18,
    "hp": 52,
    "maxHp": 52,
    "abilityScores": { ... }
  },
  "partialCharacter": { ... },
  "multiclassCharacter": { ... }
}
```

#### 5.1.3 Integration Tests: Conflict Detection

**File**: `tests/integration/dndBeyondConflict.test.ts` (new)
**Data source**: Parameterized conflict scenarios

Tests (all should FAIL initially):
- Import endpoint detects conflict when character name matches existing
- Import endpoint allows overwrite with `force=true`
- Conflict response includes both existing and imported character data
- No conflict scenario: import succeeds when name is unique

#### 5.1.4 Integration Tests: Full Import Flow

**File**: `tests/integration/dndBeyondImport.integration.test.ts` (new)

Tests (all should FAIL initially):
- POST `/api/characters/import` with valid URL → character created
- POST `/api/characters/import` with invalid URL → error response with specific error message
- POST `/api/characters/import` with network error (D&D Beyond unreachable) → timeout error
- POST `/api/characters/import` with unparseable response → error

### Phase 2: GREEN (Implementation)

#### 5.2.1 Utility: D&D Beyond URL Parser

**File**: `lib/utils/dndBeyondParser.ts` (new)

```typescript
export function parseCharacterId(url: string): { valid: true; id: string } | { valid: false; error: string }
export function validateDnDBeyondUrl(url: string): boolean
export async function fetchDnDBeyondCharacter(id: string): Promise<RawDnDBeyondCharacter | null>
```

Dependencies:
- `jsdom` for HTML parsing (if scraping)
- URL validation (use standard URL API)

#### 5.2.2 Utility: Character Transformation

**File**: `lib/validation/dndBeyondValidation.ts` (new)

Leverage existing pattern from `lib/validation/monsterUpload.ts`:

```typescript
export interface ValidationError { field?: string; message: string; }
export interface ValidationResult { valid: boolean; errors: ValidationError[]; }

export function validateDnDBeyondCharacter(
  data: RawDnDBeyondCharacter
): ValidationResult

export function transformDnDBeyondCharacter(
  data: RawDnDBeyondCharacter,
  userId: string
): { valid: true; character: Character } | { valid: false; error: ValidationError }
```

#### 5.2.3 API Endpoint: POST /api/characters/import

**File**: `app/api/characters/import/route.ts` (new)

```typescript
export async function POST(request: NextRequest) {
  // 1. Authenticate user
  // 2. Parse request body (url, force)
  // 3. Validate URL
  // 4. Fetch & parse D&D Beyond character
  // 5. Transform to Character type
  // 6. Check feature flag
  // 7. Check for existing character by name
  // 8. If conflict & !force: return conflict response
  // 9. If conflict & force: overwrite (DELETE old, INSERT new)
  // 10. If no conflict: insert character
  // 11. Return success response with character data
}
```

Key logic:
- Use existing `requireAuth` middleware
- Use `storage.loadCharacters(userId)` to check for conflicts
- Use `storage.saveCharacter(character)` to persist (or DELETE + INSERT for overwrite)
- Return standardized JSON responses

#### 5.2.4 Client Component: D&D Beyond Import UI

**File**: `lib/components/DnDBeyondImportModal.tsx` (new)

```typescript
interface Props {
  onImportSuccess: (character: Character) => void;
  onClose: () => void;
}

export function DnDBeyondImportModal({ onImportSuccess, onClose }: Props) {
  // 1. URL input field
  // 2. Submit button (disabled while loading)
  // 3. Loading state
  // 4. Error display (specific error messages)
  // 5. If conflict: ConflictModal (Overwrite / Cancel buttons)
  // 6. Success state: Show imported character preview
}
```

#### 5.2.5 Characters Page Integration

**File**: `app/characters/page.tsx` (modify)

Add:
- Button "Import from D&D Beyond" in the header (visible only if flag enabled)
- DnDBeyondImportModal component (conditionally rendered)
- Handle import success: refresh character list

#### 5.2.6 Feature Flag Wiring

**File**: `lib/constants.ts` (modify or create flag utility)

```typescript
export const FEATURE_FLAGS = {
  DND_BEYOND_IMPORT_ENABLED: process.env.NEXT_PUBLIC_DND_BEYOND_IMPORT_ENABLED === 'true',
};
```

Use in:
- Client-side: Show/hide import button
- API: Return error if flag disabled

### Phase 3: Refactor (Code Quality & Cleanup)

#### 5.3.1 Review for Duplication

- Check if any URL parsing/validation logic duplicates existing code
  - Reuse existing URL validation utilities if available
  - Extract reusable error formatting from `dndBeyondValidation.ts` into `lib/validation/common.ts` if pattern is shared with monsters
- Remove any dead code or unused imports

#### 5.3.2 Simplify & Reduce Complexity

- Break down `POST /api/characters/import` into smaller service functions:
  - `extractCharacterId(url: string)`
  - `fetchCharacterData(id: string)`
  - `checkConflict(userId: string, characterName: string)`
  - `saveOrOverwrite(userId: string, character: Character, force: boolean)`
- Keep handler method <30 lines

#### 5.3.3 Static Analysis & Formatting

- Run `npm run lint` and fix any eslint violations
- Apply formatter (if configured)
- Check TypeScript strict mode compliance

#### 5.3.4 Documentation

- Add JSDoc comments to public functions
- Update [README.md](README.md) with D&D Beyond import feature description
- Add section in docs/ describing D&D Beyond integration limitations and supported data fields

#### 5.3.5 Pre-PR Duplication Check

**MANDATORY**: Before opening PR, verify:
- No duplicate validation logic in `dndBeyondValidation.ts` vs `lib/validation/monsterUpload.ts`
- Reuse `ValidationError`, `ValidationResult` types from monsterUpload if possible
- Abstract common patterns into `lib/validation/common.ts` if beneficial

---

## 6) Effort, Risks, Mitigations

### Effort Estimate: **MEDIUM** (M)

**Rationale**:
- URL parsing & validation: straightforward (2-3 days)
- D&D Beyond data extraction: depends on page structure; likely requires trial & iteration with HTML/scraping (3-5 days)
- Character transformation & validation: reuse monsterUpload pattern (2 days)
- API endpoint & conflict handling: standard CRUD logic (2 days)
- Client UI & integration: form + modal + error handling (2-3 days)
- Tests: comprehensive coverage including parameterized fixtures (3-4 days)
- **Total**: ~15-20 days of focused effort

### Risks & Mitigations

| Rank | Risk | Likelihood | Impact | Mitigation | Fallback |
|------|------|------------|--------|-----------|----------|
| 1 | D&D Beyond page structure changes; scraping breaks | Medium | High | Use feature flag to disable import; monitor error logs for parse failures; add automated health check for scraping | Switch to official API if made available; document manual CSV upload as alternative |
| 2 | Incomplete character data extraction (missing fields) | High | Medium | Define clear mapping between D&D Beyond fields & application `Character` type; validate required fields; use sensible defaults for optional fields | Fail import with clear error message listing missing fields; let user know they need to add manually |
| 3 | Multiclass character complexity (D&D Beyond vs app data model mismatch) | Medium | Medium | Test multiclass scenarios thoroughly; verify `classes` array is correctly transformed from D&D Beyond JSON | Accept single primary class on import; document limitation; allow post-import manual editing |
| 4 | Performance: Large character data or slow D&D Beyond response | Low | Low | Add timeout on fetch (e.g., 10s); add progress feedback to user; consider async background fetch if needed | Implement with reasonable timeout; queue import as background job if too slow |
| 5 | Security: HTML injection or parsing vulnerabilities | Low | High | Sanitize extracted data before storage; use robust HTML parser (jsdom); validate all fields before transformation | Use allowlist for data fields; reject any unexpected data structures |

---

## 7) File-Level Change List

**New Files**:
- `lib/utils/dndBeyondParser.ts` — URL parsing, validation, and D&D Beyond character fetching
- `lib/validation/dndBeyondValidation.ts` — Character transformation and validation (reusing ValidationError/Result pattern)
- `app/api/characters/import/route.ts` — POST endpoint for character import
- `lib/components/DnDBeyondImportModal.tsx` — Client-side import UI and conflict modal
- `tests/unit/dndBeyondImport.test.ts` — URL parsing unit tests
- `tests/unit/dndBeyondTransform.test.ts` — Character transformation unit tests
- `tests/unit/data/dndBeyondTestDataProvider.ts` — Parameterized test data for URLs and characters
- `tests/unit/data/dndBeyondCharacterFixtures.json` — JSON fixtures for test scenarios
- `tests/integration/dndBeyondConflict.test.ts` — Conflict detection and resolution tests
- `tests/integration/dndBeyondImport.integration.test.ts` — Full import flow integration tests

**Modified Files**:
- `app/characters/page.tsx` — Add import button and modal integration
- `lib/types.ts` — Add interface for RawDnDBeyondCharacter (if needed for type clarity)
- `lib/constants.ts` — Add feature flag constant
- `README.md` — Document D&D Beyond import feature and supported URL format
- `docs/INTEGRATION_TESTS.md` (or similar) — Add section on import testing strategy (optional)

**Potentially Modified** (if refactoring for reuse):
- `lib/validation/common.ts` (new) — Extract shared ValidationError/Result handling if multiple validators need it

---

## 8) Test Plan

### Parameterized Test Strategy

**Goal**: Maximize coverage of input variations without duplicating test code.

#### Test Data Sources

1. **URL validation tests** — Data provider class:
   ```
   tests/unit/data/dndBeyondTestDataProvider.ts
   ```
   - Provider methods: `validUrls()`, `invalidUrls()`, `edgeCaseUrls()`
   - Used by: `dndBeyondImport.test.ts` via `@MethodSource("dndBeyondTestDataProvider")`

2. **Character transformation tests** — JSON fixture file:
   ```
   tests/unit/data/dndBeyondCharacterFixtures.json
   ```
   - Scenarios: valid full character, partial data, multiclass, edge cases (e.g., very high ability scores, unusual races)
   - Used by: `dndBeyondTransform.test.ts` via parameterized loader

3. **Conflict scenarios** — Parameterized test data:
   ```
   tests/integration/dndBeyondConflict.test.ts
   ```
   - Case 1: Exact name match → conflict
   - Case 2: Case-sensitive mismatch → no conflict
   - Case 3: Partial name match → no conflict
   - Case 4: Overwrite existing → success

### Test Coverage by Category

| Category | Approach | Source |
|----------|----------|--------|
| **URL Parsing** | Parameterized: valid, invalid, edge cases | `dndBeyondTestDataProvider.ts` |
| **Character Transformation** | Parameterized: full data, partial, multiclass | `dndBeyondCharacterFixtures.json` |
| **Validation** | Simple unit tests for required field validation | Direct test code |
| **Conflict Detection** | Parameterized: name matches, case sensitivity, overwrite | `dndBeyondConflict.test.ts` |
| **Happy Path Import** | Integration test: URL → fetch → transform → save | `dndBeyondImport.integration.test.ts` |
| **Error Handling** | Parameterized: invalid URL, network error, parse failure | Error scenarios in fixtures |
| **Feature Flag** | Simple unit test: flag OFF → no import, flag ON → allow import | Direct test code |
| **Security** | Input validation: malicious URLs, injection attempts | Direct test code |

### Regression Tests

- Ensure existing character CRUD operations unaffected by new import endpoint
- Verify character validation (race, class, ability scores) still enforced
- Check localStorage/sync behavior with imported characters

---

## 9) Rollout & Monitoring Plan

### Feature Flag & Deployment

**Flag**: `NEXT_PUBLIC_DND_BEYOND_IMPORT_ENABLED` (environment variable)
- **Default**: `false` (feature disabled by default)
- **To enable**: Set to `true` in deployment environment variables

**Deployment Steps** (progressive):
1. Deploy code with flag OFF (no user impact)
2. Run smoke tests in staging with flag ON
3. Enable for 10% of users (canary) via flag in staging
4. Monitor errors & latency for 2-3 hours
5. If metrics healthy, enable for 100% of users
6. Monitor production for 24 hours
7. If issues detected, set flag OFF to disable immediately

### Key Metrics & Dashboards

**Success Metrics**:
- `characters.import.success_rate` — % of attempted imports that succeed (target: >90%)
- `characters.import.avg_duration_ms` — Average import latency (target: <5s)
- `characters.import.conflicts_resolved` — % of conflicts resolved via overwrite (monitoring only)

**Alerting** (configure in monitoring system):
- `characters.import.error_rate > 5%` — Page over 5% error rate
- `characters.import.duration_p99 > 10000` — P99 latency exceeds 10s
- `characters.import.dndbeyond_unreachable` — Repeated D&D Beyond fetch failures (indicates possible page structure change)

### Rollback Procedure

**If critical issues detected:**

1. **Immediate action**: Set feature flag OFF in environment
   ```bash
   NEXT_PUBLIC_DND_BEYOND_IMPORT_ENABLED=false
   # Redeploy or restart app
   ```

2. **Verify**: Confirm import button no longer appears on client

3. **Investigate**:
   - Check error logs for specific failure pattern
   - Test with latest D&D Beyond character page (may have changed structure)
   - Review PR for logic errors

4. **Communicate**: Notify team of rollback reason

5. **Remediate**: Fix issue in code, test thoroughly, redeploy with flag ON

---

## 10) Handoff Package

- **GitHub issue**: [#39 — Create import from D&D Beyond functionality](https://github.com/dougis-org/session-combat/issues/39)
- **Branch**: `feature/39-dnd-beyond-import`
- **Plan file**: `docs/plan/tickets/39-plan.md` (this file)
- **Key commands**:
  - Build: `npm run build`
  - Test: `npm run test` (unit); `npm run test:integration` (integration)
  - Lint: `npm run lint`
  - Dev: `npm run dev` (test locally with flag enabled via `.env.local`)
- **Known gotchas**:
  - D&D Beyond HTML structure is brittle; scraping may break if they change page layout
  - Character data may be incomplete; test with multiple sample D&D Beyond characters early
  - Multiclass handling requires careful testing; ensure level calculations are correct
  - Feature flag must be explicitly enabled in deployment; default OFF for safety
- **Testing the import locally**:
  - Set `NEXT_PUBLIC_DND_BEYOND_IMPORT_ENABLED=true` in `.env.local`
  - Start dev server: `npm run dev`
  - Navigate to Characters page; import button should appear
  - Test with real D&D Beyond public character URLs (find samples in d&d beyond public galleries)

---

## 11) Traceability Map

| AC # | Requirement | Milestone | Task(s) | Flag(s) | Test(s) |
|------|-------------|-----------|---------|---------|---------|
| 1 | URL input & validation | NA | Parse URL, validate format | spcs.characters.dnd_beyond_import.enabled | Unit: `dndBeyondImport.test.ts` |
| 2 | Character data extraction | NA | Fetch & parse D&D Beyond | spcs.characters.dnd_beyond_import.enabled | Unit: `dndBeyondTransform.test.ts` |
| 3 | Character mapping | NA | Transform to Character type | spcs.characters.dnd_beyond_import.enabled | Unit: `dndBeyondTransform.test.ts` |
| 4 | Conflict detection | NA | Check existing by name | spcs.characters.dnd_beyond_import.enabled | Integration: `dndBeyondConflict.test.ts` |
| 5 | Conflict resolution UI | NA | Modal: Cancel / Overwrite | spcs.characters.dnd_beyond_import.enabled | Integration: Full flow test |
| 6 | Successful import | NA | Save character to DB | spcs.characters.dnd_beyond_import.enabled | Integration: `dndBeyondImport.integration.test.ts` |
| 7 | Error handling | NA | Network & parse errors | spcs.characters.dnd_beyond_import.enabled | Unit & Integration: error scenarios |
| 8 | Feature flag wiring | NA | Enable/disable via env var | spcs.characters.dnd_beyond_import.enabled | Unit: flag behavior test |
| 9 | Test coverage | NA | Unit + integration tests | spcs.characters.dnd_beyond_import.enabled | Test suite: all above |
| 10 | Documentation | NA | Update README & docs | NA | Manual: review updated docs |

---

## Quality Assurance Checklist

- ✅ **Decomposition**: Single ticket (no sub-issues proposed; scope is unified around one feature)
- ✅ **Reuse Evidence**: Validation pattern reused from `lib/validation/monsterUpload.ts`; error types leveraged from existing code
- ✅ **Parameterized Tests**: Data providers & fixtures specified for URL parsing, character transformation, and conflict scenarios
- ✅ **Utility Duplication**: Searched existing code; found no duplicate D&D Beyond import utilities (new implementation)
- ✅ **Dependency Graph**: No circular dependencies; clean layering (Parser → Validation → API → Component)
- ✅ **Feature Flags**: `spcs.characters.dnd_beyond_import.enabled` (default OFF) gates all new runtime behavior
- ✅ **Observability**: Metrics (attempts, success, conflicts, errors, duration), logs (per step), and alerts defined
- ✅ **Traceability**: All 10 ACs mapped to requirements, tasks, flags, and tests in Section 11
- ✅ **Rollback Strategy**: Feature flag toggle enables instant disable; procedure documented in Section 9
- ✅ **Security & Privacy**: Input validation, no credentials stored, rate limiting considered, no public data exposure

---

## Implementation Notes

1. **Start with scraping approach** (jsdom-based HTML parsing) for proof-of-concept; if D&D Beyond has unofficial API endpoint, refactor to use it for reliability.

2. **Test D&D Beyond integration early** (Step 5.2.1): Fetch a real character page and verify extraction works before full implementation.

3. **Reuse validation infrastructure**: Don't duplicate error handling; leverage `ValidationError`/`ValidationResult` pattern from `lib/validation/monsterUpload.ts`.

4. **Conflict handling is critical**: Ensure "overwrite" fully replaces character (no partial merge); test with multiple conflict scenarios.

5. **Feature flag visibility**: Ensure import button only appears on client when flag is ON; verify API also respects flag.

6. **Error messages must be user-friendly**: Avoid technical details (e.g., "JSON parse error"); use messages like "Could not read character from that D&D Beyond page. Please check the URL and try again."

---

**Plan created**: 2026-01-18  
**Status**: Ready for implementation  
**Awaiting**: User confirmation on blocking questions (Section 2) if any clarification needed before work begins.
