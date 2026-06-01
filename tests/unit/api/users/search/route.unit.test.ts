/**
 * @jest-environment node
 */
import { GET } from "@/app/api/users/search/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/middleware", () => ({
  withAuth: (handler: Function) =>
    (request: NextRequest) =>
      handler(request, { userId: "507f1f77bcf86cd799439011" }),
}));

jest.mock("@/lib/rate-limit");
jest.mock("@/lib/db");

import { checkRateLimit, RateLimitError } from "@/lib/rate-limit";
import { getDatabase } from "@/lib/db";

const mockedCheckRateLimit = jest.mocked(checkRateLimit);
const mockedGetDatabase = jest.mocked(getDatabase);

function makeRequest(q?: string): NextRequest {
  const url = q !== undefined
    ? `http://localhost/api/users/search?q=${encodeURIComponent(q)}`
    : "http://localhost/api/users/search";
  return new NextRequest(url, { method: "GET" });
}

function mockDb() {
  mockedGetDatabase.mockResolvedValue({
    collection: jest.fn().mockReturnValue({
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      }),
    }),
  } as any);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedCheckRateLimit.mockReturnValue(undefined);
  mockDb();
});

describe("GET /api/users/search — input validation", () => {
  it("returns 400 when q is missing", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    expect(mockedCheckRateLimit).not.toHaveBeenCalled();
  });

  it("returns 400 when q is empty string", async () => {
    const res = await GET(makeRequest(""));
    expect(res.status).toBe(400);
  });

  it("returns 400 when q exceeds 50 characters", async () => {
    const res = await GET(makeRequest("a".repeat(51)));
    expect(res.status).toBe(400);
  });

  it("passes validation when q is exactly 50 characters", async () => {
    const res = await GET(makeRequest("a".repeat(50)));
    expect(res.status).toBe(200);
  });

  it("passes validation when q is 1 character", async () => {
    const res = await GET(makeRequest("a"));
    expect(res.status).toBe(200);
  });
});

describe("GET /api/users/search — rate limiting", () => {
  it("returns 429 when checkRateLimit throws RateLimitError", async () => {
    mockedCheckRateLimit.mockImplementation(() => {
      throw new RateLimitError("Too many requests.");
    });
    const res = await GET(makeRequest("doug"));
    expect(res.status).toBe(429);
  });

  it("uses a namespaced rate-limit key scoped to this endpoint", async () => {
    await GET(makeRequest("doug"));
    expect(mockedCheckRateLimit).toHaveBeenCalledWith(
      "search:user:507f1f77bcf86cd799439011",
      20,
      60_000
    );
  });

  it("proceeds past rate-limit check when no error is thrown", async () => {
    mockedCheckRateLimit.mockReturnValue(undefined);
    const res = await GET(makeRequest("doug"));
    expect(res.status).toBe(200);
  });
});

describe("GET /api/users/search — regex escaping", () => {
  let capturedRegex: RegExp | undefined;

  beforeEach(() => {
    capturedRegex = undefined;
    mockedGetDatabase.mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        find: jest.fn().mockImplementation((query) => {
          capturedRegex = query.username?.$regex;
          return { toArray: jest.fn().mockResolvedValue([]) };
        }),
      }),
    } as any);
  });

  it("escapes .* metacharacters so they are treated as literals", async () => {
    await GET(makeRequest(".*"));
    expect(capturedRegex?.source).toBe("^\\.\\*");
    expect(capturedRegex?.flags).toContain("i");
  });

  it("escapes ( metacharacter so it is treated as literal", async () => {
    await GET(makeRequest("(test"));
    expect(capturedRegex?.source).toBe("^\\(test");
    expect(capturedRegex?.flags).toContain("i");
  });

  it("leaves plain alphanumeric query unchanged and is case-insensitive", async () => {
    await GET(makeRequest("doug"));
    expect(capturedRegex?.source).toBe("^doug");
    expect(capturedRegex?.flags).toContain("i");
  });
});
