'use client';

import type { CombatantState } from '@/lib/types';
import { lifeStateDisplay } from '@/lib/combat/deathSaves';
import { healthBarColor } from '@/lib/components/combatant-card/healthBarColor';

interface CombatantCardHeaderProps {
  combatant: CombatantState;
  isActive: boolean;
  onNextTurn?: () => void;
  onShowDetails?: (combatantId: string, position: { top: number; left: number }, options?: { focusSection?: 'legendary' }) => void;
  onShowRemoveConfirm?: (combatantId: string, position: { top: number; left: number }) => void;
}

/**
 * Name, life-state badge, detail / remove / next-turn buttons, AC, HP readout,
 * and the legendary-action badge. Returns a fragment so the composition layer
 * keeps every header element as a direct child of the single header flex row.
 */
export function CombatantCardHeader({
  combatant,
  isActive,
  onNextTurn,
  onShowDetails,
  onShowRemoveConfirm,
}: CombatantCardHeaderProps) {
  const life = lifeStateDisplay(combatant);
  const lifeBadgeClass =
    combatant.lifeState === 'dying'
      ? 'bg-amber-800 text-amber-200'
      : combatant.lifeState === 'stable'
        ? 'bg-slate-700 text-slate-200'
        : combatant.lifeState === 'dead'
          ? 'bg-red-900 text-red-200'
          : 'bg-gray-700 text-gray-300';

  const tempHp = combatant.tempHp ?? 0;
  const hpColor = healthBarColor(combatant.hp, combatant.maxHp);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
            onShowDetails?.(combatant.id, { top: rect.bottom, left: rect.left });
          }}
          className="hover:opacity-80 transition-opacity"
          title={`See full ${combatant.type === 'player' ? 'Character' : 'Monster'} information`}
          type="button"
          data-testid="combatant-detail-toggle"
        >
          <svg className="w-5 h-5 text-gray-400 hover:text-gray-300 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h3 className="text-xl font-semibold">
          {combatant.name}
          {life.badge && (
            combatant.lifeState ? (
              <span className={`ml-2 align-middle text-xs px-2 py-0.5 rounded-full font-semibold ${lifeBadgeClass}`} data-testid="life-state-badge">
                {life.badge}
              </span>
            ) : (
              <span className="ml-1"> {life.badge}</span>
            )
          )}
        </h3>
        <button
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
            onShowRemoveConfirm?.(combatant.id, {
              top: rect.bottom + window.scrollY,
              left: rect.left + window.scrollX,
            });
          }}
          className="text-red-500 hover:text-red-400 text-xl leading-none"
          title="Remove combatant"
        >
          ✕
        </button>
        {isActive && onNextTurn && (
          <button
            onClick={onNextTurn}
            className="px-2 py-1 rounded text-xs bg-yellow-600 hover:bg-yellow-700 animate-pulse font-semibold"
          >
            Current Turn (done)
          </button>
        )}
      </div>
      {!isActive && <div className="w-40"></div>}
      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-400">AC</p>
        <p className="text-lg font-bold">{combatant.ac}</p>
      </div>
      <span className="text-sm text-gray-400 whitespace-nowrap">Hit Points:</span>
      <span className="text-lg font-bold">
        Current: <span className={hpColor === 'bg-green-500' ? 'text-green-500' : hpColor === 'bg-yellow-500' ? 'text-yellow-500' : 'text-red-500'}>{combatant.hp}</span> Max: {combatant.maxHp}{tempHp > 0 && <span className="text-blue-400"> +{tempHp} tmp</span>}
      </span>
      {(combatant.legendaryActionCount ?? 0) > 0 && (
        <button
          type="button"
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
            onShowDetails?.(combatant.id, {
              top: rect.bottom,
              left: rect.left,
            }, { focusSection: 'legendary' });
          }}
          className="text-sm font-semibold text-amber-400 whitespace-nowrap p-0 border-0 bg-transparent leading-none cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          data-testid="legendary-action-badge"
          aria-label={`${combatant.name} legendary actions: ${combatant.legendaryActionsRemaining ?? combatant.legendaryActionCount} of ${combatant.legendaryActionCount} remaining — open details`}
          title="Legendary actions — open details"
        >
          ⚡ {combatant.legendaryActionsRemaining ?? combatant.legendaryActionCount}/{combatant.legendaryActionCount}
        </button>
      )}
    </>
  );
}

/**
 * The initiative readout / setter. Kept in the header module (the header "owns"
 * initiative) but rendered as its own element so the composition layer can place
 * it at the end of the header row, after the HP controls, exactly as before.
 */
export function InitiativeControl({
  combatant,
  onSetInitiative,
}: {
  combatant: CombatantState;
  onSetInitiative?: (combatantId: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 ml-auto pr-4">
      <button
        onClick={() => onSetInitiative?.(combatant.id)}
        className="flex items-center gap-1 hover:opacity-80 cursor-pointer transition-opacity"
      >
        <p className="text-xs text-gray-400">Initiative</p>
        <p className="text-lg font-bold">{combatant.initiative}</p>
        {combatant.initiativeRoll && (
          <p className="text-xs text-gray-500 whitespace-nowrap">
            {combatant.initiativeRoll.method === 'rolled'
              ? [
                  combatant.initiativeRoll.advantage
                    ? `d20:${combatant.initiativeRoll.roll}↑${combatant.initiativeRoll.altRoll != null ? ` (dropped:${combatant.initiativeRoll.altRoll})` : ''}`
                    : `d20:${combatant.initiativeRoll.roll}`,
                  `+${combatant.initiativeRoll.bonus}`,
                  combatant.initiativeRoll.flatBonus
                    ? `${combatant.initiativeRoll.flatBonus > 0 ? '+' : ''}${combatant.initiativeRoll.flatBonus}`
                    : null,
                ].filter(Boolean).join('')
              : [
                  combatant.initiativeRoll.roll != null
                    ? String(combatant.initiativeRoll.roll)
                    : null,
                  combatant.initiativeRoll.bonus !== 0
                    ? `${combatant.initiativeRoll.bonus > 0 ? '+' : ''}${combatant.initiativeRoll.bonus}`
                    : null,
                  combatant.initiativeRoll.flatBonus
                    ? `${combatant.initiativeRoll.flatBonus > 0 ? '+' : ''}${combatant.initiativeRoll.flatBonus}`
                    : null,
                ].filter((part): part is string => part != null).join('') || 'Manual'}
          </p>
        )}
      </button>
    </div>
  );
}
