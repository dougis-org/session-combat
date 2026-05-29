import '@testing-library/jest-dom';
import { webcrypto } from 'crypto';

(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

if (typeof globalThis.crypto?.randomUUID !== 'function') {
  Object.defineProperty(globalThis.crypto ?? globalThis, 'randomUUID', {
    value: webcrypto.randomUUID.bind(webcrypto),
    writable: true,
    configurable: true,
  });
}
