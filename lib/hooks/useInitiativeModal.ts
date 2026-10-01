"use client";

import { useEffect, useRef, useState } from "react";
import type { InitiativeRoll } from "@/lib/types";
import type { UseCombatReturn } from "@/lib/hooks/useCombat";
import { sortCombatants } from "@/lib/utils/combat";

export interface UseInitiativeModalArgs {
  combatState: UseCombatReturn["combatState"];
  setInitiativeRoll: UseCombatReturn["setInitiativeRoll"];
}

export interface UseInitiativeModalResult {
  initiativeEditId: string | null;
  openInitiativeModal: (id: string | null) => void;
  handleSetInitiative: (id: string, roll: InitiativeRoll) => void;
  closeInitiativeModal: (dismissed: boolean) => void;
}

/**
 * Owns the initiative modal's open/dismissal/auto-open state. Positioning is
 * pure CSS (a fixed, flex-centered backdrop in `ActiveCombatView`), so nothing
 * here measures the DOM.
 */
export function useInitiativeModal({
  combatState,
  setInitiativeRoll,
}: UseInitiativeModalArgs): UseInitiativeModalResult {
  const [initiativeEditId, setInitiativeEditId] = useState<string | null>(null);
  // Combatants whose auto-opened initiative modal the DM has manually dismissed
  // this session; they stay eligible for the manual click-to-open flow, just not
  // for auto-reopen. Resets on remount (e.g. full page reload).
  const dismissedInitiativeIds = useRef<Set<string>>(new Set());

  const openInitiativeModal = (id: string | null) => setInitiativeEditId(id);

  const handleSetInitiative = (id: string, roll: InitiativeRoll) => {
    setInitiativeRoll(id, roll);
    // A saved combatant is no longer "unrolled" and must never trigger auto-open again.
    dismissedInitiativeIds.current.add(id);
    if (!combatState) return;

    // React state updates aren't visible until the next render, so simulate the
    // post-update list locally instead of reading combatState after the call above.
    const updatedCombatants = combatState.combatants.map((c) =>
      c.id === id ? { ...c, initiative: roll.total, initiativeRoll: roll } : c,
    );
    const sorted = sortCombatants(updatedCombatants);

    // Using the same list as getDisplayCombatants to find the next one
    const nextUnrolled = sorted.find((c) => !c.initiativeRoll);
    openInitiativeModal(nextUnrolled ? nextUnrolled.id : null);
  };

  const closeInitiativeModal = (dismissed: boolean) => {
    if (dismissed && initiativeEditId) {
      dismissedInitiativeIds.current.add(initiativeEditId);
    }
    openInitiativeModal(null);
  };

  // Re-evaluates whenever the set of unrolled combatants changes (added, rolled,
  // or removed) or the modal closes, and opens the first eligible (unrolled,
  // non-dismissed) combatant found, provided no modal is currently open.
  const unrolledCombatantIds = (combatState?.combatants ?? [])
    .filter((c) => !c.initiativeRoll)
    .map((c) => c.id)
    .join(",");

  useEffect(() => {
    if (!combatState || initiativeEditId !== null) return;
    const sorted = sortCombatants(combatState.combatants);
    const target = sorted.find(
      (c) => !c.initiativeRoll && !dismissedInitiativeIds.current.has(c.id),
    );
    if (!target) return;
    openInitiativeModal(target.id);
    // Intentionally excludes `combatState`: it gets a new object reference on
    // every unrelated combat update (HP, damage, etc.), and re-running this
    // effect on those churns can race with in-flight input/HP-adjustment state
    // elsewhere in the tree. `unrolledCombatantIds` already captures every
    // change this effect actually needs to react to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unrolledCombatantIds, initiativeEditId]);

  // Recovery for the "combatant removed while its initiative modal is open" race:
  // the render guard below already hides the modal (no matching combatant), but
  // without this, `initiativeEditId` would stay non-null forever and permanently
  // block the auto-open effect above from ever firing again for anyone else.
  useEffect(() => {
    if (!initiativeEditId || !combatState) return;
    const stillExists = combatState.combatants.some(
      (c) => c.id === initiativeEditId,
    );
    if (!stillExists) openInitiativeModal(null);
  }, [initiativeEditId, combatState]);

  return {
    initiativeEditId,
    openInitiativeModal,
    handleSetInitiative,
    closeInitiativeModal,
  };
}
