import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TripListItem } from "@/lib/types";

interface TripCardProps {
  trip: TripListItem;
}

const STATUS_COLOURS: Record<string, string> = {
  planning: "bg-yellow-500/15 text-yellow-300 border border-yellow-500/20",
  booked: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  "in-progress": "bg-green-500/15 text-green-300 border border-green-500/20",
  completed: "bg-zinc-500/15 text-zinc-300 border border-zinc-500/20",
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

export function TripCard({ trip }: TripCardProps) {
  const days = calculateDays(trip.startDate, trip.endDate);

  return (
    <Link href={`/trips/${trip.slug.current}`}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-lg">{trip.title}</CardTitle>
            <Badge
              className={STATUS_COLOURS[trip.status] || ""}
              variant="secondary"
            >
              {trip.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
            </p>
            <div className="flex gap-4">
              <span>{days} days</span>
              <span>{trip.stopCount} stops</span>
            </div>
            {trip.vehicle && (
              <p className="text-xs">
                {trip.vehicle.name}
                {trip.vehicle.make && trip.vehicle.model && (
                  <span className="text-muted-foreground/70">
                    {" "}
                    • {trip.vehicle.make} {trip.vehicle.model}
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
