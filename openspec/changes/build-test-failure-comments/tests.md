---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `build-test-failure-comments` change. All work should follow a strict BDD/TDD (Behavior-Driven Development / Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before implementing the comment script, write/prepare mock test cases or draft verification steps that describe the failures. Run/verify that they fail or are not handled.
2. **Write code to pass the test:** Implement the comments management script inside `.github/workflows/build-test.yml`.
3. **Refactor:** Improve the script code quality and structure while ensuring it continues to behave correctly.

## Test Cases

- [x] **Test Case 1: Post new comment on first failure**
  - **Goal**: Verify that when the workflow fails and no prior comment exists, a comment is created.
  - **Task Link**: `Implement Workflow Comments Logic`
  - **Spec Link**: `Scenario: Post new comment on first failure`
  - **Verification**: Simulate a workflow failure run and verify a new PR comment is successfully posted with the marker.

- [x] **Test Case 2: Update existing comment on subsequent failure**
  - **Goal**: Verify that subsequent workflow failures prepend the details to the existing comment.
  - **Task Link**: `Implement Workflow Comments Logic`
  - **Spec Link**: `Scenario: Update existing comment on subsequent failure`
  - **Verification**: Run a simulated second failure and check that the comment is updated with the new run info at the top, followed by `---` and the first run info.

- [x] **Test Case 3: Delete comment on recovery/success**
  - **Goal**: Verify that a successful run deletes the failure comment.
  - **Task Link**: `Implement Workflow Comments Logic`
  - **Spec Link**: `Scenario: Delete comment on recovery/success`
  - **Verification**: Run a simulated successful run and verify the PR comment is deleted.

- [x] **Test Case 4: Graceful handling on fork PRs**
  - **Goal**: Verify that permission errors do not fail the workflow.
  - **Task Link**: `Implement Workflow Comments Logic`
  - **Spec Link**: `Scenario: Recovery behavior (Fork PR tolerance)`
  - **Verification**: Mock an API throw (e.g., `Resource not accessible`) inside the script and check that it catches it and logs a warning instead of failing the job.
