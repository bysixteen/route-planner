---
title: "Sprint 001: Ideas & Opportunities"
type: sprint-ideas
status: complete
date: 2026-03-05
sprint: "001"
---

**TL;DR:** 7 ideas captured during this sprint for future exploration.

---

| # | Idea | Source Phase | Suggested By | Priority |
|---|------|-------------|-------------|----------|
| 1 | Curated family POI layer — handpick castles, viewpoints, and attractions along the actual Cork route and store them in Supabase rather than relying on Mapbox rendered features | Sketch | Elias Vance + Nara Shin | High |
| 2 | "Journey mode" — an animated playthrough of the route, leg by leg, showing what you'll see each day | Sketch | Rowan Vale | Medium |
| 3 | Navigation handoff — per-stop "Open in Google Maps / Apple Maps" deep links for when the family is on the road | Sketch | Marcus Thorne | Medium |
| 4 | Elevation profile — a chart below the map showing altitude along the full route, highlighting mountain passes and valley sections | Sketch | Leo Finch | Medium |
| 5 | "Day view" — click a leg and see a focused view of just that day's drive, with POIs, break spots, and an ETA timeline | Sketch | Ines Alvarez | Medium |
| 6 | Shareable map link — a read-only URL Daniel can send Hannah (and the kids) that opens the two-panel view without login | Map | Elias Vance | High |
| 7 | Race circuit marker special styling — the Hungaroring stop should feel different from other stops; a checkered flag icon, distinctive colour, possibly a small circuit diagram in the popup | Sketch | Leo Finch | Low |

---

## Notes

Ideas 1 and 6 are the most promising. Idea 1 directly addresses Elias's POI data quality concern — a curated Supabase table of handpicked family POIs would be far more reliable and delightful than querying Mapbox rendered features. It would also require a small admin interface or a simple YAML/JSON data file, which is manageable. Idea 6 overlaps significantly with Sprint 004 (shareable trip overview for Hannah) and should be considered as part of that sprint brief.

Idea 7 is low effort and high charm — the Hungaroring is the entire reason the trip exists.
