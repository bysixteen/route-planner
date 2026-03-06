# Route Planner — Memory

## Sprint Status
- Sprint 000: Complete (Foundation)
- Sprint 001: Complete (Map Interface UI — Rich Journey View)
- Next sprint: Sprint 002

## Sprint 001 Key Decisions
- Trip viewer → two-panel desktop layout (300px sidebar + full-height map)
- Mapbox outdoors style: `mapbox://styles/mapbox/outdoors-v12`
- Segment time labels on route line via Mapbox symbol layer
- Colour-coded legs: green <4h, amber 4–5h, red >5h
- POI toggle gated on data quality validation against actual Cork route
- Creative brief ready: `research/sprints/sprint-001-map-ui/creative-brief.md`

## Project Patterns
- Sprint research files: `research/sprints/sprint-NNN-topic/` (brief, sketches, decision, creative-brief, ideas, synthesis, summary.json)
- Site pages: `site/sprints/sprint-NNN/index.html` — uses `../../styles.css` + `../../layout.js`
- Site nav driven by `site/sprints.json`
- Dissent always goes in `research/dissent-register.md`
- Sprint format in sprints.json: number as "S001", type as "sprint" or "spike"

## Key Files
- `components/map/trip-map.tsx` — 189-line viewer map (target for Sprint 001 implementation)
- `app/trip/[id]/page.tsx` — trip page with tab system (replace with two-panel layout)
- `components/map/editor-map.tsx` — editor map (do NOT touch in Sprint 001 impl)
- `lib/types.ts` — Stop, Trip, EditorStop types
- `research/DECISIONS.md`, `research/PRINCIPLES.md`, `research/sprint-status.md` — living docs

## User Preferences
- British English throughout (colour, favourite, km not miles)
- No new dependencies without discussion
- Metric units only
- Desktop-first for Sprint 001; Hannah's phone = Sprint 004
