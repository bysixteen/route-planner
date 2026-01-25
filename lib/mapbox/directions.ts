import { MAPBOX_TOKEN, DIRECTIONS_PROFILE } from "./config";
import type { Geopoint } from "@/lib/types";

export interface RouteSegment {
  from: string;
  to: string;
  distance: number; // metres
  duration: number; // seconds
  geometry: GeoJSON.LineString;
}

export interface RouteResult {
  totalDistance: number; // metres
  totalDuration: number; // seconds
  segments: RouteSegment[];
  fullRoute: GeoJSON.LineString;
}

/**
 * Fetch driving directions between multiple stops using Mapbox Directions API
 */
export async function getRoute(
  stops: Array<{ name: string; location: Geopoint }>,
): Promise<RouteResult | null> {
  if (stops.length < 2) return null;

  // Mapbox allows max 25 waypoints per request
  const coordinates = stops
    .map((stop) => `${stop.location.lng},${stop.location.lat}`)
    .join(";");

  const url = `https://api.mapbox.com/directions/v5/${DIRECTIONS_PROFILE}/${coordinates}?geometries=geojson&overview=full&steps=false&access_token=${MAPBOX_TOKEN}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Directions API error:", response.status);
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.error("No routes found");
      return null;
    }

    const route = data.routes[0];
    const legs = route.legs;

    const segments: RouteSegment[] = legs.map(
      (leg: { distance: number; duration: number }, index: number) => ({
        from: stops[index].name,
        to: stops[index + 1].name,
        distance: leg.distance,
        duration: leg.duration,
        geometry: {
          type: "LineString",
          coordinates: [], // Individual segment geometry not available with overview=full
        },
      }),
    );

    return {
      totalDistance: route.distance,
      totalDuration: route.duration,
      segments,
      fullRoute: route.geometry,
    };
  } catch (error) {
    console.error("Error fetching route:", error);
    return null;
  }
}

/**
 * Format distance in kilometres
 */
export function formatDistance(metres: number): string {
  const km = metres / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/**
 * Format duration in hours and minutes
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} min`;
  }

  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

/**
 * Check if a segment exceeds the maximum driving time
 */
export function exceedsMaxDriving(
  durationSeconds: number,
  maxMinutes: number,
): boolean {
  return durationSeconds > maxMinutes * 60;
}
