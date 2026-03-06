---
title: "Sprint 001: Decision"
type: sprint-decision
status: complete
date: 2026-03-05
sprint: "001"
decision: "Restructured the trip viewer into a two-panel desktop layout with an itinerary sidebar, colour-coded segment times on the route line, and a toggleable POI discovery layer using the Mapbox outdoors style."
feeds-from: "sketches.md"
---

**TL;DR:** Rebuild the trip viewer as a desktop two-panel layout (300px sidebar + full-height map), add segment time labels on the route, colour-code legs by health (green/amber/red), switch to Mapbox outdoors style, and add a toggleable POI layer with break stop markers.

---

## Decision

The trip viewer will be restructured into a two-panel desktop layout: a 300px fixed sidebar showing the full stop itinerary with per-segment drive time and distance, and a full-height map using the Mapbox outdoors tile style. Each route segment will display a pill label at its midpoint showing duration and distance (`4h 50m · 485km`). Route segments will be colour-coded by drive time health — green (<4h), amber (4–5h), red (>5h) — using the existing `maxDrivingMinutes` constraint. A toggleable POI discovery layer will surface Mapbox rendered features (landmarks, natural features, viewpoints) along the route corridor. Break stop markers will appear at the approximate midpoint of each leg at zoom ≥ 7.

The decision was driven by three findings from the Sketch phase: (1) the data already exists — segment duration and distance are already computed; the problem is purely UI; (2) industry-standard route planning tools universally use a sidebar + map co-visible layout, not a tab system; (3) Mapbox GL JS supports all required features without new dependencies.

## Rationale

The core problem Aris identified is correct: Daniel cannot confirm the trip's driving constraint is met without clicking each stop. Items 1 and 2 (segment time visibility + leg colour coding) directly solve this. The sidebar replaces the tab system because Nara's competitive research confirms that co-visible map + itinerary is industry standard and significantly reduces interaction overhead.

The Mapbox outdoors style addresses Rowan and Leo's concern about the map feeling cold and generic — and it costs nothing. It makes mountains, lakes, and forests visible by default, which partially addresses the POI discovery need without any additional code.

The POI toggle is included but gated: it must be tested against the actual Cork family route before shipping, per Elias's condition. If `queryRenderedFeatures` doesn't surface meaningful POIs on the actual route, the toggle ships as hidden/disabled.

## Elias Vance's Dissent

Elias raised two challenges:

1. **POI data quality.** Elias is right that `queryRenderedFeatures` is inconsistent for rural European routes. The team accepted this risk with a condition: the POI layer will be validated against the actual Cork route in the implementation sprint. If data quality is insufficient, the toggle ships disabled or hidden. **This condition must be tracked in the implementation sprint brief.**

2. **Hannah's phone experience.** Elias flagged that the sidebar + map layout will not function on a phone, and that every desktop-first decision pushes Hannah further out of the experience. The team accepted the desktop-first prioritisation for this sprint, acknowledging Sprint 004 must be run before the product is complete. Elias did not block the decision; he recorded the concern.

Dissent outcome: **Accepted with conditions.** Added to `research/dissent-register.md`.

## What We Are NOT Doing

| Rejected direction | Reason |
|---|---|
| Real-time traffic or live ETAs | Planning tool, not navigation. Scope creep. |
| Custom POI database | Requires content management infrastructure we don't have |
| Navigation handoff (Apple/Google Maps deep links) | Sprint 006 |
| Changes to `editor-map.tsx` | Viewer and editor are separate concerns |
| Mobile-first or responsive sidebar | Sprint 004 |
| Offline mode | Sprint 006 |
| Animated route drawing / journey playback | Delight feature, not in scope |
| Multiple alternative routes | Not a planning need for a fixed itinerary |

## Next Action

Run the implementation sprint: build the two-panel layout, segment labels, colour coding, and Mapbox outdoors style switch in `trip-map.tsx` and `app/trip/[id]/page.tsx`. Gate the POI layer behind a data quality check on the actual route.
