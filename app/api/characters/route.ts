import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { loadCharacters, saveCharacter } from '@/lib/storage/characterRepo';
import { Character, isValidCharacterType, getCharacterType } from '@/lib/types';
import { parseCharacterCreateBody } from '@/lib/validation/character';
import { filterToDamageTypes } from '@/lib/constants';

export const GET = withAuth(async (request, auth) => {
  try {
    const characterTypeParam = request.nextUrl.searchParams.get('characterType');

    if (characterTypeParam && characterTypeParam !== 'all' && !isValidCharacterType(characterTypeParam)) {
      return NextResponse.json(
        { error: 'Invalid characterType. Must be one of: character, npc, companion, all' },
        { status: 400 }
      );
    }

    let characters = await loadCharacters(auth.userId);

    if (characterTypeParam && characterTypeParam !== 'all') {
      characters = characters.filter(
        c => getCharacterType(c.characterType) === characterTypeParam
      );
    }

    return NextResponse.json(characters.map(c => ({
      ...c,
      characterType: getCharacterType(c.characterType),
    })));
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request, auth) => {
  try {
    const body = await request.json();

    const parsed = parseCharacterCreateBody(body);
    if (!parsed.valid) {
      return NextResponse.json(parsed.failure.body, { status: parsed.failure.status });
    }
    const { name, classes, race, gender, background, alignment, characterType, stats } = parsed.value;

    const character: Character = {
      _id: undefined,
      id: crypto.randomUUID(),
      userId: auth.userId,
      name,
      hp: stats.hp ?? 0,
      maxHp: stats.maxHp ?? 0,
      ac: stats.ac ?? 10,
      acNote: stats.acNote || undefined,
      abilityScores: stats.abilityScores || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      savingThrows: stats.savingThrows || {},
      skills: stats.skills || {},
      damageResistances: filterToDamageTypes(stats.damageResistances),
      damageImmunities: filterToDamageTypes(stats.damageImmunities),
      damageVulnerabilities: filterToDamageTypes(stats.damageVulnerabilities),
      conditionImmunities: stats.conditionImmunities || [],
      senses: stats.senses || {},
      languages: stats.languages || [],
      traits: stats.traits || [],
      actions: stats.actions || [],
      bonusActions: stats.bonusActions || [],
      reactions: stats.reactions || [],
      classes,
      race,
      gender,
      background,
      alignment,
      characterType: getCharacterType(characterType),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await saveCharacter(character);

    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json(
      { error: 'Failed to create character' },
      { status: 500 }
    );
  }
});
