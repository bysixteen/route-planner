"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { getTripById, deleteTrip } from "@/lib/supabase/queries";
import { TripMap, type TripMapHandle } from "@/components/map/trip-map";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RouteResult } from "@/lib/mapbox/directions";
import type { CampsiteOption } from "@/lib/campsite-options";
import { ChevronLeft } from "lucide-react";

import { DayByDayView } from "./day-by-day";
import { TripCockpit } from "@/components/trip/trip-cockpit";
import { TripDock, type TripView } from "@/components/trip/trip-dock";
import { StopDetailPanel } from "@/components/trip/stop-detail-panel";
import { PackingList } from "@/components/trip/packing-list";
import { BottomSheet, type Detent } from "@/components/trip/bottom-sheet";
import { NavigateButton } from "@/components/trip/navigate-button";
import { CopyButton } from "@/components/trip/copy-button";
import { Badge } from "@/components/ui/badge";
import { formatDistance, formatDuration } from "@/lib/mapbox/directions";
import { getBookingExtraForStop } from "@/lib/booking-details";
import {
  BOOKABLE_TYPES,
  buildDriveLegs,
  countryFlag,
  getBookingStatus,
  todayKey,
  type DriveLeg,
  type SupabaseStop,
  type SupabaseTrip,
} from "@/lib/trip-detail";

// ---------------------------------------------------------------------------
// Map-specific type (TripMap expects this shape)
// ---------------------------------------------------------------------------

interface MapStop {
  _id: string;
  name: string;
  type: SupabaseStop["type"];
  location: { _type: "geopoint"; lat: number; lng: number };
  country?: string;
  arrivalDate?: string;
  departureDate?: string;
  nights?: number;
  notes?: string;
  bookingReference?: string;
  cost?: number;
  currency?: "EUR" | "GBP" | "HUF" | "CHF";
}

type View = TripView;

// Alternative-campsite options are no longer shown — bookings are set.
// Stable empty reference so the map effect doesn't re-run each render.
const MAP_OPTIONS: CampsiteOption[] = [];

function getDaysUntilDeparture(startDate: string | null): number | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function convertStopsForMap(stops: SupabaseStop[]): MapStop[] {
  return [...stops]
    .sort((a, b) => a.position - b.position)
    .map((stop) => ({
      _id: stop.id,
      name: stop.name,
      type: stop.type,
      location: { _type: "geopoint" as const, lat: stop.lat, lng: stop.lng },
      country: stop.country || undefined,
      arrivalDate: stop.arrival_date || undefined,
      departureDate: stop.departure_date || undefined,
      nights: stop.nights,
      notes: stop.notes || undefined,
      // Ring shows booked when the DB has a ref OR an email-confirmed override.
      bookingReference:
        stop.booking_reference ||
        (getBookingStatus(stop) === "confirmed" ? "confirmed" : undefined),
      cost: stop.cost ?? undefined,
      currency: (stop.currency as MapStop["currency"]) || undefined,
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
  const [loadError, setLoadError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [view, setView] = useState<View>("cockpit");
  const [detent, setDetent] = useState<Detent>("half");
  const [routeLeg, setRouteLeg] = useState<"both" | "outbound" | "return">(
    "both",
  );
  const [selectedLeg, setSelectedLeg] = useState<DriveLeg | null>(null);

  const loadTrip = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getTripById(tripId);
      setTrip((data as SupabaseTrip) ?? null);
    } catch (error) {
      console.error("Error fetching trip:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const handleRouteCalculated = useCallback((r: RouteResult) => setRoute(r), []);

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

  const eventStopIndex = useMemo(
    () => sortedStops.findIndex((s) => s.type === "event"),
    [sortedStops],
  );

  // Shared drive-legs lookup so the map + list select the same thing.
  const allLegs = useMemo(
    () => buildDriveLegs(sortedStops, route?.segments),
    [sortedStops, route],
  );
  const selectStopByIndex = useCallback(
    (index: number) => {
      const leg = allLegs.find((l) => l.index === index);
      if (!leg) return;
      setSelectedLeg((cur) => (cur?.index === index ? null : leg));
      // Selecting always lands in the cockpit/route view so the dock highlight
      // never lies about what's on screen; raise the mobile sheet to half.
      setView("cockpit");
      setDetent((d) => (d === "peek" ? "half" : d));
      mapRef.current?.flyToStop(index);
    },
    [allLegs],
  );

  // From the itinerary: open a stop on the map (always selects, never toggles).
  const showStopOnMap = useCallback(
    (index: number) => {
      const leg = allLegs.find((l) => l.index === index);
      if (!leg) return;
      setSelectedLeg(leg);
      setView("cockpit");
      setDetent((d) => (d === "peek" ? "half" : d));
      mapRef.current?.flyToStop(index);
    },
    [allLegs],
  );

  // Mobile: opening the Route view lifts the sheet off the peek state; the
  // map is reached by dragging the sheet down to peek (no separate Map tab).
  useEffect(() => {
    if (view === "cockpit") setDetent((d) => (d === "peek" ? "half" : d));
  }, [view]);

  // The next upcoming overnight leg — the peek/half sheet's glanceable card.
  const nextLeg = useMemo(() => {
    const today = todayKey();
    return (
      allLegs.find((l) => l.stop.nights > 0 && (l.date ?? "9999") >= today) ??
      allLegs.find((l) => l.stop.nights > 0) ??
      null
    );
  }, [allLegs]);

  // Outbound / Return leg filter → dims the other leg on the map.
  const focusRange = useMemo((): [number, number] | null => {
    if (eventStopIndex < 0 || routeLeg === "both") return null;
    return routeLeg === "outbound"
      ? [0, eventStopIndex]
      : [eventStopIndex, sortedStops.length - 1];
  }, [routeLeg, eventStopIndex, sortedStops.length]);

  const bookingHealth = useMemo(() => {
    const bookable = sortedStops.filter((s) => BOOKABLE_TYPES.has(s.type));
    const confirmed = bookable.filter(
      (s) => getBookingStatus(s) === "confirmed",
    );
    return { confirmed: confirmed.length, total: bookable.length };
  }, [sortedStops]);

  const totalStopCost = useMemo(() => {
    const withCost = sortedStops.filter((s) => s.cost != null);
    if (withCost.length === 0) return null;
    return withCost.reduce((sum, s) => sum + (s.cost ?? 0), 0);
  }, [sortedStops]);

  const totalNights = useMemo(
    () => sortedStops.reduce((sum, s) => sum + s.nights, 0),
    [sortedStops],
  );

  const countriesCount = useMemo(
    () => new Set(sortedStops.map((s) => s.country).filter(Boolean)).size,
    [sortedStops],
  );

  const daysUntil = useMemo(
    () => getDaysUntilDeparture(trip?.start_date ?? null),
    [trip?.start_date],
  );

  // ---- Loading / not found ----

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <p className="animate-pulse text-muted-foreground">Loading trip…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <h1 className="font-display text-2xl font-bold">
          Couldn&apos;t load this trip
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Check your connection and try again.
        </p>
        <div className="flex gap-2">
          <Button onClick={loadTrip}>Retry</Button>
          <Link href="/">
            <Button variant="outline">Back to trips</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background">
        <h1 className="font-display text-2xl font-bold">Trip not found</h1>
        <Link href="/">
          <Button>Back to trips</Button>
        </Link>
      </div>
    );
  }

  // State-adaptive: "N days to go" → "Departure day" → "Day x of y" → hidden.
  function countdownLabel(): string | null {
    if (daysUntil == null) return null;
    if (daysUntil > 0) return `${daysUntil} days to go`;
    if (daysUntil === 0) return "Departure day";
    if (trip?.start_date && trip?.end_date) {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      const now = new Date();
      [start, end, now].forEach((d) => d.setHours(0, 0, 0, 0));
      if (now > end) return null; // trip complete
      const totalDays =
        Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
      const dayOf =
        Math.round((now.getTime() - start.getTime()) / 86400000) + 1;
      return `Day ${dayOf} of ${totalDays}`;
    }
    return "In progress";
  }

  // ---- Main render ----

  const selectedBooking = selectedLeg ? getBookingStatus(selectedLeg.stop) : null;

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-background print:h-auto print:overflow-visible">
      {/* The map IS the page. One floating dock is the only persistent chrome. */}
      <div className="relative flex-1 overflow-hidden bg-background print:overflow-visible">
        {/* Full-bleed map canvas — always mounted (drives route calc). */}
        <div
          className={cn(
            "absolute inset-0 print:hidden",
            view === "cockpit" ? "visible" : "invisible",
          )}
        >
          <TripMap
            ref={mapRef}
            stops={stops}
            options={MAP_OPTIONS}
            maxDrivingMinutes={maxDrivingMinutes}
            returnFromSegment={eventStopIndex >= 0 ? eventStopIndex : undefined}
            focusRange={focusRange}
            onSelectStop={selectStopByIndex}
            onRouteCalculated={handleRouteCalculated}
            className="h-full"
          />
        </div>

        {/* Ambient countdown chip — canvas states only, clear of the
            top-centre style switcher. Volt only when departure is near. */}
        {view === "cockpit" && countdownLabel() && (
          <div
            className={cn(
              "glass absolute left-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-20 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium tabular-nums print:hidden",
              daysUntil != null && daysUntil >= 0 && daysUntil <= 7
                ? "text-volt-bright"
                : "text-foreground",
            )}
          >
            {countdownLabel()}
          </div>
        )}

        {/* Desktop: floating cockpit rail — Route view shows the list; Map view
            clears it to a full-bleed map (that's the difference between them). */}
        {view === "cockpit" && (
          <aside className="glass pointer-events-auto absolute z-20 hidden flex-col overflow-hidden rounded-2xl border border-white/10 md:inset-y-4 md:left-4 md:right-auto md:bottom-4 md:top-4 md:flex md:w-[380px]">
            <TripCockpit
              trip={trip}
              sortedStops={sortedStops}
              route={route}
              totalNights={totalNights}
              bookingHealth={bookingHealth}
              eventStopIndex={eventStopIndex}
              routeLeg={routeLeg}
              onRouteLegChange={setRouteLeg}
              selectedIndex={selectedLeg?.index ?? null}
              onSelectStop={(leg) => selectStopByIndex(leg.index)}
            />
          </aside>
        )}

        {/* Desktop: stop detail right rail (component is hidden md:flex) */}
        {view === "cockpit" && selectedLeg && (
          <StopDetailPanel
            leg={selectedLeg}
            onClose={() => setSelectedLeg(null)}
          />
        )}

        {/* Mobile: ONE content sheet — stop list ⇄ stop detail, three detents */}
        {view === "cockpit" && (
          <BottomSheet
            detent={detent}
            onDetentChange={setDetent}
            bodyKey={selectedLeg ? `stop-${selectedLeg.index}` : "list"}
            header={
              selectedLeg ? (
                <div className="flex items-center gap-2 px-3 pb-3">
                  <button
                    type="button"
                    onClick={() => setSelectedLeg(null)}
                    aria-label="Back to stops"
                    className="focus-ring -ml-1 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <span className="font-display min-w-0 flex-1 truncate text-base font-semibold">
                    {countryFlag(selectedLeg.stop.country)}{" "}
                    {selectedLeg.stop.name}
                  </span>
                  {selectedBooking === "confirmed" && (
                    <Badge variant="booked">Booked</Badge>
                  )}
                  {selectedBooking === "pending" && (
                    <Badge variant="unbooked">Not booked</Badge>
                  )}
                </div>
              ) : nextLeg ? (
                (() => {
                  const s = nextLeg.stop;
                  const nx = getBookingExtraForStop(s);
                  const ref = s.booking_reference ?? nx?.refs?.[0]?.value;
                  return (
                    <div className="px-4 pb-3">
                      <button
                        type="button"
                        onClick={() => selectStopByIndex(nextLeg.index)}
                        className="focus-ring flex w-full items-center gap-2 rounded-lg text-left"
                      >
                        <span className="rounded bg-highlight px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-highlight-foreground">
                          Next
                        </span>
                        <span className="font-display min-w-0 flex-1 truncate text-[15px] font-semibold">
                          {countryFlag(s.country)} {s.name}
                        </span>
                        {nextLeg.minutes > 0 && (
                          <span className="shrink-0 text-[13px] tabular-nums text-muted-foreground">
                            {formatDuration(nextLeg.minutes * 60)} ·{" "}
                            {formatDistance(nextLeg.distance)}
                          </span>
                        )}
                      </button>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <NavigateButton
                          lat={s.lat}
                          lng={s.lng}
                          label={nx?.address ?? s.name}
                        />
                        {ref && (
                          <CopyButton
                            value={ref}
                            label={ref}
                            title="Copy booking reference"
                            className="font-mono"
                          />
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center gap-2 px-5 pb-2">
                  <span className="font-display truncate text-sm font-semibold">
                    {trip.title}
                  </span>
                </div>
              )
            }
          >
            {selectedLeg ? (
              <StopDetailPanel
                leg={selectedLeg}
                onClose={() => setSelectedLeg(null)}
                embedded
              />
            ) : (
              <TripCockpit
                trip={trip}
                sortedStops={sortedStops}
                route={route}
                totalNights={totalNights}
                bookingHealth={bookingHealth}
                eventStopIndex={eventStopIndex}
                routeLeg={routeLeg}
                onRouteLegChange={setRouteLeg}
                selectedIndex={null}
                onSelectStop={(leg) => selectStopByIndex(leg.index)}
                flat
              />
            )}
          </BottomSheet>
        )}

        {/* Itinerary overlay — covers the shell when active (map stays mounted).
            z-30 sits above the mobile sheet; always printable. */}
        <div
          className={cn(
            "scroll-fade absolute inset-0 z-30 overflow-y-auto bg-background print:static print:block print:h-auto print:overflow-visible",
            view === "itinerary" ? "block" : "hidden print:block",
          )}
        >
          <DayByDayView
            trip={trip}
            sortedStops={sortedStops}
            route={route}
            totalNights={totalNights}
            countriesCount={countriesCount}
            totalStopCost={totalStopCost}
            bookingHealth={bookingHealth}
            onShowOnMap={showStopOnMap}
            onOpenPacking={() => setView("packing")}
          />
        </div>

        {/* Pack overlay — same idiom as the itinerary; map stays mounted
            underneath so returning is instant (no Mapbox re-init). */}
        {view === "packing" && (
          <div className="scroll-fade absolute inset-0 z-30 overflow-y-auto bg-background print:hidden">
            <PackingList onBack={() => setView("cockpit")} />
          </div>
        )}

        {/* The one piece of persistent chrome */}
        <TripDock
          view={view}
          onViewChange={setView}
          tripTitle={trip.title}
          onPrint={() => window.print()}
          onDelete={handleDelete}
          deleting={deleting}
        />
      </div>
    </div>
  );
}
