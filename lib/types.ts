// Local types for the trip editor (before saving to Sanity)

export interface EditorStop {
  id: string
  name: string
  fullName: string
  coordinates: [number, number] // [lng, lat]
  country?: string
  type: 'campsite' | 'city' | 'attraction' | 'rest' | 'event' | 'transport'
  nights?: number
  arrivalDate?: string
  notes?: string
}

export interface EditorTrip {
  id?: string
  title: string
  startDate?: string
  endDate?: string
  maxDrivingMinutes: number
  stops: EditorStop[]
}

export function createEditorStop(
  name: string,
  fullName: string,
  coordinates: [number, number],
  country?: string
): EditorStop {
  return {
    id: crypto.randomUUID(),
    name,
    fullName,
    coordinates,
    country,
    type: 'city',
    nights: 1,
  }
}
