import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db";
import { runStorageOp } from "@/lib/storage/runOp";
import {
  CampaignMember,
  MemberHistoryEntry,
  MemberRole,
  MemberStatus,
  PublicUser,
} from "@/lib/types";
import { DuplicateMemberError } from "@/lib/errors";
import { InvalidUserIdError } from "@/lib/permissions";
import { normalizeStoredEntityId } from "@/lib/storage/helpers";

/**
 * Post-change contract: a driver failure in these reads now rejects with
 * `StorageError` instead of being masked as an empty list / null. Every
 * `listMembersForCampaign` caller (the members, rolls and messages campaign
 * routes, plus `lib/server/transport`) treats an empty result purely as "no
 * members", so the only observable change is that a real outage becomes an
 * honest 500 rather than a silent empty state.
 */

function stripMemberId(doc: CampaignMember): CampaignMember {
  const normalized = normalizeStoredEntityId(doc);
  const { _id, ...rest } = normalized;
  return rest as CampaignMember;
}

export async function addMember(member: CampaignMember): Promise<void> {
  return runStorageOp(
    {
      name: "addMember",
      collection: "campaignMembers",
      rethrowAsIs: (error) => error instanceof DuplicateMemberError,
    },
    async () => {
      const db = await getDatabase();
      const { _id, ...insertData } = member;
      try {
        await db
          .collection<CampaignMember>("campaignMembers")
          .insertOne(insertData as CampaignMember);
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === 11000
        ) {
          throw new DuplicateMemberError(member.campaignId, member.userId);
        }
        throw error;
      }
    },
  );
}

export async function updateMemberStatus(
  campaignId: string,
  userId: string,
  status: MemberStatus,
  actorId: string,
  role?: MemberRole,
): Promise<void> {
  return runStorageOp(
    { name: "updateMemberStatus", collection: "campaignMembers" },
    async () => {
      const db = await getDatabase();
      const historyEntry: MemberHistoryEntry = { action: status, by: actorId, at: new Date() };
      const setFields = role !== undefined ? { status, role } : { status };
      await db
        .collection<CampaignMember>("campaignMembers")
        .updateOne(
          { campaignId, userId },
          { $set: setFields, $push: { history: historyEntry } as never },
        );
    },
  );
}

export async function listMembersForCampaign(campaignId: string): Promise<CampaignMember[]> {
  return runStorageOp(
    {
      name: "listMembersForCampaign",
      collection: "campaignMembers",
      isEmpty: (res) => res.length === 0,
    },
    async () => {
      const db = await getDatabase();
      const members = await db
        .collection<CampaignMember>("campaignMembers")
        .find({ campaignId })
        .toArray();
      return members.map(stripMemberId);
    },
  );
}

export async function getMember(
  campaignId: string,
  userId: string,
): Promise<CampaignMember | null> {
  return runStorageOp(
    { name: "getMember", collection: "campaignMembers", isEmpty: (res) => res === null },
    async () => {
      const db = await getDatabase();
      const doc = await db
        .collection<CampaignMember>("campaignMembers")
        .findOne({ campaignId, userId });
      return doc ? stripMemberId(doc) : null;
    },
  );
}

export async function listInvitationsForUser(userId: string): Promise<CampaignMember[]> {
  return runStorageOp(
    {
      name: "listInvitationsForUser",
      collection: "campaignMembers",
      isEmpty: (res) => res.length === 0,
    },
    async () => {
      const db = await getDatabase();
      const members = await db
        .collection<CampaignMember>("campaignMembers")
        .find({ userId, status: "invited" })
        .toArray();
      return members.map(stripMemberId);
    },
  );
}

export async function getUserById(userId: string): Promise<PublicUser | null> {
  if (!ObjectId.isValid(userId)) throw new InvalidUserIdError(userId);
  return runStorageOp(
    { name: "getUserById", collection: "users", isEmpty: (res) => res === null },
    async () => {
      const db = await getDatabase();
      const doc = await db
        .collection("users")
        .findOne({ _id: { $eq: new ObjectId(userId) } }, { projection: { username: 1 } });
      if (!doc || !doc["username"]) return null;
      return { id: userId, username: doc["username"] as string };
    },
  );
}

export async function getUsersByIds(userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};
  const validObjectIds = userIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));
  if (validObjectIds.length === 0) return {};
  return runStorageOp(
    {
      name: "getUsersByIds",
      collection: "users",
      isEmpty: (res) => Object.keys(res).length === 0,
    },
    async () => {
      const db = await getDatabase();
      const docs = await db
        .collection("users")
        .find({ _id: { $in: validObjectIds } }, { projection: { username: 1 } })
        .toArray();
      const result: Record<string, string> = {};
      for (const doc of docs) {
        if (doc["username"]) {
          result[doc._id.toString()] = doc["username"] as string;
        }
      }
      return result;
    },
  );
}
