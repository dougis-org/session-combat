'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { storage } from '@/lib/storage';
import { Player } from '@/lib/types';

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const data = storage.load();
    setPlayers(data.players);
  }, []);

  const savePlayers = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    storage.savePlayers(newPlayers);
  };

  const addPlayer = () => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: 'New Player',
      hp: 10,
      maxHp: 10,
      ac: 10,
      initiativeBonus: 0,
    };
    setEditingPlayer(newPlayer);
    setIsAdding(true);
  };

  const savePlayer = (player: Player) => {
    if (isAdding) {
      savePlayers([...players, player]);
    } else {
      savePlayers(players.map(p => p.id === player.id ? player : p));
    }
    setIsAdding(false);
    setEditingPlayer(null);
  };

  const deletePlayer = (id: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      savePlayers(players.filter(p => p.id !== id));
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

        <button
          onClick={addPlayer}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded mb-6"
        >
          Add New Player
        </button>

        {editingPlayer && (
          <PlayerEditor
            player={editingPlayer}
            onSave={savePlayer}
            onCancel={cancelEdit}
          />
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {players.map(player => (
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
                    onClick={() => setEditingPlayer(player)}
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
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerEditor({
  player,
  onSave,
  onCancel,
}: {
  player: Player;
  onSave: (player: Player) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(player.name);
  const [hp, setHp] = useState(player.hp);
  const [maxHp, setMaxHp] = useState(player.maxHp);
  const [ac, setAc] = useState(player.ac);
  const [initiativeBonus, setInitiativeBonus] = useState(player.initiativeBonus);

  const handleSave = () => {
    onSave({
      ...player,
      name,
      hp,
      maxHp,
      ac,
      initiativeBonus,
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border-2 border-blue-500">
      <h2 className="text-2xl font-bold mb-4">Edit Player</h2>
      
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1 text-sm">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 rounded px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block mb-1 text-sm">AC</label>
          <input
            type="number"
            value={ac}
            onChange={(e) => setAc(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Current HP</label>
          <input
            type="number"
            value={hp}
            onChange={(e) => setHp(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Max HP</label>
          <input
            type="number"
            value={maxHp}
            onChange={(e) => setMaxHp(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">Initiative Bonus</label>
          <input
            type="number"
            value={initiativeBonus}
            onChange={(e) => setInitiativeBonus(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-700 rounded px-3 py-2"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          Save Player
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
