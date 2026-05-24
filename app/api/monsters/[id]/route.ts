import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { AuthPayload, MonsterTemplate, normalizeAlignment } from '@/lib/types';

async function loadUserTemplate(auth: AuthPayload, id: string): Promise<MonsterTemplate | NextResponse> {
  const templates = await storage.loadMonsterTemplates(auth.userId);
  return templates.find((t) => t.id === id) ?? NextResponse.json(
    { error: 'Monster template not found' },
    { status: 404 }
  );
}

export const GET = withAuthAndParams<{ id: string }>(async (request, auth, { id }) => {
  try {
    const template = await loadUserTemplate(auth, id);
    if (template instanceof NextResponse) return template;
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching monster template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monster template' },
      { status: 500 }
    );
  }
});

export const PUT = withAuthAndParams<{ id: string }>(async (request, auth, { id }) => {
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

    const existingTemplate = await loadUserTemplate(auth, id);
    if (existingTemplate instanceof NextResponse) return existingTemplate;

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

    const updatedTemplate: MonsterTemplate = {
      ...existingTemplate,
      name: name.trim(),
      hp: Math.min(hp !== undefined ? hp : existingTemplate.hp, maxHp),
      maxHp,
      ac: ac !== undefined ? ac : existingTemplate.ac,
      acNote: acNote !== undefined ? acNote : existingTemplate.acNote,
      abilityScores: abilityScores !== undefined ? abilityScores : existingTemplate.abilityScores,
      savingThrows: savingThrows !== undefined ? savingThrows : existingTemplate.savingThrows,
      skills: skills !== undefined ? skills : existingTemplate.skills,
      damageResistances: damageResistances !== undefined ? damageResistances : existingTemplate.damageResistances,
      damageImmunities: damageImmunities !== undefined ? damageImmunities : existingTemplate.damageImmunities,
      damageVulnerabilities: damageVulnerabilities !== undefined ? damageVulnerabilities : existingTemplate.damageVulnerabilities,
      conditionImmunities: conditionImmunities !== undefined ? conditionImmunities : existingTemplate.conditionImmunities,
      senses: senses !== undefined ? senses : existingTemplate.senses,
      languages: languages !== undefined ? languages : existingTemplate.languages,
      traits: traits !== undefined ? traits : existingTemplate.traits,
      actions: actions !== undefined ? actions : existingTemplate.actions,
      bonusActions: bonusActions !== undefined ? bonusActions : existingTemplate.bonusActions,
      reactions: reactions !== undefined ? reactions : existingTemplate.reactions,
      size: size !== undefined ? size : existingTemplate.size,
      type: type !== undefined ? type : existingTemplate.type,
      alignment: alignment !== undefined ? normalizedAlignment : existingTemplate.alignment,
      speed: speed !== undefined ? speed : existingTemplate.speed,
      challengeRating: challengeRating !== undefined ? challengeRating : existingTemplate.challengeRating,
      experiencePoints: experiencePoints !== undefined ? experiencePoints : existingTemplate.experiencePoints,
      lairActions: lairActions !== undefined ? lairActions : existingTemplate.lairActions,
      legendaryActions: legendaryActions !== undefined ? legendaryActions : existingTemplate.legendaryActions,
      source: source !== undefined ? source : existingTemplate.source,
      description: description !== undefined ? description : existingTemplate.description,
      updatedAt: new Date(),
    };

    await storage.saveMonsterTemplate(updatedTemplate);

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating monster template:', error);
    return NextResponse.json(
      { error: 'Failed to update monster template' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuthAndParams<{ id: string }>(async (request, auth, { id }) => {
  try {
    const template = await loadUserTemplate(auth, id);
    if (template instanceof NextResponse) return template;

    await storage.deleteMonsterTemplate(id, auth.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting monster template:', error);
    return NextResponse.json(
      { error: 'Failed to delete monster template' },
      { status: 500 }
    );
  }
});
