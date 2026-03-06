---
title: "Sprint 002: Trip Viewer Data Concepts — Information Architecture"
type: sprint-brief
status: in-progress
date: 2026-03-05
sprint: "002"
personas: [leo, lena, marcus, kira, aris, rowan, elias, nara, ines]
depends-on: [sprint-001-map-ui]
feeds-into: []
tags: [information-architecture, sidebar, data-concepts]
---

**TL;DR:** The trip viewer sidebar and map show stops and drive times, but lack the data concepts a trip planner needs: booking status, costs, fuel estimates, day grouping, outbound/return routes, stop purpose, and timeline awareness.

---

## Sprint Challenge

The trip viewer shows stops and route segments but doesn't communicate trip readiness — Daniel can't see what's booked, what it costs, how much fuel he needs, which stops are outbound vs return, or what needs doing today. The sidebar is a flat list of stops, not a trip plan.

## Long-Term Goal

Daniel opens the trip viewer and immediately knows the full state of his trip: what's confirmed, what's pending, what it will cost, how much fuel he'll burn, which day each stop falls on, and what he still needs to action. Hannah opens the same view on her phone and feels confident the trip is well-organised. Planning feels like control, not anxiety.

## Sprint Questions

1. Can we show booking status per stop without introducing a new data model?
2. Will Daniel be able to see "what needs doing today" from the sidebar alone?
3. Can we group stops by day and distinguish outbound from return without overcomplicating the sidebar layout?

## Target User

**Daniel — The Trip Planner.** Primary planner who manages bookings, monitors payments, and maintains reference documents. Key quote: "I just need to see all 11 stops, what I've paid, what I still owe, how long each drive is, and what I need to do today."

## Target Moment on the Map

Daniel opens the trip viewer 2 weeks before departure. He needs to know: are all stops booked? What's the total cost? How much fuel will the trip burn? What stops are on the way out vs back? Is there anything he needs to action right now?

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

1. HMW surface booking status per stop (confirmed, pending, needs action)?
2. HMW show trip cost breakdown (campsites, fuel, vignettes)?
3. HMW group stops by day (timeline not flat list)?
4. HMW distinguish outbound from return on the route?
5. HMW surface "what needs doing today" (outstanding payments, unbooked stops, deadlines)?
6. HMW show fuel consumption estimates from vehicle data + route distance?
7. HMW indicate stop purpose (overnight, lunch, scenic, attraction, event)?
8. HMW show trip timeline awareness (days until departure, nights total, position in trip)?

## Constraints

- No new npm dependencies (per CLAUDE.md)
- Must work with existing Supabase schema — extend, don't replace
- Metric units, British English, British date formats
- TypeScript strict mode, Tailwind CSS only
- Sidebar is desktop-only for now (Sprint 004 covers mobile)
- Data concepts must degrade gracefully when data is incomplete (e.g. no cost entered, no booking reference)
- Static prototype (dexter-f1.netlify.app) is a reference for DATA CONCEPTS only, not visual design

## Known Data and Assumptions

**Known data:**
- Supabase `stops` table already has: `type`, `arrival_date`, `departure_date`, `nights`, `notes`, `position`
- Supabase `stops` table has `booking_reference` and `cost` fields (nullable)
- Route segments provide `distance` and `duration` per leg
- Vehicle data exists in Supabase (`vehicles` table) — name, make, model
- The static prototype at dexter-f1.netlify.app shows: fuel consumption, total distance, cost breakdown, booking status grid, day grouping, outbound/return distinction

**Assumptions to validate:**
- The `vehicles` table may not have fuel consumption data (litres/100km) — this would need adding
- There is no `booking_status` enum on the stops table — we may need to derive it from `booking_reference` presence
- Day grouping assumes `arrival_date` is populated on all stops — it may not be
- "What needs doing today" requires a concept of deadlines/due dates that may not exist in the schema
- Outbound vs return distinction may be implicit (midpoint of trip) rather than stored
