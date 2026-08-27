'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Modal } from './Modal';
import { Campaign } from '@/lib/types';

export function ActiveCampaignBanner() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!sessionStorage.getItem('dismissed-campaign-banner');
    }
    return false;
  });
  const [loading, setLoading] = useState(() => !dismissed);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    let isMounted = true;
    
    fetch('/api/campaigns')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          const activeCampaigns = (data.campaigns || []).filter(
            (c: Campaign) => c.status === 'active'
          );
          setCampaigns(activeCampaigns);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to fetch campaigns for banner:', err);
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('dismissed-campaign-banner', 'true');
  };

  if (dismissed || loading || error || campaigns.length === 0) {
    return null;
  }

  const isSingle = campaigns.length === 1;

  return (
    <div className="bg-blue-900/40 border border-blue-500/50 rounded-lg p-3 mb-4 flex items-center justify-between shadow-sm">
      <div className="flex-1">
        {isSingle ? (
          <div className="flex items-center space-x-2 text-sm text-blue-100">
            <span>
              <strong>{campaigns[0].name}</strong> is in-progress.
            </span>
            <Link 
              href={`/campaigns/${encodeURIComponent(campaigns[0].id)}/combat`}
              className="text-blue-300 hover:text-blue-200 underline inline-flex items-center"
            >
              Resume campaign <svg className="ml-1 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between text-sm text-blue-100">
            <span>You have {campaigns.length} in-progress campaigns.</span>
            <button
              onClick={() => setShowModal(true)}
              className="text-blue-300 hover:text-blue-200 underline ml-2"
            >
              View campaigns
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="text-blue-400 hover:text-blue-200 ml-4 p-1 rounded hover:bg-blue-800/50 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Active Campaigns"
        >
          <div className="space-y-3 mt-4">
            <p className="text-sm text-zinc-400 mb-2">
              Select a campaign to resume combat:
            </p>
            {campaigns.map((camp) => (
              <Link
                key={camp.id}
                href={`/campaigns/${encodeURIComponent(camp.id)}/combat`}
                className="block p-3 rounded bg-zinc-800 border border-zinc-700 hover:border-blue-500 transition-colors"
              >
                <div className="font-medium">{camp.name}</div>
              </Link>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
