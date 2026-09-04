import { registerTestUser } from "./helpers/users";

interface MonsterResponse {
  id: string;
  userId: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  abilityScores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface ErrorResponse {
  error: string;
}

describe("Monster API Integration Tests", () => {
  let baseUrl: string;
  let authCookie: string;

  beforeAll(async () => {
    baseUrl = process.env.TEST_BASE_URL!;
    if (!baseUrl) throw new Error("TEST_BASE_URL not set — globalSetup was not wired correctly");
    authCookie = (await registerTestUser(baseUrl, "monster-test")).cookie;
  }, 30000);

  function authed() {
    return { "Content-Type": "application/json", Cookie: authCookie };
  }

  it("should return healthy status from health endpoint", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });

  it("should return 401 for unauthenticated monster requests", async () => {
    const response = await fetch(`${baseUrl}/api/monsters`, {
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status).toBe(401);
  });

  it("should POST a monster template and return 201", async () => {
    const response = await fetch(`${baseUrl}/api/monsters`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({
        name: "Goblin",
        hp: 7,
        maxHp: 7,
        ac: 15,
      }),
    });

    expect(response.status).toBe(201);
    const data = (await response.json()) as MonsterResponse;
    expect(data.name).toBe("Goblin");
    expect(data.hp).toBe(7);
    expect(data.maxHp).toBe(7);
    expect(data.ac).toBe(15);
    expect(data.abilityScores).toBeDefined();
    expect(data.id).toBeDefined();
    expect(data.createdAt).toBeDefined();
  });

  it("should return 400 when creating monster without name", async () => {
    const response = await fetch(`${baseUrl}/api/monsters`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ hp: 7, maxHp: 7, ac: 15 }),
    });
    expect(response.status).toBe(400);
    const data = (await response.json()) as ErrorResponse;
    expect(data.error).toContain("name");
  });

  it("should return 400 when maxHp is 0 or negative", async () => {
    const response = await fetch(`${baseUrl}/api/monsters`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({
        name: "Invalid Monster",
        hp: 7,
        maxHp: 0,
        ac: 15,
      }),
    });
    expect(response.status).toBe(400);
    const data = (await response.json()) as ErrorResponse;
    expect(data.error).toContain("Max HP");
  });

  it("should cap hp to maxHp when hp exceeds maxHp", async () => {
    const response = await fetch(`${baseUrl}/api/monsters`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({
        name: "Over HP Monster",
        hp: 20,
        maxHp: 10,
        ac: 15,
      }),
    });
    expect(response.status).toBe(201);
    const data = (await response.json()) as MonsterResponse;
    expect(data.maxHp).toBe(10);
    expect(data.hp).toBe(10);
  });

  it("should use default values for optional fields", async () => {
    const response = await fetch(`${baseUrl}/api/monsters`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ name: "Minimal Monster", maxHp: 10 }),
    });
    expect(response.status).toBe(201);
    const data = (await response.json()) as MonsterResponse;
    expect(data.name).toBe("Minimal Monster");
    expect(data.maxHp).toBe(10);
    expect(data.ac).toBe(10); // default
    expect(data.hp).toBe(10); // hp defaults to maxHp
    expect(data.abilityScores).toBeDefined();
  });

  it("should return 404 when trying to GET non-existent monster", async () => {
    const response = await fetch(`${baseUrl}/api/monsters/nonexistent-id`, {
      headers: authed(),
    });
    expect(response.status).toBe(404);
  });

  it("should return 404 when trying to DELETE non-existent monster", async () => {
    const response = await fetch(`${baseUrl}/api/monsters/nonexistent-id`, {
      method: "DELETE",
      headers: authed(),
    });
    expect(response.status).toBe(404);
  });

  it("should return 404 when trying to PUT non-existent monster", async () => {
    const response = await fetch(`${baseUrl}/api/monsters/nonexistent-id`, {
      method: "PUT",
      headers: authed(),
      body: JSON.stringify({
        name: "Updated Monster",
        hp: 10,
        maxHp: 20,
        ac: 16,
        initiativeBonus: 3,
        dexterity: 14,
      }),
    });
    expect(response.status).toBe(404);
  });

  it("should GET all monsters for authenticated user", async () => {
    const response = await fetch(`${baseUrl}/api/monsters`, {
      headers: authed(),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  describe("POST /api/monsters/upload", () => {
    let uploadAuthCookie: string;

    beforeAll(async () => {
      uploadAuthCookie = (await registerTestUser(baseUrl, "monster-upload-test")).cookie;
    }, 30000);

    function uploadAuthed() {
      return { "Content-Type": "application/json", Cookie: uploadAuthCookie };
    }

    const uploadMonster = (overrides: Record<string, unknown> = {}) => ({
      name: "Upload Beast",
      size: "large",
      type: "beast",
      ac: 14,
      maxHp: 22,
      speed: "40 ft.",
      challengeRating: 2,
      abilityScores: {
        strength: 16,
        dexterity: 12,
        constitution: 14,
        intelligence: 3,
        wisdom: 12,
        charisma: 6,
      },
      ...overrides,
    });

    it("valid upload returns 200 with inserted names and monster is queryable", async () => {
      const uploadRes = await fetch(`${baseUrl}/api/monsters/upload`, {
        method: "POST",
        headers: uploadAuthed(),
        body: JSON.stringify({ monsters: [uploadMonster({ name: "Upload Beast" })] }),
      });
      expect(uploadRes.status).toBe(200);
      const uploadData = (await uploadRes.json()) as {
        inserted: string[];
        reverted: boolean;
      };
      expect(uploadData.inserted).toEqual(["Upload Beast"]);
      expect(uploadData.reverted).toBe(false);

      const listRes = await fetch(`${baseUrl}/api/monsters`, {
        headers: uploadAuthed(),
      });
      expect(listRes.status).toBe(200);
      const monsters = (await listRes.json()) as Array<{ name: string }>;
      expect(monsters.some((m) => m.name === "Upload Beast")).toBe(true);
    });

    it("re-importing the same name+source skips it as a duplicate", async () => {
      const body = JSON.stringify({
        monsters: [uploadMonster({ name: "Dup Beast", source: "SRD" })],
      });
      await fetch(`${baseUrl}/api/monsters/upload`, {
        method: "POST",
        headers: uploadAuthed(),
        body,
      });
      const res = await fetch(`${baseUrl}/api/monsters/upload`, {
        method: "POST",
        headers: uploadAuthed(),
        body,
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        inserted: string[];
        skippedDuplicates: string[];
      };
      expect(data.inserted).toEqual([]);
      expect(data.skippedDuplicates).toEqual(["Dup Beast"]);
    });

    it("non-admin requesting global scope is rejected with 403", async () => {
      const res = await fetch(`${baseUrl}/api/monsters/upload`, {
        method: "POST",
        headers: uploadAuthed(),
        body: JSON.stringify({ monsters: [uploadMonster()], scope: "global" }),
      });
      expect(res.status).toBe(403);
    });

    it("returns 401 without auth cookie", async () => {
      const res = await fetch(`${baseUrl}/api/monsters/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monsters: [uploadMonster()] }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 400 with missing monsters key", async () => {
      const res = await fetch(`${baseUrl}/api/monsters/upload`, {
        method: "POST",
        headers: uploadAuthed(),
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/monsters/upload/validate", () => {
    const validMonster = (overrides: Record<string, unknown> = {}) => ({
      name: "Validate Beast",
      size: "medium",
      type: "beast",
      ac: 13,
      maxHp: 15,
      speed: "30 ft.",
      challengeRating: 1,
      abilityScores: {
        strength: 12,
        dexterity: 12,
        constitution: 12,
        intelligence: 6,
        wisdom: 10,
        charisma: 6,
      },
      ...overrides,
    });

    it("valid document → 200 with count, names in order, isAdmin, and no writes", async () => {
      const before = await (
        await fetch(`${baseUrl}/api/monsters`, { headers: authed() })
      ).json();

      const res = await fetch(`${baseUrl}/api/monsters/upload/validate`, {
        method: "POST",
        headers: authed(),
        body: JSON.stringify({
          monsters: [validMonster({ name: "First" }), validMonster({ name: "Second" })],
        }),
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        valid: boolean;
        count: number;
        names: string[];
        isAdmin: boolean;
      };
      expect(data.valid).toBe(true);
      expect(data.count).toBe(2);
      expect(data.names).toEqual(["First", "Second"]);
      expect(typeof data.isAdmin).toBe("boolean");

      const after = await (
        await fetch(`${baseUrl}/api/monsters`, { headers: authed() })
      ).json();
      expect((after as unknown[]).length).toBe((before as unknown[]).length);
    });

    it("invalid monster → 400 with a monsters[i].field error path", async () => {
      const monsters = [
        validMonster(),
        validMonster(),
        validMonster(),
        validMonster(),
      ];
      delete (monsters[3] as Record<string, unknown>).abilityScores;

      const res = await fetch(`${baseUrl}/api/monsters/upload/validate`, {
        method: "POST",
        headers: authed(),
        body: JSON.stringify({ monsters }),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as {
        valid: boolean;
        errors: { field?: string }[];
      };
      expect(data.valid).toBe(false);
      expect(data.errors.some((e) => e.field === "monsters[3].abilityScores")).toBe(true);
    });

    it("empty array → 400", async () => {
      const res = await fetch(`${baseUrl}/api/monsters/upload/validate`, {
        method: "POST",
        headers: authed(),
        body: JSON.stringify({ monsters: [] }),
      });
      expect(res.status).toBe(400);
    });

    it("unauthenticated → 401", async () => {
      const res = await fetch(`${baseUrl}/api/monsters/upload/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monsters: [validMonster()] }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/monsters/import-schema", () => {
    it("returns fields with required flags, no calculated fields, and a valid example", async () => {
      const res = await fetch(`${baseUrl}/api/monsters/import-schema`, {
        headers: authed(),
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        fields: { name: string; required: boolean }[];
        example: unknown[];
      };
      const names = data.fields.map((f) => f.name);
      expect(names).toContain("name");
      expect(data.fields.find((f) => f.name === "name")?.required).toBe(true);
      expect(data.fields.find((f) => f.name === "description")?.required).toBe(false);
      expect(names).not.toContain("experiencePoints");
      expect(Array.isArray(data.example)).toBe(true);
      expect(data.example).toHaveLength(1);

      const validateRes = await fetch(`${baseUrl}/api/monsters/upload/validate`, {
        method: "POST",
        headers: authed(),
        body: JSON.stringify({ monsters: data.example }),
      });
      expect(validateRes.status).toBe(200);
    });
  });
});
