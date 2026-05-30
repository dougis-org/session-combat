# Testing Guide

## Overview

This file documents the jest setup architecture, import conventions, and ESLint gates for the unit and integration test suites.

## Jest Setup Architecture

`jest.setup.ts` is loaded via `setupFilesAfterEnv` in `jest.config.js`. It is the single bootstrap point for all test-global side effects and runs after the test framework is installed but before any test file executes.

It contains two `@testing-library/jest-dom` augmentation imports:

```ts
// Augment global jest namespace (used by tests that rely on Jest's auto-injected globals)
// Augment @jest/globals module (safety net; ESLint gate prevents its use, but types must resolve if present)
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/jest-globals';
```

Both augmentations are required:

- `@testing-library/jest-dom` extends the global `jest.Matchers` namespace used by tests that rely on Jest's runtime-injected `expect`.
- `@testing-library/jest-dom/jest-globals` extends the `@jest/globals` module's `Matchers` interface, which keeps types consistent if that module is ever referenced.

## Import Convention

**Never import from `@jest/globals` in test files.**

Jest injects `describe`, `test`, `it`, `expect`, `beforeEach`, `afterEach`, `beforeAll`, `afterAll`, and `jest` as globals at runtime. Explicitly importing them from `@jest/globals` bypasses the type augmentation applied by `jest.setup.ts`, which causes `npm run typecheck` to emit TS2339 errors for custom matchers like `toBeInTheDocument`.

**Correct pattern:**

```ts
// No import needed — jest, describe, it, expect, beforeEach, etc. are global
describe('MyComponent', () => {
  it('renders correctly', () => {
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

**Incorrect pattern (blocked by ESLint):**

```ts
import { describe, it, expect } from '@jest/globals'; // ❌ do not do this
```

## ESLint Gate

`eslint.config.mjs` contains a `no-restricted-imports` rule scoped to `tests/**`:

```js
{
  files: ["tests/**/*.ts", "tests/**/*.tsx"],
  rules: {
    "no-restricted-imports": ["error", {
      paths: [{
        name: "@jest/globals",
        message: "Do not import from @jest/globals. Jest injects globals at runtime. See docs/TESTING.md."
      }]
    }]
  }
}
```

This rule runs in CI via `npm run lint`. Any `import ... from '@jest/globals'` in a test file will fail the lint check and block the PR.

## Escape Hatch

If you genuinely need a type from `@jest/globals` (e.g., the `Mock` or `SpyInstance` type for a helper function signature), use a type-only import and suppress the rule for that line:

```ts
// eslint-disable-next-line no-restricted-imports
import type { Mock } from '@jest/globals';
```

This should be rare. The `jest.Mock` global type from `@types/jest` covers the common cases. Prefer that first.

## Running Tests

```sh
# Unit tests
npm run test:unit

# Integration tests (requires Docker)
npm run test:integration

# TypeScript type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build
```
