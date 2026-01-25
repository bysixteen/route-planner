'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { client } from '@/lib/sanity/client'
import { tripBySlugQuery } from '@/lib/sanity/queries'
import { TripMap } from '@/components/map/trip-map'
import { StopList } from '@/components/trip/stop-list'
import { TripStats } from '@/components/trip/trip-stats'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Trip } from '@/lib/sanity/types'
import type { RouteResult } from '@/lib/mapbox/directions'

const STATUS_COLOURS: Record<string, string> = {
  planning: 'bg-yellow-100 text-yellow-800',
  booked: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const startStr = start.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  })
  const endStr = end.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return `${startStr} — ${endStr}`
}

export default function TripPage() {
  const params = useParams()
  const slug = params.slug as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrip() {
      try {
        const data = await client.fetch<Trip>(tripBySlugQuery, { slug })
        setTrip(data)
      } catch (error) {
        console.error('Error fetching trip:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrip()
  }, [slug])

  const handleRouteCalculated = useCallback((calculatedRoute: RouteResult) => {
    setRoute(calculatedRoute)
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading trip...</p>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Trip not found</h1>
        <Link href="/">
          <Button>Back to trips</Button>
        </Link>
      </div>
    )
  }

  const stops = trip.stops || []

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold hover:text-primary">
            Route Planner
          </Link>
          <nav className="flex gap-2">
            <Link href={`/trips/${slug}/export`}>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </Link>
            <Link href="/studio">
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Trip header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{trip.title}</h1>
            <Badge className={STATUS_COLOURS[trip.status] || ''} variant="secondary">
              {trip.status}
            </Badge>
          </div>
          <p className="mt-1 text-lg text-muted-foreground">
            {formatDateRange(trip.startDate, trip.endDate)}
          </p>
          {trip.vehicle && (
            <p className="mt-1 text-sm text-muted-foreground">
              {trip.vehicle.name}
              {trip.vehicle.make &&
                trip.vehicle.model &&
                ` — ${trip.vehicle.make} ${trip.vehicle.model}`}
            </p>
          )}
          {trip.description && (
            <p className="mt-3 text-muted-foreground">{trip.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6">
          <TripStats
            stops={stops}
            route={route}
            startDate={trip.startDate}
            endDate={trip.endDate}
          />
        </div>

        {/* Map and stops */}
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="stops">Stops ({stops.length})</TabsTrigger>
            <TabsTrigger value="both">Both</TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <div className="h-[600px] overflow-hidden rounded-lg border">
              <TripMap stops={stops} onRouteCalculated={handleRouteCalculated} />
            </div>
          </TabsContent>

          <TabsContent value="stops">
            <StopList
              stops={stops}
              route={route}
              maxDrivingMinutes={trip.maxDrivingMinutes}
            />
          </TabsContent>

          <TabsContent value="both">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-[500px] overflow-hidden rounded-lg border">
                <TripMap stops={stops} onRouteCalculated={handleRouteCalculated} />
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                <StopList
                  stops={stops}
                  route={route}
                  maxDrivingMinutes={trip.maxDrivingMinutes}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
