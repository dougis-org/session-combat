export interface ValidationError {
  field?: string;
  message: string;
  index?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateString(
  value: unknown,
  fieldName: string,
  options: { required?: boolean; minLength?: number } = {}
): { valid: true; value: string } | { valid: false; error: ValidationError } {
  const { required = false, minLength = 0 } = options;

  if (value === undefined || value === null) {
    if (required) {
      return {
        valid: false,
        error: { field: fieldName, message: `${fieldName} is required` },
      };
    }
    return { valid: true, value: '' };
  }

  if (typeof value !== 'string') {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be a string, got ${typeof value}`,
      },
    };
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be at least ${minLength} character${minLength === 1 ? '' : 's'}`,
      },
    };
  }

  return { valid: true, value: trimmed };
}

export function validateNumber(
  value: unknown,
  fieldName: string,
  options: { required?: boolean; min?: number; max?: number } = {}
): { valid: true; value: number } | { valid: false; error: ValidationError } {
  const { required = false, min, max } = options;

  if (value === undefined || value === null) {
    if (required) {
      return {
        valid: false,
        error: { field: fieldName, message: `${fieldName} is required` },
      };
    }
    return { valid: true, value: 0 };
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be a valid number, got ${typeof value}`,
      },
    };
  }

  if (min !== undefined && value < min) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be at least ${min}`,
      },
    };
  }

  if (max !== undefined && value > max) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be at most ${max}`,
      },
    };
  }

  return { valid: true, value };
}

export function validateStringArray(
  value: unknown,
  fieldName: string = 'array'
): { valid: true; value: string[] } | { valid: false; error: ValidationError } {
  if (value === undefined || value === null) {
    return { valid: true, value: [] };
  }

  if (!Array.isArray(value)) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be an array of strings`,
      },
    };
  }

  for (let i = 0; i < value.length; i++) {
    if (typeof value[i] !== 'string') {
      return {
        valid: false,
        error: {
          field: fieldName,
          index: i,
          message: `${fieldName}[${i}] must be a string, got ${typeof value[i]}`,
        },
      };
    }
  }

  return { valid: true, value: value as string[] };
}

export function validateRecord<T extends string | number | (string | number)>(
  value: unknown,
  fieldName: string,
  isValid: (val: unknown) => boolean
): { valid: true; value: Record<string, T> } | { valid: false; error: ValidationError } {
  if (value === undefined || value === null) {
    return { valid: true, value: {} as Record<string, T> };
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return {
      valid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be an object`,
      },
    };
  }

  const result: Record<string, T> = {};
  const obj = value as Record<string, unknown>;

  for (const [key, val] of Object.entries(obj)) {
    if (!isValid(val)) {
      return {
        valid: false,
        error: {
          field: `${fieldName}.${key}`,
          message: `${fieldName}.${key} has invalid type`,
        },
      };
    }
    result[key] = val as T;
  }

  return { valid: true, value: result };
}

export function validateStringRecord(
  value: unknown,
  fieldName: string = 'record'
): { valid: true; value: Record<string, string> } | { valid: false; error: ValidationError } {
  return validateRecord<string>(value, fieldName, (val) => typeof val === 'string');
}

export function validateNumberRecord(
  value: unknown,
  fieldName: string = 'record'
): { valid: true; value: Record<string, number> } | { valid: false; error: ValidationError } {
  return validateRecord<number>(value, fieldName, (val) => typeof val === 'number' && Number.isFinite(val as number));
}
