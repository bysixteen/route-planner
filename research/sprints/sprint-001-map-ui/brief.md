---
title: "Sprint 001: Map Interface UI — Rich Journey View"
type: sprint-brief
status: complete
date: 2026-03-05
sprint: "001"
personas: [leo, lena, marcus, kira, aris, rowan, elias, nara, ines]
depends-on: []
feeds-into: []
tags: [map, ui, mapbox, trip-viewer, journey-planning]
---

**TL;DR:** Redesign the trip viewer map into a rich journey interface with visible drive times per leg, colour-coded segment health, a POI discovery toggle, and break stop suggestions — desktop-first, viewer only (`trip-map.tsx`).

---

## Sprint Challenge

The trip viewer map presents a route, but fails to communicate the journey — users can't see drive time and distance per leg at a glance, there's no visual cue for the 5-hour constraint, break points aren't surfaced, and there's no discovery layer for the magical things the family will pass on the way.

## Long-Term Goal

Daniel opens the trip map and immediately understands the full journey — each leg's drive time and distance is visible without clicking, mandatory break points are suggested, and a discovery layer shows castles, lakes, and mountains within reach of the route. Planning feels like anticipation, not administration.

## Sprint Questions

1. Can we show drive time and distance for each leg on the route line without cluttering the map?
2. Can we surface break stop opportunities and POIs along the route without introducing a new data dependency beyond Mapbox?
3. Will Daniel be able to confirm at a glance that every leg is within the 5-hour limit?

## Target User

Daniel — The Trip Planner. Desktop, planning phase.

## Target Moment on the Map

Daniel opens the trip viewer after adding all 11 stops. He sees the full route and immediately wants to know: how long is each drive, where should we stop for a break, and what will we pass that's worth seeing? Currently he must click each marker to find out.

## Project Squad

| Persona | Name | Role in This Sprint |
|---------|------|---------------------|
| Visual Designer | Leo Finch | Sketch phase |
| Design Engineer | Dr. Lena Petrova | Map + Sketch |
| Senior Developer | Marcus Thorne | Sketch + Decide |
| Developer | Kira Sharma | Sketch |
| Strategist | Dr. Aris Thorne | Map lead + Synthesise |
| Craftsman | Rowan Vale | Sketch |
| Client | Elias Vance | Decide (mandatory) |
| UX Researcher | Nara Shin | Map + Sketch |
| UX Designer | Ines Alvarez | Sketch + Decide |

## How Might We Questions

1. HMW make drive time and distance visible on the route itself — not just in a popup?
2. HMW surface break opportunities between stops without overwhelming the map?
3. HMW show POIs (castles, lakes, mountains, villages) along the route corridor without a new data source?
4. HMW give Daniel an at-a-glance 5-hour constraint check for every leg?
5. HMW make the map feel like a journey — not just a diagram of coordinates?

## Constraints

- No new npm dependencies — Mapbox GL JS capabilities only
- Tailwind CSS only in Next.js components, no inline styles
- Metric units (km, not miles) throughout
- TypeScript strict mode, no `any` types
- Max 25 Mapbox waypoints (current route: 11 stops)
- Desktop-first layout — Hannah's phone use case deferred to Sprint 004
- Scope: trip viewer only (`trip-map.tsx` + `app/trip/[id]/page.tsx`). Do NOT touch `editor-map.tsx`

## Known Data and Assumptions

**Known:**
- Mapbox Directions API already returns distance (km) and duration (seconds) per segment in `trip-map.tsx`
- Stop types typed: campsite, city, attraction, rest, event, transport
- Trip detail page has a tab system: map only / stops only / both
- Mapbox outdoors style (`mapbox://styles/mapbox/outdoors-v12`) available at no extra cost
- Current trip-map.tsx: 189 lines — well-scoped base for redesign

**Unvalidated assumptions:**
- Mapbox rendered features include enough POIs for European rural routes
- Segment labels at midpoints won't overlap at standard zoom levels
- A 300px sidebar + full-height map fits Daniel's typical screen (assumes ≥1280px)
