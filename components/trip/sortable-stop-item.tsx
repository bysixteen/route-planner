'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { EditorStop } from '@/lib/types'

interface SortableStopItemProps {
  stop: EditorStop
  index: number
  onRemove: (id: string) => void
  onTypeChange: (id: string, type: EditorStop['type']) => void
  isSelected?: boolean
  onClick?: () => void
}

const STOP_TYPES: Array<{ value: EditorStop['type']; label: string }> = [
  { value: 'campsite', label: 'Campsite' },
  { value: 'city', label: 'City' },
  { value: 'attraction', label: 'Attraction' },
  { value: 'rest', label: 'Rest' },
  { value: 'event', label: 'Event' },
  { value: 'transport', label: 'Transport' },
]

const TYPE_COLOURS: Record<string, string> = {
  campsite: 'bg-green-100 text-green-800 hover:bg-green-200',
  city: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  attraction: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  rest: 'bg-violet-100 text-violet-800 hover:bg-violet-200',
  event: 'bg-red-100 text-red-800 hover:bg-red-200',
  transport: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
}

export function SortableStopItem({
  stop,
  index,
  onRemove,
  onTypeChange,
  isSelected,
  onClick,
}: SortableStopItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const cycleType = () => {
    const currentIndex = STOP_TYPES.findIndex((t) => t.value === stop.type)
    const nextIndex = (currentIndex + 1) % STOP_TYPES.length
    onTypeChange(stop.id, STOP_TYPES[nextIndex].value)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border bg-background p-3 ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="4" cy="4" r="1.5" />
          <circle cx="4" cy="8" r="1.5" />
          <circle cx="4" cy="12" r="1.5" />
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="8" r="1.5" />
          <circle cx="10" cy="12" r="1.5" />
        </svg>
      </button>

      {/* Index number */}
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {index + 1}
      </div>

      {/* Stop details */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{stop.name}</p>
        {stop.country && (
          <p className="truncate text-xs text-muted-foreground">{stop.country}</p>
        )}
      </div>

      {/* Type badge (click to cycle) */}
      <Badge
        className={`cursor-pointer ${TYPE_COLOURS[stop.type]}`}
        variant="secondary"
        onClick={(e) => {
          e.stopPropagation()
          cycleType()
        }}
      >
        {stop.type}
      </Badge>

      {/* Remove button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(stop.id)
        }}
      >
        ✕
      </Button>
    </div>
  )
}
