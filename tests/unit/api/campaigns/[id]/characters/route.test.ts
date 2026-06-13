/**
 * @jest-environment node
 */
import { POST, GET } from "@/app/api/campaigns/[id]/characters/route";
import { storage } from "@/lib/storage";
import { DuplicateShareError } from "@/lib/errors";
import { CampaignMember, CampaignCharacterShare, Character } from "@/lib/types";
import {
  MOCK_AUTH,
  makeRouteRequest,
  mockAuthState,
  itReturns401WithParams,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () =>
  require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware()
);

jest.mock("@/lib/storage", () => ({
  storage: {
    getMember: jest.fn(),
    addShare: jest.fn(),
    listSharesForCampaign: jest.fn(),
    loadCharacterById: jest.fn(),
    buildSharedCharacterEntries: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(storage) as {
  getMember: jest.MockedFunction<typeof storage.getMember>;
  addShare: jest.MockedFunction<typeof storage.addShare>;
  listSharesForCampaign: jest.MockedFunction<typeof storage.listSharesForCampaign>;
  loadCharacterById: jest.MockedFunction<typeof storage.loadCharacterById>;
  buildSharedCharacterEntries: jest.MockedFunction<typeof storage.buildSharedCharacterEntries>;
};

const CAMPAIGN_ID = "camp-1";
const CHARACTER_ID = "char-1";
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID });

const ACTIVE_PLAYER: CampaignMember = {
  id: "mem-1",
  campaignId: CAMPAIGN_ID,
  userId: MOCK_AUTH.userId,
  role: "player",
  status: "active",
  history: [],
};

const OWN_CHARACTER = {
  id: CHARACTER_ID,
  userId: MOCK_AUTH.userId,
  name: "Hero",
} as unknown as Character;

const makePostRequest = (body: unknown) =>
  makeRouteRequest(
    `http://localhost/api/campaigns/${CAMPAIGN_ID}/characters`,
    "POST",
    body
  );

const makeGetRequest = () =>
  makeRouteRequest(
    `http://localhost/api/campaigns/${CAMPAIGN_ID}/characters`,
    "GET"
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState.payload = MOCK_AUTH;
});

describe("POST /api/campaigns/[id]/characters", () => {
  describe("unauthenticated", () => {
    itReturns401WithParams(POST, () => makePostRequest({ characterId: CHARACTER_ID }), PARAMS);
  });

  it("T4-1: returns 400 when characterId is missing", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    const response = await POST(makePostRequest({}), { params: PARAMS });
    expect(response.status).toBe(400);
  });

  it("T4-2: returns 400 when characterId is empty string", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    const response = await POST(makePostRequest({ characterId: "" }), { params: PARAMS });
    expect(response.status).toBe(400);
  });

  it("T4-3: returns 403 when caller is not a member", async () => {
    mockedStorage.getMember.mockResolvedValue(null);
    const response = await POST(makePostRequest({ characterId: CHARACTER_ID }), { params: PARAMS });
    expect(response.status).toBe(403);
  });

  it("T4-4: returns 403 when caller is invited", async () => {
    mockedStorage.getMember.mockResolvedValue({
      ...ACTIVE_PLAYER,
      status: "invited",
    });
    const response = await POST(makePostRequest({ characterId: CHARACTER_ID }), { params: PARAMS });
    expect(response.status).toBe(403);
  });

  it("T4-5: returns 403 when caller is active dm", async () => {
    mockedStorage.getMember.mockResolvedValue({
      ...ACTIVE_PLAYER,
      role: "dm",
    });
    const response = await POST(makePostRequest({ characterId: CHARACTER_ID }), { params: PARAMS });
    expect(response.status).toBe(403);
  });

  it("T4-6: returns 404 when character not found", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    mockedStorage.loadCharacterById.mockResolvedValue(null);
    const response = await POST(makePostRequest({ characterId: CHARACTER_ID }), { params: PARAMS });
    expect(response.status).toBe(404);
  });

  it("T4-7: returns 403 when character is owned by someone else", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    mockedStorage.loadCharacterById.mockResolvedValue({
      ...OWN_CHARACTER,
      userId: "other-user",
    });
    const response = await POST(makePostRequest({ characterId: CHARACTER_ID }), { params: PARAMS });
    expect(response.status).toBe(403);
  });

  it("T4-8: returns 409 on duplicate share", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    mockedStorage.loadCharacterById.mockResolvedValue(OWN_CHARACTER);
    mockedStorage.addShare.mockRejectedValue(
      new DuplicateShareError(CAMPAIGN_ID, CHARACTER_ID)
    );
    const response = await POST(makePostRequest({ characterId: CHARACTER_ID }), { params: PARAMS });
    expect(response.status).toBe(409);
  });

  it("T4-9: returns 201 with { id, characterId } on success", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    mockedStorage.loadCharacterById.mockResolvedValue(OWN_CHARACTER);
    mockedStorage.addShare.mockResolvedValue(undefined);
    const response = await POST(makePostRequest({ characterId: CHARACTER_ID }), { params: PARAMS });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(typeof body.id).toBe("string");
    expect(body.characterId).toBe(CHARACTER_ID);
  });
});

describe("GET /api/campaigns/[id]/characters", () => {
  describe("unauthenticated", () => {
    itReturns401WithParams(GET, makeGetRequest, PARAMS);
  });

  it("T4-10: returns 403 when caller is not a member", async () => {
    mockedStorage.getMember.mockResolvedValue(null);
    const response = await GET(makeGetRequest(), { params: PARAMS });
    expect(response.status).toBe(403);
  });

  it("T4-11: returns 403 when caller is not active", async () => {
    mockedStorage.getMember.mockResolvedValue({
      ...ACTIVE_PLAYER,
      status: "removed",
    });
    const response = await GET(makeGetRequest(), { params: PARAMS });
    expect(response.status).toBe(403);
  });

  it("T4-12: returns 200 with shares array", async () => {
    const shares: CampaignCharacterShare[] = [
      { id: "s1", campaignId: CAMPAIGN_ID, characterId: "ch1", userId: MOCK_AUTH.userId, sharedAt: new Date() },
      { id: "s2", campaignId: CAMPAIGN_ID, characterId: "ch2", userId: MOCK_AUTH.userId, sharedAt: new Date() },
    ];
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    mockedStorage.listSharesForCampaign.mockResolvedValue(shares);
    const response = await GET(makeGetRequest(), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(2);
  });

  it("T4-13: returns 200 with empty array when no shares", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    mockedStorage.listSharesForCampaign.mockResolvedValue([]);
    const response = await GET(makeGetRequest(), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  const makeCharacter = (id: string, name: string): Character => ({
    id,
    name,
    characterType: "character",
    userId: "player-1",
    hp: { max: 10, current: 10, temp: 0 },
    stats: {
      armorClass: 10,
      speed: 30,
      initiativeBonus: 0,
      passivePerception: 10,
      passiveInvestigation: 10,
      passiveInsight: 10
    },
    abilities: {
      str: { score: 10, modifier: 0, save: 0 },
      dex: { score: 10, modifier: 0, save: 0 },
      con: { score: 10, modifier: 0, save: 0 },
      int: { score: 10, modifier: 0, save: 0 },
      wis: { score: 10, modifier: 0, save: 0 },
      cha: { score: 10, modifier: 0, save: 0 }
    },
    defenses: {
      immunities: [],
      resistances: [],
      vulnerabilities: [],
      conditionImmunities: []
    },
    senses: [],
    spellcasting: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined
  });

  it("B1-1: DM gets enriched SharedCharacterEntry[] response", async () => {
    const dmMember = { ...ACTIVE_PLAYER, role: "dm" as const };
    const entry = {
      share: { id: "s1", campaignId: CAMPAIGN_ID, characterId: "char-2", userId: "player-1", sharedAt: new Date() },
      character: makeCharacter("char-2", "Arya"),
    };
    mockedStorage.getMember.mockResolvedValue(dmMember);
    mockedStorage.buildSharedCharacterEntries.mockResolvedValue([entry]);
    const response = await GET(makeGetRequest(), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toHaveProperty("share");
    expect(body[0]).toHaveProperty("character");
    expect(body[0].character.name).toBe("Arya");
  });

  it("B1-2: DM gets empty array when no shares exist", async () => {
    const dmMember = { ...ACTIVE_PLAYER, role: "dm" as const };
    mockedStorage.getMember.mockResolvedValue(dmMember);
    mockedStorage.buildSharedCharacterEntries.mockResolvedValue([]);
    const response = await GET(makeGetRequest(), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  it("B1-3: player still gets own shares in bare format", async () => {
    const shares = [
      { id: "s1", campaignId: CAMPAIGN_ID, characterId: "ch1", userId: MOCK_AUTH.userId, sharedAt: new Date() },
    ];
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    mockedStorage.listSharesForCampaign.mockResolvedValue(shares);
    const response = await GET(makeGetRequest(), { params: PARAMS });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0]).not.toHaveProperty("character");
  });
});
