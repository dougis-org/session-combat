/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;


import React from 'react';
import { Root } from 'react-dom/client';
import { act } from 'react';
import { createReactRoot, unmountReactRoot } from '@/tests/unit/helpers/reactRoot';
import { CampaignEditor } from '@/app/campaigns/CampaignEditor';
import type { Campaign } from '@/lib/types';

let container: HTMLDivElement;
let root: Root;

const BASE_CAMPAIGN: Campaign = {
  id: 'camp-1',
  userId: 'user-1',
  name: 'Test Campaign',
  moduleName: 'LMoP',
  chapters: [],
  status: 'planning',
  notes: '',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

beforeEach(() => {
  ({ container, root } = createReactRoot());
});

afterEach(() => {
  unmountReactRoot(container, root);
  jest.clearAllMocks();
});

function render(props: { campaign: Campaign; onSave: (...args: any[]) => any; onCancel: (...args: any[]) => any; isNew: boolean }) {
  act(() => { root.render(<CampaignEditor {...props} />); });
}

function findButton(text: string): HTMLButtonElement {
  return Array.from(container.querySelectorAll('button')).find(
    b => b.textContent?.trim().includes(text),
  ) as HTMLButtonElement;
}

function getInput(type: string, index = 0): HTMLInputElement {
  return container.querySelectorAll<HTMLInputElement>(`input[type="${type}"]`)[index];
}

async function openChapters() {
  if (!container.textContent?.includes('+ Add Chapter')) {
    await act(async () => { findButton('Chapters').click(); });
  }
}

const CHAPTER_PAIR = [
  { id: 'ch-1', title: 'Arrival', order: 0 },
  { id: 'ch-2', title: 'The Inn', order: 1 },
];

const CHAPTER_TRIO = [
  { id: 'ch-1', title: 'Arrival', order: 0 },
  { id: 'ch-2', title: 'The Inn', order: 1 },
  { id: 'ch-3', title: 'The Dungeon', order: 2 },
];

// ---------------------------------------------------------------------------

describe('CampaignEditor', () => {
  describe('rendering', () => {
    it('shows "Create Campaign" title when isNew', () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: true });
      expect(container.querySelector('h2')?.textContent).toBe('Create Campaign');
    });

    it('shows "Edit Campaign" title when not isNew', () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      expect(container.querySelector('h2')?.textContent).toBe('Edit Campaign');
    });

    it('populates name input from campaign', () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      expect(container.querySelectorAll<HTMLInputElement>('input[type="text"]')[0].value).toBe('Test Campaign');
    });

    it('populates moduleName input from campaign', () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      expect(container.querySelectorAll<HTMLInputElement>('input[type="text"]')[1].value).toBe('LMoP');
    });

    it('renders status dropdown with current value selected', () => {
      render({ campaign: { ...BASE_CAMPAIGN, status: 'on-hold' }, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      const select = container.querySelector<HTMLSelectElement>('select[data-testid="status-select"]');
      expect(select?.value).toBe('on-hold');
    });

    it('renders notes textarea with current value', () => {
      render({ campaign: { ...BASE_CAMPAIGN, notes: 'Party at level 5' }, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      const textarea = container.querySelector<HTMLTextAreaElement>('textarea[data-testid="notes-textarea"]');
      expect(textarea?.value).toBe('Party at level 5');
    });

    it('notes textarea has maxLength of 10000', () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      const textarea = container.querySelector<HTMLTextAreaElement>('textarea[data-testid="notes-textarea"]');
      expect(textarea?.maxLength).toBe(10000);
    });

    it('renders character counter showing length/10000', () => {
      render({ campaign: { ...BASE_CAMPAIGN, notes: 'Hello' }, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      expect(container.textContent).toContain('5/10000');
    });
  });

  describe('validation', () => {
    it('save button is disabled when name is empty', () => {
      render({ campaign: { ...BASE_CAMPAIGN, name: '' }, onSave: jest.fn(), onCancel: jest.fn(), isNew: true });
      expect(findButton('Save Campaign').disabled).toBe(true);
    });

    it('save button is enabled when name has content', () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      expect(findButton('Save Campaign').disabled).toBe(false);
    });
  });

  describe('saving', () => {
    it('calls onSave with trimmed name', async () => {
      const onSave = jest.fn() as any;
      render({ campaign: BASE_CAMPAIGN, onSave, onCancel: jest.fn(), isNew: false });
      await act(async () => { findButton('Save Campaign').click(); });
      expect(onSave).toHaveBeenCalledTimes(1);
      expect((onSave.mock.calls[0][0] as Campaign).name).toBe('Test Campaign');
    });

    it('calls onSave with trimmed moduleName', async () => {
      const onSave = jest.fn() as any;
      render({ campaign: { ...BASE_CAMPAIGN, moduleName: '  DH  ' }, onSave, onCancel: jest.fn(), isNew: false });
      await act(async () => { findButton('Save Campaign').click(); });
      expect((onSave.mock.calls[0][0] as Campaign).moduleName).toBe('DH');
    });

    it('calls onSave with updated status when dropdown changes', async () => {
      const onSave = jest.fn() as any;
      render({ campaign: BASE_CAMPAIGN, onSave, onCancel: jest.fn(), isNew: false });
      const select = container.querySelector<HTMLSelectElement>('select[data-testid="status-select"]')!;
      await act(async () => {
        select.value = 'completed';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await act(async () => { findButton('Save Campaign').click(); });
      expect((onSave.mock.calls[0][0] as Campaign).status).toBe('completed');
    });

    it('calls onSave with on-hold status when dropdown changes to on-hold', async () => {
      const onSave = jest.fn() as any;
      render({ campaign: BASE_CAMPAIGN, onSave, onCancel: jest.fn(), isNew: false });
      const select = container.querySelector<HTMLSelectElement>('select[data-testid="status-select"]')!;
      await act(async () => {
        select.value = 'on-hold';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await act(async () => { findButton('Save Campaign').click(); });
      expect((onSave.mock.calls[0][0] as Campaign).status).toBe('on-hold');
    });
  });

  describe('cancel', () => {
    it('calls onCancel when Cancel button clicked', () => {
      const onCancel = jest.fn();
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel, isNew: false });
      act(() => { findButton('Cancel').click(); });
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('legacy fields removed', () => {
    it('does not render currentChapter input', () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      const labels = Array.from(container.querySelectorAll('label')).map(l => l.textContent);
      expect(labels.some(l => l?.includes('Current Chapter'))).toBe(false);
    });

    it('does not render currentChapterOrder input', () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      const labels = Array.from(container.querySelectorAll('label')).map(l => l.textContent);
      expect(labels.some(l => l?.includes('Chapter Order'))).toBe(false);
    });
  });

  describe('chapters display', () => {
    it('renders chapter list when chapters present', () => {
      const campaign = {
        ...BASE_CAMPAIGN,
        chapters: [
          { id: 'ch-1', title: 'Arrival', order: 0 },
          { id: 'ch-2', title: 'The Inn', order: 1 },
          { id: 'ch-3', title: 'The Dungeon', order: 2 },
        ],
      };
      render({ campaign, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      expect(container.textContent).toContain('Arrival');
      expect(container.textContent).toContain('The Inn');
      expect(container.textContent).toContain('The Dungeon');
    });

    it('save with no chapters calls onSave with chapters: []', async () => {
      const onSave = jest.fn() as any;
      render({ campaign: BASE_CAMPAIGN, onSave, onCancel: jest.fn(), isNew: false });
      await act(async () => { findButton('Save Campaign').click(); });
      expect(onSave).toHaveBeenCalledTimes(1);
      expect((onSave.mock.calls[0][0] as Campaign).chapters).toEqual([]);
    });
  });

  describe('chapters editing', () => {
    it('toggles chapters editing section when accordion button is clicked', async () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      // Initially, the chapters editor section is collapsed, so '+ Add Chapter' is not in DOM
      expect(container.textContent).not.toContain('+ Add Chapter');
      
      const accordionBtn = findButton('Chapters');
      expect(accordionBtn).toBeDefined();

      await act(async () => { accordionBtn.click(); });
      expect(container.textContent).toContain('+ Add Chapter');

      await act(async () => { accordionBtn.click(); });
      expect(container.textContent).not.toContain('+ Add Chapter');
    });

    it('adds a new chapter row when "+ Add Chapter" is clicked', async () => {
      const campaign = { ...BASE_CAMPAIGN, chapters: [] };
      render({ campaign, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });

      await openChapters();
      
      expect(container.textContent).toContain('No chapters defined');
      
      const addBtn = findButton('+ Add Chapter');
      await act(async () => { addBtn.click(); });
      
      const inputs = container.querySelectorAll<HTMLInputElement>('input[data-testid="chapter-title-input"]');
      expect(inputs.length).toBe(1);
      expect(inputs[0].value).toBe('');
      expect(container.textContent).not.toContain('No chapters defined');
      
      const select = container.querySelector('select[data-testid="current-chapter-select"]') as HTMLSelectElement;
      expect(select).toBeDefined();
    });

    it('removes a chapter, shifts subsequent ones, and clears active chapter if deleted', async () => {
      const onSave = jest.fn() as any;
      const campaign = {
        ...BASE_CAMPAIGN,
        currentChapterId: 'ch-2',
        chapters: CHAPTER_TRIO,
      };
      render({ campaign, onSave, onCancel: jest.fn(), isNew: false });

      await openChapters();

      const removeBtn = container.querySelector('button[data-testid="remove-chapter-1"]') as HTMLButtonElement;
      await act(async () => { removeBtn.click(); });
      
      const inputs = container.querySelectorAll<HTMLInputElement>('input[data-testid="chapter-title-input"]');
      expect(inputs.length).toBe(2);
      expect(inputs[0].value).toBe('Arrival');
      expect(inputs[1].value).toBe('The Dungeon');
      
      await act(async () => { findButton('Save Campaign').click(); });
      expect(onSave).toHaveBeenCalledTimes(1);
      const savedCampaign = onSave.mock.calls[0][0] as Campaign;
      expect(savedCampaign.chapters).toEqual([
        { id: 'ch-1', title: 'Arrival', order: 0 },
        { id: 'ch-3', title: 'The Dungeon', order: 1 },
      ]);
      expect(savedCampaign.currentChapterId).toBeUndefined();
    });

    it('reorders chapters with move buttons and updates order index', async () => {
      const onSave = jest.fn() as any;
      const campaign = {
        ...BASE_CAMPAIGN,
        chapters: CHAPTER_TRIO,
      };
      render({ campaign, onSave, onCancel: jest.fn(), isNew: false });

      await openChapters();

      const moveUpBtn = container.querySelector('button[data-testid="move-up-1"]') as HTMLButtonElement;
      await act(async () => { moveUpBtn.click(); });
      
      let inputs = container.querySelectorAll<HTMLInputElement>('input[data-testid="chapter-title-input"]');
      expect(inputs[0].value).toBe('The Inn');
      expect(inputs[1].value).toBe('Arrival');
      expect(inputs[2].value).toBe('The Dungeon');
      
      const moveDownBtn = container.querySelector('button[data-testid="move-down-0"]') as HTMLButtonElement;
      await act(async () => { moveDownBtn.click(); });
      
      inputs = container.querySelectorAll<HTMLInputElement>('input[data-testid="chapter-title-input"]');
      expect(inputs[0].value).toBe('Arrival');
      expect(inputs[1].value).toBe('The Inn');
      expect(inputs[2].value).toBe('The Dungeon');
      
      await act(async () => { findButton('Save Campaign').click(); });
      expect(onSave).toHaveBeenCalledTimes(1);
      const savedCampaign = onSave.mock.calls[0][0] as Campaign;
      expect(savedCampaign.chapters).toEqual([
        { id: 'ch-1', title: 'Arrival', order: 0 },
        { id: 'ch-2', title: 'The Inn', order: 1 },
        { id: 'ch-3', title: 'The Dungeon', order: 2 },
      ]);
    });

    it('updates currentChapterId when a chapter is selected in active chapter select', async () => {
      const onSave = jest.fn() as any;
      const campaign = {
        ...BASE_CAMPAIGN,
        chapters: CHAPTER_PAIR,
      };
      render({ campaign, onSave, onCancel: jest.fn(), isNew: false });

      await openChapters();

      const select = container.querySelector('select[data-testid="current-chapter-select"]') as HTMLSelectElement;
      expect(select).toBeDefined();
      
      await act(async () => {
        select.value = 'ch-2';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      
      await act(async () => { findButton('Save Campaign').click(); });
      expect(onSave).toHaveBeenCalledTimes(1);
      const savedCampaign = onSave.mock.calls[0][0] as Campaign;
      expect(savedCampaign.currentChapterId).toBe('ch-2');
    });

    it('updates chapter title correctly when typing in the input field', async () => {
      const campaign = {
        ...BASE_CAMPAIGN,
        chapters: [
          { id: 'ch-1', title: 'Arrival', order: 0 },
        ],
      };
      render({ campaign, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      
      await openChapters();

      const input = container.querySelector('input[data-testid="chapter-title-input"]') as HTMLInputElement;
      expect(input.value).toBe('Arrival');
      
      await act(async () => {
        input.value = 'New Arrival';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      
      expect(input.value).toBe('New Arrival');
    });

    it('sets currentChapterId to undefined when active chapter is removed', async () => {
      const onSave = jest.fn() as any;
      const campaign = {
        ...BASE_CAMPAIGN,
        chapters: CHAPTER_PAIR,
        currentChapterId: 'ch-2',
      };
      render({ campaign, onSave, onCancel: jest.fn(), isNew: false });

      await openChapters();

      const removeBtn = container.querySelector('button[data-testid="remove-chapter-1"]') as HTMLButtonElement;
      expect(removeBtn).toBeDefined();
      
      await act(async () => { removeBtn.click(); });
      
      await act(async () => { findButton('Save Campaign').click(); });
      expect(onSave).toHaveBeenCalledTimes(1);
      const savedCampaign = onSave.mock.calls[0][0] as Campaign;
      expect(savedCampaign.currentChapterId).toBeUndefined();
    });
  });
});
