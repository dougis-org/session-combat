import {
  describeMonsterUploadSchema,
  buildMonsterImportExample,
  validateMonsterUploadDocument,
} from "@/lib/validation/monsterUpload";
import { rawMonsterSchema } from "@/lib/validation/monsterUploadSchema";

describe("monster upload structure document", () => {
  it("buildMonsterImportExample() validates unchanged", () => {
    const result = validateMonsterUploadDocument(buildMonsterImportExample());
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("describeMonsterUploadSchema() lists exactly the schema's fields", () => {
    const fields = describeMonsterUploadSchema();
    const fieldNames = fields.map((f) => f.name).sort();
    const schemaKeys = Object.keys(rawMonsterSchema.def.shape).sort();
    expect(fieldNames).toEqual(schemaKeys);
  });

  it("required flags match whether the schema field accepts undefined", () => {
    const fields = describeMonsterUploadSchema();
    const shape = rawMonsterSchema.def.shape as Record<
      string,
      { safeParse: (v: unknown) => { success: boolean } }
    >;
    for (const field of fields) {
      const acceptsUndefined = shape[field.name].safeParse(undefined).success;
      expect(field.required).toBe(!acceptsUndefined);
    }
  });

  it("excludes calculated fields such as experiencePoints", () => {
    const names = describeMonsterUploadSchema().map((f) => f.name);
    expect(names).not.toContain("experiencePoints");
  });
});
