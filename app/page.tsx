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

  useEffect(() => {
    async function fetchTrips() {
      try {
        const data = await getAllTrips();
        setTrips(data as TripListItem[]);
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Route Planner</h1>
          <nav className="flex gap-2">
            <Link href="/plan">
              <Button size="sm">Plan a Trip</Button>
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

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading trips...
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <h3 className="text-lg font-semibold">No trips yet</h3>
            <p className="mt-2 text-muted-foreground">
              Start planning your first adventure
            </p>
            <Link href="/plan" className="mt-4 inline-block">
              <Button>Plan a Trip</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
