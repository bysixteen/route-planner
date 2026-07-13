"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";

import { CopyButton } from "@/components/trip/copy-button";
import { StopWeather } from "@/components/trip/stop-weather";
import { Badge } from "@/components/ui/badge";
import { getBookingExtraForStop } from "@/lib/booking-details";
import {
  formatDistance,
  formatDuration,
} from "@/lib/mapbox/directions";
import { reverseGeocode } from "@/lib/mapbox/reverse-geocode";
import { formatCoordinate, formatCoordinatePlain } from "@/lib/coordinates";
import {
  countryFlag,
  formatCost,
  getBookingStatus,
  type DriveLeg,
} from "@/lib/trip-detail";

interface StopDetailPanelProps {
  leg: DriveLeg;
  onClose: () => void;
}

/**
 * Detect campervan pitch/facility cues from the free-text notes + amenities.
 * Answers the practical questions: grass or hardstanding? level (chocks)?
 * hookup? dog-friendly? — only surfaced where the source text actually says so.
 */
function detectFacilities(notes: string | null, amenities?: string[] | null): string[] {
  const text = `${notes ?? ""} ${(amenities ?? []).join(" ")}`.toLowerCase();
  const chips: string[] = [];
  if (/hardstand|hard-stand|gravel|tarmac|concrete|paved/.test(text))
    chips.push("Hardstanding");
  else if (/grass|meadow|field/.test(text)) chips.push("Grass pitch");
  if (/\blevel\b|flat pitch/.test(text)) chips.push("Level");
  if (/slop|uneven|terrac|hill/.test(text)) chips.push("Sloped — bring chocks");
  if (/electric|hook-?up|ehu|hookup|\bpower\b|\bamp\b/.test(text))
    chips.push("Electric hookup");
  if (/\bwater\b|tap|drinking/.test(text)) chips.push("Water");
  if (/shower/.test(text)) chips.push("Showers");
  if (/toilet|wc/.test(text)) chips.push("Toilets");
  if (/chemical|waste|disposal|dump|cassette|grey/.test(text))
    chips.push("Waste disposal");
  if (/\bdog|pet/.test(text)) chips.push("Dog-friendly");
  if (/wi-?fi/.test(text)) chips.push("WiFi");
  return chips;
}

/** Slide-in stop detail — right rail on desktop, bottom sheet on mobile. */
export function StopDetailPanel({ leg, onClose }: StopDetailPanelProps) {
  const { stop, prevStop, minutes, distance } = leg;
  const booking = getBookingStatus(stop);
  const facilities = detectFacilities(stop.notes, stop.amenities);
  const extra = getBookingExtraForStop(stop);
  const hasDrive = minutes > 0;

  // Address: prefer the confirmed static one, else reverse-geocode the coords.
  const [geoAddress, setGeoAddress] = useState<string | null>(null);
  useEffect(() => {
    if (extra?.address) return;
    let active = true;
    setGeoAddress(null);
    reverseGeocode(stop.lat, stop.lng).then((a) => {
      if (active) setGeoAddress(a);
    });
    return () => {
      active = false;
    };
  }, [stop.lat, stop.lng, extra?.address]);
  const address = extra?.address ?? geoAddress;

  return (
    <aside
      className="glass scroll-fade pointer-events-auto absolute z-30 flex flex-col overflow-y-auto rounded-2xl border border-white/10 print:hidden
        inset-x-3 top-auto bottom-[calc(4.75rem+env(safe-area-inset-bottom))] max-h-[70vh]
        md:inset-y-4 md:left-auto md:right-4 md:bottom-4 md:top-4 md:max-h-none md:w-[380px]"
    >
      {/* Header */}
      <div className="sticky top-0 flex items-start justify-between gap-2 px-5 pb-3 pt-4">
        <div className="min-w-0">
          <h2 className="font-display truncate text-lg font-semibold">
            {countryFlag(stop.country)} {stop.name}
          </h2>
          {stop.full_name && stop.full_name !== stop.name && (
            <p className="truncate text-xs text-muted-foreground">
              {stop.full_name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {booking === "confirmed" && <Badge variant="booked">Booked</Badge>}
          {booking === "pending" && <Badge variant="unbooked">Not booked</Badge>}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 pb-5">
        {/* Drive from → to */}
        {prevStop && hasDrive && (
          <div className="flex items-stretch gap-2.5 rounded-lg bg-white/[0.04] p-3 text-xs">
            <div className="flex flex-col items-center pt-1">
              <span className="size-1.5 rounded-full bg-muted-foreground" />
              <span className="my-0.5 w-px flex-1 border-l border-dashed border-white/15" />
              <span className="size-1.5 rounded-full bg-volt-bright" />
            </div>
            <div className="flex flex-1 flex-col justify-between gap-2">
              <span className="text-muted-foreground">{prevStop.name}</span>
              <span className="font-medium">{stop.name}</span>
            </div>
            <div className="font-display self-center text-right leading-tight tabular-nums text-muted-foreground">
              {formatDuration(minutes * 60)}
              <br />
              {formatDistance(distance)}
            </div>
          </div>
        )}

        {/* Address & satnav — address primary, coordinates as fallback */}
        <div>
          <p className="coordinate mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
            Address &amp; satnav
          </p>
          {address ? (
            <>
              <p className="mb-2 text-sm leading-snug">{address}</p>
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton
                  value={address}
                  label="Copy address for satnav"
                  title="Copy address for satnav"
                />
                <span className="coordinate text-[11px] text-muted-foreground">
                  {formatCoordinate(stop.lat, stop.lng)}
                </span>
                <CopyButton
                  value={formatCoordinatePlain(stop.lat, stop.lng)}
                  label="Copy coordinates"
                  title="Copy coordinates for satnav"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="coordinate text-xs text-muted-foreground">
                {formatCoordinate(stop.lat, stop.lng)}
              </span>
              <CopyButton
                value={formatCoordinatePlain(stop.lat, stop.lng)}
                label="Copy for satnav"
                title="Copy coordinates for satnav"
              />
            </div>
          )}
        </div>

        {/* Booking / refs / cost / links */}
        {(stop.booking_reference ||
          stop.cost != null ||
          stop.booking_url ||
          (extra?.refs?.length ?? 0) > 0 ||
          extra?.siteInfoUrl) && (
          <div>
            <p className="coordinate mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
              Booking
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {stop.booking_reference && (
                <CopyButton
                  value={stop.booking_reference}
                  title="Copy booking reference"
                  className="border-health-good/30 bg-health-good/10 px-2 py-1 font-mono text-[11px] text-health-good"
                />
              )}
              {extra?.refs?.map((r) => (
                <CopyButton
                  key={r.value}
                  value={r.value}
                  label={`${r.label} · ${r.value}`}
                  title={`Copy ${r.label} reference`}
                  className="px-2 py-1 font-mono text-[11px]"
                />
              ))}
              {extra?.siteInfoUrl && (
                <a
                  href={extra.siteInfoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex items-center gap-1 rounded text-[11px] font-medium text-volt-bright hover:underline"
                >
                  {extra.siteInfoLabel ?? "Info"} <ExternalLink className="size-3" />
                </a>
              )}
              {stop.cost != null && (
                <span className="font-display text-sm tabular-nums">
                  {formatCost(stop.cost, stop.currency)}
                </span>
              )}
              {stop.booking_url && (
                <a
                  href={stop.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex items-center gap-1 rounded text-[11px] font-medium text-volt-bright hover:underline"
                >
                  Website <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Weather at arrival */}
        <StopWeather lat={stop.lat} lng={stop.lng} date={stop.arrival_date} />

        {/* Check-in (from the confirmation email) */}
        {extra && (extra.checkIn || extra.checkOut || extra.arrivalNote) && (
          <div>
            <p className="coordinate mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
              Check-in
            </p>
            {(extra.checkIn || extra.checkOut) && (
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs tabular-nums">
                {extra.checkIn && (
                  <span>
                    <span className="text-muted-foreground">In</span>{" "}
                    {extra.checkIn}
                  </span>
                )}
                {extra.checkOut && (
                  <span>
                    <span className="text-muted-foreground">Out</span>{" "}
                    {extra.checkOut}
                  </span>
                )}
              </div>
            )}
            {extra.arrivalNote && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                {extra.arrivalNote}
              </p>
            )}
          </div>
        )}

        {/* Reminders / action items */}
        {extra?.reminders && extra.reminders.length > 0 && (
          <div>
            <p className="coordinate mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
              Reminders
            </p>
            <ul className="space-y-1.5">
              {extra.reminders.map((r, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground"
                >
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-health-warn" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Awning */}
        {extra?.awning && (
          <div>
            <p className="coordinate mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
              Awning
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`size-1.5 rounded-full ${
                  extra.awning === "yes"
                    ? "bg-health-good"
                    : extra.awning === "no"
                      ? "bg-health-bad"
                      : "bg-health-warn"
                }`}
              />
              <span className="text-xs font-medium">
                {extra.awning === "yes"
                  ? "Allowed"
                  : extra.awning === "no"
                    ? "Not allowed"
                    : "Check first"}
              </span>
            </div>
            {extra.awningNote && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                {extra.awningNote}
              </p>
            )}
          </div>
        )}

        {/* Pitch & facilities */}
        <div>
          <p className="coordinate mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
            Pitch &amp; facilities
          </p>
          {facilities.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {facilities.map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-foreground"
                >
                  {f}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground/70">
              No pitch details noted yet — check on arrival (surface, levelling,
              hookup).
            </p>
          )}
        </div>

        {/* Notes */}
        {stop.notes && (
          <div>
            <p className="coordinate mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
              Notes
            </p>
            <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
              {stop.notes}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
