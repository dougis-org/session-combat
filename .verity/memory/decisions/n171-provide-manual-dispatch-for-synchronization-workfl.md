---
schema: 1
id: n171-provide-manual-dispatch-for-synchronization-workfl
kind: decision
title: "Provide manual dispatch for synchronization workflows"
domains: ["ci", "github-actions", "operations"]
file_globs: []
confidence: 0.87
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-31T22:31:28.323813+00:00
updated_at: 2026-08-31T22:31:28.214+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Provide manual dispatch for synchronization workflows

Synchronization workflows must support manual execution in addition to their automatic main-branch trigger. Manual dispatch provides an operational recovery path when an automatic synchronization push fails, is blocked, or needs to be retried without creating another source change. Apply this to workflows that perform repository or dependency synchronization.
