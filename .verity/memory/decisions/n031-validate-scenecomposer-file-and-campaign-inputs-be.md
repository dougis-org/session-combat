---
schema: 1
id: n031-validate-scenecomposer-file-and-campaign-inputs-be
kind: decision
title: "Validate SceneComposer file and campaign inputs before upload"
domains: ["uploads", "validation", "ui"]
file_globs:
  - "**/SceneComposer*"
  - "**/*SceneComposer*/**"
confidence: 0.79
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-02T12:52:54.713122+00:00
updated_at: 2026-07-02T12:52:54.624+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Validate SceneComposer file and campaign inputs before upload

SceneComposer must reject obviously invalid file selections and campaign IDs before attempting an upload. This is a correctness constraint, not just UX polish: sending malformed inputs downstream can trigger avoidable server errors and hide the real failure from the user. Apply this any time SceneComposer assembles an upload request or campaign reference, so validation happens at the boundary rather than after the request is in flight.
