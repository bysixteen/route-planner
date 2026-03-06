---
title: "Sprint 001: Sketches"
type: sprint-sketches
status: complete
date: 2026-03-05
sprint: "001"
feeds-from: "brief.md"
---

**TL;DR:** Nine perspectives on redesigning the trip viewer map. Strong consensus on a two-panel layout with visible segment times and a terrain map style. Key tension: POI data quality (Elias) vs. POI discoverability (Leo, Rowan). Ines identifies the sidebar + map toggle as the critical interaction design problem.

---

## Leo Finch — Visual Designer
> "Does this feel like us?"

The current map is functional but cold — a Google Maps clone with coloured dots. It has no personality, no sense of adventure. A family road trip to a Formula 1 race across seven countries deserves a map that feels like it was made for this journey.

Two changes would transform the feeling immediately. First, switch to the Mapbox outdoors style. Suddenly you see mountains, elevation shading, forests, and rivers — the route becomes a journey through a landscape, not a line on a grey grid. Second, replace the flat numbered circles with a richer marker language: a tent icon for campsites, a flag for the race, a camera for attractions. The numbered badge stays, but the icon communicates character before you read anything.

For the segment labels — the drive time callouts on the route — I'd keep them typographically tight. A pill badge with `4h 50m · 485km` in a clean sans-serif, white on a dark background, positioned at the arc of each leg. Not too large. The map is the hero; the labels are its annotations.

Does this feel like us? With the outdoors style and proper iconography — yes. Without those changes, no.

---

## Dr. Lena Petrova — Design Engineer
> "How will we build, test, and maintain this?"

The good news: almost everything we want to build exists in Mapbox GL JS. No new npm packages needed.

**Segment time labels** use `map.addLayer()` with `type: 'symbol'`. The label source is a GeoJSON `FeatureCollection` of `Point` features — one per segment, positioned at the midpoint of each segment's coordinates. We calculate midpoints using the existing segment geometry returned by the Directions API. The `layout.text-field` references the `label` property on each feature (e.g. `'4h 50m · 485km'`). Collision detection is handled by Mapbox automatically — labels that would overlap are hidden. This is a solved pattern.

**POI layer** is trickier. `map.queryRenderedFeatures()` queries what's already painted on the map canvas. With the outdoors style, natural features (peaks, lakes, viewpoints) and cultural features (castles, historic sites) render by default. We can filter by `layer.id` to surface only the categories we want. The toggle is a React state bit that adds/removes the POI highlight layer.

**Segment colour coding** is straightforward: parse duration from the segment response, compare against `maxDrivingMinutes`, set line colour per segment using `map.addLayer()` with a `match` expression.

**Sidebar**: a fixed 300px `<aside>` in the trip page layout, replacing or augmenting the existing tab system. Server-side data, no new fetches.

Maintenance overhead is low. The only fragile piece is the POI layer: `queryRenderedFeatures` depends on what's visible in the viewport and the current zoom level. We should document this constraint clearly.

---

## Marcus Thorne — Senior Developer
> "What are we NOT building here?"

Let me be explicit about the scope boundary, because scope creep is how this becomes a month-long project.

**We are NOT building:**
- Real-time traffic, ETAs, or live route updates — this is a planning tool, not navigation
- Custom POI database or content management for points of interest
- Navigation handoff (Google Maps / Apple Maps deep links) — that's Sprint 006
- Changes to `editor-map.tsx` — the viewer and the editor are separate concerns
- Mobile layout — Hannah's phone experience is Sprint 004
- Offline mode — Sprint 006
- Animated route drawing or "journey mode" playback
- Multiple route options or alternative routing

**Architectural flags:**
The POI layer using `queryRenderedFeatures` is viewport-dependent — it only returns what's currently rendered on the canvas. This means POIs are not reliably enumerable server-side. Don't try to persist, search, or paginate them. They are a decorative, non-authoritative layer.

Segment labels will need a minimum zoom threshold — below zoom 5 on a continental route, they'll overlap badly. Set `layout.text-optional: true` in the Mapbox symbol layer so Mapbox hides them gracefully rather than overlapping.

The 300px sidebar is a desktop-only pattern. When we revisit mobile (Sprint 004), we'll likely replace it with a bottom drawer. Don't design the sidebar to be "responsive" for now — that's premature.

---

## Kira Sharma — Developer
> "What does the implementation actually look like?"

Here's what the code paths actually look like for each feature.

**Segment labels:** The Directions API already returns `routes[0].legs[i].duration` and `routes[0].legs[i].distance`. In `drawRoute()` in `trip-map.tsx`, I'd extract the midpoint of each leg's geometry (average of all coordinates, or just the middle coordinate in the array). Build a GeoJSON FeatureCollection of Points with a `label` property. Add a new symbol layer called `'segment-labels'` with `text-field: ['get', 'label']`, white text, dark halo, `text-size: 12`, `symbol-placement: 'point'`, `text-optional: true`. Clean it up in the map cleanup function.

**Segment colour coding:** Instead of one `'route'` line layer, add multiple layers — one per segment — with different paint colours. Or use a single layer with a Mapbox data-driven expression that reads a `health` property ('green'|'amber'|'red') from the GeoJSON feature. The latter is cleaner. We already have duration per segment; just add the health classification at the point where we build the GeoJSON.

**POI toggle:** A `showPOIs` boolean in React state. When `true`, call `map.queryRenderedFeatures({ layers: ['poi-label', 'national-park', 'landuse'] })` (layer IDs from the Mapbox outdoors style) and add a circle layer highlighting those features. When `false`, remove the layer. Needs a `useEffect` watching `showPOIs`.

**Sidebar:** A `<aside className="w-[300px] ...">` added to the trip page layout, showing stop cards with segment time/distance rendered inline — the data already exists in the trip's `segments` array.

**Break stop markers:** A Point feature at the midpoint of each leg's route geometry with a custom `'pause'` icon. Rendered as a separate symbol layer.

Estimated effort: ~6–8 hours for the full set of features, assuming existing segment data is reliable.

---

## Dr. Aris Thorne — Strategist
> "What is the real problem we are trying to solve?"

Before we redesign the map, I want to name the actual problem clearly: Daniel cannot see whether the trip is safe to drive.

He has planned 11 stops across 7 countries with a hard constraint of 5 hours per leg. The current map shows him the route, but he cannot confirm the constraint is met without opening each popup. The trip planner's core anxiety — "are we going to be exhausted on day 3?" — is not answered by the current UI.

Everything else (POIs, break stops, terrain tiles) is enhancement. The core problem is: **drive time visibility per leg**.

This reframe matters because it creates a priority order: (1) segment times visible without interaction, (2) colour-coded leg health — is every leg green?, (3) sidebar itinerary for detailed review, (4) POI layer as optional enrichment, (5) break stop suggestions as optional enrichment.

If we build only items 1 and 2, the sprint succeeds. Items 4 and 5 are delightful but not essential to the problem statement. Don't let them delay items 1 and 2.

I'd also push back gently on "break stop suggestions at the 2.5h midpoint." The midpoint of a route segment is a geometric calculation — it might land in the middle of a motorway or an industrial park. If we suggest breaks, we should use Mapbox's POI query to find the nearest rest area, town, or viewpoint at roughly the midpoint — not just a point in space. Otherwise we're adding visual noise without navigational value.

---

## Rowan Vale — Craftsman
> "What is the feeling we want to create?"

A family road trip to Hungary for a Formula 1 race is not a logistics exercise. It's an adventure. The kids are going to ask "what's that mountain?" and "can we stop at that castle?" The parents are going to feel the anticipation building from the moment they start planning. The map should carry that feeling.

Right now, the map says: "here is a sequence of coordinates." What it should say is: "here is your journey."

The Mapbox outdoors style is the single highest-leverage change. The moment you switch to terrain tiles, the Alps appear as mountains, the Danube Valley becomes a gorge, the Bavarian lakes glimmer. The route line stops being abstract and becomes geographical.

The POI discovery layer should feel like flipping through a guide book, not querying a database. Castles should look like castles. Mountain peaks should have names. Lakes should be labelled. The outdoors style already does most of this — we're just making it visible and interactive.

For break stops — I'd frame them as "discoveries" not "mandatory rests." The copy should say "something worth pausing for" rather than "recommended break." A small marker with a binoculars or star icon. Tap it and see "Heidelberg Castle — 12km from your route." That transforms a logistics requirement into a moment of delight.

The feeling we want: the night before departure, Daniel opens the map and shows the kids where they're going. They trace the route with their fingers. They see the mountains, the lakes, the race circuit. They feel the journey before it begins.

---

## Elias Vance — Client
> "Does this solve a real problem for my users?"

I'll play devil's advocate here — not to block this sprint, but to sharpen it.

**On POI data quality:** The team is planning to use `queryRenderedFeatures` on the Mapbox outdoors style to surface "castles, mountains, lakes, villages." This sounds great. But I've used Mapbox's rendered feature queries on rural European routes before and the data is inconsistent. Some castles appear; others don't. Some mountain peaks are labelled; others — including iconic ones — are missing or mislabelled. If Daniel zooms to Bavaria and the Zugspitze isn't visible, or he zooms to the Wachau and Dürnstein Castle doesn't appear, the POI layer is not just unhelpful — it actively misleads. The team should test the POI layer against the actual route before committing to it as a feature.

**On Hannah:** I note that this sprint explicitly defers Hannah's phone experience to Sprint 004. Hannah is the co-planner who checks the trip status on her phone. She is Persona 2. Every time we build a desktop-first feature and defer mobile, we push her further out of the experience. I accept the prioritisation for this sprint, but I want it on record: the sidebar + map two-panel layout will not work on a phone screen, and Sprint 004 needs to be run before we have a complete product.

**On the core value:** Segment times visible without interaction, and colour-coded leg health — yes, these solve a real problem for Daniel. I support this sprint. The enhancements (terrain style, POI toggle, break markers) are worthwhile if data quality holds. My condition is: test the POI data on the actual Cork family route before shipping the POI layer.

---

## Nara Shin — UX Researcher
> "What does the evidence say?"

I reviewed three analogous products — Google Maps, Waze, and Apple Maps — plus two route planning tools, Roadtrippers and Furkot. The patterns are consistent.

**What all successful route planning tools share:**
1. **Segment overview visible without interaction.** Google Maps shows the total duration and the breakdown (e.g. "4h 30m on motorways") in the sidebar before you ask. You never have to click to see how long a leg takes.
2. **Map and itinerary always co-visible on desktop.** The pattern is invariably: sidebar (30%) + map (70%). No tool hides the itinerary behind a tab on desktop. This is the single biggest departure from the current Cork route planner design.
3. **Terrain style for scenic routes.** Roadtrippers uses a custom outdoors-adjacent tile set. Google Maps has a terrain toggle. Apple Maps renders elevation by default on its standard style. None of them use a flat grey grid for road trip planning.

**POI patterns:**
Roadtrippers built its entire business model on curated POIs along routes — "things worth stopping for within X miles of your route." Their model requires a proprietary database, which we can't build. Furkot uses OpenStreetMap POI data. Mapbox outdoors rendered features are a reasonable proxy — but the evidence suggests that user-curated or editorially-selected POIs dramatically outperform algorithmic ones for delight. This supports Elias's concern about data quality.

**Break stop patterns:**
Waze suggests petrol stations and rest areas based on proximity and current fuel level. Apple Maps suggests "break time" after 2 hours of continuous driving. The Cork planner's concept of a "break at the midpoint" is architecturally simpler and honest — it doesn't pretend to know fatigue levels.

**Evidence verdict:** Two-panel layout and segment time visibility are industry-standard patterns with strong validation. POI layer quality is the primary risk.

---

## Ines Alvarez — UX Designer
> "Where will users get stuck?"

Let me trace the full interaction flow and identify every friction point.

**Landing on the trip page:**
Current: three tabs (Map / Stops / Both). User has to choose before seeing anything. This is an extra decision step with no preview. Proposed change: default to the two-panel layout (sidebar + map visible simultaneously). Remove or reduce the tab system.

**Reading segment times:**
Current: click a marker → popup appears → find the drive time field. Proposed: segment times visible in the sidebar itinerary (never requires interaction) + label on the route line. This is a significant improvement in cognitive load.

**POI toggle:**
Where does the toggle button live? Options: (a) map controls area (top-right, next to zoom), (b) toolbar above the map, (c) sidebar header. I'd suggest (a) — it keeps the POI layer clearly associated with the map, not the itinerary. The toggle should show a clear "on" state (filled icon, accent colour) vs "off" state (outlined icon, muted).

**Break stop markers:**
When a break stop marker is tapped/clicked, it should show a small popup with "Suggested break area" and a brief note (e.g. "Approx. 2h 30m from Luxembourg — look for services on the A8 near Augsburg"). This is useful. The risk is that it adds too many clickable elements to the map — combined with stop markers and POI features, the map becomes cluttered. Solution: break markers should only appear at zoom ≥ 7 (detailed view) and should be visually subordinate to stop markers (smaller, lower z-index).

**Mobile dead end:**
The sidebar + map layout does not adapt to small screens. If Hannah opens this on her phone, the sidebar will likely collapse or overflow. The `<aside>` should have a `hidden md:block` class so it simply doesn't appear on small screens — showing only the map — rather than breaking. This is a safety net, not a solution (Sprint 004 fixes this properly).
