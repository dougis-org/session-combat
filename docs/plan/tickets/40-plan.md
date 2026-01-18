# Implementation Plan - Issue #40: Restore Missing CSS Import

## 1) Summary

- **Ticket**: #40
- **One-liner**: Restore missing `import './globals.css'` in app/layout.tsx that was accidentally removed in PR #37, breaking all Tailwind styles
- **Related milestone(s)**: N/A (hotfix)
- **Out of scope**: Rewriting the entire layout.tsx structure; refactoring CSS organization; adding new styles

---

## 2) Assumptions & Open Questions

### Assumptions
1. The root cause is solely the missing CSS import in [app/layout.tsx](app/layout.tsx#L1)
2. No other CSS-related changes were made in PR #37 that could affect styling
3. The [app/globals.css](app/globals.css#L1) file is intact and functional
4. Tailwind configuration in [tailwind.config.js](tailwind.config.js#L1) and [postcss.config.js](postcss.config.js#L1) remain unchanged
5. Browser console 401 error for `/api/auth/me` is a separate issue (authentication-related, not CSS)
6. This is a critical production issue requiring immediate hotfix

### Open Questions
None - the fix is straightforward based on the diff analysis.

---

## 3) Acceptance Criteria (normalized)

1. **AC1**: CSS import is restored to [app/layout.tsx](app/layout.tsx#L1)
2. **AC2**: All Tailwind styles render correctly on all pages (login, home, monsters, characters, etc.)
3. **AC3**: No regression in existing functionality
4. **AC4**: Build completes successfully with no CSS-related warnings
5. **AC5**: Changes are deployed and verified on production (session-combat.fly.dev)

---

## 4) Approach & Design Brief

### Current State
- PR #37 ([feature/36-local-first-offline-sync](https://github.com/dougis-org/session-combat/pull/37)) was merged ~16 hours ago
- The PR completely rewrote [app/layout.tsx](app/layout.tsx#L1) to initialize the SyncService
- During the rewrite, the critical line `import './globals.css'` was omitted
- Result: No Tailwind CSS processing, all styles fail to load
- Browser console shows 401 error (separate auth issue, not related to CSS)

### Proposed Changes
**Single-line fix**: Add `import './globals.css';` at the top of [app/layout.tsx](app/layout.tsx#L1)

**Before** (current broken state):
```typescript
/**
 * Root layout - initializes SyncService
 */
'use client';

import { useEffect } from 'react';
import { initializeSyncService } from '@/lib/sync/SyncService';
import type { SyncOperation } from '@/lib/sync/SyncQueue';
```

**After** (with fix):
```typescript
/**
 * Root layout - initializes SyncService
 */
'use client';

import './globals.css';
import { useEffect } from 'react';
import { initializeSyncService } from '@/lib/sync/SyncService';
import type { SyncOperation } from '@/lib/sync/SyncQueue';
```

### Data Model / Schema
N/A - No database or data model changes

### APIs & Contracts
N/A - No API changes

### Feature Flags
N/A - No feature flags required (hotfix)

### Config
No configuration changes required. Existing files remain:
- [tailwind.config.js](tailwind.config.js#L1) - unchanged
- [postcss.config.js](postcss.config.js#L1) - unchanged
- [app/globals.css](app/globals.css#L1) - unchanged

### External Dependencies
None

### Backward Compatibility Strategy
This fix restores the previous behavior; no breaking changes.

### Observability
- Manual verification: Visual inspection of all pages post-deployment
- Build logs: Ensure no Tailwind/PostCSS warnings
- Browser DevTools: Verify CSS is loaded in Network tab

### Security & Privacy
No security implications. This is a CSS import restoration.

### Alternatives Considered
1. **Revert entire PR #37**: Too disruptive; would lose all offline-first features
2. **Inline styles**: Not scalable; Tailwind integration would still be broken
3. **External stylesheet link in HTML**: Not compatible with Next.js app router conventions

---

## 5) Step-by-Step Implementation Plan (TDD)

This is a CSS fix with no testable logic; TDD does not apply. Manual verification suffices.

### Phase 1: Restore CSS Import

**Step 1**: Add CSS import to [app/layout.tsx](app/layout.tsx#L1)
- Edit [app/layout.tsx](app/layout.tsx#L1)
- Add `import './globals.css';` as the first import (after doc comment, before 'use client')

### Phase 2: Verification

**Step 2**: Build and verify locally
```bash
npm run build
npm run dev
```
- Verify all pages render styles correctly:
  - `/` (home)
  - `/login`
  - `/register`
  - `/characters`
  - `/monsters`
  - `/encounters`
  - `/parties`
  - `/combat`

**Step 3**: Pre-PR Cleanup
- Run `npm run lint` to check for linting issues
- Verify no unused imports remain in [app/layout.tsx](app/layout.tsx#L1)
- Run final `npm run build` verification
- Review for any dead code (none expected for single-line change)

**Step 4**: Commit and push
```bash
git add app/layout.tsx
git commit -S -m "fix(ui): restore missing CSS import in layout.tsx (fixes #40)"
git push
```

### Phase 3: Deployment & Production Verification

**Step 5**: Deploy to production
- Merge PR or push to main (depending on team process)
- Verify Fly.io deployment completes successfully

**Step 6**: Verify on production URL
- Navigate to https://session-combat.fly.dev/login
- Confirm styles load correctly
- Screenshot comparison with the issue attachment to validate fix

---

## 6) Effort, Risks, Mitigations

### Effort
**Size**: S (Small)
- **Rationale**: Single-line change with immediate visual verification
- **Estimated Time**: 15 minutes (including build/test/deploy)

### Risks

| Risk | Likelihood | Impact | Mitigation | Fallback |
|------|-----------|---------|-----------|----------|
| Build failure due to CSS syntax error | Low | Medium | Verify [app/globals.css](app/globals.css#L1) syntax before deploy | Revert commit |
| Tailwind config incompatibility | Low | Medium | Test locally before pushing | Review [tailwind.config.js](tailwind.config.js#L1) |
| Caching issues in production | Medium | Low | Hard refresh (Ctrl+Shift+R) after deploy; may need CDN cache purge | Document cache-busting steps |
| Other broken styles unrelated to this fix | Low | Low | Full visual regression test post-deploy | Open separate tickets for any new issues |

---

## 7) File-Level Change List

### Modified Files (1)
**[app/layout.tsx](app/layout.tsx#L1)**: Add CSS import
- Add `import './globals.css';` after doc comment, before other imports

### No New Files
None

### No Configuration Changes
- [tailwind.config.js](tailwind.config.js#L1): unchanged
- [postcss.config.js](postcss.config.js#L1): unchanged
- [next.config.js](next.config.js#L1): unchanged

---

## 8) Test Plan

### Manual Verification (Required)

**Local Testing**:
1. Run `npm run dev`
2. Visit each page and confirm Tailwind classes render:
   - Background colors (bg-gray-900, bg-gray-800)
   - Text colors (text-white, text-purple-400)
   - Spacing (p-4, m-2, gap-4)
   - Rounded corners (rounded-lg)
   - Hover states (hover:bg-gray-700)

**Production Testing** (Post-Deploy):
1. Navigate to https://session-combat.fly.dev/login
2. Compare screenshot with the issue attachment
3. Verify all interactive elements have proper styling
4. Check browser DevTools Network tab: `globals.css` should load with HTTP 200

### No Automated Tests
This is a CSS import fix; no unit/integration tests are applicable. Visual regression testing would be ideal but is out of scope for a hotfix.

### Browser Compatibility
- Chrome/Edge: ✓ (primary)
- Firefox: ✓ (verify)
- Safari: ✓ (verify if time permits)

---

## 9) Rollout & Monitoring Plan

### Feature Flags
N/A - This is a hotfix, not a feature

### Deployment Steps
1. Merge PR or push to main
2. Fly.io auto-deploy triggers (if configured)
3. Monitor deployment logs for errors
4. Perform manual smoke test on production URL

### Dashboards & Key Metrics
N/A - No metrics collection for this fix

### Alerts
None required

### Success Metrics / KPIs
- Visual confirmation: All pages render styled correctly
- No increase in CSS-related errors in browser console
- No user reports of broken UI post-deploy

### Rollback Procedure
```bash
# If deployed via PR merge
git revert <commit-sha>
git push

# If deployed via direct push
git reset --hard HEAD~1
git push --force  # Only if no other commits have been made

# Alternative: Re-introduce the missing line manually and redeploy
```

---

## 10) Handoff Package

### Issue Reference
- **GitHub Issue**: https://github.com/dougis-org/session-combat/issues/40
- **PR #37** (introduced regression): https://github.com/dougis-org/session-combat/pull/37

### Branch
- Branch name: `hotfix/40-restore-css-import`
- Base branch: `main`

### Plan File Path
- [docs/plan/tickets/40-plan.md](docs/plan/tickets/40-plan.md#L1)

### Key Commands
```bash
# Build
npm run build

# Dev server
npm run dev

# Deploy (if manual)
fly deploy
```

### Known Gotchas / Watchpoints
1. **Browser cache**: Users may need hard refresh (Ctrl+Shift+R) after deploy
2. **CDN cache**: Fly.io may cache static assets; purge if necessary
3. **401 error in console**: Separate auth issue; ignore for this fix
4. **Original PR author**: Consider notifying that CSS import was accidentally removed

---

## 11) Traceability Map

| Criterion # | Requirement | Milestone | Task(s) | Flag(s) | Test(s) |
|-------------|-------------|-----------|---------|---------|---------|
| AC1 | REQ-CSS-IMPORT | N/A (hotfix) | Add CSS import to layout.tsx | N/A | Manual: verify import exists |
| AC2 | REQ-STYLES-RENDER | N/A (hotfix) | Verify all pages styled | N/A | Manual: visual inspection of all routes |
| AC3 | REQ-NO-REGRESSION | N/A (hotfix) | Full smoke test | N/A | Manual: test navigation, SyncService init |
| AC4 | REQ-BUILD-SUCCESS | N/A (hotfix) | Run `npm run build` | N/A | Manual: check build logs |
| AC5 | REQ-PROD-VERIFY | N/A (hotfix) | Deploy and verify on fly.dev | N/A | Manual: screenshot comparison with issue |

---

## Additional Notes

### Related Issues
- **Browser Console 401 Error**: The issue description mentions a 401 error for `/api/auth/me`. This is unrelated to the CSS problem and should be tracked separately if it affects functionality.

### PR #37 Review Recommendation
- Add a code review checklist item: "Verify CSS imports are present in all layout files"
- Consider adding a simple E2E test that checks if Tailwind classes are applied

### Prevention Strategy (Future)
1. Add a pre-commit hook that scans for CSS imports in layout files
2. Visual regression testing with tools like Percy or Chromatic
3. Deployment smoke tests that verify CSS loads before marking deploy as successful

---

**Plan Status**: ✅ Ready for Implementation
**Priority**: 🔴 Critical (Production UI Broken)
**Estimated Completion**: 15 minutes

