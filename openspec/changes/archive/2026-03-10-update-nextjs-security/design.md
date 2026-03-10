## Context

Next.js 16.0.10 contains 2 known medium-severity security vulnerabilities identified by the Red Hat Dependency Analytics Plugin (OSV data). The project already declares `"next": "^16.1.6"` in `package.json`, but the `package-lock.json` had resolved to an older, vulnerable version — meaning the intent was correct but the installed version was not. The latest stable release is 16.1.6. Note that Next.js 16.1.6 requires Node.js `>=20.9.0` per its `engines` field; any environment running an older Node version must upgrade as part of this change.

The goal is to regenerate `package-lock.json` so it resolves `next` to the patched `16.1.6`, validate nothing regresses, and ensure `npm ci` (used in CI) is satisfied by the new lock file.

## Goals / Non-Goals

**Goals:**
- Confirm `package.json` pins `next` at `^16.1.6` (already done)
- Confirm `eslint-config-next` matches the Next.js major/minor version
- Run `npm install` to update `package-lock.json`
- Run `npm audit` to verify no remaining high/critical advisories on `next`
- Verify build and test suite pass post-upgrade

**Non-Goals:**
- Upgrading React, React DOM, or other unrelated dependencies
- Addressing vulnerabilities in transitive dependencies not directly tied to this issue
- Any feature work or refactoring

## Decisions

### Decision 1: Minimal-scope lock file regeneration
The primary change is regenerating `package-lock.json` to resolve `next` to `16.1.6`. Because the project uses caret (`^`) ranges for many packages, a full lock file regeneration also re-resolves other dependencies to their latest compatible versions within those ranges. This breadth is a known consequence of deleting and regenerating the lock file rather than using `npm update next` in isolation. The broader churn was reviewed in the PR diff and confirmed to introduce no regressions via the test suite. Additionally, `@swc/helpers@0.5.19` was added as a direct devDependency to resolve a peer dependency conflict between `@swc/core` and `next` that surfaced during `npm ci`.

**Alternatives considered:**
- `npm update next eslint-config-next` — would update only those two packages in the lock file while preserving other pins; rejected because the original lock file was generated with npm 11 (incompatible with CI's npm 10), requiring a full regeneration anyway.
- Full `npm audit fix` — rejected; could introduce unrelated changes and regressions.
- Pinning exact version (e.g., `16.1.6`) — rejected; using `^` range ensures future patch-level fixes are automatically included without manual intervention.

### Decision 2: Feature branch
All changes are made on a dedicated branch (`fix/issue-54-nextjs-security`) to enable standard PR review, CI validation, and traceable merge history. This aligns with the issue request to work in a feature branch.

**Alternatives considered:**
- Direct commit to `main` — rejected; bypasses PR review and CI gate.

### Decision 3: Validate via existing CI
No new CI steps are needed. The existing integration tests, E2E regression suite, and `next build` are sufficient to confirm the upgrade didn't introduce regressions.

## Risks / Trade-offs

- **[Risk] Minor breaking change in Next.js 16.1.x** → Mitigation: Review Next.js 16.1.x release notes; existing test suite will surface regressions.
- **[Risk] Transitive dependency churn** → Mitigation: `package-lock.json` diff reviewed in PR; `npm audit` run to confirm no new issues introduced.
- **[Risk] eslint-config-next version mismatch** → Mitigation: Update `eslint-config-next` to `^16.1.6` alongside `next`.

## Migration Plan

1. Create feature branch `fix/issue-54-nextjs-security` from `main`
2. Update `next` and `eslint-config-next` in `package.json` to `^16.1.6` (verify already correct)
3. Delete `node_modules` and `package-lock.json`, then run `npm install` for a clean lock
4. Run `npm audit` — confirm no high/critical advisories on `next`
5. Run `npm run build` — confirm successful build
6. Run `npm run test:integration` and `npm run test:regression` — confirm no regressions
7. Open PR referencing issue #54, merge after CI passes

**Rollback:** Revert the branch; the previous `package-lock.json` is preserved in git history.

## Open Questions

- ~~Are the 2 CVEs specifically in Next.js core or in a transitive dependency it pulls?~~ **Resolved:** `npm audit` post-install shows zero advisories attributed to `next@16.1.6`. The original vulnerabilities were in `next@16.0.10` itself and are fixed in `16.1.6`. Remaining 4 moderate advisories are in `undici` via `testcontainers` (dev-only).
