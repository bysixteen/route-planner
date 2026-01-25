import Link from "next/link";

import { client, isSanityConfigured } from "@/lib/sanity/client";
import { allTripsQuery } from "@/lib/sanity/queries";
import { TripCard } from "@/components/trip/trip-card";
import { Button } from "@/components/ui/button";
import type { TripListItem } from "@/lib/sanity/types";

export const revalidate = 60;

export default async function HomePage() {
  let trips: TripListItem[] = [];

  if (isSanityConfigured) {
    try {
      trips = await client.fetch<TripListItem[]>(allTripsQuery);
    } catch (error) {
      console.error("Error fetching trips:", error);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Route Planner</h1>
          <nav className="flex gap-2">
            <Link href="/studio">
              <Button variant="outline" size="sm">
                Studio
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Your Trips</h2>
          <p className="mt-2 text-muted-foreground">
            Plan your road trips, track your journey, and share your adventures.
          </p>
        </div>

        {!isSanityConfigured ? (
          <div className="rounded-lg border border-dashed border-yellow-300 bg-yellow-50 p-12 text-center">
            <h3 className="text-lg font-semibold text-yellow-800">
              Setup Required
            </h3>
            <p className="mt-2 text-yellow-700">
              Please configure your Sanity project ID in{" "}
              <code className="rounded bg-yellow-100 px-1">.env.local</code>
            </p>
            <pre className="mt-4 rounded bg-yellow-100 p-4 text-left text-sm text-yellow-800">
              {`NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token`}
            </pre>
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <h3 className="text-lg font-semibold">No trips yet</h3>
            <p className="mt-2 text-muted-foreground">
              Head to the{" "}
              <Link href="/studio" className="text-primary underline">
                Studio
              </Link>{" "}
              to create your first trip.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip._id} trip={trip} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>Route Planner — Plan, travel, share.</p>
      </footer>
    </div>
  );
}
