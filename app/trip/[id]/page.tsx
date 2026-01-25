'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import { getTripById, deleteTrip } from '@/lib/supabase/queries'
import { TripMap } from '@/components/map/trip-map'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  formatDistance,
  formatDuration,
  type RouteResult,
} from '@/lib/mapbox/directions'
import type { Stop } from '@/lib/sanity/types'

interface SupabaseTrip {
  id: string
  title: string
  slug: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  status: 'planning' | 'booked' | 'in-progress' | 'completed'
  max_driving_minutes: number
  vehicles: {
    name: string
    make: string | null
    model: string | null
  } | null
  stops: Array<{
    id: string
    name: string
    full_name: string | null
    lat: number
    lng: number
    country: string | null
    type: 'campsite' | 'city' | 'attraction' | 'rest' | 'event' | 'transport'
    arrival_date: string | null
    departure_date: string | null
    nights: number
    notes: string | null
    position: number
  }>
}

const STATUS_COLOURS: Record<string, string> = {
  planning: 'bg-yellow-100 text-yellow-800',
  booked: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
}

const TYPE_COLOURS: Record<string, string> = {
  campsite: 'bg-green-100 text-green-800',
  city: 'bg-blue-100 text-blue-800',
  attraction: 'bg-amber-100 text-amber-800',
  rest: 'bg-violet-100 text-violet-800',
  event: 'bg-red-100 text-red-800',
  transport: 'bg-cyan-100 text-cyan-800',
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Convert Supabase stops to the format expected by TripMap
function convertStopsForMap(stops: SupabaseTrip['stops']): Stop[] {
  return stops
    .sort((a, b) => a.position - b.position)
    .map((stop) => ({
      _id: stop.id,
      name: stop.name,
      type: stop.type,
      location: {
        _type: 'geopoint' as const,
        lat: stop.lat,
        lng: stop.lng,
      },
      country: stop.country || undefined,
      arrivalDate: stop.arrival_date || undefined,
      departureDate: stop.departure_date || undefined,
      nights: stop.nights,
      notes: stop.notes || undefined,
    }))
}

export default function TripPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [trip, setTrip] = useState<SupabaseTrip | null>(null)
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchTrip() {
      try {
        const data = await getTripById(tripId)
        setTrip(data as SupabaseTrip)
      } catch (error) {
        console.error('Error fetching trip:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrip()
  }, [tripId])

  const handleRouteCalculated = useCallback((calculatedRoute: RouteResult) => {
    setRoute(calculatedRoute)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this trip?')) return

    setDeleting(true)
    try {
      await deleteTrip(tripId)
      router.push('/')
    } catch (error) {
      console.error('Error deleting trip:', error)
      alert('Failed to delete trip.')
    } finally {
      setDeleting(false)
    }
  }, [tripId, router])

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

  const stops = convertStopsForMap(trip.stops)
  const sortedStops = trip.stops.sort((a, b) => a.position - b.position)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold hover:text-primary">
            Route Planner
          </Link>
          <nav className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Trip header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{trip.title}</h1>
            <Badge className={STATUS_COLOURS[trip.status]} variant="secondary">
              {trip.status}
            </Badge>
          </div>
          {(trip.start_date || trip.end_date) && (
            <p className="mt-1 text-lg text-muted-foreground">
              {formatDate(trip.start_date)}
              {trip.end_date && ` — ${formatDate(trip.end_date)}`}
            </p>
          )}
          {trip.vehicles && (
            <p className="mt-1 text-sm text-muted-foreground">
              {trip.vehicles.name}
              {trip.vehicles.make &&
                trip.vehicles.model &&
                ` — ${trip.vehicles.make} ${trip.vehicles.model}`}
            </p>
          )}
          {trip.description && (
            <p className="mt-3 text-muted-foreground">{trip.description}</p>
          )}
        </div>

        {/* Stats */}
        {route && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Distance</p>
                <p className="mt-1 font-semibold">
                  {formatDistance(route.totalDistance)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Driving Time</p>
                <p className="mt-1 font-semibold">
                  {formatDuration(route.totalDuration)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Stops</p>
                <p className="mt-1 font-semibold">{trip.stops.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Countries</p>
                <p className="mt-1 font-semibold">
                  {new Set(trip.stops.map((s) => s.country).filter(Boolean)).size}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Map and stops */}
        <Tabs defaultValue="both" className="w-full">
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
            <div className="space-y-3">
              {sortedStops.map((stop, index) => (
                <Card key={stop.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{stop.name}</h3>
                        <Badge
                          className={TYPE_COLOURS[stop.type]}
                          variant="secondary"
                        >
                          {stop.type}
                        </Badge>
                      </div>
                      {stop.country && (
                        <p className="text-sm text-muted-foreground">
                          {stop.country}
                        </p>
                      )}
                      {stop.notes && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {stop.notes}
                        </p>
                      )}
                    </div>
                    {stop.nights > 0 && (
                      <div className="text-right text-sm text-muted-foreground">
                        {stop.nights} night{stop.nights > 1 ? 's' : ''}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="both">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-[500px] overflow-hidden rounded-lg border">
                <TripMap stops={stops} onRouteCalculated={handleRouteCalculated} />
              </div>
              <div className="max-h-[500px] space-y-3 overflow-y-auto">
                {sortedStops.map((stop, index) => (
                  <Card key={stop.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{stop.name}</h3>
                          <Badge
                            className={TYPE_COLOURS[stop.type]}
                            variant="secondary"
                          >
                            {stop.type}
                          </Badge>
                        </div>
                        {stop.country && (
                          <p className="text-sm text-muted-foreground">
                            {stop.country}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
