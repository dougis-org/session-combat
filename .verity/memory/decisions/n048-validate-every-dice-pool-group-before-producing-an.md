---
schema: 1
id: n048-validate-every-dice-pool-group-before-producing-an
kind: decision
title: "Validate every dice-pool group before producing any results"
domains: ["dice", "validation", "atomicity"]
file_globs: []
confidence: 0.9
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-19T01:40:16.707727+00:00
updated_at: 2026-08-19T01:40:16.686+00:00
related: ["n047-render-dice-popouts-through-a-body-level-portal"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Validate every dice-pool group before producing any results

Dice-pool execution must validate all groups before generating a result for any group. This preserves the existing single-die validation contract and prevents callers from receiving partial results when a later group is malformed. Apply this whenever one user action expands into multiple dice groups or staged rolls.

## Related

**Related:**
- [[n047-render-dice-popouts-through-a-body-level-portal]]

