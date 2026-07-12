"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getAllTrips } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TripListItem {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "planning" | "booked" | "in-progress" | "completed";
  stops: Array<{ count: number }>;
  vehicles: {
    name: string;
    make: string | null;
    model: string | null;
  } | null;
}

const STATUS_COLOURS: Record<string, string> = {
  planning: "bg-yellow-100 text-yellow-800",
  booked: "bg-blue-100 text-blue-800",
  "in-progress": "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function TripCard({ trip }: { trip: TripListItem }) {
  const days =
    trip.start_date && trip.end_date
      ? calculateDays(trip.start_date, trip.end_date)
      : null;

  return (
    <Link href={`/trip/${trip.id}`}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-lg">{trip.title}</CardTitle>
            <Badge className={STATUS_COLOURS[trip.status]} variant="secondary">
              {trip.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            {trip.start_date && trip.end_date && (
              <p>
                {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
              </p>
            )}
            <div className="flex gap-4">
              {days && <span>{days} days</span>}
              <span>{trip.stops?.[0]?.count || 0} stops</span>
            </div>
            {trip.vehicles && (
              <p className="text-xs">
                {trip.vehicles.name}
                {trip.vehicles.make && trip.vehicles.model && (
                  <span className="text-muted-foreground/70">
                    {" "}
                    • {trip.vehicles.make} {trip.vehicles.model}
                  </span>
                )}
              </p>
            )}
            {trip.description && (
              <p className="line-clamp-2 pt-1">{trip.description}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function HomePage() {
  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrips() {
      try {
        const data = await getAllTrips();
        setTrips(data as TripListItem[]);
      } catch (err) {
        console.error("Error fetching trips:", err);
        setError("Failed to load trips");
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:py-4">
          <h1 className="text-lg font-bold sm:text-xl">Route Planner</h1>
          <nav className="flex gap-2">
            <Link href="/plan">
              <Button className="min-h-11">Plan a Trip</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Your Trips</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Plan your road trips, track your journey, and share your adventures.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
            {error}
          </div>
        ) : loading ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading trips...
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center sm:p-12">
            <h3 className="text-lg font-semibold">No trips yet</h3>
            <p className="mt-2 text-muted-foreground">
              Start planning your first adventure
            </p>
            <Link href="/plan" className="mt-4 inline-block">
              <Button className="min-h-11">Plan a Trip</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
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
