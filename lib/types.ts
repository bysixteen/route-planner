// Shared types for the route planner

export type StopType =
  | "campsite"
  | "city"
  | "attraction"
  | "rest"
  | "event"
  | "transport";

export interface Geopoint {
  _type: "geopoint";
  lat: number;
  lng: number;
  alt?: number;
}

export interface Stop {
  _id: string;
  name: string;
  type: StopType;
  location: Geopoint;
  address?: string;
  country?: string;
  arrivalDate?: string;
  departureDate?: string;
  nights?: number;
  bookingReference?: string;
  bookingUrl?: string;
  cost?: number;
  currency?: "EUR" | "GBP" | "HUF" | "CHF";
  amenities?: string[];
  notes?: string;
  photos?: Array<{
    caption?: string;
    takenAt?: string;
  }>;
}

export interface Vehicle {
  _id: string;
  name: string;
  make?: string;
  model?: string;
  type?: "campervan" | "motorhome" | "car" | "caravan";
  fuelType?: "petrol" | "diesel" | "electric" | "hybrid";
  fuelConsumption?: number;
}

export interface Trip {
  _id: string;
  title: string;
  slug: {
    _type: "slug";
    current: string;
  };
  description?: string;
  startDate: string;
  endDate: string;
  status: "planning" | "booked" | "in-progress" | "completed";
  maxDrivingMinutes: number;
  isPublic: boolean;
  vehicle?: Vehicle;
  stops?: Stop[];
  stopCount?: number;
}

export interface TripListItem {
  _id: string;
  title: string;
  slug: {
    _type: "slug";
    current: string;
  };
  description?: string;
  startDate: string;
  endDate: string;
  status: "planning" | "booked" | "in-progress" | "completed";
  maxDrivingMinutes: number;
  stopCount: number;
  vehicle?: {
    name: string;
    make?: string;
    model?: string;
  };
}

// Duration type for stops
export type StopDuration =
  | "drive-through" // Just passing through, no stop
  | "quick" // 15-30 min break
  | "short" // 1-2 hours (lunch, quick visit)
  | "half-day" // 3-5 hours (afternoon visit)
  | "overnight" // 1 night
  | "multi-night"; // 2+ nights

// Editor types (for the trip planner UI)
export interface EditorStop {
  id: string;
  name: string;
  fullName: string;
  coordinates: [number, number]; // [lng, lat]
  country?: string;
  type: StopType;
  duration: StopDuration;
  nights: number; // 0 for day stops, 1+ for overnight
  stayHours?: number; // For non-overnight stops (e.g., 2 hours)
  arrivalDate?: string;
  notes?: string;
}

export interface EditorTrip {
  id?: string;
  title: string;
  startDate?: string;
  endDate?: string;
  maxDrivingMinutes: number;
  stops: EditorStop[];
}

export function createEditorStop(
  name: string,
  fullName: string,
  coordinates: [number, number],
  country?: string,
  isStartPoint: boolean = false,
): EditorStop {
  return {
    id: crypto.randomUUID(),
    name,
    fullName,
    coordinates,
    country,
    type: isStartPoint ? "transport" : "city",
    duration: isStartPoint ? "drive-through" : "overnight",
    nights: isStartPoint ? 0 : 1,
  };
}

// Helper to get display text for duration
export function getDurationLabel(
  duration: StopDuration,
  nights: number,
  stayHours?: number,
): string {
  switch (duration) {
    case "drive-through":
      return "Drive through";
    case "quick":
      return "Quick stop";
    case "short":
      return stayHours ? `${stayHours}h stop` : "1-2h stop";
    case "half-day":
      return stayHours ? `${stayHours}h visit` : "Half day";
    case "overnight":
      return "1 night";
    case "multi-night":
      return `${nights} nights`;
    default:
      return "Stop";
  }
}

// Helper to get hours for a duration type
export function getDurationHours(
  duration: StopDuration,
  nights: number,
  stayHours?: number,
): number {
  switch (duration) {
    case "drive-through":
      return 0;
    case "quick":
      return 0.5;
    case "short":
      return stayHours || 2;
    case "half-day":
      return stayHours || 4;
    case "overnight":
      return 12; // Assume 12 hours for overnight
    case "multi-night":
      return nights * 24;
    default:
      return 0;
  }
}
