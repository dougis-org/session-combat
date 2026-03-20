import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/login/route";
import { getDatabase } from "@/lib/db";
import {
  comparePassword,
  generateToken,
  validateEmail,
} from "@/lib/auth";
import { setAuthCookie } from "@/lib/middleware";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
jest.mock("@/lib/auth", () => ({
  comparePassword: jest.fn(),
  generateToken: jest.fn(),
  validateEmail: jest.fn(),
}));
jest.mock("@/lib/middleware", () => ({ setAuthCookie: jest.fn() }));

const mockedGetDatabase = jest.mocked(getDatabase);
const mockedComparePassword = jest.mocked(comparePassword);
const mockedGenerateToken = jest.mocked(generateToken);
const mockedValidateEmail = jest.mocked(validateEmail);
const mockedSetAuthCookie = jest.mocked(setAuthCookie);

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockDb(user: unknown) {
  const findOne = jest.fn().mockResolvedValue(user);
  mockedGetDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue({ findOne }),
  } as any);
  return { findOne };
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const response = await POST(makeRequest({ password: "pass" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when password is missing", async () => {
    const response = await POST(makeRequest({ email: "user@example.com" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    mockedValidateEmail.mockReturnValue(false);
    const response = await POST(
      makeRequest({ email: "notanemail", password: "pass" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 401 when user does not exist", async () => {
    mockedValidateEmail.mockReturnValue(true);
    mockDb(null);
    const response = await POST(
      makeRequest({ email: "ghost@example.com", password: "pass" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 401 when password does not match", async () => {
    mockedValidateEmail.mockReturnValue(true);
    mockDb({ _id: "id1", email: "user@example.com", passwordHash: "hash" });
    mockedComparePassword.mockResolvedValue(false);
    const response = await POST(
      makeRequest({ email: "user@example.com", password: "wrong" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 200 and sets auth cookie on successful login", async () => {
    mockedValidateEmail.mockReturnValue(true);
    mockDb({ _id: "id1", email: "user@example.com", passwordHash: "hash" });
    mockedComparePassword.mockResolvedValue(true);
    mockedGenerateToken.mockReturnValue("jwt.token.here");

    const response = await POST(
      makeRequest({ email: "user@example.com", password: "ValidPass1!" })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.email).toBe("user@example.com");
    expect(mockedSetAuthCookie).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when database throws", async () => {
    mockedValidateEmail.mockReturnValue(true);
    mockedGetDatabase.mockRejectedValue(new Error("DB error"));
    const response = await POST(
      makeRequest({ email: "user@example.com", password: "pass" })
    );
    expect(response.status).toBe(500);
  });
});
