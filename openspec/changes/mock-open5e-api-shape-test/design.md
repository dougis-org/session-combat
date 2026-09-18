## Context

- Relevant architecture: `lib/import/open5eAdapter.ts` defines `Open5ECreature`/`Open5ESpell` types, `PaginatedResponse<T>`, and `Open5EClient` (constructor-injectable `fetch`), plus module-level convenience functions `fetchMonsters`/`fetchSpells`/`getAllMonsters`/`getAllSpells` backed by a `defaultOpen5EClient`. `tests/unit/import/open5eAdapter.test.ts` and `tests/helpers/open5eTestHelpers.ts` already exercise this client via an injected mock `fetch`.
- Dependencies: `jest.integration.config.js` has `testMatch: ["**/tests/integration/**/*.test.ts"]` — any `.test.ts` file under `tests/integration/` is picked up by `npm run test:integration` / `npm run test:ci`, regardless of `describe.skip`. The existing adhoc-script convention in this repo is `lib/scripts/*.ts` invoked via `npx tsx lib/scripts/<name>.ts`, wired through an `npm run <name>` entry (see `seed:monsters`, `migrate:encounters`, `backfillCampaignEncounters.ts`).
- Interfaces/contracts touched: none in application code. Only test/script files move; `Open5EClient` and its exported types are consumed as-is, not modified.

## Goals / Non-Goals

### Goals

- Remove the dead, always-skipped `tests/integration/api/open5eApiShape.test.ts` from Jest's integration test tree entirely (file must not match `**/tests/integration/**/*.test.ts`).
- Provide a manual, on-demand script that documents/validates the live Open5E API response shape, run through `Open5EClient` rather than a duplicated local `fetchWithRetry`.
- Follow the repo's existing `lib/scripts/*.ts` + `npx tsx` + `npm run` convention so the script is discoverable the same way other adhoc scripts are.

### Non-Goals

- Modifying `Open5EClient`, `fetchPage`, or any adapter type.
- Adding CI scheduling, cron, or automated drift-detection for the Open5E API.
- Touching `tests/helpers/open5eTestHelpers.ts` mock fixtures or the mocked unit tests in `tests/unit/import/open5eAdapter.test.ts`.

## Decisions

### Decision 1: Delete the Jest file; do not leave a skipped/renamed stub behind

- Chosen: delete `tests/integration/api/open5eApiShape.test.ts` outright.
- Alternatives considered: rename to `.ts` (non-`.test.ts`) and leave it under `tests/integration/`; keep `describe.skip` indefinitely (status quo).
- Rationale: a lingering `.skip`'d or non-test file under `tests/integration/` invites confusion about whether it runs. Fully relocating the logic into `lib/scripts/` makes the "this is manual, not CI" status structural (enforced by `testMatch`), not a comment or a `.skip` call someone could accidentally remove.
- Trade-offs: git history for the shape assertions is only reachable via `git log --follow` on the new path; acceptable since we're preserving the assertions' intent in the new script, not deleting the knowledge.

### Decision 2: New script location and invocation — `lib/scripts/checkOpen5eApiShape.ts`, run via `npx tsx`, wired as `npm run check:open5e-api-shape`

- Chosen: `lib/scripts/checkOpen5eApiShape.ts`, added to `package.json` `scripts` as `"check:open5e-api-shape": "npx tsx lib/scripts/checkOpen5eApiShape.ts"`.
- Alternatives considered: a top-level `scripts/` dir (that directory is reserved for build/repo-tooling scripts like `generate-version.js`, not domain data scripts); a `tests/manual/` directory (not an existing convention, and still risks accidental `testMatch` collision if the integration/unit configs are ever broadened).
- Rationale: `lib/scripts/` already hosts exactly this kind of thing — `seedGlobalMonsters.ts`, `backfillCampaignEncounters.ts` — each imported via relative/`@/` paths and run with `npx tsx`. Matching this convention means no new pattern for future maintainers to learn.
- Trade-offs: none material; this is the path of least surprise.

### Decision 3: Script uses `Open5EClient` directly (default, real `fetch`), replacing the local `fetchWithRetry`

- Chosen: `new Open5EClient()` (default constructor argument is the global `fetch`), calling `fetchMonsters(1)` and `fetchSpells(1)` — the same entry points `open5eAdapter.test.ts` exercises against a mock.
- Alternatives considered: keep a bespoke retry wrapper around raw `fetch` (status quo in the deleted file); add retry/backoff to `Open5EClient` itself.
- Rationale: the issue explicitly asks to "use the same 5e client other places do." `Open5EClient` already centralizes the base URL, pagination, and error-on-non-ok-response logic (`fetchPage`, `lib/import/open5eAdapter.ts:100-125`), so reusing it removes ~15 lines of duplicated fetch/timeout/retry logic from the test file for free.
- Trade-offs: `Open5EClient` has no retry/backoff, so a single transient network blip will fail the script outright (see Decision 4) rather than retrying up to 3 times as the old `fetchWithRetry` did.

### Decision 4: No retry/backoff added anywhere; script fails fast and reports the error

- Chosen: the script performs one `fetchMonsters(1)` and one `fetchSpells(1)` call each; on failure it lets the error propagate (non-zero exit) with the underlying error message intact (`fetchPage` already throws `Failed to fetch ${endpoint}: ${status} ${statusText}`).
- Alternatives considered: reimplement retry in the script (matching old behavior); add retry to `Open5EClient` (out of scope — would change production behavior for all callers, including real imports, which is a bigger and unrelated decision).
- Rationale: this is a human-triggered, on-demand check (per proposal Non-Goals — no scheduled re-verification). A human re-running the command after a transient failure is an acceptable cost; silently retrying inside a manual diagnostic script adds complexity for a rare case. If retry is later wanted for `Open5EClient` broadly, that is a separate proposal.
- Trade-offs: manual reruns needed on flaky networks; explicitly accepted since this script never runs unattended.

### Decision 5: Assert against `Open5ECreature`/`Open5ESpell` (adapter/parsed shape), not raw JSON

- Chosen: shape checks operate on the objects returned by `Open5EClient.fetchMonsters`/`fetchSpells`, i.e., values already typed as `Open5ECreature`/`Open5ESpell`. TypeScript's structural typing plus targeted runtime assertions (e.g., `typeof creature.key === "string"`, `Array.isArray(creature.actions)`) replace the old raw-JSON `toHaveProperty`/`not.toHaveProperty("slug")` checks.
- Alternatives considered: bypass the client and inspect raw `response.json()` before any parsing, to exactly replicate the deleted test's raw-shape assertions.
- Rationale: reflects proposal Risk #1's mitigation — using the client means we're validating "does live Open5E still satisfy the shape our production code depends on," which is the actually load-bearing question, not "what are the raw JSON property names" (which `Open5EClient` already abstracts away for every other caller).
- Trade-offs: if Open5E silently renames an upstream field that `Open5EClient`'s parsing layer happens to tolerate (e.g., via optional chaining) but shouldn't, this script won't catch it. Accepted: `Open5EClient`'s own parsing is unchanged and out of scope here; the script's job is to say "the client + live API still combine to produce the expected shape."

## Proposal to Design Mapping

- Proposal element: "Remove `tests/integration/api/open5eApiShape.test.ts` from the Jest test tree"
  - Design decision: Decision 1 (delete outright)
  - Validation approach: `npm run test:integration` / `npm run test:ci` file list no longer includes the path; `git status` confirms deletion.
- Proposal element: "Create a manual/adhoc script ... using `Open5EClient`"
  - Design decision: Decisions 2 and 3
  - Validation approach: manually run `npm run check:open5e-api-shape` against the live API and confirm pass/fail output; `npm run typecheck` passes on the new file.
- Proposal element: "Add an `npm run` script ... to execute it on demand"
  - Design decision: Decision 2
  - Validation approach: `npm run check:open5e-api-shape` exists in `package.json` and executes without a missing-script error.
- Proposal element: Open Question — retain retry/backoff?
  - Design decision: Decision 4 (no retry added; documented as accepted trade-off)
  - Validation approach: script code review confirms no retry loop, matching this decision.
- Proposal element: Open Question — raw vs. adapter shape assertions
  - Design decision: Decision 5
  - Validation approach: script code review confirms assertions run against `Open5ECreature`/`Open5ESpell`-typed values from `Open5EClient`, not raw `response.json()`.

## Functional Requirements Mapping

- Requirement: The Jest integration suite must not contain any live-network-calling test file.
  - Design element: Decision 1.
  - Acceptance criteria reference: specs — "no `.test.ts` file under `tests/` performs a live network call to `api.open5e.com`."
  - Testability notes: `grep -r "api.open5e.com" tests/` should only match mock-fixture URLs (e.g., in `fetchMonsters`/`fetchSpells` unit-test expectations against a mocked client), not a real outbound call; `npm run test:integration` runtime confirms no network calls occur.
- Requirement: The manual script must fetch live creature and spell data through `Open5EClient`.
  - Design element: Decision 3.
  - Acceptance criteria reference: specs — "script imports and instantiates `Open5EClient` from `lib/import/open5eAdapter.ts`; no raw `fetch` calls in the script."
  - Testability notes: code review / grep for `new Open5EClient(` and absence of a bespoke `fetchWithRetry`-style function in the new file.
- Requirement: The manual script must be runnable via a documented `npm run` command and must not run under `npm run test:unit`, `npm run test:integration`, or `npm run test:ci`.
  - Design element: Decision 2.
  - Acceptance criteria reference: specs — "`package.json` has a `check:open5e-api-shape` (or equivalent) script; the file lives outside any path matched by `jest.config.js` or `jest.integration.config.js` `testMatch`."
  - Testability notes: run `npm run test:unit` and `npm run test:integration` (or inspect their file lists) and confirm the new script file is not among the executed/discovered test files.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Running the script against a genuinely unreachable/erroring API must produce a clear, actionable failure (non-zero exit, readable error), not a silent pass or an unhandled promise rejection with a cryptic stack.
  - Design element: Decision 4 (fail-fast, propagate `fetchPage`'s existing descriptive error).
  - Acceptance criteria reference: specs — "on fetch failure, script exits non-zero and prints an error containing the endpoint and status."
  - Testability notes: manually point the script at an invalid path/port (or temporarily break DNS) and confirm exit code and message; not automated (this is itself a manual script).
- Requirement category: maintainability
  - Requirement: The script's shape checks should stay meaningful if `Open5ECreature`/`Open5ESpell` evolve, without requiring changes in two places.
  - Design element: Decision 5 — assertions are against the adapter's own exported types, so a TypeScript compile error (via `npm run typecheck`) will surface if the script's assumptions and the type drift apart.
  - Acceptance criteria reference: specs — "script type-checks cleanly under `npm run typecheck` using the imported `Open5ECreature`/`Open5ESpell` types (no `any`/type assertions bypassing them)."
  - Testability notes: `npm run typecheck` after the script is added.

## Risks / Trade-offs

- Risk/trade-off: No retry means a single transient network hiccup fails the manual run (Decision 4).
  - Impact: minor annoyance to whoever runs the script; no production or CI impact since nothing depends on this script succeeding automatically.
  - Mitigation: documented in the script's own output/header; rerun manually.
- Risk/trade-off: Deleting the old file loses inline historical raw-JSON assertions.
  - Impact: a future reader has to look at git history (or `Open5EClient`'s parsing code) to see exactly what raw field names Open5E uses.
  - Mitigation: new script's header comment briefly notes the known raw-vs-parsed differences (`key` not `slug`, etc.) that motivated the adapter's existence, per proposal Risk #1's mitigation.

## Rollback / Mitigation

- Rollback trigger: if the new manual script is found to be unusable (e.g., blocked by auth/CORS issues `Open5EClient` doesn't handle) or the team decides they actually want an automated (non-skipped) CI check instead.
- Rollback steps: `git revert` the change's commit(s); this restores `tests/integration/api/open5eApiShape.test.ts` in its prior (skipped) form and removes the new script/npm-run entry. No data migrations are involved.
- Data migration considerations: none — this change touches only test/script source files and `package.json` scripts.
- Verification after rollback: `npm run test:integration` file discovery again includes the restored path (still skipped, matching pre-change behavior); `npm run check:open5e-api-shape` script and its `package.json` entry are gone.

## Operational Blocking Policy

- If CI checks fail: this change should not affect CI pass/fail state (the moved file never ran assertions in CI; the new script is never invoked by CI). If `npm run test:integration`/`test:unit`/`typecheck` fail after this change, treat it as a regression in this change and fix before merging — do not waive.
- If security checks fail: not expected to trigger any security-relevant pattern (no secrets, no new dependencies); if a scanner flags the outbound HTTP call in the new script, that is expected/intentional for a manual diagnostic tool — document via the repo's normal waiver process if needed, citing this design doc.
- If required reviews are blocked/stale: standard repo process — ping reviewer; no special handling needed for a test-infrastructure-only change.
- Escalation path and timeout: none beyond normal PR review cadence.

## Open Questions

- None blocking. Placement (`lib/scripts/checkOpen5eApiShape.ts`) and retry behavior (none added) are resolved by Decisions 2 and 4 above, using existing repo conventions as the tiebreaker; flag in review if a different convention is preferred.
