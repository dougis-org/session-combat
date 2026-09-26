'use client';

import React from 'react';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { usePreferences } from '@/lib/preferences/usePreferences';
import {
  DICE_SURFACE_VALUES,
  DICE_MATERIAL_VALUES,
  HEX_COLOR,
  isValidPreferenceValue,
  type DiceSurface,
  type DiceMaterial,
} from '@/lib/preferences/schema';
import { NavBar } from '@/lib/components/NavBar';

const SURFACE_LABELS: Record<DiceSurface, string> = {
  default: 'Default',
  'blue-felt': 'Blue Felt',
  'red-felt': 'Red Felt',
  'green-felt': 'Green Felt',
  taverntable: 'Old Tavern Table',
  mahogany: 'Mahogany',
  stainless: 'Stainless Steel',
  cyberpunk: 'Cyberpunk',
  cagetown: 'Cage Town',
};

const MATERIAL_LABELS: Record<DiceMaterial, string> = {
  glass: 'Glass',
  none: 'Plastic',
  metal: 'Metal',
  wood: 'Wood',
};

export default function ProfilePage() {
  const { preferences, setPreference } = usePreferences();

  // Local drafts for the foreground/background hex fields: only a valid short hex (or
  // empty) commits to the preference store; anything else is held locally and flagged.
  const [foregroundDraft, setForegroundDraft] = React.useState<string | null>(null);
  const [backgroundDraft, setBackgroundDraft] = React.useState<string | null>(null);
  const storedColor = preferences.dice.color;
  const foregroundValue = foregroundDraft ?? storedColor?.foreground ?? '';
  const backgroundValue = backgroundDraft ?? storedColor?.background ?? '';
  // Exactly one field filled (and otherwise hex-valid) is also invalid: isValidDiceColor
  // requires both fields or neither, with no partial repair — without this, that state
  // silently fails to commit with no visible feedback.
  const pairIncomplete = (foregroundValue === '') !== (backgroundValue === '');
  const foregroundInvalid =
    (foregroundValue !== '' && !HEX_COLOR.test(foregroundValue)) ||
    (pairIncomplete && foregroundValue === '');
  const backgroundInvalid =
    (backgroundValue !== '' && !HEX_COLOR.test(backgroundValue)) ||
    (pairIncomplete && backgroundValue === '');

  const commitColor = (foreground: string, background: string) => {
    if (foreground === '' && background === '') {
      setPreference('dice.color', null);
      return;
    }
    const candidate = { foreground, background };
    if (isValidPreferenceValue('dice.color', candidate)) setPreference('dice.color', candidate);
  };

  const onForegroundChange = (raw: string) => {
    const val = raw.trim();
    setForegroundDraft(val);
    commitColor(val, backgroundValue);
  };

  const onBackgroundChange = (raw: string) => {
    const val = raw.trim();
    setBackgroundDraft(val);
    commitColor(foregroundValue, val);
  };

  const inputClass = "w-full sm:w-64 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500";

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col bg-gray-950 text-gray-100">
        <NavBar />
        <main className="mx-auto w-full max-w-2xl flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8">
          <h1 className="mb-6 text-2xl font-bold">Profile & Settings</h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="mb-4 text-xl font-semibold border-b border-gray-800 pb-2">Dice Settings</h2>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                    checked={preferences.dice.sendToChat}
                    onChange={(e) => setPreference('dice.sendToChat', e.target.checked)}
                  />
                  <span className="text-gray-200">Auto-send rolls to session chat</span>
                </label>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="dice-animation" className="text-gray-200 block mb-1">Dice Animation</label>
                  <select
                    id="dice-animation"
                    className={inputClass}
                    value={preferences.dice.disableAnimation === null ? 'system' : preferences.dice.disableAnimation ? 'disabled' : 'enabled'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'system') setPreference('dice.disableAnimation', null);
                      else setPreference('dice.disableAnimation', val === 'disabled');
                    }}
                  >
                    <option value="system">System Default (Prefers Reduced Motion)</option>
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="dice-color-foreground" className="text-gray-200 block mb-1">Dice Color — Foreground (Hex)</label>
                  <input
                    id="dice-color-foreground"
                    type="text"
                    inputMode="text"
                    placeholder="e.g. #ffffff"
                    aria-invalid={foregroundInvalid}
                    aria-describedby={foregroundInvalid ? 'dice-color-foreground-error' : undefined}
                    className={`${inputClass} ${foregroundInvalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    value={foregroundValue}
                    onChange={(e) => onForegroundChange(e.target.value)}
                  />
                  {foregroundInvalid && (
                    <p id="dice-color-foreground-error" role="alert" className="text-sm text-red-400">
                      {pairIncomplete && foregroundValue === ''
                        ? 'Set both foreground and background, or clear both.'
                        : <>Enter a short hex colour like <code>#f00</code> or <code>#ff0000</code>.</>}
                    </p>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="dice-color-background" className="text-gray-200 block mb-1">Dice Color — Background (Hex)</label>
                  <input
                    id="dice-color-background"
                    type="text"
                    inputMode="text"
                    placeholder="e.g. #ff0000"
                    aria-invalid={backgroundInvalid}
                    aria-describedby={backgroundInvalid ? 'dice-color-background-error' : undefined}
                    className={`${inputClass} ${backgroundInvalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    value={backgroundValue}
                    onChange={(e) => onBackgroundChange(e.target.value)}
                  />
                  {backgroundInvalid && (
                    <p id="dice-color-background-error" role="alert" className="text-sm text-red-400">
                      {pairIncomplete && backgroundValue === ''
                        ? 'Set both foreground and background, or clear both.'
                        : <>Enter a short hex colour like <code>#f00</code> or <code>#ff0000</code>.</>}
                    </p>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="dice-surface" className="text-gray-200 block mb-1">Dice Surface</label>
                  <select
                    id="dice-surface"
                    className={inputClass}
                    value={preferences.dice.surface ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPreference('dice.surface', val === '' ? null : val);
                    }}
                  >
                    {/* Empty-string sentinel for "no preference" — 'default' is itself a real,
                        selectable engine theme (DICE_SURFACE_VALUES), so it can't double as this. */}
                    <option value="">No preference (engine default)</option>
                    {DICE_SURFACE_VALUES.map((v) => (
                      <option key={v} value={v}>{SURFACE_LABELS[v]}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="dice-material" className="text-gray-200 block mb-1">Dice Material</label>
                  <select
                    id="dice-material"
                    className={inputClass}
                    value={preferences.dice.material ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPreference('dice.material', val === '' ? null : val);
                    }}
                  >
                    <option value="">No preference (engine default)</option>
                    {DICE_MATERIAL_VALUES.map((v) => (
                      <option key={v} value={v}>{MATERIAL_LABELS[v]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold border-b border-gray-800 pb-2">Chat Settings</h2>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                    checked={preferences.chat.pinned}
                    onChange={(e) => setPreference('chat.pinned', e.target.checked)}
                  />
                  <span className="text-gray-200">Pin chat by default</span>
                </label>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold border-b border-gray-800 pb-2">Combat Settings</h2>

              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                    checked={preferences.combat.autoScrollToNextCombatant}
                    onChange={(e) => setPreference('combat.autoScrollToNextCombatant', e.target.checked)}
                  />
                  <span className="text-gray-200">Auto-scroll to next combatant</span>
                </label>
              </div>
            </section>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
