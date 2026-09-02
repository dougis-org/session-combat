import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import { CampaignTemplate } from "@/lib/types";
import { normalizeStoredEntityId } from "@/lib/storage/helpers";
import { GLOBAL_USER_ID } from "@/lib/constants";

export async function loadGlobalCampaignTemplates(): Promise<CampaignTemplate[]> {
  return runStorageOp(
    {
      name: "loadGlobalCampaignTemplates",
      collection: "campaignTemplates",
      isEmpty: (res) => res.length === 0,
    },
    async () => {
      const db = await getDatabase();
      const templates = await db
        .collection<CampaignTemplate>("campaignTemplates")
        .find({ userId: GLOBAL_USER_ID })
        .sort({ name: 1 })
        .collation({ locale: "en", strength: 2 })
        .toArray();
      return templates.map(normalizeStoredEntityId);
    },
  );
}

export async function loadGlobalCampaignTemplateById(id: string): Promise<CampaignTemplate | null> {
  return runStorageOp(
    {
      name: "loadGlobalCampaignTemplateById",
      collection: "campaignTemplates",
      isEmpty: (res) => res === null,
    },
    async () => {
      const db = await getDatabase();
      // nosemgrep: rules.lgpl.javascript.database.rule-node-nosqli-injection --
      // `id` is used as an equality match on a string field; an object-typed
      // value cannot match and is not an injection vector. Logic relocated
      // verbatim from lib/storage.ts.
      const template = await db
        .collection<CampaignTemplate>("campaignTemplates")
        .findOne({ id, userId: GLOBAL_USER_ID });
      return template ? normalizeStoredEntityId(template) : null;
    },
  );
}

export async function saveCampaignTemplate(template: CampaignTemplate): Promise<void> {
  return runStorageOp(
    { name: "saveCampaignTemplate", collection: "campaignTemplates" },
    async () => {
      const db = await getDatabase();
      const { _id, ...templateData } = template;
      await db
        .collection<CampaignTemplate>("campaignTemplates")
        .updateOne(
          { id: template.id, userId: template.userId },
          { $set: templateData },
          { upsert: true },
        );
    },
  );
}

export async function deleteCampaignTemplate(id: string): Promise<boolean> {
  return runStorageOp(
    { name: "deleteCampaignTemplate", collection: "campaignTemplates" },
    async () => {
      const db = await getDatabase();
      const result = await db
        .collection<CampaignTemplate>("campaignTemplates")
        .deleteOne({ id, userId: GLOBAL_USER_ID });
      return result.deletedCount > 0;
    },
  );
}
