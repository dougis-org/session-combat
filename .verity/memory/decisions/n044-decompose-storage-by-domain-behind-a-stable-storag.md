---
schema: 1
id: n044-decompose-storage-by-domain-behind-a-stable-storag
kind: decision
title: "Decompose storage by domain behind a stable storage facade"
domains: ["storage", "architecture", "compatibility"]
file_globs:
  - "lib/storage.ts"
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T15:29:23.425736+00:00
updated_at: 2026-08-16T15:29:23.397+00:00
related: ["n043-route-storage-events-through-one-logging-seam-for"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Decompose storage by domain behind a stable storage facade

Storage domains may be split into focused modules, but the public storage-object export must remain stable while callers and test doubles depend on it. This compatibility boundary enables god-object decomposition without forcing a repository-wide migration or breaking existing mocks. Apply to storage module structure and its exported facade.

## Related

**Related:**
- [[n043-route-storage-events-through-one-logging-seam-for]]

