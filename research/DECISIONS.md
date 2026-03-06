# Route Planner — Decision Log

**Last updated:** 2026-03-05 — Sprint 002 (Trip Viewer Data Concepts)

This document is a high-level log of significant decisions made during sprints and spikes. For full rationale, follow the ADR links.

| # | Decision | Sprint / Spike | Date | ADR |
|---|----------|----------------|------|-----|
| 1 | Dropped Switzerland (Interlaken / Lazy Rancho) from route | Foundation | 2026-03 | Route revised to keep all driving days ≤5h. Luxembourg → Interlaken → Zell am See was ~7h. Not yet booked so safe to remove. |
| 2 | ~~Added Lake Constance (Lindau) as Stop 4~~ — superseded | Foundation | 2026-03 | Initial proposal; Mapbox routed via Strasbourg at ~6.5h. |
| 3 | Removed Switzerland and Liechtenstein from itinerary | Foundation | 2026-03 | Route change makes both inaccessible without significant detour. Reduces country count from 9 to 7. |
| 4 | Static campsites.html as primary reference document | Foundation | 2026-03 | Works offline, no auth, shareable link. Next.js app requires Supabase credentials not available in local workspace. |
| 5 | Supabase as backend (replaced Sanity CMS) | 2025 | 2025 | PostgreSQL with typed queries is simpler than headless CMS for structured trip data. |
| 6 | Mapbox GL JS for map rendering | 2025 | 2025 | Best-in-class for custom route rendering and Directions API integration. Rejected Google Maps (cost). |
| 7 | Max 5 hours driving per day rule | Trip planning | 2025 | Cork family rule — prevents fatigue with children in the vehicle. All route decisions derive from this constraint. |
| 8 | Camping Gülser Moselbogen (Koblenz) confirmed booked | Foundation | 2026-03 | Originally logged as PRELIMINARY (Ref 114170). Confirmed booked. Status updated across all files. |
| 9 | ~~Stop 4 → Starnberger See~~ — superseded | Spike 001 | 2026-03 | Dropped: south-shore coords pushed Mapbox off A8 motorway. |
| 10 | ~~Stop 5 → Wachau (Melk)~~ — superseded then reinstated as decision 14 | Spike 001 | 2026-03 | Initially dropped because middle leg was too short with Augsburg as Stop 4. Reinstated when Stop 4 moved west. |
| 11 | ~~Stop 4 → Augsburg [10.898, 48.371]~~ — superseded by decision 13 | Spike 001 iter. 2 | 2026-03 | Live Mapbox showed Lux→Augsburg = 5h51m (❌ over 5h). Also Salzburg→Hungaroring = 6h10m. |
| 12 | ~~Stop 5 → Salzburg [13.04, 47.80]~~ — superseded by decision 14 | Spike 001 iter. 2 | 2026-03 | Live Mapbox showed Salzburg→Hungaroring = 6h10m (❌). Salzburg too far west for balanced legs. |
| 13 | **Stop 4 → Swabian Alb (Blaubeuren) [9.75, 48.51]** | Spike 001 final | 2026-03 | Systematic Mapbox testing found 5h boundary at longitude ~9.75. Blaubeuren on the A8: Lux→Swabian Alb = 4h50m 🟡. Blautopf spring, Ulm 30min, Legoland 40min. |
| 14 | **Stop 5 → Wachau (Melk) [15.33, 48.22]** | Spike 001 final | 2026-03 | Reinstated from decision 10. Melk→Hungaroring = 4h09m 🟡. Middle leg Swabian Alb→Melk = 4h43m 🟡. All 3 legs now ≤5h. UNESCO Wachau Valley. |
| 15 | **Trip viewer rebuilt as desktop two-panel layout** | Sprint 001 | 2026-03 | Sidebar (300px, itinerary + segment times) + full-height map. Segment labels on route line. Colour-coded legs (green/amber/red). Mapbox outdoors style. POI toggle gated on data quality. See `research/sprints/sprint-001-map-ui/decision.md`. |
| 16 | **Trip viewer sidebar restructured as three-layer information architecture** | Sprint 002 | 2026-03 | Summary bar (trip metrics) + day-grouped itinerary with booking status badges + outbound/return section markers. Empty fields hidden, not dashed. Booking status derived from `booking_reference` presence. See `research/sprints/sprint-002-data-concepts/decision.md`. |
