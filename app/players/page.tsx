'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { Player } from '@/lib/types';

function PlayersContent() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/players');
      if (!response.ok) throw new Error('Failed to fetch players');
      const data = await response.json();
      setPlayers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = () => {
    const newPlayer: Player = {
      id: '',
      userId: '',
      name: 'New Player',
      hp: 10,
      maxHp: 10,
      ac: 10,
      initiativeBonus: 0,
    };
    setEditingPlayer(newPlayer);
    setIsAdding(true);
  };

  const savePlayer = async (player: Player) => {
    try {
      setError(null);
      const url = isAdding ? '/api/players' : `/api/players/${player.id}`;
      const method = isAdding ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save player');
      }

      await fetchPlayers();
      setIsAdding(false);
      setEditingPlayer(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save player');
    }
  };

  const deletePlayer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this player?')) return;
    try {
      setError(null);
      const response = await fetch(`/api/players/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete player');
      await fetchPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete player');
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingPlayer(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Players</h1>
          <Link href="/" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
            Back to Home
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-900 border border-red-700 rounded text-red-200 mb-6">
            {error}
          </div>
        )}

        <button
          onClick={addPlayer}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded mb-6"
        >
          Add New Player
        </button>

        {editingPlayer && (
          <PlayerEditor
            player={editingPlayer}
            onSave={savePlayer}
            onCancel={cancelEdit}
            isNew={isAdding}
          />
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading players...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {players.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-400">
                No players yet. Create one to get started!
              </div>
            ) : (
              players.map(player => (
                <div key={player.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="text-xl font-semibold">{player.name}</h2>
                      <div className="text-gray-400 mt-2 space-y-1">
                        <p>HP: {player.hp}/{player.maxHp}</p>
                        <p>AC: {player.ac}</p>
                        <p>Initiative Bonus: {player.initiativeBonus >= 0 ? '+' : ''}{player.initiativeBonus}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPlayer(player);
                          setIsAdding(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePlayer(player.id)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerEditor({
  player,
  onSave,
  onCancel,
  isNew,
}: {
  player: Player;
  onSave: (player: Player) => void;
  onCancel: () => void;
  isNew: boolean;
}) {
  const [name, setName] = useState(player.name);
  const [hp, setHp] = useState(player.hp);
  const [maxHp, setMaxHp] = useState(player.maxHp);
  const [ac, setAc] = useState(player.ac);
  const [initiativeBonus, setInitiativeBonus] = useState(player.initiativeBonus);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...player,
        name,
        hp,
        maxHp,
        ac,
        initiativeBonus,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border-2 border-blue-500">
      <h2 className="text-2xl font-bold mb-4">{isNew ? 'Create Player' : 'Edit Player'}</h2>
      
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1 text-sm">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
          />
        </div>
        
        <div>
          <label className="block mb-1 text-sm">AC</label>
          <input
            type="number"
            value={ac}
            onChange={(e) => setAc(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Current HP</label>
          <input
            type="number"
            value={hp}
            onChange={(e) => setHp(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Max HP</label>
          <input
            type="number"
            value={maxHp}
            onChange={(e) => setMaxHp(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Initiative Bonus</label>
          <input
            type="number"
            value={initiativeBonus}
            onChange={(e) => setInitiativeBonus(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            disabled={saving}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
        >
          {saving ? 'Saving...' : 'Save Player'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PlayersPage() {
  return (
    <ProtectedRoute>
      <PlayersContent />
    </ProtectedRoute>
  );
}
