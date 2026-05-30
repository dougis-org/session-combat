## Context

- Relevant architecture: Next.js app with server-side lib/ utilities and Playwright E2E test helpers. No client-side bundle includes the uuid import path.
- Dependencies: `uuid@^9.0.1` (runtime dep), `@types/uuid@^10.0.0` (dev dep, version-mismatched). Node 25.6.1 runtime provides `crypto.randomUUID()` globally.
- Interfaces/contracts touched: `id` fields on monster, spell, and combatant objects. The UUID format (RFC 4122 v4 hyphenated string) is unchanged — no schema or API contract is affected.

## Goals / Non-Goals

### Goals

- Eliminate the `uuid` and `@types/uuid` packages entirely
- Replace all 5 import+call sites with Node's built-in `crypto.randomUUID()`
- Keep `package-lock.json` clean (run `npm install` after removing packages)

### Non-Goals

- Changing the UUID format or switching to v7/ULID
- Adding UUID validation at runtime
- Auditing other dependencies

## Decisions

### Decision 1: Use `import { randomUUID } from "crypto"` (named import) rather than the global

- Chosen: `import { randomUUID } from "crypto"` in each file
- Alternatives considered: Use the global `globalThis.crypto.randomUUID()` (available in Node 19+) without any import
- Rationale: Explicit named import is consistent with the project's existing import style, works across all Node versions ≥14.17 (not just ≥19), and is immediately obvious to readers that it's a Node built-in.
- Trade-offs: One extra import line per file vs. zero-import global usage — negligible.

### Decision 2: Keep the `.replace(/-/g, "")` call in `tests/e2e/helpers/isolation.ts` as-is

- Chosen: `randomUUID().replace(/-/g, "")` — identical pattern, new source function
- Alternatives considered: Use a different token generation strategy (e.g., `crypto.randomBytes`)
- Rationale: The change is scoped to dropping the package, not redesigning token generation. The hyphen-strip behaviour is intentional; preserving it keeps the diff minimal and the PR reviewable.
- Trade-offs: Slightly verbose compared to `randomBytes(16).toString("hex")`, but out of scope.

## Proposal to Design Mapping

- Proposal element: Replace 5 `import { v4 as uuidv4 } from "uuid"` imports
  - Design decision: Decision 1 — named import from `"crypto"`
  - Validation approach: TypeScript compilation confirms no remaining `uuid` imports; grep confirms zero references

- Proposal element: Remove `uuid` and `@types/uuid` from `package.json`
  - Design decision: `npm uninstall uuid @types/uuid` or direct edit + `npm install`
  - Validation approach: `package.json` and `package-lock.json` contain no uuid entries after install

- Proposal element: Hyphen-strip pattern in `isolation.ts`
  - Design decision: Decision 2 — preserve pattern, swap source function only
  - Validation approach: E2E tests continue to pass; isolation token format verified in test run

## Functional Requirements Mapping

- Requirement: Generated IDs remain RFC 4122 v4 UUIDs
  - Design element: `crypto.randomUUID()` implements RFC 4122 §4.4
  - Acceptance criteria reference: specs/uuid-generation/spec.md
  - Testability notes: Existing unit/integration tests that assert on ID presence will catch regressions; format can be validated with `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`

- Requirement: No `uuid` package references remain after migration
  - Design element: Remove package + replace all imports
  - Acceptance criteria reference: specs/uuid-generation/spec.md
  - Testability notes: `grep -r "from 'uuid'\|from \"uuid\"" --include="*.ts" --include="*.tsx"` returns empty

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: UUID generation must remain cryptographically random
  - Design element: `crypto.randomUUID()` uses the platform CSPRNG (same source as `uuid` v4)
  - Acceptance criteria reference: specs/uuid-generation/spec.md
  - Testability notes: No regression test needed — both paths use the OS entropy source

- Requirement category: operability
  - Requirement: `npm install` must succeed with no uuid-related warnings
  - Design element: Remove both `uuid` and `@types/uuid` entries from `package.json` before running install
  - Acceptance criteria reference: Clean `npm install` output
  - Testability notes: CI install step confirms

## Risks / Trade-offs

- Risk/trade-off: `crypto` is a Node built-in; if code ever moves to a non-Node runtime (e.g., Cloudflare Workers edge), `import { randomUUID } from "crypto"` may not resolve
  - Impact: Build error in that runtime only — not a concern for current deployment (Fly.io Docker container)
  - Mitigation: If runtime changes in future, migrate to `globalThis.crypto.randomUUID()` at that point

## Rollback / Mitigation

- Rollback trigger: CI fails (type error, test failure) after migration
- Rollback steps: `git revert` the migration commit; `npm install` restores the lock file
- Data migration considerations: None — IDs already stored in the database are not affected
- Verification after rollback: `npm run test:unit && npm run test:integration && npm run build`

## Operational Blocking Policy

- If CI checks fail: Fix the root cause before merging — do not merge with failing checks
- If security checks fail: Same — investigate, do not bypass
- If required reviews are blocked/stale: Ping reviewer; escalate to repo owner after 48 hours
- Escalation path and timeout: Tag `@doug` in PR if blocked > 48 hours

## Open Questions

No open questions. All design decisions are resolved.
