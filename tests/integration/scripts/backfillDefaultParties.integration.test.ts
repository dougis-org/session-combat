import { Collection, Db } from "mongodb";
import { backfillDefaultParties } from "../../../lib/scripts/backfillDefaultParties";
import { getDatabase, closeDatabase } from "../../../lib/db";
import { storage } from "../../../lib/storage";
import { Campaign, Party } from "../../../lib/types";

const TEST_MARKER_FIELD = "__backfillTestRun";
const TEST_MARKER_VALUE = `test-${Date.now()}-${require("crypto").randomBytes(3).toString("hex")}`;

let db: Db;
let campaigns: Collection<Campaign>;
let parties: Collection<Party>;

beforeAll(async () => {
  db = await getDatabase();
  campaigns = db.collection<Campaign>("campaigns");
  parties = db.collection<Party>("parties");
});

afterAll(async () => {
  await closeDatabase();
});

afterEach(async () => {
  const marked = await campaigns
    .find({ [TEST_MARKER_FIELD]: TEST_MARKER_VALUE })
    .toArray();
  const campaignIds = marked.map((c) => c.id);
  await campaigns.deleteMany({ [TEST_MARKER_FIELD]: TEST_MARKER_VALUE });
  if (campaignIds.length > 0) {
    await parties.deleteMany({ campaignId: { $in: campaignIds } });
  }
});

function seedCampaign(overrides: Partial<Campaign> = {}): Promise<Campaign> {
  const campaign: Campaign & { [TEST_MARKER_FIELD]?: string } = {
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    name: "Test Campaign",
    moduleName: "",
    chapters: [],
    status: "active",
    notes: "",
    createdAt: new Date("2020-01-01"),
    updatedAt: new Date("2020-01-01"),
    [TEST_MARKER_FIELD]: TEST_MARKER_VALUE,
    ...overrides,
  };
  return campaigns
    .insertOne(campaign as Campaign & { _id?: unknown })
    .then(() => campaign);
}

function seedParty(campaignId: string, userId: string): Promise<void> {
  const party: Party = {
    id: crypto.randomUUID(),
    userId,
    name: "Existing Party",
    description: "",
    members: [],
    campaignId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return parties.insertOne(party as Party & { _id?: unknown }).then(() => undefined);
}

describe("backfillDefaultParties", () => {
  it("creates a default Main Party for a campaign with no party", async () => {
    const campaign = await seedCampaign();

    await backfillDefaultParties();

    const created = await parties.findOne({ campaignId: campaign.id });
    expect(created).toMatchObject({
      campaignId: campaign.id,
      userId: campaign.userId,
      name: "Main Party",
      description: "",
      members: [],
    });
  });

  it("does not touch a campaign that already has a party", async () => {
    const campaign = await seedCampaign();
    await seedParty(campaign.id, campaign.userId);

    await backfillDefaultParties();

    const matchingParties = await parties.find({ campaignId: campaign.id }).toArray();
    expect(matchingParties).toHaveLength(1);
    expect(matchingParties[0].name).toBe("Existing Party");
  });

  it("does not modify the Campaign document", async () => {
    const campaign = await seedCampaign();

    await backfillDefaultParties();

    const doc = await campaigns.findOne({ id: campaign.id });
    expect(doc?.updatedAt).toEqual(campaign.updatedAt);
    expect(doc?.name).toBe(campaign.name);
  });

  it("is idempotent — second run creates no additional party", async () => {
    const campaign = await seedCampaign();

    await backfillDefaultParties();
    const afterFirst = await parties.find({ campaignId: campaign.id }).toArray();
    expect(afterFirst).toHaveLength(1);

    const { backfilled } = await backfillDefaultParties();

    const afterSecond = await parties.find({ campaignId: campaign.id }).toArray();
    expect(afterSecond).toHaveLength(1);
    expect(backfilled).toBe(0);
  });

  it("continues past a failed insert and reports it in the summary", async () => {
    const first = await seedCampaign();
    const second = await seedCampaign();

    const realSaveParty = storage.saveParty.bind(storage);
    const saveSpy = jest
      .spyOn(storage, "saveParty")
      .mockImplementation((party: Party) => {
        if (party.campaignId === first.id) {
          throw new Error("simulated insert failure");
        }
        return realSaveParty(party);
      });

    const result = await backfillDefaultParties();

    expect(result.failed).toBeGreaterThanOrEqual(1);
    const secondParty = await parties.findOne({ campaignId: second.id });
    expect(secondParty).not.toBeNull();

    saveSpy.mockRestore();
    // Clean up whichever campaign didn't get a party inserted due to the simulated failure
    await parties.deleteMany({ campaignId: { $in: [first.id, second.id] } });
  });
});
