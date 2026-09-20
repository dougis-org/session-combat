import { sessionLogSubmissionSchema } from "@/lib/validation/sessionLog";

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    datePlayed: "2026-09-19",
    ...overrides,
  };
}

describe("sessionLogSubmissionSchema — datePlayed", () => {
  it("rejects missing datePlayed", () => {
    const { datePlayed: _omit, ...rest } = validBody();
    const result = sessionLogSubmissionSchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("datePlayed");
    }
  });

  it("rejects unparseable datePlayed", () => {
    const result = sessionLogSubmissionSchema.safeParse(validBody({ datePlayed: "not-a-date" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("datePlayed");
    }
  });

  it("rejects an impossible calendar date (rolled-over by the Date constructor)", () => {
    const result = sessionLogSubmissionSchema.safeParse(validBody({ datePlayed: "2026-02-30" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("datePlayed");
    }
  });

  it("accepts a valid ISO datePlayed and coerces to a Date", () => {
    const result = sessionLogSubmissionSchema.safeParse(validBody({ datePlayed: "2026-09-19" }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.datePlayed).toBeInstanceOf(Date);
    }
  });
});

describe("sessionLogSubmissionSchema — title/summary bounds", () => {
  it("rejects a 201-char title", () => {
    const result = sessionLogSubmissionSchema.safeParse(validBody({ title: "x".repeat(201) }));
    expect(result.success).toBe(false);
  });

  it("rejects a 10,001-char summary", () => {
    const result = sessionLogSubmissionSchema.safeParse(validBody({ summary: "x".repeat(10_001) }));
    expect(result.success).toBe(false);
  });

  it("accepts a 200-char title and 10,000-char summary", () => {
    const result = sessionLogSubmissionSchema.safeParse(
      validBody({ title: "x".repeat(200), summary: "x".repeat(10_000) })
    );
    expect(result.success).toBe(true);
  });

  it("accepts omitted title and summary", () => {
    const result = sessionLogSubmissionSchema.safeParse(validBody());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBeUndefined();
      expect(result.data.summary).toBeUndefined();
    }
  });
});

describe("sessionLogSubmissionSchema — events", () => {
  it("rejects an event with an invalid type", () => {
    const result = sessionLogSubmissionSchema.safeParse(
      validBody({ events: [{ type: "not_a_real_type", description: "x" }] })
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["events", 0, "type"]);
    }
  });

  it("rejects an event missing description", () => {
    const result = sessionLogSubmissionSchema.safeParse(validBody({ events: [{ type: "custom" }] }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["events", 0, "description"]);
    }
  });

  it("rejects an event with an oversized description", () => {
    const result = sessionLogSubmissionSchema.safeParse(
      validBody({ events: [{ type: "custom", description: "x".repeat(2_001) }] })
    );
    expect(result.success).toBe(false);
  });

  it("rejects non-array events", () => {
    const result = sessionLogSubmissionSchema.safeParse(validBody({ events: "not-an-array" }));
    expect(result.success).toBe(false);
  });

  it("accepts a full-shape combat_completed event", () => {
    const event = {
      type: "combat_completed",
      description: "Fought a dragon",
      encounterId: "enc-1",
      encounterDescription: "Dragon lair",
      rounds: 5,
      completedAt: "2026-09-19T12:00:00.000Z",
      campaignId: "camp-1",
    };
    const result = sessionLogSubmissionSchema.safeParse(validBody({ events: [event] }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.events?.[0]).toMatchObject({
        type: "combat_completed",
        description: "Fought a dragon",
        encounterId: "enc-1",
        encounterDescription: "Dragon lair",
        rounds: 5,
        campaignId: "camp-1",
      });
      expect(result.data.events?.[0].completedAt).toBeInstanceOf(Date);
    }
  });

  it("accepts a minimal custom event from the manual form", () => {
    const result = sessionLogSubmissionSchema.safeParse(
      validBody({ events: [{ type: "custom", description: "Party found a secret door" }] })
    );
    expect(result.success).toBe(true);
  });

  it("defaults omitted events to an empty array", () => {
    const result = sessionLogSubmissionSchema.safeParse(validBody());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.events).toEqual([]);
    }
  });

  it("rejects an events array of 201 elements", () => {
    const events = Array.from({ length: 201 }, () => ({ type: "custom", description: "x" }));
    const result = sessionLogSubmissionSchema.safeParse(validBody({ events }));
    expect(result.success).toBe(false);
  });

  it("accepts an events array of exactly 200 elements", () => {
    const events = Array.from({ length: 200 }, () => ({ type: "custom", description: "x" }));
    const result = sessionLogSubmissionSchema.safeParse(validBody({ events }));
    expect(result.success).toBe(true);
  });
});
