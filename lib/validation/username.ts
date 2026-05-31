import { ValidationResult } from './core';

export function validateUsername(value: unknown): ValidationResult {
  const errors: { field?: string; message: string }[] = [];

  if (typeof value !== 'string') {
    return {
      valid: false,
      errors: [
        {
          field: 'username',
          message: 'Username must be a string',
        },
      ],
    };
  }

  // Length check: min 4, max 20 characters
  if (value.length < 4) {
    errors.push({
      field: 'username',
      message: 'Username must be at least 4 characters long (minimum length)',
    });
  } else if (value.length > 20) {
    errors.push({
      field: 'username',
      message: 'Username must be at most 20 characters long (maximum length)',
    });
  }

  // Charset check: regex /^[a-zA-Z0-9_-]+$/
  const charsetRegex = /^[a-zA-Z0-9_-]+$/;
  if (value.length > 0 && !charsetRegex.test(value)) {
    errors.push({
      field: 'username',
      message: 'Username can only contain alphanumeric characters, underscores, and hyphens',
    });
  }

  // Reserved word check: compare value.toLowerCase() against list
  const reservedWords = ['admin', 'root', 'system', 'support', 'moderator', 'api', 'null', 'undefined'];
  if (reservedWords.includes(value.toLowerCase())) {
    errors.push({
      field: 'username',
      message: 'This username is reserved and cannot be used',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
