'use client'

import { useEffect, useReducer, useRef } from 'react'
import { usePreferences } from '@/lib/preferences/usePreferences'

// Navbar height baked into full-height calculation; update if navbar changes
const NAVBAR_HEIGHT = 60

type PersistedSize = { height: number; screenWidth: number; screenHeight: number }

function isValidPersistedSize(val: unknown): val is PersistedSize {
  if (!val || typeof val !== 'object') return false
  const v = val as Record<string, unknown>
  return (
    typeof v.height === 'number' && Number.isFinite(v.height) &&
    typeof v.screenWidth === 'number' && Number.isFinite(v.screenWidth) &&
    typeof v.screenHeight === 'number' && Number.isFinite(v.screenHeight)
  )
}

type DockState = { isExpanded: boolean; isPinned: boolean; isLarge: boolean; customHeight: number | null }
type DockAction =
  | { type: 'INIT'; pinned: boolean }
  | { type: 'EXPAND' }
  | { type: 'COLLAPSE' }
  | { type: 'PIN' }
  | { type: 'UNPIN' }
  | { type: 'TOGGLE_SIZE' }
  | { type: 'SET_HEIGHT'; payload: number }

function dockReducer(state: DockState, action: DockAction): DockState {
  switch (action.type) {
    case 'INIT':        return { isExpanded: action.pinned, isPinned: action.pinned, isLarge: false, customHeight: null }
    case 'EXPAND':      return { ...state, isExpanded: true }
    case 'COLLAPSE':    return { ...state, isExpanded: false, isLarge: false }
    case 'PIN':         return { ...state, isPinned: true }
    case 'UNPIN':       return { ...state, isPinned: false }
    case 'TOGGLE_SIZE': return { ...state, isLarge: !state.isLarge }
    case 'SET_HEIGHT': {
      const maxHeight = typeof window !== 'undefined' ? window.innerHeight - NAVBAR_HEIGHT : action.payload
      return { ...state, customHeight: Math.min(Math.max(150, action.payload), Math.max(150, maxHeight)), isLarge: false }
    }
  }
}

function resolveHeight(state: DockState): string {
  if (state.isLarge) return `calc(100vh - ${NAVBAR_HEIGHT}px)`
  if (state.customHeight !== null) return `${state.customHeight}px`
  return '33vh'
}

interface UseDockStateArgs {
  triggerRef: React.RefObject<HTMLButtonElement | null>
  drawerRef: React.RefObject<HTMLDivElement | null>
  onSizeChange?: (isLarge: boolean) => void
}

export function useDockState({ triggerRef, drawerRef, onSizeChange }: UseDockStateArgs) {
  const { preferences, setPreference } = usePreferences()
  const [{ isExpanded, isPinned, isLarge, customHeight }, dispatch] = useReducer(dockReducer, {
    isExpanded: false,
    isPinned: false,
    isLarge: false,
    customHeight: null,
  })
  const isMounted = useRef(false)
  const dragListenersRef = useRef<{ move: (e: MouseEvent) => void; up: (e: MouseEvent) => void } | null>(null)
  // Set once the user interacts with pin/size, after which we stop re-applying
  // server-hydrated preference values (so we never yank the dock out from under them).
  const userTouchedRef = useRef(false)

  // ── Init / reconcile: pin state + persisted size from the preferences provider.
  //    Re-runs when `chat.pinned` / `chat.size` change identity (e.g. the authenticated
  //    GET resolves after mount), but only until the user has touched the dock. ──
  useEffect(() => {
    if (userTouchedRef.current) return
    dispatch({ type: 'INIT', pinned: !!preferences.chat.pinned })

    const rawSize = preferences.chat.size
    const savedSize = isValidPersistedSize(rawSize) ? rawSize : null
    if (savedSize) {
      const screenMatch =
        Math.abs(savedSize.screenWidth - window.innerWidth) <= 100 &&
        Math.abs(savedSize.screenHeight - window.innerHeight) <= 100
      if (screenMatch) dispatch({ type: 'SET_HEIGHT', payload: savedSize.height })
    }
  }, [preferences.chat.pinned, preferences.chat.size])

  // ── Cleanup lingering drag listeners on unmount ──
  useEffect(() => {
    return () => {
      if (dragListenersRef.current) {
        document.removeEventListener('mousemove', dragListenersRef.current.move)
        document.removeEventListener('mouseup', dragListenersRef.current.up)
        dragListenersRef.current = null
      }
    }
  }, [])

  // ── Restore focus after drawer closes ──
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    if (!isExpanded) triggerRef.current?.focus()
  }, [isExpanded, triggerRef])

  // ── Keyboard: Escape to collapse ──
  useEffect(() => {
    if (!isExpanded) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCollapse() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, isLarge])

  function handleDragStart(startY: number, startHeight: number) {
    // Remove any lingering listeners from a previous drag that didn't complete cleanly
    if (dragListenersRef.current) {
      document.removeEventListener('mousemove', dragListenersRef.current.move)
      document.removeEventListener('mouseup', dragListenersRef.current.up)
    }
    let latestHeight = startHeight
    const maxHeight = Math.max(150, window.innerHeight - NAVBAR_HEIGHT)
    function onMove(e: MouseEvent) {
      latestHeight = Math.min(Math.max(150, startHeight - (e.clientY - startY)), maxHeight)
      // Update DOM directly — no React re-render per pixel, dispatch only on mouseup
      if (drawerRef.current) drawerRef.current.style.height = `${latestHeight}px`
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      dragListenersRef.current = null
      userTouchedRef.current = true
      dispatch({ type: 'SET_HEIGHT', payload: latestHeight })
      setPreference('chat.size', {
        height: latestHeight,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
      })
    }
    dragListenersRef.current = { move: onMove, up: onUp }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function handleToggleSize() {
    userTouchedRef.current = true
    const nextIsLarge = !isLarge
    dispatch({ type: 'TOGGLE_SIZE' })
    onSizeChange?.(nextIsLarge)
  }

  function handleCollapse() {
    userTouchedRef.current = true
    if (isLarge) onSizeChange?.(false)
    dispatch({ type: 'COLLAPSE' })
  }

  function handlePinToggle() {
    userTouchedRef.current = true
    if (isPinned) {
      setPreference('chat.pinned', false)
      dispatch({ type: 'UNPIN' })
    } else {
      setPreference('chat.pinned', true)
      dispatch({ type: 'PIN' })
    }
  }

  function handleExpand() {
    userTouchedRef.current = true
    dispatch({ type: 'EXPAND' })
  }

  const resolvedHeight = resolveHeight({ isExpanded, isPinned, isLarge, customHeight })

  return {
    isExpanded, isPinned, isLarge, customHeight, resolvedHeight,
    handleDragStart, handleToggleSize, handleCollapse, handlePinToggle, handleExpand,
  }
}
