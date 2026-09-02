import { storage } from "@/lib/storage";
import {
  Open5ECreature,
  Open5ESpell,
  IOpen5EClient,
  Open5EClient,
} from "./open5eAdapter";
import { transformMonster } from "./transformMonster";
import { transformSpell } from "./transformSpell";
import { MonsterTemplate, SpellTemplate } from "@/lib/types";

export type Collection = "monsters" | "spells";

export interface ImportResult {
  inserted: number;
  skipped: number;
  errors: number;
}

export async function shouldImport(
  collection: Collection,
  name: string,
  source: string
): Promise<{ should: boolean; existingId?: string }> {
  if (collection === "spells") {
    const exists = await storage.spellExistsByNameAndSource(name, source);
    return { should: !exists };
  }
  if (collection === "monsters") {
    const existing = await storage.findMonsterByNameAndSource(name, source);
    return { should: !existing, existingId: existing?.id };
  }
  return { should: true };
}

type TransformFn<T> = (raw: Open5ECreature | Open5ESpell) => { entity: T; valid: boolean; errors: string[] };

async function importSingle<T extends MonsterTemplate | SpellTemplate>(
  raw: Open5ECreature | Open5ESpell,
  collection: Collection,
  transform: TransformFn<T>,
  save: (entity: T) => Promise<void>
): Promise<{ inserted: boolean; skipped: boolean; error: boolean }> {
  const result = transform(raw);
  if (!result.valid) {
    console.warn(`Invalid ${collection} skipped:`, result.errors);
    return { inserted: false, skipped: false, error: true };
  }

  // A thrown existence check (e.g. storage.spellExistsByNameAndSource now
  // rejects with StorageError on a DB failure instead of swallowing to
  // `false`) must fail this item cleanly — never fall through and insert it as
  // though it were confirmed not-a-duplicate.
  let should: boolean;
  try {
    ({ should } = await shouldImport(
      collection,
      result.entity.name,
      result.entity.source || ""
    ));
  } catch (error) {
    console.error(`Dedupe check failed for ${collection} "${result.entity.name}":`, error);
    return { inserted: false, skipped: false, error: true };
  }
  if (!should) {
    return { inserted: false, skipped: true, error: false };
  }

  await save(result.entity);
  return { inserted: true, skipped: false, error: false };
}

async function importMonsterSingle(
  raw: Open5ECreature
): Promise<{ inserted: boolean; skipped: boolean; error: boolean }> {
  // Only run the duplicate lookup for a real, non-blank name (equivalent to
  // the prior `if (raw.name)` but type-safe about the value handed to Mongo).
  // A nameless creature falls through to transformMonster, which rejects it.
  if (typeof raw.name === "string" && raw.name.trim() !== "") {
    try {
      const { should } = await shouldImport("monsters", raw.name, "open5e");
      if (!should) {
        return { inserted: false, skipped: true, error: false };
      }
    } catch (error) {
      // A thrown existence check must fail this item cleanly rather than
      // falling through and inserting a possible duplicate.
      console.error(`Dedupe check failed for monster "${raw.name}":`, error);
      return { inserted: false, skipped: false, error: true };
    }
  }

  const { monster, valid, errors } = transformMonster(raw);
  if (!valid) {
    console.warn("Invalid monster skipped:", errors);
    return { inserted: false, skipped: false, error: true };
  }

  await storage.saveMonsterTemplate(monster);
  return { inserted: true, skipped: false, error: false };
}

function accumulate(
  acc: ImportResult,
  { inserted, skipped, error }: { inserted: boolean; skipped: boolean; error: boolean }
): void {
  if (inserted) acc.inserted++;
  else if (skipped) acc.skipped++;
  else if (error) acc.errors++;
}

async function runImport<T extends MonsterTemplate | SpellTemplate>(
  items: AsyncGenerator<Open5ECreature | Open5ESpell>,
  collection: Collection,
  transform: TransformFn<T>,
  save: (entity: T) => Promise<void>
): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, skipped: 0, errors: 0 };

  for await (const raw of items) {
    accumulate(result, await importSingle(raw, collection, transform, save));
  }

  return result;
}

export async function importMonstersFromOpen5E(
  client: IOpen5EClient = new Open5EClient()
): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, skipped: 0, errors: 0 };

  for await (const raw of client.getAllMonsters()) {
    accumulate(result, await importMonsterSingle(raw));
  }

  return result;
}

export async function importSpellsFromOpen5E(
  client: IOpen5EClient = new Open5EClient()
): Promise<ImportResult> {
  return runImport(
    client.getAllSpells() as AsyncGenerator<Open5ECreature | Open5ESpell>,
    "spells",
    (raw) => {
      const r = transformSpell(raw as Open5ESpell);
      return { entity: r.spell as unknown as SpellTemplate, valid: r.valid, errors: r.errors };
    },
    (spell) => storage.saveSpellTemplate(spell)
  );
}
