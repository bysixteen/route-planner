"use client";

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import {
  MAPBOX_TOKEN,
  DEFAULT_MAP_STYLE,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from "@/lib/mapbox/config";
import { getRoute, formatDuration, formatDistance, type RouteResult } from "@/lib/mapbox/directions";
import type { Stop } from "@/lib/types";
import type { CampsiteOption } from "@/lib/campsite-options";

export interface TripMapHandle {
  flyToStop: (index: number) => void;
}

interface TripMapProps {
  stops: Stop[];
  options?: CampsiteOption[];
  maxDrivingMinutes?: number;
  /** Segment index at which return leg begins (segments after this are dashed) */
  returnFromSegment?: number;
  onRouteCalculated?: (route: RouteResult) => void;
  className?: string;
}

const STOP_TYPE_COLOURS: Record<string, string> = {
  campsite: "#22c55e",
  city: "#3b82f6",
  attraction: "#f59e0b",
  rest: "#8b5cf6",
  event: "#ef4444",
  transport: "#06b6d4",
};

const HEALTH_COLOURS = {
  green: "#16a34a",
  amber: "#d97706",
  red: "#dc2626",
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

function geographicMidpoint(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number },
): [number, number] {
  return [(a.lng + b.lng) / 2, (a.lat + b.lat) / 2];
}

export const TripMap = forwardRef<TripMapHandle, TripMapProps>(function TripMap({
  stops,
  options,
  maxDrivingMinutes = 300,
  returnFromSegment,
  onRouteCalculated,
  className,
}, ref) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const optionMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const routeLayerIdsRef = useRef<string[]>([]);
  const routeSourceIdsRef = useRef<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const flyToStop = useCallback((index: number) => {
    const stop = stops[index];
    if (!stop || !map.current) return;
    map.current.flyTo({
      center: [stop.location.lng, stop.location.lat],
      zoom: 10,
      duration: 1200,
    });
    // Open the marker popup
    markersRef.current[index]?.togglePopup();
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

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      setIsLoaded(true);
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
        // Overnight stop: numbered circle
        overnightNumber++;
        el.className = "stop-marker";
        el.style.cssText = `
          width: 32px;
          height: 32px;
          background-color: ${STOP_TYPE_COLOURS[stop.type] || "#6b7280"};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        `;
        el.textContent = String(overnightNumber);
      }

      const waypointLabel = isWaypoint ? `<br><span style="color: #f59e0b; font-size: 11px; font-weight: 600;">Waypoint</span>` : "";
      const popup = new mapboxgl.Popup({ offset: isWaypoint ? 15 : 25 }).setHTML(`
        <div style="padding: 8px;">
          <strong>${stop.name}</strong>
          ${waypointLabel}
          ${stop.country ? `<br><span style="color: #666;">${stop.country}</span>` : ""}
          ${!isWaypoint && stop.nights ? `<br><span style="color: #666;">${stop.nights} night${stop.nights > 1 ? "s" : ""}</span>` : ""}
          ${stop.notes ? `<br><span style="color: #888; font-size: 11px;">${stop.notes.split('.')[0]}</span>` : ""}
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([stop.location.lng, stop.location.lat])
        .setPopup(popup)
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
    map.current.fitBounds(bounds, { padding: 50 });

    // Campsite option markers — DOM markers (purple/pink dots)
    if (options && options.length > 0) {
      options.forEach((opt) => {
        const el = document.createElement("div");
        const isBooked = !!opt.booked;
        const isRec = !!opt.rec;
        const markerColor = isBooked ? "#16a34a" : isRec ? "#eab308" : "#8b5cf6";
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
          ? `<span style="background:#16a34a;color:white;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:4px;font-weight:700">✓ BOOKED</span>`
          : "";
        const recBadge = !isBooked && isRec
          ? `<span style="background:#eab308;color:white;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:4px;font-weight:700">★ FAV</span>`
          : "";
        const bookingRefLine = isBooked && opt.bookingRef
          ? `<br><span style="color:#16a34a;font-size:11px;font-weight:600">Ref: ${opt.bookingRef}</span>`
          : "";

        const popup = new mapboxgl.Popup({ offset: 15, closeButton: true }).setHTML(`
          <div style="padding: 8px; max-width: 220px;">
            <strong>${opt.name}</strong>${bookedBadge}${recBadge}
            <br><span style="color: #666; font-size: 12px;">For: ${opt.stop}</span>
            <br><span style="color: #8b5cf6; font-size: 12px;">${opt.rating} · ${opt.price}</span>${bookingRefLine}
            <br><a href="${opt.url}" target="_blank" style="color: #3b82f6; font-size: 11px;">Website →</a>
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

        // Update each marker popup with coloured drive time to next stop
        markersRef.current.forEach((marker, i) => {
          const segment = route.segments[i];
          if (!segment) return;
          const stop = stops[i];
          const nextStop = stops[i + 1];
          const health = segmentHealth(segment.duration, maxDrivingMinutes);
          marker.getPopup()?.setHTML(`
            <div style="padding: 8px;">
              <strong>${stop.name}</strong>
              ${stop.country ? `<br><span style="color: #666;">${stop.country}</span>` : ""}
              ${stop.nights ? `<br><span style="color: #666;">${stop.nights} night${stop.nights > 1 ? "s" : ""}</span>` : ""}
              <br><span style="color: ${HEALTH_COLOURS[health]}; font-size: 12px;">→ ${nextStop.name}: ${formatDuration(segment.duration)} · ${formatDistance(segment.distance)}</span>
            </div>
          `);
        });

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
              "line-width": 4,
              "line-opacity": 0.85,
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

            const midpoint =
              geometry.coordinates.length >= 2
                ? segmentMidpoint(geometry)
                : geographicMidpoint(stops[i].location, stops[i + 1].location);

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
            "text-halo-color": "rgba(17,24,39,0.9)",
            "text-halo-width": 2.5,
          },
        });

        newSourceIds.push("segment-labels-src");
        newLayerIds.push("segment-labels");

        // Break stop markers at geographic midpoints — visible at zoom >= 7
        const breakFeatures: GeoJSON.Feature<GeoJSON.Point>[] = stops
          .slice(0, -1)
          .map((stop, i) => ({
            type: "Feature",
            properties: {
              label: `Approx. halfway between ${stop.name} and ${stops[i + 1].name}`,
            },
            geometry: {
              type: "Point",
              coordinates: geographicMidpoint(stop.location, stops[i + 1].location),
            },
          }));

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
            "circle-color": "#f59e0b",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.85,
          },
        });

        map.current!.on("click", "break-stops", (e) => {
          if (!e.features?.[0] || !map.current) return;
          const label = e.features[0].properties?.label as string;
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="padding: 8px;"><strong>Suggested break</strong><br><span style="color: #666; font-size: 12px;">${label}</span></div>`,
            )
            .addTo(map.current);
        });

        map.current!.on("mouseenter", "break-stops", () => {
          if (map.current) map.current.getCanvas().style.cursor = "pointer";
        });

        map.current!.on("mouseleave", "break-stops", () => {
          if (map.current) map.current.getCanvas().style.cursor = "";
        });

        newSourceIds.push("break-stops-src");
        newLayerIds.push("break-stops");

        routeLayerIdsRef.current = newLayerIds;
        routeSourceIdsRef.current = newSourceIds;
      });
    }

    return () => { stale = true; };
  }, [stops, options, isLoaded, onRouteCalculated, maxDrivingMinutes, returnFromSegment]);

  return (
    <div
      ref={mapContainer}
      className={className}
      style={{ width: "100%", height: "100%", minHeight: "400px" }}
    />
  );
});
