import * as fs from 'fs';
import * as path from 'path';
import {
  rollSubmissionSchema,
  MAX_FORMULA_LENGTH,
  MAX_DICE_IN_ROLL,
  MAX_DIE_VALUE,
  MAX_TOTAL_MAGNITUDE,
  MAX_LABEL_LENGTH,
} from '@/lib/validation/rollSubmission';
import { MAX_PER_DIE, DIE_SIDES, MAX_MODIFIER, PERCENTILE_FORMULA } from '@/lib/utils/dice';

const SUPPORTED_SIDES = [4, 6, 8, 10, 12, 20, 100];

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    formula: '3d6 + 2',
    rolls: [4, 2, 5],
    total: 13,
    visibility: { scope: 'group' },
    ...overrides,
  };
}

describe('rollSubmission bounds constants', () => {
  it('T1.1 MAX_DICE_IN_ROLL >= MAX_PER_DIE * DIE_SIDES.length', () => {
    expect(MAX_DICE_IN_ROLL).toBeGreaterThanOrEqual(MAX_PER_DIE * DIE_SIDES.length);
  });

  it('T1.2 MAX_DIE_VALUE >= Math.max(...SUPPORTED_SIDES)', () => {
    expect(MAX_DIE_VALUE).toBeGreaterThanOrEqual(Math.max(...SUPPORTED_SIDES));
  });

  it('T1.3 MAX_TOTAL_MAGNITUDE >= MAX_DICE_IN_ROLL * MAX_DIE_VALUE + MAX_MODIFIER', () => {
    expect(MAX_TOTAL_MAGNITUDE).toBeGreaterThanOrEqual(
      MAX_DICE_IN_ROLL * MAX_DIE_VALUE + MAX_MODIFIER
    );
  });

  it('T1.4 MAX_LABEL_LENGTH === 128', () => {
    expect(MAX_LABEL_LENGTH).toBe(128);
  });

  it('T1.5 MAX_FORMULA_LENGTH accepts a fully-expanded max pool formula string', () => {
    const groups = DIE_SIDES.map((sides) => `${MAX_PER_DIE}d${sides}`).join('+');
    const formula = `${groups}+${MAX_MODIFIER}`;
    expect(formula.length).toBeLessThanOrEqual(MAX_FORMULA_LENGTH);
  });

  it('T1.21 module imports only zod and @/lib/utils/dice', () => {
    const filePath = path.join(process.cwd(), 'lib/validation/rollSubmission.ts');
    const source = fs.readFileSync(filePath, 'utf8');
    const importLines = source.match(/^import .*from ['"].*['"];?$/gm) ?? [];
    for (const line of importLines) {
      const match = line.match(/from ['"](.*)['"]/);
      const specifier = match?.[1];
      expect(['zod', '@/lib/utils/dice']).toContain(specifier);
    }
  });
});

describe('rollSubmissionSchema — accepts', () => {
  it('T1.6 a standard pool roll', () => {
    const result = rollSubmissionSchema.safeParse(validBody());
    expect(result.success).toBe(true);
  });

  it('T1.7 a d% roll', () => {
    const result = rollSubmissionSchema.safeParse(
      validBody({ formula: PERCENTILE_FORMULA, rolls: [87], total: 87, visibility: { scope: 'dm-only' } })
    );
    expect(result.success).toBe(true);
  });

  it('T1.8 the 120-dice + 999-modifier max pool', () => {
    const rolls = Array.from({ length: MAX_PER_DIE * DIE_SIDES.length }, () => 20);
    const result = rollSubmissionSchema.safeParse(
      validBody({
        formula: `${MAX_PER_DIE}d20 x 6 + ${MAX_MODIFIER}`,
        rolls,
        total: rolls.reduce((a, b) => a + b, 0) + MAX_MODIFIER,
      })
    );
    expect(result.success).toBe(true);
  });

  it('T1.9 an empty rolls array', () => {
    const result = rollSubmissionSchema.safeParse(validBody({ rolls: [], total: 0 }));
    expect(result.success).toBe(true);
  });

  it('T1.10 a roll whose total != sum(rolls)', () => {
    const result = rollSubmissionSchema.safeParse(validBody({ total: 999 }));
    expect(result.success).toBe(true);
  });

  it('T1.11 absent, empty, and whitespace-only label', () => {
    expect(rollSubmissionSchema.safeParse(validBody()).success).toBe(true);
    expect(rollSubmissionSchema.safeParse(validBody({ label: '' })).success).toBe(true);
    expect(rollSubmissionSchema.safeParse(validBody({ label: '   ' })).success).toBe(true);
  });

  it('T1.12 a 128-char label, rejects a 129-char label', () => {
    const label128 = 'x'.repeat(128);
    const label129 = 'x'.repeat(129);
    expect(rollSubmissionSchema.safeParse(validBody({ label: label128 })).success).toBe(true);
    expect(rollSubmissionSchema.safeParse(validBody({ label: label129 })).success).toBe(false);
  });

  it('T1.19 accepts a large negative total within magnitude', () => {
    const result = rollSubmissionSchema.safeParse(validBody({ total: -MAX_TOTAL_MAGNITUDE }));
    expect(result.success).toBe(true);
  });
});

describe('rollSubmissionSchema — rejects', () => {
  it('T1.13 formula longer than MAX_FORMULA_LENGTH', () => {
    const result = rollSubmissionSchema.safeParse(
      validBody({ formula: 'd'.repeat(MAX_FORMULA_LENGTH + 1) })
    );
    expect(result.success).toBe(false);
  });

  it('T1.14 empty / whitespace-only formula', () => {
    expect(rollSubmissionSchema.safeParse(validBody({ formula: '' })).success).toBe(false);
    expect(rollSubmissionSchema.safeParse(validBody({ formula: '   ' })).success).toBe(false);
  });

  it('T1.15 rolls length > MAX_DICE_IN_ROLL', () => {
    const rolls = Array.from({ length: MAX_DICE_IN_ROLL + 1 }, () => 1);
    const result = rollSubmissionSchema.safeParse(validBody({ rolls, total: 1 }));
    expect(result.success).toBe(false);
  });

  it('T1.16 a non-integer rolls entry', () => {
    const result = rollSubmissionSchema.safeParse(validBody({ rolls: [1.5] }));
    expect(result.success).toBe(false);
  });

  it('T1.17 a rolls entry < 1 and an entry > MAX_DIE_VALUE', () => {
    expect(rollSubmissionSchema.safeParse(validBody({ rolls: [0] })).success).toBe(false);
    expect(
      rollSubmissionSchema.safeParse(validBody({ rolls: [MAX_DIE_VALUE + 1] })).success
    ).toBe(false);
  });

  it('T1.18 non-finite total (NaN, Infinity)', () => {
    expect(rollSubmissionSchema.safeParse(validBody({ total: NaN })).success).toBe(false);
    expect(rollSubmissionSchema.safeParse(validBody({ total: Infinity })).success).toBe(false);
  });

  it('T1.19 |total| > MAX_TOTAL_MAGNITUDE is rejected', () => {
    const result = rollSubmissionSchema.safeParse(
      validBody({ total: MAX_TOTAL_MAGNITUDE + 1 })
    );
    expect(result.success).toBe(false);
  });

  it('T1.20 visibility absent, and visibility.scope not in {group, dm-only}', () => {
    const { visibility: _omit, ...withoutVisibility } = validBody();
    expect(rollSubmissionSchema.safeParse(withoutVisibility).success).toBe(false);
    expect(
      rollSubmissionSchema.safeParse(validBody({ visibility: { scope: 'direct' } })).success
    ).toBe(false);
  });
});
