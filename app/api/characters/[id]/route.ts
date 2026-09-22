import { NextRequest, NextResponse } from "next/server";
import { withAuthAndParams } from "@/lib/middleware";
import { loadCharacters, saveCharacter, deleteCharacter, findOwnedActiveCharacter } from "@/lib/storage/characterRepo";
import { parseCharacterUpdateBody, validateCharacterId } from "@/lib/validation/character";
import { filterToDamageTypes } from "@/lib/constants";
import { Character, CharacterType, getCharacterType } from "@/lib/types";

export const GET = withAuthAndParams<{ id: string }>(async (request, auth, { id }) => {
  try {
    const idValidation = validateCharacterId(id);
    if (!idValidation.valid) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const characters = await loadCharacters(auth.userId);
    const character = characters.find((c) => c.id === idValidation.value);

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...character,
      characterType: getCharacterType(character.characterType),
    });
  } catch (error) {
    console.error("Error fetching character:", error);
    return NextResponse.json(
      { error: "Failed to fetch character" },
      { status: 500 },
    );
  }
});

export const PUT = withAuthAndParams<{ id: string }>(async (request, auth, { id }) => {
  try {
    const idValidation = validateCharacterId(id);
    if (!idValidation.valid) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = parseCharacterUpdateBody(body);
    if (!parsed.valid) {
      return NextResponse.json(parsed.failure.body, { status: parsed.failure.status });
    }
    const {
      name, classes, race, raceProvided, gender, genderProvided,
      background, backgroundProvided, alignment, alignmentProvided, characterType, stats,
    } = parsed.value;

    // Get the existing character to verify ownership
    const characters = await loadCharacters(auth.userId);
    const existingCharacter = characters.find((c) => c.id === idValidation.value);

    if (!existingCharacter) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 },
      );
    }

    const updatedCharacter: Character = {
      ...existingCharacter,
      name: name !== undefined ? name : existingCharacter.name,
      hp: stats.hp !== undefined ? stats.hp : existingCharacter.hp,
      maxHp: stats.maxHp !== undefined ? stats.maxHp : existingCharacter.maxHp,
      ac: stats.ac !== undefined ? stats.ac : existingCharacter.ac,
      acNote: stats.acNote !== undefined ? stats.acNote : existingCharacter.acNote,
      abilityScores:
        stats.abilityScores !== undefined
          ? stats.abilityScores
          : existingCharacter.abilityScores,
      savingThrows:
        stats.savingThrows !== undefined
          ? stats.savingThrows
          : existingCharacter.savingThrows,
      skills: stats.skills !== undefined ? stats.skills : existingCharacter.skills,
      damageResistances:
        stats.damageResistances !== undefined
          ? filterToDamageTypes(stats.damageResistances)
          : existingCharacter.damageResistances,
      damageImmunities:
        stats.damageImmunities !== undefined
          ? filterToDamageTypes(stats.damageImmunities)
          : existingCharacter.damageImmunities,
      damageVulnerabilities:
        stats.damageVulnerabilities !== undefined
          ? filterToDamageTypes(stats.damageVulnerabilities)
          : existingCharacter.damageVulnerabilities,
      conditionImmunities:
        stats.conditionImmunities !== undefined
          ? stats.conditionImmunities
          : existingCharacter.conditionImmunities,
      senses: stats.senses !== undefined ? stats.senses : existingCharacter.senses,
      languages:
        stats.languages !== undefined ? stats.languages : existingCharacter.languages,
      traits: stats.traits !== undefined ? stats.traits : existingCharacter.traits,
      actions: stats.actions !== undefined ? stats.actions : existingCharacter.actions,
      bonusActions:
        stats.bonusActions !== undefined
          ? stats.bonusActions
          : existingCharacter.bonusActions,
      reactions:
        stats.reactions !== undefined ? stats.reactions : existingCharacter.reactions,
      classes: classes !== undefined ? classes : existingCharacter.classes,
      race: raceProvided ? race : existingCharacter.race,
      gender: genderProvided ? gender : existingCharacter.gender,
      background: backgroundProvided ? background : existingCharacter.background,
      alignment: alignmentProvided ? alignment : existingCharacter.alignment,
      characterType: characterType !== undefined
        ? (characterType as CharacterType)
        : getCharacterType(existingCharacter.characterType),
      updatedAt: new Date(),
    };

    await saveCharacter(updatedCharacter);

    return NextResponse.json(updatedCharacter);
  } catch (error) {
    console.error("Error updating character:", error);
    return NextResponse.json(
      { error: "Failed to update character" },
      { status: 500 },
    );
  }
});

export const DELETE = withAuthAndParams<{ id: string }>(async (request, auth, { id }) => {
  try {
    const idValidation = validateCharacterId(id);
    if (!idValidation.valid) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    // Verify ownership before deleting
    const character = await findOwnedActiveCharacter(idValidation.value, auth.userId);

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 },
      );
    }

    await deleteCharacter(idValidation.value, auth.userId);

    return NextResponse.json({ message: "Character deleted successfully" });
  } catch (error) {
    console.error("Error deleting character:", error);
    return NextResponse.json(
      { error: "Failed to delete character" },
      { status: 500 },
    );
  }
});
