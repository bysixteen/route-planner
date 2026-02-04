"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EditorStop, StopDuration } from "@/lib/types";
import { getDurationLabel } from "@/lib/types";
import { formatDistance, formatDuration } from "@/lib/mapbox/directions";

interface SegmentInfo {
  distance: number; // metres
  duration: number; // seconds
}

interface SortableStopItemProps {
  stop: EditorStop;
  index: number;
  isLast: boolean;
  onRemove: (id: string) => void;
  onTypeChange: (id: string, type: EditorStop["type"]) => void;
  onDurationChange: (
    id: string,
    duration: StopDuration,
    nights: number,
  ) => void;
  onAddAfter: (index: number) => void;
  isSelected?: boolean;
  onClick?: () => void;
  segmentToNext?: SegmentInfo | null;
  hideConnector?: boolean;
}

const STOP_TYPES: Array<{ value: EditorStop["type"]; label: string }> = [
  { value: "campsite", label: "Campsite" },
  { value: "city", label: "City" },
  { value: "attraction", label: "Attraction" },
  { value: "rest", label: "Rest" },
  { value: "event", label: "Event" },
  { value: "transport", label: "Transport" },
];

const TYPE_COLOURS: Record<string, string> = {
  campsite: "bg-green-100 text-green-800 hover:bg-green-200",
  city: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  attraction: "bg-amber-100 text-amber-800 hover:bg-amber-200",
  rest: "bg-violet-100 text-violet-800 hover:bg-violet-200",
  event: "bg-red-100 text-red-800 hover:bg-red-200",
  transport: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
};

const DURATION_OPTIONS: Array<{
  value: StopDuration;
  nights: number;
  label: string;
}> = [
  { value: "drive-through", nights: 0, label: "Drive through" },
  { value: "quick", nights: 0, label: "Quick stop" },
  { value: "short", nights: 0, label: "1-2 hours" },
  { value: "half-day", nights: 0, label: "Half day" },
  { value: "overnight", nights: 1, label: "1 night" },
  { value: "multi-night", nights: 2, label: "2 nights" },
  { value: "multi-night", nights: 3, label: "3 nights" },
];

export function SortableStopItem({
  stop,
  index,
  isLast,
  onRemove,
  onTypeChange,
  onDurationChange,
  onAddAfter,
  isSelected,
  onClick,
  segmentToNext,
  hideConnector = false,
}: SortableStopItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cycleType = () => {
    const currentIndex = STOP_TYPES.findIndex((t) => t.value === stop.type);
    const nextIndex = (currentIndex + 1) % STOP_TYPES.length;
    onTypeChange(stop.id, STOP_TYPES[nextIndex].value);
  };

  const cycleDuration = () => {
    const currentIndex = DURATION_OPTIONS.findIndex(
      (d) => d.value === stop.duration && d.nights === stop.nights,
    );
    const nextIndex = (currentIndex + 1) % DURATION_OPTIONS.length;
    const next = DURATION_OPTIONS[nextIndex];
    onDurationChange(stop.id, next.value, next.nights);
  };

  return (
    <div className="relative">
      {/* Stop card */}
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-2 rounded-lg border bg-background p-3 ${
          isDragging ? "opacity-50 shadow-lg" : ""
        } ${isSelected ? "ring-2 ring-primary" : ""}`}
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
          <div className="flex items-center gap-2">
            {stop.country && (
              <span className="truncate text-xs text-muted-foreground">
                {stop.country}
              </span>
            )}
          </div>
        </div>

        {/* Duration badge (click to cycle) */}
        <Badge
          className="cursor-pointer bg-purple-100 text-purple-800 hover:bg-purple-200"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            cycleDuration();
          }}
          title="Click to change duration"
        >
          {getDurationLabel(stop.duration, stop.nights, stop.stayHours)}
        </Badge>

        {/* Type badge (click to cycle) */}
        <Badge
          className={`cursor-pointer ${TYPE_COLOURS[stop.type]}`}
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            cycleType();
          }}
          title="Click to change type"
        >
          {stop.type}
        </Badge>

        {/* Remove button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(stop.id);
          }}
        >
          ✕
        </Button>
      </div>

      {/* Connector section with add button - always show unless last stop or hidden */}
      {!isLast && !hideConnector && (
        <div className="ml-5 flex items-center gap-2 py-1.5">
          <div className="flex flex-col items-center">
            <div className="h-2 w-0.5 bg-border" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddAfter(index);
              }}
              className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 text-muted-foreground/50 transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
              title="Add stop here"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
            <div className="h-2 w-0.5 bg-border" />
          </div>

          {/* Segment info (if route calculated) */}
          {segmentToNext && (
            <div className="flex items-center gap-3 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                {formatDistance(segmentToNext.distance)}
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatDuration(segmentToNext.duration)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
