"use client";

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  IconStack2,
  IconX,
  IconCheck,
  IconCamera,
  IconBuildingCastle,
  IconSwimming,
  IconTrees,
  IconRollercoaster,
  IconToolsKitchen2,
  IconBuildingCommunity,
  IconGasStation,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

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
import type { FuelStation } from "@/lib/fuel";
import type { Stop } from "@/lib/types";
import type { CampsiteOption } from "@/lib/campsite-options";

const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Sightseeing categories — Tabler glyphs (consistent line-icon system, no emoji).
const POI_CATS: { type: PoiType; label: string; Icon: TablerIcon }[] = [
  { type: "viewpoint", label: "Viewpoints", Icon: IconCamera },
  { type: "castle", label: "Castles", Icon: IconBuildingCastle },
  { type: "lake", label: "Lakes & swims", Icon: IconSwimming },
  { type: "nature", label: "Nature", Icon: IconTrees },
  { type: "attraction", label: "Attractions", Icon: IconRollercoaster },
  { type: "restaurant", label: "Food stops", Icon: IconToolsKitchen2 },
  { type: "town", label: "Towns", Icon: IconBuildingCommunity },
];
const POI_ICON: Record<PoiType, TablerIcon> = Object.fromEntries(
  POI_CATS.map((c) => [c.type, c.Icon]),
) as Record<PoiType, TablerIcon>;

/** Render a Tabler icon into a fresh DOM node (for imperative Mapbox markers). */
function iconEl(Icon: TablerIcon, roots: Root[], size = 15): HTMLDivElement {
  const el = document.createElement("div");
  const root = createRoot(el);
  root.render(<Icon size={size} stroke={1.9} />);
  roots.push(root);
  return el;
}

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


// Persists across re-renders: station locations seen on previous fetches.
// Used to show pump icons instantly while fresh prices load from the API.
const fuelLocationCache = new Map<string, FuelStation>();

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
  // Overlay layer system (replaces the old top-centre pills).
  const [layersOpen, setLayersOpen] = useState(false);
  const [sightCats, setSightCats] = useState<Set<PoiType>>(new Set());
  const [fuelOn, setFuelOn] = useState(false);
  const [fuelZoomedOut, setFuelZoomedOut] = useState(false);
  const poiMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const poiRootsRef = useRef<Root[]>([]);
  const fuelMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const fuelRootsRef = useRef<Root[]>([]);
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

  // Sightseeing POI layer — Tabler-glyph discs, filtered by enabled category.
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    poiMarkersRef.current.forEach((m) => m.remove());
    poiMarkersRef.current = [];
    poiRootsRef.current.forEach((r) => queueMicrotask(() => r.unmount()));
    poiRootsRef.current = [];
    if (sightCats.size === 0) return;
    POI_DATA.filter((p) => sightCats.has(p.type)).forEach((p) => {
      try {
        const el = iconEl(POI_ICON[p.type], poiRootsRef.current);
        el.className = "map-disc map-disc--poi";
        const popup = new mapboxgl.Popup({ maxWidth: "250px", offset: 16 }).setHTML(
          `<div class="pop-title">${escHtml(p.name)}</div>` +
            `<div class="pop-sub" style="color:var(--foreground);opacity:.85">${escHtml(p.blurb)}</div>` +
            `<div style="margin-top:6px;font-size:11px;color:var(--muted-foreground);text-transform:capitalize">${p.type} · ${p.stopLength} · ${escHtml(p.source)}</div>` +
            `<a href="${buildMapsUrl(p.lat, p.lng, p.name)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:600;color:var(--volt-tint);text-decoration:none">Navigate →</a>`,
        );
        const m = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([p.lng, p.lat])
          .setPopup(popup)
          .addTo(map.current!);
        poiMarkersRef.current.push(m);
      } catch {
        /* skip a bad marker rather than crash the whole layer */
      }
    });
  }, [sightCats, isLoaded, redrawNonce]);

  // Live diesel prices for the visible area via the /api/fuel proxy. Cheapest
  // stations render as bright volt price-pills; dearer ones recede; unpriced
  // stations show a small pump glyph. Overlapping pills are de-cluttered so the
  // cheapest in any crowded patch wins the pixel.
  const clearFuel = useCallback(() => {
    fuelMarkersRef.current.forEach((mk) => mk.remove());
    fuelMarkersRef.current = [];
    fuelRootsRef.current.forEach((r) => queueMicrotask(() => r.unmount()));
    fuelRootsRef.current = [];
  }, []);

  const loadFuel = useCallback(async () => {
    const m = map.current;
    if (!m) return;
    if (!fuelOn) { clearFuel(); return; }
    if (m.getZoom() < 8.5) {
      setFuelZoomedOut(true);
      return;
    }
    setFuelZoomedOut(false);
    const b = m.getBounds();
    if (!b) return;

    // Phase 1 — show cached station positions immediately so the map never
    // goes blank while prices are loading. Skip if markers are already visible
    // (e.g. a pan within an area we already fetched).
    if (fuelMarkersRef.current.length === 0) {
      [...fuelLocationCache.values()]
        .filter((s) => b.contains([s.lng, s.lat]))
        .forEach((s) => {
          try {
            const el = iconEl(IconGasStation, fuelRootsRef.current, 14);
            el.className = "map-disc map-disc--fuel";
            const popup = new mapboxgl.Popup({ maxWidth: "220px", offset: 14 }).setHTML(
              `<div class="pop-title">${escHtml(s.name)}</div>` +
              `<div class="pop-sub" style="color:var(--muted-foreground)">Loading price…</div>` +
              `<a href="${buildMapsUrl(s.lat, s.lng, s.name)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:600;color:var(--volt-tint);text-decoration:none">Navigate →</a>`,
            );
            const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
              .setLngLat([s.lng, s.lat])
              .setPopup(popup)
              .addTo(m);
            fuelMarkersRef.current.push(marker);
          } catch { /* skip */ }
        });
    }

    // Phase 2 — fetch fresh stations + live prices.
    const qs = `s=${b.getSouth().toFixed(4)}&w=${b.getWest().toFixed(4)}&n=${b.getNorth().toFixed(4)}&e=${b.getEast().toFixed(4)}`;
    try {
      const res = await fetch(`/api/fuel?${qs}`);
      if (!res.ok) return;
      const data: { stations: FuelStation[] } = await res.json();
      if (!map.current || !fuelOn) return;

      // Update the location cache so future pans show positions instantly.
      data.stations.forEach((s) => fuelLocationCache.set(s.id, s));

      // Swap cached placeholders for the full priced set.
      clearFuel();

      const priced = data.stations
        .filter((s) => s.dieselPrice != null)
        .sort((a, b2) => a.dieselPrice! - b2.dieselPrice!);
      const unpriced = data.stations.filter((s) => s.dieselPrice == null);

      // Tercile thresholds across the visible priced set for the volt→dim grade.
      const prices = priced.map((s) => s.dieselPrice!);
      const t1 = prices[Math.floor(prices.length / 3)] ?? Infinity;
      const t2 = prices[Math.floor((prices.length * 2) / 3)] ?? Infinity;

      // Greedy de-overlap: cheapest first, skip anything within 44px of a placed pill.
      const placed: { x: number; y: number }[] = [];
      const tooClose = (x: number, y: number) =>
        placed.some((p) => Math.hypot(p.x - x, p.y - y) < 44);

      const render = (s: FuelStation, pricePill: boolean) => {
       try {
        const pt = map.current!.project([s.lng, s.lat]);
        if (tooClose(pt.x, pt.y)) return;
        placed.push({ x: pt.x, y: pt.y });
        let el: HTMLDivElement;
        if (pricePill && s.dieselPrice != null) {
          const grade =
            s.dieselPrice <= t1 ? "cheap" : s.dieselPrice <= t2 ? "mid" : "dear";
          el = document.createElement("div");
          el.className = `fuel-pill fuel-pill--${grade}`;
          el.textContent = `€${s.dieselPrice.toFixed(2)}`;
        } else {
          el = iconEl(IconGasStation, fuelRootsRef.current, 14);
          el.className = "map-disc map-disc--fuel";
        }
        const priceLine =
          s.dieselPrice != null
            ? `<div class="pop-sub" style="color:var(--volt-tint);font-weight:600">Diesel €${s.dieselPrice.toFixed(2)}/L</div>`
            : `<div class="pop-sub" style="color:var(--muted-foreground)">No live price here</div>`;
        const popup = new mapboxgl.Popup({ maxWidth: "220px", offset: 14 }).setHTML(
          `<div class="pop-title">${escHtml(s.name)}</div>` +
            priceLine +
            `<a href="${buildMapsUrl(s.lat, s.lng, s.name)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:600;color:var(--volt-tint);text-decoration:none">Navigate →</a>`,
        );
        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([s.lng, s.lat])
          .setPopup(popup)
          .addTo(map.current!);
        fuelMarkersRef.current.push(marker);
       } catch {
        /* skip a bad marker rather than crash the layer */
       }
      };

      priced.forEach((s) => render(s, true));
      unpriced.forEach((s) => render(s, false));
    } catch {
      /* proxy/feed unavailable — cached placeholders remain visible */
    }
  }, [fuelOn, clearFuel]);

  useEffect(() => {
    const m = map.current;
    if (!m || !isLoaded) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const onMove = () => {
      if (t) clearTimeout(t);
      t = setTimeout(loadFuel, 450);
    };
    loadFuel();
    m.on("moveend", onMove);
    return () => {
      if (t) clearTimeout(t);
      m.off("moveend", onMove);
    };
  }, [fuelOn, isLoaded, loadFuel]);

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
      map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");
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

  const activeLayerCount = (sightCats.size > 0 ? 1 : 0) + (fuelOn ? 1 : 0);

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", minHeight: "400px" }}
    >
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {/* Single Layers control (top-right) → glass panel. Replaces scattered pills. */}
      <div className="absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-30">
        <button
          type="button"
          onClick={() => setLayersOpen((o) => !o)}
          aria-expanded={layersOpen}
          aria-label="Map layers"
          className={cn(
            "glass focus-ring relative flex size-10 items-center justify-center rounded-xl transition-colors",
            layersOpen || activeLayerCount > 0
              ? "text-volt-tint"
              : "text-foreground hover:text-volt-tint",
          )}
        >
          <IconStack2 size={19} stroke={1.9} />
          {activeLayerCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-volt text-[9px] font-bold text-white tabular-nums">
              {activeLayerCount}
            </span>
          )}
        </button>

        {layersOpen && (
          <div className="glass absolute right-0 top-12 max-h-[70vh] w-64 overflow-y-auto overscroll-contain rounded-2xl p-3 text-[13px] shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="label text-muted-foreground">Map layers</span>
              <button
                type="button"
                onClick={() => setLayersOpen(false)}
                aria-label="Close"
                className="focus-ring -m-1 rounded-full p-1 text-muted-foreground hover:text-foreground"
              >
                <IconX size={15} />
              </button>
            </div>

            {/* Base map */}
            <div className="mb-1 flex gap-1 rounded-lg bg-white/[0.04] p-1">
              {STYLE_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setStyleKey(o.key)}
                  className={cn(
                    "focus-ring flex-1 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors",
                    styleKey === o.key
                      ? "bg-white/[0.12] text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* Sights */}
            <div className="mt-3 mb-1 flex items-center justify-between">
              <span className="label text-muted-foreground">Sights</span>
              <button
                type="button"
                onClick={() =>
                  setSightCats((prev) =>
                    prev.size === POI_CATS.length
                      ? new Set()
                      : new Set(POI_CATS.map((c) => c.type)),
                  )
                }
                className="focus-ring rounded text-[11px] font-medium text-volt-tint hover:underline"
              >
                {sightCats.size === POI_CATS.length ? "None" : "All"}
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              {POI_CATS.map(({ type, label, Icon }) => {
                const on = sightCats.has(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setSightCats((prev) => {
                        const next = new Set(prev);
                        if (next.has(type)) next.delete(type);
                        else next.add(type);
                        return next;
                      })
                    }
                    aria-pressed={on}
                    className={cn(
                      "focus-ring flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors",
                      on
                        ? "bg-white/[0.06] text-foreground"
                        : "text-muted-foreground hover:bg-white/[0.03]",
                    )}
                  >
                    <Icon size={16} stroke={1.9} className={on ? "text-volt-tint" : ""} />
                    <span className="flex-1 text-left">{label}</span>
                    {on && <IconCheck size={14} className="text-volt-tint" />}
                  </button>
                );
              })}
            </div>

            {/* Fuel prices */}
            <div className="mt-3 mb-1">
              <span className="label text-muted-foreground">Fuel</span>
            </div>
            <button
              type="button"
              onClick={() => setFuelOn((f) => !f)}
              aria-pressed={fuelOn}
              className={cn(
                "focus-ring flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors",
                fuelOn
                  ? "bg-white/[0.06] text-foreground"
                  : "text-muted-foreground hover:bg-white/[0.03]",
              )}
            >
              <IconGasStation
                size={16}
                stroke={1.9}
                className={fuelOn ? "text-volt-tint" : ""}
              />
              <span className="flex-1 text-left">Diesel prices</span>
              {fuelOn && <IconCheck size={14} className="text-volt-tint" />}
            </button>
            {fuelOn && (
              <p className="mt-1.5 px-2 text-[11px] leading-snug text-muted-foreground">
                {fuelZoomedOut
                  ? "Zoom in to load prices."
                  : "Cheapest nearby shown bright. Live where available (DE/FR/AT/LU)."}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Fuel grade legend, bottom-left, only when live */}
      {fuelOn && !fuelZoomedOut && (
        <div className="glass absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] text-muted-foreground">
          <span className="size-2.5 rounded-full bg-volt" />
          <span>cheaper</span>
          <span className="ml-1 size-2.5 rounded-full bg-white/20" />
          <span>dearer</span>
        </div>
      )}
    </div>
  );
});
