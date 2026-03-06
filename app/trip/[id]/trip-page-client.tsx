"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { getTripById, deleteTrip } from "@/lib/supabase/queries";
import { TripMap, type TripMapHandle } from "@/components/map/trip-map";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatDistance,
  formatDuration,
  type RouteResult,
} from "@/lib/mapbox/directions";
import { CAMPSITE_OPTIONS } from "@/lib/campsite-options";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MapStop {
  _id: string;
  name: string;
  type: "campsite" | "city" | "attraction" | "rest" | "event" | "transport";
  location: {
    _type: "geopoint";
    lat: number;
    lng: number;
  };
  country?: string;
  arrivalDate?: string;
  departureDate?: string;
  nights?: number;
  notes?: string;
}

type StopType = "campsite" | "city" | "attraction" | "rest" | "event" | "transport";

interface SupabaseStop {
  id: string;
  name: string;
  full_name: string | null;
  lat: number;
  lng: number;
  country: string | null;
  type: StopType;
  arrival_date: string | null;
  departure_date: string | null;
  nights: number;
  notes: string | null;
  position: number;
  booking_reference: string | null;
  booking_url: string | null;
  cost: number | null;
  currency: string | null;
}

interface SupabaseTrip {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "planning" | "booked" | "in-progress" | "completed";
  max_driving_minutes: number;
  vehicles: {
    name: string;
    make: string | null;
    model: string | null;
    fuel_type: string | null;
    fuel_consumption: number | null;
  } | null;
  stops: SupabaseStop[];
}

type BookingStatus = "confirmed" | "pending" | null;

interface DayGroup {
  key: string;
  label: string;
  stops: SupabaseStop[];
  /** Original indices into sortedStops for flyToStop */
  indices: number[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLOURS: Record<string, string> = {
  planning: "bg-yellow-100 text-yellow-800",
  booked: "bg-blue-100 text-blue-800",
  "in-progress": "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
};

const TYPE_COLOURS: Record<string, string> = {
  campsite: "bg-green-100 text-green-800",
  city: "bg-blue-100 text-blue-800",
  attraction: "bg-amber-100 text-amber-800",
  rest: "bg-violet-100 text-violet-800",
  event: "bg-red-100 text-red-800",
  transport: "bg-cyan-100 text-cyan-800",
};

const BOOKING_COLOURS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
};

const SEGMENT_HEALTH_COLOURS: Record<string, string> = {
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

const BOOKABLE_TYPES: ReadonlySet<StopType> = new Set(["campsite", "transport"]);

const ASSUMED_FUEL_PRICE_EUR = 1.70;

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function segmentHealthKey(durationSeconds: number, maxMinutes: number): string {
  const hours = durationSeconds / 3600;
  if (hours < 4) return "green";
  if (hours <= maxMinutes / 60) return "amber";
  return "red";
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateString: string | null): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatDayHeader(dateString: string, startDate: string | null): string {
  const date = new Date(dateString);
  const dayName = date.toLocaleDateString("en-GB", { weekday: "long" });
  const dayMonth = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  if (startDate) {
    const start = new Date(startDate);
    const diffMs = date.getTime() - start.getTime();
    const dayNum = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return `Day ${dayNum} — ${dayName} ${dayMonth}`;
  }

  return `${dayName} ${dayMonth}`;
}

function getBookingStatus(stop: SupabaseStop): BookingStatus {
  if (stop.booking_reference) return "confirmed";
  if (BOOKABLE_TYPES.has(stop.type)) return "pending";
  return null;
}

function formatCost(amount: number, currency: string | null): string {
  const symbol = currency === "GBP" ? "£" : currency === "HUF" ? "Ft " : "€";
  if (currency === "HUF") return `${symbol}${Math.round(amount).toLocaleString("en-GB")}`;
  return `${symbol}${amount.toFixed(0)}`;
}

function getDaysUntilDeparture(startDate: string | null): number | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diffMs = start.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function convertStopsForMap(stops: SupabaseStop[]): MapStop[] {
  return stops
    .sort((a, b) => a.position - b.position)
    .map((stop) => ({
      _id: stop.id,
      name: stop.name,
      type: stop.type,
      location: {
        _type: "geopoint" as const,
        lat: stop.lat,
        lng: stop.lng,
      },
      country: stop.country || undefined,
      arrivalDate: stop.arrival_date || undefined,
      departureDate: stop.departure_date || undefined,
      nights: stop.nights,
      notes: stop.notes || undefined,
    }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TripPageClient() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const mapRef = useRef<TripMapHandle>(null);
  const [trip, setTrip] = useState<SupabaseTrip | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchTrip() {
      try {
        const data = await getTripById(tripId);
        setTrip(data as SupabaseTrip);
      } catch (error) {
        console.error("Error fetching trip:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrip();
  }, [tripId]);

  const handleRouteCalculated = useCallback((calculatedRoute: RouteResult) => {
    setRoute(calculatedRoute);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this trip?")) return;

    setDeleting(true);
    try {
      await deleteTrip(tripId);
      router.push("/");
    } catch (error) {
      console.error("Error deleting trip:", error);
      alert("Failed to delete trip.");
    } finally {
      setDeleting(false);
    }
  }, [tripId, router]);

  // ---- Derived data (hooks before conditional returns) ----

  const stops = useMemo(
    () => (trip ? convertStopsForMap(trip.stops) : []),
    [trip],
  );

  const sortedStops = useMemo(
    () => (trip ? [...trip.stops].sort((a, b) => a.position - b.position) : []),
    [trip],
  );

  const maxDrivingMinutes = trip?.max_driving_minutes || 300;

  // Day grouping
  const dayGroups = useMemo((): DayGroup[] => {
    if (sortedStops.length === 0) return [];

    const grouped = new Map<string, { stops: SupabaseStop[]; indices: number[] }>();
    const unscheduled: { stops: SupabaseStop[]; indices: number[] } = {
      stops: [],
      indices: [],
    };

    sortedStops.forEach((stop, index) => {
      if (stop.arrival_date) {
        const key = stop.arrival_date;
        if (!grouped.has(key)) {
          grouped.set(key, { stops: [], indices: [] });
        }
        grouped.get(key)!.stops.push(stop);
        grouped.get(key)!.indices.push(index);
      } else {
        unscheduled.stops.push(stop);
        unscheduled.indices.push(index);
      }
    });

    // Sort day groups by date
    const sortedKeys = [...grouped.keys()].sort();
    const result: DayGroup[] = sortedKeys.map((key) => ({
      key,
      label: formatDayHeader(key, trip?.start_date ?? null),
      stops: grouped.get(key)!.stops,
      indices: grouped.get(key)!.indices,
    }));

    if (unscheduled.stops.length > 0) {
      result.push({
        key: "unscheduled",
        label: "Unscheduled",
        stops: unscheduled.stops,
        indices: unscheduled.indices,
      });
    }

    return result;
  }, [sortedStops, trip?.start_date]);

  // Event stop index (for outbound/return split)
  const eventStopIndex = useMemo(() => {
    return sortedStops.findIndex((s) => s.type === "event");
  }, [sortedStops]);

  // Booking health
  const bookingHealth = useMemo(() => {
    const bookable = sortedStops.filter((s) => BOOKABLE_TYPES.has(s.type));
    const confirmed = bookable.filter((s) => s.booking_reference);
    return { confirmed: confirmed.length, total: bookable.length };
  }, [sortedStops]);

  // Total cost (campsite costs only — fuel added separately)
  const totalStopCost = useMemo(() => {
    const stopsWithCost = sortedStops.filter((s) => s.cost != null);
    if (stopsWithCost.length === 0) return null;
    return stopsWithCost.reduce((sum, s) => sum + (s.cost ?? 0), 0);
  }, [sortedStops]);

  // Fuel estimate
  const fuelEstimate = useMemo(() => {
    if (!route || !trip?.vehicles?.fuel_consumption) return null;
    const distanceKm = route.totalDistance / 1000;
    const litres = (distanceKm / 100) * trip.vehicles.fuel_consumption;
    const cost = litres * ASSUMED_FUEL_PRICE_EUR;
    return { litres: Math.round(litres), cost: Math.round(cost) };
  }, [route, trip?.vehicles?.fuel_consumption]);

  // Total nights
  const totalNights = useMemo(() => {
    return sortedStops.reduce((sum, s) => sum + s.nights, 0);
  }, [sortedStops]);

  // Days until departure
  const daysUntil = useMemo(
    () => getDaysUntilDeparture(trip?.start_date ?? null),
    [trip?.start_date],
  );

  // Countries count
  const countriesCount = useMemo(() => {
    return new Set(sortedStops.map((s) => s.country).filter(Boolean)).size;
  }, [sortedStops]);

  // Has day grouping (all stops have dates)?
  const hasDayGrouping = useMemo(() => {
    return sortedStops.length > 0 && sortedStops.some((s) => s.arrival_date);
  }, [sortedStops]);

  // Display numbers for overnight stops (waypoints are skipped)
  const stopDisplayNumbers = useMemo(() => {
    const map = new Map<number, number>();
    let num = 0;
    sortedStops.forEach((stop, index) => {
      const isWaypoint = stop.nights === 0 && index > 0 && index < sortedStops.length - 1;
      if (!isWaypoint) {
        num++;
        map.set(index, num);
      }
    });
    return map;
  }, [sortedStops]);

  // ---- Loading / not found ----

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading trip...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Trip not found</h1>
        <Link href="/">
          <Button>Back to trips</Button>
        </Link>
      </div>
    );
  }

  // ---- Countdown label ----
  function countdownLabel(): string | null {
    if (daysUntil == null) return null;
    if (daysUntil < 0) return "In progress";
    if (daysUntil === 0) return "Departure day";
    return `${daysUntil} days to go`;
  }

  // Total estimated cost
  const totalEstimated =
    (totalStopCost ?? 0) + (fuelEstimate?.cost ?? 0) || null;

  // ---- Render helpers ----

  /** Render a single stop card */
  function renderStopCard(stop: SupabaseStop, globalIndex: number) {
    const booking = getBookingStatus(stop);
    const isWaypoint = stop.nights === 0 && globalIndex > 0 && globalIndex < sortedStops.length - 1;

    // Waypoint: compact inline card
    if (isWaypoint) {
      return (
        <div
          key={stop.id}
          className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
          onClick={() => mapRef.current?.flyToStop(globalIndex)}
        >
          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-amber-500 rotate-45">
            <span className="sr-only">waypoint</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
              {stop.name}
            </span>
            {stop.notes && (
              <span className="ml-1.5 text-[11px] text-amber-600/80 dark:text-amber-400/70">
                — {stop.notes.split('.')[0]}
              </span>
            )}
          </div>
          <Badge className="bg-amber-200 text-amber-800 text-[9px] dark:bg-amber-800 dark:text-amber-200" variant="secondary">
            waypoint
          </Badge>
        </div>
      );
    }

    return (
      <Card
        key={stop.id}
        className="cursor-pointer shadow-none transition-colors hover:bg-muted/50"
        onClick={() => mapRef.current?.flyToStop(globalIndex)}
      >
        <CardContent className="flex items-start gap-3 p-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {stopDisplayNumbers.get(globalIndex) ?? globalIndex + 1}
          </div>
          <div className="min-w-0 flex-1">
            {/* Name + type + booking status */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold leading-tight">
                {stop.name}
              </span>
              <Badge
                className={`${TYPE_COLOURS[stop.type]} text-[10px]`}
                variant="secondary"
              >
                {stop.type}
              </Badge>
              {booking && (
                <Badge
                  className={`${BOOKING_COLOURS[booking]} text-[10px]`}
                  variant="secondary"
                >
                  {booking === "confirmed" ? "Confirmed" : "Pending"}
                </Badge>
              )}
            </div>

            {/* Full name */}
            {stop.full_name && stop.full_name !== stop.name && (
              <p className="text-xs text-muted-foreground">{stop.full_name}</p>
            )}

            {/* Country */}
            {stop.country && (
              <p className="text-xs text-muted-foreground">{stop.country}</p>
            )}

            {/* Dates + nights */}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {stop.arrival_date && (
                <span>
                  {formatDateShort(stop.arrival_date)}
                  {stop.departure_date &&
                    ` — ${formatDateShort(stop.departure_date)}`}
                </span>
              )}
              {stop.nights > 0 && (
                <span>
                  {stop.nights} night{stop.nights > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Cost — hidden if null */}
            {stop.cost != null && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatCost(stop.cost, stop.currency)}
                {stop.nights > 1 && (
                  <span className="text-muted-foreground/60">
                    {" "}
                    ({formatCost(stop.cost / stop.nights, stop.currency)}/night)
                  </span>
                )}
              </p>
            )}

            {/* Booking reference — hidden if null */}
            {stop.booking_reference && (
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
                Ref: {stop.booking_reference}
              </p>
            )}

            {/* Notes */}
            {stop.notes && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">
                {stop.notes}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  /** Render segment row between two consecutive stops */
  function renderSegment(globalIndex: number) {
    if (globalIndex >= sortedStops.length - 1) return null;

    return (
      <div className="flex items-center gap-2 px-3 py-1.5">
        <div className="flex flex-col items-center gap-1">
          <div className="h-3 w-px bg-border" />
          {route?.segments[globalIndex] ? (
            <div
              className={`h-2.5 w-2.5 rounded-full ${SEGMENT_HEALTH_COLOURS[segmentHealthKey(route.segments[globalIndex].duration, maxDrivingMinutes)]}`}
            />
          ) : (
            <div className="h-2.5 w-2.5 rounded-full bg-muted" />
          )}
          <div className="h-3 w-px bg-border" />
        </div>
        <div className="text-xs text-muted-foreground">
          {route?.segments[globalIndex] ? (
            <>
              <span className="font-medium text-foreground">
                {formatDuration(route.segments[globalIndex].duration)}
              </span>
              {" · "}
              {formatDistance(route.segments[globalIndex].distance)}
            </>
          ) : (
            <span className="italic">Calculating...</span>
          )}
        </div>
      </div>
    );
  }

  /** Render the outbound/return section divider */
  function renderLegDivider(label: string) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }

  // ---- Main render ----

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold hover:text-primary">
            Route Planner
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </header>

      {/* Summary bar */}
      <div className="flex-shrink-0 border-b px-4 py-2">
        {/* Row 1: title + status + vehicle */}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold leading-tight">{trip.title}</h1>
          <Badge className={STATUS_COLOURS[trip.status]} variant="secondary">
            {trip.status}
          </Badge>
          {trip.vehicles && (
            <span className="text-sm text-muted-foreground">
              · {trip.vehicles.name}
            </span>
          )}
          {countdownLabel() && (
            <Badge
              className={
                daysUntil != null && daysUntil <= 7
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }
              variant="secondary"
            >
              {countdownLabel()}
            </Badge>
          )}
        </div>

        {/* Row 2: metrics */}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          {(trip.start_date || trip.end_date) && (
            <span>
              {formatDate(trip.start_date)}
              {trip.end_date && ` — ${formatDate(trip.end_date)}`}
            </span>
          )}
          {route && (
            <>
              <span>{formatDistance(route.totalDistance)}</span>
              <span>{formatDuration(route.totalDuration)} driving</span>
            </>
          )}
          <span>{sortedStops.length} stops</span>
          {totalNights > 0 && (
            <span>{totalNights} nights</span>
          )}
          {countriesCount > 0 && (
            <span>{countriesCount} countries</span>
          )}
          <span
            className={
              bookingHealth.confirmed === bookingHealth.total && bookingHealth.total > 0
                ? "font-medium text-green-700"
                : bookingHealth.confirmed > 0
                  ? "font-medium text-amber-700"
                  : ""
            }
          >
            {bookingHealth.confirmed}/{bookingHealth.total} confirmed
          </span>
          {totalEstimated != null && (
            <span>~€{totalEstimated.toLocaleString("en-GB")} est.</span>
          )}
          {fuelEstimate && (
            <span>
              ~{fuelEstimate.litres}L fuel (~€{fuelEstimate.cost})
            </span>
          )}
        </div>
      </div>

      {/* Two-panel layout: sidebar + map */}
      <div className="flex flex-1 overflow-hidden">
        {/* Itinerary sidebar — desktop only */}
        <aside className="hidden w-[320px] flex-shrink-0 flex-col overflow-y-auto border-r md:flex">
          <div className="flex-1 pb-4">
            {hasDayGrouping ? (
              /* Day-grouped itinerary */
              dayGroups.map((group) => {
                // Check if this group contains the event stop — insert return divider after it
                const containsEvent =
                  eventStopIndex >= 0 &&
                  group.indices.includes(eventStopIndex);

                return (
                  <div key={group.key}>
                    {/* Outbound marker before first group */}
                    {group === dayGroups[0] && eventStopIndex >= 0 && (
                      renderLegDivider(`Outbound — ${eventStopIndex + 1} stops`)
                    )}

                    {/* Day header */}
                    <div className="sticky top-0 z-10 border-b bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                      {group.label}
                    </div>

                    {/* Stops in this day group */}
                    <div className="px-3 pt-1">
                      {group.stops.map((stop, i) => {
                        const globalIdx = group.indices[i];
                        return (
                          <div key={stop.id}>
                            {renderStopCard(stop, globalIdx)}
                            {renderSegment(globalIdx)}
                          </div>
                        );
                      })}
                    </div>

                    {/* Return divider after the event group */}
                    {containsEvent &&
                      eventStopIndex < sortedStops.length - 1 &&
                      renderLegDivider(
                        `Return — ${sortedStops.length - eventStopIndex - 1} stops`,
                      )}
                  </div>
                );
              })
            ) : (
              /* Flat list fallback */
              <div className="px-3 pt-2">
                {sortedStops.map((stop, index) => (
                  <div key={stop.id}>
                    {/* Outbound/return dividers in flat mode */}
                    {index === 0 && eventStopIndex >= 0 && (
                      renderLegDivider(`Outbound — ${eventStopIndex + 1} stops`)
                    )}
                    {index === eventStopIndex + 1 && eventStopIndex >= 0 && (
                      renderLegDivider(
                        `Return — ${sortedStops.length - eventStopIndex - 1} stops`,
                      )
                    )}
                    {renderStopCard(stop, index)}
                    {renderSegment(index)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Map — fills remaining space */}
        <div className="flex-1">
          <TripMap
            ref={mapRef}
            stops={stops}
            options={CAMPSITE_OPTIONS}
            maxDrivingMinutes={maxDrivingMinutes}
            returnFromSegment={
              eventStopIndex >= 0 ? eventStopIndex : undefined
            }
            onRouteCalculated={handleRouteCalculated}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
