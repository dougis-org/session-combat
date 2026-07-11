import { getDatabase } from "../db";
import { Campaign, Party } from "../types";

export async function backfillDefaultParties(): Promise<{
  backfilled: number;
  skipped: number;
  failed: number;
}> {
  const db = await getDatabase();
  const campaigns = db.collection<Campaign>("campaigns");
  const parties = db.collection<Party>("parties");

  console.log("Finding campaigns with no associated party...");

  const totalCampaigns = await campaigns.countDocuments();

  const candidates = await campaigns
    .aggregate<Campaign>([
      {
        $lookup: {
          from: "parties",
          let: { campaignId: "$id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$campaignId", "$$campaignId"] } } },
            { $limit: 1 },
            { $project: { _id: 1 } },
          ],
          as: "linkedParties",
        },
      },
      { $match: { linkedParties: { $size: 0 } } },
      { $project: { linkedParties: 0 } },
    ])
    .toArray();

  console.log(`Found ${candidates.length} campaign(s) missing a party.`);

  const now = new Date();
  let backfilled = 0;
  let failed = 0;
  const skipped = totalCampaigns - candidates.length;

  for (const campaign of candidates) {
    const party: Party = {
      id: crypto.randomUUID(),
      userId: campaign.userId,
      name: "Main Party",
      description: "",
      members: [],
      campaignId: campaign.id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await parties.insertOne(party as Party & { _id?: unknown });
      console.log(`  Backfilled: ${campaign.name} (${campaign.id})`);
      backfilled++;
    } catch (error) {
      console.error(`  Failed: ${campaign.name} (${campaign.id})`, error);
      failed++;
    }
  }

  console.log(
    `\nDone. Backfilled: ${backfilled}, Skipped: ${skipped}, Failed: ${failed}`
  );

  return { backfilled, skipped, failed };
}

if (require.main === module) {
  backfillDefaultParties()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Backfill failed:", error);
      process.exit(1);
    });
}
