---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `campaign-encounter-templates` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Write integration test for copying a campaign template that contains encounters, ensuring new `Encounter` objects are created and linked.
- [ ] Write integration test for copying a campaign template where encounter DB insertion fails, ensuring the `Campaign` is not created (rollback successful).
- [ ] Write test validating the TS types for `CampaignTemplate` with `encounters` array containing `EncounterTemplate`.
- [ ] Validate the `seedCampaignTemplates.ts` script successfully inserts an encounter-populated template.
