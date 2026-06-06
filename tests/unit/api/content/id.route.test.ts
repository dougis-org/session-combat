/**
 * @jest-environment node
 */
import { PUT, DELETE } from "@/app/api/content/[id]/route";
import { storage } from "@/lib/storage";
import {
  MOCK_AUTH,
  makeRouteRequest,
  itReturns401WithParams,
  itReturns404WithParams,
  itReturns500WithParams,
  mockAuthState,
} from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/middleware", () => require("@/tests/unit/helpers/route.test.helpers").mockMiddleware);
jest.mock("@/lib/storage", () => ({
  storage: {
    savedContent: {
      update: jest.fn(),
      remove: jest.fn(),
    },
  },
}));

const mockedUpdate = jest.mocked(storage.savedContent.update);
const mockedRemove = jest.mocked(storage.savedContent.remove);

const CONTENT_ID = "item-1";
const BASE_URL = `http://localhost/api/content/${CONTENT_ID}`;
const PARAMS = Promise.resolve({ id: CONTENT_ID });

const makePutReq = (body: unknown) => makeRouteRequest(BASE_URL, "PUT", body);
const makeDeleteReq = () => makeRouteRequest(BASE_URL, "DELETE");

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState.payload = MOCK_AUTH;
});

// ─── PUT /api/content/[id] ────────────────────────────────────────────────────

describe("PUT /api/content/[id]", () => {
  itReturns401WithParams(PUT, () => makePutReq({ result: "text" }), PARAMS);

  it("returns 400 when result is not a string", async () => {
    const res = await PUT(makePutReq({ result: 42 }), { params: PARAMS });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("result must be a string");
  });

  it("returns 400 when notes is not a string", async () => {
    const res = await PUT(makePutReq({ notes: true }), { params: PARAMS });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("notes must be a string");
  });

  it("returns 200 on successful update", async () => {
    mockedUpdate.mockResolvedValue(true);
    const res = await PUT(makePutReq({ result: "AI response", notes: "My notes" }), { params: PARAMS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockedUpdate).toHaveBeenCalledWith(
      CONTENT_ID,
      "user-123",
      { result: "AI response", notes: "My notes" }
    );
  });

  it("updates only result when notes omitted", async () => {
    mockedUpdate.mockResolvedValue(true);
    const res = await PUT(makePutReq({ result: "Only result" }), { params: PARAMS });
    expect(res.status).toBe(200);
    expect(mockedUpdate).toHaveBeenCalledWith(
      CONTENT_ID,
      "user-123",
      { result: "Only result" }
    );
  });

  itReturns404WithParams(
    PUT,
    () => makePutReq({ result: "text" }),
    PARAMS,
    () => mockedUpdate.mockResolvedValue(false),
    "returns 404 when item not found"
  );

  itReturns500WithParams(
    PUT,
    () => makePutReq({ result: "text" }),
    PARAMS,
    () => mockedUpdate.mockRejectedValue(new Error("DB error"))
  );
});

// ─── DELETE /api/content/[id] ─────────────────────────────────────────────────

describe("DELETE /api/content/[id]", () => {
  itReturns401WithParams(DELETE, makeDeleteReq, PARAMS);

  it("returns 204 on successful delete", async () => {
    mockedRemove.mockResolvedValue(true);
    const res = await DELETE(makeDeleteReq(), { params: PARAMS });
    expect(res.status).toBe(204);
    expect(mockedRemove).toHaveBeenCalledWith(CONTENT_ID, "user-123");
  });

  itReturns404WithParams(
    DELETE,
    makeDeleteReq,
    PARAMS,
    () => mockedRemove.mockResolvedValue(false),
    "returns 404 when item not found"
  );

  itReturns500WithParams(
    DELETE,
    makeDeleteReq,
    PARAMS,
    () => mockedRemove.mockRejectedValue(new Error("DB error"))
  );
});
