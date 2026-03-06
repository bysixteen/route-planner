---
title: "Sprint 002: Sketches"
type: sprint-sketches
status: complete
date: 2026-03-05
sprint: "002"
feeds-from: "brief.md"
---

## Leo Finch — Visual Designer
> "Does this feel like us?"

The current sidebar is clean but anonymous — it could be any route planner. What makes this feel like Daniel's family trip? The answer is data personality. A booking status badge that says "CONFIRMED" in green vs "NEEDS ACTION" in red tells a story. A cost line that says "€47/night" grounds the trip in reality. Day headers ("Day 3 — Monday 21 July") create rhythm. The outbound/return distinction should use a subtle colour shift — not a different palette, but a warmth change: outbound feels like departure (neutral), return feels like homecoming (warmer). Stop purpose icons (tent, fork, camera, flag) add visual variety without clutter. The trip summary bar at the top — total km, total cost, total fuel, nights, days until departure — should feel like a dashboard, not a spreadsheet. Keep the existing card structure; enrich it with data, don't redesign it.

---

## Dr. Lena Petrova — Design Engineer
> "How will we build, test, and maintain this?"

The Supabase schema already has most of what we need. `booking_reference` (nullable) gives us confirmed/unbooked status. `cost` (nullable) gives us per-stop cost. `type` gives us stop purpose. `arrival_date` + `departure_date` give us day grouping. What's missing: (1) fuel consumption rate on the `vehicles` table — add `fuel_consumption_lper100km` column, (2) booking status as a derived value, not a new column — if `booking_reference` is present, it's confirmed; if null and `type` is `campsite`, it needs action; otherwise it's informational. Vignette costs are route-level, not stop-level — store as a JSON field on the trip or as a separate `trip_costs` array. Day grouping is a pure UI concern — group by `arrival_date` in the component, no schema change. Outbound/return: add an `is_return` boolean on stops, or derive from a `midpoint_stop_id` on the trip. I'd prefer explicit — derive gets messy with rest days.

---

## Marcus Thorne — Senior Developer
> "What are we NOT building here?"

We are NOT building: (1) a booking engine — we display status, we don't make bookings, (2) a financial tracker — we show estimated costs, not actuals with receipts, (3) real-time fuel pricing — we use a static consumption rate × distance, (4) a calendar sync — day grouping is visual, not iCal, (5) an action/task management system — "what needs doing" is a read-only summary derived from data gaps, not a todo list with due dates and notifications. The biggest risk here is scope creep from "show booking status" into "manage bookings" and from "show costs" into "track expenses." The sidebar should be a dashboard — read-only, derived from existing data. If a field is empty, we show "—" not a form to fill it in. The editing happens in Supabase or a future editor UI, not here.

---

## Kira Sharma — Developer
> "What does the implementation actually look like?"

**Trip summary bar:** New component `<TripSummary>` above the sidebar. Props: `totalDistance`, `totalDuration`, `totalCost`, `totalNights`, `fuelEstimate`, `daysUntilDeparture`, `countriesCount`. Computed from stops + route + vehicle data. Pure presentational.

**Day grouping:** Group `sortedStops` by `arrival_date` using a `Map<string, Stop[]>`. Render day headers between groups. Stops without dates go in an "Unscheduled" group at the bottom.

**Booking status badge:** Derive from `booking_reference` presence: `confirmed` (has ref), `pending` (no ref, type=campsite), `info` (no ref, type≠campsite). Render as a coloured badge on each stop card.

**Stop purpose:** Already have `type` field. Map to icons: campsite→tent, city→building, attraction→camera, rest→coffee, event→flag, transport→ferry.

**Outbound/return:** Add `leg` enum (`outbound`|`return`) to stops in Supabase, or derive from position relative to the event stop. Render as a section header or a subtle sidebar divider.

**Fuel estimate:** `(totalDistanceKm / 100) * vehicle.fuelConsumptionLper100km * fuelPricePerLitre`. Needs fuel consumption rate on vehicle and an assumed fuel price.

**Cost breakdown:** Sum `cost` from stops where non-null. Add fuel estimate. Add vignettes (if stored). Show as a collapsible section in the summary bar.

---

## Dr. Aris Thorne — Strategist
> "What is the real problem we are trying to solve?"

The real problem is cognitive load. Daniel has 11 stops, multiple booking statuses, variable costs, and a countdown to departure. The information exists — in emails, in Supabase, in his head — but the trip viewer doesn't synthesise it. He opens the map and sees geography, not readiness. The question isn't "what data should we show" — it's "what questions should the sidebar answer without Daniel having to ask them?" The questions are: (1) Is everything booked? (2) What does this cost? (3) What do I need to do? (4) Where am I in the journey? If the sidebar answers those four questions at a glance, the information architecture is right. Everything else — fuel estimates, vignettes, stop type icons — is enrichment, not core. Don't let enrichment crowd out the four core questions.

---

## Rowan Vale — Craftsman
> "What is the feeling we want to create?"

The feeling should be confidence. Not "I'm in control of a logistics operation" — more "I know this trip is going to be brilliant." The day grouping creates narrative: Day 1 is departure, Day 7 is the Grand Prix, Day 12 is homecoming. Each day should feel like a chapter heading, not a database row. The booking status should feel reassuring when green and gently urgent when amber — never panic-inducing. The cost summary should feel like a holiday budget, not a balance sheet. The timeline countdown — "18 days until departure" — should create anticipation, not pressure. The outbound/return split creates a natural story arc: the journey there, the event, the journey home. The static prototype had this right conceptually — it showed the trip as a story with chapters. We need that narrative structure without the dark dashboard aesthetic.

---

## Elias Vance — Client (Mandatory Challenger)
> "Does this solve a real problem for my users?"

I'm looking at this from Hannah's perspective. Daniel will pour over every data point we add. Hannah will look at this once and ask: "Is everything sorted?" If the answer isn't immediately obvious, we've failed her. Day grouping and booking status serve Hannah — she can scan green badges and feel confident. But fuel consumption in litres per 100km? Vignette cost breakdowns? Cost per night? Those are Daniel details that risk making the sidebar feel like a spreadsheet to Hannah. My challenge: can we create two levels of information density? A summary mode that answers "Is everything sorted?" (all badges green, total cost shown, countdown visible) and a detail mode that Daniel can drill into? If not two modes, at least a visual hierarchy where the "Hannah-level" information is primary and the "Daniel-level" information is secondary. Also: the static prototype was impressive but overwhelming — that's the cautionary tale here.

---

## Nara Shin — UX Researcher
> "What does the evidence say?"

I've looked at how established trip planning tools handle information density. **Google Trips** (discontinued) used day-by-day grouping with expandable cards — validated pattern, users understood it immediately. **TripIt** uses a timeline view with booking status (confirmed/pending) as the primary visual signal — their user research showed booking status was the #1 information need for trip planners. **Roadtrippers** uses a sidebar with stop cards and route segments interleaved — similar to our current layout but with richer per-stop data. **Fuelly** shows fuel consumption as a simple "X litres for this trip" — no one wants per-segment fuel breakdowns. The evidence consistently shows: (1) booking status is the highest-value data point, (2) day grouping outperforms flat lists for trips > 5 stops, (3) cost summaries work as totals, not breakdowns, (4) timeline awareness (countdown) increases engagement. The pattern is: summary at top, grouped detail below, progressive disclosure for specifics.

---

## Ines Alvarez — UX Designer
> "Where will users get stuck?"

**User flow — current:** Open trip → see flat list of stops → scroll → click card → map flies to stop. No sense of progress, readiness, or structure.

**User flow — proposed:** Open trip → see summary bar (total cost, nights, fuel, countdown, booking health) → scan day groups → each day has a header + stops + segment times → booking badges on each stop card → click card to fly to map + see detail. Optional: expand cost breakdown, toggle outbound/return highlight.

**Dead ends to prevent:** (1) Empty states — if cost is null on all stops, don't show "Total cost: €0" — show "No costs entered" or hide the field. (2) Day grouping breaks if dates aren't populated — need an "Unscheduled" fallback. (3) Booking status derived from `booking_reference` means "confirmed" and "booked but no ref entered" look the same — need clear labelling: "No reference" ≠ "Not booked." (4) Fuel estimate requires vehicle data — if no fuel consumption rate, show "—" not a wrong number. (5) The summary bar must not push the itinerary below the fold on laptop screens — keep it compact (max 60px height).
