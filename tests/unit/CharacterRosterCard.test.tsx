/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import React from 'react';
import { act } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { CharacterRosterCard } from '@/lib/components/CharacterRosterCard';

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

describe('CharacterRosterCard', () => {
  it('T1.1 — PC renders name, race, class/level; AC and HP absent', async () => {
    await render(
      <CharacterRosterCard
        name="Aria"
        race="Elf"
        characterType="character"
        classes={[{ class: 'Wizard', level: 5 }]}
      />
    );
    expect(container.textContent).toContain('Aria');
    expect(container.textContent).toContain('Elf');
    expect(container.textContent).toContain('Wizard');
    expect(container.textContent).toContain('Lv 5');
    expect(container.textContent).not.toContain('NPC');
    expect(container.textContent).not.toContain('Companion');
    expect(container.innerHTML).not.toMatch(/\bAC\b/);
    expect(container.innerHTML).not.toMatch(/\bHP\b/);
  });

  it('T1.2 — NPC renders "NPC" badge alongside name', async () => {
    await render(<CharacterRosterCard name="Mira" characterType="npc" classes={[]} />);
    expect(container.textContent).toContain('Mira');
    expect(container.textContent).toContain('NPC');
    expect(container.textContent).not.toContain('Companion');
  });

  it('T1.3 — Companion renders "Companion" badge alongside name', async () => {
    await render(<CharacterRosterCard name="Rex" characterType="companion" classes={[]} />);
    expect(container.textContent).toContain('Rex');
    expect(container.textContent).toContain('Companion');
    expect(container.textContent).not.toContain('NPC');
  });

  it('T1.4 — Character with no classes renders without crash; no class/level line shown', async () => {
    await render(<CharacterRosterCard name="Barnaby" race="Human" classes={[]} />);
    expect(container.textContent).toContain('Barnaby');
    expect(container.textContent).toContain('Human');
    expect(container.textContent).not.toContain('Lv');
  });

  it('T1.5 — Character with undefined race renders "—"', async () => {
    await render(
      <CharacterRosterCard name="Mira" classes={[{ class: 'Rogue', level: 3 }]} />
    );
    expect(container.textContent).toContain('Mira');
    expect(container.textContent).toContain('—');
    expect(container.textContent).toContain('Lv 3');
  });

  it('multiclass — sums levels correctly', async () => {
    await render(
      <CharacterRosterCard
        name="Zara"
        race="Tiefling"
        classes={[{ class: 'Warlock', level: 3 }, { class: 'Sorcerer', level: 2 }]}
      />
    );
    expect(container.textContent).toContain('Lv 5');
    expect(container.textContent).toContain('Warlock');
    expect(container.textContent).toContain('Sorcerer');
  });
});
