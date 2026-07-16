// Shared fuel types + helpers for the /api/fuel proxy and the map layer.

export interface FuelStation {
  id: string;
  name: string;
  brand?: string;
  lat: number;
  lng: number;
  /** Diesel price in EUR/litre, or null when only a location is known. */
  dieselPrice: number | null;
  source: "FR" | "AT" | "DE" | "LU" | "OSM";
}

export interface FuelResponse {
  stations: FuelStation[];
  /** Sources that contributed, for attribution. */
  attribution: string[];
}

// Luxembourg sets one national maximum road-diesel price (STATEC); there is no
// per-station feed. Kept as config — update every few months. ~€1.61/L, Jul 2026.
export const LU_DIESEL_PRICE = 1.61;

// Rough country bounding boxes [south, west, north, east] for deciding which
// national feeds a viewport overlaps. Deliberately generous.
export const COUNTRY_BOXES: Record<
  "FR" | "AT" | "DE" | "LU",
  [number, number, number, number]
> = {
  FR: [41.3, -5.2, 51.1, 9.6],
  AT: [46.3, 9.5, 49.1, 17.2],
  DE: [47.2, 5.8, 55.1, 15.1],
  LU: [49.4, 5.7, 50.2, 6.6],
};

export function boxesOverlap(
  a: [number, number, number, number],
  b: [number, number, number, number],
): boolean {
  // [s, w, n, e]
  return !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);
}

export function pointInBox(
  lat: number,
  lng: number,
  b: [number, number, number, number],
): boolean {
  return lat >= b[0] && lat <= b[2] && lng >= b[1] && lng <= b[3];
}

// Luxembourg is tiny and wedged between BE/DE/FR, so a bounding box catches a
// strip of each neighbour — which wrongly stamped German Mosel stations with
// LU's national price. This simplified border polygon ([lng, lat], tracing the
// Our/Sûre/Moselle on the east) keeps the fixed price to actual LU territory.
export const LU_POLYGON: [number, number][] = [
  [6.02, 50.18],
  [6.13, 50.05],
  [6.24, 49.9],
  [6.28, 49.87],
  [6.5, 49.81],
  [6.51, 49.72],
  [6.51, 49.57],
  [6.37, 49.47],
  [6.1, 49.46],
  [5.87, 49.5],
  [5.79, 49.54],
  [5.74, 49.62],
  [5.87, 49.72],
  [5.78, 49.85],
  [5.86, 49.94],
  [5.83, 50.06],
  [5.98, 50.14],
];

export function pointInPolygon(
  lat: number,
  lng: number,
  poly: [number, number][],
): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Metres between two lat/lng points (haversine). */
export function metresBetween(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
