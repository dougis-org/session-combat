import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

afterEach(() => {
  jest.clearAllMocks();
});

function renderEditor(overrides: Partial<Campaign> = {}, extraProps: { isNew?: boolean } = {}) {
  const user = userEvent.setup();
  const onSave = jest.fn();
  const onCancel = jest.fn();
  render(
    <CampaignEditor
      campaign={{ ...BASE_CAMPAIGN, ...overrides }}
      onSave={onSave}
      onCancel={onCancel}
      isNew={extraProps.isNew ?? false}
    />
  );
  return { onSave, onCancel, user };
}

async function openChapters(user: ReturnType<typeof userEvent.setup>) {
  if (!screen.queryByRole('button', { name: /add chapter/i })) {
    await user.click(screen.getByRole('button', { name: /chapters \(\d+\)/i }));
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
      renderEditor({}, { isNew: true });
      expect(screen.getByRole('heading', { name: 'Create Campaign' })).toBeInTheDocument();
    });

    it('shows "Edit Campaign" title when not isNew', () => {
      renderEditor();
      expect(screen.getByRole('heading', { name: 'Edit Campaign' })).toBeInTheDocument();
    });

    it('populates name input from campaign', () => {
      renderEditor();
      expect(screen.getByRole('textbox', { name: /campaign name/i })).toHaveValue('Test Campaign');
    });

    it('populates moduleName input from campaign', () => {
      renderEditor();
      expect(screen.getByRole('textbox', { name: /module \/ adventure/i })).toHaveValue('LMoP');
    });

    it('renders status dropdown with current value selected', () => {
      renderEditor({ status: 'on-hold' });
      expect(screen.getByTestId('status-select')).toHaveValue('on-hold');
    });

    it('renders notes textarea with current value', () => {
      renderEditor({ notes: 'Party at level 5' });
      expect(screen.getByTestId('notes-textarea')).toHaveValue('Party at level 5');
    });

    it('notes textarea has maxLength of 10000', () => {
      renderEditor();
      expect(screen.getByTestId('notes-textarea')).toHaveAttribute('maxLength', '10000');
    });

    it('renders character counter showing length/10000', () => {
      renderEditor({ notes: 'Hello' });
      expect(screen.getByText('5/10000')).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('save button is disabled when name is empty', () => {
      renderEditor({ name: '' });
      expect(screen.getByRole('button', { name: /save campaign/i })).toBeDisabled();
    });

    it('save button is enabled when name has content', () => {
      renderEditor();
      expect(screen.getByRole('button', { name: /save campaign/i })).not.toBeDisabled();
    });
  });

  describe('saving', () => {
    it('calls onSave with trimmed name', async () => {
      const { onSave, user } = renderEditor();
      await user.click(screen.getByRole('button', { name: /save campaign/i }));
      expect(onSave).toHaveBeenCalledTimes(1);
      expect((onSave.mock.calls[0][0] as Campaign).name).toBe('Test Campaign');
    });

    it('calls onSave with trimmed moduleName', async () => {
      const { onSave, user } = renderEditor({ moduleName: '  DH  ' });
      await user.click(screen.getByRole('button', { name: /save campaign/i }));
      expect((onSave.mock.calls[0][0] as Campaign).moduleName).toBe('DH');
    });

    it('calls onSave with updated status when dropdown changes', async () => {
      const { onSave, user } = renderEditor();
      await user.selectOptions(screen.getByTestId('status-select'), 'completed');
      await user.click(screen.getByRole('button', { name: /save campaign/i }));
      expect((onSave.mock.calls[0][0] as Campaign).status).toBe('completed');
    });

    it('calls onSave with on-hold status when dropdown changes to on-hold', async () => {
      const { onSave, user } = renderEditor();
      await user.selectOptions(screen.getByTestId('status-select'), 'on-hold');
      await user.click(screen.getByRole('button', { name: /save campaign/i }));
      expect((onSave.mock.calls[0][0] as Campaign).status).toBe('on-hold');
    });
  });

  describe('cancel', () => {
    it('calls onCancel when Cancel button clicked', async () => {
      const { onCancel, user } = renderEditor();
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('legacy fields removed', () => {
    it('does not render currentChapter input', () => {
      renderEditor();
      expect(screen.queryByText(/current chapter/i)).not.toBeInTheDocument();
    });

    it('does not render currentChapterOrder input', () => {
      renderEditor();
      expect(screen.queryByText(/chapter order/i)).not.toBeInTheDocument();
    });
  });

  describe('chapters display', () => {
    it('renders chapter list when chapters present', () => {
      renderEditor({ chapters: CHAPTER_TRIO });
      expect(screen.getByDisplayValue('Arrival')).toBeInTheDocument();
      expect(screen.getByDisplayValue('The Inn')).toBeInTheDocument();
      expect(screen.getByDisplayValue('The Dungeon')).toBeInTheDocument();
    });

    it('save with no chapters calls onSave with chapters: []', async () => {
      const { onSave, user } = renderEditor();
      await user.click(screen.getByRole('button', { name: /save campaign/i }));
      expect(onSave).toHaveBeenCalledTimes(1);
      expect((onSave.mock.calls[0][0] as Campaign).chapters).toEqual([]);
    });
  });

  describe('chapters editing', () => {
    it('toggles chapters editing section when accordion button is clicked', async () => {
      const { user } = renderEditor();
      expect(screen.queryByRole('button', { name: /add chapter/i })).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /chapters \(\d+\)/i }));
      expect(screen.getByRole('button', { name: /add chapter/i })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /chapters \(\d+\)/i }));
      expect(screen.queryByRole('button', { name: /add chapter/i })).not.toBeInTheDocument();
    });

    it('adds a new chapter row when "+ Add Chapter" is clicked', async () => {
      const { user } = renderEditor({ chapters: [] });
      await openChapters(user);
      expect(screen.getByText('No chapters defined')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /add chapter/i }));
      const inputs = screen.getAllByRole('textbox', { name: /chapter \d+ title/i });
      expect(inputs).toHaveLength(1);
      expect(inputs[0]).toHaveValue('');
      expect(screen.queryByText('No chapters defined')).not.toBeInTheDocument();
      expect(screen.getByTestId('current-chapter-select')).toBeInTheDocument();
    });

    it('removes a chapter, shifts subsequent ones, and clears active chapter if deleted', async () => {
      const { onSave, user } = renderEditor({ chapters: CHAPTER_TRIO, currentChapterId: 'ch-2' });
      await openChapters(user);
      await user.click(screen.getByRole('button', { name: /remove the inn/i }));
      expect(screen.getByRole('textbox', { name: /chapter 1 title/i })).toHaveValue('Arrival');
      expect(screen.getByRole('textbox', { name: /chapter 2 title/i })).toHaveValue('The Dungeon');
      await user.click(screen.getByRole('button', { name: /save campaign/i }));
      expect(onSave).toHaveBeenCalledTimes(1);
      const saved = onSave.mock.calls[0][0] as Campaign;
      expect(saved.chapters).toEqual([
        { id: 'ch-1', title: 'Arrival', order: 0 },
        { id: 'ch-3', title: 'The Dungeon', order: 1 },
      ]);
      expect(saved.currentChapterId).toBeUndefined();
    });

    it('reorders chapters with move buttons and updates order index', async () => {
      const { onSave, user } = renderEditor({ chapters: CHAPTER_TRIO });
      await openChapters(user);
      await user.click(screen.getByRole('button', { name: /move chapter 2 up/i }));
      expect(screen.getByRole('textbox', { name: /chapter 1 title/i })).toHaveValue('The Inn');
      expect(screen.getByRole('textbox', { name: /chapter 2 title/i })).toHaveValue('Arrival');
      await user.click(screen.getByRole('button', { name: /move chapter 1 down/i }));
      expect(screen.getByRole('textbox', { name: /chapter 1 title/i })).toHaveValue('Arrival');
      await user.click(screen.getByRole('button', { name: /save campaign/i }));
      expect(onSave).toHaveBeenCalledTimes(1);
      const saved = onSave.mock.calls[0][0] as Campaign;
      expect(saved.chapters).toEqual([
        { id: 'ch-1', title: 'Arrival', order: 0 },
        { id: 'ch-2', title: 'The Inn', order: 1 },
        { id: 'ch-3', title: 'The Dungeon', order: 2 },
      ]);
    });

    it('updates currentChapterId when a chapter is selected in active chapter select', async () => {
      const { onSave, user } = renderEditor({ chapters: CHAPTER_PAIR });
      await openChapters(user);
      await user.selectOptions(screen.getByTestId('current-chapter-select'), 'ch-2');
      await user.click(screen.getByRole('button', { name: /save campaign/i }));
      expect(onSave).toHaveBeenCalledTimes(1);
      expect((onSave.mock.calls[0][0] as Campaign).currentChapterId).toBe('ch-2');
    });

    it('updates chapter title correctly when typing in the input field', async () => {
      const { user } = renderEditor({ chapters: [{ id: 'ch-1', title: 'Arrival', order: 0 }] });
      await openChapters(user);
      const input = screen.getByRole('textbox', { name: /chapter 1 title/i });
      expect(input).toHaveValue('Arrival');
      await user.clear(input);
      await user.type(input, 'New Arrival');
      expect(input).toHaveValue('New Arrival');
    });

    it('sets currentChapterId to undefined when active chapter is removed', async () => {
      const { onSave, user } = renderEditor({ chapters: CHAPTER_PAIR, currentChapterId: 'ch-2' });
      await openChapters(user);
      await user.click(screen.getByRole('button', { name: /remove the inn/i }));
      await user.click(screen.getByRole('button', { name: /save campaign/i }));
      expect(onSave).toHaveBeenCalledTimes(1);
      expect((onSave.mock.calls[0][0] as Campaign).currentChapterId).toBeUndefined();
    });
  });
});
