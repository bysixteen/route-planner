import { groq } from 'next-sanity'

export const allTripsQuery = groq`
  *[_type == "trip"] | order(startDate desc) {
    _id,
    title,
    slug,
    description,
    coverImage,
    startDate,
    endDate,
    status,
    maxDrivingMinutes,
    "stopCount": count(stops),
    vehicle->{
      name,
      make,
      model
    }
  }
`

export const tripBySlugQuery = groq`
  *[_type == "trip" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    description,
    coverImage,
    startDate,
    endDate,
    status,
    maxDrivingMinutes,
    isPublic,
    vehicle->{
      _id,
      name,
      make,
      model,
      type,
      fuelType,
      fuelConsumption,
      image
    },
    stops[]->{
      _id,
      name,
      type,
      location,
      address,
      country,
      arrivalDate,
      departureDate,
      nights,
      bookingReference,
      bookingUrl,
      cost,
      currency,
      amenities,
      notes,
      photos
    }
  }
`

export const allStopsQuery = groq`
  *[_type == "stop"] | order(arrivalDate asc) {
    _id,
    name,
    type,
    location,
    country,
    arrivalDate,
    departureDate
  }
`

export const allVehiclesQuery = groq`
  *[_type == "vehicle"] {
    _id,
    name,
    make,
    model,
    type,
    image
  }
`
