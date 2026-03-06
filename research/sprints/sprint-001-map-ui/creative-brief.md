---
title: "Sprint 001: Creative Brief — Map Interface UI"
type: sprint-creative-brief
status: complete
date: 2026-03-05
sprint: "001"
decision: "decision.md"
---

**TL;DR:** Rebuild the trip viewer as a desktop two-panel journey interface — sidebar itinerary with segment times on the left, rich terrain map with colour-coded route on the right — so Daniel can confirm the entire trip's driving plan at a glance.

---

## Positioning

A trip planning map that tells you whether the journey is safe to drive, and shows you what you'll discover along the way.

## Target User

Daniel — The Trip Planner. Using a laptop (≥1280px screen), in the planning phase, reviewing the full Cork family route from Folkestone to the Hungaroring and back.

## The Problem

The current trip viewer shows the route, but doesn't answer the planner's most important question: *is every leg within the 5-hour driving limit?* Drive time and distance per leg exist in the data but are hidden behind popup clicks. There's no at-a-glance confidence check, no sense of what's along the route, and no visual language that communicates journey rather than logistics.

## Solution Direction

A redesigned trip viewer in two panels:
- **Left sidebar (300px):** A full stop-by-stop itinerary. Each stop card shows: stop number, name, type icon, number of nights. Between each pair of stops: a segment row showing drive time and distance (`4h 50m · 485km`), colour-coded by health (green/amber/red).
- **Right panel (full height):** Mapbox map using the outdoors style (`mapbox://styles/mapbox/outdoors-v12`). Route line colour-coded per segment. Pill labels at each segment midpoint showing duration and distance. Optional POI discovery toggle and break stop markers.

## Design Direction

**Tone:** Adventure meets precision. This is a family road trip to a Formula 1 race — it should feel alive, not administrative.

**PRINCIPLES.md entries that apply:**
- "One glance = full picture" — drive time, distance, and leg health must be readable without any interaction
- "Warning visibility" — amber and red leg indicators must be unmissable
- "Metric units only" — km throughout, no miles

**Mapbox style:** `mapbox://styles/mapbox/outdoors-v12`. Terrain, elevation shading, named peaks, rivers, and forests visible by default.

**Colour coding — route segments:**
- Green `#16a34a`: < 4 hours (safe, comfortable)
- Amber `#d97706`: 4–5 hours (within limit, worth noting)
- Red `#dc2626`: > 5 hours (constraint violation — should not occur on the current route)

**Marker language:**
- Existing numbered circle markers retained, colours by stop type
- Break stop markers: smaller, muted, visible only at zoom ≥ 7
- POI markers (when toggle on): Mapbox default landmark styling, not overridden

**Segment label pills:** White text on semi-transparent dark background (`rgba(17,24,39,0.85)`), 12px, border-radius 4px, positioned at segment midpoint. `text-optional: true` in Mapbox layer config to prevent overlap.

**Sidebar styling:** White background, 1px border-right in `--colour-border`. Stop cards use existing `card` component or equivalent. Segment rows styled as connector elements between cards — smaller type, muted colour for distance, bolder for time, coloured dot matching the route segment colour.

## What to Build

### 1. Two-panel layout — `app/trip/[id]/page.tsx`

Replace the current tab system (Map / Stops / Both) with a persistent two-panel layout:
```
<div class="flex h-screen">
  <aside class="w-[300px] hidden md:block overflow-y-auto border-r">
    <!-- Itinerary with segment rows -->
  </aside>
  <div class="flex-1">
    <!-- TripMap component, full height -->
  </div>
</div>
```
The tab system can be retained as a fallback for screens below `md` breakpoint, showing only the map (sidebar hidden via `hidden md:block`). This is not a mobile solution — it's a safety net.

### 2. Segment time labels — `components/map/trip-map.tsx`

In `drawRoute()`, after receiving the Directions API response:
- Extract midpoint of each leg's geometry
- Build GeoJSON FeatureCollection of Points with `label` property (`'4h 50m · 485km'`)
- Add Mapbox symbol layer `'segment-labels'` with `text-field: ['get', 'label']`, `text-optional: true`, white text with dark halo
- Clean up layer and source in the map cleanup `useEffect`

### 3. Segment colour coding — `components/map/trip-map.tsx`

Add a `health` property to each segment's GeoJSON LineString feature:
- `'green'` if duration < 4 × 60 × 60 seconds (4 hours)
- `'amber'` if duration 4–5 hours
- `'red'` if duration > 5 hours

Use a Mapbox `match` expression on `['get', 'health']` for the line `line-color` paint property. Replace the single `'route'` layer with per-segment LineString features (or use a single layer with data-driven colour).

### 4. Mapbox outdoors style

In `trip-map.tsx` map initialisation, change `style` from the current value to `'mapbox://styles/mapbox/outdoors-v12'`.

### 5. Sidebar itinerary — `app/trip/[id]/page.tsx`

Render the stops array in the sidebar. Between each pair of stops, insert a segment row using the `segments` data already fetched. Format: drive time (bold, coloured dot) + distance (muted).

### 6. POI discovery toggle *(gate on data quality check)*

A toggle button in the map controls area (top-right). When active:
- Call `map.queryRenderedFeatures()` filtered to relevant layer IDs from the outdoors style
- Add a highlight layer showing matched features
- **Before shipping: manually test against the actual Cork route.** If fewer than 2 meaningful POIs appear per leg, ship the toggle as hidden.

### 7. Break stop markers *(low priority)*

At the approximate midpoint of each leg's route geometry, add a small marker (binoculars or pause icon). Visible only at zoom ≥ 7. Click/tap shows a popup: "Suggested break — approx. [X]h from [origin stop]."

## Success Criteria

1. Daniel can state the drive time and distance for any leg without clicking a marker or opening a popup — verifiable by opening the trip viewer and reading the sidebar itinerary
2. All legs on the current Cork route display as green or amber (zero red segments) — verifiable by visual inspection
3. At least two named POIs per leg are visible when the POI layer is toggled on — verifiable against the actual route; if this cannot be confirmed, the toggle ships hidden
4. The sidebar itinerary shows all 11 stops with segment times in a single vertical scroll on a 1280px screen

## Constraints

| Constraint | Detail |
|---|---|
| No new npm dependencies | Mapbox GL JS only — no additional mapping or POI libraries |
| Tailwind CSS only | No inline styles in `.tsx` files |
| Metric units | km, not miles |
| TypeScript strict mode | No `any` types, no untyped assertions |
| Mapbox waypoint limit | Max 25 — current route has 11, well within limit |
| Desktop-first | `<aside>` uses `hidden md:block` as mobile safety net only |

## What This Is NOT

- A navigation app — no live traffic, ETAs, or turn-by-turn
- A POI search engine — the discovery layer is decorative and optional
- A mobile design — Sprint 004 owns Hannah's phone experience
- A change to the trip editor — `editor-map.tsx` is out of scope
- An offline solution — Sprint 006 owns that
