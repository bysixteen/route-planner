'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import {
  MAPBOX_TOKEN,
  DEFAULT_MAP_STYLE,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from '@/lib/mapbox/config'
import { getRoute, type RouteResult } from '@/lib/mapbox/directions'
import type { Stop } from '@/lib/sanity/types'

interface TripMapProps {
  stops: Stop[]
  onRouteCalculated?: (route: RouteResult) => void
  className?: string
}

const STOP_TYPE_COLOURS: Record<string, string> = {
  campsite: '#22c55e', // green
  city: '#3b82f6', // blue
  attraction: '#f59e0b', // amber
  rest: '#8b5cf6', // violet
  event: '#ef4444', // red
  transport: '#06b6d4', // cyan
}

export function TripMap({ stops, onRouteCalculated, className }: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialise map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: DEFAULT_MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.current.on('load', () => {
      setIsLoaded(true)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update markers and route when stops change
  useEffect(() => {
    if (!map.current || !isLoaded) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Remove existing route layer
    if (map.current.getLayer('route')) {
      map.current.removeLayer('route')
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route')
    }

    if (stops.length === 0) return

    // Add markers for each stop
    stops.forEach((stop, index) => {
      const el = document.createElement('div')
      el.className = 'stop-marker'
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background-color: ${STOP_TYPE_COLOURS[stop.type] || '#6b7280'};
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
      `
      el.textContent = String(index + 1)

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <strong>${stop.name}</strong>
          ${stop.country ? `<br><span style="color: #666;">${stop.country}</span>` : ''}
          ${stop.nights ? `<br><span style="color: #666;">${stop.nights} night${stop.nights > 1 ? 's' : ''}</span>` : ''}
        </div>
      `)

      const marker = new mapboxgl.Marker(el)
        .setLngLat([stop.location.lng, stop.location.lat])
        .setPopup(popup)
        .addTo(map.current!)

      markersRef.current.push(marker)
    })

    // Fit map to show all stops
    if (stops.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      stops.forEach((stop) => {
        bounds.extend([stop.location.lng, stop.location.lat])
      })
      map.current.fitBounds(bounds, { padding: 50 })
    }

    // Fetch and draw route if more than one stop
    if (stops.length >= 2) {
      const stopsForRoute = stops.map((s) => ({
        name: s.name,
        location: s.location,
      }))

      getRoute(stopsForRoute).then((route) => {
        if (!route || !map.current) return

        onRouteCalculated?.(route)

        // Add route line
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.fullRoute,
          },
        })

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 4,
            'line-opacity': 0.8,
          },
        })
      })
    }
  }, [stops, isLoaded, onRouteCalculated])

  return (
    <div
      ref={mapContainer}
      className={className}
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
    />
  )
}
