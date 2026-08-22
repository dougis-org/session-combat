---
schema: 1
id: n042-rollback-campaign-creation-if-dependent-party-memb
kind: decision
title: "Rollback campaign creation if dependent party/member creation fails"
domains: ["campaigns", "persistence", "transactions"]
file_globs: []
confidence: 0.8
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-07T05:13:41.217993+00:00
updated_at: 2026-07-07T05:13:41.108+00:00
related: ["n040-keep-post-api-campaigns-response-shape-stable"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Rollback campaign creation if dependent party/member creation fails

When campaign creation is implemented as a multi-step write, any failure creating the party or initial membership must abort the whole operation and remove the partially created campaign. Otherwise the database can end up with orphaned campaigns or missing membership rows, which breaks later reads and authorization checks. Apply this rule to create flows that persist several related records and need all of them to succeed atomically from the caller’s point of view.

## Related

**Related:**
- [[n040-keep-post-api-campaigns-response-shape-stable]]

