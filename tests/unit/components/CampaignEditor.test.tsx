/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

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
  active: false,
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

    it('renders active checkbox unchecked when campaign.active is false', () => {
      render({ campaign: BASE_CAMPAIGN, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      expect(getInput('checkbox').checked).toBe(false);
    });

    it('renders active checkbox checked when campaign.active is true', () => {
      render({ campaign: { ...BASE_CAMPAIGN, active: true }, onSave: jest.fn(), onCancel: jest.fn(), isNew: false });
      expect(getInput('checkbox').checked).toBe(true);
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

    it('calls onSave with toggled active value', async () => {
      const onSave = jest.fn() as any;
      render({ campaign: BASE_CAMPAIGN, onSave, onCancel: jest.fn(), isNew: false });
      act(() => { getInput('checkbox').click(); });
      await act(async () => { findButton('Save Campaign').click(); });
      expect((onSave.mock.calls[0][0] as Campaign).active).toBe(true);
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
});
