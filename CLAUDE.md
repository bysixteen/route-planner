# Route Planner - Project Instructions

## Project Overview
Personal road trip planning tool for the Cork family. Built with Next.js 15, Supabase, Mapbox, and Tailwind CSS.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS 4 + Shadcn/ui
- **Maps:** Mapbox GL JS + Directions API
- **Deployment:** Vercel
- **Language:** TypeScript (strict mode)

## Code Conventions

### File Naming
- Use kebab-case for all files: `trip-card.tsx`, `route-layer.tsx`
- Use PascalCase for components: `TripCard`, `RouteLayer`
- Use camelCase for functions and variables

### Import Order
1. React/Next.js imports
2. External libraries (mapbox-gl, date-fns, etc.)
3. Internal modules (@/components, @/lib)
4. Types
5. Styles (if any)

### Component Structure
```tsx
// 1. Imports
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import type { Trip } from '@/lib/types'

// 2. Types (if component-specific)
interface TripCardProps {
  trip: Trip
  onSelect?: (id: string) => void
}

// 3. Component
export function TripCard({ trip, onSelect }: TripCardProps) {
  // hooks first
  // handlers second
  // render
}
```

### Supabase Queries
- Place all database queries in `lib/supabase/queries.ts`
- Use typed responses from `lib/supabase/types.ts`
- Create client per-request with `createClient()`

### Mapbox
- Store access token in `NEXT_PUBLIC_MAPBOX_TOKEN`
- Initialise maps in useEffect with cleanup
- Use metric units (kilometres, not miles)

## British English
- Use British spelling: colour, favourite, travelled, centre
- Use British date format: 18 July 2025 (not July 18, 2025)
- Currency: show local currency (EUR for Europe, GBP for UK)

## Don't Do
- Don't add dependencies without discussion
- Don't create new patterns when existing ones work
- Don't over-engineer - build for current needs
- Don't commit .env files or API keys
- Don't use inline styles - always use Tailwind classes
- Don't add features beyond what's requested

## Key Directories
```
app/           → Next.js pages and API routes
components/    → React components (ui/, map/, trip/, export/)
lib/           → Utilities (supabase/, mapbox/, types.ts)
public/        → Static assets
```

## Environment Variables Required
```env
# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Common Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
```

## Testing Checklist
Before committing:
- [ ] No TypeScript errors (`npm run build`)
- [ ] Routes render correctly
- [ ] Map loads without console errors
- [ ] Responsive design works on mobile
- [ ] No API keys exposed in code
