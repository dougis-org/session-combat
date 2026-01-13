/**
 * Cross-environment UUID generation utility
 * Works in both Node.js and browser environments
 */

export function generateUUID(): string {
  // Try Node.js crypto first
  try {
    const crypto = require('crypto');
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {
    // Not available in browser
  }

  // Fallback to crypto.getRandomValues (browser API)
  if (typeof global !== 'undefined' && global.crypto && global.crypto.getRandomValues) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Fallback to simple math.random() based UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
