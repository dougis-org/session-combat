export function generateId(prefix: string = ''): string {
  // Simple, collision-resistant ID using time + random suffix
  // Format: {prefix}{timestamp}-{rand}
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 11); // 9 chars
  return `${prefix}${ts}-${rand}`;
}
