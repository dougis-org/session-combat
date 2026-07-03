---
schema: 1
id: n020-validate-persisted-chat-sizes-before-reducer-updat
kind: decision
title: "Validate persisted chat sizes before reducer updates"
domains: ["chat", "persistence", "state-management"]
file_globs: []
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-28T21:10:41.24952+00:00
updated_at: 2026-06-28T21:10:41.148+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Validate persisted chat sizes before reducer updates

Persisted resize data must be checked with an internal validity guard before it is dispatched into state. LocalStorage can contain malformed or stale payloads, and letting those values reach the reducer would make the resize state non-finite or otherwise unpredictable. This applies anywhere chat dock dimensions are rehydrated from storage: only validated size tuples may be applied, and invalid data should be rejected rather than coerced.
