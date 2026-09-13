import { ReactNode } from 'react';
import { Campaign } from '@/lib/types';
import { CampaignChapterInfo } from './CampaignChapterInfo';

export function statusBadgeClass(status: Campaign['status'] | undefined): string {
  switch (status) {
    case 'planning': return 'bg-slate-600';
    case 'active': return 'bg-green-700';
    case 'on-hold': return 'bg-yellow-600';
    case 'completed': return 'bg-gray-600';
    default: return 'bg-green-700';
  }
}

export function statusLabel(status: Campaign['status'] | undefined): string {
  switch (status) {
    case 'planning': return 'Planning';
    case 'active': return 'Active';
    case 'on-hold': return 'On Hold';
    case 'completed': return 'Completed';
    default: return 'Active';
  }
}

interface Props {
  campaign: Campaign;
  /** Overrides the default chapter-info line (e.g. the management list's richer variant). */
  renderChapterInfo?: (campaign: Campaign) => ReactNode;
}

const defaultChapterInfo = (campaign: Campaign) => (
  <CampaignChapterInfo chapters={campaign.chapters || []} currentChapterId={campaign.currentChapterId} />
);

/**
 * Shared, non-DM-specific presentational pieces of a campaign card: title +
 * status badge row, module name line, and chapter info line. Used by both the
 * full DM card and the lighter Player/Invited card so the markup isn't
 * duplicated between them.
 */
export function CampaignCardHeader({ campaign, renderChapterInfo = defaultChapterInfo }: Props) {
  return (
    <>
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <h3 className="text-xl font-bold min-w-0 truncate">{campaign.name}</h3>
        <span className={`px-2 py-0.5 text-xs rounded text-white flex-shrink-0 ${statusBadgeClass(campaign.status)}`}>
          {statusLabel(campaign.status)}
        </span>
      </div>
      {campaign.moduleName && (
        <p className="text-gray-400 text-sm">{campaign.moduleName}</p>
      )}
      {renderChapterInfo(campaign)}
    </>
  );
}
