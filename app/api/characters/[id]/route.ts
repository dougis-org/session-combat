import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Character, isValidRace, VALID_RACES, isValidClass, VALID_CLASSES, CharacterClass, calculateTotalLevel } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const characters = await storage.loadCharacters(auth.userId);
    const character = characters.find((c) => c.id === id);

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(character);
  } catch (error) {
    console.error('Error fetching character:', error);
    return NextResponse.json(
      { error: 'Failed to fetch character' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Get the existing character to verify ownership
    const characters = await storage.loadCharacters(auth.userId);
    const existingCharacter = characters.find((c) => c.id === id);

    if (!existingCharacter) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    if (name !== undefined && name.trim() === '') {
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

    // Validate and normalize classes if provided
    let characterClasses = existingCharacter.classes;
    if (classes !== undefined && classes !== null) {
      if (!Array.isArray(classes)) {
        return NextResponse.json(
          { error: 'Classes must be an array of {class, level} objects' },
          { status: 400 }
        );
      }

      characterClasses = [];
      for (const classEntry of classes) {
        if (!classEntry.class || !isValidClass(classEntry.class)) {
          return NextResponse.json(
            { 
              error: `Invalid class "${classEntry.class}". Must be one of: ` + VALID_CLASSES.join(', '),
              validClasses: VALID_CLASSES 
            },
            { status: 400 }
          );
        }

        if (typeof classEntry.level !== 'number' || classEntry.level < 1 || classEntry.level > 20) {
          return NextResponse.json(
            { error: 'Class level must be a number between 1 and 20' },
            { status: 400 }
          );
        }

        characterClasses.push({
          class: classEntry.class,
          level: classEntry.level,
        });
      }
    }

    const updatedCharacter: Character = {
      ...existingCharacter,
      name: name !== undefined ? name.trim() : existingCharacter.name,
      hp: hp !== undefined ? hp : existingCharacter.hp,
      maxHp: maxHp !== undefined ? maxHp : existingCharacter.maxHp,
      ac: ac !== undefined ? ac : existingCharacter.ac,
      acNote: acNote !== undefined ? acNote : existingCharacter.acNote,
      abilityScores: abilityScores !== undefined ? abilityScores : existingCharacter.abilityScores,
      savingThrows: savingThrows !== undefined ? savingThrows : existingCharacter.savingThrows,
      skills: skills !== undefined ? skills : existingCharacter.skills,
      damageResistances: damageResistances !== undefined ? damageResistances : existingCharacter.damageResistances,
      damageImmunities: damageImmunities !== undefined ? damageImmunities : existingCharacter.damageImmunities,
      damageVulnerabilities: damageVulnerabilities !== undefined ? damageVulnerabilities : existingCharacter.damageVulnerabilities,
      conditionImmunities: conditionImmunities !== undefined ? conditionImmunities : existingCharacter.conditionImmunities,
      senses: senses !== undefined ? senses : existingCharacter.senses,
      languages: languages !== undefined ? languages : existingCharacter.languages,
      traits: traits !== undefined ? traits : existingCharacter.traits,
      actions: actions !== undefined ? actions : existingCharacter.actions,
      bonusActions: bonusActions !== undefined ? bonusActions : existingCharacter.bonusActions,
      reactions: reactions !== undefined ? reactions : existingCharacter.reactions,
      classes: characterClasses,
      race: race !== undefined ? race : existingCharacter.race,
      background: background !== undefined ? background : existingCharacter.background,
      alignment: alignment !== undefined ? alignment : existingCharacter.alignment,
      updatedAt: new Date(),
    };

    await storage.saveCharacter(updatedCharacter);

    return NextResponse.json(updatedCharacter);
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      { error: 'Failed to update character' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    // Verify ownership before deleting
    const characters = await storage.loadCharacters(auth.userId);
    const character = characters.find((c) => c.id === id);

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    await storage.deleteCharacter(id, auth.userId);

    return NextResponse.json({ message: 'Character deleted successfully' });
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json(
      { error: 'Failed to delete character' },
      { status: 500 }
    );
  }
}
