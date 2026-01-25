'use client'

import { forwardRef } from 'react'

import { formatDistance, formatDuration, type RouteResult } from '@/lib/mapbox/directions'
import type { Trip, Stop } from '@/lib/sanity/types'

interface ExportPreviewProps {
  trip: Trip
  stops: Stop[]
  route?: RouteResult | null
  format: 'story' | 'square' | 'wide'
}

function getUniqueCountries(stops: Stop[]): string[] {
  const countries = stops
    .map((s) => s.country)
    .filter((c): c is string => Boolean(c))
  return [...new Set(countries)]
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const startStr = start.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
  const endStr = end.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return `${startStr} — ${endStr}`
}

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const FORMAT_DIMENSIONS = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  wide: { width: 1200, height: 630 },
}

export const ExportPreview = forwardRef<HTMLDivElement, ExportPreviewProps>(
  function ExportPreview({ trip, stops, route, format }, ref) {
    const dimensions = FORMAT_DIMENSIONS[format]
    const countries = getUniqueCountries(stops)
    const days = calculateDays(trip.startDate, trip.endDate)

    // Scale factor for preview (show at smaller size in browser)
    const scale = format === 'story' ? 0.35 : format === 'square' ? 0.45 : 0.5

    return (
      <div
        className="overflow-hidden rounded-lg shadow-lg"
        style={{
          width: dimensions.width * scale,
          height: dimensions.height * scale,
        }}
      >
        <div
          ref={ref}
          style={{
            width: dimensions.width,
            height: dimensions.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            padding: format === 'story' ? '80px' : format === 'square' ? '60px' : '40px',
          }}
        >
          {/* Header */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: format === 'story' ? '60px' : '40px',
            }}
          >
            <p
              style={{
                fontSize: format === 'story' ? '24px' : '18px',
                opacity: 0.8,
                textTransform: 'uppercase',
                letterSpacing: '4px',
                marginBottom: '16px',
              }}
            >
              Road Trip
            </p>
            <h1
              style={{
                fontSize: format === 'story' ? '64px' : format === 'square' ? '48px' : '42px',
                fontWeight: 'bold',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {trip.title}
            </h1>
          </div>

          {/* Route visualisation placeholder */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: format === 'story' ? '20px' : '12px',
            }}
          >
            {stops.map((stop, index) => (
              <div
                key={stop._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: format === 'story' ? '48px' : '36px',
                    height: format === 'story' ? '48px' : '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: format === 'story' ? '20px' : '16px',
                  }}
                >
                  {index + 1}
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: format === 'story' ? '28px' : '20px',
                      fontWeight: 600,
                    }}
                  >
                    {stop.name}
                  </p>
                  {stop.country && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: format === 'story' ? '18px' : '14px',
                        opacity: 0.7,
                      }}
                    >
                      {stop.country}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Stats footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: format === 'story' ? '48px' : '32px',
              paddingTop: format === 'story' ? '60px' : '40px',
              borderTop: '1px solid rgba(255,255,255,0.2)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: format === 'story' ? '36px' : '28px',
                  fontWeight: 'bold',
                }}
              >
                {route ? formatDistance(route.totalDistance) : '—'}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: format === 'story' ? '16px' : '12px',
                  opacity: 0.7,
                  textTransform: 'uppercase',
                }}
              >
                Distance
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: format === 'story' ? '36px' : '28px',
                  fontWeight: 'bold',
                }}
              >
                {route ? formatDuration(route.totalDuration) : '—'}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: format === 'story' ? '16px' : '12px',
                  opacity: 0.7,
                  textTransform: 'uppercase',
                }}
              >
                Driving
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: format === 'story' ? '36px' : '28px',
                  fontWeight: 'bold',
                }}
              >
                {days}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: format === 'story' ? '16px' : '12px',
                  opacity: 0.7,
                  textTransform: 'uppercase',
                }}
              >
                Days
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: format === 'story' ? '36px' : '28px',
                  fontWeight: 'bold',
                }}
              >
                {countries.length}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: format === 'story' ? '16px' : '12px',
                  opacity: 0.7,
                  textTransform: 'uppercase',
                }}
              >
                Countries
              </p>
            </div>
          </div>

          {/* Date */}
          <p
            style={{
              textAlign: 'center',
              marginTop: format === 'story' ? '40px' : '24px',
              fontSize: format === 'story' ? '20px' : '16px',
              opacity: 0.6,
            }}
          >
            {formatDateRange(trip.startDate, trip.endDate)}
          </p>

          {/* Vehicle */}
          {trip.vehicle && (
            <p
              style={{
                textAlign: 'center',
                marginTop: '8px',
                fontSize: format === 'story' ? '18px' : '14px',
                opacity: 0.5,
              }}
            >
              {trip.vehicle.name}
            </p>
          )}
        </div>
      </div>
    )
  }
)
