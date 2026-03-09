## Context

Next.js 16.0.10 contains 2 known medium-severity security vulnerabilities identified by the Red Hat Dependency Analytics Plugin (OSV data). The project currently declares `"next": "^16.1.6"` in `package.json` and has version 16.1.6 installed — meaning the `package.json` spec may already be correct, but `package-lock.json` and the installed modules may lag behind. The latest stable release is 16.1.6.

The goal is to confirm the version declaration is accurate, force a clean install to pin the lock file to the patched version, and validate nothing regresses.

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

### Decision 1: Minimal-scope upgrade
Only `next` and `eslint-config-next` are touched. Broader dependency upgrades introduce unrelated risk and are out of scope for a targeted security patch.

**Alternatives considered:**
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

- Are the 2 CVEs specifically in Next.js core or in a transitive dependency it pulls? (Check `npm audit` output post-install to confirm.)
