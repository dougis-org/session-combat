/**
 * @jest-environment node
 */
import { NextResponse } from "next/server";
import { POST } from "@/app/api/campaigns/[id]/attachments/route";
import { assertCampaignAccess } from "@/lib/utils/campaign";
import { getDatabase } from "@/lib/db";
import * as gridfs from "@/lib/gridfs";
import {
  MOCK_AUTH,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

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
  uploadAttachment: jest.fn(),
  deleteOrphanedAttachments: jest.fn(),
}));

const mockedAssertCampaignAccess = jest.mocked(assertCampaignAccess);
const mockedGetDatabase = jest.mocked(getDatabase);
const mockedGetAttachmentsBucket = jest.mocked(gridfs.getAttachmentsBucket);
const mockedUploadAttachment = jest.mocked(gridfs.uploadAttachment);
const mockedDeleteOrphanedAttachments = jest.mocked(gridfs.deleteOrphanedAttachments);

const CAMPAIGN_ID = "campaign-1";
const PARAMS = Promise.resolve({ id: CAMPAIGN_ID });
const BASE_URL = `http://localhost/api/campaigns/${CAMPAIGN_ID}/attachments`;

const DM_ACCESS = { campaign: { id: CAMPAIGN_ID } as any, role: "dm" as const };
const PLAYER_ACCESS = { campaign: { id: CAMPAIGN_ID } as any, role: "player" as const };
const MOCK_BUCKET = {} as any;

function makeMultipartRequest(file?: File): Request {
  if (!file) {
    const form = new FormData();
    form.append("other", "value");
    return new Request(BASE_URL, { method: "POST", body: form });
  }
  const form = new FormData();
  form.append("file", file, file.name);
  return new Request(BASE_URL, { method: "POST", body: form });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState.payload = MOCK_AUTH;
  mockedGetDatabase.mockResolvedValue({} as any);
  mockedGetAttachmentsBucket.mockReturnValue(MOCK_BUCKET);
  mockedDeleteOrphanedAttachments.mockResolvedValue(undefined);
  mockedUploadAttachment.mockResolvedValue("abc123def456abc123def456");
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe("POST /api/campaigns/[id]/attachments — auth", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuthState.payload = null;
    const req = makeMultipartRequest();
    const res = await POST(req as any, { params: PARAMS });
    expect(res.status).toBe(401);
  });
});

// ─── Campaign access ──────────────────────────────────────────────────────────

describe("POST /api/campaigns/[id]/attachments — campaign access", () => {
  it("returns 404 when assertCampaignAccess returns NextResponse (non-member)", async () => {
    mockedAssertCampaignAccess.mockResolvedValue(
      NextResponse.json({ error: "Not found" }, { status: 404 })
    );
    const req = makeMultipartRequest(new File(["x"], "f.jpg", { type: "image/jpeg" }));
    const res = await POST(req as any, { params: PARAMS });
    expect(res.status).toBe(404);
  });

  it("returns 403 when role is player", async () => {
    mockedAssertCampaignAccess.mockResolvedValue(PLAYER_ACCESS);
    const req = makeMultipartRequest(new File(["x"], "f.jpg", { type: "image/jpeg" }));
    const res = await POST(req as any, { params: PARAMS });
    expect(res.status).toBe(403);
  });
});

// ─── File validation ──────────────────────────────────────────────────────────

describe("POST /api/campaigns/[id]/attachments — validation", () => {
  beforeEach(() => {
    mockedAssertCampaignAccess.mockResolvedValue(DM_ACCESS);
  });

  it("returns 400 when no file field", async () => {
    const req = makeMultipartRequest();
    const res = await POST(req as any, { params: PARAMS });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "file is required" });
  });

  it("returns 415 for unsupported MIME type", async () => {
    const req = makeMultipartRequest(new File(["x"], "f.pdf", { type: "application/pdf" }));
    const res = await POST(req as any, { params: PARAMS });
    expect(res.status).toBe(415);
    expect(await res.json()).toEqual({ error: "Unsupported file type" });
  });

  it("returns 413 for file exceeding 5 MB", async () => {
    const bigFile = new File([new ArrayBuffer(5 * 1024 * 1024 + 1)], "big.jpg", {
      type: "image/jpeg",
    });
    const req = makeMultipartRequest(bigFile);
    const res = await POST(req as any, { params: PARAMS });
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: "File exceeds 5 MB limit" });
  });
});

// ─── Successful upload ────────────────────────────────────────────────────────

describe("POST /api/campaigns/[id]/attachments — success", () => {
  beforeEach(() => {
    mockedAssertCampaignAccess.mockResolvedValue(DM_ACCESS);
  });

  it("returns 201 with attachmentId for valid JPEG", async () => {
    const req = makeMultipartRequest(new File(["imgdata"], "photo.jpg", { type: "image/jpeg" }));
    const res = await POST(req as any, { params: PARAMS });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ attachmentId: "abc123def456abc123def456" });
  });

  it("calls deleteOrphanedAttachments before uploadAttachment", async () => {
    const callOrder: string[] = [];
    mockedDeleteOrphanedAttachments.mockImplementation(async () => { callOrder.push("delete"); });
    mockedUploadAttachment.mockImplementation(async () => { callOrder.push("upload"); return "id"; });

    const req = makeMultipartRequest(new File(["x"], "f.png", { type: "image/png" }));
    await POST(req as any, { params: PARAMS });

    expect(callOrder).toEqual(["delete", "upload"]);
  });

  it("accepts all allowed MIME types", async () => {
    for (const mime of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
      const req = makeMultipartRequest(new File(["x"], `f.${mime.split("/")[1]}`, { type: mime }));
      const res = await POST(req as any, { params: PARAMS });
      expect(res.status).toBe(201);
    }
  });
});
