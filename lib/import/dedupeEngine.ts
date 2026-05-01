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
): Promise<boolean> {
  if (collection === "spells") {
    return !(await storage.spellExistsByNameAndSource(name, source));
  }
  if (collection === "monsters") {
    return !(await storage.monsterExistsByNameAndSource(name, source));
  }
  return true;
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
    return { inserted: false, skipped: false, error: true };
  }

  const exists = await shouldImport(
    collection,
    result.entity.name,
    result.entity.source || ""
  );
  if (!exists) {
    return { inserted: false, skipped: true, error: false };
  }

  await save(result.entity);
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
  return runImport(
    client.getAllMonsters() as AsyncGenerator<Open5ECreature | Open5ESpell>,
    "monsters",
    (raw) => {
      const r = transformMonster(raw as Open5ECreature);
      return { entity: r.monster as unknown as MonsterTemplate, valid: r.valid, errors: r.errors };
    },
    (monster) => storage.saveMonsterTemplate(monster)
  );
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
