import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Character } from '@/lib/types';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const characters = await storage.loadCharacters(auth.userId);
    return NextResponse.json(characters);
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
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
      class: classType,
      level,
      race,
      background,
      alignment,
    } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Character name is required' },
        { status: 400 }
      );
    }

    const character: Character = {
      _id: undefined,
      id: crypto.randomUUID(),
      userId: auth.userId,
      name: name.trim(),
      hp: hp || 0,
      maxHp: maxHp || 0,
      ac: ac || 10,
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
      class: classType || undefined,
      level: level || 1,
      race: race || undefined,
      background: background || undefined,
      alignment: alignment || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.saveCharacter(character);

    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json(
      { error: 'Failed to create character' },
      { status: 500 }
    );
  }
}
