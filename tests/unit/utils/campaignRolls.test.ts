import { canSeeRoll } from "@/lib/utils/campaignRolls";
import type { CampaignRoll, CampaignMember } from "@/lib/types";

function makeRoll(overrides: Partial<CampaignRoll> = {}): CampaignRoll {
  return {
    id: "roll-1",
    campaignId: "camp-1",
    sessionId: "sess-1",
    rollerId: "player-a",
    rollerName: "Player A",
    formula: "1d20",
    rolls: [15],
    total: 15,
    visibility: { scope: "group" },
    createdAt: new Date(),
    ...overrides,
  };
}

function makeMember(
  userId: string,
  role: "dm" | "player" = "player"
): Pick<CampaignMember, "userId" | "role" | "status"> {
  return { userId, role, status: "active" };
}

const DM_ID = "dm-user";
const PLAYER_A_ID = "player-a";
const PLAYER_B_ID = "player-b";

const members = [
  makeMember(DM_ID, "dm"),
  makeMember(PLAYER_A_ID, "player"),
  makeMember(PLAYER_B_ID, "player"),
];

describe("canSeeRoll()", () => {
  describe("dm-only rolls", () => {
    const dmOnlyRoll = makeRoll({
      rollerId: PLAYER_A_ID,
      visibility: { scope: "dm-only" },
    });

    it("DM can see dm-only roll", () => {
      expect(canSeeRoll(dmOnlyRoll, DM_ID, members)).toBe(true);
    });

    it("player cannot see another player's dm-only roll", () => {
      expect(canSeeRoll(dmOnlyRoll, PLAYER_B_ID, members)).toBe(false);
    });

    it("roller always sees their own dm-only roll", () => {
      expect(canSeeRoll(dmOnlyRoll, PLAYER_A_ID, members)).toBe(true);
    });
  });

  describe("group rolls", () => {
    const groupRoll = makeRoll({ rollerId: PLAYER_A_ID, visibility: { scope: "group" } });

    it("any active member can see a group roll", () => {
      expect(canSeeRoll(groupRoll, PLAYER_B_ID, members)).toBe(true);
    });

    it("DM can see their own group roll", () => {
      expect(canSeeRoll(groupRoll, DM_ID, members)).toBe(true);
    });
  });

  it("returns false when userId is not in members", () => {
    const roll = makeRoll({ visibility: { scope: "group" } });
    expect(canSeeRoll(roll, "outsider", members)).toBe(false);
  });

  it("returns false when member is not active", () => {
    const inactiveMembers = [{ userId: PLAYER_B_ID, role: "player" as const, status: "invited" as const }];
    const roll = makeRoll({ visibility: { scope: "group" } });
    expect(canSeeRoll(roll, PLAYER_B_ID, inactiveMembers)).toBe(false);
  });
});
