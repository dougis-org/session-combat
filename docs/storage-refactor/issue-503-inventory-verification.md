# Issue #503 — Sub-task A inventory re-verification

Verified against `lib/storage.ts` (1071 lines) on branch `refactor-storage-issue-503`.

## The 27 methods (all still present, signatures unchanged)

### Monster templates (7) — `monsterTemplateRepo.ts`
| Method | Line | Current behavior | Post-change |
|---|---|---|---|
| `loadMonsterTemplates` | 90 | swallow → `[]` | `StorageError`; `isEmpty` len===0 |
| `loadGlobalMonsterTemplates` | 105 | delegates `this.loadMonsterTemplates(GLOBAL_USER_ID)`, no own try | direct sibling call |
| `loadAllMonsterTemplates` | 110 | swallow → `[]` | `StorageError`; `isEmpty` len===0; 2 callers (monsters/route, monsters/[id]/duplicate/route) |
| `saveMonsterTemplate` | 467 | rethrow raw | `StorageError` |
| `deleteMonsterTemplate` | 483 | rethrow raw | `StorageError` |
| `monsterExistsByNameAndSource` | 583 | swallow → `false` | `StorageError`; result boolean, NO `isEmpty` |
| `findMonsterByNameAndSource` | 599 | swallow → `null` | `StorageError`; `isEmpty` res===null |

### Campaign templates (4) — `campaignTemplateRepo.ts`
| Method | Line | Current behavior | Post-change |
|---|---|---|---|
| `loadGlobalCampaignTemplates` | 124 | swallow → `[]` | `StorageError`; sort name asc + collation en/2; `isEmpty` len===0 |
| `loadGlobalCampaignTemplateById` | 141 | swallow → `null` | `StorageError`; `isEmpty` res===null |
| `saveCampaignTemplate` | 155 | rethrow raw | `StorageError` |
| `deleteCampaignTemplate` | 173 | rethrow raw | `StorageError`; returns `deletedCount > 0`, NO `isEmpty` |

### Campaigns (9) — `campaignRepo.ts`
| Method | Line | Current behavior | Post-change |
|---|---|---|---|
| `loadCampaigns` | 187 | swallow → `[]` | `StorageError`; `isEmpty` len===0 |
| `loadCampaignById` | 202 | swallow → `null` | `StorageError`; `isEmpty` res===null |
| `saveCampaign` | 216 | rethrow raw | `StorageError` |
| `deleteCampaign` | 285 | rethrow raw | `StorageError`; keeps early-return on missing campaign + cascade delete |
| `setActiveCampaignSession` | 315 | rethrow raw | `StorageError` |
| `claimActiveCampaignSession` | 330 | rethrow raw | `StorageError`; returns `modifiedCount === 1`, NO `isEmpty` |
| `loadCampaignByIdAny` | 836 | rethrow raw | `StorageError`; `isEmpty` res===null |
| `listCampaignsForMember` | 849 | swallow → `[]` | `StorageError`; keeps early-return `[]` for no memberships; `isEmpty` len===0 |
| `getCampaignsByIds` | 917 | no-try | `StorageError`; keeps early-return `[]` for empty input |

### Membership (7) — `membershipRepo.ts`
| Method | Line | Current behavior | Post-change |
|---|---|---|---|
| `addMember` | 763 | rethrow; `11000` → `DuplicateMemberError` | `StorageError` except `11000` → `DuplicateMemberError` via `rethrowAsIs` |
| `updateMemberStatus` | 779 | rethrow raw | `StorageError` |
| `listMembersForCampaign` | 802 | swallow → `[]` | `StorageError`; `isEmpty` len===0; **4 callers** |
| `getMember` | 820 | rethrow raw | `StorageError`; `isEmpty` res===null |
| `listInvitationsForUser` | 904 | no-try | `StorageError`; `isEmpty` len===0 |
| `getUserById` | 874 | no-try; throws `InvalidUserIdError` pre-DB | `StorageError`; `InvalidUserIdError` stays outside `runStorageOp`; `isEmpty` res===null |
| `getUsersByIds` | 884 | no-try; early-returns `{}` | `StorageError`; keeps early-returns for empty/no-valid-ids |

## Confirmed from the #503 issue comment
- The 10 swallowing methods still swallow: `loadMonsterTemplates`, `loadAllMonsterTemplates`,
  `monsterExistsByNameAndSource`, `findMonsterByNameAndSource`, `loadGlobalCampaignTemplates`,
  `loadGlobalCampaignTemplateById`, `loadCampaigns`, `loadCampaignById`, `listCampaignsForMember`,
  `listMembersForCampaign`. ✔
- `getMember` still rethrows (raw). ✔
- `addMember` still wraps `11000` → `DuplicateMemberError`. ✔

## Inventory drift found
1. **`DuplicateMemberError` catch sites: 1, not 3.** Only
   `app/api/campaigns/[id]/members/route.ts:99` branches on
   `error instanceof DuplicateMemberError`. The other two `addMember` callers —
   `app/api/campaigns/route.ts:89` and `app/api/campaigns/global/[id]/copy/route.ts:39` —
   create a brand-new campaign whose creator cannot already be a member, so a duplicate
   key is unreachable there and they do not catch it. Contract is still preserved for the
   one real site.
2. `listMembersForCampaign` has **4** non-test callers:
   `app/api/campaigns/[id]/members/route.ts:17`, `app/api/campaigns/[id]/rolls/route.ts:83`,
   `app/api/campaigns/[id]/messages/route.ts:137`, `lib/server/transport.ts:66`. None treats
   `members.length === 0` as anything other than "no members" — all iterate/filter, so the
   swallow→rethrow conversion only turns a masked DB outage into an honest 500.
3. `assertCampaignAccess` (`lib/utils/campaign.ts:11`) calls `getMember` with no try/catch —
   a thrown `StorageError` already propagates today (getMember rethrows); the change only
   improves the error type. Verified it does NOT fall through to `loadCampaignByIdAny`.
