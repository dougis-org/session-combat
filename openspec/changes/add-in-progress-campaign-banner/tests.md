---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `add-in-progress-campaign-banner` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Write component tests for `<ActiveCampaignBanner />` ensuring it fetches campaigns on mount.
- [ ] Test that the banner renders properly with a link if exactly one active campaign is returned.
- [ ] Test that clicking the banner opens a modal if multiple active campaigns are returned.
- [ ] Test that the banner is hidden and no fetch occurs if `sessionStorage.getItem('dismissed-campaign-banner')` is true.
- [ ] Test that clicking the dismiss button hides the banner and sets the `sessionStorage` flag.
- [ ] Test that fetch failures do not crash the component and simply result in no banner shown.
