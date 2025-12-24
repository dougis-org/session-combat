import { validatePasswordForClient } from '@/lib/validation/password';
import cases from '../data/password-cases.json';

describe('validatePasswordForClient', () => {
  cases.forEach((c: any) => {
    test(`${c.name} (${c.password}) -> valid=${c.valid}`, () => {
      const res = validatePasswordForClient(c.password);
      expect(res.valid).toBe(c.valid);
      if (!c.valid) {
        // ensure expected errors are present
        c.errors.forEach((err: string) => {
          expect(res.errors).toEqual(expect.arrayContaining([err]));
        });
      } else {
        expect(res.errors).toHaveLength(0);
      }
    });
  });
});
