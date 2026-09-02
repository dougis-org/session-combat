---
schema: 1
id: n167-keep-the-dice-canvas-host-mounted-when-hiding-comp
kind: decision
title: "Keep the dice canvas host mounted when hiding completed or fallback animations"
domains: ["dice", "animation", "resource-lifecycle"]
file_globs:
  - "**/dice/**"
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-31T05:12:18.51115+00:00
updated_at: 2026-08-31T05:12:18.412+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Keep the dice canvas host mounted when hiding completed or fallback animations

Dice animation integrations must retain the canvas host in the DOM after reveal or fallback and hide it visually rather than unmounting it. The animation engine does not reliably tear down its resources, so unmounting can strand engine state; hiding preserves cleanup behavior while allowing result UI to remain centered. Apply this to dice canvas lifecycle and result-overlay changes.
