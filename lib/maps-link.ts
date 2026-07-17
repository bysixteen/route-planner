/**
 * Build a "navigate to here" deep link for the device's maps app.
 * Prefers a human address for the query where we have one (better search
 * results than raw coordinates), always includes coordinates as the anchor.
 * Apple devices → Apple Maps; everything else → a geo:/Google URL.
 */
export function buildMapsUrl(
  lat: number,
  lng: number,
  label?: string,
): string {
  const q = `${lat},${lng}`;
  const name = label ? encodeURIComponent(label) : "";
  const isApple =
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent) &&
    /apple/i.test(navigator.vendor ?? "");

  if (isApple) {
    // Apple Maps: daddr drops you straight into directions.
    return `https://maps.apple.com/?daddr=${q}${name ? `&q=${name}` : ""}`;
  }
  // Google Maps universal link — opens the app on Android, web elsewhere.
  return `https://www.google.com/maps/dir/?api=1&destination=${q}${
    name ? `&destination_place_id=&query=${name}` : ""
  }`;
}
