/**
 * @jest-environment node
 */
import { POST } from "@/app/api/auth/password/forgot/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/db");
jest.mock("@/lib/rate-limit");
jest.mock("@/lib/reset-tokens");
jest.mock("@/lib/email");

import { getDatabase } from "@/lib/db";
import { checkRateLimit, RateLimitError } from "@/lib/rate-limit";
import { generateResetToken, hashToken, storeResetToken } from "@/lib/reset-tokens";
import { sendPasswordResetEmail } from "@/lib/email";

const mockedGetDatabase = jest.mocked(getDatabase);
const mockedCheckRateLimit = jest.mocked(checkRateLimit);
const mockedGenerateResetToken = jest.mocked(generateResetToken);
const mockedHashToken = jest.mocked(hashToken);
const mockedStoreResetToken = jest.mocked(storeResetToken);
const mockedSendPasswordResetEmail = jest.mocked(sendPasswordResetEmail);

const GENERIC_MSG = "If an account with that email exists, a password reset link has been sent.";

function makeRequest(body: unknown, ip = "1.2.3.4"): NextRequest {
  return new NextRequest("http://localhost/api/auth/password/forgot", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

function mockDb(user: unknown) {
  mockedGetDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue({
      findOne: jest.fn().mockResolvedValue(user),
    }),
  } as any);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedCheckRateLimit.mockReturnValue(undefined);
  mockedGenerateResetToken.mockReturnValue("tok");
  mockedHashToken.mockReturnValue("h");
  mockedStoreResetToken.mockResolvedValue(undefined);
  mockedSendPasswordResetEmail.mockResolvedValue(undefined);
});

describe("POST /api/auth/password/forgot", () => {
  it("returns 400 on malformed JSON", async () => {
    const req = new NextRequest("http://localhost/api/auth/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns 429 when IP rate limit exceeded", async () => {
    mockedCheckRateLimit.mockImplementation((key) => {
      if (key.startsWith("forgot:ip:")) throw new RateLimitError("Too many requests.");
    });
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(429);
  });

  it("returns 429 when email rate limit exceeded", async () => {
    mockedCheckRateLimit.mockImplementation((key) => {
      if (key.startsWith("forgot:email:")) throw new RateLimitError("Too many requests.");
    });
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(429);
  });

  it("returns 200 with generic message for unknown email", async () => {
    mockDb(null);
    const res = await POST(makeRequest({ email: "nobody@example.com" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe(GENERIC_MSG);
    expect(mockedStoreResetToken).not.toHaveBeenCalled();
  });

  it("returns 200 with generic message for known email and fires token+email", async () => {
    mockDb({ _id: { toString: () => "uid-1" } });
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe(GENERIC_MSG);
    // Fire-and-forget starts synchronously — assert it was invoked
    expect(mockedGenerateResetToken).toHaveBeenCalled();
    expect(mockedHashToken).toHaveBeenCalled();
  });

  it("takes first IP from comma-separated x-forwarded-for", async () => {
    mockDb(null);
    const req = new NextRequest("http://localhost/api/auth/password/forgot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.1, 10.0.0.1",
      },
      body: JSON.stringify({ email: "user@example.com" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const ipCall = mockedCheckRateLimit.mock.calls.find(([k]) =>
      k.startsWith("forgot:ip:")
    );
    expect(ipCall?.[0]).toBe("forgot:ip:203.0.113.1");
  });

  it("returns 500 on unexpected DB error", async () => {
    mockedGetDatabase.mockRejectedValue(new Error("DB down"));
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(500);
  });
});
