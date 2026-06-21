// Augment global jest namespace (used by tests that rely on Jest's auto-injected globals)
// Augment @jest/globals module (safety net; ESLint gate prevents its use, but types must resolve if present)
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/jest-globals';
import { webcrypto } from 'crypto';

(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

if (typeof globalThis.crypto?.randomUUID !== 'function') {
  Object.defineProperty(globalThis.crypto ?? globalThis, 'randomUUID', {
    value: webcrypto.randomUUID.bind(webcrypto),
    writable: true,
    configurable: true,
  });
}

if (typeof HTMLDialogElement !== 'undefined') {
  if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  }
  if (typeof HTMLDialogElement.prototype.close !== 'function') {
    HTMLDialogElement.prototype.close = function () { this.open = false; };
  }
}
