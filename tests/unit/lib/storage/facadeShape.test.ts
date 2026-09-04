/**
 * @jest-environment node
 *
 * Guardrail (#503): the per-domain repo migration must not change the public
 * shape of the `storage` facade. The count below was snapshotted from
 * `origin/main` before the migration (72 flat methods + the `savedContent`
 * namespace object = 73 own-enumerable keys).
 *
 * #504 intentionally removes exactly one method — `storage.load()` (zero
 * non-test callers; its partial-empty degradation path became dead code once
 * #502/#503 migrated its five sub-loaders to throw). The count therefore drops
 * by one, to 72.
 *
 * monster-json-import-modal (#626) adds three monster-import methods
 * (`saveManyMonsterTemplates`, `deleteMonsterTemplatesByIds`,
 * `findExistingMonsterKeys`), taking the count to 75.
 */
import { storage } from "@/lib/storage";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));

const OWN_KEY_COUNT = 75;

describe("storage facade shape", () => {
  it("exposes the expected number of own-enumerable keys", () => {
    expect(Object.keys(storage)).toHaveLength(OWN_KEY_COUNT);
  });

  it("no longer exposes storage.load", () => {
    expect((storage as Record<string, unknown>).load).toBeUndefined();
  });

  it("keeps savedContent nested with its 4 methods", () => {
    expect(Object.keys(storage.savedContent).sort()).toEqual([
      "create",
      "list",
      "remove",
      "update",
    ]);
  });

  it("exposes all 27 migrated methods as functions with unchanged names", () => {
    const migrated = [
      "loadMonsterTemplates", "loadGlobalMonsterTemplates", "loadAllMonsterTemplates",
      "saveMonsterTemplate", "deleteMonsterTemplate", "monsterExistsByNameAndSource",
      "findMonsterByNameAndSource", "loadGlobalCampaignTemplates",
      "loadGlobalCampaignTemplateById", "saveCampaignTemplate", "deleteCampaignTemplate",
      "loadCampaigns", "loadCampaignById", "saveCampaign", "deleteCampaign",
      "setActiveCampaignSession", "claimActiveCampaignSession", "loadCampaignByIdAny",
      "listCampaignsForMember", "getCampaignsByIds", "addMember", "updateMemberStatus",
      "listMembersForCampaign", "getMember", "listInvitationsForUser", "getUserById",
      "getUsersByIds",
    ];
    expect(migrated).toHaveLength(27);
    for (const name of migrated) {
      expect(typeof (storage as Record<string, unknown>)[name]).toBe("function");
    }
  });
});
