---
schema: 1
id: n045-use-a-four-value-taxonomy-for-storage-error-behavi
kind: decision
title: "Use a four-value taxonomy for storage error behavior"
domains: ["storage", "error-handling", "testing"]
file_globs:
  - "lib/storage.ts"
  - "openspec/**"
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-17T19:16:14.157602+00:00
updated_at: 2026-08-17T19:16:14.114+00:00
related: ["n044-decompose-storage-by-domain-behind-a-stable-storag"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use a four-value taxonomy for storage error behavior

Storage error inventories must distinguish swallow, rethrow, mixed, and no-try behavior rather than collapse failures into a binary handled/unhandled label. Nested fallbacks can consume some errors while allowing others to escape, so characterization tests and future storage refactors should preserve this four-way classification to avoid masking externally visible behavior.

## Related

**Related:**
- [[n044-decompose-storage-by-domain-behind-a-stable-storag]]

