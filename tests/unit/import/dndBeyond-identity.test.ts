import {
  parseDndBeyondCharacterUrl,
  requireCharacterIdentity,
} from "@/lib/import/dndBeyond-identity";

describe("dndBeyond-identity", () => {
  describe("parseDndBeyondCharacterUrl", () => {
    test("rejects a non-URL string", () => {
      expect(() => parseDndBeyondCharacterUrl("not-a-url")).toThrow(
        /enter a valid d&d beyond character url/i,
      );
    });

    test("rejects unsupported D&D Beyond hosts", () => {
      expect(() =>
        parseDndBeyondCharacterUrl(
          "https://example.com/characters/91913267/BRdgB3",
        ),
      ).toThrow(/canonical public D&D Beyond character URLs/i);
    });

    test("parses a publicly available D&D Beyond character URL with share code", () => {
      expect(
        parseDndBeyondCharacterUrl(
          "https://www.dndbeyond.com/characters/91913267/BRdgB3",
        ),
      ).toEqual({
        characterId: "91913267",
        shareCode: "BRdgB3",
        normalizedUrl: "https://www.dndbeyond.com/characters/91913267/BRdgB3",
      });
    });

    test("accepts a publicly available D&D Beyond character URL without a share code", () => {
      expect(
        parseDndBeyondCharacterUrl(
          "https://www.dndbeyond.com/characters/91913267",
        ),
      ).toEqual({
        characterId: "91913267",
        shareCode: undefined,
        normalizedUrl: "https://www.dndbeyond.com/characters/91913267",
      });
    });

    test("trims whitespace around a publicly available D&D Beyond character URL", () => {
      expect(
        parseDndBeyondCharacterUrl(
          "  https://www.dndbeyond.com/characters/91913267/BRdgB3  ",
        ),
      ).toEqual({
        characterId: "91913267",
        shareCode: "BRdgB3",
        normalizedUrl: "https://www.dndbeyond.com/characters/91913267/BRdgB3",
      });
    });
  });

  describe("requireCharacterIdentity", () => {
    test("throws when character id is missing", () => {
      expect(() =>
        requireCharacterIdentity({ id: undefined, name: "Some Name" }),
      ).toThrow(/missing an ID/i);
    });

    test("throws when character name is empty", () => {
      expect(() =>
        requireCharacterIdentity({ id: 12345, name: "" }),
      ).toThrow(/missing a name/i);
    });
  });
});
