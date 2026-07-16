/**
 * Shared types + pure helpers for the trip detail views
 * (trip-page-client, day-detail-sheet, print-day-sheet).
 */

import { getBookingExtraForStop } from "@/lib/booking-details";

export type StopType =
  | "campsite"
  | "city"
  | "attraction"
  | "rest"
  | "event"
  | "transport";

export interface SupabaseStop {
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
  /** Optional — present in the shared Stop type, not always in the query. */
  amenities?: string[] | null;
}

export interface SupabaseTrip {
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

export type BookingStatus = "confirmed" | "pending" | null;

export interface DayGroup {
  key: string;
  label: string;
  stops: SupabaseStop[];
  /** Original indices into sortedStops for flyToStop + segment lookup. */
  indices: number[];
}

export const BOOKABLE_TYPES: ReadonlySet<StopType> = new Set([
  "campsite",
  "transport",
]);

/** ISO date (YYYY-MM-DD) for "today" in local time. */
export function todayKey(): string {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

/** green (< 4 h) · amber (within max) · red (over max). */
export function segmentHealthKey(
  durationSeconds: number,
  maxMinutes: number,
): "green" | "amber" | "red" {
  const hours = durationSeconds / 3600;
  if (hours < 4) return "green";
  if (hours <= maxMinutes / 60) return "amber";
  return "red";
}

export const SEGMENT_HEALTH_BG: Record<string, string> = {
  green: "bg-health-good",
  amber: "bg-health-warn",
  red: "bg-health-bad",
};

export function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(dateString: string | null): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function formatDayHeader(
  dateString: string,
  startDate: string | null,
): string {
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

export function getBookingStatus(stop: SupabaseStop): BookingStatus {
  if (stop.booking_reference) return "confirmed";
  // Some stops are confirmed only via a forwarded email (no DB reference yet).
  if (getBookingExtraForStop(stop)?.confirmed) return "confirmed";
  if (BOOKABLE_TYPES.has(stop.type)) return "pending";
  return null;
}

export function formatCost(amount: number, currency: string | null): string {
  const symbol = currency === "GBP" ? "£" : currency === "HUF" ? "Ft " : "€";
  if (currency === "HUF")
    return `${symbol}${Math.round(amount).toLocaleString("en-GB")}`;
  return `${symbol}${amount.toFixed(0)}`;
}

export interface PaymentSummary {
  label: string;
  /** "paid" = settled (green); "outstanding" = balance due (amber). */
  tone: "paid" | "outstanding";
}

/**
 * Payment progress for a stop, derived from its booking `payment` extra plus
 * the stop's `cost`/`currency`. Returns null when no payment info is recorded.
 */
export function getPaymentSummary(stop: SupabaseStop): PaymentSummary | null {
  const p = getBookingExtraForStop(stop)?.payment;
  if (!p) return null;
  const currency = p.currency ?? stop.currency;
  const total = p.total ?? stop.cost ?? null;
  const paid = p.paid ?? null;

  if (p.paidInFull || (total != null && paid != null && paid >= total)) {
    return { label: "Paid in full", tone: "paid" };
  }
  if (total != null && paid != null) {
    const outstanding = Math.max(0, total - paid);
    return {
      label: `Paid ${formatCost(paid, currency)} · ${formatCost(outstanding, currency)} outstanding`,
      tone: "outstanding",
    };
  }
  if (p.note) return { label: p.note, tone: "outstanding" };
  if (total != null) {
    return {
      label: `${formatCost(total, currency)} outstanding`,
      tone: "outstanding",
    };
  }
  return null;
}

/** True for a 0-night pass-through stop that isn't first or last. */
export function isWaypoint(
  stop: SupabaseStop,
  index: number,
  total: number,
): boolean {
  return stop.nights === 0 && index > 0 && index < total - 1;
}

/** Sum of a day group's outgoing segments (duration s, distance m). */
export function dayDriveStats(
  indices: number[],
  segments: { duration: number; distance: number }[] | undefined,
): { duration: number; distance: number } | null {
  if (!segments) return null;
  let duration = 0;
  let distance = 0;
  let found = false;
  for (const idx of indices) {
    const seg = segments[idx];
    if (seg) {
      duration += seg.duration;
      distance += seg.distance;
      found = true;
    }
  }
  return found ? { duration, distance } : null;
}

const COUNTRY_FLAGS: Record<string, string> = {
  "United Kingdom": "🇬🇧",
  UK: "🇬🇧",
  England: "🇬🇧",
  France: "🇫🇷",
  Belgium: "🇧🇪",
  Germany: "🇩🇪",
  Netherlands: "🇳🇱",
  Austria: "🇦🇹",
  Hungary: "🇭🇺",
  Switzerland: "🇨🇭",
  Italy: "🇮🇹",
  Luxembourg: "🇱🇺",
  Slovenia: "🇸🇮",
  Croatia: "🇭🇷",
  "Czech Republic": "🇨🇿",
  Czechia: "🇨🇿",
  Slovakia: "🇸🇰",
};

export function countryFlag(country: string | null | undefined): string {
  if (!country) return "";
  return COUNTRY_FLAGS[country] ?? "";
}

export interface DriveLeg {
  dayNumber: number;
  date: string | null;
  stop: SupabaseStop;
  /** Global index into sortedStops — use for map flyToStop. */
  index: number;
  prevStop: SupabaseStop | null;
  waypoints: SupabaseStop[];
  minutes: number;
  distance: number; // metres
}

/**
 * One leg per overnight/destination stop (waypoints folded in), with the
 * cumulative drive from the previous overnight. Powers the cockpit stop
 * list and the Drive Energy graph.
 */
export function buildDriveLegs(
  sortedStops: SupabaseStop[],
  segments: { duration: number; distance: number }[] | undefined,
): DriveLeg[] {
  const legs: DriveLeg[] = [];
  let dayNum = 1;
  let pendingWaypoints: SupabaseStop[] = [];
  let prevStop: SupabaseStop | null = null;
  let prevIndex = -1;

  sortedStops.forEach((stop, index) => {
    const isFirst = index === 0;
    const isLast = index === sortedStops.length - 1;
    const waypoint = stop.nights === 0 && !isFirst && !isLast;

    if (waypoint) {
      pendingWaypoints.push(stop);
      return;
    }

    if (isFirst && stop.nights === 0) {
      prevStop = stop;
      prevIndex = 0;
      pendingWaypoints = [];
      return;
    }

    let minutes = 0;
    let distance = 0;
    if (prevIndex >= 0 && segments) {
      for (let i = prevIndex; i < index; i++) {
        const seg = segments[i];
        if (seg) {
          minutes += seg.duration / 60;
          distance += seg.distance;
        }
      }
    }

    legs.push({
      dayNumber: dayNum++,
      date: stop.arrival_date,
      stop,
      index,
      prevStop,
      waypoints: [...pendingWaypoints],
      minutes: Math.round(minutes),
      distance,
    });

    prevStop = stop;
    prevIndex = index;
    pendingWaypoints = [];
  });

  return legs;
}
