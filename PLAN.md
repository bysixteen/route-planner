# Route Planner - Project Plan

## Overview

A personal road trip planning tool for the Cork family's European adventures, starting with the Hungarian GP trip (July 18th - August 1st). Built with Next.js 15, Sanity CMS, and Mapbox for route visualisation.

## Your Trip Summary

| Leg | Route | Approx. Distance | Approx. Time |
|-----|-------|------------------|--------------|
| 1 | Folkestone → Brussels | 200 km | 2.5 hrs |
| 2 | Brussels → Frankfurt | 400 km | 4 hrs |
| 3 | Frankfurt → Wels (Austria) | 500 km | 5 hrs ⚠️ |
| 4 | Wels → Vienna | 200 km | 2 hrs |
| 5 | Vienna → Budapest | 250 km | 2.5 hrs |
| **Total Outbound** | | ~1,550 km | ~16 hrs |

**Note:** Frankfurt → Wels is too long for your 4-hour limit. Recommend splitting at Nuremberg or Passau.

---

## Tech Stack

### Core Framework
- **Next.js 15** (App Router) - Server components, streaming, excellent performance
- **React 19** - Latest features including Server Actions
- **TypeScript** - Strict mode as per your preferences

### Content Management
- **Sanity CMS** - Headless CMS for managing trips, stops, and content
- **Sanity Studio** - Embedded visual editor for trip management
- **GROQ** - Query language for fetching trip data

### Styling
- **Tailwind CSS 4** - Utility-first CSS
- **Shadcn/ui** - Component library base
- **Custom components** - Trip cards, timeline, route visualisation

### Mapping & Routing
- **Mapbox GL JS** - Interactive maps with custom styling
- **Mapbox Directions API** - Route calculation with driving times
- **@mapbox/mapbox-gl-directions** - UI plugin for route planning

### Export & Sharing
- **html-to-image** or **dom-to-image** - Export route graphics as PNG/JPG
- **Open Graph images** - Auto-generated social preview cards
- **Vercel OG** - Dynamic social media images

### Deployment
- **Vercel** - Hosting with edge functions
- **Vercel Analytics** - Usage tracking

---

## Features - Prioritised

### Phase 1: Core Planning (MVP)
1. **Trip Management**
   - Create/edit trips with start/end dates
   - Add overnight stops with campsite details
   - Set daily driving time limits (default: 4 hours)

2. **Route Visualisation**
   - Interactive Mapbox map showing full route
   - Stop markers with info popups
   - Route lines between stops
   - Distance/time display per leg

3. **Campsite Integration**
   - Manual entry of campsite details
   - Link to booking confirmations
   - Notes and amenities

### Phase 2: Export & Sharing
4. **Route Graphics Export**
   - Generate shareable route image
   - Include: route map, stops, distances, dates
   - Multiple formats (Instagram story, square post, wide banner)
   - Custom branding/styling

5. **Trip Summary Cards**
   - Stats: total distance, driving hours, countries
   - Stop breakdown with photos
   - Export as image or PDF

### Phase 3: Enhanced Features
6. **Smart Suggestions**
   - Warning when daily drive exceeds limit
   - Suggest midpoint stops
   - Campsite recommendations (via external APIs later)

7. **Multi-trip Support**
   - Archive past trips
   - Template trips for reuse
   - Compare routes

---

## Sanity Schema Design

```typescript
// Trip
{
  name: 'trip',
  type: 'document',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'slug', type: 'slug' },
    { name: 'startDate', type: 'date' },
    { name: 'endDate', type: 'date' },
    { name: 'maxDrivingHours', type: 'number', default: 4 },
    { name: 'vehicle', type: 'reference', to: [{ type: 'vehicle' }] },
    { name: 'stops', type: 'array', of: [{ type: 'reference', to: [{ type: 'stop' }] }] },
    { name: 'notes', type: 'blockContent' },
    { name: 'coverImage', type: 'image' },
  ]
}

// Stop
{
  name: 'stop',
  type: 'document',
  fields: [
    { name: 'name', type: 'string' },
    { name: 'type', type: 'string', options: { list: ['campsite', 'city', 'attraction', 'rest', 'event'] } },
    { name: 'location', type: 'geopoint' },
    { name: 'address', type: 'string' },
    { name: 'country', type: 'string' },
    { name: 'arrivalDate', type: 'date' },
    { name: 'departureDate', type: 'date' },
    { name: 'nights', type: 'number' },
    { name: 'bookingReference', type: 'string' },
    { name: 'bookingUrl', type: 'url' },
    { name: 'cost', type: 'number' },
    { name: 'currency', type: 'string', default: 'EUR' },
    { name: 'amenities', type: 'array', of: [{ type: 'string' }] },
    { name: 'notes', type: 'blockContent' },
    { name: 'photos', type: 'array', of: [{ type: 'image' }] },
  ]
}

// Vehicle
{
  name: 'vehicle',
  type: 'document',
  fields: [
    { name: 'name', type: 'string' },
    { name: 'type', type: 'string' }, // e.g., 'T7 Transporter'
    { name: 'fuelType', type: 'string' },
    { name: 'avgFuelConsumption', type: 'number' }, // L/100km
  ]
}
```

---

## Folder Structure

```
route-planner/
├── app/
│   ├── (site)/
│   │   ├── page.tsx              # Home - list of trips
│   │   ├── trips/
│   │   │   ├── [slug]/
│   │   │   │   ├── page.tsx      # Trip detail with map
│   │   │   │   └── export/
│   │   │   │       └── page.tsx  # Export view
│   │   └── layout.tsx
│   ├── studio/
│   │   └── [[...tool]]/
│   │       └── page.tsx          # Embedded Sanity Studio
│   └── api/
│       ├── og/
│       │   └── route.tsx         # OG image generation
│       └── export/
│           └── route.tsx         # Export image generation
├── components/
│   ├── ui/                       # Shadcn components
│   ├── map/
│   │   ├── trip-map.tsx
│   │   ├── route-layer.tsx
│   │   └── stop-marker.tsx
│   ├── trip/
│   │   ├── trip-card.tsx
│   │   ├── stop-list.tsx
│   │   └── trip-stats.tsx
│   └── export/
│       ├── export-preview.tsx
│       └── export-controls.tsx
├── lib/
│   ├── sanity/
│   │   ├── client.ts
│   │   ├── queries.ts
│   │   └── schemas/
│   ├── mapbox/
│   │   ├── config.ts
│   │   └── directions.ts
│   └── utils/
│       └── route-calculations.ts
├── sanity/
│   ├── schemaTypes/
│   └── sanity.config.ts
├── public/
├── .env.local
├── CLAUDE.md
└── package.json
```

---

## Borrowed Features from Research

### From Furkot
- **Daily driving limits** - Set max hours, get warnings when exceeded
- **Automatic overnight suggestions** - Based on your driving limit

### From Roadtrippers
- **Visual route timeline** - See each day as a card
- **Stop details with photos** - Rich media for each location
- **Mobile sync** - Works on phone during the trip

### From Wanderlog
- **Route optimisation display** - Show time/distance between each stop
- **Export to Google Maps** - Quick navigation handoff

### From Park4Night (for later)
- **Campsite database integration** - Search European campsites

---

## Social Export Design

The export feature will generate graphics in these formats:

### Instagram Story (1080x1920)
```
┌─────────────────────────────┐
│     HUNGARIAN GP 2025       │
│         ROAD TRIP           │
├─────────────────────────────┤
│                             │
│    [MAP VISUALIZATION]      │
│                             │
├─────────────────────────────┤
│  🚐 T7 Transporter          │
│  📍 7 stops across 5 countries │
│  🛣️ 3,100 km total          │
│  ⏱️ 32 hours driving        │
│  📅 July 18 - Aug 1         │
└─────────────────────────────┘
```

### Square Post (1080x1080)
```
┌─────────────────────────────┐
│ HUNGARIAN GP ROAD TRIP      │
├─────────────────────────────┤
│                             │
│    [MAP VISUALIZATION]      │
│                             │
├─────────────────────────────┤
│ 3,100km • 7 stops • 14 days │
└─────────────────────────────┘
```

---

## API Keys Required

1. **Mapbox** - Free tier: 50,000 map loads/month, 100,000 directions requests
2. **Sanity** - Free tier: 100k API requests/month, 10GB bandwidth

---

## Getting Started Commands

```bash
# Create Next.js project with Sanity
npx create-next-app@latest route-planner --typescript --tailwind --eslint --app --src-dir=false

# Add Sanity
npm create sanity@latest -- --template nextjs-app-router-live-preview

# Add Shadcn/ui
npx shadcn-ui@latest init

# Add Mapbox
npm install mapbox-gl @mapbox/mapbox-gl-directions

# Add export utilities
npm install html-to-image
```

---

## Questions for You

1. **Domain name?** - Do you want a custom domain or just use Vercel's default?
2. **Sanity project name?** - e.g., "cork-road-trips" or "route-planner"
3. **Mapbox style?** - Light, dark, outdoors, or custom?
4. **Private or public?** - Should trips be publicly viewable or behind auth?

---

## Next Steps

1. ✅ Create this plan
2. ⬜ Set up CLAUDE.md with project conventions
3. ⬜ Initialise Next.js 15 + Sanity project
4. ⬜ Configure Tailwind + Shadcn/ui
5. ⬜ Create Sanity schemas
6. ⬜ Build basic trip list page
7. ⬜ Integrate Mapbox for route display
8. ⬜ Add your Hungarian GP trip data
9. ⬜ Build export functionality
