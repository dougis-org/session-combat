import fetch from "node-fetch";
import { registerTestUser } from "./helpers/users";

/**
 * Covers the `campaign-encounter-edit-parity` change (issue #606):
 * - NFAC Security: a non-owner PUT to /api/encounters/[id] is rejected (404) and
 *   does not mutate the encounter.
 * - Functional: a DM editing a linked encounter via PUT /api/encounters/[id] is
 *   reflected when the linked-encounters list is refetched.
 */
describe("Campaign encounter edit parity (integration)", () => {
  let baseUrl: string;
  let dmCookie: string;
  let otherCookie: string;

  beforeAll(async () => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");
    dmCookie = (await registerTestUser(baseUrl, "enc-edit-dm")).cookie;
    otherCookie = (await registerTestUser(baseUrl, "enc-edit-other")).cookie;
  }, 30000);

  function authed(cookie: string) {
    return { "Content-Type": "application/json", Cookie: cookie };
  }

  async function createCampaign(name: string): Promise<{ id: string }> {
    const res = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: authed(dmCookie),
      body: JSON.stringify({ name }),
    });
    expect(res.status).toBe(201);
    return (await res.json()) as { id: string };
  }

  async function createLinkedEncounter(campaignId: string, name: string): Promise<{ id: string }> {
    const res = await fetch(`${baseUrl}/api/encounters`, {
      method: "POST",
      headers: authed(dmCookie),
      body: JSON.stringify({ name, description: "", monsters: [], campaignId }),
    });
    expect(res.status).toBe(201);
    return (await res.json()) as { id: string };
  }

  it("rejects a non-owner PUT with 404 and leaves the encounter unchanged", async () => {
    const campaign = await createCampaign("Non-owner edit rejection");
    const encounter = await createLinkedEncounter(campaign.id, "Goblin Ambush");

    const res = await fetch(`${baseUrl}/api/encounters/${encounter.id}`, {
      method: "PUT",
      headers: authed(otherCookie),
      body: JSON.stringify({ name: "Hacked", description: "nope", monsters: [] }),
    });
    expect(res.status).toBe(404);

    const check = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/encounters`, {
      headers: authed(dmCookie),
    });
    const linked = (await check.json()) as Array<{ id: string; name: string }>;
    expect(linked.find((e) => e.id === encounter.id)?.name).toBe("Goblin Ambush");
  });

  it("reflects a DM's edit of a linked encounter when the linked list is refetched", async () => {
    const campaign = await createCampaign("DM edits linked encounter");
    const encounter = await createLinkedEncounter(campaign.id, "Goblin Ambush");

    const put = await fetch(`${baseUrl}/api/encounters/${encounter.id}`, {
      method: "PUT",
      headers: authed(dmCookie),
      body: JSON.stringify({
        name: "Goblin Ambush (Hard)",
        description: "Reinforced",
        monsters: [],
      }),
    });
    expect(put.status).toBe(200);

    const refetch = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/encounters`, {
      headers: authed(dmCookie),
    });
    expect(refetch.status).toBe(200);
    const linked = (await refetch.json()) as Array<{ id: string; name: string; description: string }>;
    const edited = linked.find((e) => e.id === encounter.id);
    expect(edited?.name).toBe("Goblin Ambush (Hard)");
    expect(edited?.description).toBe("Reinforced");
  });
});
