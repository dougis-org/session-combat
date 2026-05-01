import { Open5ECreature, Open5ESpell } from "@/lib/import/open5eAdapter";

const OPEN5E_API_BASE = "https://api.open5e.com/v2";

describe("Open5E API connectivity", () => {
  it("creatures endpoint is reachable and returns data", async () => {
    const response = await fetch(`${OPEN5E_API_BASE}/creatures/?page=1`);

    expect(response.ok).toBe(true);

    const data = await response.json();

    expect(data).toHaveProperty("results");
    expect(data).toHaveProperty("count");
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  });

  it("spells endpoint is reachable and returns data", async () => {
    const response = await fetch(`${OPEN5E_API_BASE}/spells/?page=1`);

    expect(response.ok).toBe(true);

    const data = await response.json();

    expect(data).toHaveProperty("results");
    expect(data).toHaveProperty("count");
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  });
});

describe("Open5E API response shape (documenting actual API)", () => {
  it("creatures API uses 'key' not 'slug' and has nested structure", async () => {
    const response = await fetch(`${OPEN5E_API_BASE}/creatures/?page=1`);
    const data = await response.json();

    if (data.results.length === 0) return;

    const creature = data.results[0];

    expect(creature).toHaveProperty("key");
    expect(creature).not.toHaveProperty("slug");
    expect(creature).toHaveProperty("name");
    expect(creature).toHaveProperty("size");
    expect(creature).toHaveProperty("type");
    expect(creature).toHaveProperty("challenge_rating");
    expect(creature).toHaveProperty("armor_class");
    expect(creature).toHaveProperty("hit_points");
    expect(creature).toHaveProperty("actions");
    expect(creature).toHaveProperty("traits");

    expect(typeof creature.key).toBe("string");
    expect(typeof creature.name).toBe("string");
    expect(Array.isArray(creature.actions)).toBe(true);
    expect(Array.isArray(creature.traits)).toBe(true);
  });

  it("spells API uses 'key' not 'slug' and has nested structure", async () => {
    const response = await fetch(`${OPEN5E_API_BASE}/spells/?page=1`);
    const data = await response.json();

    if (data.results.length === 0) return;

    const spell = data.results[0];

    expect(spell).toHaveProperty("key");
    expect(spell).not.toHaveProperty("slug");
    expect(spell).toHaveProperty("name");
    expect(spell).toHaveProperty("level");
    expect(spell).toHaveProperty("school");
    expect(spell).toHaveProperty("casting_time");
    expect(spell).toHaveProperty("range");
    expect(spell).toHaveProperty("duration");
    expect(spell).toHaveProperty("concentration");
    expect(spell).toHaveProperty("desc");

    expect(typeof spell.key).toBe("string");
    expect(typeof spell.name).toBe("string");
    expect(typeof spell.level).toBe("number");
    expect(typeof spell.concentration).toBe("boolean");
    expect(typeof spell.desc).toBe("string");
  });
});