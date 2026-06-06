import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { CampaignEditor } from '@/app/campaigns/CampaignEditor';
import type { Campaign } from '@/lib/types';

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

function renderEditor(props: Partial<Parameters<typeof CampaignEditor>[0]> = {}) {
  return render(
    <CampaignEditor
      campaign={BASE_CAMPAIGN}
      onSave={jest.fn()}
      onCancel={jest.fn()}
      isNew={false}
      {...props}
    />
  );
}

async function openChapters(user: UserEvent) {
  if (!screen.queryByText('+ Add Chapter')) {
    await user.click(screen.getByRole('button', { name: /chapters/i }));
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
      renderEditor({ isNew: true });
      expect(screen.getByRole('heading', { level: 2, name: 'Create Campaign' })).toBeInTheDocument();
    });

    it('shows "Edit Campaign" title when not isNew', () => {
      renderEditor({ isNew: false });
      expect(screen.getByRole('heading', { level: 2, name: 'Edit Campaign' })).toBeInTheDocument();
    });

    it('populates name input from campaign', () => {
      renderEditor();
      expect(screen.getByLabelText('Campaign Name *')).toHaveValue('Test Campaign');
    });

    it('populates moduleName input from campaign', () => {
      renderEditor();
      expect(screen.getByLabelText('Module / Adventure')).toHaveValue('LMoP');
    });

    it('renders status dropdown with current value selected', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, status: 'on-hold' } });
      expect(screen.getByTestId('status-select')).toHaveValue('on-hold');
    });

    it('renders notes textarea with current value', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, notes: 'Party at level 5' } });
      expect(screen.getByTestId('notes-textarea')).toHaveValue('Party at level 5');
    });

    it('notes textarea has maxLength of 10000', () => {
      renderEditor();
      expect((screen.getByTestId('notes-textarea') as HTMLTextAreaElement).maxLength).toBe(10000);
    });

    it('renders character counter showing length/10000', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, notes: 'Hello' } });
      expect(screen.getByText('5/10000')).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('save button is disabled when name is empty', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, name: '' } });
      expect(screen.getByRole('button', { name: 'Save Campaign' })).toBeDisabled();
    });

    it('save button is enabled when name has content', () => {
      renderEditor();
      expect(screen.getByRole('button', { name: 'Save Campaign' })).not.toBeDisabled();
    });
  });

  describe('saving', () => {
    it('calls onSave with trimmed name', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      renderEditor({ onSave });
      await user.click(screen.getByRole('button', { name: 'Save Campaign' }));
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Campaign' }));
    });

    it('calls onSave with trimmed moduleName', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      renderEditor({ campaign: { ...BASE_CAMPAIGN, moduleName: '  DH  ' }, onSave });
      await user.click(screen.getByRole('button', { name: 'Save Campaign' }));
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ moduleName: 'DH' }));
    });

    it.each(['completed', 'on-hold'] as const)(
      'calls onSave with status %s when dropdown changes',
      async (status) => {
        const user = userEvent.setup();
        const onSave = jest.fn();
        renderEditor({ onSave });
        await user.selectOptions(screen.getByTestId('status-select'), status);
        await user.click(screen.getByRole('button', { name: 'Save Campaign' }));
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ status }));
      },
    );
  });

  describe('cancel', () => {
    it('calls onCancel when Cancel button clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();
      renderEditor({ onCancel });
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('legacy fields removed', () => {
    it('does not render currentChapter input', () => {
      renderEditor();
      expect(screen.queryByText(/Current Chapter/)).not.toBeInTheDocument();
    });

    it('does not render currentChapterOrder input', () => {
      renderEditor();
      expect(screen.queryByText(/Chapter Order/)).not.toBeInTheDocument();
    });
  });

  describe('chapters display', () => {
    it('renders chapter list when chapters present', () => {
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_TRIO } });
      expect(screen.getByDisplayValue('Arrival')).toBeInTheDocument();
      expect(screen.getByDisplayValue('The Inn')).toBeInTheDocument();
      expect(screen.getByDisplayValue('The Dungeon')).toBeInTheDocument();
    });

    it('save with no chapters calls onSave with chapters: []', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      renderEditor({ onSave });
      await user.click(screen.getByRole('button', { name: 'Save Campaign' }));
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ chapters: [] }));
    });
  });

  describe('chapters editing', () => {
    it('toggles chapters editing section when accordion button is clicked', async () => {
      const user = userEvent.setup();
      renderEditor();
      expect(screen.queryByText('+ Add Chapter')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /chapters/i }));
      expect(screen.getByText('+ Add Chapter')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /chapters/i }));
      expect(screen.queryByText('+ Add Chapter')).not.toBeInTheDocument();
    });

    it('adds a new chapter row when "+ Add Chapter" is clicked', async () => {
      const user = userEvent.setup();
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: [] } });

      await openChapters(user);

      expect(screen.getByText('No chapters defined')).toBeInTheDocument();

      await user.click(screen.getByText('+ Add Chapter'));

      const inputs = screen.getAllByTestId('chapter-title-input');
      expect(inputs.length).toBe(1);
      expect(inputs[0]).toHaveValue('');
      expect(screen.queryByText('No chapters defined')).not.toBeInTheDocument();
      expect(screen.getByTestId('current-chapter-select')).toBeInTheDocument();
    });

    it('removes a chapter, shifts subsequent ones, and clears active chapter if deleted', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      renderEditor({
        campaign: { ...BASE_CAMPAIGN, currentChapterId: 'ch-2', chapters: CHAPTER_TRIO },
        onSave,
      });

      await openChapters(user);

      await user.click(screen.getByTestId('remove-chapter-1'));

      const inputs = screen.getAllByTestId('chapter-title-input');
      expect(inputs.length).toBe(2);
      expect(inputs[0]).toHaveValue('Arrival');
      expect(inputs[1]).toHaveValue('The Dungeon');

      await user.click(screen.getByRole('button', { name: 'Save Campaign' }));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          chapters: [
            { id: 'ch-1', title: 'Arrival', order: 0 },
            { id: 'ch-3', title: 'The Dungeon', order: 1 },
          ],
          currentChapterId: undefined,
        })
      );
    });

    it('reorders chapters with move buttons and updates order index', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_TRIO }, onSave });

      await openChapters(user);

      await user.click(screen.getByTestId('move-up-1'));

      let inputs = screen.getAllByTestId('chapter-title-input');
      expect(inputs[0]).toHaveValue('The Inn');
      expect(inputs[1]).toHaveValue('Arrival');
      expect(inputs[2]).toHaveValue('The Dungeon');

      await user.click(screen.getByTestId('move-down-0'));

      inputs = screen.getAllByTestId('chapter-title-input');
      expect(inputs[0]).toHaveValue('Arrival');
      expect(inputs[1]).toHaveValue('The Inn');
      expect(inputs[2]).toHaveValue('The Dungeon');

      await user.click(screen.getByRole('button', { name: 'Save Campaign' }));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          chapters: [
            { id: 'ch-1', title: 'Arrival', order: 0 },
            { id: 'ch-2', title: 'The Inn', order: 1 },
            { id: 'ch-3', title: 'The Dungeon', order: 2 },
          ],
        })
      );
    });

    it('updates currentChapterId when a chapter is selected in active chapter select', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR }, onSave });

      await openChapters(user);

      expect(screen.getByTestId('current-chapter-select')).toBeInTheDocument();

      await user.selectOptions(screen.getByTestId('current-chapter-select'), 'ch-2');

      await user.click(screen.getByRole('button', { name: 'Save Campaign' }));
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ currentChapterId: 'ch-2' }));
    });

    it('updates chapter title correctly when typing in the input field', async () => {
      const user = userEvent.setup();
      renderEditor({ campaign: { ...BASE_CAMPAIGN, chapters: [{ id: 'ch-1', title: 'Arrival', order: 0 }] } });

      await openChapters(user);

      const input = screen.getByTestId('chapter-title-input');
      expect(input).toHaveValue('Arrival');

      await user.clear(input);
      await user.type(input, 'New Arrival');
      expect(input).toHaveValue('New Arrival');
    });

    it('sets currentChapterId to undefined when active chapter is removed', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      renderEditor({
        campaign: { ...BASE_CAMPAIGN, chapters: CHAPTER_PAIR, currentChapterId: 'ch-2' },
        onSave,
      });

      await openChapters(user);

      const removeBtn = screen.getByTestId('remove-chapter-1');
      expect(removeBtn).toBeInTheDocument();

      await user.click(removeBtn);

      await user.click(screen.getByRole('button', { name: 'Save Campaign' }));
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ currentChapterId: undefined }));
    });
  });
});
