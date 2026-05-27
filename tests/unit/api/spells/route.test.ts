/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/spells/route";
import { storage } from "@/lib/storage";
import { requireAdmin } from "@/lib/api-helpers";
import { SpellTemplate } from "@/lib/types";
import { makeRouteRequest, mockUnauthorized } from "@/tests/unit/helpers/route.test.helpers";

jest.mock("@/lib/storage", () => ({
  storage: {
    loadSpells: jest.fn(),
    saveSpellTemplate: jest.fn(),
  },
}));
jest.mock("@/lib/api-helpers", () => ({ requireAdmin: jest.fn() }));

const mockedStorage = jest.mocked(storage);
const mockedRequireAdmin = jest.mocked(requireAdmin);

const BASE_BODY = {
  name: "Fireball",
  level: 3,
  concentration: false,
  school: "Evocation",
  description: "A bright streak flashes from your pointing finger",
  castingTime: "1 action",
  range: "120 feet",
  duration: "Instantaneous",
  components: { verbal: true, somatic: true, material: true },
  attackRoll: false,
};

describe("GET /api/spells", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns all spells", async () => {
    const spells: SpellTemplate[] = [
      {
        id: "1",
        userId: "user1",
        name: "Fireball",
        level: 3,
        concentration: false,
        school: "Evocation",
        description: "",
        castingTime: "1 action",
        range: "150 feet",
        duration: "Instantaneous",
        components: { verbal: true, somatic: true, material: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        userId: "user1",
        name: "Magic Missile",
        level: 1,
        concentration: false,
        school: "Evocation",
        description: "",
        castingTime: "1 action",
        range: "60 feet",
        duration: "Instantaneous",
        components: { verbal: true, somatic: true, material: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockedStorage.loadSpells.mockResolvedValue(spells);

    const req = makeRouteRequest("http://localhost/api/spells", "GET");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0]).toMatchObject({
      id: "1",
      name: "Fireball",
      level: 3,
      concentration: false,
      school: "Evocation",
      components: { verbal: true, somatic: true, material: false },
    });
    expect(body[1]).toMatchObject({
      id: "2",
      name: "Magic Missile",
      level: 1,
      concentration: false,
      school: "Evocation",
    });
  });

  it("filters to concentration spells when concentration=true", async () => {
    const allSpells: SpellTemplate[] = [
      {
        id: "1",
        userId: "user1",
        name: "Fireball",
        level: 3,
        concentration: false,
        school: "Evocation",
        description: "",
        castingTime: "1 action",
        range: "150 feet",
        duration: "Instantaneous",
        components: { verbal: true, somatic: true, material: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        userId: "user1",
        name: "Hold Person",
        level: 2,
        concentration: true,
        school: "Enchantment",
        description: "",
        castingTime: "1 action",
        range: "60 feet",
        duration: "Concentration, up to 1 minute",
        components: { verbal: true, somatic: true, material: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockedStorage.loadSpells.mockImplementation((userId?: string, conc?: boolean): Promise<SpellTemplate[]> => {
      if (conc === true) return Promise.resolve([allSpells[1]]);
      return Promise.resolve(allSpells);
    });

    const req = makeRouteRequest("http://localhost/api/spells?concentration=true", "GET");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Hold Person");
  });

  it("returns 500 when loadSpells throws", async () => {
    mockedStorage.loadSpells.mockRejectedValue(new Error("connection refused"));

    const req = makeRouteRequest("http://localhost/api/spells", "GET");
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to load spells");
  });
});

describe("POST /api/spells", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequireAdmin.mockReturnValue(Promise.resolve(null));
    mockedStorage.saveSpellTemplate.mockResolvedValue(undefined);
  });

  it("creates a spell when admin", async () => {
    const req = makeRouteRequest("http://localhost/api/spells", "POST", BASE_BODY);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe(BASE_BODY.name);
    expect(body.source).toBe("open5e");
    expect(body.isGlobal).toBe(true);
  });

  it("returns 401 when not authenticated", async () => {
    mockUnauthorized(mockedRequireAdmin);

    const req = makeRouteRequest("http://localhost/api/spells", "POST", BASE_BODY);
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid spell name", async () => {
    const req = makeRouteRequest("http://localhost/api/spells", "POST", { ...BASE_BODY, name: "" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Spell name is required");
  });

  it("returns 400 for invalid spell level", async () => {
    const req = makeRouteRequest("http://localhost/api/spells", "POST", { ...BASE_BODY, level: -1 });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Level must be 0-9");
  });

  it("returns 400 for invalid spell school", async () => {
    const req = makeRouteRequest("http://localhost/api/spells", "POST", { ...BASE_BODY, school: "NotASchool" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid spell school");
  });

  it("returns 500 when storage throws", async () => {
    mockedStorage.saveSpellTemplate.mockRejectedValue(new Error("connection refused"));

    const req = makeRouteRequest("http://localhost/api/spells", "POST", BASE_BODY);
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to create spell");
  });
});