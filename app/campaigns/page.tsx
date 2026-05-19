'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { ErrorBanner, LoadingState, FormField, EditorShell, textInputClass } from '@/lib/components/ui';
import { Campaign } from '@/lib/types';

function CampaignsContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/campaigns');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      const data = await res.json();
      setCampaigns(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addCampaign = () => {
    setEditingCampaign({
      id: '',
      userId: '',
      name: '',
      moduleName: '',
      currentChapter: '',
      currentChapterOrder: 0,
      active: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setIsAdding(true);
  };

  const saveCampaign = async (campaign: Campaign) => {
    try {
      setError(null);
      const url = isAdding ? '/api/campaigns' : `/api/campaigns/${campaign.id}`;
      const method = isAdding ? 'POST' : 'PATCH';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save campaign');
      }
      await fetchCampaigns();
      setIsAdding(false);
      setEditingCampaign(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save campaign');
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      setError(null);
      const response = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete campaign');
      await fetchCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign');
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingCampaign(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Campaigns</h1>
        </div>

        <ErrorBanner message={error} />

        <button
          onClick={addCampaign}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded mb-6"
        >
          New Campaign
        </button>

        {editingCampaign && (
          <CampaignEditor
            key={editingCampaign.id || 'new'}
            campaign={editingCampaign}
            onSave={saveCampaign}
            onCancel={cancelEdit}
            isNew={isAdding}
          />
        )}

        {loading ? (
          <LoadingState label="Loading campaigns..." />
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-4">No campaigns yet.</p>
            <button
              onClick={addCampaign}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded text-lg font-semibold"
            >
              New Campaign
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-semibold">{campaign.name}</h2>
                      {campaign.active && (
                        <span className="bg-green-700 text-green-100 text-xs px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    {campaign.moduleName && (
                      <p className="text-gray-400 text-sm">{campaign.moduleName}</p>
                    )}
                    {campaign.currentChapter && (
                      <p className="text-gray-500 text-xs mt-1">{campaign.currentChapter}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingCampaign(campaign); setIsAdding(false); }}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCampaign(campaign.id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignEditor({
  campaign,
  onSave,
  onCancel,
  isNew,
}: {
  campaign: Campaign;
  onSave: (campaign: Campaign) => void;
  onCancel: () => void;
  isNew: boolean;
}) {
  const [name, setName] = useState(campaign.name);
  const [moduleName, setModuleName] = useState(campaign.moduleName);
  const [currentChapter, setCurrentChapter] = useState(campaign.currentChapter);
  const [currentChapterOrder, setCurrentChapterOrder] = useState(campaign.currentChapterOrder);
  const [active, setActive] = useState(campaign.active);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = async () => {
    setValidationError(null);
    if (!name.trim()) {
      setValidationError('Campaign name is required');
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...campaign, name: name.trim(), moduleName: moduleName.trim(), currentChapter: currentChapter.trim(), currentChapterOrder, active });
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorShell
      title={isNew ? 'Create Campaign' : 'Edit Campaign'}
      validationError={validationError}
      onSave={handleSave}
      onCancel={onCancel}
      saving={saving}
      canSave={!!name.trim()}
      saveLabel="Save Campaign"
    >
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <FormField label="Campaign Name *">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className={textInputClass()} disabled={saving} placeholder="e.g., Curse of Strahd" />
        </FormField>

        <FormField label="Module / Adventure">
          <input type="text" value={moduleName} onChange={(e) => setModuleName(e.target.value)}
            className={textInputClass()} disabled={saving} placeholder="e.g., Curse of Strahd" />
        </FormField>

        <FormField label="Current Chapter">
          <input type="text" value={currentChapter} onChange={(e) => setCurrentChapter(e.target.value)}
            className={textInputClass()} disabled={saving} placeholder="e.g., Chapter 4: The Sunken Temple" />
        </FormField>

        <FormField label="Chapter Order">
          <input type="number" value={currentChapterOrder} onChange={(e) => { const v = parseInt(e.target.value, 10); setCurrentChapterOrder(isNaN(v) ? 0 : v); }}
            className={textInputClass()} disabled={saving} min={0} />
        </FormField>
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)}
            disabled={saving} className="cursor-pointer" />
          <span className="text-sm font-semibold">Active</span>
        </label>
      </div>
    </EditorShell>
  );
}

export default function CampaignsPage() {
  return (
    <ProtectedRoute>
      <CampaignsContent />
    </ProtectedRoute>
  );
}
