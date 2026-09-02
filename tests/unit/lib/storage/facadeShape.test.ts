/**
 * @jest-environment node
 *
 * Guardrail (#503): the per-domain repo migration must not change the public
 * shape of the `storage` facade. The count below was snapshotted from
 * `origin/main` before the migration (72 flat methods + the `savedContent`
 * namespace object = 73 own-enumerable keys).
 */
import { storage } from "@/lib/storage";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));

const PRE_MIGRATION_OWN_KEY_COUNT = 73;

describe("storage facade shape", () => {
  it("has the same number of own-enumerable keys as before the migration", () => {
    expect(Object.keys(storage)).toHaveLength(PRE_MIGRATION_OWN_KEY_COUNT);
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
