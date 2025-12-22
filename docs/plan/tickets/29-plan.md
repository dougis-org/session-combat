## 1) Summary ✅

- **Ticket:** #29  
- **One-liner:** Add a GitHub Actions workflow that runs validation and integration tests (in parallel), collects LCOV coverage from each job, merges the results, and uploads the combined coverage report to Codacy.  
- **Related milestone(s):** NA  
- **Out of scope:**  
  - Creating or changing the Codacy project configuration on Codacy website.  
  - Enforcing coverage thresholds that fail builds (optional follow-up).  
  - Instrumenting additional tests beyond invoking existing `jest` test suites.

---

## 2) Assumptions & Open Questions ❗

- **Assumptions**
  - A Codacy project already exists for this repo (`dougis-org/session-combat`) and is ready to accept coverage reports.  
  - The repository has two test suites of interest: `jest.validation.config.js` and `jest.integration.config.js` (confirmed).  
  - GitHub repository admins can add `CODACY_API_TOKEN` to repo Secrets.  
  - Using Node-based reporter (npm package or CLI) is acceptable; exact package/version will be resolved at implementation time per Context7 policy.  
- **Open questions (blocking → need answers)**
  1. Who will provide the Codacy API token and ensure it has adequate permissions? (Needed: `CODACY_API_TOKEN` as a secret.)  
  2. Do we want to fail PR checks when coverage drops below a threshold? If yes, specify threshold and policy (global/per-file).  
  3. Prefer using a Codacy-maintained reporter/CLI or a community tool? (I will resolve exact package/version at implementation time and pin it.)  
  4. Any CI runtime constraints (self-hosted runners with disk limits, retention policy) that would affect artifact storage/merge?

---

## 3) Acceptance Criteria (normalized, testable) ✅

1. A GitHub Actions workflow file `.github/workflows/coverage.yml` exists and is executed on PRs to `main` and pushes to `main`.  
2. Workflow runs the validation and integration test jobs in parallel and produces LCOV-format coverage artifacts for each job.  
3. A single aggregator job downloads artifacts, merges LCOV files into a combined `coverage/lcov.info`, and successfully uploads the combined report to Codacy (Codacy shows a new coverage report within a successful workflow run).  
4. Local scripts exist to run coverage and merge reports locally (`npm run coverage:validation`, `npm run coverage:integration`, `npm run coverage:merge`) and these work on a developer machine.  
5. Documentation added (`docs/coverage.md`) explains how to set `CODACY_API_TOKEN` (as `Secrets`), other required env vars, how to run locally, and how to troubleshoot failures.  
6. Tests exist verifying the LCOV merge logic (unit tests with fixture LCOV files), and they pass in CI.  
7. The PR adding the workflow and scripts passes lint / Codacy checks (per existing repo policies).

---

## 4) Approach & Design Brief 🔧

- **Current state (key code paths):** Repository has two Jest configs (`jest.validation.config.js`, `jest.integration.config.js`) and `npm` scripts for integration tests (`test:integration`). There are no coverage aggregation scripts or CI workflow for Codacy coverage reporting.
- **Proposed changes (high-level flow):**
  1. Add per-suite coverage npm scripts that run Jest with `--coverage` and output `lcov` into suite-specific coverage directories (e.g., `coverage/validation/lcov.info`, `coverage/integration/lcov.info`).
  2. Add a small, tested Node script `/scripts/merge-coverage.js` (or an npm package) to merge multiple LCOV files into a single `coverage/lcov.info`.
  3. Add GitHub Actions workflow `.github/workflows/coverage.yml` that:
     - Job matrix: runs `validation` and `integration` coverage jobs in parallel; each job uploads its `lcov.info` as an artifact.
     - Aggregator job: downloads artifacts, merges LCOVs, calls Codacy reporter/CLI to send coverage.
- **Data model / schema:** N/A (coverage files only). No DB migrations.
- **APIs & contracts:** Codacy reporter requires `CODACY_API_TOKEN` and project context: `CODACY_ORGANIZATION_PROVIDER=gh`, `CODACY_USERNAME=dougis-org`, `CODACY_PROJECT_NAME=session-combat` (as in issue). Job should not print tokens.
- **Feature flags:** None required (CI-only change). If desired, allow optional env var to skip Codacy upload (e.g., `UPLOAD_TO_CODACY=false`).
- **Config (new env vars + validation):**
  - Secrets: `CODACY_API_TOKEN` (repo secret).  
  - Workflow envs: `CODACY_ORGANIZATION_PROVIDER=gh`, `CODACY_USERNAME=dougis-org`, `CODACY_PROJECT_NAME=session-combat`.  
  - Validate presence of `CODACY_API_TOKEN` in aggregator job and fail gracefully with a clear message.
- **External deps & justification:** New dev-dependencies for:
  - LCOV merge utility (e.g., `lcov-result-merger` or custom merge script).  
  - Codacy coverage reporter/CLI (exact package to be resolved and pinned via Context7 during implementation).
- **Backward compatibility strategy:** No changes to runtime code; CI-only additions are non-breaking.
- **Observability (logs/alerts):** Workflow job logs will include per-job lcov artifact upload, merge logs, and Codacy reporter response (exit code). Add explicit job steps that annotate failure reasons. Optionally add a lightweight success metric in monitoring if desired.
- **Security & privacy:** Use GitHub Secrets for tokens. Reporter execution must avoid echoing the token. Do not store secrets in artifacts or logs.
- **Alternatives considered:**
  - Use a monolithic job (serially run both suites in one runner) — slower; lacks parallel speed benefit. Rejected in favor of parallel jobs + merge.
  - Use Codacy API directly via custom curl upload — higher maintenance; prefer official reporter/CLI.

---

## 5) Step-by-Step Implementation Plan (TDD) 🧪

Phases follow RED → GREEN → REFACTOR.

A. Tests (RED initially)
  1. Add unit tests for coverage-merge logic:
     - New test file: `tests/unit/coverage/merge-coverage.test.ts` (parameterized tests: combine 2 small LCOV samples, handle overlapping files, missing files).
     - Fixtures: `tests/resources/coverage/sample-a.lcov`, `sample-b.lcov`, `expected-merged.lcov`.
  2. Add a test that simulates aggregator behavior by mocking Codacy reporter invocation (ensures proper exit code and error handling).
  3. Ensure test runner script (`npm test:unit` if not present) runs these tests locally and in CI.

B. Implementation (make tests pass)
  1. Add script `/scripts/merge-coverage.js`:
     - Inputs: list of artifact paths or a directory containing `*.lcov`.
     - Output: `coverage/lcov.info` (normalized, deduplicated file entries).
     - Exit 0 on success; non-zero + clear error on failure.
  2. Add package.json scripts:
     - "coverage:validation": `jest --config=jest.validation.config.js --coverage --coverageDirectory=coverage/validation --coverageReporters=text-lcov`
     - "coverage:integration": `jest --config=jest.integration.config.js --coverage --coverageDirectory=coverage/integration --coverageReporters=text-lcov`
     - "coverage:merge": `node scripts/merge-coverage.js coverage/validation/lcov.info coverage/integration/lcov.info -o coverage/lcov.info`
     - "coverage:ci": runs both coverage jobs (local convenience) and merge.
  3. Add devDependencies for LCOV merging and (if used) Codacy reporter, pin versions using Context7 (resolve and embed exact versions during implementation).
  4. Wire unit tests for merge script; run and fix until GREEN.

C. CI workflow + integration tests
  1. Create `.github/workflows/coverage.yml`:
     - On: pull_request (to main) and push (main).
     - Jobs:
       a. `coverage-validation` (runs matrix variant for validation suite) → runs `npm ci`, `npm run coverage:validation`, uploads `coverage/validation/lcov.info`.
       b. `coverage-integration` → runs `npm ci`, `npm run coverage:integration`, uploads `coverage/integration/lcov.info`. (Run on separate runner; maintain `maxWorkers` constraints).
       c. `aggregate` (needs: the two coverage jobs) → downloads artifacts, runs `node scripts/merge-coverage.js` → validates presence of `CODACY_API_TOKEN` (fail if missing) → runs Codacy reporter/CLI to send `coverage/lcov.info` to Codacy.
     - Use `actions/upload-artifact` and `actions/download-artifact` for artifact passing.
  2. Add step to the aggregator to print a short result summary and Codacy reporter response.
  3. Merge & run, verify workflow run and Codacy coverage ingestion.

D. Pre-PR & Refactor
  1. Pre-PR duplication & complexity review (MANDATORY): search for similar utilities, remove duplication, apply small refactor to keep merge script < 100 LOC with clear functions.
  2. Run static analysis and Codacy checks as per repo policies; fix flagged issues.
  3. Add README/docs (`docs/coverage.md`) describing how to set secrets and run locally.

E. Documentation & guidance
  1. Add instructions in `CONTRIBUTING.md` (CI section) about required secrets and how to reproduce coverage locally.
  2. Add troubleshooter notes for common issues (token missing, reporter version mismatch, lcov merge conflicts).
