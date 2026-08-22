---
schema: 1
id: n050-keep-dice-generation-client-side-only-with-server
kind: decision
title: "Keep dice generation client-side only with server validation of submitted results"
domains: ["dice", "api", "security"]
file_globs:
  - "**/dice/**"
  - "**/rolls/**"
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-19T01:52:13.938766+00:00
updated_at: 2026-08-19T01:52:13.906+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Keep dice generation client-side only with server validation of submitted results

Dice rolls remain client-generated so the existing rolls endpoint and result shape stay compatible, but client-submitted values must never be trusted as authoritative. Any dice submission path must validate the pool, bounds, formula, and applicable permissions—or otherwise recompute the result server-side—before accepting it. This applies whenever client-side dice results are posted to the backend.
