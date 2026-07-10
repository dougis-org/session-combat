---
schema: 1
id: n035-preserve-party-membership-history-on-rejoin
kind: decision
title: "Preserve party membership history on rejoin"
domains: ["party", "membership", "data-model"]
file_globs: []
confidence: 0.9
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-05T21:47:20.65315+00:00
updated_at: 2026-07-05T21:47:20.507+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Preserve party membership history on rejoin

When a member leaves and later rejoins, do not overwrite the old membership row. Keep the prior record by setting `leftAt` and create a new active membership entry for the rejoin. This is required to preserve participation history; collapsing the records would destroy the audit trail and make it impossible to distinguish prior membership from the current active state.
