import { AbilityScores, CreatureAbility } from '@/lib/types';
import { validateString, validateNumber, ValidationError } from './core';

export function validateAbilityScores(
  value: unknown,
  fieldName: string = 'abilityScores'
): { valid: true; value: AbilityScores } | { valid: false; error: ValidationError } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be an object`,
      },
    };
  }

  const obj = value as Record<string, unknown>;
  const abilityNames = [
    'strength',
    'dexterity',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma',
  ];
  const scores: Partial<AbilityScores> = {};

  for (const ability of abilityNames) {
    const scoreResult = validateNumber(obj[ability], `${fieldName}.${ability}`, {
      required: true,
      min: 1,
      max: 30,
    });
    if (!scoreResult.valid) {
      return { valid: false, error: scoreResult.error };
    }
    scores[ability as keyof AbilityScores] = scoreResult.value;
  }

  return {
    valid: true,
    value: scores as AbilityScores,
  };
}

export function validateAbility(
  ability: unknown,
  fieldName: string = 'ability'
): { valid: true; value: CreatureAbility } | { valid: false; error: ValidationError } {
  if (!ability || typeof ability !== 'object' || Array.isArray(ability)) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be an object`,
      },
    };
  }

  const obj = ability as Record<string, unknown>;

  const nameResult = validateString(obj.name, `${fieldName}.name`, { required: true, minLength: 1 });
  if (!nameResult.valid) {
    return { valid: false, error: nameResult.error };
  }

  const descResult = validateString(obj.description, `${fieldName}.description`, { required: true, minLength: 1 });
  if (!descResult.valid) {
    return { valid: false, error: descResult.error };
  }

  return {
    valid: true,
    value: {
      name: nameResult.value,
      description: descResult.value,
      attackBonus: typeof obj.attackBonus === 'number' ? obj.attackBonus : undefined,
      damageDescription: typeof obj.damageDescription === 'string' ? obj.damageDescription : undefined,
      saveDC: typeof obj.saveDC === 'number' ? obj.saveDC : undefined,
      saveType: typeof obj.saveType === 'string' ? obj.saveType : undefined,
      recharge: typeof obj.recharge === 'string' ? obj.recharge : undefined,
    },
  };
}

export function validateAbilityArray(
  value: unknown,
  fieldName: string = 'abilities'
): { valid: true; value: CreatureAbility[] } | { valid: false; error: ValidationError } {
  if (value === undefined || value === null) {
    return { valid: true, value: [] };
  }

  if (!Array.isArray(value)) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be an array`,
      },
    };
  }

  const result: CreatureAbility[] = [];
  for (let i = 0; i < value.length; i++) {
    const abilityResult = validateAbility(value[i], `${fieldName}[${i}]`);
    if (!abilityResult.valid) {
      return { valid: false, error: abilityResult.error };
    }
    result.push(abilityResult.value);
  }

  return { valid: true, value: result };
}
