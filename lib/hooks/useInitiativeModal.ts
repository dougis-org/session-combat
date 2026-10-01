"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { InitiativeRoll } from "@/lib/types";
import type { UseCombatReturn } from "@/lib/hooks/useCombat";
import { sortCombatants } from "@/lib/utils/combat";

export interface UseInitiativeModalArgs {
  combatState: UseCombatReturn["combatState"];
  setInitiativeRoll: UseCombatReturn["setInitiativeRoll"];
}

export interface UseInitiativeModalResult {
  initiativeEditId: string | null;
  initiativeEditPosition: { top: number; left: number; width: number } | null;
  initiativeModalRef: React.RefObject<HTMLDivElement | null>;
  openInitiativeModal: (
    id: string | null,
    position: { top: number; left: number; width: number } | null,
  ) => void;
  handleSetInitiative: (id: string, roll: InitiativeRoll) => void;
  closeInitiativeModal: (dismissed: boolean) => void;
  remeasureInitiativeModal: () => void;
  getCardAnchorPosition: (
    id: string,
  ) => { top: number; left: number; width: number } | null;
}

const MODAL_VIEWPORT_MARGIN = 16;
/**
 * Owns the initiative-modal's anchoring, dismissal, auto-open, and
 * viewport-clamp state. Extracted verbatim (including effect-dependency
 * rationale) from `ActiveCombatView` to keep that component's render logic
 * separate from this stateful UI concern.
 */
export function useInitiativeModal({
  combatState,
  setInitiativeRoll,
}: UseInitiativeModalArgs): UseInitiativeModalResult {
  const [initiativeEditId, setInitiativeEditId] = useState<string | null>(null);
  const [initiativeEditPosition, setInitiativeEditPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const initiativeModalRef = useRef<HTMLDivElement | null>(null);
  // Combatants whose auto-opened initiative modal the DM has manually dismissed
  // this session; they stay eligible for the manual click-to-open flow, just not
  // for auto-reopen. Resets on remount (e.g. full page reload).
  const dismissedInitiativeIds = useRef<Set<string>>(new Set());

  // The modal stays vertically aligned with the card but is centered in the
  // viewport, so its natural content width drives the horizontal layout instead
  // of the card's own width.
  const getCardAnchorPosition = (
    id: string,
  ): { top: number; left: number; width: number } | null => {
    const el = document.querySelector(`[data-combatant-id="${id}"]`);
    if (!el) {
      console.warn(
        `ActiveCombatView: no card element found for combatant ${id} while anchoring the initiative modal`,
      );
      return null;
    }
    const rect = el.getBoundingClientRect();
    // Keep the modal vertically aligned with the target card, but center it on
    // the viewport so the content uses its natural auto width instead of matching
    // the card's fixed width.
    return {
      top: rect.top + window.scrollY,
      left: window.scrollX + window.innerWidth / 2,
      width: rect.width,
    };
  };

  useEffect(() => {
    if (!initiativeEditId) return;

    const position = getCardAnchorPosition(initiativeEditId);
    if (!position) return;

    setInitiativeEditPosition((current) => {
      if (!current) return position;

      const topChanged = Math.abs(current.top - position.top) > 0.5;
      const leftChanged = Math.abs(current.left - position.left) > 0.5;
      if (!topChanged && !leftChanged) return current;

      return position;
    });
  }, [initiativeEditId, combatState]);

  // Single place that updates the (id, position) pair together so the two
  // pieces of state never drift out of sync.
  const openInitiativeModal = (
    id: string | null,
    position: { top: number; left: number; width: number } | null,
  ) => {
    setInitiativeEditId(id);
    setInitiativeEditPosition(position);
  };

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
    const nextPosition = nextUnrolled
      ? getCardAnchorPosition(nextUnrolled.id)
      : null;

    if (nextUnrolled && nextPosition) {
      openInitiativeModal(nextUnrolled.id, nextPosition);
    } else {
      openInitiativeModal(null, null);
    }
  };

  const closeInitiativeModal = (dismissed: boolean) => {
    if (dismissed && initiativeEditId) {
      dismissedInitiativeIds.current.add(initiativeEditId);
    }
    openInitiativeModal(null, null);
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
    const position = getCardAnchorPosition(target.id);
    if (!position) return;
    openInitiativeModal(target.id, position);
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
    if (!stillExists) openInitiativeModal(null, null);
  }, [initiativeEditId, combatState]);

  // Measure the rendered modal and clamp its position so it never overflows the
  // viewport while keeping the card's vertical alignment and centering the
  // content on-screen.
  const clampModalToViewport = useCallback(() => {
    if (
      !initiativeEditId ||
      !initiativeEditPosition ||
      !initiativeModalRef.current
    )
      return;
    const el = initiativeModalRef.current;
    const maxModalWidth = Math.max(
      0,
      window.innerWidth - MODAL_VIEWPORT_MARGIN * 2,
    );
    el.style.width = 'auto';
    el.style.maxWidth = `${maxModalWidth}px`;
    el.style.transform = 'translateX(-50%)';

    const rect = el.getBoundingClientRect();
    const width = Math.min(rect.width, maxModalWidth);
    if (width !== rect.width) {
      el.style.width = `${width}px`;
    }

    const measuredRect = el.getBoundingClientRect();
    const maxTop = window.scrollY + window.innerHeight - MODAL_VIEWPORT_MARGIN;

    let { top, left } = initiativeEditPosition;
    const minCenterX = window.scrollX + MODAL_VIEWPORT_MARGIN + measuredRect.width / 2;
    const maxCenterX = window.scrollX + window.innerWidth - MODAL_VIEWPORT_MARGIN - measuredRect.width / 2;
    left = Math.min(Math.max(left, minCenterX), maxCenterX);

    const overflowBottom = top + measuredRect.height - maxTop;
    if (overflowBottom > 0) top -= overflowBottom;
    // Positions are page coordinates (rect + scrollX/scrollY), so the minimum
    // clamp must also be scroll-aware — clamping to the bare margin would pin
    // the modal to the document origin instead of the visible viewport edge
    // when the page is scrolled.
    top = Math.max(window.scrollY + MODAL_VIEWPORT_MARGIN, top);

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [initiativeEditId, initiativeEditPosition]);

  useLayoutEffect(clampModalToViewport, [clampModalToViewport]);

  useEffect(() => {
    if (!initiativeModalRef.current || !initiativeEditId) return;

    const el = initiativeModalRef.current;
    const observer = new ResizeObserver(() => clampModalToViewport());
    observer.observe(el);

    const handleViewportChange = () => clampModalToViewport();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange);
    };
  }, [clampModalToViewport, initiativeEditId]);

  // Also exposed as `remeasureInitiativeModal`: content added after open (e.g. the
  // entry row when switching modes) changes the modal's height, so the host re-runs it.
  return {
    initiativeEditId,
    initiativeEditPosition,
    initiativeModalRef,
    openInitiativeModal,
    handleSetInitiative,
    closeInitiativeModal,
    remeasureInitiativeModal: clampModalToViewport,
    getCardAnchorPosition,
  };
}
