import { NextRequest } from 'next/server';

export async function safeJson(res: Response): Promise<Record<string, unknown>> {
  return res.json().catch(() => ({}));
}

export function extractIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
