---
schema: 1
id: n032-mark-monster-import-failures-as-alerts
kind: decision
title: "Mark monster import failures as alerts"
domains: ["accessibility", "e2e", "monster-import"]
file_globs: []
confidence: 0.83
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-04T16:10:52.082559+00:00
updated_at: 2026-07-04T16:10:51.99+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Mark monster import failures as alerts

The monster import error state must use `role="alert"` so assistive tech announces the failure immediately and the E2E suite has a stable semantic hook for asserting the rejection path. This is a constraint on any import-error UI in the monster import flow: if the message is not exposed as an alert, both accessibility and regression coverage become unreliable.
