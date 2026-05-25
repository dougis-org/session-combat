'use client';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { ActiveCombatView } from '@/lib/components/ActiveCombatView';
import { CombatSetupView } from '@/lib/components/CombatSetupView';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCombat } from '@/lib/hooks/useCombat';
function CombatContent() {
  const combat = useCombat();
  const { user } = useAuth();
  if (combat.loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading combat...</div>;
  if (!combat.combatState) {
    return <CombatSetupView combat={combat} user={user} />;
  }
  return <ActiveCombatView combat={combat} user={user} />;
}
export default function CombatPage() {
  return <ProtectedRoute><CombatContent /></ProtectedRoute>;
}
