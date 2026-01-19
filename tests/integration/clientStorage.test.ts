import { clientStorage } from '@/lib/clientStorage';

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