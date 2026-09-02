# Project Memory Index

*Auto-generated — managed by verity CLI. Do not hand-edit; changes are overwritten.*

> If you are an AI coding agent reading this via CLAUDE.md: scan the catalog below for any node whose title, kind, or file scope is relevant to the task the user just asked you to do. Open the matching files via the Read tool before writing code. Most projects accumulate dozens to hundreds of nodes — do not read them all; pick the few that fit the current change.

## decisions/ (43)

- [[n015-model-session-lifecycle-as-its-own-campaign-stream]] — **Model session lifecycle as its own campaign stream event variant**
  *decision* · 84%
- [[n016-use-sse-campaign-events-for-session-state-updates]] — **Use SSE campaign events for session-state updates instead of polling**
  *decision* · 84%
- [[n017-invalidate-persisted-dock-height-when-the-viewport]] — **Invalidate persisted dock height when the viewport changes materially**
  *decision* · 86%
- [[n018-store-feedback-rate-limits-in-a-ttl-backed-mongodb]] — **Store feedback rate limits in a TTL-backed MongoDB collection**
  *decision* · 87%
- [[n019-create-github-issues-server-side-to-keep-the-token]] — **Create GitHub issues server-side to keep the token off the client**
  *decision* · 91% · scope: `app/api/**/route.ts`
- [[n020-validate-persisted-chat-sizes-before-reducer-updat]] — **Validate persisted chat sizes before reducer updates**
  *decision* · 88%
- [[n021-sanitize-header-derived-text-before-including-it-i]] — **Sanitize header-derived text before including it in GitHub issue bodies**
  *decision* · 92%
- [[n022-restrict-feedback-issue-context-urls-to-same-origi]] — **Restrict feedback issue context URLs to same-origin or https**
  *decision* · 91%
- [[n023-reject-malformed-feedback-json-before-any-destruct]] — **Reject malformed feedback JSON before any destructuring**
  *decision* · 86%
- [[n024-treat-malformed-forwarded-ip-headers-as-non-fatal]] — **Treat malformed forwarded IP headers as non-fatal and fall back to x-real-ip**
  *decision* · 78%
- [[n025-run-codacy-finalization-with-if-always]] — **Run Codacy finalization with `if: always()`**
  *decision* · 84% · scope: `.github/workflows/*.yml`
- [[n026-use-relative-links-for-spec-references]] — **Use relative links for spec references**
  *decision* · 82% · scope: `docs/**/*.md`
- [[n027-keep-repo-workflows-thin-and-centralize-shared-ci]] — **Keep repo workflows thin and centralize shared CI logic in cicd-tooling**
  *decision* · 82% · scope: `.github/workflows/*.yml`
- [[n028-use-paragraph-text-not-label-for-non-input-chapter]] — **Use paragraph text, not <label>, for non-input chapter headings**
  *decision* · 91%
- [[n029-open-the-chapters-accordion-before-asserting-chapt]] — **Open the chapters accordion before asserting chapter-empty states**
  *decision* · 84%
- [[n030-clear-invalid-currentchapterid-before-persisting-c]] — **Clear invalid currentChapterId before persisting campaign edits**
  *decision* · 90%
- [[n031-validate-scenecomposer-file-and-campaign-inputs-be]] — **Validate SceneComposer file and campaign inputs before upload**
  *decision* · 79% · scope: `**/SceneComposer*`, `**/*SceneComposer*/**`
- [[n032-mark-monster-import-failures-as-alerts]] — **Mark monster import failures as alerts**
  *decision* · 83%
- [[n033-use-data-testid-when-playwright-role-selectors-are]] — **Use `data-testid` when Playwright role selectors are ambiguous**
  *decision* · 87%
- [[n034-assert-route-matches-with-an-end-of-path-regex-not]] — **Assert route matches with an end-of-path regex, not substring containment**
  *decision* · 81%
- [[n035-preserve-party-membership-history-on-rejoin]] — **Preserve party membership history on rejoin**
  *decision* · 90%
- [[n036-allow-membership-changes-by-self-or-active-dm-only]] — **Allow membership changes by self or active DM only**
  *decision* · 84%
- [[n037-treat-http-207-as-partial-success-and-keep-the-err]] — **Treat HTTP 207 as partial success and keep the error message visible**
  *decision* · 88%
- [[n042-rollback-campaign-creation-if-dependent-party-memb]] — **Rollback campaign creation if dependent party/member creation fails**
  *decision* · 80%
- [[n043-route-storage-events-through-one-logging-seam-for]] — **Route storage events through one logging seam for future telemetry**
  *decision* · 91%
- [[n044-decompose-storage-by-domain-behind-a-stable-storag]] — **Decompose storage by domain behind a stable storage facade**
  *decision* · 88% · scope: `lib/storage.ts`
- [[n045-use-a-four-value-taxonomy-for-storage-error-behavi]] — **Use a four-value taxonomy for storage error behavior**
  *decision* · 88% · scope: `lib/storage.ts`, `openspec/**`
- [[n046-build-formulas-from-structured-staged-counts-not-f]] — **Build formulas from structured staged counts, not free-form input**
  *decision* · 84%
- [[n047-render-dice-popouts-through-a-body-level-portal]] — **Render dice popouts through a body-level portal**
  *decision* · 88%
- [[n048-validate-every-dice-pool-group-before-producing-an]] — **Validate every dice-pool group before producing any results**
  *decision* · 90%
- [[n049-keep-staged-dice-local-until-the-roll-is-committed]] — **Keep staged dice local until the roll is committed**
  *decision* · 78%
- [[n050-keep-dice-generation-client-side-only-with-server]] — **Keep dice generation client-side only with server validation of submitted results**
  *decision* · 86% · scope: `**/dice/**`, `**/rolls/**`
- [[n051-centralize-unbiased-dice-generation-behind-a-rejec]] — **Centralize unbiased dice generation behind a rejection-sampling utility**
  *decision* · 86%
- [[n163-apply-vendor-fixes-with-exact-version-patch-packag]] — **Apply vendor fixes with exact-version patch-package patches**
  *decision* · 88% · scope: `patches/**`, `package.json`
- [[n164-generate-an-isolated-jwt-secret-for-each-integrati]] — **Generate an isolated JWT secret for each integration-test run**
  *decision* · 88% · scope: `tests/integration/global.setup.ts`
- [[n165-use-a-shared-numeric-chip-readout-for-pool-and-per]] — **Use a shared numeric-chip readout for pool and percentile dice**
  *decision* · 90%
- [[n166-cap-displayed-dice-at-15-while-preserving-the-full]] — **Cap displayed dice at 15 while preserving the full-pool total**
  *decision* · 83%
- [[n167-keep-the-dice-canvas-host-mounted-when-hiding-comp]] — **Keep the dice canvas host mounted when hiding completed or fallback animations**
  *decision* · 84% · scope: `**/dice/**`
- [[n168-pin-patched-dependencies-to-the-exact-version-targ]] — **Pin patched dependencies to the exact version targeted by the patch**
  *decision* · 90% · scope: `package.json`
- [[n169-keep-dice-box-threejs-pinned-while-its-patch-packa]] — **Keep dice-box-threejs pinned while its patch-package patch applies**
  *decision* · 91% · scope: `package.json`
- [[n170-keep-repository-ci-workflows-thin-and-delegate-exe]] — **Keep repository CI workflows thin and delegate execution to shared tooling**
  *decision* · 87% · scope: `.github/workflows/**`
- [[n171-provide-manual-dispatch-for-synchronization-workfl]] — **Provide manual dispatch for synchronization workflows**
  *decision* · 87%
- [[n172-persist-dice-appearance-preferences-as-validated-s]] — **Persist dice appearance preferences as validated scalar IDs**
  *decision* · 88%

## domain/ (4)

- [[n001-project-overview]] — **Project overview**
  *domain* · 60%
- [[n002-project-purpose]] — **Project purpose**
  *domain* · 50%
- [[n010-tool-preferences]] — **Tool Preferences**
  *domain* · 60%
- [[n011-project-memory]] — **Project Memory**
  *domain* · 60%

## integrations/ (7)

- [[n003-nextjs]] — **nextjs**
  *integration* · 50%
- [[n004-react]] — **react**
  *integration* · 50%
- [[n005-postgresql]] — **postgresql**
  *integration* · 50%
- [[n006-mongodb]] — **mongodb**
  *integration* · 50%
- [[n007-tailwindcss]] — **tailwindcss**
  *integration* · 50%
- [[n008-jest]] — **jest**
  *integration* · 50%
- [[n009-playwright]] — **playwright**
  *integration* · 50%

