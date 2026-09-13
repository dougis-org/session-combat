import Link from 'next/link';
import { Campaign } from '@/lib/types';
import { CampaignCardHeader } from './CampaignCardHeader';

type Props =
  | { campaign: Campaign; memberStatus: 'active' }
  | {
      campaign: Campaign;
      memberStatus: 'invited';
      onAccept: (campaignId: string) => void;
      onDecline: (campaignId: string) => void;
    };

function roleBadgeClass(memberStatus: Props['memberStatus']): string {
  return memberStatus === 'invited' ? 'bg-yellow-600' : 'bg-blue-600';
}

function roleBadgeLabel(memberStatus: Props['memberStatus']): string {
  return memberStatus === 'invited' ? 'Invited' : 'Player';
}

/**
 * Lighter, non-DM campaign card for a caller with a `player` membership.
 * Active players get a link to the Session Log; invited players get inline
 * Accept/Decline instead of any navigation, since the detail page 404s for
 * non-active members (assertCampaignAccess). `onAccept`/`onDecline` are
 * required whenever `memberStatus` is `"invited"` so a caller can't render
 * inert buttons by forgetting to wire them.
 */
export function PlayerCampaignCard(props: Props) {
  const { campaign, memberStatus } = props;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <CampaignCardHeader campaign={campaign} />
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className={`px-2 py-0.5 text-xs rounded text-white flex-shrink-0 ${roleBadgeClass(memberStatus)}`}>
          {roleBadgeLabel(memberStatus)}
        </span>
        {memberStatus === 'invited' ? (
          <>
            <button
              type="button"
              onClick={() => props.onAccept(campaign.id)}
              aria-label={`Accept invitation to ${campaign.name}`}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => props.onDecline(campaign.id)}
              aria-label={`Decline invitation to ${campaign.name}`}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
            >
              Decline
            </button>
          </>
        ) : (
          <Link
            href={`/campaigns/${campaign.id}/sessions`}
            className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
          >
            Session Log
          </Link>
        )}
      </div>
    </div>
  );
}
