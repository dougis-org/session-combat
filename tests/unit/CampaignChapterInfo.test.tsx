import React from 'react';
import { act } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { CampaignChapterInfo } from '@/lib/components/CampaignChapterInfo';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => { root.unmount(); });
  container.remove();
});

async function render(ui: React.ReactElement) {
  await act(async () => { root.render(ui); });
}

const CHAPTERS = [
  { id: 'ch1', title: 'The Siege of Sigil', order: 0 },
  { id: 'ch2', title: 'The Dark Forest', order: 1 },
];

describe('CampaignChapterInfo', () => {
  it('T2.1 — renders current chapter title when currentChapterId matches', async () => {
    await render(<CampaignChapterInfo chapters={CHAPTERS} currentChapterId="ch1" />);
    expect(container.textContent).toContain('The Siege of Sigil');
    expect(container.textContent).not.toContain('No chapter set');
  });

  it('T2.2 — renders fallback when currentChapterId is undefined', async () => {
    await render(<CampaignChapterInfo chapters={CHAPTERS} currentChapterId={undefined} />);
    expect(container.textContent).toContain('No chapter set');
  });

  it('T2.3 — renders fallback when currentChapterId references missing chapter', async () => {
    await render(<CampaignChapterInfo chapters={CHAPTERS} currentChapterId="ch-missing" />);
    expect(container.textContent).toContain('No chapter set');
  });

  it('renders with empty chapters array without crash', async () => {
    await render(<CampaignChapterInfo chapters={[]} currentChapterId={undefined} />);
    expect(container.textContent).toContain('No chapter set');
  });
});
