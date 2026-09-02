/**
 * @jest-environment node
 */
import { DELETE } from "@/app/api/campaigns/[id]/encounters/[encounterId]/route";
import { storage } from "@/lib/storage";
import { Campaign, CampaignMember } from "@/lib/types";
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
    removeEncounterFromCampaign: jest.fn(),
  },
}));

jest.mock("@/lib/storage/campaignRepo", () => ({
  loadCampaignByIdAny: jest.fn(),
}));

import * as campaignRepo from "@/lib/storage/campaignRepo";

const mockedStorage = jest.mocked(storage) as {
  getMember: jest.MockedFunction<typeof storage.getMember>;
  removeEncounterFromCampaign: jest.MockedFunction<typeof storage.removeEncounterFromCampaign>;
};

const mockedCampaignRepo = jest.mocked(campaignRepo);

const CAMPAIGN_ID = "camp-1";
const DM_ID = "dm-user";
const ENCOUNTER_ID = "e3";
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID, encounterId: ENCOUNTER_ID });

const ACTIVE_DM: CampaignMember = {
  id: "mem-dm",
  campaignId: CAMPAIGN_ID,
  userId: DM_ID,
  role: "dm",
  status: "active",
  history: [],
};

const ACTIVE_PLAYER: CampaignMember = {
  id: "mem-player",
  campaignId: CAMPAIGN_ID,
  userId: MOCK_AUTH.userId,
  role: "player",
  status: "active",
  history: [],
};

const CAMPAIGN: Campaign = {
  id: CAMPAIGN_ID,
  userId: DM_ID,
  name: "The Sunless Citadel",
  moduleName: "sunless-citadel",
  chapters: [],
  encounterIds: ["e1", "e3"],
  partyIds: [],
  status: "active",
  notes: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeDeleteRequest = () =>
  makeRouteRequest(`http://localhost/api/campaigns/${CAMPAIGN_ID}/encounters/${ENCOUNTER_ID}`, "DELETE");

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState.payload = MOCK_AUTH;
});

describe("DELETE /api/campaigns/[id]/encounters/[encounterId]", () => {
  describe("unauthenticated", () => {
    itReturns401WithParams(DELETE, makeDeleteRequest, PARAMS);
  });

  it("DM unlinks a linked encounter", async () => {
    mockAuthState.payload = { ...MOCK_AUTH, userId: DM_ID };
    mockedStorage.getMember.mockResolvedValue(ACTIVE_DM);
    mockedCampaignRepo.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);
    mockedStorage.removeEncounterFromCampaign.mockResolvedValue(undefined);

    const response = await DELETE(makeDeleteRequest(), { params: PARAMS });

    expect(response.status).toBe(200);
    expect(mockedStorage.removeEncounterFromCampaign).toHaveBeenCalledWith(CAMPAIGN_ID, ENCOUNTER_ID, DM_ID);
  });

  it("Unlinking an encounter that isn't linked is a no-op success", async () => {
    mockAuthState.payload = { ...MOCK_AUTH, userId: DM_ID };
    mockedStorage.getMember.mockResolvedValue(ACTIVE_DM);
    mockedCampaignRepo.loadCampaignByIdAny.mockResolvedValue({ ...CAMPAIGN, encounterIds: ["e1"] });
    mockedStorage.removeEncounterFromCampaign.mockResolvedValue(undefined);

    const response = await DELETE(makeDeleteRequest(), { params: PARAMS });

    expect(response.status).toBe(200);
  });

  it("Player member cannot unlink", async () => {
    mockedStorage.getMember.mockResolvedValue(ACTIVE_PLAYER);
    mockedCampaignRepo.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);

    const response = await DELETE(makeDeleteRequest(), { params: PARAMS });

    expect(response.status).toBe(404);
    expect(mockedStorage.removeEncounterFromCampaign).not.toHaveBeenCalled();
  });

  it("returns 500 when removeEncounterFromCampaign throws", async () => {
    mockAuthState.payload = { ...MOCK_AUTH, userId: DM_ID };
    mockedStorage.getMember.mockResolvedValue(ACTIVE_DM);
    mockedCampaignRepo.loadCampaignByIdAny.mockResolvedValue(CAMPAIGN);
    mockedStorage.removeEncounterFromCampaign.mockRejectedValue(new Error("Storage error"));

    const response = await DELETE(makeDeleteRequest(), { params: PARAMS });

    expect(response.status).toBe(500);
  });

  it("returns 400 when id param is an empty string", async () => {
    const response = await DELETE(makeDeleteRequest(), {
      params: Promise.resolve({ id: "", encounterId: ENCOUNTER_ID }),
    });

    expect(response.status).toBe(400);
    expect(mockedStorage.getMember).not.toHaveBeenCalled();
  });

  it("returns 400 when encounterId param is an empty string", async () => {
    const response = await DELETE(makeDeleteRequest(), {
      params: Promise.resolve({ id: CAMPAIGN_ID, encounterId: "" }),
    });

    expect(response.status).toBe(400);
    expect(mockedStorage.getMember).not.toHaveBeenCalled();
  });
});
