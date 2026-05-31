/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/register/route";
import { getDatabase } from "@/lib/db";
import {
  hashPassword,
  generateToken,
  validateEmail,
  validatePassword,
} from "@/lib/auth";
import { setAuthCookie } from "@/lib/middleware";

jest.mock("@/lib/db", () => ({ getDatabase: jest.fn() }));
jest.mock("@/lib/auth", () => ({
  hashPassword: jest.fn(),
  generateToken: jest.fn(),
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
}));
jest.mock("@/lib/middleware", () => ({ setAuthCookie: jest.fn() }));

const mockedGetDatabase = jest.mocked(getDatabase);
const mockedHashPassword = jest.mocked(hashPassword);
const mockedGenerateToken = jest.mocked(generateToken);
const mockedValidateEmail = jest.mocked(validateEmail);
const mockedValidatePassword = jest.mocked(validatePassword);
const mockedSetAuthCookie = jest.mocked(setAuthCookie);

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockDb(existingUser: unknown, insertedId = "new-user-id") {
  const findOne = jest.fn().mockResolvedValue(existingUser);
  const insertOne = jest
    .fn()
    .mockResolvedValue({ insertedId: { toString: () => insertedId } });
  mockedGetDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue({ findOne, insertOne }),
  } as any);
  return { findOne, insertOne };
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const response = await POST(makeRequest({ password: "ValidPass1!", username: "mockuser" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when password is missing", async () => {
    const response = await POST(makeRequest({ email: "user@example.com", username: "mockuser" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when username is missing", async () => {
    const response = await POST(makeRequest({ email: "user@example.com", password: "ValidPass1!" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    mockedValidateEmail.mockReturnValue(false);
    const response = await POST(
      makeRequest({ email: "notanemail", password: "ValidPass1!", username: "mockuser" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 for weak password", async () => {
    mockedValidateEmail.mockReturnValue(true);
    mockedValidatePassword.mockReturnValue({
      valid: false,
      errors: ["Too short"],
    });
    const response = await POST(
      makeRequest({ email: "user@example.com", password: "weak", username: "mockuser" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid username format", async () => {
    mockedValidateEmail.mockReturnValue(true);
    mockedValidatePassword.mockReturnValue({ valid: true, errors: [] });
    const response = await POST(
      makeRequest({ email: "user@example.com", password: "ValidPass1!", username: "a" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 409 when user with email already exists", async () => {
    mockedValidateEmail.mockReturnValue(true);
    mockedValidatePassword.mockReturnValue({ valid: true, errors: [] });
    const insertOne = jest.fn().mockRejectedValue({
      code: 11000,
      keyPattern: { email: 1 }
    });
    mockedGetDatabase.mockResolvedValue({
      collection: jest.fn().mockReturnValue({ insertOne }),
    } as any);
    const response = await POST(
      makeRequest({ email: "user@example.com", password: "ValidPass1!", username: "mockuser" })
    );
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("User with this email already exists");
  });

  it("returns 409 when username is already taken", async () => {
    mockedValidateEmail.mockReturnValue(true);
    mockedValidatePassword.mockReturnValue({ valid: true, errors: [] });
    const insertOne = jest.fn().mockRejectedValue({
      code: 11000,
      keyPattern: { username: 1 }
    });
    mockedGetDatabase.mockResolvedValue({
      collection: jest.fn().mockReturnValue({ insertOne }),
    } as any);
    const response = await POST(
      makeRequest({ email: "user@example.com", password: "ValidPass1!", username: "mockuser" })
    );
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("Username already taken");
  });

  it("returns 201 and sets cookie on successful registration", async () => {
    mockedValidateEmail.mockReturnValue(true);
    mockedValidatePassword.mockReturnValue({ valid: true, errors: [] });
    const insertOne = jest.fn().mockResolvedValue({ insertedId: { toString: () => "new-user-id" } });
    mockedGetDatabase.mockResolvedValue({
      collection: jest.fn().mockReturnValue({ insertOne }),
    } as any);
    mockedHashPassword.mockResolvedValue("hashed-password");
    mockedGenerateToken.mockReturnValue("jwt.token.here");

    const response = await POST(
      makeRequest({ email: "new@example.com", password: "ValidPass1!", username: "mockuser" })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.email).toBe("new@example.com");
    expect(body.username).toBe("mockuser");
    expect(mockedSetAuthCookie).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when database throws", async () => {
    mockedValidateEmail.mockReturnValue(true);
    mockedValidatePassword.mockReturnValue({ valid: true, errors: [] });
    mockedGetDatabase.mockRejectedValue(new Error("DB error"));
    const response = await POST(
      makeRequest({ email: "user@example.com", password: "ValidPass1!", username: "mockuser" })
    );
    expect(response.status).toBe(500);
  });
});
