---
schema: 1
id: n027-keep-repo-workflows-thin-and-centralize-shared-ci
kind: decision
title: "Keep repo workflows thin and centralize shared CI logic in cicd-tooling"
domains: ["ci", "github-actions", "tooling"]
file_globs:
  - ".github/workflows/*.yml"
confidence: 0.82
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-01T01:33:41.790928+00:00
updated_at: 2026-07-01T01:33:41.694+00:00
related: ["n025-run-codacy-finalization-with-if-always"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Keep repo workflows thin and centralize shared CI logic in cicd-tooling

Repo-local workflows should stay as thin entrypoints that own only this repository’s triggers and configuration, while reusable CI implementation lives in `dougis-org/cicd-tooling`. This avoids duplicating logic across repos and keeps shared behavior consistent, but still allows each repo to vary its own event wiring and env values. Apply this when adding or refactoring GitHub Actions workflows so shared steps are not reimplemented locally.

## Related

**Related:**
- [[n025-run-codacy-finalization-with-if-always]]

