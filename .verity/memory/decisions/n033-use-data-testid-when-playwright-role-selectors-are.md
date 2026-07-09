---
schema: 1
id: n033-use-data-testid-when-playwright-role-selectors-are
kind: decision
title: "Use `data-testid` when Playwright role selectors are ambiguous"
domains: ["testing", "playwright", "monster-import"]
file_globs: []
confidence: 0.87
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-04T16:58:14.892529+00:00
updated_at: 2026-07-04T16:58:14.784+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use `data-testid` when Playwright role selectors are ambiguous

In monster-import E2E tests, prefer `data-testid` over role-based queries for the import error banner when the page can render multiple `role=alert` elements. Playwright strict mode will treat that selector as ambiguous and fail the test even when the UI is correct. This constraint applies anywhere a test needs a specific alert/banner among multiple same-role elements: use a unique test id or another disambiguating locator rather than a broad role selector.
