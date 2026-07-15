"use client";

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Camera, Fuel } from "lucide-react";

import {
  MAPBOX_TOKEN,
  DEFAULT_MAP_STYLE,
  MAP_STYLES,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from "@/lib/mapbox/config";
import { getRoute, formatDuration, formatDistance, type RouteResult } from "@/lib/mapbox/directions";
import { cn } from "@/lib/utils";
import { buildMapsUrl } from "@/lib/maps-link";
import { POI_DATA, type PoiType } from "@/lib/poi-data";
import type { Stop } from "@/lib/types";
import type { CampsiteOption } from "@/lib/campsite-options";

const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const POI_EMOJI: Record<PoiType, string> = {
  viewpoint: "📷",
  lake: "🏊",
  castle: "🏰",
  restaurant: "🍽️",
  attraction: "🎡",
  nature: "🌲",
  town: "🏘️",
};

type MapStyleKey = keyof typeof MAP_STYLES;
const STYLE_OPTIONS: { key: MapStyleKey; label: string }[] = [
  { key: "dark", label: "Map" },
  { key: "satellite", label: "Satellite" },
  { key: "outdoors", label: "Terrain" },
];

export interface TripMapHandle {
  flyToStop: (index: number) => void;
}

interface TripMapProps {
  stops: Stop[];
  options?: CampsiteOption[];
  maxDrivingMinutes?: number;
  /** Segment index at which return leg begins (segments after this are dashed) */
  returnFromSegment?: number;
  /** Dim everything outside this inclusive stop-index range (null = show all). */
  focusRange?: [number, number] | null;
  /** Clicking a marker selects that stop (same as the list) — index into stops. */
  onSelectStop?: (index: number) => void;
  onRouteCalculated?: (route: RouteResult) => void;
  className?: string;
}

// Tesla cockpit marker colours (hex — WebGL can't read CSS vars).
// Aligned to the dark tokens in globals.css / DESIGN.md.
const VOLT = "#3e6ae1";
const ORANGE = "#e8b23a"; // amber accent (kept name for existing refs)
const SAGE_DEEP = "#8a9099"; // ink-dim

const STOP_TYPE_COLOURS: Record<string, string> = {
  campsite: "#2fbf71", // good
  city: VOLT,
  attraction: "#f5f6f7", // ink
  rest: "#e8b23a", // amber
  event: "#e31937", // alert
  transport: "#8a9099", // ink-dim
};

const HEALTH_COLOURS = {
  green: "#2fbf71",
  amber: "#e8b23a",
  red: "#e31937",
} as const;

function segmentHealth(
  durationSeconds: number,
  maxMinutes: number,
): keyof typeof HEALTH_COLOURS {
  const hours = durationSeconds / 3600;
  if (hours < 4) return "green";
  if (hours <= maxMinutes / 60) return "amber";
  return "red";
}

function segmentMidpoint(geometry: GeoJSON.LineString): [number, number] {
  const coords = geometry.coordinates as [number, number][];
  return coords[Math.floor(coords.length / 2)];
}

/** The point at 50% of the cumulative distance ALONG a route polyline — i.e.
 * on the actual road, not the geographic average of the endpoints (which for a
 * sea crossing lands in the water). */
function midpointAlong(coords: [number, number][]): [number, number] {
  const cum: number[] = [0];
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    const dx = (lng2 - lng1) * Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180);
    total += Math.hypot(dx, lat2 - lat1);
    cum.push(total);
  }
  const half = total / 2;
  for (let i = 1; i < coords.length; i++) {
    if (cum[i] >= half) {
      const t = (half - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      const [lng1, lat1] = coords[i - 1];
      const [lng2, lat2] = coords[i];
      return [lng1 + (lng2 - lng1) * t, lat1 + (lat2 - lat1) * t];
    }
  }
  return coords[Math.floor(coords.length / 2)];
}


export const TripMap = forwardRef<TripMapHandle, TripMapProps>(function TripMap({
  stops,
  options,
  maxDrivingMinutes = 300,
  returnFromSegment,
  focusRange,
  onSelectStop,
  onRouteCalculated,
  className,
}, ref) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const focusRangeRef = useRef<[number, number] | null | undefined>(focusRange);
  focusRangeRef.current = focusRange;
  const onSelectStopRef = useRef(onSelectStop);
  onSelectStopRef.current = onSelectStop;
  const optionMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const routeLayerIdsRef = useRef<string[]>([]);
  const routeSourceIdsRef = useRef<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [styleKey, setStyleKey] = useState<MapStyleKey>("dark");
  const [showSights, setShowSights] = useState(false);
  const poiMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [showFuel, setShowFuel] = useState(false);
  const [fuelZoomedOut, setFuelZoomedOut] = useState(false);
  const fuelMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [redrawNonce, setRedrawNonce] = useState(0);
  // Track the style actually applied to the map (initial is set on init). This
  // avoids a mount-timing bug where map.current is null on first render and the
  // first user style change gets swallowed.
  const appliedStyle = useRef<MapStyleKey>("dark");

  // Swap the base style at runtime. Markers persist; the route layers are
  // wiped by setStyle, so bump a nonce on style.load to redraw them.
  useEffect(() => {
    if (!map.current || styleKey === appliedStyle.current) return;
    appliedStyle.current = styleKey;
    map.current.setStyle(MAP_STYLES[styleKey]);
    map.current.once("style.load", () => setRedrawNonce((n) => n + 1));
  }, [styleKey]);

  // Sightseeing POI layer — togglable emoji markers, each with a popup.
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    poiMarkersRef.current.forEach((m) => m.remove());
    poiMarkersRef.current = [];
    if (!showSights) return;
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    POI_DATA.forEach((p) => {
      const el = document.createElement("div");
      el.textContent = POI_EMOJI[p.type];
      el.style.cssText =
        "font-size:18px;line-height:1;cursor:pointer;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.7));";
      const popup = new mapboxgl.Popup({ maxWidth: "250px", offset: 14 })
        .setHTML(
          `<div class="pop-title">${esc(p.name)}</div>` +
            `<div class="pop-sub" style="color:var(--foreground);opacity:.85">${esc(p.blurb)}</div>` +
            `<div style="margin-top:6px;font-size:11px;color:var(--muted-foreground);text-transform:capitalize">${p.type} · ${p.stopLength} · ${esc(p.source)}</div>` +
            `<a href="${buildMapsUrl(p.lat, p.lng, p.name)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:600;color:var(--volt-tint);text-decoration:none">Navigate →</a>`,
        );
      const m = new mapboxgl.Marker(el)
        .setLngLat([p.lng, p.lat])
        .setPopup(popup)
        .addTo(map.current!);
      poiMarkersRef.current.push(m);
    });
  }, [showSights, isLoaded, redrawNonce]);

  // Live petrol stations from OpenStreetMap (free, no key) for the visible area.
  const loadFuel = useCallback(async () => {
    const m = map.current;
    if (!m) return;
    fuelMarkersRef.current.forEach((mk) => mk.remove());
    fuelMarkersRef.current = [];
    if (!showFuel) return;
    if (m.getZoom() < 8.5) {
      setFuelZoomedOut(true);
      return;
    }
    setFuelZoomedOut(false);
    const b = m.getBounds();
    if (!b) return;
    const q = `[out:json][timeout:12];node["amenity"="fuel"](${b.getSouth().toFixed(4)},${b.getWest().toFixed(4)},${b.getNorth().toFixed(4)},${b.getEast().toFixed(4)});out body 80;`;
    try {
      const res = await fetch(
        "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(q),
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!map.current || !showFuel) return;
      for (const n of data.elements ?? []) {
        if (n.lat == null || n.lon == null) continue;
        const name: string = n.tags?.name || n.tags?.brand || "Petrol station";
        const el = document.createElement("div");
        el.textContent = "⛽";
        el.style.cssText =
          "font-size:15px;line-height:1;cursor:pointer;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.7));";
        const popup = new mapboxgl.Popup({ maxWidth: "220px", offset: 12 }).setHTML(
          `<div class="pop-title">${escHtml(name)}</div>` +
            (n.tags?.brand && n.tags.brand !== name
              ? `<div class="pop-sub">${escHtml(n.tags.brand)}</div>`
              : "") +
            `<a href="${buildMapsUrl(n.lat, n.lon, name)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:600;color:var(--volt-tint);text-decoration:none">Navigate →</a>`,
        );
        const marker = new mapboxgl.Marker(el)
          .setLngLat([n.lon, n.lat])
          .setPopup(popup)
          .addTo(map.current!);
        fuelMarkersRef.current.push(marker);
      }
    } catch {
      /* Overpass unavailable — fail silent */
    }
  }, [showFuel]);

  useEffect(() => {
    const m = map.current;
    if (!m || !isLoaded) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const onMove = () => {
      if (t) clearTimeout(t);
      t = setTimeout(loadFuel, 400);
    };
    loadFuel();
    m.on("moveend", onMove);
    return () => {
      if (t) clearTimeout(t);
      m.off("moveend", onMove);
    };
  }, [showFuel, isLoaded, loadFuel]);

  // Dim markers + route segments outside the focused leg.
  const applyFocus = useCallback(() => {
    if (!map.current) return;
    const fr = focusRangeRef.current;
    const inRange = (i: number) => !fr || (i >= fr[0] && i <= fr[1]);
    markersRef.current.forEach((m, i) => {
      const el = m.getElement();
      el.style.transition = "opacity 0.3s ease";
      el.style.opacity = inRange(i) ? "1" : "0.25";
    });
    routeLayerIdsRef.current.forEach((id) => {
      const match = id.match(/^route-seg-(\d+)$/);
      if (!match || !map.current?.getLayer(id)) return;
      const seg = Number(match[1]);
      map.current.setPaintProperty(
        id,
        "line-opacity",
        inRange(seg) && inRange(seg + 1) ? 0.95 : 0.1,
      );
    });
  }, []);

  // Re-apply focus when the selected leg changes.
  useEffect(() => {
    applyFocus();
  }, [focusRange, applyFocus]);

  const flyToStop = useCallback((index: number) => {
    const stop = stops[index];
    if (!stop || !map.current) return;
    // On mobile the bottom sheet covers the lower ~half of the map, so pad the
    // camera to land the pin in the visible band ABOVE the sheet.
    const h = map.current.getContainer().clientHeight;
    const isMobile =
      typeof window !== "undefined" && window.innerWidth < 768;
    map.current.flyTo({
      center: [stop.location.lng, stop.location.lat],
      zoom: 10,
      duration: 1200,
      padding: isMobile
        ? { top: 40, bottom: Math.round(h * 0.5), left: 24, right: 24 }
        : { top: 0, bottom: 0, left: 0, right: 0 },
    });
  }, [stops]);

  useImperativeHandle(ref, () => ({ flyToStop }), [flyToStop]);

  // Initialise map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: DEFAULT_MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    // Zoom control on desktop only — pinch handles it on mobile, and it
    // otherwise crowds the top-right against the sheet + safe area.
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    }

    map.current.on("load", () => {
      setIsLoaded(true);

      // Break-stop interactions — bound once (layer-scoped handlers fire
      // when the layer appears, so no need to rebind per stops update).
      map.current!.on("click", "break-stops", (e) => {
        if (!e.features?.[0] || !map.current) return;
        const label = e.features[0].properties?.label as string;
        new mapboxgl.Popup({ maxWidth: "260px" })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div class="pop-card"><div class="pop-title">Suggested break</div><div class="pop-sub">${label}</div></div>`,
          )
          .addTo(map.current);
      });
      map.current!.on("mouseenter", "break-stops", () => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer";
      });
      map.current!.on("mouseleave", "break-stops", () => {
        if (map.current) map.current.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers and route when stops change
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    let stale = false;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    optionMarkersRef.current.forEach((marker) => marker.remove());
    optionMarkersRef.current = [];

    // Remove existing route layers first, then sources
    routeLayerIdsRef.current.forEach((id) => {
      if (map.current?.getLayer(id)) map.current.removeLayer(id);
    });
    routeSourceIdsRef.current.forEach((id) => {
      if (map.current?.getSource(id)) map.current.removeSource(id);
    });
    routeLayerIdsRef.current = [];
    routeSourceIdsRef.current = [];

    if (stops.length === 0) return;

    // Add markers for each stop
    let overnightNumber = 0;
    stops.forEach((stop, index) => {
      const isWaypoint = stop.nights === 0 && index > 0 && index < stops.length - 1;
      const el = document.createElement("div");

      if (isWaypoint) {
        // Waypoint: small diamond marker
        el.className = "waypoint-marker";
        el.style.cssText = `
          width: 18px;
          height: 18px;
          background-color: ${STOP_TYPE_COLOURS[stop.type] || "#6b7280"};
          border: 2px solid white;
          border-radius: 3px;
          transform: rotate(45deg);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        `;
      } else {
        // Overnight stop: numbered circle, with a booking-status ring
        overnightNumber++;
        el.className = "stop-marker";
        const bookable = stop.type === "campsite" || stop.type === "transport";
        // Booking status is carried by the RING only; the traffic-light greens
        // /ambers/reds stay reserved for route drive-health. Markers get one
        // neutral fill (volt for the event/destination) so nothing collides.
        const ring = bookable
          ? stop.bookingReference
            ? "#2fbf71" // booked
            : "#e8b23a" // not booked
          : null;
        const fill = stop.type === "event" ? VOLT : "#2a2e35";
        el.style.cssText = `
          width: 32px;
          height: 32px;
          background-color: ${fill};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: bold;
          font-size: 14px;
          box-shadow: ${ring ? `0 0 0 2.5px ${ring}, ` : ""}0 2px 5px rgba(0,0,0,0.4);
          cursor: pointer;
        `;
        el.textContent = String(overnightNumber);
      }

      // Clicking a marker selects the stop — same as clicking the list row.
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectStopRef.current?.(index);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([stop.location.lng, stop.location.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit map to show all stops
    const bounds = new mapboxgl.LngLatBounds();
    stops.forEach((stop) => {
      bounds.extend([stop.location.lng, stop.location.lat]);
    });
    // Include option coords in bounds so they're visible
    if (options && options.length > 0) {
      options.forEach((opt) => bounds.extend(opt.coords));
    }
    const onMobile =
      typeof window !== "undefined" && window.innerWidth < 768;
    map.current.fitBounds(bounds, {
      padding: onMobile
        ? { top: 60, left: 40, right: 40, bottom: Math.round(window.innerHeight * 0.5) }
        : 50,
    });
    applyFocus();

    // Campsite option markers — DOM markers (purple/pink dots)
    if (options && options.length > 0) {
      options.forEach((opt) => {
        const el = document.createElement("div");
        const isBooked = !!opt.booked;
        const isRec = !!opt.rec;
        const markerColor = isBooked ? "#4e9a68" : isRec ? ORANGE : SAGE_DEEP;
        el.style.cssText = `
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2.5px solid white;
          background: ${markerColor};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 9px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        `;
        el.textContent = opt.id;

        const bookedBadge = isBooked
          ? `<span style="background:#4e9a68;color:white;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:4px;font-weight:700">✓ BOOKED</span>`
          : "";
        const recBadge = !isBooked && isRec
          ? `<span style="background:${ORANGE};color:white;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:4px;font-weight:700">★ FAV</span>`
          : "";
        const bookingRefLine = isBooked && opt.bookingRef
          ? `<br><span style="color:#4e9a68;font-size:11px;font-weight:600">Ref: ${opt.bookingRef}</span>`
          : "";

        const popup = new mapboxgl.Popup({ offset: 15, closeButton: true }).setHTML(`
          <div style="padding: 8px; max-width: 220px;">
            <strong>${opt.name}</strong>${bookedBadge}${recBadge}
            <br><span style="color: var(--muted-foreground); font-size: 12px;">For: ${opt.stop}</span>
            <br><span style="color: ${SAGE_DEEP}; font-size: 12px;">${opt.rating} · ${opt.price}</span>${bookingRefLine}
            <br><a href="${opt.url}" target="_blank" style="color: ${ORANGE}; font-size: 11px;">Website →</a>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat(opt.coords)
          .setPopup(popup)
          .addTo(map.current!);

        optionMarkersRef.current.push(marker);
      });
    }

    // Fetch and draw route if more than one stop
    if (stops.length >= 2) {
      const stopsForRoute = stops.map((s) => ({
        name: s.name,
        location: s.location,
      }));

      getRoute(stopsForRoute).then((route) => {
        if (!route || !map.current || stale) return;

        onRouteCalculated?.(route);

        const newLayerIds: string[] = [];
        const newSourceIds: string[] = [];

        // Draw each segment as a separate coloured line
        route.segments.forEach((segment, i) => {
          const health = segmentHealth(segment.duration, maxDrivingMinutes);
          const sourceId = `route-seg-src-${i}`;
          const layerId = `route-seg-${i}`;

          const geometry: GeoJSON.LineString =
            segment.geometry.coordinates.length >= 2
              ? segment.geometry
              : {
                  type: "LineString",
                  coordinates: [
                    [stops[i].location.lng, stops[i].location.lat],
                    [stops[i + 1].location.lng, stops[i + 1].location.lat],
                  ],
                };

          map.current!.addSource(sourceId, {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry },
          });

          const isReturn =
            returnFromSegment != null && i >= returnFromSegment;

          map.current!.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": HEALTH_COLOURS[health],
              "line-width": 5,
              "line-opacity": 0.95,
              "line-blur": 0.6,
              ...(isReturn ? { "line-dasharray": [2, 1.5] } : {}),
            },
          });

          newSourceIds.push(sourceId);
          newLayerIds.push(layerId);
        });

        // Segment time labels at each leg midpoint
        const labelFeatures: GeoJSON.Feature<GeoJSON.Point>[] = route.segments.map(
          (segment, i) => {
            const geometry: GeoJSON.LineString =
              segment.geometry.coordinates.length >= 2
                ? segment.geometry
                : {
                    type: "LineString",
                    coordinates: [
                      [stops[i].location.lng, stops[i].location.lat],
                      [stops[i + 1].location.lng, stops[i + 1].location.lat],
                    ],
                  };

            const midpoint: [number, number] =
              geometry.coordinates.length >= 2
                ? segmentMidpoint(geometry)
                : [
                    (stops[i].location.lng + stops[i + 1].location.lng) / 2,
                    (stops[i].location.lat + stops[i + 1].location.lat) / 2,
                  ];

            return {
              type: "Feature",
              properties: {
                label: `${formatDuration(segment.duration)} · ${formatDistance(segment.distance)}`,
              },
              geometry: { type: "Point", coordinates: midpoint },
            };
          },
        );

        map.current!.addSource("segment-labels-src", {
          type: "geojson",
          data: { type: "FeatureCollection", features: labelFeatures },
        });

        map.current!.addLayer({
          id: "segment-labels",
          type: "symbol",
          source: "segment-labels-src",
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
            "text-optional": true,
            "text-allow-overlap": false,
            "text-anchor": "center",
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "rgba(11,12,14,0.9)",
            "text-halo-width": 2.5,
          },
        });

        newSourceIds.push("segment-labels-src");
        newLayerIds.push("segment-labels");

        // Suggested break: halfway ALONG the road, only on real driving legs of
        // 2 h+ (skips the Channel crossing and short hops). Visible at zoom >= 7.
        const breakFeatures: GeoJSON.Feature<GeoJSON.Point>[] = route.segments
          .map((segment, i): GeoJSON.Feature<GeoJSON.Point> | null => {
            const coords = segment.geometry?.coordinates as
              | [number, number][]
              | undefined;
            if (!coords || coords.length <= 2) return null; // no real road (e.g. ferry/tunnel)
            if (segment.duration / 3600 < 2) return null; // only worth it on longer drives
            return {
              type: "Feature",
              properties: {
                label: `Roughly halfway on the ${stops[i].name} → ${stops[i + 1].name} leg`,
              },
              geometry: { type: "Point", coordinates: midpointAlong(coords) },
            };
          })
          .filter((f): f is GeoJSON.Feature<GeoJSON.Point> => f !== null);

        map.current!.addSource("break-stops-src", {
          type: "geojson",
          data: { type: "FeatureCollection", features: breakFeatures },
        });

        map.current!.addLayer({
          id: "break-stops",
          type: "circle",
          source: "break-stops-src",
          minzoom: 7,
          paint: {
            "circle-radius": 7,
            "circle-color": ORANGE,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.85,
          },
        });

        newSourceIds.push("break-stops-src");
        newLayerIds.push("break-stops");

        routeLayerIdsRef.current = newLayerIds;
        routeSourceIdsRef.current = newSourceIds;
        applyFocus();
      });
    }

    return () => { stale = true; };
  }, [stops, options, isLoaded, onRouteCalculated, maxDrivingMinutes, returnFromSegment, applyFocus, redrawNonce]);

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", minHeight: "400px" }}
    >
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      {/* Base-style switcher */}
      <div className="glass absolute left-1/2 top-[calc(0.75rem+env(safe-area-inset-top))] z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full p-0.5 text-[11px]">
        {STYLE_OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setStyleKey(o.key)}
            className={cn(
              "focus-ring rounded-full px-2.5 py-1 font-medium transition-colors",
              styleKey === o.key
                ? "bg-white/[0.14] text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Map layer toggles: sights + live fuel */}
      <div className="absolute left-1/2 top-[calc(3.25rem+env(safe-area-inset-top))] z-10 flex -translate-x-1/2 items-center gap-2">
        <button
          type="button"
          onClick={() => setShowSights((s) => !s)}
          aria-pressed={showSights}
          className={cn(
            "glass focus-ring flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
            showSights
              ? "text-volt-tint"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Camera className="size-3.5" />
          {showSights ? "Sights on" : `Sights (${POI_DATA.length})`}
        </button>
        <button
          type="button"
          onClick={() => setShowFuel((s) => !s)}
          aria-pressed={showFuel}
          className={cn(
            "glass focus-ring flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
            showFuel
              ? "text-volt-tint"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Fuel className="size-3.5" />
          {showFuel ? "Fuel on" : "Fuel"}
        </button>
        {showFuel && fuelZoomedOut && (
          <span className="glass rounded-full px-2.5 py-1.5 text-[10px] text-muted-foreground">
            Zoom in for stations
          </span>
        )}
      </div>
    </div>
  );
});
