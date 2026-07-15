"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Sun,
  Sunrise,
  Sunset,
} from "lucide-react";

import { getStopWeather, type StopWeather as Weather } from "@/lib/weather";

/** WMO weather code → a compact icon. */
function iconFor(code: number) {
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code <= 48) return CloudFog;
  if (code <= 57) return CloudDrizzle;
  if (code <= 67) return CloudRain;
  if (code <= 77) return CloudSnow;
  if (code <= 82) return CloudRain;
  if (code <= 86) return CloudSnow;
  return CloudLightning;
}

const hhmm = (iso: string | null) => (iso ? iso.slice(11, 16) : null);

/**
 * Arrival-day weather — a single compact strip. Renders nothing if the
 * forecast can't be resolved, so the panel is never left with an empty slot.
 */
export function StopWeather({
  lat,
  lng,
  date,
}: {
  lat: number;
  lng: number;
  date: string | null;
}) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setWeather(null);
    getStopWeather(lat, lng, date).then((res) => {
      if (!active) return;
      setWeather(res);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [lat, lng, date]);

  if (loading) {
    return (
      <div>
        <p className="label mb-1.5 text-muted-foreground">
          Weather at arrival
        </p>
        <div className="h-14 animate-pulse rounded-lg bg-white/[0.04]" />
      </div>
    );
  }
  if (!weather) return null;

  const Icon = iconFor(weather.code);
  const sunrise = hhmm(weather.sunrise);
  const sunset = hhmm(weather.sunset);

  return (
    <div>
      <p className="label mb-1.5 text-muted-foreground">
        Weather at arrival
      </p>
      <div className="flex items-center gap-3 rounded-lg bg-white/[0.04] p-3">
        <Icon className="size-6 shrink-0 text-foreground/90" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm tabular-nums">
            <span className="font-semibold">{weather.highC}°</span>
            <span className="text-muted-foreground"> / {weather.lowC}°</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] tabular-nums text-muted-foreground">
            {weather.rainChance != null && (
              <span className="inline-flex items-center gap-1">
                <Droplets className="size-3" />
                {weather.rainChance}%
              </span>
            )}
            {sunrise && (
              <span className="inline-flex items-center gap-1">
                <Sunrise className="size-3" />
                {sunrise}
              </span>
            )}
            {sunset && (
              <span className="inline-flex items-center gap-1">
                <Sunset className="size-3" />
                {sunset}
              </span>
            )}
          </div>
        </div>
      </div>
      {weather.typical && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Typical late July · updates nearer the time
        </p>
      )}
    </div>
  );
}
