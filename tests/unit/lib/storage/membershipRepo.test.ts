/**
 * @jest-environment node
 *
 * Post-change contract for the reads below: a driver failure now rejects with
 * StorageError instead of returning [] / null. Every `listMembersForCampaign`
 * caller (the members, rolls and messages campaign routes, plus
 * `lib/server/transport`) treats an empty result purely as "no members", so the
 * only observable change is that a real outage becomes an honest 500.
 */
import * as repo from "@/lib/storage/membershipRepo";
import { storage } from "@/lib/storage";
import { StorageError } from "@/lib/storage/errors";
import { DuplicateMemberError } from "@/lib/errors";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
import {
  mockCollection,
  installStorageLogSpy,
  expectStorageError,
  expectLoggedOutcome,
  expectFacadeMethods,
} from "./_repoMock";

const getLogSpy = installStorageLogSpy();
const DB_DOWN = () => new Error("db down");
const dupKeyError = () => Object.assign(new Error("E11000 duplicate key"), { code: 11000 });

const OID = "507f1f77bcf86cd799439011";
const member = { campaignId: "c1", userId: "u1", role: "player", status: "active" } as never;

describe("membershipRepo", () => {
  describe("addMember", () => {
    it("inserts the member with _id stripped", async () => {
      const col = mockCollection();
      await repo.addMember({ ...(member as object), _id: OID } as never);
      expect(col.insertOne).toHaveBeenCalledWith(expect.not.objectContaining({ _id: expect.anything() }));
    });

    it("maps an 11000 insert error to DuplicateMemberError, not StorageError", async () => {
      mockCollection({ insertOne: dupKeyError() });
      const err = await repo.addMember(member).catch((e) => e);
      expect(err).toBeInstanceOf(DuplicateMemberError);
      expect(err).not.toBeInstanceOf(StorageError);
    });

    it("wraps a non-11000 insert error in StorageError", async () => {
      mockCollection({ insertOne: new Error("network") });
      await expectStorageError(repo.addMember(member));
    });

    it("logs exactly one error event on either failure path", async () => {
      for (const insertOne of [dupKeyError(), new Error("network")]) {
        getLogSpy().mockClear();
        mockCollection({ insertOne });
        await repo.addMember(member).catch(() => {});
        expect(getLogSpy()).toHaveBeenCalledTimes(1);
        expectLoggedOutcome(getLogSpy(), "error");
      }
    });
  });

  describe("updateMemberStatus", () => {
    it("pushes a history entry on the member row", async () => {
      const col = mockCollection();
      await repo.updateMemberStatus("c1", "u1", "active" as never, "actor1");
      expect(col.updateOne).toHaveBeenCalledWith(
        { campaignId: "c1", userId: "u1" },
        expect.objectContaining({ $push: expect.anything() }),
      );
    });
  });

  describe("listMembersForCampaign", () => {
    it("maps members without _id, and logs not_found for a member-less campaign", async () => {
      mockCollection({ findResult: [{ _id: OID, campaignId: "c1", userId: "u1" }] });
      expect((await repo.listMembersForCampaign("c1"))[0]).not.toHaveProperty("_id");

      mockCollection({ findResult: [] });
      await expect(repo.listMembersForCampaign("c1")).resolves.toEqual([]);
      expectLoggedOutcome(getLogSpy(), "not_found");
    });
  });

  describe("getMember", () => {
    it("returns the member without _id on a hit, null on a miss", async () => {
      mockCollection({ findOne: { _id: OID, campaignId: "c1", userId: "u1", status: "active" } });
      await expect(repo.getMember("c1", "u1")).resolves.not.toHaveProperty("_id");

      mockCollection({ findOne: null });
      await expect(repo.getMember("c1", "u1")).resolves.toBeNull();
    });

    it("wraps a driver error in StorageError without leaking the raw message", async () => {
      mockCollection({ findOne: new Error("connection reset") });
      const err = await expectStorageError(repo.getMember("c1", "u1"), {
        op: "getMember",
        collection: "campaignMembers",
      });
      expect(err.message).not.toContain("connection reset");
    });
  });

  describe("getUserById", () => {
    it("returns the public user on a hit, null on a miss", async () => {
      mockCollection({ findOne: { _id: OID, username: "alice" } });
      await expect(repo.getUserById(OID)).resolves.toEqual({ id: OID, username: "alice" });

      mockCollection({ findOne: null });
      await expect(repo.getUserById(OID)).resolves.toBeNull();
    });

    it("throws InvalidUserIdError for a malformed id before touching the DB", async () => {
      const col = mockCollection();
      await expect(repo.getUserById("not-an-oid")).rejects.toThrow();
      expect(col.findOne).not.toHaveBeenCalled();
    });
  });

  describe("getUsersByIds", () => {
    it("short-circuits to {} for empty input and returns the found subset otherwise", async () => {
      const col = mockCollection();
      await expect(repo.getUsersByIds([])).resolves.toEqual({});
      expect(col.find).not.toHaveBeenCalled();

      mockCollection({ findResult: [{ _id: { toString: () => OID }, username: "alice" }] });
      await expect(repo.getUsersByIds([OID])).resolves.toEqual({ [OID]: "alice" });
    });
  });

  // Every read/write below now rejects with StorageError on a driver failure
  // (was: swallow to [] / null, or raw rethrow).
  describe.each<[string, () => Promise<unknown>]>([
    ["updateMemberStatus", () => repo.updateMemberStatus("c1", "u1", "active" as never, "a1")],
    ["listMembersForCampaign", () => repo.listMembersForCampaign("c1")],
    ["getMember", () => repo.getMember("c1", "u1")],
    ["listInvitationsForUser", () => repo.listInvitationsForUser("u1")],
    ["getUserById", () => repo.getUserById(OID)],
    ["getUsersByIds", () => repo.getUsersByIds([OID])],
  ])("%s on driver failure", (_name, call) => {
    it("rejects with StorageError", async () => {
      mockCollection({ findResult: DB_DOWN(), findOne: DB_DOWN(), updateOne: DB_DOWN() });
      await expectStorageError(call());
    });
  });

  it("exposes all 7 membership methods on the storage facade", () => {
    expectFacadeMethods(storage as Record<string, unknown>, [
      "addMember",
      "updateMemberStatus",
      "listMembersForCampaign",
      "getMember",
      "listInvitationsForUser",
      "getUserById",
      "getUsersByIds",
    ]);
  });
});
