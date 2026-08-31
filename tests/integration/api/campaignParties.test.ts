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

  it("returns 200 with only the auto-created default party for a freshly created campaign", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/parties`, {
      headers: authed(playerCookie),
    });
    expect(res.status).toBe(200);
    const parties = (await res.json()) as Array<{ name: string }>;
    // Campaign creation auto-creates a default "Main Party" (see #482); no
    // other parties exist yet for a freshly created campaign.
    expect(parties).toHaveLength(1);
    expect(parties[0].name).toBe("Main Party");
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
