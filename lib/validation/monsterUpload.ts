/**
 * Public facade for monster-upload validation. The implementation is split by
 * responsibility: schema + validators, transform, and structure-document
 * metadata. Import from this module to keep call sites stable.
 */

export type { ValidationError, ValidationResult } from './core';

export {
  VALID_SIZES,
  UPLOAD_LIMITS,
  rawMonsterSchema,
  monstersArraySchema,
  validateMonsterData,
  validateMonsterUploadDocument,
} from './monsterUploadSchema';
export type {
  ValidSize,
  ParsedMonster,
  RawMonsterData,
  MonsterUploadDocument,
} from './monsterUploadSchema';

export { transformMonsterData } from './monsterUploadTransform';
export type { TransformOptions } from './monsterUploadTransform';

export {
  describeMonsterUploadSchema,
  buildMonsterImportExample,
} from './monsterUploadMetadata';
export type { FieldDescriptor } from './monsterUploadMetadata';
