import type { NextRequest } from 'next/server';

export async function safeJson(res: Response): Promise<Record<string, unknown>> {
  return res.json().catch(() => ({}));
}

function isValidIp(value: string): boolean {
  const ipv4Parts = value.split('.');
  if (ipv4Parts.length === 4) {
    return ipv4Parts.every(p => /^\d{1,3}$/.test(p) && Number(p) <= 255);
  }
  if (!value.includes(':') || value.includes(':::')) return false;
  if ((value.match(/::/g) ?? []).length > 1) return false;
  const segments = value.split(':');
  if (segments.length < 3 || segments.length > 8) return false;
  return segments.every(seg => /^[0-9a-f]{0,4}$/i.test(seg));
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
