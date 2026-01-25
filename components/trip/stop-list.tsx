"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  formatDistance,
  formatDuration,
  exceedsMaxDriving,
  type RouteResult,
} from "@/lib/mapbox/directions";
import type { Stop } from "@/lib/types";

interface StopListProps {
  stops: Stop[];
  route?: RouteResult | null;
  maxDrivingMinutes?: number;
}

const STOP_TYPE_LABELS: Record<string, string> = {
  campsite: "Campsite",
  city: "City",
  attraction: "Attraction",
  rest: "Rest Stop",
  event: "Event",
  transport: "Ferry/Tunnel",
};

const STOP_TYPE_COLOURS: Record<string, string> = {
  campsite: "bg-green-100 text-green-800",
  city: "bg-blue-100 text-blue-800",
  attraction: "bg-amber-100 text-amber-800",
  rest: "bg-violet-100 text-violet-800",
  event: "bg-red-100 text-red-800",
  transport: "bg-cyan-100 text-cyan-800",
};

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function StopList({
  stops,
  route,
  maxDrivingMinutes = 240,
}: StopListProps) {
  return (
    <div className="space-y-4">
      {stops.map((stop, index) => {
        const segment = route?.segments[index - 1];
        const isOverLimit = segment
          ? exceedsMaxDriving(segment.duration, maxDrivingMinutes)
          : false;

        return (
          <div key={stop._id}>
            {/* Segment info between stops */}
            {index > 0 && segment && (
              <div className="mb-4 flex items-center gap-2 py-2 pl-4">
                <div className="h-8 w-0.5 bg-blue-200" />
                <div
                  className={`flex gap-3 text-sm ${isOverLimit ? "text-red-600 font-medium" : "text-muted-foreground"}`}
                >
                  <span>{formatDistance(segment.distance)}</span>
                  <span>•</span>
                  <span>{formatDuration(segment.duration)}</span>
                  {isOverLimit && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Exceeds {maxDrivingMinutes / 60}hr limit
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Stop card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Stop number */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                    {index + 1}
                  </div>

                  {/* Stop details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{stop.name}</h3>
                      <Badge
                        className={STOP_TYPE_COLOURS[stop.type] || ""}
                        variant="secondary"
                      >
                        {STOP_TYPE_LABELS[stop.type] || stop.type}
                      </Badge>
                    </div>

                    {stop.country && (
                      <p className="text-sm text-muted-foreground">
                        {stop.country}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {stop.arrivalDate && (
                        <span>Arrive: {formatDate(stop.arrivalDate)}</span>
                      )}
                      {stop.departureDate && (
                        <span>Depart: {formatDate(stop.departureDate)}</span>
                      )}
                      {stop.nights !== undefined && stop.nights > 0 && (
                        <span>
                          {stop.nights} night{stop.nights > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {stop.bookingReference && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Ref: {stop.bookingReference}
                      </p>
                    )}

                    {stop.notes && (
                      <>
                        <Separator className="my-2" />
                        <p className="text-sm text-muted-foreground">
                          {stop.notes}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Cost */}
                  {stop.cost !== undefined && stop.cost > 0 && (
                    <div className="text-right text-sm">
                      <span className="font-medium">
                        {stop.currency === "GBP" && "£"}
                        {stop.currency === "EUR" && "€"}
                        {stop.currency === "HUF" && "Ft "}
                        {stop.currency === "CHF" && "CHF "}
                        {stop.cost}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
