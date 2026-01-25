import { Card, CardContent } from "@/components/ui/card";
import {
  formatDistance,
  formatDuration,
  type RouteResult,
} from "@/lib/mapbox/directions";
import type { Stop } from "@/lib/types";

interface TripStatsProps {
  stops: Stop[];
  route?: RouteResult | null;
  startDate: string;
  endDate: string;
}

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getUniqueCountries(stops: Stop[]): string[] {
  const countries = stops
    .map((s) => s.country)
    .filter((c): c is string => Boolean(c));
  return [...new Set(countries)];
}

function getTotalCost(stops: Stop[]): {
  eur: number;
  gbp: number;
  other: number;
} {
  return stops.reduce(
    (acc, stop) => {
      if (!stop.cost) return acc;
      if (stop.currency === "EUR") acc.eur += stop.cost;
      else if (stop.currency === "GBP") acc.gbp += stop.cost;
      else acc.other += stop.cost;
      return acc;
    },
    { eur: 0, gbp: 0, other: 0 },
  );
}

function getTotalNights(stops: Stop[]): number {
  return stops.reduce((acc, stop) => acc + (stop.nights || 0), 0);
}

export function TripStats({
  stops,
  route,
  startDate,
  endDate,
}: TripStatsProps) {
  const days = calculateDays(startDate, endDate);
  const countries = getUniqueCountries(stops);
  const costs = getTotalCost(stops);
  const nights = getTotalNights(stops);

  const stats = [
    {
      label: "Total Distance",
      value: route ? formatDistance(route.totalDistance) : "—",
    },
    {
      label: "Driving Time",
      value: route ? formatDuration(route.totalDuration) : "—",
    },
    {
      label: "Duration",
      value: `${days} days`,
    },
    {
      label: "Stops",
      value: String(stops.length),
    },
    {
      label: "Nights",
      value: String(nights),
    },
    {
      label: "Countries",
      value: countries.length > 0 ? countries.join(", ") : "—",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 font-semibold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}

      {/* Cost breakdown if any costs recorded */}
      {(costs.eur > 0 || costs.gbp > 0) && (
        <Card className="col-span-2 sm:col-span-3 lg:col-span-6">
          <CardContent className="flex flex-wrap gap-4 p-3">
            <span className="text-xs text-muted-foreground">
              Accommodation Costs:
            </span>
            {costs.gbp > 0 && (
              <span className="text-sm font-medium">£{costs.gbp}</span>
            )}
            {costs.eur > 0 && (
              <span className="text-sm font-medium">€{costs.eur}</span>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
