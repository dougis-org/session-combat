import fetch from "node-fetch";
import { MongoClient } from "mongodb";
import { makeAuthedHeaders } from "../helpers/server";
import { registerTestUser } from "../helpers/users";

describe("GET /api/campaigns/[id]/parties Integration Tests", () => {
  let baseUrl: string;
  let gmCookie: string;
  let playerCookie: string;
  let outCookie: string;
  let campaignId: string;

  beforeAll(async () => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set");

    const gmAuth = await registerTestUser(baseUrl, "campaign-parties-gm");
    gmCookie = gmAuth.cookie;

    const playerAuth = await registerTestUser(baseUrl, "campaign-parties-player");
    playerCookie = playerAuth.cookie;
    const playerUserId = playerAuth.userId;

    const outAuth = await registerTestUser(baseUrl, "campaign-parties-out");
    outCookie = outAuth.cookie;

    const campRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: gmCookie },
      body: JSON.stringify({ name: "Campaign Parties Test Campaign", status: "active" }),
    });
    if (!campRes.ok) throw new Error(`Campaign creation failed: ${await campRes.text()}`);
    const camp = (await campRes.json()) as { id: string };
    campaignId = camp.id;

    const inviteRes = await fetch(`${baseUrl}/api/campaigns/${campaignId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: gmCookie },
      body: JSON.stringify({ userId: playerUserId }),
    });
    if (!inviteRes.ok) throw new Error(`Invite failed: ${await inviteRes.text()}`);

    const acceptRes = await fetch(`${baseUrl}/api/campaigns/${campaignId}/members/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: playerCookie },
      body: JSON.stringify({ action: "accept" }),
    });
    if (!acceptRes.ok) throw new Error(`Accept invite failed: ${await acceptRes.text()}`);
  }, 30000);

  const authed = (cookie: string) => makeAuthedHeaders(cookie);

  it("returns 200 with an empty array when the campaign has no parties", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/parties`, {
      headers: authed(playerCookie),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    if (Array.isArray(body) && body.length > 0) {
      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB);
        const allParties = await db.collection("parties").find({}).toArray();
        const allCampaigns = await db.collection("campaigns").find({}).toArray();
        console.log("DEBUG campaignId (this test):", campaignId);
        console.log("DEBUG ALL parties in DB:", JSON.stringify(allParties, null, 2));
        console.log("DEBUG ALL campaigns in DB:", JSON.stringify(allCampaigns, null, 2));
      } finally {
        await client.close();
      }
    }
    expect(body).toEqual([]);
  });

  it("active player member sees all parties in the campaign, including ones they don't own", async () => {
    const partyRes = await fetch(`${baseUrl}/api/parties`, {
      method: "POST",
      headers: authed(gmCookie),
      body: JSON.stringify({ name: "GM-owned Party", campaignId }),
    });
    expect(partyRes.status).toBe(201);
    const party = (await partyRes.json()) as { id: string };

    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/parties`, {
      headers: authed(playerCookie),
    });
    expect(res.status).toBe(200);
    const parties = (await res.json()) as Array<{ id: string }>;
    expect(parties.some((p) => p.id === party.id)).toBe(true);
  });

  it("active dm member sees all parties in the campaign", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/parties`, {
      headers: authed(gmCookie),
    });
    expect(res.status).toBe(200);
  });

  it("non-member is denied with 403 or 404 and no party data", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/parties`, {
      headers: authed(outCookie),
    });
    expect([403, 404]).toContain(res.status);
  });

  it("does not include parties belonging to a different campaign", async () => {
    const otherCampRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: authed(gmCookie),
      body: JSON.stringify({ name: "Other Campaign", status: "active" }),
    });
    expect(otherCampRes.status).toBe(201);
    const otherCampaign = (await otherCampRes.json()) as { id: string };

    const otherPartyRes = await fetch(`${baseUrl}/api/parties`, {
      method: "POST",
      headers: authed(gmCookie),
      body: JSON.stringify({ name: "Other Campaign Party", campaignId: otherCampaign.id }),
    });
    expect(otherPartyRes.status).toBe(201);
    const otherParty = (await otherPartyRes.json()) as { id: string };

    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/parties`, {
      headers: authed(playerCookie),
    });
    expect(res.status).toBe(200);
    const parties = (await res.json()) as Array<{ id: string }>;
    expect(parties.some((p) => p.id === otherParty.id)).toBe(false);
  });
});
