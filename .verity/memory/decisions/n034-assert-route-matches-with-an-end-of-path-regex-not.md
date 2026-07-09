---
schema: 1
id: n034-assert-route-matches-with-an-end-of-path-regex-not
kind: decision
title: "Assert route matches with an end-of-path regex, not substring containment"
domains: ["testing", "routing", "e2e"]
file_globs: []
confidence: 0.81
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-04T17:35:22.223285+00:00
updated_at: 2026-07-04T17:35:22.135+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Assert route matches with an end-of-path regex, not substring containment

When an E2E test is verifying navigation to a specific route, the assertion must match the full pathname/end of path rather than a loose substring. Substring checks can pass on unrelated pages that happen to include the same segment, creating false positives and masking regressions in routing. Use this pattern anywhere a test is intended to prove arrival at a concrete route, especially for monster-import flows.
