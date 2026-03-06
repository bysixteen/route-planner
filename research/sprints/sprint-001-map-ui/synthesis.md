---
title: "Sprint 001: Synthesis"
type: sprint-synthesis
status: complete
date: 2026-03-05
sprint: "001"
feeds-from: "decision.md"
---

**TL;DR:** Sprint 001 decided to rebuild the trip viewer as a desktop two-panel journey interface. The implementation sprint can begin immediately from `creative-brief.md`. POI data quality must be validated before shipping the discovery toggle.

---

## What Changed

| Document | Change |
|---|---|
| `research/DECISIONS.md` | Added Sprint 001 decision: two-panel map viewer with segment times and outdoors style |
| `research/sprint-status.md` | Sprint 001 row added — Complete, all 9 personas |
| `research/PRINCIPLES.md` | Added: "Map viewer uses Mapbox outdoors style" and "Segment drive times must be visible without interaction" |
| `research/dissent-register.md` | Added: Elias's POI data quality concern and Hannah's mobile deferral |
| `site/sprints/sprint-001/index.html` | Sprint page created |
| `site/sprints.json` | Sprint 001 entry appended |

## What the Next Sprint Should Know

1. **The data exists.** Segment duration and distance are already returned by the Directions API and stored in the route response in `trip-map.tsx`. The implementation sprint is a UI problem, not a data problem.
2. **Gate the POI layer.** Elias's concern about `queryRenderedFeatures` data quality on rural European routes is valid. Test the POI toggle against the actual Cork route (Folkestone → Bruges → Bissen → Blaubeuren → Wachau → Hungaroring and back) before shipping it enabled. See success criterion 3 in `creative-brief.md`.
3. **The sidebar replaces the tab system on desktop.** The current "Map / Stops / Both" tab interface in `app/trip/[id]/page.tsx` should be replaced with the persistent two-panel layout on screens ≥ `md` breakpoint. The tab system can be retained as a mobile fallback but should not be the primary desktop UI.

## Ideas & Opportunities

7 ideas captured — see `ideas.md` for the full list. Highest priority: (1) curated family POI layer in Supabase rather than relying on Mapbox rendered features, (2) shareable map link for Hannah (feeds into Sprint 004).

## Open Questions

1. **What layer IDs to query for POIs in the outdoors style?** The implementation sprint will need to inspect the Mapbox outdoors style layer schema to identify the correct layer IDs for castles, viewpoints, natural landmarks, and historic sites. This should be validated in a browser devtools session before implementing.
2. **Does `queryRenderedFeatures` work at the zoom level needed to see the full Cork route?** At continental zoom (showing Folkestone to Budapest), features may not render. The POI layer may only be useful at zoom ≥ 8–9. Test before implementing.
3. **Should the sidebar scroll independently of the map?** If so, the sidebar needs `overflow-y: auto` and a fixed height, which interacts with the trip page's existing layout structure. The implementation sprint should review the full `app/trip/[id]/page.tsx` layout before making changes.

---

_Appendix: Full sprint folder at `research/sprints/sprint-001-map-ui/`_
