### 1) Summary

- Ticket: 40
- One-liner: Restore stable UI flows by aligning API response shapes and auth protections so pages no longer crash and styles render correctly across core routes.
- Related milestone(s): NA
- Out of scope:
  - Redesigning UI layouts or new feature development
  - Schema changes to MongoDB collections
  - New offline-mode features beyond existing behavior
- Requirement tags: REQ-40-UI-STABILITY, REQ-40-API-SHAPE, REQ-40-AUTH-GUARD

### 2) Assumptions & Open Questions

- Assumptions:
  - Single-slice fix is appropriate (API response normalization + auth consistency + UI fetch handling) because all symptoms stem from a shared contract mismatch and stubbed endpoints.
  - Implementer will confirm clean workspace and sync main locally (no terminal tooling available here).
  - Codacy MCP tools are unavailable in this session; follow troubleshooting steps in Section 10 before running analysis.
- Open questions (blocking -> need answers):
  1. Should the client continue to accept both legacy array responses and new `{ data, source, syncStatus }` responses for backward compatibility, or is a hard break acceptable?
  2. Should `/api/encounters` require authentication (matching `/api/encounters/[id]`) or remain public for demo use?

### 3) Acceptance Criteria (normalized)

1. Core authenticated pages (Encounters, Characters, Parties) load without client-side exceptions and render empty states when no data is available.
2. API list endpoints for encounters, characters, parties, and combat return a consistent, documented response shape that the UI handles safely.
3. Protected API endpoints return 401 when unauthenticated and data is scoped to the authenticated user when present.
4. Login flow redirects to the home page without showing a client-side exception screen.
5. Manual verification confirms styling renders correctly on login and post-login routes.

### 4) Approach & Design Brief

- Current state (key code paths)
  - UI list pages expect array responses and call `.map()` directly (e.g., [app/encounters/page.tsx](app/encounters/page.tsx), [app/characters/page.tsx](app/characters/page.tsx), [app/parties/page.tsx](app/parties/page.tsx)).
  - Some list API routes are stubbed and return `{ data: [], source: 'remote' }` without auth ([app/api/parties/route.ts](app/api/parties/route.ts), [app/api/characters/route.ts](app/api/characters/route.ts), [app/api/combat/route.ts](app/api/combat/route.ts)).
  - Offline helpers return `{ data, source, syncStatus }` ([lib/api/offlineHandlers.ts](lib/api/offlineHandlers.ts)), while UI expects arrays.
  - Auth guard uses `requireAuth()` for `[id]` routes but not list routes (e.g., [app/api/encounters/[id]/route.ts](app/api/encounters/[id]/route.ts)).
- Proposed changes (high-level architecture & data flow)
  - Normalize API list responses by implementing list routes using `offlineGet()` and requiring auth for user-scoped data.
  - Add a small shared client-side response normalizer to accept either array or `{ data }` shapes and update list pages to use it.
  - Align list endpoints with the offline-first design in [docs/OFFLINE_MODE.md](docs/OFFLINE_MODE.md).
- Data model / schema (migrations/backfill/versioning)
  - No schema changes. Use existing `LocalStore` and MongoDB collections scoped by `userId`.
- APIs & contracts (new/changed endpoints + brief examples)
  - `GET /api/encounters|characters|parties|combat` returns `{ data: T[], source: 'local'|'remote'|'merged', syncStatus?: 'synced'|'pending' }` and remains backward-compatible with array-only responses via client normalization.
- Feature flags (name(s), default OFF, kill switch rationale)
  - No new flags. Continue to honor `NEXT_PUBLIC_OFFLINE_MODE_ENABLED` for offline logic in [lib/api/offlineHandlers.ts](lib/api/offlineHandlers.ts).
- Config (new env vars + validation strategy)
  - No new environment variables. Existing `NEXT_PUBLIC_OFFLINE_MODE_ENABLED` and `NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL` remain authoritative.
- External deps (libraries/services & justification)
  - No new dependencies.
- Backward compatibility strategy
  - Client-side normalizer accepts both legacy array responses and `{ data }` response bodies.
- Observability (metrics/logs/traces/alerts)
  - Reuse existing console debug statements; add focused logs in list API routes for response shape mismatches if needed.
- Security & privacy (auth/authz, PII handling, rate limiting)
  - Enforce `requireAuth()` on list endpoints to prevent unauthenticated access and ensure `userId` scoping for DB queries.
- Alternatives considered (concise)
  - Changing all APIs to return raw arrays only (rejected: conflicts with offline response contract and existing docs).

### 5) Step-by-Step Implementation Plan (TDD)

- **Test additions first** (unit, integration, contract, regression) ensuring initial FAIL
  - **Parameterized Test Requirements** (default for all multi-scenario tests):
    - Use external data providers (classes, JSON, CSV) for: multiple input/output combinations, boundary conditions, edge case variations, error conditions, state transitions
    - Data sources: Provider classes in `*/test/**/data/` or `*/test/**/fixtures/`; JSON/CSV in `*/test/resources/test-data/`
    - Cite data source explicitly (e.g., `@MethodSource("provideValidKeys")` → `CacheKeyTestDataProvider.validKeys()`)
    - Reserve simple tests ONLY for: single smoke tests, unique architectural validations, singular setup/teardown
  - Add unit tests for a new response normalizer using JSON cases: (New) [tests/unit/data/api-response-test-cases.json](tests/unit/data/api-response-test-cases.json) + (New) [tests/unit/utils/apiResponse.test.ts](tests/unit/utils/apiResponse.test.ts).
  - Extend integration tests to ensure unauthenticated requests to list routes return 401: update [tests/integration/api.integration.test.ts](tests/integration/api.integration.test.ts).
- Incremental implementation order (domain → service → repo → controller/API → migrations → flag wiring)
  1. Create `normalizeArrayResponse()` helper in (New) [lib/utils/apiResponse.ts](lib/utils/apiResponse.ts) to extract arrays from either `T[]` or `{ data: T[] }`.
  2. Update list pages to use the helper when reading API responses: [app/encounters/page.tsx](app/encounters/page.tsx), [app/characters/page.tsx](app/characters/page.tsx), [app/parties/page.tsx](app/parties/page.tsx).
  3. Replace stub list API routes with offline-first handlers + auth enforcement:
     - [app/api/encounters/route.ts](app/api/encounters/route.ts)
     - [app/api/characters/route.ts](app/api/characters/route.ts)
     - [app/api/parties/route.ts](app/api/parties/route.ts)
     - [app/api/combat/route.ts](app/api/combat/route.ts)
  4. Ensure list routes scope DB reads by `userId` via `requireAuth()` and `storage` methods.
- Refactor pass (no behavior change)
  - Remove any redundant response-shape checks in pages once helper is in place.
- **Pre-PR Duplication & Complexity Review** (MANDATORY):
  - Review for duplication (within changeset and against existing code)
  - Extract repeated logic into utilities/helpers
  - Simplify methods: <20-30 lines, reduce cyclomatic complexity, flatten nested conditionals
  - Remove dead code, unused imports, commented blocks
  - Eliminate over-engineering (speculative abstractions, unnecessary indirection, premature optimization)
  - Run static analysis (Codacy, linters), address findings
  - Apply formatters (`./gradlew spotlessApply`)
  - Document remaining complexity with rationale
- Docs & artifact updates (README, CHANGELOG, OpenAPI, drift script)
  - Update [CHANGELOG.md](CHANGELOG.md) with a patch entry describing API response normalization and auth enforcement.
  - Verify docs remain accurate: [docs/OFFLINE_MODE.md](docs/OFFLINE_MODE.md).

### 6) Effort, Risks, Mitigations

- Effort: S (Small) — small surface area but spans UI + API routes + tests.
- Risks (ranked) with mitigation & fallback per item
  1. **Risk:** Response shape mismatch still slips through on a route not updated. **Mitigation:** Centralize normalization helper and update all list pages. **Fallback:** Add defensive guards in each page temporarily.
  2. **Risk:** Auth enforcement blocks expected demo flows. **Mitigation:** Confirm decision in Open Questions #2; document expected behavior. **Fallback:** Add explicit allowlist for demo endpoints (if approved).
  3. **Risk:** Offline handlers rely on `localStorage` in server context. **Mitigation:** Validate current runtime behavior and add tests to cover server response paths. **Fallback:** return remote-only data when `localStorage` is unavailable.

### 7) File-Level Change List

**Production**
- [lib/api/offlineHandlers.ts](lib/api/offlineHandlers.ts): ensure list handlers are used by all list endpoints (no functional change unless guard logic added).
- (New) [lib/utils/apiResponse.ts](lib/utils/apiResponse.ts): normalize list API responses to a consistent array.
- [app/api/encounters/route.ts](app/api/encounters/route.ts): require auth, scope by `userId`, use `offlineGet/POST/PUT/DELETE` with storage for remote fetch.
- [app/api/characters/route.ts](app/api/characters/route.ts): replace stub with auth + offline handlers + storage.
- [app/api/parties/route.ts](app/api/parties/route.ts): replace stub with auth + offline handlers + storage.
- [app/api/combat/route.ts](app/api/combat/route.ts): replace stub with auth + offline handlers or return consistent `{ data }` shape if combat is single-record.
- [app/encounters/page.tsx](app/encounters/page.tsx): use response normalizer.
- [app/characters/page.tsx](app/characters/page.tsx): use response normalizer.
- [app/parties/page.tsx](app/parties/page.tsx): use response normalizer.

**Tests**
- (New) [tests/unit/data/api-response-test-cases.json](tests/unit/data/api-response-test-cases.json): array vs `{ data }` variants.
- (New) [tests/unit/utils/apiResponse.test.ts](tests/unit/utils/apiResponse.test.ts): parameterized tests for `normalizeArrayResponse()`.
- [tests/integration/api.integration.test.ts](tests/integration/api.integration.test.ts): add 401 checks for list endpoints.

**Docs**
- [CHANGELOG.md](CHANGELOG.md): add entry for response normalization + auth enforcement.

### 8) Test Plan

**Parameterized Test Strategy** (see Section 5 for full requirements):
- Use data provider classes for complex objects/domain-specific fixtures
- Use JSON files for API contracts, request/response samples, config variations
- Use CSV files for tabular boundary cases, numeric ranges, state transitions
- Reserve simple tests for singular smoke tests, unique architectural validations, lifecycle hooks

**Test Coverage by Category:**
- Happy paths: Parameterized unit tests for `normalizeArrayResponse()` using [tests/unit/data/api-response-test-cases.json](tests/unit/data/api-response-test-cases.json).
- Edge/error cases: Parameterized unit tests for malformed responses (null, object without `data`) in [tests/unit/utils/apiResponse.test.ts](tests/unit/utils/apiResponse.test.ts).
- Regression: Integration test ensures `GET /api/characters|parties|encounters|combat` returns 401 unauthenticated in [tests/integration/api.integration.test.ts](tests/integration/api.integration.test.ts).
- Contract: Manual validation of UI list pages consuming `{ data }` response shape.
- Performance (if relevant): Not applicable (no perf-critical paths changed).
- Security/privacy: Integration test for auth enforcement on list endpoints; verify no user data leaks by scoping to `userId`.
- Manual QA checklist:
  - Login, then navigate to Encounters, Characters, Parties; confirm no client-side exceptions.
  - Verify empty state renders for each list when no data exists.
  - Confirm styling on login and authenticated pages is intact.

### 9) Rollout & Monitoring Plan

- Flag(s) & default state: No new flags; honor `NEXT_PUBLIC_OFFLINE_MODE_ENABLED` as existing toggle.
- Deployment steps (progressive enable / canary): Standard deploy; no gradual rollout required for a contract fix.
- Dashboards & key metrics: Monitor client error rate in browser console; check 401 rates on list endpoints post-deploy.
- Alerts (conditions + thresholds): Spike in `401` for authenticated sessions; any new client-side exceptions.
- Success metrics / KPIs: Zero client-side exceptions on list pages; successful navigation across core flows.
- Rollback procedure (exact commands/steps): Revert the PR; redeploy previous build.

### 10) Handoff Package

- Jira link: NA (GitHub issue 40)
- Branch & (future) PR name: feature/40-broken-ui-styles; PR: "fix: stabilize list APIs and UI response handling"
- Plan file path: [docs/plan/tickets/40-plan.md](docs/plan/tickets/40-plan.md)
- Key commands (build/test/drift): `npm run lint`, `npm run test`, `npm run test:integration`, `npm run build`.
- Known gotchas / watchpoints:
  - Codacy MCP tools missing in this session: reset MCP, verify Copilot > MCP settings at https://github.com/settings/copilot/features (or org settings), and contact Codacy support if still unavailable.

### 11) Traceability Map

| Criterion # | Requirement | Milestone | Task(s) | Flag(s) | Test(s) |
| ----------- | ----------- | --------- | ------- | ------- | ------- |
| 1 | REQ-40-UI-STABILITY | NA | TASK-40-UI-NORMALIZE | NEXT_PUBLIC_OFFLINE_MODE_ENABLED | Unit + Manual QA |
| 2 | REQ-40-API-SHAPE | NA | TASK-40-API-ALIGN | NEXT_PUBLIC_OFFLINE_MODE_ENABLED | Unit + Integration |
| 3 | REQ-40-AUTH-GUARD | NA | TASK-40-AUTH-LIST | NEXT_PUBLIC_OFFLINE_MODE_ENABLED | Integration |
| 4 | REQ-40-UI-STABILITY | NA | TASK-40-AUTH-FLOW | NEXT_PUBLIC_OFFLINE_MODE_ENABLED | Manual QA |
| 5 | REQ-40-UI-STABILITY | NA | TASK-40-STYLE-VERIFY | NEXT_PUBLIC_OFFLINE_MODE_ENABLED | Manual QA |
