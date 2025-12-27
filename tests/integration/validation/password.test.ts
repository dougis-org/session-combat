import { validatePasswordForClient } from '@/lib/validation/password';
import * as fs from 'fs';
import * as path from 'path';

// Load parameterized test data
const testDataPath = path.join(
  __dirname,
  '..',
  '..',
  'unit',
  'data',
  'password-cases.json'
);
const passwordTestCases = JSON.parse(
  fs.readFileSync(testDataPath, 'utf-8')
);

describe('validatePasswordForClient', () => {
  describe('parameterized password validation', () => {
    test.each(passwordTestCases)(
      '$description',
      ({ password, expectedValid, expectedErrors }) => {
        const result = validatePasswordForClient(password);

        // Verify valid/invalid status
        expect(result.valid).toBe(expectedValid);

        // Verify error count matches
        expect(result.errors).toHaveLength(expectedErrors.length);

        // Verify each expected error is present
        expectedErrors.forEach((expectedError) => {
          expect(result.errors).toContain(expectedError);
        });
      }
    );
  });

  // Additional edge case: verify error message consistency
  describe('error message consistency', () => {
    it('should use consistent error message format', () => {
      const result = validatePasswordForClient('weak');
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/Password must/i),
        ])
      );
    });

    it('should not include technical jargon in error messages', () => {
      const result = validatePasswordForClient('invalid');
      result.errors.forEach((error) => {
        expect(error).not.toMatch(/regex|pattern|match/i);
      });
    });
  });
});
