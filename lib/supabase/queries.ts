import { createClient } from "./client";
import type { EditorStop } from "@/lib/types";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getAllTrips() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("trips")
    .select(
      `
      *,
      stops(count),
      vehicles(name, make, model)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getTripBySlug(slug: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("trips")
    .select(
      `
      *,
      vehicles(*),
      stops(*)
    `,
    )
    .eq("slug", slug)
    .order("position", { referencedTable: "stops", ascending: true })
    .single();

  if (error) throw error;
  return data;
}

export async function getTripById(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("trips")
    .select(
      `
      *,
      vehicles(*),
      stops(*)
    `,
    )
    .eq("id", id)
    .order("position", { referencedTable: "stops", ascending: true })
    .single();

  if (error) throw error;
  return data;
}

export async function createTrip(
  title: string,
  stops: EditorStop[],
): Promise<string> {
  const supabase = createClient();
  const slug = generateSlug(title);

  // Create the trip
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      title,
      slug,
      status: "planning" as const,
    })
    .select()
    .single();

  if (tripError) throw tripError;

  // Create the stops
  if (stops.length > 0) {
    const stopsToInsert = stops.map((stop, index) => ({
      trip_id: trip.id,
      position: index,
      name: stop.name,
      full_name: stop.fullName,
      lat: stop.coordinates[1],
      lng: stop.coordinates[0],
      country: stop.country || null,
      type: stop.type as
        | "campsite"
        | "city"
        | "attraction"
        | "rest"
        | "event"
        | "transport",
      nights: stop.nights || 0,
      arrival_date: stop.arrivalDate || null,
      notes: stop.notes || null,
    }));

    const { error: stopsError } = await supabase
      .from("stops")
      .insert(stopsToInsert);

    if (stopsError) throw stopsError;
  }

  return trip.id;
}

export async function updateTrip(
  tripId: string,
  title: string,
  stops: EditorStop[],
): Promise<void> {
  const supabase = createClient();
  const slug = generateSlug(title);

  // Update the trip
  const { error: tripError } = await supabase
    .from("trips")
    .update({ title, slug })
    .eq("id", tripId);

  if (tripError) throw tripError;

  // Delete existing stops
  const { error: deleteError } = await supabase
    .from("stops")
    .delete()
    .eq("trip_id", tripId);

  if (deleteError) throw deleteError;

  // Insert new stops
  if (stops.length > 0) {
    const stopsToInsert = stops.map((stop, index) => ({
      trip_id: tripId,
      position: index,
      name: stop.name,
      full_name: stop.fullName,
      lat: stop.coordinates[1],
      lng: stop.coordinates[0],
      country: stop.country || null,
      type: stop.type as
        | "campsite"
        | "city"
        | "attraction"
        | "rest"
        | "event"
        | "transport",
      nights: stop.nights || 0,
      arrival_date: stop.arrivalDate || null,
      notes: stop.notes || null,
    }));

    const { error: stopsError } = await supabase
      .from("stops")
      .insert(stopsToInsert);

    if (stopsError) throw stopsError;
  }
}

export async function deleteTrip(tripId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("trips").delete().eq("id", tripId);

  if (error) throw error;
}
