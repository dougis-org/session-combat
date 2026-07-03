---
schema: 1
id: n030-clear-invalid-currentchapterid-before-persisting-c
kind: decision
title: "Clear invalid currentChapterId before persisting campaign edits"
domains: ["campaigns", "editor", "state-management"]
file_globs: []
confidence: 0.9
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-01T04:25:32.726984+00:00
updated_at: 2026-07-01T04:25:32.625+00:00
related: ["n017-invalidate-persisted-dock-height-when-the-viewport"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Clear invalid currentChapterId before persisting campaign edits

If `currentChapterId` no longer matches any chapter after edits, it must be normalized away before save. Removing or reordering chapters can otherwise leave a stale reference in persisted state, which breaks later chapter selection and makes the saved campaign internally inconsistent. Apply this in campaign-editor save/update flows whenever chapter mutations can invalidate the active chapter pointer.

## Related

**Related:**
- [[n017-invalidate-persisted-dock-height-when-the-viewport]]

