---
name: tests
description: Tests for the rtl-userevent-setup-migration change
---

# Tests

## Overview

This change is a mechanical migration of existing tests — no new production code is written. The verification strategy is therefore: run the existing tests after each file migration and confirm they still pass. The "test" for correctness of the migration _is_ the existing test suite.

## Testing Steps

For each file migration task in `tasks.md`:

1. **Before migrating:** run the file's tests to confirm they pass as a baseline
2. **Migrate:** replace static `userEvent.*()` calls with instance calls
3. **After migrating:** run the file's tests again — they must still pass (same pass count, no new failures)
4. **After all 5 files:** run the full suite and confirm no regressions

## Test Cases

### AlignmentSelect.test.tsx

- [ ] Baseline: `npm run test:unit -- --testPathPattern=AlignmentSelect` passes before migration
- [ ] After migration: same command passes; `userEvent.selectOptions` static call no longer present

### NavBar.test.tsx

- [ ] Baseline: `npm run test:unit -- --testPathPattern=NavBar` passes before migration
- [ ] After migration: same command passes; `userEvent.click` static call no longer present

### RegisterPage.test.tsx

- [ ] Baseline: `npm run test:unit -- --testPathPattern=RegisterPage` passes before migration
- [ ] After migration: same command passes; all 4 `userEvent.type` static calls replaced

### CampaignsPage.test.tsx

- [ ] Baseline: `npm run test:unit -- --testPathPattern=CampaignsPage` passes before migration
- [ ] After migration: same command passes; all 3 `userEvent.click` static calls replaced with instance calls via `beforeEach`

### SessionsPage.test.tsx

- [ ] Baseline: `npm run test:unit -- --testPathPattern=SessionsPage` passes before migration
- [ ] After migration: same command passes; both `userEvent.click` static calls replaced with instance calls via `beforeEach`

### Full suite regression check

- [ ] `npm run test:unit` exits 0 with no failures after all 5 files are migrated
- [ ] `grep -r "userEvent\." tests/ | grep -v "setup()"` returns no output
- [ ] `npm run build` exits 0
