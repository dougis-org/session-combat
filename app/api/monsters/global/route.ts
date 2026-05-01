import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { MonsterTemplate, normalizeAlignment } from "@/lib/types";
import { GLOBAL_USER_ID } from "@/lib/constants";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/api-helpers";
import { getAllMonsters } from "@/lib/import/open5eAdapter";
import { transformMonster } from "@/lib/import/transformMonster";
import { shouldImport } from "@/lib/import/dedupeEngine";

export async function GET(request: NextRequest) {
  try {
    const templates = await storage.loadGlobalMonsterTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching global monster templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global monster templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const errorResponse = await requireAdmin(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();
    const {
      name,
      hp,
      maxHp,
      ac,
      acNote,
      abilityScores,
      savingThrows,
      skills,
      damageResistances,
      damageImmunities,
      damageVulnerabilities,
      conditionImmunities,
      senses,
      languages,
      traits,
      actions,
      bonusActions,
      reactions,
      size,
      type,
      alignment,
      speed,
      challengeRating,
      experiencePoints,
      lairActions,
      legendaryActions,
      source,
      description,
    } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Monster name is required' },
        { status: 400 }
      );
    }

    if (maxHp === undefined || maxHp <= 0) {
      return NextResponse.json(
        { error: 'Max HP must be greater than 0' },
        { status: 400 }
      );
    }

    const normalizedAlignment = normalizeAlignment(alignment);

    // Validate alignment if provided
    if (alignment !== undefined && alignment !== null && alignment !== '' && !normalizedAlignment) {
      return NextResponse.json({ error: 'Invalid alignment' }, { status: 400 });
    }

    const template: MonsterTemplate = {
      id: randomUUID(),
      userId: GLOBAL_USER_ID,
      isGlobal: true,
      name: name.trim(),
      hp: Math.min(hp || maxHp, maxHp),
      maxHp,
      ac: ac ?? 10,
      acNote: acNote || undefined,
      abilityScores: abilityScores || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      savingThrows: savingThrows || {},
      skills: skills || {},
      damageResistances: damageResistances || [],
      damageImmunities: damageImmunities || [],
      damageVulnerabilities: damageVulnerabilities || [],
      conditionImmunities: conditionImmunities || [],
      senses: senses || [],
      languages: languages || [],
      traits: traits || [],
      actions: actions || [],
      bonusActions: bonusActions || [],
      reactions: reactions || [],
      size: size || 'Medium',
      type: type || 'humanoid',
      alignment: normalizedAlignment,
      speed: speed || undefined,
      challengeRating: challengeRating || 0,
      experiencePoints: experiencePoints || 0,
      lairActions: lairActions || [],
      legendaryActions: legendaryActions || [],
      source: source || undefined,
      description: description || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.saveMonsterTemplate(template);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating global monster template:', error);
    return NextResponse.json(
      { error: 'Failed to create global monster template' },
      { status: 500 }
    );
  }
}

/**
 * Seed SRD monsters into the database
 * POST /api/monsters/global/seed
 * Admin only
 */
export async function PUT(request: NextRequest) {
  const errorResponse = await requireAdmin(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for await (const creature of getAllMonsters()) {
      const { monster, valid } = transformMonster(creature);

      if (!valid) {
        errors++;
        continue;
      }

      const exists = await shouldImport("monsters", monster.name, monster.source || "");
      if (!exists) {
        skipped++;
        continue;
      }

      try {
        await storage.saveMonsterTemplate(monster);
        inserted++;
      } catch {
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${inserted} monsters from open5e`,
      count: inserted,
      skipped,
      errors,
    });
  } catch (error) {
    console.error('Error seeding monsters:', error);
    return NextResponse.json(
      { error: 'Failed to seed monsters', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
