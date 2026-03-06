---
title: "Spike 001: Where should Stop 4 and Stop 5 sit to keep all outbound legs within 5 hours?"
type: spike-brief
status: in-progress
date: 2026-03-05
spike-type: research
timebox: "1 day"
question: "Which intermediate positions for Stop 4 and Stop 5 on the outbound route (Luxembourg → Hungaroring) keep every leg within the 5-hour family driving limit?"
consumer: "Stop 4 and Stop 5 campsite booking decisions. Blocking sprint-backlog items 001 and 002."
personas: [aris, nara, elias]
depends-on: []
feeds-into: ["spike-001", "spike-002"]
tags: ["route", "driving-times", "stop-positions", "geography"]
---

**TL;DR:** The current Lake Constance (Lindau) position for Stop 4 produces a 6.5h leg from Luxembourg — violating the 5h family rule. Stop 5 (Salzburg area) leaves an unduly long leg to the Hungaroring. We need to reposition both to produce ≤5h legs across the board.

---

## The Question

Which coordinates for Stop 4 and Stop 5 produce legs that are all within 5 hours, while remaining geographically sensible for the outbound Cork family road trip (Luxembourg → Hungaroring)?

## Why We Need to Know

We need to decide: **Where to book campsites for Stop 4 (21–23 Jul) and Stop 5 (23–24 Jul).**

We cannot decide because: **The current indicative positions produce at least one leg (Luxembourg → Stop 4) measured at ~6.5h by Mapbox, and the Stop 5 → Hungaroring leg is also suspected to be long.**

Once answered, we will be able to: **Specify a geographic search area for spike-002 (Stop 5 campsite search) and proceed with Stop 4 campsite research in that zone.**

## Acceptance Criteria

- We will know the geographic region(s) where Stop 4 and Stop 5 should sit.
- We will have estimated Mapbox-compatible drive times for all three legs: 3→4, 4→5, 5→6.
- We will have a specific recommendation (with coordinates) to update the STOPS array in `public/campsites.html`.
- All three legs will be confirmed ≤5h in the updated array.

## Timebox

1 day. Start: 2026-03-05. End: 2026-03-05.

## Constraints

- Max 5 hours driving per day — Cork family hard rule, applies with children in the vehicle.
- Stop 6 (Camping Zengo, Hungaroring) is fixed at [19.2506, 47.5789].
- Stop 3 (Camping Bissen, Luxembourg) is fixed at [5.9537, 49.8714]. BOOKED, not moveable.
- Stops 4 and 5 are NOT yet booked — coordinates are placeholders.
- The outbound route must stay broadly south and east (Germany → Austria → Hungary).
- Vehicle is a VW T7 campervan ("Dexter"). Motorway-capable, no height/weight restrictions.

## Known Options

- **Stop 4 Option A:** Bavaria — Starnberger See / Ammersee area (~30km SW of Munich)
- **Stop 4 Option B:** Augsburg, Bavaria — on the A8 motorway corridor, slightly further north
- **Stop 4 Option C:** Keep Lake Constance but move to north shore (Konstanz) — closer to Stuttgart
- **Stop 5 Option A:** Wachau Valley (Melk, Austria) — UNESCO riverside, ~3h from Bavaria, ~2.5h to Hungaroring
- **Stop 5 Option B:** Linz, Austria — slightly further west, longer leg to Hungaroring
- **Stop 5 Option C:** St. Pölten area — split the difference between Linz and Vienna

## What We Already Know

1. The Switzerland route was dropped because Luxembourg → Interlaken → Zell am See was ~7h. (Decision #1)
2. Lake Constance (Lindau) was added as Stop 4 as the replacement. Now found to be ~6.5h from Luxembourg.
3. The current Stop 5 marker [12.7939, 47.2959] is in the alpine foothills SE of Salzburg — Mapbox likely routes via slower mountain roads to the Hungaroring.
4. Camping Zengo (Stop 6) at [19.2506, 47.5789] is BOOKED — immoveable.
5. On the return leg, Stop 7 (Klosterneuburg/Vienna) is already booked. Stop 5 on the OUTBOUND leg must not conflict.

---

## Investigation Angles

### Dr. Aris Thorne — Strategist
> "What is the real problem we are trying to solve?"

The 5h rule exists to protect the family experience — tired children, a fatigued driver, and a cramped campervan are the enemy. The real failure mode is not just a leg that reads as 5h 15min; it is arriving at a campsite exhausted with no margin for fuel stops, roadworks, or toilet breaks. Aris will push us to think about what 4.5h looks like in practice (one significant fuel stop, one brief break), and whether any of the proposed positions are on mountain roads that compress motorway averages. He will also ask whether we are optimising for distance or experience — a stop in the Bavarian Lakes might be 4.5h driving but reward the family with a swim and a view; a stop near Augsburg might be 3.5h but in a nondescript layby campsite near the motorway.

**Aris's question:** *Is a 4.5h leg to Bavaria better than a 6h leg to Lake Constance, and does it give us a better experience at the destination?*

### Nara Shin — UX Researcher
> "What does the evidence say?"

Nara will apply systematic geographic analysis to the three options for Stop 4. She will compute straight-line distances and road distances for each candidate, cross-reference motorway routing from Esch-sur-Sûre (not Luxembourg City — the Bissen campsite is in the far north of the country near the Belgian border), and identify whether the 6.5h Mapbox result for Lindau suggests a routing anomaly (e.g., Mapbox choosing a scenic route through Alsace rather than the faster A6/A8 corridor). She will also validate that the proposed Stop 5 positions produce ≤5h legs in both directions (4→5 and 5→6).

**Nara's question:** *Is the 6.5h result a Mapbox routing artefact, or is the drive genuinely that long?*

### Elias Vance — Mandatory Challenger
> "Does this solve a real problem for my users?"

Elias will challenge whether moving Stop 4 from Lake Constance (a beautiful lakeside destination) to Bavaria (a motorway corridor) is a net improvement for the family. He will ask: does the Cork family want to spend the night in the Bavarian Lakes, or is this an optimisation for the spreadsheet that loses the magic of the original vision? He will also flag that moving Stop 5 from the Salzburg foothills to the Wachau Valley changes the character of the trip — Wachau is stunning (UNESCO) but it is further east, which means less time in Salzburg/Austrian Alps country. He will push back on whether we have validated this change with all travellers.

**Elias's dissent trigger:** *We are moving away from a lakeside destination (Lake Constance) and a mountain destination (Salzburg area) towards motorway-optimised positions. The family may care more about the destination than the drive time.*
