/**
 * @jest-environment node
 */
import fetch from "node-fetch";
import { connectToDatabase, closeDatabase, getDatabase } from "@/lib/db";
import { registerTestUser } from "../helpers/users";
import type { CampaignRoll } from "@/lib/types";

const ROLLS_PATH = (campaignId: string) =>
  `${process.env.TEST_BASE_URL}/api/campaigns/${campaignId}/rolls`;

const SESSIONS_ACTIVE_PATH = (campaignId: string) =>
  `${process.env.TEST_BASE_URL}/api/campaigns/${campaignId}/sessions/active`;

interface UserCtx {
  cookie: string;
  userId: string;
  username: string;
}

async function createCampaign(cookie: string): Promise<string> {
  const res = await fetch(`${process.env.TEST_BASE_URL}/api/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ name: "Rolls Test Campaign" }),
  });
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function addActiveMember(
  campaignId: string,
  dmCookie: string,
  userId: string
): Promise<void> {
  const inviteRes = await fetch(
    `${process.env.TEST_BASE_URL}/api/campaigns/${campaignId}/members`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: dmCookie },
      body: JSON.stringify({ userId }),
    }
  );
  expect(inviteRes.status).toBe(201);

  const db = await getDatabase();
  await db.collection("campaignMembers").updateOne(
    { campaignId, userId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { $set: { status: "active" } } as any
  );
}

async function openSession(dmCookie: string, campaignId: string): Promise<string> {
  const res = await fetch(SESSIONS_ACTIVE_PATH(campaignId), {
    method: "POST",
    headers: { Cookie: dmCookie },
  });
  expect(res.status).toBe(201);
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function closeSession(dmCookie: string, campaignId: string): Promise<void> {
  await fetch(SESSIONS_ACTIVE_PATH(campaignId), {
    method: "DELETE",
    headers: { Cookie: dmCookie },
  });
}

const VALID_ROLL = {
  formula: "1d20",
  rolls: [15],
  total: 15,
  visibility: { scope: "group" },
};

describe("Campaign Rolls API Integration Tests", () => {
  let dm: UserCtx;
  let playerA: UserCtx;
  let playerB: UserCtx;
  let campaignId: string;

  beforeAll(async () => {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
    if (!process.env.TEST_BASE_URL) throw new Error("TEST_BASE_URL not set");

    await connectToDatabase();

    dm = await registerTestUser(process.env.TEST_BASE_URL, "rolls-dm");
    playerA = await registerTestUser(process.env.TEST_BASE_URL, "rolls-playerA");
    playerB = await registerTestUser(process.env.TEST_BASE_URL, "rolls-playerB");

    campaignId = await createCampaign(dm.cookie);
    await addActiveMember(campaignId, dm.cookie, playerA.userId);
    await addActiveMember(campaignId, dm.cookie, playerB.userId);
  }, 60000);

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    const db = await getDatabase();
    await db.collection("campaignRolls").deleteMany({ campaignId });
    // Close any open session
    await closeSession(dm.cookie, campaignId);
  });

  it("T1 — POST persists roll against active session → 201", async () => {
    const sessionId = await openSession(dm.cookie, campaignId);
    const res = await fetch(ROLLS_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: dm.cookie },
      body: JSON.stringify(VALID_ROLL),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as CampaignRoll;
    expect(data.id).toBeDefined();
    expect(data.campaignId).toBe(campaignId);
    expect(data.sessionId).toBe(sessionId);
    expect(data.formula).toBe("1d20");

    // Verify retrievable via GET
    const getRes = await fetch(`${ROLLS_PATH(campaignId)}?sessionId=${sessionId}`, {
      headers: { Cookie: dm.cookie },
    });
    expect(getRes.status).toBe(200);
    const getBody = (await getRes.json()) as { rolls: CampaignRoll[] };
    expect(getBody.rolls.some((r) => r.id === data.id)).toBe(true);
  });

  it("T2 — POST with no active session → 409", async () => {
    const res = await fetch(ROLLS_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: dm.cookie },
      body: JSON.stringify(VALID_ROLL),
    });
    expect(res.status).toBe(409);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("No active session");
  });

  it("T3 — GET without sessionId → 400", async () => {
    const res = await fetch(ROLLS_PATH(campaignId), {
      headers: { Cookie: dm.cookie },
    });
    expect(res.status).toBe(400);
  });

  it("T4 — DM sees dm-only roll in GET", async () => {
    const sessionId = await openSession(dm.cookie, campaignId);

    // Player A posts a dm-only roll
    const postRes = await fetch(ROLLS_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: playerA.cookie },
      body: JSON.stringify({ ...VALID_ROLL, visibility: { scope: "dm-only" } }),
    });
    expect(postRes.status).toBe(201);
    const roll = (await postRes.json()) as CampaignRoll;

    // DM can see it
    const getRes = await fetch(`${ROLLS_PATH(campaignId)}?sessionId=${sessionId}`, {
      headers: { Cookie: dm.cookie },
    });
    expect(getRes.status).toBe(200);
    const body = (await getRes.json()) as { rolls: CampaignRoll[] };
    expect(body.rolls.some((r) => r.id === roll.id)).toBe(true);
  });

  it("T5 — Player B does not see player A's dm-only roll in GET", async () => {
    const sessionId = await openSession(dm.cookie, campaignId);

    // Player A posts a dm-only roll
    const postRes = await fetch(ROLLS_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: playerA.cookie },
      body: JSON.stringify({ ...VALID_ROLL, visibility: { scope: "dm-only" } }),
    });
    expect(postRes.status).toBe(201);
    const roll = (await postRes.json()) as CampaignRoll;

    // Player B cannot see it
    const getRes = await fetch(`${ROLLS_PATH(campaignId)}?sessionId=${sessionId}`, {
      headers: { Cookie: playerB.cookie },
    });
    expect(getRes.status).toBe(200);
    const body = (await getRes.json()) as { rolls: CampaignRoll[] };
    expect(body.rolls.some((r) => r.id === roll.id)).toBe(false);
  });

  it("T6 — Player sees their own dm-only roll in GET", async () => {
    const sessionId = await openSession(dm.cookie, campaignId);

    const postRes = await fetch(ROLLS_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: playerA.cookie },
      body: JSON.stringify({ ...VALID_ROLL, visibility: { scope: "dm-only" } }),
    });
    expect(postRes.status).toBe(201);
    const roll = (await postRes.json()) as CampaignRoll;

    const getRes = await fetch(`${ROLLS_PATH(campaignId)}?sessionId=${sessionId}`, {
      headers: { Cookie: playerA.cookie },
    });
    expect(getRes.status).toBe(200);
    const body = (await getRes.json()) as { rolls: CampaignRoll[] };
    expect(body.rolls.some((r) => r.id === roll.id)).toBe(true);
  });

  it("T7 — Rolls scoped to session — rolls from session A do not appear in session B query", async () => {
    // Session 1: post a roll
    const session1Id = await openSession(dm.cookie, campaignId);
    const postRes1 = await fetch(ROLLS_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: dm.cookie },
      body: JSON.stringify({ ...VALID_ROLL, formula: "session-1-roll" }),
    });
    expect(postRes1.status).toBe(201);
    const roll1 = (await postRes1.json()) as CampaignRoll;

    await closeSession(dm.cookie, campaignId);

    // Session 2: post a roll
    const session2Id = await openSession(dm.cookie, campaignId);
    expect(session2Id).not.toBe(session1Id);
    const postRes2 = await fetch(ROLLS_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: dm.cookie },
      body: JSON.stringify({ ...VALID_ROLL, formula: "session-2-roll" }),
    });
    expect(postRes2.status).toBe(201);
    const roll2 = (await postRes2.json()) as CampaignRoll;

    // GET session 1 — should only have roll1
    const getRes = await fetch(`${ROLLS_PATH(campaignId)}?sessionId=${session1Id}`, {
      headers: { Cookie: dm.cookie },
    });
    expect(getRes.status).toBe(200);
    const body = (await getRes.json()) as { rolls: CampaignRoll[] };
    expect(body.rolls.some((r) => r.id === roll1.id)).toBe(true);
    expect(body.rolls.some((r) => r.id === roll2.id)).toBe(false);
  });

  it("T8 — Unauthenticated POST → 401", async () => {
    const res = await fetch(ROLLS_PATH(campaignId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_ROLL),
    });
    expect(res.status).toBe(401);
  });

  it("T9 — Unauthenticated GET → 401", async () => {
    const res = await fetch(`${ROLLS_PATH(campaignId)}?sessionId=some-id`);
    expect(res.status).toBe(401);
  });
});
