import { validateString } from "@/lib/validation/core";

describe("validateString maxLength", () => {
  it("accepts a value exactly at maxLength", () => {
    const result = validateString("12345", "field", { maxLength: 5 });
    expect(result.valid).toBe(true);
  });

  it("rejects a value exceeding maxLength", () => {
    const result = validateString("123456", "field", { maxLength: 5 });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.message).toBe("field must be at most 5 characters");
    }
  });

  it("checks maxLength against the trimmed value", () => {
    const result = validateString("  12345  ", "field", { maxLength: 5 });
    expect(result.valid).toBe(true);
  });

  it("does not enforce a limit when maxLength is omitted", () => {
    const result = validateString("a".repeat(10000), "field", {});
    expect(result.valid).toBe(true);
  });
});
