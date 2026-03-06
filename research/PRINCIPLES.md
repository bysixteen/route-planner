# Route Planner — Design & Technical Principles

**Last updated:** 2026-03-05 — Sprint 002 (Trip Viewer Data Concepts)
**Next review:** Sprint 003

This document captures the core principles that guide design and technical decisions on this project. It is a living document, updated at the end of each sprint.

---

## Design Principles

- **Phone-first:** The campsites.html reference page must be usable on a phone with one hand at a campsite reception. If it requires pinching, horizontal scrolling, or a login, it has failed.
- **One glance = full picture:** Booking status, cost, ref, and check-in time must all be visible without scrolling or tapping into a detail view. The card design is the interface.
- **Warning visibility:** Urgent actions — preliminary bookings, outstanding payments, 3-day confirmation windows — must be unmissable. Red border, bold text, top of checklist.
- **British English throughout:** Dates as "18 July 2026", currency as €/£ not $, spellings as colour/favourite/travelled/centre (per CLAUDE.md).
- **Status honesty:** Never show a stop as "booked" unless there is a confirmed booking reference. TBD is honest; pretending it's booked is not.

## Map Viewer Principles

- **Segment drive times must be visible without interaction:** Drive time and distance for each leg must be readable in the sidebar and as route labels — no click required. Established Sprint 001.
- **Map viewer uses Mapbox outdoors style:** `mapbox://styles/mapbox/outdoors-v12` for terrain, elevation, and landmark visibility on the trip viewer. Established Sprint 001.
- **Colour-code route segments by drive time health:** Green < 4h, Amber 4–5h, Red > 5h — using the `maxDrivingMinutes` trip constraint. Established Sprint 001.
- **POI discovery layers must be validated against the actual route:** Do not ship a discovery toggle without verifying it surfaces meaningful results on the Cork family route. Established Sprint 001.
- **Booking status is the primary sidebar signal:** Booking badges (confirmed/pending/not booked) are the highest-value data point on stop cards — they answer "Is everything sorted?" Established Sprint 002.
- **Empty data fields are hidden, not dashed:** If a field has no data, it must not appear — no "—", no "€0", no placeholder. This prevents the sidebar from looking like a half-filled spreadsheet. Established Sprint 002.
- **Day grouping for trips with 5+ stops:** Stops grouped by arrival date with day headers create narrative structure ("Day 3 — Monday 21 July") rather than a flat database list. Falls back to flat list when dates are missing. Established Sprint 002.

## Technical Principles

- **Static-first:** The primary reference document (`public/campsites.html`) must work without a server — open from any device, no login, no API keys exposed beyond Mapbox (client-safe).
- **No new dependencies without discussion:** Every new package requires explicit discussion first (per CLAUDE.md). Prefer what's already installed.
- **Metric units only:** km not miles, per CLAUDE.md. All Mapbox distance formatting in km.
- **TypeScript strict mode throughout:** No `any` types, no type assertions without justification.
- **Tailwind CSS only in the Next.js app:** No inline styles in `.tsx` files. Use Tailwind classes or CSS variables.
- **All Supabase queries in `lib/supabase/queries.ts`:** No database calls in components.
- **Max 25 Mapbox waypoints:** The Directions API has a 25-stop limit — plan around this for longer routes.

## What "Good" Looks Like on This Project

A well-executed piece of work on this project:
1. Works on a phone at a motorway services with one bar of signal
2. Shows the urgent things first — preliminary bookings and outstanding payments are always visible
3. Requires no login, no app install, no explanation to a family member
4. Keeps all drive days within the 5-hour maximum
5. Has correct British English spelling and date formats throughout
