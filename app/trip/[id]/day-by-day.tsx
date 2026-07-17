"use client";

import { useMemo } from "react";
import { formatDistance, formatDuration } from "@/lib/mapbox/directions";
import type { RouteResult } from "@/lib/mapbox/directions";
import { MAPBOX_TOKEN } from "@/lib/mapbox/config";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ---- Types ---------------------------------------------------------------

type StopType = "campsite" | "city" | "attraction" | "rest" | "event" | "transport";
type PaymentStatus = "confirmed" | "paid" | "on-arrival" | "outstanding" | "tbd";

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

interface TripData {
  title: string;
  start_date: string | null;
  end_date: string | null;
  vehicles: { name: string; make: string | null; model: string | null } | null;
}

interface DayEntry {
  type: "drive" | "rest";
  dayNumber: number;
  date: string | null;
  stop: SupabaseStop;
  prevStop: SupabaseStop | null;
  waypoints: SupabaseStop[];
  driveDuration: number;
  driveDistance: number;
}

export interface DayByDayProps {
  trip: TripData;
  sortedStops: SupabaseStop[];
  route: RouteResult | null;
  totalNights: number;
  countriesCount: number;
  totalStopCost: number | null;
  bookingHealth: { confirmed: number; total: number };
}

// ---- Helpers ---------------------------------------------------------------

function fmtDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtDayFull(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function fmtShort(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function fmtCost(amount: number, currency: string | null): string {
  const sym = currency === "GBP" ? "£" : currency === "HUF" ? "Ft " : "€";
  return `${sym}${Math.round(amount).toLocaleString("en-GB")}`;
}

const BOOKABLE: ReadonlySet<StopType> = new Set(["campsite", "transport"]);

function derivePaymentStatus(stop: SupabaseStop): PaymentStatus {
  if (!BOOKABLE.has(stop.type)) return "tbd";
  const notes = (stop.notes ?? "").toLowerCase();
  if (stop.booking_reference) {
    if (notes.includes("paid in full") || notes.includes("nothing outstanding") || notes.includes("✅ paid")) return "paid";
    if (notes.includes("outstanding") || notes.includes("to pay") || notes.includes("due by")) return "outstanding";
    return "confirmed";
  }
  if (stop.cost != null) return "on-arrival";
  return "tbd";
}

const STOP_LABEL: Record<StopType, string> = {
  campsite: "Campsite",
  city: "City",
  attraction: "Attraction",
  rest: "Rest stop",
  event: "Event",
  transport: "Transport",
};

const STOP_PIN_COLOUR: Record<StopType, string> = {
  campsite: "16a34a",
  event:    "dc2626",
  city:     "2563eb",
  transport:"475569",
  rest:     "d97706",
  attraction:"7c3aed",
};

// ---- Static documents data -------------------------------------------------

const VIGNETTES = [
  {
    name: "Crit'Air Vignette",
    country: "France",
    status: "ordered" as const,
    cost: "€5.11",
    paid: "€5.11",
    due: "—",
    notes: "Order ref 26179731153402 · Sticker posted — invoice email is valid proof if stopped. Calais/Éperlecques area has no active ZFE enforcement.",
  },
  {
    name: "Umweltplakette",
    country: "Germany",
    status: "pickup" as const,
    cost: "~€6",
    paid: "—",
    due: "~€6",
    notes: "Pick up at TÜV, DEKRA or local garage in Wildberg on 21 Jul. Green sticker (no. 4) goes on windscreen. Covers Nuremberg & Koblenz.",
  },
  {
    name: "Motorway Vignette",
    country: "Austria",
    status: "pickup" as const,
    cost: "~€10",
    paid: "—",
    due: "~€10",
    notes: "Buy at border petrol station on 22 Jul. 10-day sticker goes on windscreen.",
  },
  {
    name: "e-Vignette (e-matrica)",
    country: "Hungary",
    status: "paid" as const,
    cost: "€37.19",
    paid: "€37.19",
    due: "—",
    notes: "Order #2871283 · No. 222606282049151079910 · Valid 24 Jul – 2 Aug · D2 10-day · Plate: GB-DE75SXR · Fully electronic.",
  },
];

// ---- Main component -------------------------------------------------------

export function DayByDayView({
  trip,
  sortedStops,
  route,
  totalNights,
  countriesCount,
  totalStopCost,
  bookingHealth,
}: DayByDayProps) {
  const dayEntries = useMemo((): DayEntry[] => {
    const entries: DayEntry[] = [];
    let dayNum = 1;
    let pendingWaypoints: SupabaseStop[] = [];
    let prevOvernightStop: SupabaseStop | null = null;
    let prevOvernightIndex = -1;

    sortedStops.forEach((stop, index) => {
      const isFirst = index === 0;
      const isLast = index === sortedStops.length - 1;
      const isWaypoint = stop.nights === 0 && !isFirst && !isLast;

      if (isWaypoint) {
        pendingWaypoints.push(stop);
        return;
      }

      if (isFirst && stop.nights === 0) {
        prevOvernightStop = stop;
        prevOvernightIndex = 0;
        pendingWaypoints = [];
        return;
      }

      let driveDuration = 0;
      let driveDistance = 0;
      if (prevOvernightIndex >= 0) {
        for (let i = prevOvernightIndex; i < index; i++) {
          const seg = route?.segments[i];
          if (seg) {
            driveDuration += seg.duration;
            driveDistance += seg.distance;
          }
        }
      }

      entries.push({
        type: "drive",
        dayNumber: dayNum++,
        date: stop.arrival_date,
        stop,
        prevStop: prevOvernightStop,
        waypoints: [...pendingWaypoints],
        driveDuration,
        driveDistance,
      });

      for (let n = 1; n < stop.nights; n++) {
        const restDate = stop.arrival_date
          ? new Date(new Date(stop.arrival_date).getTime() + n * 86400000)
              .toISOString()
              .split("T")[0]
          : null;
        entries.push({
          type: "rest",
          dayNumber: dayNum++,
          date: restDate,
          stop,
          prevStop: null,
          waypoints: [],
          driveDuration: 0,
          driveDistance: 0,
        });
      }

      prevOvernightStop = stop;
      prevOvernightIndex = index;
      pendingWaypoints = [];
    });

    return entries;
  }, [sortedStops, route]);

  const eventEntryIndex = dayEntries.findIndex((e) => e.stop.type === "event");

  // Payment summary — split by confirmed bookings (pre-arranged) vs pay-on-site
  const bookableStops = useMemo(
    () => sortedStops.filter((s) => BOOKABLE.has(s.type) && s.cost != null),
    [sortedStops],
  );

  const confirmedStops = useMemo(
    () => bookableStops.filter((s) => s.booking_reference),
    [bookableStops],
  );

  const payOnSiteStops = useMemo(
    () => bookableStops.filter((s) => !s.booking_reference),
    [bookableStops],
  );

  const confirmedTotal = useMemo(
    () => confirmedStops.reduce((sum, s) => sum + (s.cost ?? 0), 0),
    [confirmedStops],
  );

  const payOnSiteTotal = useMemo(
    () => payOnSiteStops.reduce((sum, s) => sum + (s.cost ?? 0), 0),
    [payOnSiteStops],
  );

  const stats = [
    { label: "Nights", value: String(totalNights) },
    { label: "Countries", value: String(countriesCount) },
    { label: "Booked", value: `${bookingHealth.confirmed}/${bookingHealth.total}` },
    ...(totalStopCost ? [{ label: "Camp total", value: `€${Math.round(totalStopCost).toLocaleString("en-GB")}` }] : []),
    ...(route ? [{ label: "Distance", value: formatDistance(route.totalDistance) }] : []),
    ...(route ? [{ label: "Drive time", value: formatDuration(route.totalDuration) }] : []),
  ];

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 print:bg-white">
      <div className="mx-auto max-w-3xl px-6 py-8 print:px-4 print:py-4">

        {/* ── Trip header ─────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-400 print:text-slate-500">
            Route itinerary
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 print:text-2xl">
            {trip.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {fmtDate(trip.start_date)}
            {trip.end_date && ` — ${fmtDate(trip.end_date)}`}
            {trip.vehicles && <span className="font-medium text-slate-700"> · {trip.vehicles.name}</span>}
          </p>

          {/* Stats strip */}
          <div className="mt-4 flex flex-wrap gap-3 print:gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 print:border-slate-300">
                <div className="font-mono text-lg font-bold text-slate-900 print:text-base">{s.value}</div>
                <div className="text-[10px] uppercase tracking-wide text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Payment balance ─────────────────────────────────────────── */}
        {totalStopCost != null && (
          <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white print:mb-6 print:break-inside-avoid">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Accommodation · Payment balance
              </p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="px-4 py-4">
                <p className="font-mono text-2xl font-bold text-slate-900 print:text-xl">
                  €{Math.round(confirmedTotal).toLocaleString("en-GB")}
                </p>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Booked &amp; arranged
                </p>
                {confirmedStops.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {confirmedStops.map((s) => (
                      <span key={s.id} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                        {s.name}
                        <span className="font-mono font-bold text-slate-800">{fmtCost(s.cost!, s.currency)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-4 py-4">
                <p className="font-mono text-2xl font-bold text-amber-600 print:text-xl">
                  €{Math.round(payOnSiteTotal).toLocaleString("en-GB")}
                </p>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Pay on site / arrival
                </p>
                {payOnSiteStops.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {payOnSiteStops.map((s) => (
                      <span key={s.id} className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                        {s.name}
                        <span className="font-mono font-bold">{fmtCost(s.cost!, s.currency)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Timeline ────────────────────────────────────────────────── */}
        <div>
          {dayEntries.map((entry, i) => {
            const isLast = i === dayEntries.length - 1;
            return (
              <div key={`${entry.stop.id}-${entry.dayNumber}`}>
                {i === 0 && eventEntryIndex >= 0 && (
                  <LegDivider label="Outbound" />
                )}
                {i === eventEntryIndex + 1 && eventEntryIndex >= 0 && (
                  <LegDivider label="Return" />
                )}
                {entry.type === "rest" ? (
                  <RestRow entry={entry} isLast={isLast} />
                ) : (
                  <DriveRow entry={entry} isLast={isLast} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Van documents ────────────────────────────────────────────── */}
        <div className="mt-10 print:mt-8 print:break-before-page">
          <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-widest text-slate-400">
            Documents
          </p>
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Van Documents &amp; Vignettes
          </h2>

          {/* Mobile-friendly stacked cards */}
          <div className="space-y-3 sm:hidden">
            {VIGNETTES.map((v) => (
              <div
                key={v.name}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900">{v.name}</p>
                    <p className="text-xs text-slate-500">{v.country}</p>
                  </div>
                  <VignetteStatusBadge status={v.status} />
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
                  <div className="px-3 py-2">
                    <p className="font-mono text-sm font-bold text-green-600">{v.paid}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Paid</p>
                  </div>
                  <div className="px-3 py-2">
                    <p className={`font-mono text-sm font-bold ${v.due === "—" ? "text-slate-300" : "text-amber-600"}`}>{v.due}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Due</p>
                  </div>
                </div>
                <div className="px-4 py-3 text-xs leading-relaxed text-slate-500">{v.notes}</div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white sm:block print:block print:rounded-none">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 print:bg-slate-100">
                <tr>
                  {["Item", "Country", "Status", "Paid", "Due", "Notes"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {VIGNETTES.map((v) => (
                  <tr key={v.name} className="align-top">
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-900">
                      {v.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                      {v.country}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <VignetteStatusBadge status={v.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono font-bold text-green-600">
                      {v.paid}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-3 font-mono font-bold ${v.due === "—" ? "text-slate-300" : "text-amber-600"}`}>
                      {v.due}
                    </td>
                    <td className="px-3 py-3 text-xs leading-relaxed text-slate-500">
                      {v.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print footer */}
        <p className="mt-8 hidden text-center font-mono text-[10px] uppercase tracking-widest text-slate-300 print:block">
          {trip.title} · Route Planner
        </p>
      </div>
    </div>
  );
}

// ---- Sub-components -------------------------------------------------------

function LegDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-4 print:py-3">
      <Separator className="flex-1" />
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}

function DriveRow({ entry, isLast }: { entry: DayEntry; isLast: boolean }) {
  const { stop, prevStop, waypoints, driveDuration, driveDistance, dayNumber, date } = entry;
  const hasDrive = prevStop !== null && driveDuration > 0;
  const isEvent = stop.type === "event";
  const paymentStatus = derivePaymentStatus(stop);

  const driveHours = driveDuration / 3600;
  const driveMetricClass =
    driveHours === 0 ? "text-slate-400" :
    driveHours < 4 ? "text-green-600" :
    driveHours < 5 ? "text-amber-600" : "text-red-600";

  return (
    <div className="flex gap-0 print:break-inside-avoid">
      {/* Timeline spine */}
      <div className="flex w-14 shrink-0 flex-col items-center print:w-12">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold text-white shadow-sm print:shadow-none ${
            isEvent ? "bg-red-600" : "bg-slate-900"
          }`}
        >
          {String(dayNumber).padStart(2, "0")}
        </div>
        {!isLast && (
          <div className="min-h-8 w-px flex-1 bg-slate-200 print:bg-slate-300" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pb-5 pr-0">
        {/* Day label + drive metric */}
        <div className="mb-2 flex items-baseline justify-between gap-2 pt-1.5">
          <span className="text-sm font-semibold text-slate-700">
            {fmtDayFull(date)}
            {isEvent && (
              <span className="ml-2 font-mono text-[10px] font-bold uppercase tracking-wide text-red-500">
                Race weekend
              </span>
            )}
          </span>
          {hasDrive && (
            <span className={`shrink-0 font-mono text-sm font-bold ${driveMetricClass}`}>
              {formatDuration(driveDuration)} · {formatDistance(driveDistance)}
            </span>
          )}
        </div>

        {/* Drive from row */}
        {hasDrive && (
          <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-mono text-slate-400">→</span>
            <span>from</span>
            <span className="font-medium text-slate-700">{prevStop?.name}</span>
            {prevStop?.country && (
              <span className="text-slate-400">· {prevStop.country}</span>
            )}
            {waypoints.length > 0 && (
              <span className="text-slate-400">via {waypoints.map((w) => w.name).join(", ")}</span>
            )}
          </div>
        )}

        {/* Stop card */}
        <div
          className={`overflow-hidden rounded-xl border bg-white shadow-sm print:shadow-none ${
            isEvent ? "border-red-200" : "border-slate-200"
          }`}
        >
          {/* Static map thumbnail */}
          <StopMapThumb stop={stop} />

          {/* Card header */}
          <div className={`px-4 py-3 ${isEvent ? "bg-red-50" : "bg-white"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">{stop.name}</span>
                  <Badge variant="secondary" className="text-[10px] font-medium">
                    {STOP_LABEL[stop.type]}
                  </Badge>
                </div>
                {stop.full_name && stop.full_name !== stop.name && (
                  <p className="mt-0.5 text-xs text-slate-500">{stop.full_name}</p>
                )}
                {stop.country && (
                  <p className="mt-0.5 font-mono text-[11px] text-slate-400">{stop.country}</p>
                )}
              </div>
              {stop.booking_reference && (
                <code className="shrink-0 rounded-md border border-green-200 bg-green-50 px-2 py-1 font-mono text-[11px] font-bold text-green-700">
                  {stop.booking_reference}
                </code>
              )}
            </div>
          </div>

          {/* Details row */}
          {(stop.nights > 0 || stop.arrival_date || stop.cost != null) && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 bg-slate-50 px-4 py-3 print:bg-white">
              {stop.nights > 0 && (
                <Metric label="Nights" value={String(stop.nights)} />
              )}
              {stop.arrival_date && (
                <Metric label="Arrive" value={fmtShort(stop.arrival_date)} />
              )}
              {stop.departure_date && (
                <Metric label="Depart" value={fmtShort(stop.departure_date)} />
              )}
              {stop.cost != null && (
                <Metric label="Total cost" value={fmtCost(stop.cost, stop.currency)} />
              )}
              {BOOKABLE.has(stop.type) && (
                <PaymentBadge status={paymentStatus} />
              )}
            </div>
          )}

          {/* Notes */}
          {stop.notes && (
            <div className="border-t border-slate-100 px-4 py-3 text-xs leading-relaxed text-slate-600 print:border-slate-200">
              {stop.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RestRow({ entry, isLast }: { entry: DayEntry; isLast: boolean }) {
  return (
    <div className="flex gap-0 print:break-inside-avoid">
      {/* Timeline spine */}
      <div className="flex w-14 shrink-0 flex-col items-center print:w-12">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-50 font-mono text-[10px] font-bold text-slate-400">
          {String(entry.dayNumber).padStart(2, "0")}
        </div>
        {!isLast && (
          <div className="min-h-6 w-px flex-1 bg-slate-200 print:bg-slate-300" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pb-4 pt-0.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-slate-500">{fmtDayFull(entry.date)}</span>
          <span className="text-slate-300">·</span>
          <span className="italic text-slate-400">Rest day — {entry.stop.name}</span>
          <span className="ml-auto text-base leading-none">🌿</span>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-mono text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const config: Record<PaymentStatus, { label: string; className: string }> = {
    paid: { label: "✅ Paid in full", className: "bg-green-50 text-green-700 border-green-200" },
    confirmed: { label: "⚠️ Pay on departure/arrival", className: "bg-amber-50 text-amber-700 border-amber-200" },
    "on-arrival": { label: "⚠️ Pay on arrival", className: "bg-amber-50 text-amber-700 border-amber-200" },
    outstanding: { label: "🔴 Payment outstanding", className: "bg-red-50 text-red-700 border-red-200" },
    tbd: { label: "TBD", className: "bg-slate-50 text-slate-500 border-slate-200" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${c.className}`}>
      {c.label}
    </span>
  );
}

function VignetteStatusBadge({ status }: { status: "paid" | "ordered" | "pickup" }) {
  const config = {
    paid: { label: "✅ Paid", className: "bg-green-50 text-green-700 border-green-200" },
    ordered: { label: "📬 Ordered", className: "bg-blue-50 text-blue-700 border-blue-200" },
    pickup: { label: "⏳ En route", className: "bg-amber-50 text-amber-700 border-amber-200" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${c.className}`}>
      {c.label}
    </span>
  );
}

function StopMapThumb({ stop }: { stop: SupabaseStop }) {
  if (!MAPBOX_TOKEN) return null;
  const pin = STOP_PIN_COLOUR[stop.type] ?? "475569";
  const zoom = stop.type === "event" ? 13 : stop.type === "city" ? 12 : 11;
  const src = [
    `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static`,
    `/pin-s+${pin}(${stop.lng},${stop.lat})`,
    `/${stop.lng},${stop.lat},${zoom}`,
    `/640x200@2x`,
    `?access_token=${MAPBOX_TOKEN}`,
  ].join("");

  return (
    <div className="overflow-hidden border-b border-slate-100 print:hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`Map showing ${stop.name}`}
        width={640}
        height={200}
        loading="lazy"
        className="block h-[130px] w-full object-cover"
      />
    </div>
  );
}
