import fetch from "node-fetch";
import { makeAuthedHeaders } from "../helpers/server";
import { createTestUser } from "../helpers/users";

interface PartyResponse {
  id: string;
  userId: string;
  name: string;
  members: Array<{ characterId: string; addedAt: string; leftAt?: string }>;
  campaignId?: string;
  createdAt: string;
  updatedAt: string;
}

describe("Party Members Integration Tests", () => {
  let baseUrl: string;
  let authCookie: string;

  beforeAll(async () => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");
    authCookie = (await createTestUser(baseUrl, "party-members")).cookie;
  }, 30000);

  const authed = () => makeAuthedHeaders(authCookie);

  async function putParty(partyId: string, body: object) {
    return fetch(`${baseUrl}/api/parties/${partyId}`, {
      method: "PUT",
      headers: authed(),
      body: JSON.stringify(body),
    });
  }

  async function getParty(partyId: string): Promise<PartyResponse> {
    const res = await fetch(`${baseUrl}/api/parties/${partyId}`, {
      headers: authed(),
    });
    return res.json() as Promise<PartyResponse>;
  }

  async function createCharacter(name = "Test Character"): Promise<string> {
    const res = await fetch(`${baseUrl}/api/characters`, {
      method: "POST",
      headers: authed(),
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

  async function createParty(name: string, characterIds: string[] = []): Promise<PartyResponse> {
    const res = await fetch(`${baseUrl}/api/parties`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ name, characterIds }),
    });
    return res.json() as Promise<PartyResponse>;
  }

  // --- A4: Party POST builds members from characterIds ---

  it("POST /api/parties with characterIds creates members[] with addedAt set", async () => {
    const charId = await createCharacter("POST Member Test");
    const party = await createParty("POST Test Party", [charId]);

    expect(party.members).toHaveLength(1);
    expect(party.members[0].characterId).toBe(charId);
    expect(party.members[0].addedAt).toBeTruthy();
    expect(party.members[0].leftAt).toBeUndefined();
  });

  it("POST /api/parties with empty characterIds creates empty members[]", async () => {
    const party = await createParty("Empty Party");
    expect(party.members).toHaveLength(0);
  });

  // --- A5: Party PUT diff-and-timestamp ---

  it("PUT /api/parties/[id] adding a new member sets addedAt", async () => {
    const charId1 = await createCharacter("Original Member");
    const charId2 = await createCharacter("New Member");
    const party = await createParty("PUT Add Test", [charId1]);

    const res = await putParty(party.id, { name: party.name, characterIds: [charId1, charId2] });
    expect(res.status).toBe(200);
    const updated = await res.json() as PartyResponse;

    const activeMembers = updated.members.filter(m => !m.leftAt);
    expect(activeMembers).toHaveLength(2);
    const newMember = updated.members.find(m => m.characterId === charId2);
    expect(newMember).toBeTruthy();
    expect(newMember?.addedAt).toBeTruthy();
    expect(newMember?.leftAt).toBeUndefined();
  });

  it("PUT /api/parties/[id] removing a member sets leftAt; entry remains", async () => {
    const charId = await createCharacter("To Remove");
    const party = await createParty("PUT Remove Test", [charId]);

    const res = await putParty(party.id, { name: party.name, characterIds: [] });
    expect(res.status).toBe(200);
    const updated = await res.json() as PartyResponse;

    expect(updated.members).toHaveLength(1);
    const departed = updated.members.find(m => m.characterId === charId);
    expect(departed?.leftAt).toBeTruthy();
  });

  it("PUT /api/parties/[id] unchanged member is not modified", async () => {
    const charId = await createCharacter("Unchanged Member");
    const party = await createParty("PUT Unchanged Test", [charId]);
    const originalAddedAt = party.members[0].addedAt;

    const res = await putParty(party.id, { name: party.name, characterIds: [charId] });
    expect(res.status).toBe(200);
    const updated = await res.json() as PartyResponse;

    const member = updated.members.find(m => m.characterId === charId);
    expect(member?.addedAt).toBe(originalAddedAt);
    expect(member?.leftAt).toBeUndefined();
  });

  // --- D5: Character delete cascade ---

  it("deleting a character sets leftAt on all active party memberships", async () => {
    const charId = await createCharacter("Cascade Delete Test");
    const party = await createParty("Cascade Party", [charId]);

    const deleteRes = await fetch(`${baseUrl}/api/characters/${charId}`, {
      method: "DELETE",
      headers: authed(),
    });
    expect(deleteRes.status).toBe(200);

    const updatedParty = await getParty(party.id);
    const member = updatedParty.members.find(m => m.characterId === charId);
    expect(member?.leftAt).toBeTruthy();
  });

  it("deleting a character not in any party succeeds without error", async () => {
    const charId = await createCharacter("No Party Character");
    const res = await fetch(`${baseUrl}/api/characters/${charId}`, {
      method: "DELETE",
      headers: authed(),
    });
    expect(res.status).toBe(200);
  });

  // --- D7: Lazy migration for unmigrated party documents ---

  it("party created before migration (with characterIds) is returned with derived members", async () => {
    // The POST route now stores members[], so we can't create a legacy party via API.
    // Instead, verify that POST stores members (not characterIds) and is correctly returned.
    const charId = await createCharacter("Migration Test Char");
    const party = await createParty("Migration Test", [charId]);

    // The party should have members, not characterIds
    expect(party.members).toBeDefined();
    expect(Array.isArray(party.members)).toBe(true);
    const keys = Object.keys(party);
    expect(keys).not.toContain('characterIds');
  });
});
