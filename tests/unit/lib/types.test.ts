import { CampaignTemplate, EncounterTemplate } from '@/lib/types';

describe('CampaignTemplate types', () => {
  it('should support encounters array with EncounterTemplate', () => {
    const template: CampaignTemplate = {
      id: 'template-1',
      userId: 'user-1',
      isGlobal: true,
      name: 'Test Template',
      moduleName: 'Test Module',
      chapters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      encounters: [
        {
          name: 'Goblin Ambush',
          description: 'A few goblins attack',
          monsters: []
        }
      ]
    };
    
    expect(template.encounters).toBeDefined();
    expect(template.encounters?.[0].name).toBe('Goblin Ambush');
  });
});
