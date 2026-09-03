import { getDatabase } from "../db";
import { storage } from "../storage";
import * as campaignRepo from "../storage/campaignRepo";
import { Campaign, CampaignTemplate, Encounter } from "../types";
import { randomUUID } from "node:crypto";

export async function backfillCampaignEncounters(): Promise<{
  migrated: number;
  skipped: number;
  failed: number;
  encountersAdded: number;
}> {
  const db = await getDatabase();
  const campaignsCol = db.collection<Campaign>("campaigns");
  const templatesCol = db.collection<CampaignTemplate>("campaignTemplates");

  console.log("Finding campaigns with a templateId...");

  // 1.2 Fetch campaigns that have a truthy templateId
  const candidates = await campaignsCol
    .find({ templateId: { $exists: true, $ne: "" } })
    .toArray();

  console.log(`Found ${candidates.length} campaign(s) with a templateId.`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  let encountersAdded = 0;

  for (const campaign of candidates) {
    try {
      // 1.3 Fetch the corresponding CampaignTemplate
      const template = await templatesCol.findOne({ id: campaign.templateId });
      
      if (!template) {
        console.log(`  Skipping: ${campaign.name} (${campaign.id}) - Template not found.`);
        skipped++;
        continue;
      }

      if (!template.encounters || template.encounters.length === 0) {
        console.log(`  Skipping: ${campaign.name} (${campaign.id}) - Template has no encounters.`);
        skipped++;
        continue;
      }

      // 1.4 Fetch existing Encounter records for the campaign
      const existingEncounters = await storage.loadEncountersByIds(
        campaign.encounterIds || [],
        campaign.userId
      );
      
      const existingNames = new Set(existingEncounters.map(e => e.name));

      // 1.5 Implement name-matching
      const missingEncounters = template.encounters.filter(
        te => !existingNames.has(te.name)
      );

      if (missingEncounters.length === 0) {
        console.log(`  Skipping: ${campaign.name} (${campaign.id}) - All template encounters already exist.`);
        skipped++;
        continue;
      }

      // 1.6 Generate new Encounter records
      const now = new Date();
      const newEncounterIds: string[] = [];

      for (const missing of missingEncounters) {
        const newEncounter: Encounter = {
          ...missing,
          id: randomUUID(),
          userId: campaign.userId,
          createdAt: now,
          updatedAt: now,
        };
        
        await storage.saveEncounter(newEncounter);
        newEncounterIds.push(newEncounter.id);
        encountersAdded++;
      }

      // 1.7 Save the updated campaign
      campaign.encounterIds = [...(campaign.encounterIds || []), ...newEncounterIds];
      await campaignRepo.saveCampaign(campaign);
      
      console.log(`  Migrated: ${campaign.name} (${campaign.id}) - Added ${newEncounterIds.length} encounter(s).`);
      migrated++;

    } catch (error) {
      console.error(`  Failed: ${campaign.name} (${campaign.id})`, error);
      failed++;
    }
  }

  console.log(
    `\nDone. Migrated: ${migrated} campaigns, Added: ${encountersAdded} encounters, Skipped: ${skipped} campaigns, Failed: ${failed} campaigns`
  );

  return { migrated, skipped, failed, encountersAdded };
}

if (require.main === module) {
  backfillCampaignEncounters()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Backfill failed:", error);
      process.exit(1);
    });
}
