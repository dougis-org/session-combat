---
schema: 1
id: n047-render-dice-popouts-through-a-body-level-portal
kind: decision
title: "Render dice popouts through a body-level portal"
domains: ["dice", "ui-layout", "ssr"]
file_globs: []
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-19T01:40:16.622672+00:00
updated_at: 2026-08-19T01:40:16.599+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Render dice popouts through a body-level portal

Dice result popouts must be mounted through a lazily created document-body overlay root rather than inside the chat frame. This prevents chat-container clipping and stacking constraints while preserving trigger-relative positioning, and the lazy creation keeps the component safe during SSR. Apply this to floating dice UI that must escape its containing frame.
