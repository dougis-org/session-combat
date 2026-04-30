"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/lib/components/ProtectedRoute";
import { SpellTemplate, DnDSpellSchool, VALID_SPELL_SCHOOLS } from "@/lib/types";

function SpellsContent() {
  const [spells, setSpells] = useState<SpellTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [filterSchool, setFilterSchool] = useState<DnDSpellSchool | "">("");
  const [filterConcentration, setFilterConcentration] = useState(false);

  useEffect(() => {
    fetchSpells();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin === true);
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
    }
  };

  const fetchSpells = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/spells");
      if (!response.ok) throw new Error("Failed to fetch spells");
      const data = await response.json();
      setSpells(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredSpells = spells.filter((spell) => {
    if (filterText && !spell.name.toLowerCase().includes(filterText.toLowerCase())) {
      return false;
    }
    if (filterSchool && spell.school !== filterSchool) {
      return false;
    }
    if (filterConcentration && !spell.concentration) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Spell Library</h1>
          <div className="flex gap-2">
            {isAdmin && (
              <Link
                href="/spells/import"
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
              >
                Import Spells
              </Link>
            )}
            <Link href="/" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
              Back to Home
            </Link>
          </div>
        </div>

        {isAdmin && (
          <div className="mb-6 p-4 bg-blue-900 border border-blue-700 rounded text-blue-200">
            Admin Mode: You can manage spell templates
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-900 border border-red-700 rounded text-red-200 mb-6">
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter by name..."
            aria-label="Filter spells by name"
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          <select
            value={filterSchool}
            onChange={(e) =>
              setFilterSchool(e.target.value as DnDSpellSchool | "")
            }
            aria-label="Filter spells by school"
            className="sm:w-48 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">All schools</option>
            {VALID_SPELL_SCHOOLS.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 sm:w-48 bg-gray-800 border border-gray-600 rounded px-3 py-2">
            <input
              type="checkbox"
              checked={filterConcentration}
              onChange={(e) => setFilterConcentration(e.target.checked)}
              className="bg-gray-700"
            />
            <span>Concentration</span>
          </label>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading spells...</p>
          </div>
        ) : filteredSpells.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {spells.length === 0
              ? "No spells yet. Import from open5e to get started."
              : "No spells match your filter."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpells.map((spell) => (
              <SpellCard key={spell.id} spell={spell} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SpellCard({
  spell,
  isAdmin,
}: {
  spell: SpellTemplate;
  isAdmin: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">{spell.name}</h3>
            {spell.concentration && (
              <span className="px-2 py-1 bg-yellow-600 text-xs rounded">
                C
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            Level {spell.level} {spell.school}
          </p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-white text-sm"
        >
          {showDetails ? "Hide" : "Show"} Details
        </button>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-700 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-400">Casting Time:</span>{" "}
              {spell.castingTime}
            </div>
            <div>
              <span className="text-gray-400">Range:</span> {spell.range}
            </div>
            <div>
              <span className="text-gray-400">Duration:</span>{" "}
              {spell.duration}
            </div>
            <div>
              <span className="text-gray-400">Components:</span>{" "}
              {[
                spell.components.verbal && "V",
                spell.components.somatic && "S",
                spell.components.material && "M",
              ]
                .filter(Boolean)
                .join(", ")}
            </div>
          </div>
          {spell.description && (
            <div className="mt-3">
              <span className="text-gray-400">Description:</span>
              <p className="mt-1 text-gray-300 whitespace-pre-wrap">
                {spell.description}
              </p>
            </div>
          )}
          {spell.higherLevel && (
            <div className="mt-3">
              <span className="text-gray-400">At Higher Levels:</span>
              <p className="mt-1 text-gray-300">{spell.higherLevel}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SpellsPage() {
  return (
    <ProtectedRoute>
      <SpellsContent />
    </ProtectedRoute>
  );
}
