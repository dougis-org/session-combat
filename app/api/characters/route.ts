import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Character, isValidRace, VALID_RACES, isValidClass, VALID_CLASSES, CharacterClass, calculateTotalLevel, validateCharacterClasses } from '@/lib/types';

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
      classes,
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

    // Validate race if provided
    if (race !== undefined && race !== null && race !== '' && !isValidRace(race)) {
      return NextResponse.json(
        { 
          error: 'Invalid race. Must be one of: ' + VALID_RACES.join(', '),
          validRaces: VALID_RACES 
        },
        { status: 400 }
      );
    }

    // Validate and normalize classes
    let characterClasses: CharacterClass[] = [];
    if (classes !== undefined && classes !== null) {
      const validationResult = validateCharacterClasses(classes, { allowEmpty: true });
      if (!validationResult.valid) {
        return NextResponse.json(
          { 
            error: validationResult.error,
            validClasses: VALID_CLASSES 
          },
          { status: 400 }
        );
      }

      // Classes is valid (could be empty, but we handle that below)
      if (Array.isArray(classes)) {
        characterClasses = classes.map((c: any) => ({
          class: c.class,
          level: c.level,
        }));
      }
    }

    // Default to Fighter level 1 if no classes provided
    if (characterClasses.length === 0) {
      characterClasses = [{ class: 'Fighter', level: 1 }];
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
      abilityScores: abilityScores || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      savingThrows: savingThrows || {},
      skills: skills || {},
      damageResistances: damageResistances || [],
      damageImmunities: damageImmunities || [],
      damageVulnerabilities: damageVulnerabilities || [],
      conditionImmunities: conditionImmunities || [],
      senses: senses || {},
      languages: languages || [],
      traits: traits || [],
      actions: actions || [],
      bonusActions: bonusActions || [],
      reactions: reactions || [],
      classes: characterClasses,
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
