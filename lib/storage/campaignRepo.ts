import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import {
  Campaign,
  CampaignMemberSummary,
  CampaignCharacterShare,
  SavedContent,
  SessionLog,
} from "@/lib/types";
import { normalizeStoredEntityId } from "@/lib/storage/helpers";

export function normalizeCampaign(campaign: Campaign): Campaign {
  return {
    ...campaign,
    chapters: Array.isArray(campaign.chapters) ? campaign.chapters : [],
    encounterIds: Array.isArray(campaign.encounterIds) ? campaign.encounterIds : [],
    partyIds: Array.isArray(campaign.partyIds) ? campaign.partyIds : [],
    status: campaign.status ?? "active",
    notes: campaign.notes ?? "",
  };
}

export async function loadCampaigns(userId: string): Promise<Campaign[]> {
  return runStorageOp(
    { name: "loadCampaigns", collection: "campaigns", isEmpty: (res) => res.length === 0 },
    async () => {
      const db = await getDatabase();
      const campaigns = await db
        .collection<Campaign>("campaigns")
        .find({ userId })
        .toArray();
      return campaigns.map(normalizeStoredEntityId).map(normalizeCampaign);
    },
  );
}

export async function loadCampaignById(id: string, userId: string): Promise<Campaign | null> {
  return runStorageOp(
    { name: "loadCampaignById", collection: "campaigns", isEmpty: (res) => res === null },
    async () => {
      const db = await getDatabase();
      const campaign = await db
        .collection<Campaign>("campaigns")
        .findOne({ id, userId });
      return campaign ? normalizeCampaign(normalizeStoredEntityId(campaign)) : null;
    },
  );
}

export async function saveCampaign(campaign: Campaign): Promise<void> {
  return runStorageOp(
    { name: "saveCampaign", collection: "campaigns" },
    async () => {
      const db = await getDatabase();
      const { _id, ...campaignData } = campaign;
      await db
        .collection<Campaign>("campaigns")
        .updateOne(
          { id: campaign.id, userId: campaign.userId },
          { $set: campaignData },
          { upsert: true },
        );
    },
  );
}

export async function deleteCampaign(id: string, userId: string): Promise<void> {
  return runStorageOp(
    { name: "deleteCampaign", collection: "campaigns" },
    async () => {
      const db = await getDatabase();

      // Verify campaign exists and belongs to the user before deleting anything
      const campaign = await db
        .collection<Campaign>("campaigns")
        .findOne({ id, userId }, { projection: { id: 1 } });
      if (!campaign) {
        return;
      }

      // Cascade delete children first
      await Promise.all([
        db.collection("campaignMembers").deleteMany({ campaignId: id }),
        db.collection<SessionLog>("sessionLogs").deleteMany({ campaignId: id }),
        db.collection("campaignRolls").deleteMany({ campaignId: id }),
        db.collection<CampaignCharacterShare>("campaignCharacterShares").deleteMany({ campaignId: id }),
        db.collection<SavedContent>("savedContent").deleteMany({ campaignId: id }),
        db.collection("campaignMessages").deleteMany({ campaignId: id }),
      ]);

      // Delete the parent campaign document last
      await db.collection<Campaign>("campaigns").deleteOne({ id, userId });
    },
  );
}

export async function setActiveCampaignSession(
  campaignId: string,
  userId: string,
  sessionId: string | null,
): Promise<void> {
  return runStorageOp(
    { name: "setActiveCampaignSession", collection: "campaigns" },
    async () => {
      const db = await getDatabase();
      await db
        .collection<Campaign>("campaigns")
        .updateOne(
          { id: campaignId, userId },
          { $set: { activeSessionId: sessionId, updatedAt: new Date() } },
        );
    },
  );
}

export async function claimActiveCampaignSession(
  campaignId: string,
  userId: string,
  sessionId: string,
): Promise<boolean> {
  return runStorageOp(
    { name: "claimActiveCampaignSession", collection: "campaigns" },
    async () => {
      const db = await getDatabase();
      const result = await db
        .collection<Campaign>("campaigns")
        .updateOne(
          {
            id: campaignId,
            userId,
            $or: [{ activeSessionId: null }, { activeSessionId: { $exists: false } }],
          },
          { $set: { activeSessionId: sessionId, updatedAt: new Date() } },
        );
      return result.modifiedCount === 1;
    },
  );
}

export async function loadCampaignByIdAny(id: string): Promise<Campaign | null> {
  return runStorageOp(
    { name: "loadCampaignByIdAny", collection: "campaigns", isEmpty: (res) => res === null },
    async () => {
      const db = await getDatabase();
      const campaign = await db
        .collection<Campaign>("campaigns")
        .findOne({ id });
      return campaign ? normalizeCampaign(normalizeStoredEntityId(campaign)) : null;
    },
  );
}

export async function listCampaignsForMember(userId: string): Promise<CampaignMemberSummary[]> {
  return runStorageOp(
    {
      name: "listCampaignsForMember",
      collection: "campaignMembers",
      isEmpty: (res) => res.length === 0,
    },
    async () => {
      const db = await getDatabase();
      const memberships = await db
        .collection<{ campaignId: string }>("campaignMembers")
        .find({ userId })
        .toArray();
      if (memberships.length === 0) {
        return [];
      }
      const campaignIds = memberships.map((m) => m.campaignId);
      const campaigns = await db
        .collection<Campaign>("campaigns")
        .find({ id: { $in: campaignIds } }, { projection: { id: 1, name: 1 } })
        .toArray();
      return campaigns.map((c) => ({
        id: c.id,
        name: c.name,
      }));
    },
  );
}

export async function getCampaignsByIds(
  campaignIds: string[],
): Promise<Pick<Campaign, "id" | "name">[]> {
  if (campaignIds.length === 0) return [];
  return runStorageOp(
    { name: "getCampaignsByIds", collection: "campaigns", isEmpty: (res) => res.length === 0 },
    async () => {
      const db = await getDatabase();
      const docs = await db
        .collection<Campaign>("campaigns")
        .find({ id: { $in: campaignIds } }, { projection: { id: 1, name: 1, _id: 0 } })
        .toArray();
      return docs as Pick<Campaign, "id" | "name">[];
    },
  );
}
