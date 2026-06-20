/**
 * @jest-environment node
 */
import { NextResponse } from "next/server";
import { GET } from "@/app/api/campaigns/[id]/attachments/[attachmentId]/route";
import { assertCampaignAccess } from "@/lib/utils/campaign";
import { getDatabase } from "@/lib/db";
import * as gridfs from "@/lib/gridfs";
import {
  MOCK_AUTH,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";
import { Readable } from "stream";

jest.mock("@/lib/middleware", () =>
  require("@/tests/unit/helpers/route.test.helpers").createMockMiddleware()
);

jest.mock("@/lib/utils/campaign", () => ({
  assertCampaignAccess: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  getDatabase: jest.fn(),
}));

jest.mock("@/lib/gridfs", () => ({
  getAttachmentsBucket: jest.fn(),
  openDownloadStream: jest.fn(),
}));

const mockedAssertCampaignAccess = jest.mocked(assertCampaignAccess);
const mockedGetDatabase = jest.mocked(getDatabase);
const mockedGetAttachmentsBucket = jest.mocked(gridfs.getAttachmentsBucket);
const mockedOpenDownloadStream = jest.mocked(gridfs.openDownloadStream);

const CAMPAIGN_ID = "campaign-1";
const VALID_ATTACHMENT_ID = "507f1f77bcf86cd799439011";
const MOCK_BUCKET = {} as any;
const MEMBER_ACCESS = { campaign: { id: CAMPAIGN_ID } as any, role: "player" as const };

const BASE_URL = `http://localhost/api/campaigns/${CAMPAIGN_ID}/attachments`;

function makeRequest(attachmentId = VALID_ATTACHMENT_ID): Request {
  return new Request(`${BASE_URL}/${attachmentId}`, { method: "GET" });
}

function makeReadableStream(content = "image-bytes"): Readable {
  return Readable.from([Buffer.from(content)]);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState.payload = MOCK_AUTH;
  mockedGetDatabase.mockResolvedValue({} as any);
  mockedGetAttachmentsBucket.mockReturnValue(MOCK_BUCKET);
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe("GET /api/campaigns/[id]/attachments/[attachmentId] — auth", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuthState.payload = null;
    const req = makeRequest();
    const res = await GET(req as any, { params: Promise.resolve({ id: CAMPAIGN_ID, attachmentId: VALID_ATTACHMENT_ID }) });
    expect(res.status).toBe(401);
  });
});

// ─── Campaign access ──────────────────────────────────────────────────────────

describe("GET /api/campaigns/[id]/attachments/[attachmentId] — campaign access", () => {
  it("returns 404 when assertCampaignAccess returns NextResponse (non-member)", async () => {
    mockedAssertCampaignAccess.mockResolvedValue(
      NextResponse.json({ error: "Not found" }, { status: 404 })
    );
    const res = await GET(makeRequest() as any, { params: Promise.resolve({ id: CAMPAIGN_ID, attachmentId: VALID_ATTACHMENT_ID }) });
    expect(res.status).toBe(404);
  });
});

// ─── attachmentId validation ──────────────────────────────────────────────────

describe("GET /api/campaigns/[id]/attachments/[attachmentId] — validation", () => {
  beforeEach(() => {
    mockedAssertCampaignAccess.mockResolvedValue(MEMBER_ACCESS);
  });

  it("returns 400 for invalid attachmentId (INVALID_ID from openDownloadStream)", async () => {
    const err = Object.assign(new Error("Invalid attachmentId"), { code: "INVALID_ID" });
    mockedOpenDownloadStream.mockRejectedValue(err);
    const res = await GET(makeRequest("not-a-valid-id") as any, {
      params: Promise.resolve({ id: CAMPAIGN_ID, attachmentId: "not-a-valid-id" }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid attachmentId" });
  });

  it("returns 404 when attachment not found (NOT_FOUND from openDownloadStream)", async () => {
    const err = Object.assign(new Error("Attachment not found"), { code: "NOT_FOUND" });
    mockedOpenDownloadStream.mockRejectedValue(err);
    const res = await GET(makeRequest() as any, {
      params: Promise.resolve({ id: CAMPAIGN_ID, attachmentId: VALID_ATTACHMENT_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 500 for unexpected errors", async () => {
    mockedOpenDownloadStream.mockRejectedValue(new Error("Unexpected DB error"));
    const res = await GET(makeRequest() as any, {
      params: Promise.resolve({ id: CAMPAIGN_ID, attachmentId: VALID_ATTACHMENT_ID }),
    });
    expect(res.status).toBe(500);
  });
});

// ─── Campaign ID mismatch ─────────────────────────────────────────────────────

describe("GET /api/campaigns/[id]/attachments/[attachmentId] — campaignId mismatch", () => {
  beforeEach(() => {
    mockedAssertCampaignAccess.mockResolvedValue(MEMBER_ACCESS);
  });

  it("returns 404 when file belongs to a different campaign", async () => {
    const stream = makeReadableStream();
    (stream as any).destroy = jest.fn();
    mockedOpenDownloadStream.mockResolvedValue({
      stream: stream as any,
      contentType: "image/jpeg",
      campaignId: "other-campaign",
    });
    const res = await GET(makeRequest() as any, {
      params: Promise.resolve({ id: CAMPAIGN_ID, attachmentId: VALID_ATTACHMENT_ID }),
    });
    expect(res.status).toBe(404);
  });
});

// ─── Successful serve ─────────────────────────────────────────────────────────

describe("GET /api/campaigns/[id]/attachments/[attachmentId] — success", () => {
  beforeEach(() => {
    mockedAssertCampaignAccess.mockResolvedValue(MEMBER_ACCESS);
  });

  it("returns 200 with correct Content-Type header", async () => {
    const stream = makeReadableStream();
    mockedOpenDownloadStream.mockResolvedValue({
      stream: stream as any,
      contentType: "image/jpeg",
      campaignId: CAMPAIGN_ID,
    });
    const res = await GET(makeRequest() as any, {
      params: Promise.resolve({ id: CAMPAIGN_ID, attachmentId: VALID_ATTACHMENT_ID }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
  });

  it("returns 200 with PNG content-type", async () => {
    const stream = makeReadableStream();
    mockedOpenDownloadStream.mockResolvedValue({
      stream: stream as any,
      contentType: "image/png",
      campaignId: CAMPAIGN_ID,
    });
    const res = await GET(makeRequest() as any, {
      params: Promise.resolve({ id: CAMPAIGN_ID, attachmentId: VALID_ATTACHMENT_ID }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
  });
});
