"use client";

import { useState, useCallback } from "react";
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
import { type EditorStop, createEditorStop } from "@/lib/types";
import { createTrip } from "@/lib/supabase/queries";

export default function PlanPage() {
  const router = useRouter();
  const [tripTitle, setTripTitle] = useState("My Road Trip");
  const [stops, setStops] = useState<EditorStop[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handlePlaceSelect = useCallback((place: GeocodingResult) => {
    const newStop = createEditorStop(
      place.name,
      place.fullName,
      place.coordinates,
      place.country,
    );
    setStops((prev) => [...prev, newStop]);
    setSelectedStopId(newStop.id);
  }, []);

  const handleMapClick = useCallback(
    (lng: number, lat: number, name: string, country?: string) => {
      const newStop = createEditorStop(name, name, [lng, lat], country);
      setStops((prev) => [...prev, newStop]);
      setSelectedStopId(newStop.id);
    },
    [],
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
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-96 shrink-0 flex-col border-r bg-muted/30">
          {/* Search */}
          <div className="shrink-0 border-b p-4">
            <Label className="mb-2 block text-sm font-medium">Add a stop</Label>
            <PlaceSearch
              onSelect={handlePlaceSelect}
              placeholder="Search for a place..."
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Or click anywhere on the map to add a stop
            </p>
          </div>

          {/* Stops list */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm font-medium">
                Stops ({stops.length})
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

            {stops.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                <p>No stops yet</p>
                <p className="mt-1">Search above or click the map</p>
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
                  <div className="space-y-2">
                    {stops.map((stop, index) => (
                      <SortableStopItem
                        key={stop.id}
                        stop={stop}
                        index={index}
                        onRemove={handleRemoveStop}
                        onTypeChange={handleTypeChange}
                        isSelected={stop.id === selectedStopId}
                        onClick={() => setSelectedStopId(stop.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Stats */}
          {route && (
            <div className="shrink-0 border-t bg-background p-4">
              <Card>
                <CardContent className="grid grid-cols-2 gap-4 p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Distance
                    </p>
                    <p className="text-lg font-semibold">
                      {formatDistance(route.totalDistance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Driving Time
                    </p>
                    <p className="text-lg font-semibold">
                      {formatDuration(route.totalDuration)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </aside>

        {/* Map */}
        <main className="flex-1">
          <EditorMap
            stops={stops}
            selectedStopId={selectedStopId}
            onStopSelect={setSelectedStopId}
            onMapClick={handleMapClick}
            onRouteCalculated={handleRouteCalculated}
            className="h-full w-full"
          />
        </main>
      </div>
    </div>
  );
}
