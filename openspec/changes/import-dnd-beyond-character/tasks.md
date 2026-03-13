# Tasks

## 1. Execution

- [x] 1.1 Create a feature branch for `import-dnd-beyond-character`, confirm proposal/design/spec approval, and record implementer, reviewer, and required human approval in the PR description or change log
- [x] 1.2 Add failing tests first for the import contract: parser/normalizer unit tests, import route integration tests, and characters page conflict-flow coverage
- [x] 1.3 Implement a dedicated authenticated import route in `app/api/characters/import/route.ts` that accepts a public D&D Beyond URL and returns success, conflict, or failure results
- [x] 1.4 Implement import utilities under `lib/` to fetch, parse, and normalize public D&D Beyond character data into the local `Character` model
- [x] 1.5 Implement normalization warning collection so coerced or defaulted imported values are returned to the client in a user-visible summary
- [x] 1.6 Implement authoritative same-name conflict detection and explicit overwrite handling without merge semantics in the import route
- [x] 1.7 Add the characters-page import UI in `app/characters/page.tsx`, including URL entry, conflict confirmation, loading state, success/error feedback, and normalization warning display
- [x] 1.8 Review the new code for duplication and unnecessary complexity before opening the PR; simplify parsing and mapping paths where the same behavior is implemented twice

## 2. Validation

- [x] 2.1 Run targeted unit coverage for import parsing, normalization, and warning generation with `npm run test:unit -- --runInBand tests/unit`
- [x] 2.2 Run targeted integration coverage for the import API flow with `npm run test:integration -- --runInBand tests/integration`
- [x] 2.3 Resolve the existing repository lint findings surfaced by the new lint gate so `main` stays clean when CI runs
- [x] 2.4 Run lint with `npm run lint` and build verification with `npm run build`
- [x] 2.5 Run relevant regression or end-to-end coverage for the characters import flow with `npm run test:regression -- --grep "character|import"` or the smallest equivalent passing Playwright scope
- [x] 2.6 If a new dependency is introduced for HTML parsing, run the required security review and resolve blocking findings before proceeding
- [x] 2.7 Record the release-blocker assessment before PR: local unit, integration, lint, build, and focused import regression checks are green, and the only new security finding is limited to the local HTTP mock used in integration tests rather than the production import path

## 3. PR and Merge

- [ ] 3.1 Open a pull request that links GH issue #39, summarizes the import workflow, and explains any parser dependency or fixture strategy
- [ ] 3.2 Request human review, capture approval expectation, and address unresolved review comments before merge
- [ ] 3.3 Request Copilot review or equivalent automated review, resolve actionable findings, and rerun affected tests after fixes
- [ ] 3.4 Keep auto-merge disabled until required CI, review, and security checks are green; enable auto-merge only after all blockers are cleared

## 4. Post-Merge

- [x] 4.1 Update user-facing or contributor documentation if the import flow, supported URL formats, or testing approach needs to be documented
- [x] 4.2 Sync the approved spec delta from `openspec/changes/import-dnd-beyond-character/specs/dnd-beyond-character-import/spec.md` into `openspec/specs/` as part of the archive workflow
- [ ] 4.3 Archive the change with the OpenSpec archive flow after merge and verification are complete
- [ ] 4.4 Clean up the feature branch after merge and confirm the default branch is up to date
