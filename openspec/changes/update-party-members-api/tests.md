---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `update-party-members-api` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Test case 1 for Task 2: Player successfully adds their own character to a party. (Verify `addedAt` is set, and it returns 200).
- [ ] Test case 2 for Task 2: Player successfully removes their own character from a party. (Verify `leftAt` is set, `addedAt` remains, and it returns 200).
- [ ] Test case 3 for Task 2: Player provides a mix of characters (some to add, some to remove). Verify array updates correctly without overwriting other members' characters.
- [ ] Test case 4 for Task 2: Player attempts to add a character they do not own. Verify the unowned character is ignored or a 400 validation error is returned.
- [ ] Test case 5 for Task 2: GM successfully adds a character owned by a specific member on behalf of that member. (Verify the caller's active `role: 'dm'` membership is sufficient).
- [ ] Test case 6 for Task 2: User who is not in the campaign attempts to call the endpoint. Verify 403 or 404 response.
- [ ] Test case 7 for Task 2: Endpoint verifies that the party actually belongs to the specified campaign.
- [ ] Test case 8 for Task 2: Character that previously left the party (has `leftAt`) rejoins. Verify the old record is preserved and a new active record with a fresh `addedAt` is created, rather than overwriting history.
