---
schema: 1
id: n169-keep-dice-box-threejs-pinned-while-its-patch-packa
kind: decision
title: "Keep dice-box-threejs pinned while its patch-package patch applies"
domains: ["dependencies", "patch-package", "dice-box"]
file_globs:
  - "package.json"
confidence: 0.91
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-31T05:19:47.0407+00:00
updated_at: 2026-08-31T05:19:46.938+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Keep dice-box-threejs pinned while its patch-package patch applies

Keep `@drdreo/dice-box-threejs` at version 1.1.0 whenever the checked-in patch-package patch targets that release. The patch depends on the package's exact source shape, so upgrading it without revising and validating the patch can silently remove required behavior or make installs fail. This applies to dependency updates affecting the dice-box integration.
