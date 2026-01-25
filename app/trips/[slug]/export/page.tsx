'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toPng } from 'html-to-image'

import { client } from '@/lib/sanity/client'
import { tripBySlugQuery } from '@/lib/sanity/queries'
import { getRoute, type RouteResult } from '@/lib/mapbox/directions'
import { ExportPreview } from '@/components/export/export-preview'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Trip } from '@/lib/sanity/types'

type ExportFormat = 'story' | 'square' | 'wide'

const FORMAT_LABELS: Record<ExportFormat, string> = {
  story: 'Instagram Story (1080×1920)',
  square: 'Square Post (1080×1080)',
  wide: 'Social Banner (1200×630)',
}

const FORMAT_DIMENSIONS: Record<ExportFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  wide: { width: 1200, height: 630 },
}

export default function ExportPage() {
  const params = useParams()
  const slug = params.slug as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [format, setFormat] = useState<ExportFormat>('story')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchTrip() {
      try {
        const data = await client.fetch<Trip>(tripBySlugQuery, { slug })
        setTrip(data)

        // Calculate route if we have stops
        if (data?.stops && data.stops.length >= 2) {
          const stopsForRoute = data.stops.map((s) => ({
            name: s.name,
            location: s.location,
          }))
          const calculatedRoute = await getRoute(stopsForRoute)
          setRoute(calculatedRoute)
        }
      } catch (error) {
        console.error('Error fetching trip:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrip()
  }, [slug])

  const handleExport = useCallback(async () => {
    if (!previewRef.current) return

    setExporting(true)

    try {
      // Find the actual content div (the scaled one inside the container)
      const contentDiv = previewRef.current

      // Get the unscaled dimensions
      const dimensions = FORMAT_DIMENSIONS[format]

      const dataUrl = await toPng(contentDiv, {
        width: dimensions.width,
        height: dimensions.height,
        pixelRatio: 1,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      })

      // Download the image
      const link = document.createElement('a')
      link.download = `${trip?.title.toLowerCase().replace(/\s+/g, '-')}-${format}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error exporting:', error)
    } finally {
      setExporting(false)
    }
  }, [format, trip?.title])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
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
            <Link href={`/trips/${slug}`}>
              <Button variant="outline" size="sm">
                Back to Trip
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Export: {trip.title}</h1>
          <p className="mt-2 text-muted-foreground">
            Generate shareable graphics for social media
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,auto]">
          {/* Controls */}
          <div className="space-y-6">
            <div>
              <h2 className="mb-3 font-semibold">Format</h2>
              <Tabs
                value={format}
                onValueChange={(v) => setFormat(v as ExportFormat)}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="story">Story</TabsTrigger>
                  <TabsTrigger value="square">Square</TabsTrigger>
                  <TabsTrigger value="wide">Wide</TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="mt-2 text-sm text-muted-foreground">
                {FORMAT_LABELS[format]}
              </p>
            </div>

            <div>
              <h2 className="mb-3 font-semibold">Preview</h2>
              <p className="text-sm text-muted-foreground">
                This is a scaled preview. The exported image will be full
                resolution.
              </p>
            </div>

            <Button
              onClick={handleExport}
              disabled={exporting}
              className="w-full"
              size="lg"
            >
              {exporting ? 'Exporting...' : 'Download PNG'}
            </Button>

            <div className="rounded-lg bg-muted p-4 text-sm">
              <h3 className="font-semibold">Coming soon</h3>
              <ul className="mt-2 list-inside list-disc text-muted-foreground">
                <li>Custom colour themes</li>
                <li>Add your own photos</li>
                <li>Include map snapshot</li>
                <li>Multiple page carousel</li>
              </ul>
            </div>
          </div>

          {/* Preview */}
          <div className="flex justify-center">
            <ExportPreview
              ref={previewRef}
              trip={trip}
              stops={stops}
              route={route}
              format={format}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
