/**
 * Manual, on-demand check that the live Open5E API still satisfies the
 * `Open5ECreature`/`Open5ESpell` shape our import code depends on.
 *
 * Not run by Jest or CI (see the mock-open5e-api-shape-test openspec change).
 * Run with: npm run check:open5e-api-shape
 *
 * Note: the raw Open5E API uses `key`, not `slug`, as the stable identifier
 * field — `Open5EClient` already normalizes/types around that, so this
 * script asserts against the adapter-parsed shape rather than raw JSON.
 */
import { Open5EClient } from "../import/open5eAdapter";
import type { Open5ECreature, Open5ESpell } from "../import/open5eAdapter";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Shape check failed: ${message}`);
  }
}

function assertNamedObject(value: unknown, field: string): void {
  assert(
    typeof value === "object" && value !== null && typeof (value as { key?: unknown }).key === "string",
    `${field} must be an object with a string 'key'`
  );
}

function checkCreatureShape(creature: Open5ECreature): void {
  assert(typeof creature.key === "string", "creature.key must be a string");
  assert(!("slug" in creature), "creature must not have a 'slug' field (raw API uses 'key')");
  assert(typeof creature.name === "string", "creature.name must be a string");
  assertNamedObject(creature.size, "creature.size");
  assertNamedObject(creature.type, "creature.type");
  assert(
    typeof creature.challenge_rating === "number" ||
      typeof creature.challenge_rating === "string",
    "creature.challenge_rating must be a number or string"
  );
  assert(
    typeof creature.armor_class === "number",
    "creature.armor_class must be a number"
  );
  assert(
    typeof creature.hit_points === "number",
    "creature.hit_points must be a number"
  );
  assert(
    typeof creature.ability_scores === "object" && creature.ability_scores !== null,
    "creature.ability_scores must be an object"
  );
  assert(
    typeof creature.speed === "object" && creature.speed !== null,
    "creature.speed must be an object"
  );
  assert(Array.isArray(creature.actions), "creature.actions must be an array");
  if (creature.traits !== undefined) {
    assert(Array.isArray(creature.traits), "creature.traits must be an array when present");
  }
}

function checkSpellShape(spell: Open5ESpell): void {
  assert(typeof spell.key === "string", "spell.key must be a string");
  assert(!("slug" in spell), "spell must not have a 'slug' field (raw API uses 'key')");
  assert(typeof spell.name === "string", "spell.name must be a string");
  assert(typeof spell.level === "number", "spell.level must be a number");
  assertNamedObject(spell.school, "spell.school");
  assert(typeof spell.casting_time === "string", "spell.casting_time must be a string");
  assert(typeof spell.range === "number", "spell.range must be a number");
  assert(typeof spell.duration === "string", "spell.duration must be a string");
  assert(
    typeof spell.concentration === "boolean",
    "spell.concentration must be a boolean"
  );
  assert(typeof spell.desc === "string", "spell.desc must be a string");
}

export async function checkOpen5eApiShape(): Promise<void> {
  const client = new Open5EClient();

  const creatures = await client.fetchMonsters(1);
  assert(creatures.results.length > 0, "creatures response had no results");
  for (const creature of creatures.results) {
    checkCreatureShape(creature);
  }
  console.log(`Creatures OK (checked ${creatures.results.length} results)`);

  const spells = await client.fetchSpells(1);
  assert(spells.results.length > 0, "spells response had no results");
  for (const spell of spells.results) {
    checkSpellShape(spell);
  }
  console.log(`Spells OK (checked ${spells.results.length} results)`);

  console.log("Open5E API shape check passed.");
}

export async function runCli(): Promise<void> {
  await checkOpen5eApiShape();
  process.exit(0);
}

export function handleCliError(error: unknown): never {
  console.error("Open5E API shape check failed:", error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
}

/* istanbul ignore next */
if (require.main === module) {
  runCli().catch(handleCliError);
}
