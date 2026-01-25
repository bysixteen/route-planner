export interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
}

export interface Geopoint {
  _type: 'geopoint'
  lat: number
  lng: number
  alt?: number
}

export interface Vehicle {
  _id: string
  name: string
  make?: string
  model?: string
  type?: 'campervan' | 'motorhome' | 'car' | 'caravan'
  fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid'
  fuelConsumption?: number
  image?: SanityImage
}

export interface StopPhoto extends SanityImage {
  caption?: string
  takenAt?: string
}

export interface Stop {
  _id: string
  name: string
  type: 'campsite' | 'city' | 'attraction' | 'rest' | 'event' | 'transport'
  location: Geopoint
  address?: string
  country?: string
  arrivalDate?: string
  departureDate?: string
  nights?: number
  bookingReference?: string
  bookingUrl?: string
  cost?: number
  currency?: 'EUR' | 'GBP' | 'HUF' | 'CHF'
  amenities?: string[]
  notes?: string
  photos?: StopPhoto[]
}

export interface Trip {
  _id: string
  title: string
  slug: {
    _type: 'slug'
    current: string
  }
  description?: string
  coverImage?: SanityImage
  startDate: string
  endDate: string
  status: 'planning' | 'booked' | 'in-progress' | 'completed'
  maxDrivingMinutes: number
  isPublic: boolean
  vehicle?: Vehicle
  stops?: Stop[]
  stopCount?: number
}

export interface TripListItem {
  _id: string
  title: string
  slug: {
    _type: 'slug'
    current: string
  }
  description?: string
  coverImage?: SanityImage
  startDate: string
  endDate: string
  status: 'planning' | 'booked' | 'in-progress' | 'completed'
  maxDrivingMinutes: number
  stopCount: number
  vehicle?: {
    name: string
    make?: string
    model?: string
  }
}
