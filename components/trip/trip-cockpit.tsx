"use client";

import { useEffect, useMemo, useRef } from "react";
import { ChevronRight } from "lucide-react";

import { formatDistance, type RouteResult } from "@/lib/mapbox/directions";
import { cn } from "@/lib/utils";
import {
  buildDriveLegs,
  countryFlag,
  getBookingStatus,
  todayKey,
  type DriveLeg,
  type SupabaseStop,
  type SupabaseTrip,
} from "@/lib/trip-detail";

/** Compact duration for the narrow stat wells, e.g. "52h 9m". */
function compactDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

type RouteLeg = "both" | "outbound" | "return";

interface TripCockpitProps {
  trip: SupabaseTrip;
  sortedStops: SupabaseStop[];
  route: RouteResult | null;
  totalNights: number;
  bookingHealth: { confirmed: number; total: number };
  eventStopIndex: number;
  routeLeg: RouteLeg;
  onRouteLegChange: (leg: RouteLeg) => void;
  /** The globally-selected stop index (drives the right detail panel). */
  selectedIndex: number | null;
  /** Select a stop → opens the detail panel + flies the map. */
  onSelectStop: (leg: DriveLeg) => void;
}

/**
 * The cockpit trip rail — glanceable stats + a tap-to-open stop list.
 * Selecting a stop opens the detail panel on the right (master-detail).
 */
export function TripCockpit({
  trip,
  sortedStops,
  route,
  totalNights,
  bookingHealth,
  eventStopIndex,
  routeLeg,
  onRouteLegChange,
  selectedIndex,
  onSelectStop,
}: TripCockpitProps) {
  const allLegs = useMemo(
    () => buildDriveLegs(sortedStops, route?.segments),
    [sortedStops, route],
  );

  // Filter the visible legs to the selected outbound/return leg.
  const legs = useMemo(() => {
    if (eventStopIndex < 0 || routeLeg === "both") return allLegs;
    return allLegs.filter((l) =>
      routeLeg === "outbound"
        ? l.index <= eventStopIndex
        : l.index > eventStopIndex,
    );
  }, [allLegs, routeLeg, eventStopIndex]);

  const today = todayKey();
  const nextIndex = useMemo(() => {
    const upcoming = allLegs.find(
      (l) => l.stop.nights > 0 && (l.date ?? "9999") >= today,
    );
    return (
      upcoming?.index ?? allLegs.find((l) => l.stop.nights > 0)?.index ?? null
    );
  }, [allLegs, today]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the selected stop visible in the list.
  useEffect(() => {
    if (selectedIndex == null) return;
    scrollRef.current
      ?.querySelector<HTMLElement>('[data-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header — separated from the body by space, not a keyline */}
      <div className="shrink-0 px-4 pb-4 pt-3 sm:px-5 md:pt-4">
        <h1 className="font-display text-xl font-bold tracking-tight">
          {trip.title}
        </h1>

        {/* Range-style glanceable stats */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat
            value={route ? formatDistance(route.totalDistance) : ""}
            label="Distance"
            loading={!route}
          />
          <Stat
            value={route ? compactDuration(route.totalDuration) : ""}
            label="Drive"
            loading={!route}
          />
          <Stat value={String(totalNights)} label="Nights" />
        </div>

        {/* Route leg filter */}
        {eventStopIndex >= 0 && (
          <div className="mt-3 flex items-center gap-1 rounded-full bg-white/[0.06] p-0.5 text-[11px]">
            {(["both", "outbound", "return"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onRouteLegChange(l)}
                className={cn(
                  "focus-ring flex-1 rounded-full px-2 py-1.5 font-medium capitalize transition-colors",
                  routeLeg === l
                    ? "bg-white/[0.1] text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stop list */}
      <div
        ref={scrollRef}
        className="scroll-fade min-h-0 flex-1 overflow-y-auto px-5 pb-4"
      >
        <div className="flex items-center justify-between">
          <span className="coordinate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Stops
          </span>
          <span className="font-display text-[10px] tabular-nums text-muted-foreground">
            {bookingHealth.confirmed}/{bookingHealth.total} booked
          </span>
        </div>

        <div className="mt-2 flex flex-col">
          {legs.map((leg) => (
            <StopRow
              key={leg.stop.id}
              stop={leg.stop}
              isNext={leg.index === nextIndex}
              selected={selectedIndex === leg.index}
              onSelect={() => onSelectStop(leg)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  loading,
}: {
  value: string;
  label: string;
  loading?: boolean;
}) {
  return (
    <div className="px-0.5">
      {loading ? (
        <div className="h-7 w-12 animate-pulse rounded bg-muted-foreground/20" />
      ) : (
        <div className="font-display text-[26px] font-normal leading-none tracking-tight tabular-nums">
          {value}
        </div>
      )}
      <div className="coordinate mt-2 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70">
        {label}
      </div>
    </div>
  );
}

function StopRow({
  stop,
  isNext,
  selected,
  onSelect,
}: {
  stop: SupabaseStop;
  isNext: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const booking = getBookingStatus(stop);
  const nightsText =
    stop.nights > 0 ? `${stop.nights} night${stop.nights > 1 ? "s" : ""}` : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      data-selected={selected ? "true" : undefined}
      aria-pressed={selected}
      className={cn(
        "focus-ring flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
        selected ? "bg-white/[0.07]" : "hover:bg-white/[0.035]",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="font-display truncate text-sm font-semibold">
            {countryFlag(stop.country)} {stop.name}
          </span>
          {isNext && (
            <span className="rounded bg-highlight px-1 py-px text-[8px] font-bold uppercase tracking-wide text-highlight-foreground">
              Next
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">
          {booking === "confirmed" && (
            <span className="text-health-good">Booked</span>
          )}
          {booking === "pending" && (
            <span className="text-health-warn">Not booked</span>
          )}
          {booking && nightsText && " · "}
          {nightsText}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
    </button>
  );
}
