import { MAPBOX_TOKEN } from './config'

export interface GeocodingResult {
  id: string
  name: string
  fullName: string
  coordinates: [number, number] // [lng, lat]
  country?: string
  region?: string
}

/**
 * Search for places using Mapbox Geocoding API
 */
export async function searchPlaces(query: string): Promise<GeocodingResult[]> {
  if (!query || query.length < 2) return []

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,neighborhood,address,poi&limit=5`

  try {
    const response = await fetch(url)
    if (!response.ok) return []

    const data = await response.json()

    return data.features.map((feature: {
      id: string
      text: string
      place_name: string
      center: [number, number]
      context?: Array<{ id: string; text: string }>
    }) => {
      const country = feature.context?.find((c) => c.id.startsWith('country'))?.text
      const region = feature.context?.find((c) => c.id.startsWith('region'))?.text

      return {
        id: feature.id,
        name: feature.text,
        fullName: feature.place_name,
        coordinates: feature.center,
        country,
        region,
      }
    })
  } catch (error) {
    console.error('Geocoding error:', error)
    return []
  }
}

/**
 * Reverse geocode coordinates to get place name
 */
export async function reverseGeocode(
  lng: number,
  lat: number
): Promise<GeocodingResult | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,neighborhood&limit=1`

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    const feature = data.features[0]

    if (!feature) return null

    const country = feature.context?.find((c: { id: string }) => c.id.startsWith('country'))?.text
    const region = feature.context?.find((c: { id: string }) => c.id.startsWith('region'))?.text

    return {
      id: feature.id,
      name: feature.text,
      fullName: feature.place_name,
      coordinates: feature.center,
      country,
      region,
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}
