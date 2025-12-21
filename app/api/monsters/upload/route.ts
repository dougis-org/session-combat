/**
 * API endpoint for bulk uploading monster templates from JSON documents
 * POST /api/monsters/upload
 *
 * Accepts a JSON document with an array of monsters
 * Validates the format and creates user-specific (non-global) monster templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import {
  validateMonsterUploadDocument,
  transformMonsterData,
  MonsterUploadDocument,
  RawMonsterData,
} from '@/lib/validation/monsterUpload';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);

  // Check authentication
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    // Parse request body as JSON
    let document: unknown;
    try {
      document = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON format. Please ensure the request body is valid JSON.' },
        { status: 400 }
      );
    }

    // Validate document structure
    const validation = validateMonsterUploadDocument(document as MonsterUploadDocument);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
          count: 0,
          imported: [],
        },
        { status: 400 }
      );
    }

    // Transform and save monsters
    const monsters = (document as MonsterUploadDocument).monsters || [];
    const imported = [];
    const errors = [];

    for (let i = 0; i < monsters.length; i++) {
      try {
        const monsterData = monsters[i] as RawMonsterData;
        const template = transformMonsterData(monsterData, auth.userId);

        // Save to database
        await storage.saveMonsterTemplate(template);

        imported.push({
          index: i,
          id: template.id,
          name: template.name,
        });
      } catch (saveError) {
        errors.push({
          index: i,
          message: `Failed to save monster: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`,
        });
      }
    }

    // Return results
    const success = imported.length > 0 && errors.length === 0;
    const statusCode = success ? 201 : errors.length > 0 && imported.length > 0 ? 207 : 500;

    return NextResponse.json(
      {
        success,
        count: imported.length,
        total: monsters.length,
        imported,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: statusCode }
    );
  } catch (error) {
    console.error('Error processing monster upload:', error);
    return NextResponse.json(
      {
        error: 'Failed to process monster upload',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
