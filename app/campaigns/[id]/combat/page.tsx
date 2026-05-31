'use client';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { ActiveCombatView } from '@/lib/components/ActiveCombatView';
import { CombatSetupView } from '@/lib/components/CombatSetupView';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCombat } from '@/lib/hooks/useCombat';

function CombatContent({ campaignId }: { campaignId: string }) {
  const combat = useCombat({ campaignId });
  const { user } = useAuth();
  if (combat.loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading combat data...</div>;
  if (!combat.combatState) {
    return <CombatSetupView combat={combat} user={user} />;
  }
  return <ActiveCombatView combat={combat} user={user} />;
}

export default function CampaignCombatPage() {
  const params = useParams();
  const campaignId = Array.isArray(params.id) ? params.id[0] : params.id as string;
  return <ProtectedRoute><CombatContent campaignId={campaignId} /></ProtectedRoute>;
}
