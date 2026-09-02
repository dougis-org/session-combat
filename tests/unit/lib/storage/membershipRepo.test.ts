/**
 * @jest-environment node
 *
 * `listMembersForCampaign` non-test callers and their post-change behavior
 * (a driver failure now rejects with StorageError instead of returning []):
 *  - app/api/campaigns/[id]/members/route.ts:17   — maps members → response list
 *  - app/api/campaigns/[id]/rolls/route.ts:83     — filters to active members
 *  - app/api/campaigns/[id]/messages/route.ts:137 — filters to active members
 *  - lib/server/transport.ts:66                   — filters to active members
 * None treats `members.length === 0` as anything but "no members".
 */
import * as repo from "@/lib/storage/membershipRepo";
import { storage } from "@/lib/storage";
import { StorageError } from "@/lib/storage/errors";
import { DuplicateMemberError } from "@/lib/errors";
import * as logger from "@/lib/telemetry/logger";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
import { mockCollection } from "./_repoMock";

const dupKeyError = () => Object.assign(new Error("E11000 duplicate key"), { code: 11000 });

let logSpy: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(logger, "logStorageEvent").mockImplementation();
});
afterEach(() => logSpy.mockRestore());

const member = { campaignId: "c1", userId: "u1", role: "player", status: "active" } as never;

describe("membershipRepo", () => {
  describe("addMember", () => {
    it("success inserts data stripped of _id", async () => {
      const col = mockCollection();
      await repo.addMember({ ...(member as object), _id: "507f1f77bcf86cd799439011" } as never);
      expect(col.insertOne).toHaveBeenCalledWith(
        expect.not.objectContaining({ _id: expect.anything() }),
      );
    });

    it("11000 insert error → DuplicateMemberError, NOT StorageError", async () => {
      mockCollection({ insertOne: dupKeyError() });
      const err = await repo.addMember(member).catch((e) => e);
      expect(err).toBeInstanceOf(DuplicateMemberError);
      expect(err).not.toBeInstanceOf(StorageError);
    });

    it("non-11000 insert error → StorageError", async () => {
      mockCollection({ insertOne: new Error("network") });
      await expect(repo.addMember(member)).rejects.toBeInstanceOf(StorageError);
    });

    it("logs one error event on both failure paths", async () => {
      mockCollection({ insertOne: dupKeyError() });
      await repo.addMember(member).catch(() => {});
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ outcome: "error" }));

      logSpy.mockClear();
      mockCollection({ insertOne: new Error("network") });
      await repo.addMember(member).catch(() => {});
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ outcome: "error" }));
    });
  });

  describe("updateMemberStatus", () => {
    it("success pushes a history entry; DB failure → StorageError", async () => {
      const col = mockCollection();
      await repo.updateMemberStatus("c1", "u1", "active" as never, "actor1");
      expect(col.updateOne).toHaveBeenCalledWith(
        { campaignId: "c1", userId: "u1" },
        expect.objectContaining({ $push: expect.anything() }),
      );

      mockCollection({ updateOne: new Error("db down") });
      await expect(
        repo.updateMemberStatus("c1", "u1", "active" as never, "actor1"),
      ).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe("listMembersForCampaign", () => {
    it("members present → mapped without _id", async () => {
      mockCollection({ findResult: [{ _id: "507f1f77bcf86cd799439011", campaignId: "c1", userId: "u1" }] });
      const res = await repo.listMembersForCampaign("c1");
      expect(res[0]).not.toHaveProperty("_id");
    });

    it("member-less campaign → [] no throw, outcome not_found", async () => {
      mockCollection({ findResult: [] });
      await expect(repo.listMembersForCampaign("c1")).resolves.toEqual([]);
      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({ outcome: "not_found" }));
    });

    it("DB failure → StorageError (was: [])", async () => {
      mockCollection({ findResult: new Error("db down") });
      await expect(repo.listMembersForCampaign("c1")).rejects.toMatchObject({
        op: "listMembersForCampaign",
        collection: "campaignMembers",
      });
    });
  });

  describe("getMember", () => {
    it("present → member without _id; absent → null; DB failure → StorageError (not null, not raw)", async () => {
      mockCollection({ findOne: { _id: "507f1f77bcf86cd799439011", campaignId: "c1", userId: "u1", status: "active" } });
      await expect(repo.getMember("c1", "u1")).resolves.not.toHaveProperty("_id");

      mockCollection({ findOne: null });
      await expect(repo.getMember("c1", "u1")).resolves.toBeNull();

      mockCollection({ findOne: new Error("connection reset") });
      const err = await repo.getMember("c1", "u1").catch((e) => e);
      expect(err).toBeInstanceOf(StorageError);
      expect(err.message).not.toContain("connection reset");
    });
  });

  describe("listInvitationsForUser", () => {
    it("success / empty ([]) / DB failure (StorageError)", async () => {
      mockCollection({ findResult: [{ campaignId: "c1", userId: "u1", status: "invited" }] });
      await expect(repo.listInvitationsForUser("u1")).resolves.toHaveLength(1);

      mockCollection({ findResult: [] });
      await expect(repo.listInvitationsForUser("u1")).resolves.toEqual([]);

      mockCollection({ findResult: new Error("db down") });
      await expect(repo.listInvitationsForUser("u1")).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe("getUserById", () => {
    const OID = "507f1f77bcf86cd799439011";
    it("hit / miss (null) / DB failure (StorageError)", async () => {
      mockCollection({ findOne: { _id: OID, username: "alice" } });
      await expect(repo.getUserById(OID)).resolves.toEqual({ id: OID, username: "alice" });

      mockCollection({ findOne: null });
      await expect(repo.getUserById(OID)).resolves.toBeNull();

      mockCollection({ findOne: new Error("db down") });
      await expect(repo.getUserById(OID)).rejects.toBeInstanceOf(StorageError);
    });

    it("invalid id throws InvalidUserIdError before touching the DB", async () => {
      const col = mockCollection();
      await expect(repo.getUserById("not-an-oid")).rejects.toThrow();
      expect(col.findOne).not.toHaveBeenCalled();
    });
  });

  describe("getUsersByIds", () => {
    const OID = "507f1f77bcf86cd799439011";
    it("empty input → {} without DB; partial match returns found subset; DB failure → StorageError", async () => {
      const col = mockCollection();
      await expect(repo.getUsersByIds([])).resolves.toEqual({});
      expect(col.find).not.toHaveBeenCalled();

      mockCollection({ findResult: [{ _id: { toString: () => OID }, username: "alice" }] });
      await expect(repo.getUsersByIds([OID])).resolves.toEqual({ [OID]: "alice" });

      mockCollection({ findResult: new Error("db down") });
      await expect(repo.getUsersByIds([OID])).rejects.toBeInstanceOf(StorageError);
    });
  });

  it("facade exposes all 7 membership methods", () => {
    for (const n of [
      "addMember",
      "updateMemberStatus",
      "listMembersForCampaign",
      "getMember",
      "listInvitationsForUser",
      "getUserById",
      "getUsersByIds",
    ]) {
      expect(typeof (storage as Record<string, unknown>)[n]).toBe("function");
    }
  });
});
