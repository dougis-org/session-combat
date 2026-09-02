---
schema: 1
id: n170-keep-repository-ci-workflows-thin-and-delegate-exe
kind: decision
title: "Keep repository CI workflows thin and delegate execution to shared tooling"
domains: ["ci", "cicd", "github-actions"]
file_globs:
  - ".github/workflows/**"
confidence: 0.87
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-31T22:28:52.330341+00:00
updated_at: 2026-08-31T22:28:52.22+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Keep repository CI workflows thin and delegate execution to shared tooling

Repository workflow entrypoints must delegate synchronization and shared CI behavior to the centralized cicd-tooling reusable workflow rather than reimplementing that logic locally. This prevents workflow drift and ensures repositories receive consistent fixes and policy updates; apply this to future changes that would otherwise duplicate reusable workflow implementation.
