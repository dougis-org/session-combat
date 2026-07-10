---
schema: 1
id: n037-treat-http-207-as-partial-success-and-keep-the-err
kind: decision
title: "Treat HTTP 207 as partial success and keep the error message visible"
domains: ["imports", "error-handling", "ui"]
file_globs: []
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-06T02:43:58.770583+00:00
updated_at: 2026-07-06T02:43:58.672+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Treat HTTP 207 as partial success and keep the error message visible

When an import returns HTTP 207, the UI must treat it as a partial-success outcome rather than a full success that immediately navigates away. The rationale is that some items may have failed while others succeeded, and leaving the page too early would hide per-item errors and prevent the user from correcting or retrying them. Apply this anywhere batch-import flows can return mixed results.
