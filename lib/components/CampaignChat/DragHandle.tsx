'use client'

interface DragHandleProps {
  onDragStart: (startY: number, startHeight: number) => void
  currentHeightPx: number
}

export function DragHandle({ onDragStart, currentHeightPx }: DragHandleProps) {
  return (
    <div
      role="separator"
      aria-label="Resize chat panel"
      style={{ height: 8, cursor: 'ns-resize', flexShrink: 0 }}
      className="w-full flex items-center justify-center bg-gray-800 hover:bg-gray-700"
      onMouseDown={e => {
        e.preventDefault()
        onDragStart(e.clientY, currentHeightPx)
      }}
    >
      <div className="flex gap-0.5">
        <div className="w-1 h-1 rounded-full bg-gray-500" />
        <div className="w-1 h-1 rounded-full bg-gray-500" />
        <div className="w-1 h-1 rounded-full bg-gray-500" />
      </div>
    </div>
  )
}
