---
title: "Sprint 002: Decision"
type: sprint-decision
status: complete
date: 2026-03-05
sprint: "002"
decision: "Restructured the trip viewer sidebar into a layered information architecture: summary bar at top, day-grouped itinerary with booking status badges, derived cost and fuel estimates, and outbound/return section markers."
feeds-from: "sketches.md"
---

## Decision

Adopt a three-layer information architecture for the trip viewer sidebar: (1) a compact **summary bar** at the top showing trip-level metrics (total distance, total cost, fuel estimate, nights, countdown to departure, booking health), (2) **day-grouped stop cards** replacing the current flat list, with booking status badges and stop purpose indicators on each card, and (3) **outbound/return section markers** dividing the itinerary at the midpoint event stop. All data is derived from existing Supabase fields where possible, with two schema additions: `fuel_consumption_lper100km` on the vehicles table and a `booking_status` enum on stops.

## Rationale

Aris Thorne's framing was decisive: the sidebar must answer four questions without Daniel asking them — Is everything booked? What does this cost? What do I need to do? Where am I in the journey? Every data concept was evaluated against these four questions:

| Data Concept | Core Question Answered | Include? |
|---|---|---|
| Booking status badges | Is everything booked? | Yes — primary signal |
| Trip cost summary | What does this cost? | Yes — total + breakdown |
| Day grouping | Where am I in the journey? | Yes — narrative structure |
| Outbound/return markers | Where am I in the journey? | Yes — story arc |
| "Needs action" summary | What do I need to do? | Yes — derived from data gaps |
| Fuel consumption estimate | What does this cost? | Yes — enrichment tier |
| Stop purpose indicators | Where am I in the journey? | Yes — already available via `type` |
| Timeline countdown | Where am I in the journey? | Yes — compact, high value |

Nara Shin's research confirmed: booking status is the #1 information need (TripIt pattern), day grouping outperforms flat lists for 5+ stops, cost summaries work as totals not breakdowns, and timeline countdown increases engagement.

Elias Vance's challenge about information density was addressed by adopting a visual hierarchy: "Hannah-level" data (booking health, countdown, total cost) is primary; "Daniel-level" data (fuel breakdown, per-stop cost, vignettes) is secondary and collapsible.

## Elias Vance's Dissent

"The risk is that we add eight data concepts to a sidebar that currently shows five fields per card. Daniel will love it; Hannah will feel overwhelmed. I accept the decision because the visual hierarchy addresses my concern — but I want a clear rule: if a data field is empty, it must be invisible, not show a dash or zero. Empty state = hidden. This prevents the sidebar from looking like a half-filled spreadsheet when only 3 of 11 stops have cost data entered. Also: the summary bar's 'booking health' metric (e.g. '7/11 confirmed') is more useful to Hannah than individual badges per card — she doesn't need to scroll, she just needs the number."

**Outcome:** Accepted. Empty fields will be hidden, not shown as dashes. The summary bar will include a booking health metric (e.g. "7/11 confirmed") for at-a-glance scanning.

## What We Are NOT Doing

- **Booking management:** We show status, we don't make or modify bookings from the sidebar.
- **Expense tracking:** We show estimated costs, not actuals with receipts or payment tracking.
- **Real-time fuel pricing:** We use a static consumption rate × distance × assumed price per litre.
- **Calendar sync or iCal export:** Day grouping is visual, not a calendar integration.
- **Task/todo management:** "What needs doing" is a read-only summary of data gaps, not a tickable checklist with notifications.
- **Two-mode toggle (summary/detail):** Instead, we use visual hierarchy — primary data is always visible, secondary data is secondary in weight but not hidden behind a toggle. Elias's suggestion of a full toggle was considered but adds interaction complexity for a sidebar that should work at a glance.
- **Per-segment fuel breakdowns:** Total fuel estimate only (validated by Nara's Fuelly research).
- **Mobile layout:** Deferred to Sprint 004.

## Next Action

Write the creative brief specifying the exact data fields, their source, their visual treatment, and the component structure — then proceed to implementation.
