"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GeocodingResult } from "@/lib/mapbox/geocoding";
import type { StopDuration } from "@/lib/types";

interface DayOption {
  dayNumber: number;
  label: string;
}

interface MapLocationPopupProps {
  location: GeocodingResult;
  dayOptions: DayOption[];
  onAdd: (
    location: GeocodingResult,
    stopType: StopDuration,
    dayNumber: number
  ) => void;
  onClose: () => void;
}

const STOP_TYPE_OPTIONS: Array<{ value: StopDuration; label: string }> = [
  { value: "drive-through", label: "Start / Drive through" },
  { value: "quick", label: "Quick stop (15-30 min)" },
  { value: "short", label: "Stop off (1-2 hours)" },
  { value: "half-day", label: "Half day visit" },
  { value: "overnight", label: "Overnight (1 night)" },
  { value: "multi-night", label: "Multi-night stay" },
];

export function MapLocationPopup({
  location,
  dayOptions,
  onAdd,
  onClose,
}: MapLocationPopupProps) {
  const [stopType, setStopType] = useState<StopDuration>("overnight");
  const [selectedDay, setSelectedDay] = useState<number>(
    dayOptions[0]?.dayNumber ?? 1
  );

  const handleAdd = () => {
    onAdd(location, stopType, selectedDay);
  };

  return (
    <div className="w-72 rounded-lg bg-white p-4 shadow-xl">
      {/* Header with close button */}
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-900">
            {location.name}
          </h3>
          <p className="truncate text-sm text-gray-500">{location.fullName}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Stop type selector */}
      <div className="mb-3">
        <Select
          value={stopType}
          onValueChange={(value) => setStopType(value as StopDuration)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select stop type" />
          </SelectTrigger>
          <SelectContent>
            {STOP_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Day selector */}
      <div className="mb-4 flex items-center gap-2">
        <Select
          value={String(selectedDay)}
          onValueChange={(value) => setSelectedDay(Number(value))}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent>
            {dayOptions.map((day) => (
              <SelectItem key={day.dayNumber} value={String(day.dayNumber)}>
                {day.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Add to trip button */}
        <Button
          onClick={handleAdd}
          className="flex-1 bg-orange-500 hover:bg-orange-600"
        >
          Add to trip
        </Button>
      </div>
    </div>
  );
}
