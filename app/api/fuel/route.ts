import { NextResponse } from "next/server";
import {
  boxesOverlap,
  COUNTRY_BOXES,
  LU_DIESEL_PRICE,
  metresBetween,
  pointInBox,
  type FuelStation,
} from "@/lib/fuel";

// Proxy + normalise national diesel-price feeds for a viewport bbox.
// Query: /api/fuel?s=<south>&w=<west>&n=<north>&e=<east>
// - France & Austria: free, no key. Germany: needs TANKERKOENIG_KEY (else
//   locations only from OSM). Luxembourg: single national fixed price.
// - Everything else (Belgium, Hungary…) falls back to OSM station locations.

export const revalidate = 300; // 5 min, matches the upstream feeds' cadence.

const clampNum = (v: string | null) => {
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) ? n : null;
};

// -- France: OpenDataSoft "prix des carburants – flux instantané v2" ----------
async function fetchFrance(
  s: number,
  w: number,
  n: number,
  e: number,
): Promise<FuelStation[]> {
  const where = encodeURIComponent(`in_bbox(geom,${s},${w},${n},${e})`);
  const url = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?limit=100&select=id,adresse,ville,geom,gazole_prix&where=${where}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const data = await res.json();
  const out: FuelStation[] = [];
  for (const r of data.results ?? []) {
    const g = r.geom;
    if (!g || typeof g.lat !== "number" || typeof g.lon !== "number") continue;
    out.push({
      id: `fr-${r.id}`,
      name: [r.adresse, r.ville].filter(Boolean).join(", ") || "Station",
      lat: g.lat,
      lng: g.lon,
      dieselPrice: typeof r.gazole_prix === "number" ? r.gazole_prix : null,
      source: "FR",
    });
  }
  return out;
}

// -- Austria: E-Control Spritpreisrechner (returns ~cheapest few near a point) -
async function fetchAustria(
  s: number,
  w: number,
  n: number,
  e: number,
): Promise<FuelStation[]> {
  const lat = (s + n) / 2;
  const lng = (w + e) / 2;
  const url = `https://api.e-control.at/sprit/1.0/search/gas-stations/by-address?latitude=${lat}&longitude=${lng}&fuelType=DIE`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const data = await res.json();
  const out: FuelStation[] = [];
  for (const r of Array.isArray(data) ? data : []) {
    const loc = r.location;
    if (!loc || typeof loc.latitude !== "number") continue;
    if (loc.latitude < s || loc.latitude > n || loc.longitude < w || loc.longitude > e)
      continue;
    const die = (r.prices ?? []).find(
      (p: { fuelType?: string }) => p.fuelType === "DIE",
    );
    out.push({
      id: `at-${r.id}`,
      name: r.name || "Station",
      lat: loc.latitude,
      lng: loc.longitude,
      dieselPrice: die && typeof die.amount === "number" ? die.amount : null,
      source: "AT",
    });
  }
  return out;
}

// -- Germany: Tankerkönig (needs a free API key in TANKERKOENIG_KEY) ----------
async function fetchGermany(
  s: number,
  w: number,
  n: number,
  e: number,
): Promise<FuelStation[]> {
  const key = process.env.TANKERKOENIG_KEY;
  if (!key) return [];
  const lat = (s + n) / 2;
  const lng = (w + e) / 2;
  // Tankerkönig only does radius search, capped at 25 km.
  const radKm = Math.min(25, metresBetween(s, w, n, e) / 2000);
  const url = `https://creativecommons.tankerkoenig.de/json/list.php?lat=${lat}&lng=${lng}&rad=${radKm.toFixed(1)}&type=diesel&sort=dist&apikey=${key}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.ok) return [];
  const out: FuelStation[] = [];
  for (const r of data.stations ?? []) {
    if (typeof r.lat !== "number" || typeof r.lng !== "number") continue;
    if (r.lat < s || r.lat > n || r.lng < w || r.lng > e) continue;
    out.push({
      id: `de-${r.id}`,
      name: r.name || "Station",
      brand: r.brand || undefined,
      lat: r.lat,
      lng: r.lng,
      dieselPrice: typeof r.price === "number" ? r.price : null,
      source: "DE",
    });
  }
  return out;
}

// -- Everywhere: OSM station locations (no price) via Overpass ----------------
async function fetchOsm(
  s: number,
  w: number,
  n: number,
  e: number,
): Promise<FuelStation[]> {
  const q = `[out:json][timeout:12];node["amenity"="fuel"](${s},${w},${n},${e});out body 120;`;
  // Overpass is a busy shared service that 504s under load; try mirrors in turn.
  // It also 406s server-side fetches lacking a User-Agent (and, oddly, 406s an
  // explicit Accept: application/json) — a bare UA header is what it wants.
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
  ];
  type OverpassNode = {
    id: number;
    lat?: number;
    lon?: number;
    tags?: { name?: string; brand?: string };
  };
  let data: { elements?: OverpassNode[] } | null = null;
  for (const base of endpoints) {
    try {
      const res = await fetch(base + "?data=" + encodeURIComponent(q), {
        headers: { "User-Agent": "route-planner/1.0 (personal road-trip app)" },
        next: { revalidate: 300 },
      });
      if (!res.ok) continue;
      data = await res.json();
      break;
    } catch {
      /* try next mirror */
    }
  }
  if (!data) return [];
  const out: FuelStation[] = [];
  for (const el of data.elements ?? []) {
    if (typeof el.lat !== "number" || typeof el.lon !== "number") continue;
    const inLu = pointInBox(el.lat, el.lon, COUNTRY_BOXES.LU);
    out.push({
      id: `osm-${el.id}`,
      name: el.tags?.name || el.tags?.brand || "Petrol station",
      brand: el.tags?.brand || undefined,
      lat: el.lat,
      lng: el.lon,
      // Luxembourg has no per-station feed — attach the national fixed price.
      dieselPrice: inLu ? LU_DIESEL_PRICE : null,
      source: inLu ? "LU" : "OSM",
    });
  }
  return out;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const s = clampNum(url.searchParams.get("s"));
  const w = clampNum(url.searchParams.get("w"));
  const n = clampNum(url.searchParams.get("n"));
  const e = clampNum(url.searchParams.get("e"));
  if (s == null || w == null || n == null || e == null) {
    return NextResponse.json({ error: "bad bbox" }, { status: 400 });
  }

  const bbox: [number, number, number, number] = [s, w, n, e];
  const jobs: Promise<FuelStation[]>[] = [fetchOsm(s, w, n, e)];
  const attribution: string[] = ["OpenStreetMap"];

  if (boxesOverlap(bbox, COUNTRY_BOXES.FR)) {
    jobs.push(fetchFrance(s, w, n, e));
    attribution.push("data.economie.gouv.fr");
  }
  if (boxesOverlap(bbox, COUNTRY_BOXES.AT)) {
    jobs.push(fetchAustria(s, w, n, e));
    attribution.push("E-Control");
  }
  if (boxesOverlap(bbox, COUNTRY_BOXES.DE) && process.env.TANKERKOENIG_KEY) {
    jobs.push(fetchGermany(s, w, n, e));
    attribution.push("Tankerkönig");
  }
  if (boxesOverlap(bbox, COUNTRY_BOXES.LU)) {
    attribution.push("STATEC (Luxembourg)");
  }

  const settled = await Promise.allSettled(jobs);
  const results = settled.flatMap((r) =>
    r.status === "fulfilled" ? r.value : [],
  );

  // Priced national stations win; drop OSM points within 130 m of one.
  const priced = results.filter((r) => r.source !== "OSM" && r.dieselPrice != null);
  const others = results.filter((r) => r.source === "OSM" || r.dieselPrice == null);
  const merged: FuelStation[] = [...priced];
  for (const o of others) {
    const dup = priced.some(
      (p) => metresBetween(p.lat, p.lng, o.lat, o.lng) < 130,
    );
    if (!dup) merged.push(o);
  }

  return NextResponse.json(
    { stations: merged, attribution: [...new Set(attribution)] },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
