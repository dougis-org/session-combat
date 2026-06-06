/**
 * @jest-environment node
 */
import { mockAuthState, MOCK_AUTH, itReturns401 } from "./route.test.helpers";
import { NextRequest, NextResponse } from "next/server";

describe("route.test.helpers", () => {
  it("has a default mockAuthState", () => {
    expect(mockAuthState).toBeDefined();
    expect(mockAuthState.payload).toEqual(MOCK_AUTH);
  });

  describe("itReturns401", () => {
    // Track payload observed during handler invocation
    let observedPayloadDuringHandler: unknown = "not_called";

    const mockHandler = jest.fn().mockImplementation(async (_req: NextRequest) => {
      observedPayloadDuringHandler = mockAuthState.payload;
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    });

    const makeReq = () => new NextRequest("http://localhost/api/test");

    // Registers an it() that the itReturns401 helper wraps
    itReturns401(mockHandler, makeReq);

    it("restores mockAuthState.payload to previous value after the 401 test runs", () => {
      // The registered test above has already run; payload should be restored
      expect(mockAuthState.payload).toEqual(MOCK_AUTH);
    });

    it("sets mockAuthState.payload to null during the handler invocation", () => {
      // The registered test ran mockHandler, which captured the payload
      expect(observedPayloadDuringHandler).toBeNull();
    });
  });
});
