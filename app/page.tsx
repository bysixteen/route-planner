"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getAllTrips } from "@/lib/supabase/queries";
import { PwaInstall } from "@/components/pwa-install";
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

function statusVariant(
  status: TripListItem["status"],
): "booked" | "highlight" | "secondary" {
  if (status === "booked") return "booked";
  if (status === "in-progress") return "highlight";
  return "secondary";
}

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
      <Card className="h-full transition-colors hover:border-highlight/40">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-display line-clamp-1 text-lg tracking-tight">
              {trip.title}
            </CardTitle>
            <Badge variant={statusVariant(trip.status)} className="capitalize">
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
              {days != null && (
                <span>
                  {days} day{days === 1 ? "" : "s"}
                </span>
              )}
              <span>
                {trip.stops?.[0]?.count || 0}{" "}
                {(trip.stops?.[0]?.count || 0) === 1 ? "stop" : "stops"}
              </span>
            </div>
            {trip.vehicles && (
              <p className="text-xs">
                {trip.vehicles.name}
                {trip.vehicles.make && trip.vehicles.model && (
                  <span className="text-muted-foreground">
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
      <header className="border-b border-white/5 pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-tight hover:text-foreground/80"
          >
            Route Planner
          </Link>
          <nav className="flex items-center gap-3">
            <PwaInstall />
            <Link href="/plan">
              <Button size="sm">Plan a Trip</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Contour hero — the one place the cartographic motif runs full-bleed */}
        <div className="bg-contour relative mb-8 overflow-hidden rounded-xl border p-6 sm:p-8">
          <span className="coordinate absolute right-4 top-3 hidden text-[11px] text-foreground/50 sm:block">
            N 51°30.000&apos; · E 000°07.000&apos;
          </span>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Your Trips
          </h2>
          <p className="mt-2 max-w-md text-sm text-foreground/70">
            Plan your road trips, track your journey, and share your adventures.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive">
            {error}
          </div>
        ) : loading ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading trips…
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-contour rounded-lg border border-dashed p-12 text-center">
            <h3 className="font-display text-lg font-semibold">No trips yet</h3>
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
    </div>
  );
}
