"use client";

import { useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/lib/components/ProtectedRoute";

function MonsterImportContent() {
  const [error, setError] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/import/open5e", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "monsters" }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sync monsters");
      }

      const monsters = result?.monsters;
      if (
        !monsters ||
        typeof monsters.inserted !== "number" ||
        typeof monsters.skipped !== "number" ||
        typeof monsters.errors !== "number"
      ) {
        throw new Error("Unexpected sync response");
      }
      setSyncMessage(
        `Sync complete: ${monsters.inserted} inserted, ${monsters.skipped} skipped, ${monsters.errors} errors`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync monsters");
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Import Monsters</h1>
          <Link
            href="/monsters"
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            Back to Monsters
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            data-testid="import-error"
            className="p-4 bg-red-900 border border-red-700 rounded text-red-200 mb-6"
          >
            {error}
          </div>
        )}

        {syncMessage && (
          <div className="p-4 bg-green-900 border border-green-700 rounded text-green-200 mb-6">
            {syncMessage}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 max-w-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Sync from open5e</h2>
          <p className="text-gray-400 text-sm mb-6">
            Sync all monsters from the open5e API. Already-imported monsters
            will be skipped automatically.
          </p>

          <button
            onClick={handleSync}
            disabled={syncLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold"
          >
            {syncLoading ? "Syncing..." : "Sync from open5e"}
          </button>
        </div>

        <p className="text-gray-400 text-sm max-w-lg">
          Looking to upload a JSON file of monsters? Use the{" "}
          <Link href="/monsters" className="text-purple-400 underline">
            Import Monster(s)
          </Link>{" "}
          button on the Monster Library page.
        </p>
      </div>
    </div>
  );
}

export default function MonsterImportPage() {
  return (
    <ProtectedRoute>
      <MonsterImportContent />
    </ProtectedRoute>
  );
}
