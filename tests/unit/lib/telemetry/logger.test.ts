/**
 * @jest-environment node
 */

import { logStorageEvent } from "@/lib/telemetry/logger";
import { metrics, trace, SpanStatusCode } from "@opentelemetry/api";

jest.mock("@opentelemetry/api", () => {
  const mockSpan = {
    end: jest.fn(),
    recordException: jest.fn(),
    setStatus: jest.fn(),
  };

  const mockTracer = {
    startSpan: jest.fn().mockReturnValue(mockSpan),
  };

  const mockCounter = {
    add: jest.fn(),
  };

  const mockMeter = {
    createCounter: jest.fn().mockReturnValue(mockCounter),
  };

  return {
    trace: {
      getTracer: jest.fn().mockReturnValue(mockTracer),
    },
    metrics: {
      getMeter: jest.fn().mockReturnValue(mockMeter),
    },
    SpanStatusCode: {
      UNSET: 0,
      OK: 1,
      ERROR: 2,
    },
  };
});

describe("logStorageEvent", () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test("emits OpenTelemetry counter exactly once during a successful storage event", () => {
    logStorageEvent({
      name: "loadCampaignById",
      collection: "campaigns",
      outcome: "success",
      durationMs: 12,
    });

    const meter = metrics.getMeter("session-combat");
    const counter = meter.createCounter("storage.ops");

    expect(counter.add).toHaveBeenCalledTimes(1);
    expect(counter.add).toHaveBeenCalledWith(1, {
      name: "loadCampaignById",
      collection: "campaigns",
      outcome: "success",
    });
  });

  test("emits OpenTelemetry counter exactly once during an error storage event", () => {
    logStorageEvent({
      name: "loadCampaignById",
      collection: "campaigns",
      outcome: "error",
      durationMs: 12,
      error: new Error("Test error"),
    });

    const meter = metrics.getMeter("session-combat");
    const counter = meter.createCounter("storage.ops");

    expect(counter.add).toHaveBeenCalledTimes(1);
    expect(counter.add).toHaveBeenCalledWith(1, {
      name: "loadCampaignById",
      collection: "campaigns",
      outcome: "error",
    });
  });

  test("emits OpenTelemetry trace span with the name storage.<collection>.<name>", () => {
    logStorageEvent({
      name: "loadCampaignById",
      collection: "campaigns",
      outcome: "success",
      durationMs: 12,
    });

    const tracer = trace.getTracer("session-combat");
    expect(tracer.startSpan).toHaveBeenCalledWith("storage.campaigns.loadCampaignById", expect.any(Object));
  });

  test("tracer.startSpan is provided a startTime equal to endTime - durationMs", () => {
    const beforeMs = Date.now();
    logStorageEvent({
      name: "loadCampaignById",
      collection: "campaigns",
      outcome: "success",
      durationMs: 12,
    });
    const afterMs = Date.now();

    const tracer = trace.getTracer("session-combat");
    const startSpanOptions = (tracer.startSpan as jest.Mock).mock.calls[0][1];
    
    expect(startSpanOptions).toBeDefined();
    expect(startSpanOptions.startTime).toBeDefined();
    
    const startTimeMs = startSpanOptions.startTime as number;
    
    const approxEndTime = startTimeMs + 12;
    expect(approxEndTime).toBeGreaterThanOrEqual(beforeMs);
    expect(approxEndTime).toBeLessThanOrEqual(afterMs + 10);
  });

  test("span.end() is called with endTime", () => {
    logStorageEvent({
      name: "loadCampaignById",
      collection: "campaigns",
      outcome: "success",
      durationMs: 12,
    });

    const tracer = trace.getTracer("session-combat");
    const mockSpan = tracer.startSpan("test");
    expect(mockSpan.end).toHaveBeenCalledTimes(1);
    const endCallArg = (mockSpan.end as jest.Mock).mock.calls[0][0];
    expect(endCallArg).toBeDefined();
  });

  test("recordException and setStatus are called when the outcome is error and an Error object is provided", () => {
    const error = new Error("Test error");
    logStorageEvent({
      name: "loadCampaignById",
      collection: "campaigns",
      outcome: "error",
      durationMs: 12,
      error,
    });

    const tracer = trace.getTracer("session-combat");
    const mockSpan = tracer.startSpan("test");
    
    expect(mockSpan.recordException).toHaveBeenCalledWith(error);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
  });

  test("console.log is called when (process.env as any).NODE_ENV = 'development' for a success event", () => {
    (process.env as any).NODE_ENV = "development";
    logStorageEvent({
      name: "loadCampaignById",
      collection: "campaigns",
      outcome: "success",
      durationMs: 12,
    });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  test("console.error is called when (process.env as any).NODE_ENV = 'development' for an error event", () => {
    (process.env as any).NODE_ENV = "development";
    logStorageEvent({
      name: "loadCampaignById",
      collection: "campaigns",
      outcome: "error",
      durationMs: 12,
      error: new Error("Test error"),
    });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  test("NO console methods are called when (process.env as any).NODE_ENV = 'production'", () => {
    (process.env as any).NODE_ENV = "production";
    logStorageEvent({
      name: "loadCampaignById",
      collection: "campaigns",
      outcome: "success",
      durationMs: 12,
    });
    logStorageEvent({
      name: "loadCampaignById",
      collection: "campaigns",
      outcome: "error",
      durationMs: 12,
      error: new Error("Test error"),
    });

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
