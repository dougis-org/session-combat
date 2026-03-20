## 1. Execution

- [x] 1.1 Confirm a clean starting point by checking out `main`, pulling the latest remote changes, and creating a feature branch for `increase-test-coverage`.
- [x] 1.2 Record ownership in the implementation notes: implementer, intended reviewer, explicit human approval expectation before merge, and the linkage to GitHub issue `#72`.
- [x] 1.3 Reproduce the current baseline with the coverage-producing suites and capture the local totals that correspond to Codacy using `npm run test:unit -- --coverageReporters=json-summary --coverageReporters=lcov` and `npm run test:integration -- --coverage --coverageReporters=json-summary --coverageReporters=lcov`.
- [x] 1.4 Document which CI jobs currently contribute LCOV to Codacy and which suites validate behavior without contributing coverage.
- [x] 1.5 Audit the current Playwright route coverage and record the already-exercised client surfaces reached through `/register`, `/login`, `/characters`, `/parties`, `/monsters/import`, `/encounters`, and `/combat`.

## 2. Coverage Governance

- [x] 2.1 Add or update project documentation for the verified baseline, the comparison method between local artifacts and Codacy, and the current non-instrumented suites.
- [x] 2.2 Update the `Build & Test` implementation only as needed to keep coverage inputs reproducible and auditable without changing the denominator implicitly.
- [x] 2.3 If any `collectCoverageFrom` or upload-input change is proposed, document the before-and-after denominator impact before code review.

## 3. Wave 1 High-Risk Coverage

- [x] 3.1 Write failing tests first for undercovered authenticated API routes and shared server helpers, starting with auth, character, party, encounter, and combat route behavior.
- [x] 3.2 Implement only the minimum code or test harness changes needed to make the new API and helper tests pass without weakening existing assertions.
- [x] 3.3 Add focused coverage for `lib/auth.ts`, `lib/db.ts`, `lib/storage.ts`, and adjacent high-centrality helpers where the new tests expose missing seams or edge cases.
- [x] 3.4 Review the new tests for duplication, brittle fixtures, and unnecessary mocks before moving to the next wave.

## 4. Wave 2 Application and Component Coverage

- [ ] 4.1 Write failing tests first for the highest-value client and page flows that remain near 0% coverage, prioritizing encounter, monster, and combat-related logic over low-risk files.
- [ ] 4.2 Extract or isolate test seams in large UI files only where necessary to keep tests deterministic and maintainable.
- [ ] 4.3 Add targeted tests for shared React components and hooks that sit on critical flows, including auth-protected rendering, storage-backed behavior, and combat-related forms or modals.
- [ ] 4.4 Prioritize high-value application logic and component test harnesses once Wave 1 fundamentals are in place.
- [ ] 4.5 Evaluate whether selected E2E scenarios need instrumentation follow-up, but do not treat non-instrumented Playwright jobs as coverage contributors.

## 5. Validation

- [x] 5.1 Re-run the affected unit and integration suites with coverage and confirm that the new totals reflect exercised code rather than denominator-only changes.
- [x] 5.2 Run `npm run lint`, `npm run build`, `npm run test:unit`, and `npm run test:integration`, and record the resulting coverage delta for the milestone.
- [x] 5.3 If CI, review comments, or security findings block progress, stop scope expansion, fix the blocker, and revalidate the last known-good coverage baseline before continuing.

## 6. PR and Merge

- [x] 6.1 Prepare a PR that references GitHub issue `#72` and summarizes the verified baseline, the modules covered in this milestone, the measured coverage delta, and any denominator decisions.
- [x] 6.2 Resolve CI failures, review comments, and security findings before requesting final approval; do not merge while any blocking issue remains open.
- [ ] 6.3 Enable auto-merge only after required approvals are present and all required checks are green.

## 7. Post-Merge

- [ ] 7.1 Update any user-facing or contributor-facing docs affected by the new coverage workflow or milestone guidance.
- [ ] 7.2 Sync approved spec deltas back into `openspec/specs/` during the archive workflow and verify the archived change captures the final accepted behavior.
- [ ] 7.3 Archive the change through the OpenSpec workflow once implementation is merged.
- [ ] 7.4 Prune merged local branches after the archive step is complete.