/**
 * Coordinate formatting — the cartographic "coordinate readout" motif.
 *
 * `formatCoordinate` renders a lat/lng in degrees–decimal-minutes with
 * hemisphere letters (e.g. `N 50°07.230' · E 04°21.880'`) for display.
 * `formatCoordinatePlain` renders plain decimal degrees
 * (e.g. `50.12050, 4.36467`) — the format that pastes cleanly into
 * Apple Maps / Google Maps search, so it's what we copy for satnav.
 */

function toDegreesDecimalMinutes(value: number, positive: string, negative: string): string {
  const hemisphere = value >= 0 ? positive : negative;
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minutes = (abs - degrees) * 60;
  // pad degrees to 2, minutes to 2 int digits + 3 decimals
  const mm = minutes.toFixed(3).padStart(6, "0");
  return `${hemisphere} ${degrees.toString().padStart(2, "0")}°${mm}'`;
}

/** Display form: `N 50°07.230' · E 04°21.880'` */
export function formatCoordinate(lat: number, lng: number): string {
  return `${toDegreesDecimalMinutes(lat, "N", "S")} · ${toDegreesDecimalMinutes(lng, "E", "W")}`;
}

/** Satnav / clipboard form: `50.12050, 4.36467` (decimal degrees). */
export function formatCoordinatePlain(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
