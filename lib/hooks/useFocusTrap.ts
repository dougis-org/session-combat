"use client";

import { useEffect, type RefObject } from "react";

const TABBABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getTabbables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("tabindex") !== "-1",
  );
}

function focusFirst(container: HTMLElement) {
  const [first] = getTabbables(container);
  if (first) {
    first.focus();
    return;
  }
  container.tabIndex = -1;
  container.focus();
}

/**
 * Keeps keyboard focus inside `containerRef` while `active`: moves focus in on
 * activation, wraps Tab/Shift+Tab at the ends, and restores focus to the
 * previously focused element on deactivation (if it is still in the document).
 * Changing `focusKey` while active re-focuses the first control without
 * restoring focus in between. Escape is intentionally left to the caller.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  focusKey?: string,
) {
  // Declared before the focus-moving effect below: effects run in order, so
  // `previous` is captured before focus moves into the container.
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    return () => {
      if (previous && previous.isConnected) previous.focus();
    };
  }, [active]);

  useEffect(() => {
    if (!active || !containerRef.current) return;
    focusFirst(containerRef.current);
  }, [active, focusKey, containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const tabbables = getTabbables(container);
      if (tabbables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = tabbables[0];
      const last = tabbables[tabbables.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === first || current === container)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [active, containerRef]);
}
