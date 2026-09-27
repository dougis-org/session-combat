import { validateString } from './core';
import { validateEncounterMonsters } from './encounterMonster';
import { Monster } from '@/lib/types';

export const ENCOUNTER_DESCRIPTION_MAX_LENGTH = 5000;

export interface ValidatedEncounterFields {
  name: string;
  /** `undefined` means the field was absent from the request body. */
  description?: string;
  /** `undefined` means the field was absent from the request body. */
  monsters?: Monster[];
}

/**
 * Validates the shared name/description/monsters fields of an encounter
 * create/update request body. `description` and `monsters` are only present
 * in the result when the caller supplied them, so POST/PUT can each decide
 * their own default (empty for create, existing value for update).
 */
export function validateEncounterFields(
  body: Record<string, unknown>,
  options: { requireName?: boolean } = {}
): { valid: true; value: ValidatedEncounterFields } | { valid: false; error: string } {
  const { requireName = true } = options;
  const { name, description, monsters } = body;

  const nameResult = validateString(name, 'name', { required: requireName, minLength: 1 });
  if (!nameResult.valid) {
    return { valid: false, error: requireName ? 'Encounter name is required' : nameResult.error.message };
  }

  let validatedDescription: string | undefined;
  if (description !== undefined) {
    const descriptionResult = validateString(description, 'description', {
      maxLength: ENCOUNTER_DESCRIPTION_MAX_LENGTH,
    });
    if (!descriptionResult.valid) {
      return { valid: false, error: descriptionResult.error.message };
    }
    validatedDescription = descriptionResult.value;
  }

  let validatedMonsters: Monster[] | undefined;
  if (monsters !== undefined) {
    const monstersResult = validateEncounterMonsters(monsters);
    if (!monstersResult.valid) {
      const [first, ...rest] = monstersResult.errors;
      const prefix = first.field ? `${first.field}: ` : '';
      const suffix = rest.length > 0 ? ` (and ${rest.length} more error${rest.length === 1 ? '' : 's'})` : '';
      return { valid: false, error: `${prefix}${first.message}${suffix}` };
    }
    validatedMonsters = monstersResult.value;
  }

  return {
    valid: true,
    value: { name: nameResult.value, description: validatedDescription, monsters: validatedMonsters },
  };
}
