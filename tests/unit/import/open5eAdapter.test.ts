import { isAllowedUrl } from "@/lib/import/open5eAdapter";

describe("open5eAdapter SSRF protection", () => {
  describe("isAllowedUrl", () => {
    const ALLOWED_CASES: Array<{ url: string }> = [
      { url: "https://api.open5e.com/v2/creatures/" },
      { url: "https://api.open5e.com/v2/creatures/?page=1" },
      { url: "https://api.open5e.com/v2/spells/" },
      { url: "https://api.open5e.com/v2/spells/?page=2" },
      { url: "http://api.open5e.com/v2/test" },
    ];

    const DISALLOWED_CASES: Array<{ url: string; description: string }> = [
      { url: "https://evil.com/api.open5e.com", description: "different domain" },
      { url: "https://api.open5e.com.evil.com/v2/creatures", description: "dot in subdomain" },
      { url: "https://api..open5e.com/v2/creatures", description: "double dot" },
      { url: "https://not-api.open5e.com/v2/creatures", description: "modified subdomain" },
      { url: "https://api-open5e.com/v2/creatures", description: "hyphen in subdomain" },
      { url: "ftp://api.open5e.com/v2/creatures", description: "wrong protocol" },
      { url: "file:///etc/passwd", description: "local file" },
      { url: "http://localhost:8080/api", description: "localhost" },
      { url: "http://127.0.0.1/api", description: "IP address" },
    ];

    test.each(ALLOWED_CASES)("allows '$url'", ({ url }) => {
      expect(isAllowedUrl(url)).toBe(true);
    });

    test.each(DISALLOWED_CASES)("rejects '$url' ($description)", ({ url }) => {
      expect(isAllowedUrl(url)).toBe(false);
    });

    it("rejects invalid URLs", () => {
      expect(isAllowedUrl("not-a-url")).toBe(false);
      expect(isAllowedUrl("")).toBe(false);
      expect(isAllowedUrl("://")).toBe(false);
    });

    it("rejects URLs with special characters", () => {
      expect(isAllowedUrl("https://api.open5e.com@evil.com/")).toBe(false);
      expect(isAllowedUrl("https://api.open5e.com#@evil.com/")).toBe(false);
    });
  });
});