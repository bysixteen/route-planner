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

// Editor types (for the trip planner UI)
export interface EditorStop {
  id: string;
  name: string;
  fullName: string;
  coordinates: [number, number]; // [lng, lat]
  country?: string;
  type: StopType;
  nights?: number;
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
): EditorStop {
  return {
    id: crypto.randomUUID(),
    name,
    fullName,
    coordinates,
    country,
    type: "city",
    nights: 1,
  };
}
