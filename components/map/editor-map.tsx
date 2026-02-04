"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import {
  MAPBOX_TOKEN,
  DEFAULT_MAP_STYLE,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from "@/lib/mapbox/config";
import { getRoute, type RouteResult } from "@/lib/mapbox/directions";
import { reverseGeocode, type GeocodingResult } from "@/lib/mapbox/geocoding";
import { MapLocationPopup } from "./map-location-popup";
import type { EditorStop, StopDuration } from "@/lib/types";

interface DayOption {
  dayNumber: number;
  label: string;
}

interface EditorMapProps {
  stops: EditorStop[];
  selectedStopId?: string | null;
  onStopSelect?: (id: string) => void;
  onRouteCalculated?: (route: RouteResult) => void;
  onAddFromMap?: (
    location: GeocodingResult,
    stopType: StopDuration,
    dayNumber: number,
  ) => void;
  dayOptions?: DayOption[];
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

export function EditorMap({
  stops,
  selectedStopId,
  onStopSelect,
  onRouteCalculated,
  onAddFromMap,
  dayOptions = [{ dayNumber: 1, label: "Day 1" }],
  className,
}: EditorMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const isLoadedRef = useRef(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Handle map click to show location popup
  const handleMapClick = useCallback(
    async (e: mapboxgl.MapMouseEvent) => {
      if (!map.current || !onAddFromMap) return;

      // Close any existing popup
      popupRef.current?.remove();

      const { lng, lat } = e.lngLat;
      setIsLoadingLocation(true);

      try {
        const location = await reverseGeocode(lng, lat);
        if (!location) {
          setIsLoadingLocation(false);
          return;
        }

        // Create popup container
        const popupContainer = document.createElement("div");

        // Create the popup
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          maxWidth: "none",
          className: "map-location-popup",
        })
          .setLngLat([lng, lat])
          .setDOMContent(popupContainer)
          .addTo(map.current);

        popupRef.current = popup;

        // Render React component into popup
        const root = createRoot(popupContainer);
        root.render(
          <MapLocationPopup
            location={location}
            dayOptions={dayOptions}
            onAdd={(loc, stopType, dayNumber) => {
              onAddFromMap(loc, stopType, dayNumber);
              popup.remove();
            }}
            onClose={() => popup.remove()}
          />,
        );
      } catch (error) {
        console.error("Error getting location:", error);
      } finally {
        setIsLoadingLocation(false);
      }
    },
    [onAddFromMap, dayOptions],
  );

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
      isLoadedRef.current = true;
    });

    return () => {
      popupRef.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add click handler for map
  useEffect(() => {
    if (!map.current) return;

    const clickHandler = (e: mapboxgl.MapMouseEvent) => handleMapClick(e);
    map.current.on("click", clickHandler);

    return () => {
      map.current?.off("click", clickHandler);
    };
  }, [handleMapClick]);

  // Update markers when stops change
  useEffect(() => {
    if (!map.current || !isLoadedRef.current) return;

    // Remove markers that no longer exist
    markersRef.current.forEach((marker, id) => {
      if (!stops.find((s) => s.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers
    stops.forEach((stop, index) => {
      let marker = markersRef.current.get(stop.id);

      if (!marker) {
        const el = document.createElement("div");
        el.className = "editor-stop-marker";

        marker = new mapboxgl.Marker(el)
          .setLngLat(stop.coordinates)
          .addTo(map.current!);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onStopSelect?.(stop.id);
        });

        markersRef.current.set(stop.id, marker);
      } else {
        marker.setLngLat(stop.coordinates);
      }

      // Update marker appearance
      const el = marker.getElement();
      const isSelected = stop.id === selectedStopId;
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background-color: ${STOP_TYPE_COLOURS[stop.type] || "#6b7280"};
        border: 3px solid ${isSelected ? "#000" : "white"};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        transform: scale(${isSelected ? 1.2 : 1});
        transition: transform 0.15s ease;
      `;
      el.textContent = String(index + 1);
    });

    // Fit bounds if we have stops
    if (stops.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      stops.forEach((stop) => {
        bounds.extend(stop.coordinates);
      });
      map.current.fitBounds(bounds, { padding: 80, maxZoom: 10 });
    }
  }, [stops, selectedStopId, onStopSelect]);

  // Draw route line
  useEffect(() => {
    if (!map.current || !isLoadedRef.current) return;

    // Remove existing route
    if (map.current.getLayer("route")) {
      map.current.removeLayer("route");
    }
    if (map.current.getSource("route")) {
      map.current.removeSource("route");
    }

    if (stops.length < 2) return;

    const stopsForRoute = stops.map((s) => ({
      name: s.name,
      location: {
        lat: s.coordinates[1],
        lng: s.coordinates[0],
        _type: "geopoint" as const,
      },
    }));

    getRoute(stopsForRoute).then((route) => {
      if (!route || !map.current) return;

      onRouteCalculated?.(route);

      map.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: route.fullRoute,
        },
      });

      map.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 4,
          "line-opacity": 0.8,
        },
      });
    });
  }, [stops, onRouteCalculated]);

  return (
    <div
      ref={mapContainer}
      className={className}
      style={{ width: "100%", height: "100%", minHeight: "400px" }}
    />
  );
}
