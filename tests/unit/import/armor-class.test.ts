import { capDexterityByArmorType } from "@/lib/import/armor-class";

describe("armor-class", () => {
  describe("capDexterityByArmorType", () => {
    it("Given: dex +3, max +2; When: cap applied; Then: returns 2 (capped by max)", () => {
      const result = capDexterityByArmorType(3, 2);
      expect(result).toBe(2);
    });

    it("Given: dex +3, no cap (null); When: cap applied; Then: returns 3 (no cap)", () => {
      const result = capDexterityByArmorType(3, null);
      expect(result).toBe(3);
    });

    it("Given: dex +1, max +2; When: cap applied; Then: returns 1 (below limit)", () => {
      const result = capDexterityByArmorType(1, 2);
      expect(result).toBe(1);
    });

    it("Given: dex -1 (penalty), max +2; When: cap applied; Then: returns -1 (negative penalties uncapped)", () => {
      const result = capDexterityByArmorType(-1, 2);
      expect(result).toBe(-1);
    });

    it("Given: dex +5, max 0 (heavy armor); When: cap applied; Then: returns 0", () => {
      const result = capDexterityByArmorType(5, 0);
      expect(result).toBe(0);
    });

    it("Given: dex +3, max undefined; When: cap applied; Then: returns 3 (undefined max)", () => {
      const result = capDexterityByArmorType(3, undefined);
      expect(result).toBe(3);
    });

    it("Given: dex +5, max -2; When: cap applied; Then: returns -2 (max below dex)", () => {
      const result = capDexterityByArmorType(5, -2);
      expect(result).toBe(-2);
    });

    it("Given: dex 0, max 0; When: cap applied; Then: returns 0", () => {
      const result = capDexterityByArmorType(0, 0);
      expect(result).toBe(0);
    });
  });
});
