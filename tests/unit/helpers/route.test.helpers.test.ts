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

  it("itReturns401 mutates and restores mockAuthState.payload", async () => {
    let observedPayloadDuringHandler: unknown = "not_called";
    
    // A mock handler that records the payload status when called
    const mockHandler = jest.fn().mockImplementation(async (req: NextRequest) => {
      observedPayloadDuringHandler = mockAuthState.payload;
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    });

    const makeReq = () => new NextRequest("http://localhost/api/test");

    // We call the helper. Note we don't pass mockedRequireAuth since it should be removed.
    // However, since we are inside a describe/it block, itReturns401 registers an it() test.
    // To run it inline, we can extract the test function registered by itReturns401.
    const originalIt = global.it;
    let testFn: (() => Promise<void>) | null = null;
    
    global.it = ((name: string, fn: any) => {
      testFn = fn;
    }) as any;

    try {
      itReturns401(mockHandler, makeReq);
    } finally {
      global.it = originalIt;
    }

    expect(testFn).not.toBeNull();
    await testFn!();

    expect(observedPayloadDuringHandler).toBeNull();
    expect(mockAuthState.payload).toEqual(MOCK_AUTH);
  });
});
