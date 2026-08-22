---
name: tests
description: Tests for character UI update
---

# Tests

## Overview

This document outlines the tests for the `character-ui-update` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Write unit test for `CharacterEditor` component rendering outside of the page context.
- [ ] Write unit test for `CharacterCard` component rendering a compact summary view.
- [ ] Write unit test for `CharacterCard` toggle functionality to expand and collapse `CreatureStatBlock`.
- [ ] Update existing `app/characters/page.tsx` test cases to verify integration with `CharacterCard`.
- [ ] Write integration test for `app/characters/[id]/page.tsx` to verify fetching and rendering of specific character details.
- [ ] Write test verifying "View Character" navigation link works as expected.
- [ ] Verify editor form displays and submits properly from the `/characters/[id]` view.
