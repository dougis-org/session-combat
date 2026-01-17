/**
 * Cross-environment UUID generation utility
 * Works in both Node.js and browser environments
 */

function mathRandomUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateUUID(): string {
  // Try Node.js crypto first (wrapped in try/catch to avoid bundler/runtime issues)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    if (crypto && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (e) {
    // Not available in browser
  }

  // Fallback to Web Crypto API
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto && typeof (globalThis as any).crypto.getRandomValues === 'function') {
    try {
      const arr = new Uint8Array(16);
      (globalThis as any).crypto.getRandomValues(arr);
      // Per RFC4122 v4 formatting
      arr[6] = (arr[6] & 0x0f) | 0x40;
      arr[8] = (arr[8] & 0x3f) | 0x80;
      const hex = Array.from(arr).map((b: number) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.substr(0,8)}-${hex.substr(8,4)}-${hex.substr(12,4)}-${hex.substr(16,4)}-${hex.substr(20,12)}`;
    } catch (e) {
      // fall through to math-based UUID
    }
  }

  // Last resort: math.random based UUID
  return mathRandomUuid();
}
