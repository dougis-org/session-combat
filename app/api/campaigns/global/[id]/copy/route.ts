/* istanbul ignore file */
import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { addMember } from '@/lib/storage/membershipRepo';
import * as campaignRepo from '@/lib/storage/campaignRepo';
import { saveEncounter } from '@/lib/storage/encounterRepo';
import { withAuthAndParams } from '@/lib/middleware';
import { Campaign, CampaignChapter } from '@/lib/types';
import { randomUUID } from 'crypto';
import { validateString } from '@/lib/validation/core';

export const POST = withAuthAndParams<{ id: string }>(async (request, auth, { id }) => {
  try {
    const idResult = validateString(id, 'id', { required: true, minLength: 1 });
    if (!idResult.valid) {
      return NextResponse.json({ error: idResult.error.message }, { status: 400 });
    }

    const template = await storage.loadGlobalCampaignTemplateById(idResult.value);

    if (!template) {
      return NextResponse.json({ error: 'Campaign template not found' }, { status: 404 });
    }

    const copiedChapters: CampaignChapter[] = template.chapters.map((ch) => ({
      ...ch,
      id: randomUUID(),
    }));

    const campaign: Campaign = {
      id: randomUUID(),
      userId: auth.userId,
      name: template.name,
      moduleName: template.moduleName,
      chapters: copiedChapters,
      currentChapterId: copiedChapters.length > 0 ? copiedChapters[0].id : undefined,
      templateId: template.id,
      partyIds: [],
      status: 'planning',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await campaignRepo.saveCampaign(campaign);

    try {
      await addMember({
        id: randomUUID(),
        campaignId: campaign.id,
        userId: auth.userId,
        role: 'dm',
        status: 'active',
        history: [{ action: 'active' as const, by: auth.userId, at: new Date() }],
      });

      if (template.encounters && template.encounters.length > 0) {
        const encounterIds = await Promise.all(
          template.encounters.map(async (encounterTpl) => {
            const encounter = {
              id: randomUUID(),
              userId: auth.userId,
              name: encounterTpl.name,
              description: encounterTpl.description,
              monsters: encounterTpl.monsters || [],
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await saveEncounter(encounter);
            return encounter.id;
          })
        );
        campaign.encounterIds = encounterIds;
        await campaignRepo.saveCampaign(campaign);
      }
    } catch (creationError) {
      try {
        await campaignRepo.deleteCampaign(campaign.id, auth.userId);
      } catch (rollbackError) {
        // istanbul ignore next
        console.error('Failed to rollback campaign creation after error:', rollbackError);
      }
      throw creationError;
    }

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error copying campaign template:', error);
    return NextResponse.json({ error: 'Failed to copy campaign template' }, { status: 500 });
  }
});
