import { webcrypto } from 'crypto';

if (typeof globalThis.crypto?.randomUUID !== 'function') {
  Object.defineProperty(globalThis.crypto ?? globalThis, 'randomUUID', {
    value: webcrypto.randomUUID.bind(webcrypto),
    writable: true,
    configurable: true,
  });
}
