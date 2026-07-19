import { MAPBOX_TOKEN } from "@/lib/mapbox/config";

/**
 * Reverse-geocode coordinates → a human postal address for the satnav.
 * Fallback for stops without a static address from a confirmation email.
 * Fails silent (returns null) so the panel always renders.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null;
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
      `?types=address&limit=1&language=en&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.features?.[0]?.place_name ?? null;
  } catch {
    return null;
  }
}
