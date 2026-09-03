'use client';

import React from 'react';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { usePreferences } from '@/lib/preferences/usePreferences';
import { isValidPreferenceValue } from '@/lib/preferences/schema';
import { NavBar } from '@/lib/components/NavBar';

export default function ProfilePage() {
  const { preferences, setPreference } = usePreferences();

  // Local draft for the free-text colour field: only a valid short hex (or empty)
  // is pushed to the preference store; anything else is held locally and flagged.
  const [colorDraft, setColorDraft] = React.useState<string | null>(null);
  const storedColor = preferences.dice.color ?? '';
  const colorValue = colorDraft ?? storedColor;
  const colorInvalid = colorValue !== '' && !isValidPreferenceValue('dice.color', colorValue);

  const onColorChange = (raw: string) => {
    const val = raw.trim();
    setColorDraft(val);
    if (val === '') setPreference('dice.color', null);
    else if (isValidPreferenceValue('dice.color', val)) setPreference('dice.color', val);
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
                  <label htmlFor="dice-color" className="text-gray-200 block mb-1">Dice Color (Hex)</label>
                  <input
                    id="dice-color"
                    type="text"
                    inputMode="text"
                    placeholder="e.g. #ff0000"
                    aria-invalid={colorInvalid}
                    aria-describedby={colorInvalid ? 'dice-color-error' : undefined}
                    className={`${inputClass} ${colorInvalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    value={colorValue}
                    onChange={(e) => onColorChange(e.target.value)}
                  />
                  {colorInvalid && (
                    <p id="dice-color-error" role="alert" className="text-sm text-red-400">
                      Enter a short hex colour like <code>#f00</code> or <code>#ff0000</code>.
                    </p>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="dice-surface" className="text-gray-200 block mb-1">Dice Surface</label>
                  <select
                    id="dice-surface"
                    className={inputClass}
                    value={preferences.dice.surface || 'default'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPreference('dice.surface', val === 'default' ? null : val);
                    }}
                  >
                    <option value="default">Default</option>
                    <option value="wood">Wood</option>
                    <option value="metal">Metal</option>
                    <option value="stone">Stone</option>
                    <option value="felt">Felt</option>
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
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
