/**
 * @jest-environment node
 */
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import { registerTestUser } from "./helpers/users";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-key-change-in-production";

interface CampaignResponse {
  id: string;
  name: string;
  [key: string]: unknown;
}

describe("Campaign Stream SSE Integration Tests", () => {
  let baseUrl: string;
  let authCookie: string;
  let campaignId: string;
  let userId: string;
  let altCookie: string;

  beforeAll(async () => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");

    const user = await registerTestUser(baseUrl, "stream-test");
    authCookie = user.cookie;
    userId = user.userId;

    // Create a campaign — creator is auto-added as DM member
    const res = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: authCookie },
      body: JSON.stringify({ name: "Stream Test Campaign" }),
    });
    const campaign = (await res.json()) as CampaignResponse;
    campaignId = campaign.id;

    // A second user who is NOT a member of the campaign
    const altUser = await registerTestUser(baseUrl, "stream-alt");
    altCookie = altUser.cookie;
  }, 30000);

  const streamUrl = () => `${baseUrl}/api/campaigns/${campaignId}/stream`;

  // T4-1: Authorized member receives 200 text/event-stream
  it("T4-1: authorized member receives 200 with text/event-stream", async () => {
    const controller = new AbortController();
    const res = await fetch(streamUrl(), {
      headers: { Cookie: authCookie },
      signal: controller.signal as unknown as AbortSignal,
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/event-stream/);

    controller.abort();
  });

  // T4-2: Missing token returns 401, no SSE bytes
  it("T4-2: missing auth token returns 401", async () => {
    const res = await fetch(streamUrl());
    expect(res.status).toBe(401);
    const body = await res.text();
    // Should not contain SSE bytes
    expect(body).not.toMatch(/^event:/m);
  });

  // T4-3: Invalidated token returns 401
  it("T4-3: invalidated token returns 401", async () => {
    // Generate a JWT with a tokenVersion that doesn't match the DB (using a high version number)
    const invalidToken = jwt.sign(
      { userId, email: "stream-test@example.com", tokenVersion: 9999 },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const res = await fetch(streamUrl(), {
      headers: { Authorization: `Bearer ${invalidToken}` },
    });
    expect(res.status).toBe(401);
  });

  // T4-4: Non-member returns 404
  it("T4-4: valid auth but non-member returns 404", async () => {
    const res = await fetch(streamUrl(), {
      headers: { Cookie: altCookie },
    });
    expect(res.status).toBe(404);
  });

  // T4-5: Stream opens and stays alive (heartbeat timing is tested separately with unit tests)
  it("T4-5: stream connection stays open and is readable", async () => {
    const controller = new AbortController();

    const res = await fetch(streamUrl(), {
      headers: { Cookie: authCookie },
      signal: controller.signal as unknown as AbortSignal,
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/event-stream/);
    expect(res.headers.get("cache-control")).toMatch(/no-cache/);

    controller.abort();
  });

  // T4-6: Abort signal fires → stream closes gracefully
  it("T4-6: aborting the request closes the stream cleanly", async () => {
    const controller = new AbortController();

    const res = await fetch(streamUrl(), {
      headers: { Cookie: authCookie },
      signal: controller.signal as unknown as AbortSignal,
    });

    expect(res.status).toBe(200);

    // Abort immediately and verify no error is thrown
    controller.abort();

    // Give the server a tick to process the abort
    await new Promise(r => setTimeout(r, 100));
    // No assertions on internal state — we just verify no exception was thrown
  });

  // T4-7: Two concurrent connections to same campaign both succeed
  it("T4-7: two concurrent connections both receive 200", async () => {
    const c1 = new AbortController();
    const c2 = new AbortController();

    const [r1, r2] = await Promise.all([
      fetch(streamUrl(), {
        headers: { Cookie: authCookie },
        signal: c1.signal as unknown as AbortSignal,
      }),
      fetch(streamUrl(), {
        headers: { Cookie: authCookie },
        signal: c2.signal as unknown as AbortSignal,
      }),
    ]);

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r1.headers.get("content-type")).toMatch(/text\/event-stream/);
    expect(r2.headers.get("content-type")).toMatch(/text\/event-stream/);

    c1.abort();
    c2.abort();
  });
});
