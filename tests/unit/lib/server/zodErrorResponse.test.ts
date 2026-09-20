/**
 * @jest-environment node
 */
import { z } from "zod";
import { zodErrorResponse } from "@/lib/server/zodErrorResponse";

function parseFail<T>(schema: z.ZodSchema<T>, value: unknown): z.ZodError {
  const result = schema.safeParse(value);
  if (result.success) throw new Error("expected parse failure");
  return result.error;
}

describe("zodErrorResponse", () => {
  it("prefixes the message with the dot-joined field path", async () => {
    const schema = z.object({ datePlayed: z.coerce.date() });
    const error = parseFail(schema, { datePlayed: "not-a-date" });
    const res = zodErrorResponse(error, "Invalid payload");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/^datePlayed: /);
  });

  it("dot-joins a nested path (e.g. events.0.description)", async () => {
    const schema = z.object({
      events: z.array(z.object({ description: z.string().min(1) })),
    });
    const error = parseFail(schema, { events: [{ description: "" }] });
    const res = zodErrorResponse(error, "Invalid payload");
    const body = await res.json();
    expect(body.error).toMatch(/^events\.0\.description: /);
  });

  it("falls back to the provided message when the first issue has no path", async () => {
    const schema = z.string();
    const error = parseFail(schema, 42);
    const res = zodErrorResponse(error, "fallback message");
    const body = await res.json();
    expect(body.error).toBe("fallback message");
  });

  it("always returns status 400", async () => {
    const schema = z.object({ a: z.string() });
    const error = parseFail(schema, {});
    const res = zodErrorResponse(error, "x");
    expect(res.status).toBe(400);
  });
});
