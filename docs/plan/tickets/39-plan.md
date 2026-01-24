# Implementation Plan: Issue #39 — D&D Beyond Character Import

---

## 1) Summary

- Ticket: #39
- One-liner: Enable users to import D&D Beyond public character URLs into their character list with duplicate detection and optional overwrite.
- Related milestone(s): NA
- Out of scope:
  - Private or unlisted character imports
  - Partial merge/selective field updates (full PUT replacement only)
  - Automatic stat calculation from D&D Beyond data
  - Character export back to D&D Beyond
  - Batch import functionality

---

## 2) Assumptions & Open Questions

- Assumptions:
  - D&D Beyond public character URLs are accessible and parseable (no authentication required for public characters).
  - The import will scrape or use D&D Beyond's public character data endpoint (if available) to extract character stats, classes, races, abilities, etc.
  - Duplicate detection is **name-based only** (by character name, case-insensitive).
  - Overwrite action is a complete PUT replacement (DELETE old + INSERT new; no merge).
  - The feature will be exposed as a new UI workflow (e.g., a dedicated "Import Character" modal or page) or as an additional field in the existing character entry form.
  - Imported character will be associated with the authenticated user (`auth.userId`).
  - Network timeout and D&D Beyond API unavailability should be handled gracefully with user-facing error messages.
  - The import process does not require a feature flag (low-risk new capability, independent data path).

- Open questions (blocking → need answers):
  1. **D&D Beyond API/scraping strategy**: Does session-combat have an existing integration with D&D Beyond's API, or should we implement web scraping? What is the preferred approach?
     - Assumption if no answer: Implement HTTP client to fetch public character page and extract JSON-LD or structured data; fall back to HTML scraping if needed.
  2. **URL format**: What URL formats are supported? (e.g., `https://www.dndbeyond.com/characters/XXXXXXX` or others?)
     - Assumption: Accept the standard D&D Beyond character URL format and extract character ID from the URL.
  3. **Mapping D&D Beyond schema to session-combat Character type**: How should D&D Beyond fields map to the `Character` interface (ability scores, skills, traits, etc.)?
     - Assumption: Use best-effort mapping; unmapped fields are filled with defaults or skipped.
  4. **User notification on overwrite**: Should the overwrite action be confirmed with a modal, or is it implied by the user's selection?
     - Assumption: Show a confirmation dialog listing the name and key stats of both characters before overwrite.

---

## 3) Acceptance Criteria (normalized)

1. **URL Input & Validation**: User can enter a D&D Beyond public character URL in the UI; the system validates URL format and provides inline feedback (valid URL, unreachable, invalid format).
2. **Character Fetch**: System fetches character data from the D&D Beyond URL and extracts core stats (name, classes, race, ability scores, HP, AC, skills, traits, actions, etc.).
3. **Duplicate Detection**: Before import, the system checks if a character with the same name (case-insensitive) already exists in the user's character list.
4. **Duplicate Handling—Option 1 (New Character)**: If no duplicate exists, import proceeds and the character is added to the user's list.
5. **Duplicate Handling—Option 2 (Overwrite)**: If a duplicate exists, show a confirmation dialog with option to: (a) abort import, or (b) completely replace the existing character (PUT replacement, no merge).
6. **Error Handling**: Network failures, timeouts, invalid D&D Beyond responses, and parsing errors are caught and displayed to the user with actionable messages (e.g., "URL not accessible" or "Character data could not be parsed").
7. **Success Feedback**: On successful import or overwrite, redirect to the character detail page or display a success toast, and the imported character is immediately available in the user's character list.
8. **Integration Tests**: Tests verify URL validation, successful import, duplicate detection, overwrite flow, and error scenarios.

---

## 4) Approach & Design Brief

### Current State
- Characters are created via the `POST /api/characters` endpoint, which accepts a JSON payload with character stats.
- Character list is retrieved via `GET /api/characters` and filtered by `auth.userId`.
- Character creation UI is in `app/characters/page.tsx` (main character list) and `app/register/page.tsx` (quick entry).
- Character validation exists in `lib/types.ts` (e.g., `isValidRace()` at line 61, `isValidClass()` at line 31, `validateCharacterClasses()` at line 102).
- Modal components are used for quick entry workflows (e.g., `QuickCharacterEntry.tsx`, `QuickCombatantModal.tsx`).
- No existing import or URL parsing infrastructure.
- Searched `lib/utils/*` and `lib/services/*` for existing HTTP fetch wrappers and character transformation utilities; none found. New utilities are justified.

### Proposed Changes (High-Level Architecture & Data Flow)

1. **New UI Component**: Import modal (`lib/components/ImportCharacterModal.tsx`).
   - Modal displays on demand from character list page (`app/characters/page.tsx`).
   - Input field for D&D Beyond character URL.
   - Real-time URL validation feedback.
   - On valid URL submit: trigger fetch and display loading state.
   - Dismiss button to close modal without action.

2. **New API Endpoint**: `POST /api/characters/import` (internal API route).
   - Accept JSON payload: `{ url: string }`.
   - Parse and validate URL.
   - Fetch character data from D&D Beyond.
   - Transform into session-combat `Character` schema.
   - Check for duplicate by name.
   - Return: `{ character: Character; isDuplicate: boolean; existingCharacterId?: string }`.

3. **New Service/Utility**: `lib/utils/dndBeyondImporter.ts`.
   - Export function `importCharacterFromUrl(url: string): Promise<RawCharacterData>`.
   - Handle URL parsing, HTTP fetch, HTML/JSON parsing, and error handling.
   - Return raw character data (schema TBD based on D&D Beyond's structure).

4. **Character Transformation**: `lib/utils/characterTransformer.ts`.
   - Export function `transformDndBeyondToCharacter(raw: RawCharacterData, userId: string): Character`.
   - Map D&D Beyond fields to `Character` interface; apply defaults for unmapped fields.
   - Validate result using existing character validators.

5. **Duplicate Check Logic**: Reuse existing `GET /api/characters` to fetch user's characters, then filter by name.
   - Alternatively, add a check endpoint `GET /api/characters/check-duplicate?name=...`.

6. **Overwrite Flow**:
   - If duplicate exists, return both `character` (new imported) and `existingCharacterId` in API response.
   - Frontend displays confirmation dialog.
   - On confirm, frontend submits `PUT /api/characters/{characterId}` with new character data (replaces existing).
   - On abort, dismiss dialog and remain on import page.

### Data Model / Schema

No schema changes required. Leverage existing `Character` interface from `lib/types.ts`.

**New internal types**:
```typescript
interface RawCharacterData {
  name: string;
  classes: { class: DnDClass; level: number }[];
  race?: DnDRace;
  alignment?: DnDAlignment;
  background?: string;
  abilityScores: AbilityScores;
  ac: number;
  maxHp: number;
  skills?: Record<string, number>;
  traits?: CreatureAbility[];
  actions?: CreatureAbility[];
  // ... other fields as available from D&D Beyond
}

interface ImportResult {
  character: Character;
  isDuplicate: boolean;
  existingCharacterId?: string;
}
```

### APIs & Contracts

**New endpoint: `POST /api/characters/import`**
- Request:
  ```json
  { "url": "https://www.dndbeyond.com/characters/123456789" }
  ```
- Success response (201):
  ```json
  {
    "character": { ... },
    "isDuplicate": false
  }
  ```
- Duplicate response (200 with duplicate flag):
  ```json
  {
    "character": { ... },
    "isDuplicate": true,
    "existingCharacterId": "char-uuid"
  }
  ```
- Error responses:
  - 400: Invalid URL format
  - 404: D&D Beyond character not found
  - 502: D&D Beyond unreachable or parsing failed
  - 500: Server error

**Updated endpoint: `PUT /api/characters/{characterId}`** (may already exist)
- Request: full `Character` object.
- Response: updated `Character` object.

### Feature Flags

None required (new capability, independent data path, low risk).

### Config

No new environment variables required initially. If D&D Beyond rate limiting becomes a concern, add:
- `DND_BEYOND_IMPORT_TIMEOUT_MS` (default: 10000)
- `DND_BEYOND_MAX_RETRIES` (default: 2)

### External Dependencies

- **node-fetch** (already in package.json): used to fetch D&D Beyond URLs.
- **jsdom** (optional, if HTML scraping needed): for parsing and extracting character data from HTML.
  - Alternative: use regex/string parsing for lightweight approach (prefer if D&D Beyond provides JSON-LD or meta tags).

### Backward Compatibility

No breaking changes. New endpoint is additive; existing character creation flow unchanged.

### Observability

- **Logging**: Log import attempts (URL, user ID), failures (reason, D&D Beyond response status), and successes (character name, user ID).
- **Metrics** (optional): Track import success rate, average latency, duplicate resolution rate (abort vs. overwrite).
- **Alerts** (optional): Alert if D&D Beyond import failures exceed threshold (e.g., >10% failure rate over 1 hour).

### Security & Privacy

- **URL Validation**: Whitelist D&D Beyond domain only (`*.dndbeyond.com`); reject other URLs.
- **Rate Limiting**: Apply per-user import rate limit (e.g., max 10 imports/hour) to prevent abuse and D&D Beyond scraping overload.
- **No Auth Required for D&D Beyond**: Fetching public character data requires no API key; use standard HTTP client.
- **PII**: Imported character data is PII but follows same data model as user-created characters; apply existing privacy controls.
- **Input Validation**: Validate and sanitize all D&D Beyond responses before storing in DB.

### Alternatives Considered

1. **Use D&D Beyond's official API**: Requires API key and approval; higher latency and complexity. Not explored initially; defer if public scraping fails.
2. **Async import queue**: For large-scale imports; deferred (not in scope for v1).
3. **Selective field merge**: Rejected per requirement (full PUT replacement only).
4. **Automatic sync**: Rejected (one-time import only; users control local edits).

---

## 5) Step-by-Step Implementation Plan (TDD)

### Phase: RED → GREEN → REFACTOR

#### Step 1: Prep & Branch
- Ensure clean workspace, sync main:
  ```bash
  git checkout main && git pull --ff-only
  ```
- Switch to existing branch or create:
  ```bash
  git switch -c feature/39-dnd-beyond-import
  ```
  (or `git switch feature/39-dnd-beyond-import` if exists)
- Confirm: "Planning issue #39 on branch feature/39-dnd-beyond-import"

#### Step 2: Tests (RED State — Add Failing Tests First)

**2.1 Unit Tests: URL Validation & Parsing**
- New file: `tests/unit/utils/dndBeyondImporter.test.ts`
  - Test valid D&D Beyond URL formats (extract character ID).
  - Test invalid URLs (wrong domain, malformed, etc.).
  - Test edge cases (URLs with query params, trailing slashes).
  - Data source: `tests/unit/data/dnd-beyond-urls.json` (parameterized).
  - All tests should initially fail (no implementation yet).

**2.2 Unit Tests: Character Transformation**
- New file: `tests/unit/utils/characterTransformer.test.ts`
  - Test transformation of D&D Beyond raw data to `Character` interface.
  - Test field mapping (classes, race, ability scores, HP, AC, skills, traits, actions).
  - Test defaults for unmapped/missing fields.
  - Test validation of transformed character (should pass existing validators).
  - Test string normalization: case-insensitive names, trimmed whitespace, unicode normalization (e.g., é vs é).
  - Data source: `tests/unit/data/dnd-beyond-character-samples.json` (parameterized raw samples, including edge cases for whitespace and unicode).
  - All tests fail initially.

**2.3 Integration Tests: API Endpoint `/api/characters/import`**
- New file: `tests/integration/characterImport.integration.test.ts`
  - Test successful import (URL → character stored in DB).
  - Test duplicate detection (import same URL/name twice, second attempt flags duplicate; verify case-insensitive + trimmed comparison).
  - Test duplicate overwrite (confirm overwrite, existing character replaced).
  - Test duplicate abort (cancel overwrite, character unchanged).
  - Test rapid concurrent imports (2 simultaneous imports of same character; both succeed without race conditions).
  - Test URL validation errors (400 invalid URL).
  - Test D&D Beyond fetch errors (mock HTTP failure → 502/504 response).
  - Test HTTP edge cases: 429 rate limiting, 301/302 redirects, SSL/certificate errors.
  - Test parsing errors (invalid D&D Beyond response → 502 response).
  - Data source: mock D&D Beyond responses in `tests/integration/data/dnd-beyond-responses.json` via `nock` HTTP mocking (nock library intercepts HTTP requests; not parameterized because mocking is the test data mechanism).
  - Setup: use existing MongoDB testcontainer pattern from `tests/integration/monsters.integration.test.ts`.
  - All tests fail initially.

**2.4 E2E Tests (Playwright): Import Flow**
- Extend or create `tests/e2e/character-import.spec.ts`
  - Test user opens import modal from character list page.
  - Test enters valid D&D Beyond URL, imports character, modal closes, confirms character appears in list.
  - Test imports same character twice, triggers duplicate dialog, selects abort, character not duplicated, modal remains open.
  - Test imports same character twice, confirms overwrite, existing character replaced, modal closes and redirects to character list.
  - Test enters invalid URL, sees error message inline (URL field or near submit button), modal remains open.
  - Test user dismisses modal without importing; character list unchanged.
  - Test rapid imports: user imports 2 different characters in quick succession; both appear in character list without race conditions or duplicates.
  - Test redirect integrity: after successful import/overwrite, user is redirected to character detail page or character list; clicking back and re-opening modal shows updated state.
  - All tests fail initially.

#### Step 3: Implement Changes (GREEN State — Make Tests Pass)

**3.1 Create URL Validation & Fetcher Utility**
- New file: `lib/utils/dndBeyondImporter.ts`
  - Export `validateDndBeyondUrl(url: string): { valid: boolean; error?: string }`.
  - Export `fetchCharacterFromUrl(url: string): Promise<RawCharacterData>`.
  - Validate domain is `dndbeyond.com`.
  - Parse character ID from URL.
  - Use `node-fetch` to GET the character page.
  - Extract character data from HTML/JSON (using regex, HTML parser, or meta tags).
  - Handle timeouts (default 10s), network errors, 404s, and malformed responses.
  - Return typed `RawCharacterData` or throw descriptive error.

**3.2 Create Character Transformer**
- New file: `lib/utils/characterTransformer.ts`
  - Export `transformDndBeyondToCharacter(raw: RawCharacterData, userId: string): Character`.
  - Map fields from D&D Beyond schema to `Character` interface.
  - Apply defaults where D&D Beyond data is missing (e.g., Fighter level 1 if no class).
  - Normalize character names: trim whitespace, case-insensitive comparison for duplicate detection.
  - Validate result using reused validators from [lib/types.ts](lib/types.ts#L102): `validateCharacterClasses()`, `isValidRace()`, `isValidClass()`.
  - Throw error if transformation fails validation.

**3.3 Create Import API Endpoint**
- New file: `app/api/characters/import/route.ts`
  - Require authentication: use `requireAuth` middleware from [lib/middleware.ts](lib/middleware.ts).
  - Accept `POST` with `{ url: string }` body.
  - Validate URL format using `validateDndBeyondUrl()` from step 3.1.
  - Call `fetchCharacterFromUrl(url)` with timeout (10s default) and retry logic (2 retries).
  - Call `transformDndBeyondToCharacter(raw, auth.userId)` to normalize and validate.
  - Check for duplicate: fetch user's characters via `storage.loadCharacters(auth.userId)`, filter by trimmed, case-insensitive name.
  - If no duplicate: save character to DB, return 201 with character.
  - If duplicate: return 200 with character + `isDuplicate: true` + `existingCharacterId`.
  - On any error: return 400/502/500 with error message.
  - Handle HTTP edge cases: 429 (rate limit), 301/302 (redirect), SSL errors → return 502 with descriptive message.

**3.4 Create/Update Character PUT Endpoint (if missing)**
- Verify `PUT /api/characters/{characterId}` exists in `app/api/characters/[id]/route.ts`.
- Ensure it validates ownership (user can only update own characters).
- Ensure it replaces entire character (not partial update).
- If missing or incomplete, implement to accept full `Character` object and validate against existing validators.

**3.5 Create UI: Import Modal Component**
- New file: `lib/components/ImportCharacterModal.tsx`.
  - Modal component with backdrop and close button.
  - Display form with URL input field inside modal.
  - On input, validate URL in real-time and show inline feedback (green checkmark for valid, red error for invalid).
  - On submit: POST to `/api/characters/import`, show loading state (spinner or disabled button).
  - If successful (no duplicate): show success toast, close modal, refresh character list.
  - If duplicate returned: show nested confirmation dialog (modal within modal).
    - Button 1: "Abort" (dismiss inner dialog, return to URL input).
    - Button 2: "Overwrite" (submit PUT request to `/api/characters/{characterId}`, show loading, then close modal and refresh list).
  - If error: display error message with actionable text inline (don't close modal; allow user to edit and retry).
  - Props: `isOpen: boolean`, `onClose: () => void`, `onSuccess?: () => void`.

**3.6 Update Character List Page (optional)**
- Add "Import Character" button/link in `app/characters/page.tsx` to navigate to import flow.

#### Step 3.7: Codacy Analysis (MANDATORY — Immediate After Each File Edit)

After each implementation substep (3.1, 3.2, 3.3, 3.5), run analysis immediately:
```bash
codacy-cli analyze --rootPath /home/doug/dev/session-combat --file lib/utils/dndBeyondImporter.ts
codacy-cli analyze --rootPath /home/doug/dev/session-combat --file lib/utils/characterTransformer.ts
codacy-cli analyze --rootPath /home/doug/dev/session-combat --file app/api/characters/import/route.ts
codacy-cli analyze --rootPath /home/doug/dev/session-combat --file lib/components/ImportCharacterModal.tsx
```

Address any issues found before proceeding to next substep.

#### Step 4: Make Tests Pass (Implementation)

Run tests and implement until all pass:
```bash
npm run test:integration  # Integration tests
npm run test:e2e           # Playwright E2E tests
```

Verify all tests transition from RED to GREEN.

#### Step 5: Refactor (REFACTOR State — No Behavior Change)

- **Duplication check**: Search for duplicated URL parsing, HTTP fetch logic, or character validation.
  - Reuse existing validators from `lib/types.ts`.
  - Extract common error handling into a utility if needed.
- **Code review for clarity**: Ensure function names, variable names, and comments are clear.
- **Test coverage**: Verify parameterized tests cover edge cases and happy paths.
- **Simplify complex logic**: If transformer or importer exceeds ~100 lines, extract sub-functions.
- **Remove dead code**: Delete commented-out code and unused imports.

#### Step 6: Pre-PR Duplication & Complexity Review (MANDATORY)

- **Duplication within changeset**:
  - Check for duplicate error handling (consolidate to utility if >3 occurrences).
  - Check for duplicate URL parsing logic (should be single function).
  - Check for duplicate character validation (should reuse `lib/types.ts` validators).
- **Duplication against existing code**:
  - Search repo for existing URL validators, HTTP fetch utilities, character mappers.
  - Reuse if available; justify any new utilities.
- **Complexity**:
  - Ensure `transformDndBeyondToCharacter()` is <40 lines; if larger, extract sub-functions (e.g., `mapAbilityScores()`, `mapClasses()`).
  - Ensure API route handler is <80 lines; if larger, extract service logic into `lib/services/characterImport.ts`.
  - Cyclomatic complexity: flatten nested conditionals where possible; use early returns.
- **Static analysis & linting**:
  ```bash
  npm run lint
  npm run format
  ```
  - Address all linting issues.
- **Run full test suite**:
  ```bash
  npm run test:integration
  npm run test:e2e
  ```
  - Confirm all tests pass in CI environment (use GitHub Actions output if available).

#### Step 7: Final Codacy Analysis & Summary

After all implementation steps complete, run final comprehensive analysis:
```bash
codacy-cli analyze --upload --api-token <TOKEN> --commit <SHA>
```
- Or use local analysis if CLI is installed.
- Address any remaining Codacy issues in new/modified files.
- Prioritize: security → complexity → style.
- This is a final check; most issues should be resolved via immediate post-edit checks in Step 3.7.

#### Step 8: Docs & Artifact Updates

- Update `docs/improvements.md`: add entry for #39 (character import from D&D Beyond).
- Update `README.md` (optional): add D&D Beyond import to feature list.
- Add API documentation to `docs/plan/tickets/39-plan.md` (this file, post-implementation).

#### Step 9: Commit & Push

```bash
git add docs/plan/tickets/39-plan.md app/api/characters/import/route.ts app/characters/import/page.tsx lib/utils/dndBeyondImporter.ts lib/utils/characterTransformer.ts tests/integration/characterImport.integration.test.ts tests/unit/utils/dndBeyondImporter.test.ts tests/unit/utils/characterTransformer.test.ts tests/e2e/character-import.spec.ts tests/unit/data/dnd-beyond-urls.json tests/unit/data/dnd-beyond-character-samples.json tests/integration/data/dnd-beyond-responses.json docs/improvements.md
git commit -S -m "feat(import): add D&D Beyond character import with duplicate detection (#39)"
git push -u origin feature/39-dnd-beyond-import
```

#### Step 10: Open PR

- Reference issue #39 in PR description.
- Include link to this plan file.
- Request review from CODEOWNERS.
- Ensure all CI checks pass (linting, tests, Codacy).

---

## 6) Effort, Risks, Mitigations

### Effort
- **Estimate**: M (Medium, ~6–10 dev-hours)
  - URL validation & parsing: ~1h
  - Character transformation & validation: ~2h
  - API endpoint implementation: ~1.5h
  - UI (import page/modal): ~2–3h
  - Tests (unit, integration, E2E): ~2–3h
  - Documentation, refactor, Codacy checks: ~1h

### Risks

| Risk | Probability | Impact | Mitigation | Fallback |
|------|-------------|--------|-----------|----------|
| D&D Beyond HTML structure changes break scraping | Medium | High | Use version-agnostic parsing (meta tags, JSON-LD, API endpoint if available). Add integration test with real D&D Beyond URL (on CI schedule). | Implement D&D Beyond official API integration or provide manual import template. |
| Network timeout or D&D Beyond unavailability | High | Medium | Implement configurable timeout (10s default), retry logic (2 retries), and graceful error messages. Log failures for monitoring. | Show user-friendly error: "D&D Beyond is unavailable; please try again later." |
| Duplicate detection by name is too strict (exact vs. case-insensitive) | Medium | Low | Clarify product requirement (assume case-insensitive). Add warning if importing character with same name as existing. | Add optional fuzzy matching (e.g., Levenshtein distance) in future iteration. |
| E2E flakiness (timing, network) | Medium | Medium | Use explicit waits (`waitForSelector`, `waitForLoadState`) in Playwright. Mock D&D Beyond HTTP responses in integration tests. | Use `page.once('load')` or other lifecycle hooks for stability. |
| Rate limiting / abuse | Low | Medium | Implement per-user rate limit (e.g., 10 imports/hour). Log import frequency by user. | Add CAPTCHA or user confirmation for suspicious import patterns. |

---

## 7) File-Level Change List

### New Files

1. **`lib/utils/dndBeyondImporter.ts`**
   - Purpose: URL validation, HTTP fetch, character data extraction from D&D Beyond.
   - Functions: `validateDndBeyondUrl()`, `fetchCharacterFromUrl()`.
   - ~100–150 lines.

2. **`lib/utils/characterTransformer.ts`**
   - Purpose: Transform raw D&D Beyond data to session-combat `Character` interface.
   - Functions: `transformDndBeyondToCharacter()`.
   - ~80–120 lines.

3. **`app/api/characters/import/route.ts`**
   - Purpose: API endpoint for character import.
   - Functions: `POST` handler with duplicate detection and overwrite support.
   - ~80–120 lines.

4. **`lib/components/ImportCharacterModal.tsx`**
   - Purpose: Modal UI for import workflow (opens from character list page).
   - Features: URL input, validation feedback, loading state, duplicate confirmation dialog, error display, dismiss button.
   - ~150–250 lines.

5. **`tests/integration/characterImport.integration.test.ts`**
   - Purpose: Integration tests for import API endpoint.
   - ~300–400 lines (setup + 10–15 test cases).

6. **`tests/unit/utils/dndBeyondImporter.test.ts`**
   - Purpose: Unit tests for URL validation and fetching.
   - ~100–150 lines (parameterized).

7. **`tests/unit/utils/characterTransformer.test.ts`**
   - Purpose: Unit tests for character transformation.
   - ~150–200 lines (parameterized).

8. **`tests/e2e/character-import.spec.ts`** (or extend existing character test)
   - Purpose: End-to-end Playwright tests for import UI flow.
   - ~200–300 lines (5–8 test scenarios).

9. **`tests/unit/data/dnd-beyond-urls.json`**
   - Purpose: Parameterized test data for URL validation.
   - Format: Array of `{ url: string; valid: boolean; characterId?: string; error?: string }`.
   - ~20–30 entries.

10. **`tests/unit/data/dnd-beyond-character-samples.json`**
    - Purpose: Parameterized test data for character transformation.
    - Format: Array of `{ raw: RawCharacterData; expected: Character; description: string }`.
    - ~5–10 sample characters.

11. **`tests/integration/data/dnd-beyond-responses.json`**
    - Purpose: Mock D&D Beyond HTTP responses for integration tests.
    - Format: Array of `{ characterId: string; response: string; status: number; description: string }`.
    - ~10–15 mock responses (success, 404, timeout, malformed).

### Modified Files

1. **`app/api/characters/[id]/route.ts`**
   - If `PUT` endpoint missing: add full character replacement logic.
   - Otherwise: verify ownership check and full replacement behavior.
   - ~5–20 line addition (if needed).

2. **`app/characters/page.tsx`**
   - Add state to manage ImportCharacterModal visibility.
   - Add "Import Character" button that triggers modal open.
   - Import and render `<ImportCharacterModal />` component.
   - On modal success/cancel, refresh character list and close modal.
   - ~10–15 line addition.

3. **`docs/improvements.md`**
   - Add entry for #39 D&D Beyond import feature.
   - ~2–3 lines.

4. **`README.md`** (optional)
   - Add D&D Beyond import to feature list.
   - ~1–2 lines.

---

## 8) Test Plan

### Parameterized Test Strategy

**Goal**: Ensure comprehensive coverage with minimal code duplication.

#### Unit Tests: URL Validation

- **Data source**: `tests/unit/data/dnd-beyond-urls.json`
- **Approach**: `@ParameterizedTest` (Jest) with data provider.
- **Test cases**:
  - Valid URLs: standard format, with query params, trailing slash.
  - Invalid URLs: wrong domain, malformed, missing character ID.
  - Edge cases: very long URLs, special characters in ID, international domains.
- **Assertions**: Validate `characterId` extraction, error messages.

#### Unit Tests: Character Transformation

- **Data source**: `tests/unit/data/dnd-beyond-character-samples.json`
- **Approach**: Parameterized test with JSON fixtures.
- **Test cases**:
  - Happy path: full D&D Beyond character data → correct `Character` object.
  - Missing fields: race/background/alignment optional → defaults applied.
  - Classes: single vs. multiclass → correctly mapped and validated.
  - Ability scores: all 6 stats present → correct mapping.
  - Skills/traits/actions: present and mapped, or absent → empty defaults.
  - **String normalization edge cases**:
    - Character name "Aragorn" vs "Aragorn " (trailing space) → both normalize to "Aragorn"
    - Character name "Bob" vs "bob" (case variation) → both normalize and compare as case-insensitive
    - Character name with unicode ("Jöhn" vs "John") → normalized appropriately
- **Assertions**: Transformed character passes existing validators from [lib/types.ts](lib/types.ts#L102): `validateCharacterClasses()`, `isValidRace()`, `isValidClass()`.

#### Integration Tests: API Endpoint

- **Data source**: Mock D&D Beyond responses in `tests/integration/data/dnd-beyond-responses.json` + `nock` HTTP mocking.
  - **Note on parameterization**: Integration tests use `nock` library to intercept and mock HTTP requests (not parameterized in traditional sense; instead, test data is mock response definitions in JSON). This approach is appropriate for HTTP testing and standard in the industry.
- **Approach**: Start Next.js server in test container, use `fetch()` to test endpoint.
- **Test scenarios**:
  1. **Successful import**: POST valid URL → character saved, 201 response.
  2. **Duplicate detection**: POST same character twice → second returns 200 with `isDuplicate: true` (case-insensitive name comparison).
  3. **Duplicate abort**: User aborts overwrite → existing character unchanged, 200 response.
  4. **Duplicate overwrite**: User confirms overwrite → PUT replaces character, 200 response.
  5. **Concurrent imports**: POST same character URL twice concurrently → both succeed without race condition or duplication error.
  6. **Invalid URL**: POST invalid URL → 400 error.
  7. **D&D Beyond 404**: Mock D&D Beyond returns 404 → API returns 404 with "character not found" message.
  8. **D&D Beyond timeout**: Mock network timeout → API returns 502 with "D&D Beyond unreachable" message.
  9. **D&D Beyond rate limiting**: Mock 429 response → API returns 502 with "D&D Beyond rate limit exceeded" message.
  10. **D&D Beyond redirect**: Mock 301/302 redirect → API returns 502 with "D&D Beyond URL redirected" message.
  11. **SSL/certificate error**: Mock SSL failure → API returns 502 with "D&D Beyond connection error" message.
  12. **Malformed response**: D&D Beyond returns invalid JSON → API returns 502 with parsing error.
  13. **Unauthorized**: No auth token → 401 response.
  14. **Missing URL**: POST without `url` field → 400 error.
- **Assertions**: Response status, error messages, character presence in DB, duplicate flag accuracy, name normalization (trimmed, case-insensitive).

#### E2E Tests: Import Workflow (Playwright)

- **Approach**: Use real Next.js instance with mock D&D Beyond HTTP responses (via nock). Modal opens from character list page.
- **Test scenarios**:
  1. **Happy path**: User opens character list, clicks "Import Character" button, modal opens. Enters valid URL, submits, modal closes, character appears in list.
  2. **Duplicate abort**: User imports character A, opens import modal again, imports same character, sees duplicate confirmation dialog, clicks "Abort", dialog closes and returns to URL input (modal still open). Character list shows original character only.
  3. **Duplicate overwrite**: User imports character A, opens import modal again, imports same character, sees duplicate confirmation dialog, clicks "Overwrite", character replaced in DB, modal closes, character list shows updated stats.
  4. **Invalid URL error**: User enters invalid URL in modal, sees inline error message below input, modal remains open. User can edit and retry.
  5. **Network error**: Mock D&D Beyond as unreachable, user sees "D&D Beyond unavailable" message, modal remains open.
  6. **Modal dismiss**: User opens modal, clicks X or outside modal area, modal closes without importing.
  7. **Concurrent rapid imports**: User imports character A, immediately opens modal again and imports character B while first import is still in progress. Both succeed and appear in character list without race conditions.
  8. **Redirect integrity**: After successful import, user is redirected appropriately (modal closes, list updated). User navigates back to import modal; state is clean (no lingering data from previous import).
- **Assertions**: Modal visibility, UI elements present, navigation correct, character list accuracy, error messages visible, state management consistent.

#### Test Coverage Summary

| Category | Total Test Cases | Parameterized? | Expected Pass Rate |
|----------|-----------------|----------------|-------------------|
| URL Validation (Unit) | 8–10 | Yes | 100% |
| Character Transformation (Unit) | 10–12 | Yes | 100% |
| API Endpoint (Integration) | 10 | No (nock mocking) | 100% |
| Import Workflow (E2E) | 5 | No | 100% |
| **Total** | **~35–40** | | **100%** |

---

## 9) Rollout & Monitoring Plan

### Feature Flags
- **No feature flag required** for this release. Character import is a new, independent capability with no impact on existing workflows.
- **Future consideration**: If D&D Beyond integration becomes load-intensive, add flag `spcs.character.dndbeyond_import.enabled` (default ON after validation).

### Deployment Steps

1. **Pre-deployment**:
   - All tests pass locally and in CI.
   - Codacy and linting checks pass.
   - Code reviewed and approved.

2. **Deployment** (standard Next.js deployment):
   - Merge PR to `main`.
   - Trigger CI/CD pipeline (GitHub Actions).
   - Deploy to staging: verify functionality in staging environment.
   - Deploy to production (blue-green or canary if infrastructure supports).

3. **Post-deployment**:
   - Monitor import success rate and latency.
   - Alert on D&D Beyond connectivity issues.

### Dashboards & Key Metrics

- **Import Success Rate**: `(successful_imports / total_import_attempts) * 100` (target: >95%).
- **Average Import Latency**: Mean time to fetch + transform + save character (target: <3s).
- **Duplicate Resolution Rate**: % of imports triggering duplicate dialog (inform UX improvements).
- **Error Rate by Type**: % of network errors, parsing errors, invalid URLs, etc.

### Alerts

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Import success rate < 90% | Consecutive 1-hour window | Page on-call engineer; investigate D&D Beyond API status. |
| Average latency > 5s | Consecutive 10 imports | Review network timeout, add caching or async fetch if needed. |
| D&D Beyond 404 rate > 10% | Consecutive 1-hour window | Investigate HTML/API structure changes; may need parser update. |

### Rollback Procedure

If critical issues arise:

1. **Revert commit**:
   ```bash
   git revert <commit-sha> --no-edit
   git push origin main
   ```

2. **Redeploy**:
   - Trigger CI/CD to deploy reverted code.

3. **Communicate**:
   - Notify users of temporary unavailability via UI banner.
   - Post incident summary.

4. **Investigation**:
   - Root cause analysis in post-incident review.
   - Plan hotfix or enhanced validation before redeployment.

**Note**: Rollback is low-risk (no schema changes, no data migrations). Feature can be safely disabled or reverted without affecting existing character data.

---

## 10) Handoff Package

- **GitHub issue**: [#39](https://github.com/dougis-org/session-combat/issues/39)
- **Branch**: `feature/39-dnd-beyond-import`
- **Plan file**: `docs/plan/tickets/39-plan.md`
- **Key commands**:
  - Build: `npm run build`
  - Test integration: `npm run test:integration`
  - Test E2E: `npm run test:e2e`
  - Lint: `npm run lint`
- **Known gotchas**:
  - D&D Beyond HTML structure may change; monitor and update selectors/parsers if scraping approach used.
  - Rate limiting on D&D Beyond side may throttle imports; implement exponential backoff if needed.
  - Timezone/date handling: D&D Beyond may store dates in different timezone; normalize on import.
  - Character name conflicts: Case-insensitive duplicate detection may catch "Aragorn" and "aragorn"; confirm UX is acceptable.

---

## 11) Traceability Map

| Criterion # | Acceptance Criterion | Requirement | Milestone | Task(s) | Flag(s) | Test(s) |
|---|---|---|---|---|---|---|
| 1 | URL Input & Validation | REQ-URL-VALIDATION | NA | IMPL-URL-PARSER, IMPL-URL-VALIDATOR | None | Unit + Integration |
| 2 | Character Fetch | REQ-FETCH | NA | IMPL-IMPORTER, IMPL-TRANSFORMER | None | Unit + Integration |
| 3 | Duplicate Detection | REQ-DUPLICATE-CHECK | NA | IMPL-API-DUPLICATE-LOGIC | None | Integration + E2E |
| 4 | Duplicate Handling (New) | REQ-DUPLICATE-NEW | NA | IMPL-API-IMPORT, IMPL-UI-FLOW | None | Integration + E2E |
| 5 | Duplicate Handling (Overwrite) | REQ-DUPLICATE-OVERWRITE | NA | IMPL-API-OVERWRITE, IMPL-UI-DIALOG | None | Integration + E2E |
| 6 | Error Handling | REQ-ERROR-HANDLING | NA | IMPL-ERROR-MESSAGES, IMPL-GRACEFUL-FAILURES | None | Integration + E2E |
| 7 | Success Feedback | REQ-SUCCESS-UX | NA | IMPL-UI-REDIRECT, IMPL-UI-TOAST | None | E2E |
| 8 | Integration Tests | REQ-TEST-COVERAGE | NA | IMPL-INTEGRATION-TESTS | None | Integration |

**Every AC has been mapped.** No unmapped requirements or blank cells.

---

## Implementation Notes

### D&D Beyond Data Extraction Strategy (TBD)

The exact approach for extracting character data from D&D Beyond will be determined during implementation (Step 3.1):

1. **Preferred**: D&D Beyond public character API endpoint (if available and documented).
2. **Fallback**: JSON-LD metadata in HTML `<head>` (if D&D Beyond includes structured data).
3. **Last resort**: HTML scraping using regex or lightweight parser (e.g., jsdom for DOM access).

Research and document findings in PR description before implementation.

### Character Field Mapping (TBD)

The exact mapping of D&D Beyond character fields to session-combat `Character` interface will be refined during implementation (Step 3.2). Create a mapping table in code comments and document assumptions for unmapped/optional fields.

---

**End of Plan Document**
