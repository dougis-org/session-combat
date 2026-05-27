---
name: tests
description: Tests for install-rtl-infrastructure
---

# Tests

## Overview

This document outlines the tests for the `install-rtl-infrastructure` change. This change is itself test infrastructure — the primary deliverable IS a test file. Follow TDD strictly for the smoke test; the package install and config steps are verified by the smoke test passing.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1 — Install RTL packages

- [ ] **TC-1.1** — Before install: import `@testing-library/react` in a temp test; Jest must fail with `Cannot find module`
  - Maps to: specs/rtl-setup.md → "Packages absent before this change"
- [ ] **TC-1.2** — After `npm install`: `npm ls @testing-library/react` exits 0 and lists the package
  - Maps to: specs/rtl-setup.md → "Packages present after install"
- [ ] **TC-1.3** — After install: import `render` and `screen` from `@testing-library/react`; TypeScript compiles without error
  - Maps to: design.md → Decision 2 (RTL APIs available)

### Task 2 — Add jest-dom import to jest.setup.ts

- [ ] **TC-2.1** — Before adding import: calling `toBeInTheDocument()` in any test throws `toBeInTheDocument is not a function`
  - Maps to: specs/rtl-setup.md → "jest-dom matchers globally available" (negative case)
- [ ] **TC-2.2** — After adding import: `expect(document.createElement('div')).toBeInTheDocument()` passes in any test file without a local import
  - Maps to: specs/rtl-setup.md → "Matcher resolves without import"
- [ ] **TC-2.3** — `npx tsc --noEmit` passes after adding the import (jest-dom types resolve)
  - Maps to: specs/rtl-setup.md → "TypeScript recognises matcher types"

### Task 3 — Switch global Jest environment to jsdom

- [ ] **TC-3.1** — After changing `testEnvironment` to `"jsdom"`: `npm test` exits 0 with the same count of passing tests as before
  - Maps to: specs/rtl-setup.md → "All existing tests still pass under jsdom"
- [ ] **TC-3.2** — Integration test config (`jest.integration.config.js`) still specifies `testEnvironment: "node"` — verify no accidental edit
  - Maps to: specs/rtl-setup.md → "Integration tests are unaffected"

### Task 4 — Write RTL smoke test for CombatStatsRow

- [ ] **TC-4.1** — Write the smoke test file BEFORE installing packages (TDD: test fails with module-not-found)
  - Maps to: TDD step 1 — failing test
- [ ] **TC-4.2** — After packages installed and config applied: `npm test -- --testPathPattern=CombatStatsRow.rtl` exits 0
  - Maps to: specs/rtl-setup.md → "Smoke test passes"
- [ ] **TC-4.3** — Smoke test file contains no `createRoot`, no `container.querySelector` — uses only RTL APIs
  - Maps to: specs/rtl-setup.md → "Smoke test uses RTL APIs exclusively"
- [ ] **TC-4.4** — Smoke test asserts `screen.getByText('18')` is in the document for `ac: 18`
  - Maps to: specs/rtl-setup.md → "Smoke test passes"
- [ ] **TC-4.5** — Smoke test asserts `screen.getByText(/leather armor/)` is in the document when `acNote` is provided
  - Maps to: specs/rtl-setup.md → "Smoke test passes"
- [ ] **TC-4.6** — Smoke test asserts no `(` character when `acNote` is omitted (`screen.queryByText` returns null or content check)
  - Maps to: specs/rtl-setup.md → "Smoke test passes"
