---
schema: 1
id: n046-build-formulas-from-structured-staged-counts-not-f
kind: decision
title: "Build formulas from structured staged counts, not free-form input"
domains: ["security", "input-validation", "dice"]
file_globs: []
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-19T01:23:44.79394+00:00
updated_at: 2026-08-19T01:23:44.761+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Build formulas from structured staged counts, not free-form input

Formula construction in the staging workflow must consume validated structured counts rather than parse user-provided formula text. This keeps the existing API contract while reducing parsing ambiguity and injection risk; any future formula-building or staged-roll code should preserve the structured-data boundary.
