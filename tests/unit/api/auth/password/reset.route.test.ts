/**
 * @jest-environment node
 */
import { POST } from "@/app/api/auth/password/reset/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/db");
jest.mock("@/lib/rate-limit");
jest.mock("@/lib/auth", () => ({
  hashPassword: jest.fn(),
  validatePassword: jest.fn(),
}));
jest.mock("@/lib/reset-tokens");

import { getDatabase } from "@/lib/db";
import { checkRateLimit, RateLimitError } from "@/lib/rate-limit";
import { hashPassword, validatePassword } from "@/lib/auth";
import { hashToken } from "@/lib/reset-tokens";

const mockedGetDatabase = jest.mocked(getDatabase);
const mockedCheckRateLimit = jest.mocked(checkRateLimit);
const mockedHashPassword = jest.mocked(hashPassword);
const mockedValidatePassword = jest.mocked(validatePassword);
const mockedHashToken = jest.mocked(hashToken);

function makeRequest(body: unknown, ip = "1.2.3.4"): NextRequest {
  return new NextRequest("http://localhost/api/auth/password/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const VALID_TOKEN = "valid-reset-token";
const VALID_PASSWORD = "Str0ng!Pass";
const USER_ID = "507f1f77bcf86cd799439011"; // valid 24-char hex ObjectId

function mockDb(tokenDoc: unknown, updateResult = { matchedCount: 1 }) {
  const findOneAndUpdate = jest.fn().mockResolvedValue(tokenDoc);
  const updateOne = jest.fn().mockResolvedValue(updateResult);
  mockedGetDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue({ findOneAndUpdate, updateOne }),
  } as any);
  return { findOneAndUpdate, updateOne };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedCheckRateLimit.mockReturnValue(undefined);
  mockedHashPassword.mockResolvedValue("hashedPw");
  mockedValidatePassword.mockReturnValue({ valid: true, errors: [] });
  mockedHashToken.mockReturnValue("h");
});

describe("POST /api/auth/password/reset", () => {
  it("returns 400 on malformed JSON", async () => {
    const req = new NextRequest("http://localhost/api/auth/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when token is missing", async () => {
    const res = await POST(makeRequest({ password: VALID_PASSWORD }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is missing", async () => {
    const res = await POST(makeRequest({ token: VALID_TOKEN }));
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockedCheckRateLimit.mockImplementation(() => {
      throw new RateLimitError("Too many requests.");
    });
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }));
    expect(res.status).toBe(429);
  });

  it("returns 400 when password fails validation", async () => {
    mockedValidatePassword.mockReturnValue({ valid: false, errors: ["Too short"] });
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: "weak" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.details).toEqual(["Too short"]);
  });

  it("returns 400 when token is invalid/expired (findOneAndUpdate returns null)", async () => {
    mockDb(null);
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }));
    expect(res.status).toBe(400);
  });

  it("always hashes password even for invalid tokens (timing uniformity)", async () => {
    mockDb(null);
    await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }));
    expect(mockedHashPassword).toHaveBeenCalledWith(VALID_PASSWORD);
  });

  it("returns 400 when token userId is not a valid ObjectId", async () => {
    mockDb({ userId: "not-an-objectid", tokenHash: "h" });
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when user not found (matchedCount 0)", async () => {
    mockDb({ userId: USER_ID, tokenHash: "h" }, { matchedCount: 0 });
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }));
    expect(res.status).toBe(400);
  });

  it("returns 200 on valid token and strong password", async () => {
    mockDb({ userId: USER_ID, tokenHash: "h" });
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Password reset successful.");
  });

  it("updates passwordHash and increments tokenVersion atomically", async () => {
    const { updateOne } = mockDb({ userId: USER_ID, tokenHash: "h" });
    await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }));
    expect(updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: expect.anything() }),
      expect.objectContaining({
        $set: expect.objectContaining({ passwordHash: "hashedPw" }),
        $inc: { tokenVersion: 1 },
      })
    );
  });

  it("takes first IP from comma-separated x-forwarded-for", async () => {
    mockDb({ userId: USER_ID, tokenHash: "h" });
    const req = new NextRequest("http://localhost/api/auth/password/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.1, 10.0.0.1",
      },
      body: JSON.stringify({ token: VALID_TOKEN, password: VALID_PASSWORD }),
    });
    await POST(req);
    const ipCall = mockedCheckRateLimit.mock.calls.find(([k]) =>
      k.startsWith("reset:ip:")
    );
    expect(ipCall?.[0]).toBe("reset:ip:203.0.113.1");
  });

  it("returns 500 on unexpected error", async () => {
    mockedGetDatabase.mockRejectedValue(new Error("DB down"));
    const res = await POST(makeRequest({ token: VALID_TOKEN, password: VALID_PASSWORD }));
    expect(res.status).toBe(500);
  });
});
