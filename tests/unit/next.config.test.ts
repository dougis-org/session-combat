describe("next.config redirects", () => {
  test("redirects fly.dev host traffic to dnd.dougis.com preserving path", async () => {
    const nextConfig = require("../../next.config.js");
    const redirects = await nextConfig.redirects();

    expect(redirects).toContainEqual({
      source: "/:path*",
      has: [{ type: "host", value: "session-combat.fly.dev" }],
      destination: "https://dnd.dougis.com/:path*",
      permanent: true,
    });
  });
});
