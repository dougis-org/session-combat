import fetch from "node-fetch";
import { createTestUser } from "@/tests/integration/auth.test.helpers";

export async function registerTestUser(
  baseUrl: string,
  prefix = "user",
): Promise<{ email: string; password: string; cookie: string; userId: string }> {
  const { email, password } = createTestUser(prefix);

  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (response.status !== 201) {
    throw new Error(
      `Registration failed with status ${response.status}: ${await response.text()}`,
    );
  }

  const data = (await response.json()) as { userId: string; email: string };

  const rawHeaders = (response.headers as unknown as {
    raw?: () => Record<string, string[]>;
  }).raw?.();
  const setCookieHeaders = rawHeaders?.["set-cookie"];

  let cookieHeader: string;
  if (Array.isArray(setCookieHeaders) && setCookieHeaders.length > 0) {
    cookieHeader = setCookieHeaders.map((c) => c.split(";")[0].trim()).join("; ");
  } else {
    const single = response.headers.get("set-cookie");
    if (!single) throw new Error("No Set-Cookie header in register response");
    cookieHeader = single.split(";")[0].trim();
  }

  return { email, password, cookie: cookieHeader, userId: data.userId };
}
