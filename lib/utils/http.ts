import type { NextRequest } from 'next/server';

export async function safeJson(res: Response): Promise<Record<string, unknown>> {
  return res.json().catch(() => ({}));
}

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /^[0-9a-f:]+$/i;

function isValidIp(value: string): boolean {
  return IPV4_RE.test(value) || IPV6_RE.test(value);
}

export function extractIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const candidate = forwarded.split(',')[0].trim();
    if (isValidIp(candidate)) return candidate;
  }
  const realIp = request.headers.get('x-real-ip')?.trim() ?? '';
  if (realIp && isValidIp(realIp)) return realIp;
  return 'unknown';
}
