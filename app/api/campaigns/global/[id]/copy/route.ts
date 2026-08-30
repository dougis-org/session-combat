import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { withAuthAndParams } from '@/lib/middleware';
import { Campaign, CampaignChapter } from '@/lib/types';
import { randomUUID } from 'crypto';

export const POST = withAuthAndParams<{ id: string }>(async (request, auth, { id }) => {
  try {
    const template = await storage.loadGlobalCampaignTemplateById(id);

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
      status: 'planning',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.saveCampaign(campaign);

    try {
      await storage.addMember({
        id: randomUUID(),
        campaignId: campaign.id,
        userId: auth.userId,
        role: 'dm',
        status: 'active',
        history: [{ action: 'active' as const, by: auth.userId, at: new Date() }],
      });

      if (template.encounters && template.encounters.length > 0) {
        const encounterIds: string[] = [];
        for (const encounterTpl of template.encounters) {
          const encounter = {
            id: randomUUID(),
            userId: auth.userId,
            name: encounterTpl.name,
            description: encounterTpl.description,
            monsters: encounterTpl.monsters || [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await storage.saveEncounter(encounter);
          encounterIds.push(encounter.id);
        }
        campaign.encounterIds = encounterIds;
        await storage.saveCampaign(campaign);
      }
    } catch (creationError) {
      try {
        await storage.deleteCampaign(campaign.id, auth.userId);
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
