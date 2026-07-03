---
schema: 1
id: n025-run-codacy-finalization-with-if-always
kind: decision
title: "Run Codacy finalization with `if: always()`"
domains: ["ci", "github-actions", "codacy"]
file_globs:
  - ".github/workflows/*.yml"
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-01T01:18:44.786201+00:00
updated_at: 2026-07-01T01:18:44.693+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Run Codacy finalization with `if: always()`

CI finalization steps that notify an external service must run even when earlier jobs fail, so the service still receives a completion signal for the PR. If this step is gated on success, failed runs can leave Codacy in an incomplete state and block or skew review status. Apply this to workflow jobs whose job is to close out an external integration after tests or uploads finish.
