/**
 * @jest-environment node
 */
import type { NextRequest } from "next/server";
import { readMonstersBody } from "@/app/api/monsters/upload/shared";

function fakeRequest(overrides: Partial<NextRequest> = {}): NextRequest {
  return {
    headers: { get: () => null },
    body: null,
    text: async () => {
      throw new Error("request.text() should not be called when no body stream exists");
    },
    ...overrides,
  } as unknown as NextRequest;
}

describe("readMonstersBody — no readable body stream", () => {
  it("rejects with a generic 400 instead of buffering via request.text()", async () => {
    const result = await readMonstersBody(fakeRequest());
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected ok: false");
    expect(result.response.status).toBe(400);
    const body = await result.response.json();
    expect(body.error).toMatch(/could not read the request body/i);
  });
});
