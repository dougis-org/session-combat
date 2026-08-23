/**
 * @jest-environment node
 */

import { logStorageEvent } from "@/lib/telemetry/logger";

describe("logStorageEvent", () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test("emits name, collection, outcome, durationMs for a success event", () => {
    logStorageEvent({
      name: "loadCampaignById",
      collection: "campaigns",
      outcome: "success",
      durationMs: 12,
    });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const [entry] = consoleSpy.mock.calls[0];
    expect(entry).toMatchObject({
      name: "loadCampaignById",
      collection: "campaigns",
      outcome: "success",
      durationMs: 12,
    });
  });

  test("emits outcome not_found with the same required fields", () => {
    logStorageEvent({
      name: "getMember",
      collection: "campaignMembers",
      outcome: "not_found",
      durationMs: 5,
    });

    const [entry] = consoleSpy.mock.calls[0];
    expect(entry).toMatchObject({
      name: "getMember",
      collection: "campaignMembers",
      outcome: "not_found",
      durationMs: 5,
    });
  });

  test("emits error outcome carrying the original error via console.error", () => {
    const originalError = new Error("connection refused");

    logStorageEvent({
      name: "getMember",
      collection: "campaignMembers",
      outcome: "error",
      durationMs: 8,
      error: originalError,
    });

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const [entry] = consoleErrorSpy.mock.calls[0];
    expect(entry).toMatchObject({
      name: "getMember",
      collection: "campaignMembers",
      outcome: "error",
      durationMs: 8,
      error: originalError,
    });
  });

  test("produces the same field set across all outcomes (error absent unless passed)", () => {
    logStorageEvent({
      name: "loadCampaignById",
      collection: "campaigns",
      outcome: "success",
      durationMs: 1,
    });

    const [entry] = consoleSpy.mock.calls[0];
    expect(entry).not.toHaveProperty("error");
  });
});
