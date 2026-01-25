export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
} as const

export const DEFAULT_MAP_STYLE = MAP_STYLES.outdoors

// Centre of Europe for initial view
export const DEFAULT_CENTER: [number, number] = [10.0, 50.0]
export const DEFAULT_ZOOM = 4

// Mapbox Directions API profile
export const DIRECTIONS_PROFILE = 'mapbox/driving'
