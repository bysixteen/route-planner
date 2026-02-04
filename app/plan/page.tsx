"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { EditorMap } from "@/components/map/editor-map";
import { PlaceSearch } from "@/components/trip/place-search";
import { InlineAddStop } from "@/components/trip/inline-add-stop";
import { SortableStopItem } from "@/components/trip/sortable-stop-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  formatDistance,
  formatDuration,
  type RouteResult,
} from "@/lib/mapbox/directions";
import { type GeocodingResult } from "@/lib/mapbox/geocoding";
import {
  type EditorStop,
  type StopDuration,
  createEditorStop,
} from "@/lib/types";
import { createTrip } from "@/lib/supabase/queries";

// Helper to format date for display
function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Helper to add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Group stops into days based on overnight stays
interface DayGroup {
  dayNumber: number;
  date: Date;
  stops: Array<{
    stop: EditorStop;
    originalIndex: number;
    segmentToNext?: { distance: number; duration: number } | null;
  }>;
  totalDistance: number; // metres
  totalDuration: number; // seconds driving
  // Drive info from previous day's overnight stop to this day's first stop
  arrivalDrive?: { distance: number; duration: number } | null;
}

export default function PlanPage() {
  const router = useRouter();
  const [tripTitle, setTripTitle] = useState("My Road Trip");
  const [stops, setStops] = useState<EditorStop[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [maxDrivingHours, setMaxDrivingHours] = useState(4);
  // -1 = adding at start, 0+ = adding after that index, null = not adding
  const [activeInsertIndex, setActiveInsertIndex] = useState<number | null>(
    null,
  );

  // Home address state
  interface HomeAddress {
    name: string;
    fullName: string;
    coordinates: [number, number];
    country?: string;
  }
  const [homeAddress, setHomeAddress] = useState<HomeAddress | null>(null);
  const [isSettingHome, setIsSettingHome] = useState(false);

  // Load home address from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("routePlanner_homeAddress");
    if (saved) {
      try {
        setHomeAddress(JSON.parse(saved));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save home address to localStorage
  const saveHomeAddress = useCallback((address: HomeAddress) => {
    setHomeAddress(address);
    localStorage.setItem("routePlanner_homeAddress", JSON.stringify(address));
    setIsSettingHome(false);
  }, []);

  // Start trip from home
  const handleStartFromHome = useCallback(() => {
    if (!homeAddress) return;

    const homeStop = createEditorStop(
      homeAddress.name,
      homeAddress.fullName,
      homeAddress.coordinates,
      homeAddress.country,
      true, // isStartPoint
    );

    setStops([homeStop]);
    setSelectedStopId(homeStop.id);
  }, [homeAddress]);

  // Calculate day groups based on overnight stops
  // Logic: Day 1 starts with first stop. After each overnight stop, a new day begins.
  // Multi-night stays mean that many days pass at that location.
  const dayGroups = useMemo((): DayGroup[] => {
    if (stops.length === 0) return [];

    const groups: DayGroup[] = [];
    let currentDayNumber = 1;
    let cumulativeNights = 0;
    let pendingArrivalDrive: { distance: number; duration: number } | null =
      null;
    let currentDay: DayGroup = {
      dayNumber: currentDayNumber,
      date: new Date(startDate),
      stops: [],
      totalDistance: 0,
      totalDuration: 0,
      arrivalDrive: null,
    };

    stops.forEach((stop, index) => {
      const segment = route?.segments[index] ?? null;

      // Add stop to current day
      currentDay.stops.push({
        stop,
        originalIndex: index,
        segmentToNext: segment,
      });

      // After an overnight stop, we start a new day (unless it's the last stop)
      if (stop.nights >= 1 && index < stops.length - 1) {
        // The segment from this overnight stop leads to the next day
        // Don't add it to current day's totals - it belongs to the next day
        groups.push(currentDay);

        // Save the segment for the next day's arrival drive
        pendingArrivalDrive = segment;

        // Add the nights at this stop to our cumulative count
        cumulativeNights += stop.nights;
        currentDayNumber = cumulativeNights + 1;

        currentDay = {
          dayNumber: currentDayNumber,
          date: addDays(new Date(startDate), cumulativeNights),
          stops: [],
          totalDistance: 0,
          totalDuration: 0,
          arrivalDrive: pendingArrivalDrive,
        };

        // Include arrival drive in the day's totals
        if (pendingArrivalDrive) {
          currentDay.totalDistance += pendingArrivalDrive.distance;
          currentDay.totalDuration += pendingArrivalDrive.duration;
        }
        pendingArrivalDrive = null;
      } else if (segment) {
        // Add segment distance/duration to current day's totals (for non-overnight stops)
        currentDay.totalDistance += segment.distance;
        currentDay.totalDuration += segment.duration;
      }
    });

    // Don't forget the last day (if it has stops)
    if (currentDay.stops.length > 0) {
      groups.push(currentDay);
    }

    return groups;
  }, [stops, route, startDate]);

  // Calculate trip totals
  const tripStats = useMemo(() => {
    const totalNights = stops.reduce((sum, s) => sum + s.nights, 0);
    const totalDays = totalNights + 1;
    const totalDistance = route?.totalDistance ?? 0;
    const totalDuration = route?.totalDuration ?? 0;
    const countries = new Set(stops.map((s) => s.country).filter(Boolean));

    return {
      days: totalDays,
      stops: stops.length,
      distance: totalDistance,
      duration: totalDuration,
      countries: countries.size,
    };
  }, [stops, route]);

  // Generate day options for the map popup
  const dayOptions = useMemo(() => {
    const totalNights = stops.reduce((sum, s) => sum + s.nights, 0);
    const totalDays = Math.max(totalNights + 1, 1);

    return Array.from({ length: totalDays }, (_, i) => ({
      dayNumber: i + 1,
      label: `Day ${i + 1}`,
    }));
  }, [stops]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle place selection from search (inline or empty state)
  const handlePlaceSelect = useCallback(
    (place: GeocodingResult, insertIndex?: number) => {
      const targetIndex = insertIndex ?? activeInsertIndex;

      // First stop is the starting point (no overnight stay)
      const isFirstStop =
        stops.length === 0 && (targetIndex === null || targetIndex < 0);

      const newStop = createEditorStop(
        place.name,
        place.fullName,
        place.coordinates,
        place.country,
        isFirstStop,
      );

      if (targetIndex !== null && targetIndex >= 0) {
        // Insert after the specified index
        setStops((prev) => {
          const newStops = [...prev];
          newStops.splice(targetIndex + 1, 0, newStop);
          return newStops;
        });
      } else {
        // Append to end (or insert at start if -1)
        setStops((prev) => [...prev, newStop]);
      }

      setSelectedStopId(newStop.id);
      setActiveInsertIndex(null); // Close inline search
    },
    [activeInsertIndex, stops.length],
  );

  // Handle clicking the + button between stops - opens inline search
  const handleAddAfter = useCallback((index: number) => {
    setActiveInsertIndex(index);
  }, []);

  // Handle adding a stop from the map popup
  const handleAddFromMap = useCallback(
    (location: GeocodingResult, stopType: StopDuration, dayNumber: number) => {
      // Determine nights based on stop type
      let nights = 0;
      if (stopType === "overnight") {
        nights = 1;
      } else if (stopType === "multi-night") {
        nights = 2; // Default to 2, user can adjust
      }

      const newStop: EditorStop = {
        id: crypto.randomUUID(),
        name: location.name,
        fullName: location.fullName,
        coordinates: location.coordinates,
        country: location.country,
        type: stopType === "drive-through" ? "transport" : "city",
        duration: stopType,
        nights,
      };

      // Find where to insert the stop based on the day number
      // We need to find the last stop of that day and insert after it
      if (dayGroups.length === 0 || stops.length === 0) {
        // No stops yet, just add it
        setStops([newStop]);
      } else {
        // Find the day group
        const targetDay = dayGroups.find((d) => d.dayNumber === dayNumber);

        if (targetDay && targetDay.stops.length > 0) {
          // Insert after the last stop of that day
          const lastStopIndex =
            targetDay.stops[targetDay.stops.length - 1].originalIndex;
          setStops((prev) => {
            const newStops = [...prev];
            newStops.splice(lastStopIndex + 1, 0, newStop);
            return newStops;
          });
        } else {
          // Day doesn't exist or has no stops, append to end
          setStops((prev) => [...prev, newStop]);
        }
      }

      setSelectedStopId(newStop.id);
    },
    [dayGroups, stops.length],
  );

  const handleRemoveStop = useCallback((id: string) => {
    setStops((prev) => prev.filter((s) => s.id !== id));
    setSelectedStopId((prev) => (prev === id ? null : prev));
  }, []);

  const handleTypeChange = useCallback(
    (id: string, type: EditorStop["type"]) => {
      setStops((prev) => prev.map((s) => (s.id === id ? { ...s, type } : s)));
    },
    [],
  );

  const handleDurationChange = useCallback(
    (id: string, duration: StopDuration, nights: number) => {
      setStops((prev) =>
        prev.map((s) => (s.id === id ? { ...s, duration, nights } : s)),
      );
    },
    [],
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStops((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleRouteCalculated = useCallback((calculatedRoute: RouteResult) => {
    setRoute(calculatedRoute);
  }, []);

  const handleSave = useCallback(async () => {
    if (!tripTitle.trim() || stops.length === 0) return;

    setIsSaving(true);
    try {
      const tripId = await createTrip(tripTitle, stops);
      router.push(`/trip/${tripId}`);
    } catch (error) {
      console.error("Error saving trip:", error);
      alert("Failed to save trip. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [tripTitle, stops, router]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold hover:text-primary">
              Route Planner
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <Input
              value={tripTitle}
              onChange={(e) => setTripTitle(e.target.value)}
              className="w-64 border-none bg-transparent text-lg font-semibold focus-visible:ring-1"
            />
          </div>
          <div className="flex items-center gap-4">
            {/* Start date picker */}
            <div className="flex items-center gap-2">
              <Label
                htmlFor="start-date"
                className="text-sm text-muted-foreground"
              >
                Start:
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-36 h-8 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || stops.length === 0}
              >
                {isSaving ? "Saving..." : "Save Trip"}
              </Button>
              <Button size="sm" disabled={stops.length < 2}>
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats bar - like WilderTrips */}
      {stops.length > 0 && (
        <div className="shrink-0 bg-primary text-primary-foreground">
          <div className="flex items-center justify-center gap-8 px-4 py-2 text-sm">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">{tripStats.days}</span>
              <span className="text-xs opacity-80">days</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">{tripStats.stops}</span>
              <span className="text-xs opacity-80">stops</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">
                {(tripStats.distance / 1609.34).toFixed(0)}
              </span>
              <span className="text-xs opacity-80">miles</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">
                {(tripStats.duration / 3600).toFixed(1)}
              </span>
              <span className="text-xs opacity-80">hours</span>
            </div>
            {tripStats.countries > 0 && (
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold">{tripStats.countries}</span>
                <span className="text-xs opacity-80">
                  {tripStats.countries === 1 ? "country" : "countries"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-96 shrink-0 flex-col border-r bg-muted/30">
          {/* Header */}
          <div className="shrink-0 border-b p-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Your route {stops.length > 0 && `(${stops.length} stops)`}
              </Label>
              {stops.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs text-muted-foreground"
                  onClick={() => setStops([])}
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Stops list */}
          <div className="flex-1 overflow-y-auto p-4">
            {stops.length === 0 ? (
              /* Empty state - show search prominently */
              <div className="space-y-4">
                <div className="text-center">
                  <p className="font-medium">Where are you starting?</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Search for your first stop or click the map
                  </p>
                </div>

                {isSettingHome ? (
                  /* Setting home address mode */
                  <div className="space-y-3">
                    <PlaceSearch
                      onSelect={(place) => {
                        saveHomeAddress({
                          name: place.name,
                          fullName: place.fullName,
                          coordinates: place.coordinates,
                          country: place.country,
                        });
                      }}
                      placeholder="Search for your home address..."
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setIsSettingHome(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  /* Normal search */
                  <>
                    <PlaceSearch
                      onSelect={handlePlaceSelect}
                      placeholder="Search for a place..."
                    />

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs text-muted-foreground">or</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    {/* Home address options */}
                    {homeAddress ? (
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={handleStartFromHome}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                          </svg>
                          Start from home
                          <span className="ml-auto truncate text-xs text-muted-foreground">
                            {homeAddress.name}
                          </span>
                        </Button>
                        <button
                          className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setIsSettingHome(true)}
                        >
                          Change home address
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => setIsSettingHome(true)}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                        Set home address
                      </Button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stops.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-6">
                    {dayGroups.map((day, dayIndex) => {
                      // Get the last stop index for this day (for adding at end of day)
                      const lastStopInDay = day.stops[day.stops.length - 1];
                      const isLastDay = dayIndex === dayGroups.length - 1;

                      return (
                        <div
                          key={day.dayNumber}
                          className="rounded-lg border bg-card"
                        >
                          {/* Day header */}
                          <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-primary">
                                Day {day.dayNumber}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatDateShort(day.date)}
                              </span>
                            </div>
                            {day.totalDistance > 0 && (
                              <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                                {(day.totalDistance / 1609.34).toFixed(1)} mi •{" "}
                                {formatDuration(day.totalDuration)}
                              </span>
                            )}
                          </div>

                          {/* Stops for this day */}
                          <div className="p-2">
                            {/* Show arrival drive from previous day's overnight if applicable */}
                            {day.arrivalDrive && (
                              <div className="mb-2 ml-5 flex items-center gap-2 py-1">
                                <div className="flex flex-col items-center">
                                  <div className="h-2 w-0.5 bg-border" />
                                  <div className="h-2 w-2 rounded-full border-2 border-muted-foreground/30" />
                                  <div className="h-2 w-0.5 bg-border" />
                                </div>
                                <div className="flex items-center gap-3 rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">
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
                                    {formatDistance(day.arrivalDrive.distance)}
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
                                    {formatDuration(day.arrivalDrive.duration)}
                                  </span>
                                  <span className="text-blue-600">
                                    from overnight
                                  </span>
                                </div>
                              </div>
                            )}

                            {day.stops.map((item, stopIndex) => {
                              const isLastInDay =
                                stopIndex === day.stops.length - 1;
                              const isLastStopOverall =
                                isLastInDay && isLastDay;
                              const showInlineSearch =
                                activeInsertIndex === item.originalIndex;

                              // Show connector with drive info between stops in same day
                              // Hide connector if: inline search is open, or it's the last stop of the day
                              // (overnight stay = day boundary, no drive info to show until next day)
                              const shouldHideConnector =
                                showInlineSearch || isLastInDay;

                              return (
                                <div key={item.stop.id}>
                                  <SortableStopItem
                                    stop={item.stop}
                                    index={item.originalIndex}
                                    isLast={isLastStopOverall}
                                    onRemove={handleRemoveStop}
                                    onTypeChange={handleTypeChange}
                                    onDurationChange={handleDurationChange}
                                    onAddAfter={handleAddAfter}
                                    isSelected={item.stop.id === selectedStopId}
                                    onClick={() =>
                                      setSelectedStopId(item.stop.id)
                                    }
                                    segmentToNext={
                                      shouldHideConnector
                                        ? null
                                        : item.segmentToNext
                                    }
                                    hideConnector={shouldHideConnector}
                                  />

                                  {/* Inline search when adding after this stop */}
                                  {showInlineSearch && (
                                    <div className="my-2 ml-8">
                                      <InlineAddStop
                                        onSelect={(place) =>
                                          handlePlaceSelect(
                                            place,
                                            item.originalIndex,
                                          )
                                        }
                                        onCancel={() =>
                                          setActiveInsertIndex(null)
                                        }
                                        placeholder="Search for next stop..."
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Add stop at end of this day */}
                            <div className="mt-2 ml-8">
                              <div className="flex items-center rounded-lg border border-dashed border-muted-foreground/30 px-3 py-2">
                                <svg
                                  className="mr-2 h-4 w-4 text-muted-foreground/50"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                  />
                                </svg>
                                <input
                                  type="text"
                                  placeholder="Add stop"
                                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                                  onFocus={() => {
                                    if (lastStopInDay) {
                                      setActiveInsertIndex(
                                        lastStopInDay.originalIndex,
                                      );
                                    }
                                  }}
                                  readOnly
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1">
          <EditorMap
            stops={stops}
            selectedStopId={selectedStopId}
            onStopSelect={setSelectedStopId}
            onRouteCalculated={handleRouteCalculated}
            onAddFromMap={handleAddFromMap}
            dayOptions={dayOptions}
            className="h-full w-full"
          />
        </main>
      </div>
    </div>
  );
}
