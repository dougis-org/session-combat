import { clientStorage } from '@/lib/clientStorage';

// Mock localStorage for Node.js test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('clientStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('clear removes sessionData key', () => {
    localStorage.setItem('sessionData', JSON.stringify({ a: 1 }));
    expect(localStorage.getItem('sessionData')).not.toBeNull();

    clientStorage.clear();

    expect(localStorage.getItem('sessionData')).toBeNull();
  });
});
