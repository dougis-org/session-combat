---
schema: 1
id: n017-invalidate-persisted-dock-height-when-the-viewport
kind: decision
title: "Invalidate persisted dock height when the viewport changes materially"
domains: ["ui state", "persistence", "responsive layout"]
file_globs: []
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-28T15:24:26.018416+00:00
updated_at: 2026-06-28T15:24:25.923+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Invalidate persisted dock height when the viewport changes materially

A saved drag height is only valid for the same screen size it was created on. Restoring it on a materially different viewport can produce an unusable dock layout, so persistence must be guarded by screen dimensions and ignored when the display context has changed. Apply this whenever UI state stores user-resized dimensions across sessions or devices.
