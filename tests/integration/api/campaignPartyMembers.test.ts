import fetch from "node-fetch";
import { makeAuthedHeaders } from "../helpers/server";
import { registerTestUser } from "../helpers/users";
import { Party } from "@/lib/types";

describe("Campaign Party Members Integration Tests", () => {
  let baseUrl: string;
  let gmCookie: string;
  let playerCookie: string;
  let outCookie: string;
  let playerUserId: string;
  let campaignId: string;
  let partyId: string;
  let memberId: string;

  beforeAll(async () => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set");

    const gmAuth = await registerTestUser(baseUrl, "party-members-gm");
    gmCookie = gmAuth.cookie;

    const playerAuth = await registerTestUser(baseUrl, "party-members-player");
    playerCookie = playerAuth.cookie;
    playerUserId = playerAuth.userId;

    const outAuth = await registerTestUser(baseUrl, "party-members-out");
    outCookie = outAuth.cookie;

    // Create a campaign
    const campRes = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: gmCookie },
      body: JSON.stringify({ name: "Party Test Campaign", status: "active" }),
    });
    if (!campRes.ok) throw new Error(`Campaign creation failed: ${await campRes.text()}`);
    const camp = await campRes.json() as { id: string };
    campaignId = camp.id;

    // Add player to campaign
    const inviteRes = await fetch(`${baseUrl}/api/campaigns/${campaignId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: gmCookie },
      body: JSON.stringify({ userId: playerUserId }),
    });
    if (!inviteRes.ok) throw new Error(`Invite failed: ${await inviteRes.text()}`);

    // Player accepts invite
    const acceptRes = await fetch(`${baseUrl}/api/campaigns/${campaignId}/members/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: playerCookie },
      body: JSON.stringify({ action: "accept" }),
    });
    if (!acceptRes.ok) throw new Error(`Accept invite failed: ${await acceptRes.text()}`);
    
    memberId = playerUserId;

    // Create a party in the campaign
    const partyRes = await fetch(`${baseUrl}/api/parties`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: gmCookie },
      body: JSON.stringify({ name: "The Vanguard", campaignId }),
    });
    const party = await partyRes.json() as { id: string };
    partyId = party.id;
  }, 30000);

  const authed = (cookie = gmCookie) => makeAuthedHeaders(cookie);

  async function createCharacter(cookie: string, name = "Test Character"): Promise<string> {
    const res = await fetch(`${baseUrl}/api/characters`, {
      method: "POST",
      headers: authed(cookie),
      body: JSON.stringify({
        name,
        classes: [{ class: "Fighter", level: 1 }],
        abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        ac: 10, hp: 10, maxHp: 10,
      }),
    });
    const data = await res.json() as { id: string };
    return data.id;
  }

  async function putPartyMembers(
    cookie: string,
    cId: string,
    mId: string,
    pId: string,
    characterIds: string[]
  ) {
    return fetch(`${baseUrl}/api/campaigns/${cId}/members/${mId}/parties/${pId}`, {
      method: "PUT",
      headers: authed(cookie),
      body: JSON.stringify({ characterIds }),
    });
  }

  async function getParty(pId: string = partyId): Promise<Party> {
    const res = await fetch(`${baseUrl}/api/parties/${pId}`, {
      headers: authed(gmCookie),
    });
    return res.json() as Promise<Party>;
  }

  it("Test case 1: Player successfully adds their own character to a party", async () => {
    const charId = await createCharacter(playerCookie, "Player Char 1");
    const res = await putPartyMembers(playerCookie, campaignId, memberId, partyId, [charId]);
    expect(res.status).toBe(200);

    const party = await getParty();
    const member = party.members.find(m => m.characterId === charId);
    expect(member).toBeDefined();
    expect(member?.addedAt).toBeDefined();
    expect(member?.leftAt).toBeUndefined();
  });

  it("Test case 2: Player successfully removes their own character from a party", async () => {
    const charId = await createCharacter(playerCookie, "Player Char 2");
    await putPartyMembers(playerCookie, campaignId, memberId, partyId, [charId]);

    let party = await getParty();
    const memberAdded = party.members.find(m => m.characterId === charId);
    expect(memberAdded?.addedAt).toBeDefined();

    const res = await putPartyMembers(playerCookie, campaignId, memberId, partyId, []);
    expect(res.status).toBe(200);

    party = await getParty();
    const memberRemoved = party.members.find(m => m.characterId === charId);
    expect(memberRemoved).toBeDefined();
    expect(memberRemoved?.leftAt).toBeDefined();
  });

  it("Test case 3: Player provides a mix of characters (some to add, some to remove) without overwriting other members", async () => {
    const gmCharId = await createCharacter(gmCookie, "GM Char");
    await fetch(`${baseUrl}/api/parties/${partyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: gmCookie },
      body: JSON.stringify({ name: "The Vanguard", characterIds: [gmCharId] })
    });

    const charId3 = await createCharacter(playerCookie, "Player Char 3");
    const charId4 = await createCharacter(playerCookie, "Player Char 4");

    await putPartyMembers(playerCookie, campaignId, memberId, partyId, [charId3]);

    const res = await putPartyMembers(playerCookie, campaignId, memberId, partyId, [charId4]);
    expect(res.status).toBe(200);

    const party = await getParty();

    const gmMember = party.members.find(m => m.characterId === gmCharId);
    expect(gmMember).toBeDefined();
    expect(gmMember?.leftAt).toBeUndefined();

    const member3 = party.members.find(m => m.characterId === charId3);
    expect(member3?.leftAt).toBeDefined();

    const member4 = party.members.find(m => m.characterId === charId4);
    expect(member4?.addedAt).toBeDefined();
    expect(member4?.leftAt).toBeUndefined();
  });

  it("Test case 4: Player attempts to add a character they do not own", async () => {
    const gmCharId = await createCharacter(gmCookie, "GM Char 2");
    
    const res = await putPartyMembers(playerCookie, campaignId, memberId, partyId, [gmCharId]);
    expect(res.status).toBe(400); 
    
    const party = await getParty();
    const gmMember = party.members.find(m => m.characterId === gmCharId);
    expect(gmMember).toBeUndefined();
  });

  it("Test case 5: GM successfully adds a character owned by a specific member on behalf of that member", async () => {
    const charId = await createCharacter(playerCookie, "Player Char 5");
    
    const res = await putPartyMembers(gmCookie, campaignId, memberId, partyId, [charId]);
    expect(res.status).toBe(200);

    const party = await getParty();
    const member = party.members.find(m => m.characterId === charId);
    expect(member).toBeDefined();
    expect(member?.addedAt).toBeDefined();
    expect(member?.leftAt).toBeUndefined();
  });

  it("Test case 6: User who is not in the campaign attempts to call the endpoint", async () => {
    const charId = await createCharacter(outCookie, "Out Char");
    
    const res = await putPartyMembers(outCookie, campaignId, memberId, partyId, [charId]);
    expect(res.status).toBe(403);
  });

  it("Test case 7: Endpoint verifies that the party actually belongs to the specified campaign", async () => {
    const otherPartyRes = await fetch(`${baseUrl}/api/parties`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: gmCookie },
      body: JSON.stringify({ name: "Other Party" }),
    });
    const otherParty = await otherPartyRes.json() as { id: string };
    
    const charId = await createCharacter(playerCookie, "Player Char 6");
    const res = await putPartyMembers(playerCookie, campaignId, memberId, otherParty.id, [charId]);
    
    expect(res.status).toBe(404);
  });

  it("Test case 8: Player removes then re-adds character — preserves membership history", async () => {
    const charId = await createCharacter(playerCookie, "Player Char Rejoin");

    const r1 = await putPartyMembers(playerCookie, campaignId, memberId, partyId, [charId]);
    expect(r1.status).toBe(200);

    const r2 = await putPartyMembers(playerCookie, campaignId, memberId, partyId, []);
    expect(r2.status).toBe(200);

    const r3 = await putPartyMembers(playerCookie, campaignId, memberId, partyId, [charId]);
    expect(r3.status).toBe(200);

    const party = await getParty();
    const allRecords = party.members.filter(m => m.characterId === charId);
    expect(allRecords).toHaveLength(2);

    const activeRecord = allRecords.find(m => !m.leftAt);
    const historicalRecord = allRecords.find(m => m.leftAt);
    expect(activeRecord).toBeDefined();
    expect(historicalRecord).toBeDefined();
  });

});
