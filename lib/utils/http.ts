export async function safeJson(res: Response): Promise<Record<string, unknown>> {
  return res.json().catch(() => ({}));
}
