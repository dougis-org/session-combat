import { registerTestUser } from "../../helpers/users";

describe("GET /api/auth/me payload shape (preferences must NOT leak in)", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");
  });

  it("returns exactly authenticated, userId, email, isAdmin, username", async () => {
    const { cookie } = await registerTestUser(baseUrl, "me-shape");
    const res = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(
      ["authenticated", "email", "isAdmin", "userId", "username"].sort(),
    );
    expect(body).not.toHaveProperty("preferences");
  });
});
