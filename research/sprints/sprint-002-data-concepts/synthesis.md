---
title: "Sprint 002: Synthesis"
type: sprint-synthesis
status: complete
date: 2026-03-05
sprint: "002"
feeds-from: "decision.md"
---

**TL;DR:** Sprint 002 defined the information architecture for the trip viewer sidebar — three layers (summary bar, day-grouped itinerary with booking badges, outbound/return markers) answering four core questions: Is everything booked? What does it cost? What needs doing? Where am I?

---

## What Changed

| Document | Change |
|----------|--------|
| `research/DECISIONS.md` | Added decision 16: trip viewer sidebar restructured as three-layer IA |
| `research/sprint-status.md` | Added Sprint 002 row (Complete) |
| `research/PRINCIPLES.md` | Added 3 new principles: empty state hiding, booking status as primary signal, day grouping for 5+ stops |
| `research/dissent-register.md` | Added Elias Vance's information density concern |

## What the Next Sprint Should Know

1. **Schema addition required before implementation:** `fuel_consumption_lper100km` on the vehicles table. Booking status is derived in the UI, not stored.
2. **Empty state rule is a hard constraint:** If a field has no data, it must be hidden — not shown as "—" or "€0". This applies to every new data concept.
3. **The summary bar must stay under 60px:** It must not push the itinerary below the fold. Test on 1080p.
4. **Outbound/return detection:** Use the event stop (type=`event`) as the midpoint. If none, use position-based midpoint.
5. **Day grouping requires dates:** If stops lack `arrival_date`, fall back to a flat list. Don't break the UI for incomplete data.

## Ideas & Opportunities

6 ideas captured — see `ideas.md`. Key ones: two-mode sidebar toggle (Elias), "needs action" notification on trip cards (Ines), and in-progress "you are here" indicator (Rowan).

## Open Questions

1. What fuel price per litre should we assume? Current average in Europe is ~€1.70/L but varies by country. Should this be configurable?
2. Should vignette costs be stored on the trip or derived from the route countries? This is a data modelling question for a future spike.
3. The `booking_reference` field alone may not distinguish "booked but ref not entered" from "not booked" — is a manual `booking_status` field needed eventually?

---

_Appendix: Full sprint folder at `research/sprints/sprint-002-data-concepts/`_
