export type Database = {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string
          created_at: string
          name: string
          make: string | null
          model: string | null
          year: number | null
          type: 'campervan' | 'motorhome' | 'car' | 'caravan' | null
          fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid' | null
          fuel_consumption: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          make?: string | null
          model?: string | null
          year?: number | null
          type?: 'campervan' | 'motorhome' | 'car' | 'caravan' | null
          fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | null
          fuel_consumption?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          make?: string | null
          model?: string | null
          year?: number | null
          type?: 'campervan' | 'motorhome' | 'car' | 'caravan' | null
          fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | null
          fuel_consumption?: number | null
        }
      }
      trips: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          slug: string | null
          description: string | null
          start_date: string | null
          end_date: string | null
          max_driving_minutes: number
          status: 'planning' | 'booked' | 'in-progress' | 'completed'
          is_public: boolean
          vehicle_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          slug?: string | null
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          max_driving_minutes?: number
          status?: 'planning' | 'booked' | 'in-progress' | 'completed'
          is_public?: boolean
          vehicle_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          slug?: string | null
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          max_driving_minutes?: number
          status?: 'planning' | 'booked' | 'in-progress' | 'completed'
          is_public?: boolean
          vehicle_id?: string | null
        }
      }
      stops: {
        Row: {
          id: string
          created_at: string
          trip_id: string
          position: number
          name: string
          full_name: string | null
          lat: number
          lng: number
          country: string | null
          type: 'campsite' | 'city' | 'attraction' | 'rest' | 'event' | 'transport'
          arrival_date: string | null
          departure_date: string | null
          nights: number
          booking_reference: string | null
          booking_url: string | null
          cost: number | null
          currency: string
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          trip_id: string
          position: number
          name: string
          full_name?: string | null
          lat: number
          lng: number
          country?: string | null
          type?: 'campsite' | 'city' | 'attraction' | 'rest' | 'event' | 'transport'
          arrival_date?: string | null
          departure_date?: string | null
          nights?: number
          booking_reference?: string | null
          booking_url?: string | null
          cost?: number | null
          currency?: string
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          trip_id?: string
          position?: number
          name?: string
          full_name?: string | null
          lat?: number
          lng?: number
          country?: string | null
          type?: 'campsite' | 'city' | 'attraction' | 'rest' | 'event' | 'transport'
          arrival_date?: string | null
          departure_date?: string | null
          nights?: number
          booking_reference?: string | null
          booking_url?: string | null
          cost?: number | null
          currency?: string
          notes?: string | null
        }
      }
    }
  }
}

// Helper types
export type Trip = Database['public']['Tables']['trips']['Row']
export type TripInsert = Database['public']['Tables']['trips']['Insert']
export type Stop = Database['public']['Tables']['stops']['Row']
export type StopInsert = Database['public']['Tables']['stops']['Insert']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
