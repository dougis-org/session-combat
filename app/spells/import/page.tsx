"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/lib/components/ProtectedRoute";

function SpellImportContent() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();

  const handleSync = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/import/open5e", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "spells" }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sync spells");
      }

      const { spells } = result;
      setMessage({
        type: "success",
        text: `Sync complete: ${spells.inserted} inserted, ${spells.skipped} skipped, ${spells.errors} errors`,
      });

      setTimeout(() => router.push("/spells"), 2000);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to sync spells",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Import Spells</h1>
          <Link
            href="/spells"
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            Back to Spells
          </Link>
        </div>

        {message && (
          <div
            className={`p-4 border rounded mb-6 ${
              message.type === "success"
                ? "bg-green-900 border-green-700 text-green-200"
                : "bg-red-900 border-red-700 text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 max-w-lg">
          <h2 className="text-xl font-semibold mb-4">Sync from open5e</h2>
          <p className="text-gray-400 text-sm mb-6">
            Sync all spells from the open5e API. Already-imported spells will be
            skipped automatically.
          </p>

          <button
            onClick={handleSync}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold"
          >
            {loading ? "Syncing..." : "Sync from open5e"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SpellImportPage() {
  return (
    <ProtectedRoute>
      <SpellImportContent />
    </ProtectedRoute>
  );
}
