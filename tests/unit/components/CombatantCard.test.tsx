/**
 * @jest-environment jsdom
 */
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Must be declared before any imports — ts-jest hoists these.
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement('a', { href, ...rest }, children),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { CombatantCard } from '@/app/combat/page';
import type { CombatantState, ActiveDamageEffect } from '@/lib/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE: CombatantState = {
  id: 'c1',
  name: 'Test Fighter',
  type: 'player',
  initiative: 10,
  conditions: [],
  hp: 30,
  maxHp: 30,
  ac: 15,
  abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => { root?.unmount(); });
  container.remove();
});

function render(combatant: CombatantState, onUpdate: ReturnType<typeof jest.fn>) {
  act(() => {
    root = createRoot(container);
    root.render(
      <CombatantCard
        combatant={combatant}
        isActive={false}
        onUpdate={onUpdate as any}
        onRemove={jest.fn() as any}
      />
    );
  });
}

/** Render a combatant that has at least one damage modifier (fire resistance)
 *  so the effects panel controls are visible. Returns the onUpdate mock. */
function renderWithModifiers(
  overrides: Partial<CombatantState> = {},
  onUpdate: ReturnType<typeof jest.fn> = jest.fn(),
): ReturnType<typeof jest.fn> {
  render({ ...BASE, damageResistances: ['fire'], ...overrides }, onUpdate);
  return onUpdate;
}

/** renderWithModifiers + open the effects panel. Returns the onUpdate mock. */
function openPanel(
  overrides: Partial<CombatantState> = {},
  onUpdate: ReturnType<typeof jest.fn> = jest.fn(),
): ReturnType<typeof jest.fn> {
  renderWithModifiers(overrides, onUpdate);
  act(() => { findButton('+ Add effect').click(); });
  return onUpdate;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findButton(text: string): HTMLButtonElement {
  return Array.from(container.querySelectorAll('button')).find(
    b => b.textContent?.trim().includes(text),
  ) as HTMLButtonElement;
}

function clickAddEffect() {
  act(() => { findButton('+ Add effect').click(); });
}

// ---------------------------------------------------------------------------
// Rendering: derived stats badges
// ---------------------------------------------------------------------------

describe('CombatantCard – stat damage modifier badges', () => {
  test('renders without crash for base combatant', () => {
    render(BASE, jest.fn());
    expect(container.querySelector('h3')?.textContent).toContain('Test Fighter');
  });

  test('no damage modifier section shown when no resistances/effects', () => {
    render(BASE, jest.fn());
    expect(container.textContent).not.toContain('IMM:');
    expect(container.textContent).not.toContain('RES:');
    expect(container.textContent).not.toContain('VULN:');
  });

  test('shows immunity badge for each stat immunity', () => {
    render({ ...BASE, damageImmunities: ['fire', 'poison'] }, jest.fn());
    expect(container.textContent).toContain('IMM: fire');
    expect(container.textContent).toContain('IMM: poison');
  });

  test('shows resistance badge for each stat resistance', () => {
    render({ ...BASE, damageResistances: ['cold', 'bludgeoning'] }, jest.fn());
    expect(container.textContent).toContain('RES: cold');
    expect(container.textContent).toContain('RES: bludgeoning');
  });

  test('shows vulnerability badge for each stat vulnerability', () => {
    render({ ...BASE, damageVulnerabilities: ['fire'] }, jest.fn());
    expect(container.textContent).toContain('VULN: fire');
  });

  test('shows active effect badge with label and remove button', () => {
    const activeEffects: ActiveDamageEffect[] = [
      { type: 'slashing', kind: 'resistance', label: 'Rage' },
    ];
    render({ ...BASE, activeDamageEffects: activeEffects }, jest.fn());
    expect(container.textContent).toContain('RES: slashing');
    const removeBtn = container.querySelector('button[aria-label="Remove Rage"]');
    expect(removeBtn).not.toBeNull();
  });

  test('active effect badge shows IMM prefix for immunity kind', () => {
    const activeEffects: ActiveDamageEffect[] = [
      { type: 'necrotic', kind: 'immunity', label: 'Undead Immunity' },
    ];
    render({ ...BASE, activeDamageEffects: activeEffects }, jest.fn());
    expect(container.textContent).toContain('IMM: necrotic');
  });

  test('active effect badge shows VULN prefix for vulnerability kind', () => {
    const activeEffects: ActiveDamageEffect[] = [
      { type: 'radiant', kind: 'vulnerability', label: 'Light Sensitivity' },
    ];
    render({ ...BASE, activeDamageEffects: activeEffects }, jest.fn());
    expect(container.textContent).toContain('VULN: radiant');
  });
});

// ---------------------------------------------------------------------------
// "+ Add effect" button – visible even with no modifiers when clicked
// ---------------------------------------------------------------------------

describe('CombatantCard – effects panel toggle', () => {
  test('no effects panel shown by default when no modifiers', () => {
    render(BASE, jest.fn());
    expect(container.textContent).not.toContain('Apply a combat damage effect');
    expect(container.textContent).not.toContain('+ Add effect');
  });

  test('+ Add effect button visible when stat modifiers present', () => {
    renderWithModifiers();
    expect(findButton('+ Add effect')).not.toBeNull();
  });

  test('clicking + Add effect shows preset panel', () => {
    openPanel();
    expect(container.textContent).toContain('Apply a combat damage effect');
  });

  test('clicking Hide effects collapses panel', () => {
    openPanel();
    act(() => { findButton('Hide effects').click(); });
    expect(container.textContent).not.toContain('Apply a combat damage effect');
  });
});

// ---------------------------------------------------------------------------
// Preset picker
// ---------------------------------------------------------------------------

describe('CombatantCard – preset application', () => {
  test('preset panel lists Rage preset', () => {
    openPanel();
    expect(container.textContent).toContain('Rage');
  });

  test('clicking Rage preset calls onUpdate with B/P/S resistances', () => {
    const onUpdate = openPanel();
    act(() => { findButton('Rage').click(); });
    const arg = (onUpdate as jest.Mock).mock.calls[0][0] as { activeDamageEffects: ActiveDamageEffect[] };
    const types = arg.activeDamageEffects.map(e => e.type);
    expect(types).toContain('bludgeoning');
    expect(types).toContain('piercing');
    expect(types).toContain('slashing');
  });

  test('clicking Rage preset closes the effects panel', () => {
    openPanel();
    act(() => { findButton('Rage').click(); });
    expect(container.textContent).not.toContain('Apply a combat damage effect');
  });

  test('clicking Protection from Energy opens type picker', () => {
    openPanel();
    act(() => { findButton('Protection from Energy').click(); });
    expect(container.textContent).toContain('Protection from Energy: choose a damage type');
  });

  test('type picker for Protection from Energy only shows elemental choices', () => {
    openPanel();
    act(() => { findButton('Protection from Energy').click(); });
    expect(findButton('fire')).not.toBeNull();
    expect(findButton('acid')).not.toBeNull();
    // bludgeoning is NOT a valid choice for Protection from Energy
    expect(findButton('bludgeoning')).toBeUndefined();
  });

  test('selecting a type in the picker calls onUpdate with the chosen effect', () => {
    const onUpdate = openPanel();
    act(() => { findButton('Protection from Energy').click(); });
    act(() => { findButton('cold').click(); });
    const arg = (onUpdate as jest.Mock).mock.calls[0][0] as { activeDamageEffects: ActiveDamageEffect[] };
    expect(arg.activeDamageEffects.some(e => e.type === 'cold' && e.kind === 'resistance')).toBe(true);
  });

  test('selecting a type closes both the picker and the panel', () => {
    openPanel();
    act(() => { findButton('Protection from Energy').click(); });
    act(() => { findButton('fire').click(); });
    expect(container.textContent).not.toContain('choose a damage type');
    expect(container.textContent).not.toContain('Apply a combat damage effect');
  });

  test('clicking Back in the type picker returns to preset list', () => {
    openPanel();
    act(() => { findButton('Protection from Energy').click(); });
    act(() => { findButton('← Back').click(); });
    expect(container.textContent).toContain('Apply a combat damage effect');
    expect(container.textContent).not.toContain('choose a damage type');
  });

  test('Absorb Elements (unconstrained) offers all 13 damage types in picker', () => {
    openPanel();
    act(() => { findButton('Absorb Elements').click(); });
    const allTypes = ['acid','bludgeoning','cold','fire','force','lightning','necrotic','piercing','poison','psychic','radiant','slashing','thunder'];
    allTypes.forEach(t => { expect(findButton(t)).not.toBeNull(); });
  });
});

// ---------------------------------------------------------------------------
// Remove active effect
// ---------------------------------------------------------------------------

describe('CombatantCard – remove active effect', () => {
  test('clicking remove button calls onUpdate with effect removed', () => {
    const onUpdate = jest.fn();
    const activeEffects: ActiveDamageEffect[] = [
      { type: 'cold', kind: 'resistance', label: 'Fire Shield' },
    ];
    render({ ...BASE, activeDamageEffects: activeEffects }, onUpdate);
    const removeBtn = container.querySelector('button[aria-label="Remove Fire Shield"]') as HTMLButtonElement;
    act(() => { removeBtn.click(); });
    expect(onUpdate).toHaveBeenCalled();
    const arg = (onUpdate as jest.Mock).mock.calls[0][0] as { activeDamageEffects: ActiveDamageEffect[] };
    expect(arg.activeDamageEffects).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Damage type select
// ---------------------------------------------------------------------------

describe('CombatantCard – damage type select', () => {
  test('damage type select renders with grouped options', () => {
    render(BASE, jest.fn());
    const select = container.querySelector('select[aria-label="Damage type (for resistance/immunity/vulnerability)"]');
    expect(select).not.toBeNull();
    const optgroups = select?.querySelectorAll('optgroup');
    expect(optgroups?.length).toBe(4); // Physical, Elemental, Energy & Planar, Other
  });

  test('damage type select has empty default option', () => {
    render(BASE, jest.fn());
    const select = container.querySelector('select[aria-label="Damage type (for resistance/immunity/vulnerability)"]') as HTMLSelectElement;
    expect(select.value).toBe('');
  });

  test('Damage button applies typed damage when type is selected', () => {
    const onUpdate = jest.fn();
    // combatant with fire immunity — fire damage should deal 0
    render({ ...BASE, hp: 30, damageImmunities: ['fire'] }, onUpdate);

    // Set HP input value to 10
    const hpInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    act(() => {
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      nativeSetter.call(hpInput, '10');
      hpInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Set damage type to fire (using native setter)
    const dmgSelect = container.querySelector('select[aria-label="Damage type (for resistance/immunity/vulnerability)"]') as HTMLSelectElement;
    act(() => {
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!;
      nativeSetter.call(dmgSelect, 'fire');
      dmgSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Click Damage
    act(() => { findButton('Damage').click(); });

    expect(onUpdate).toHaveBeenCalled();
    const arg = (onUpdate as jest.Mock).mock.calls[0][0] as { hp: number; tempHp: number };
    // Fire immunity → 0 effective damage → hp stays at 30
    expect(arg.hp).toBe(30);
  });

  test('Damage button applies untyped damage when no type selected', () => {
    const onUpdate = jest.fn();
    render({ ...BASE, hp: 30 }, onUpdate);

    const hpInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    act(() => {
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      nativeSetter.call(hpInput, '10');
      hpInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    act(() => { findButton('Damage').click(); });

    expect(onUpdate).toHaveBeenCalled();
    const arg = (onUpdate as jest.Mock).mock.calls[0][0] as { hp: number; tempHp: number };
    expect(arg.hp).toBe(20); // 30 - 10 = 20
  });
});
