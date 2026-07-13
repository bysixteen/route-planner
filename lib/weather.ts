/**
 * Arrival-day weather for a stop, via Open-Meteo (keyless, no npm dependency).
 * Uses the daily forecast when the date is within range (~16 days), otherwise
 * falls back to a climate normal from the recent-year archive. Fails silent.
 */
import { todayKey } from "@/lib/trip-detail";

export interface StopWeather {
  highC: number;
  lowC: number;
  /** WMO weather code — mapped to an icon in the UI. */
  code: number;
  /** Max chance of rain (%), forecast only. */
  rainChance: number | null;
  /** ISO datetime, forecast only. */
  sunrise: string | null;
  sunset: string | null;
  /** True when this is a climate normal rather than a real forecast. */
  typical: boolean;
}

function daysAhead(dateKey: string): number {
  const from = new Date(`${todayKey()}T00:00:00Z`).getTime();
  const to = new Date(`${dateKey}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}

export async function getStopWeather(
  lat: number,
  lng: number,
  arrivalDate: string | null,
): Promise<StopWeather | null> {
  if (!arrivalDate) return null;
  const date = arrivalDate.slice(0, 10);
  const ahead = daysAhead(date);

  try {
    if (ahead >= 0 && ahead <= 15) {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,sunrise,sunset` +
        `&timezone=auto&start_date=${date}&end_date=${date}`;
      const res = await fetch(url);
      if (res.ok) {
        const d = (await res.json()).daily;
        if (d?.temperature_2m_max?.[0] != null) {
          return {
            highC: Math.round(d.temperature_2m_max[0]),
            lowC: Math.round(d.temperature_2m_min[0]),
            code: d.weather_code?.[0] ?? 0,
            rainChance: d.precipitation_probability_max?.[0] ?? null,
            sunrise: d.sunrise?.[0] ?? null,
            sunset: d.sunset?.[0] ?? null,
            typical: false,
          };
        }
      }
    }
    return await getTypical(lat, lng, date);
  } catch {
    return null;
  }
}

/** Climate normal: average the same week in the last full year. */
async function getTypical(
  lat: number,
  lng: number,
  date: string,
): Promise<StopWeather | null> {
  const [, mm, dd] = date.split("-").map(Number);
  const year = new Date().getUTCFullYear() - 1;
  const centre = Date.UTC(year, mm - 1, dd);
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
  const start = iso(centre - 3 * 86_400_000);
  const end = iso(centre + 3 * 86_400_000);
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
    `&start_date=${start}&end_date=${end}` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const d = (await res.json()).daily;
  if (!d?.temperature_2m_max?.length) return null;
  const avg = (xs: number[]) => {
    const vals = xs.filter((v) => v != null);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };
  const mode = (xs: number[]) => {
    const counts = new Map<number, number>();
    for (const v of xs) if (v != null) counts.set(v, (counts.get(v) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
  };
  return {
    highC: Math.round(avg(d.temperature_2m_max)),
    lowC: Math.round(avg(d.temperature_2m_min)),
    code: mode(d.weather_code),
    rainChance: null,
    sunrise: null,
    sunset: null,
    typical: true,
  };
}
