export function makeAuthedHeaders(cookie: string): Record<string, string> {
  return { "Content-Type": "application/json", Cookie: cookie };
}
