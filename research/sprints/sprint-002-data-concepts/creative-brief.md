---
title: "Sprint 002: Creative Brief"
type: sprint-creative-brief
status: complete
date: 2026-03-05
sprint: "002"
decision: "decision.md"
---

**TL;DR:** Enrich the trip viewer sidebar with booking status, cost summary, fuel estimate, day grouping, outbound/return markers, stop purpose indicators, and a timeline countdown — structured as a three-layer information architecture that answers "Is everything sorted?" at a glance.

---

## Positioning

The trip viewer sidebar becomes a trip readiness dashboard — showing booking health, cost, fuel, and timeline without leaving the map view.

## Target User

**Daniel — The Trip Planner.** Opening the trip viewer 2 weeks before departure to confirm everything is on track. Secondary: Hannah, who wants to see "all green" without scrolling.

## The Problem

The sidebar currently shows stop names, types, dates, and drive times — but not whether stops are booked, what the trip costs, how much fuel is needed, what day each stop falls on, or what needs actioning. Daniel has to cross-reference emails and spreadsheets to answer basic readiness questions.

## Solution Direction

A three-layer sidebar:

### Layer 1 — Summary Bar (compact, always visible, max 60px)

| Metric | Source | Format |
|--------|--------|--------|
| Total distance | Route segments sum | `X,XXX km` |
| Total driving time | Route segments sum | `XXh XXm` |
| Total cost | Sum of `stops.cost` where non-null + fuel estimate | `€X,XXX est.` |
| Fuel estimate | `(totalKm / 100) × vehicle.fuel_consumption × €1.70/L` | `€XXX fuel` |
| Nights | Sum of `stops.nights` | `XX nights` |
| Days until departure | `trip.start_date - today` | `XX days to go` or `In progress` or `Completed` |
| Booking health | Count of stops where `booking_status = confirmed` | `X/Y confirmed` |
| Countries | Distinct `stops.country` | `X countries` |

### Layer 2 — Day-Grouped Itinerary

- Group stops by `arrival_date` — stops sharing a date appear under the same day header
- Day header format: `Day X — Monday 21 July` (derive day number from `trip.start_date`)
- Stops without `arrival_date` go in an "Unscheduled" group at bottom
- Each stop card shows (in order of visual weight):
  1. **Stop number** (position circle, existing)
  2. **Name** (existing)
  3. **Booking status badge:** `Confirmed` (green), `Pending` (amber), `Not booked` (red), or hidden for non-bookable stops
  4. **Stop type badge** (existing, with icon)
  5. **Dates and nights** (existing)
  6. **Cost** (if non-null): `€XX/night` or `€XX total`
  7. **Booking reference** (if non-null): small monospace text
  8. **Notes** (existing, 2-line clamp)
- Segment rows between cards remain unchanged (drive time + distance + health dot)

### Layer 3 — Outbound/Return Markers

- A section divider appears before the return leg begins
- Label: `Outbound — X stops` / `Return — X stops`
- The event stop (type=`event`) is the natural midpoint
- If no event stop, derive from midpoint position
- On the map: outbound route segments in the existing colour scheme, return segments with a dashed line style

### Booking Status Derivation

| Condition | Status | Badge |
|-----------|--------|-------|
| `booking_reference` is non-null | `confirmed` | Green |
| `booking_reference` is null AND `type` in (`campsite`, `transport`) | `pending` | Amber |
| `booking_reference` is null AND `type` in (`city`, `attraction`, `rest`, `event`) | — | Hidden (not bookable) |

**Schema addition needed:** Add `booking_status` enum (`confirmed`, `pending`, `not_required`) to stops table, OR derive in the UI. Decision: derive in the UI for now — no schema change for status. But add `fuel_consumption_lper100km` (decimal) to the vehicles table.

### Empty State Rules (Elias Vance's constraint)

- If a field has no data, it is **hidden**, not shown as "—" or "€0"
- If ALL stops lack cost data: hide "Total cost" from summary bar entirely
- If vehicle has no fuel consumption rate: hide "Fuel estimate" from summary bar
- If no stops have dates: hide day grouping, fall back to flat list by position
- If no stops have booking references: still show booking health as "0/X confirmed" (this is informative even when empty)

## Design Direction

Per PRINCIPLES.md: "One glance = full picture" and "Status honesty." The summary bar should feel like a car dashboard — compact, glanceable, always truthful. Day grouping should create narrative rhythm (per Rowan Vale). Booking badges should be the loudest signal on each card (per Nara Shin's TripIt research). Cost and fuel data should be present but secondary in visual weight. The overall feeling should be confidence, not anxiety (per Rowan Vale).

## Success Criteria

1. Daniel can state the booking status of any stop without clicking or expanding — booking badges are visible on every bookable stop card in the sidebar
2. The summary bar shows total cost, fuel estimate, and booking health (X/Y confirmed) without scrolling — all visible above the fold on a 1080p display
3. Stops are grouped by day with day headers — Daniel can identify which stops belong to which travel day without cross-referencing dates
4. The outbound/return split is visually distinct — a section marker and/or route line style change differentiates the two legs
5. Empty data fields are invisible — if cost is null on a stop card, no cost line appears; if all costs are null, the summary bar hides the cost metric

## Constraints

- No new npm dependencies
- Tailwind CSS only — no inline styles
- TypeScript strict mode — no `any`
- British English, metric units, British date formats
- Desktop-only sidebar (mobile deferred to Sprint 004)
- Summary bar max height: 60px — must not push itinerary below the fold
- All data derived from existing Supabase schema + one new vehicle column
- Must degrade gracefully when data is incomplete

## What This Is NOT

- Not a booking engine — display only, no write operations from the sidebar
- Not an expense tracker — estimated costs, not actuals with receipts
- Not a calendar — day grouping is visual structure, not iCal integration
- Not a task manager — "needs action" is a count of data gaps, not a todo list
- Not a mobile experience — that's Sprint 004
- Not a visual redesign — data concepts within the existing card/sidebar structure
