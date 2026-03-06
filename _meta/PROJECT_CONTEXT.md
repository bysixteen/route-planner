---
title: "Route Planner — Project Context"
type: project-context
version: "1.0"
date: 2026-03-05
---

# Route Planner — Project Context

> This file is read by `/init-project-squad` to pre-populate your living documents.

---

## 1. Project Overview

**Project name:** Route Planner (internal codename: *Dexter*)

**One-line description:** A personal road trip planning tool that helps the Cork family plan, book, and navigate a multi-country campervan trip to the 2026 Hungarian Grand Prix.

**Primary goal (the North Star):** By July 2026, the Cork family departs for the Hungaroring with every campsite booked, every driving day within the 5-hour limit, and a single reference page on the phone that shows exactly where they're sleeping, what they've paid, and how long each drive takes.

**What problem does this solve today?** Trip planning is scattered across emails, spreadsheets, browser tabs, and WhatsApp. There's no single source of truth for booking status, check-in times, outstanding payments, or driving times. The family have 11 campsite stops, partial bookings, urgent actions (a preliminary reservation about to expire), and no map that shows the full picture.

**What is explicitly out of scope?**
- Not a public product — this is a private family tool
- Not a booking engine — we link out to campsite booking sites
- Not a navigation app — we use Mapbox for visualisation only, not turn-by-turn
- Not a social or sharing feature
- Not multi-trip or multi-family (one trip, one family)

---

## 2. The Users

**Persona 1: Daniel (Trip Planner)**
- **Role:** Primary planner — researches routes, manages bookings, monitors outstanding payments
- **Goal:** Get everything booked and confirmed before the trip; never miss a payment deadline or a campsite that's about to cancel
- **Frustration:** Information is scattered — confirmation emails, Booking.com, direct campsite sites, and WhatsApp all have different pieces of the picture. Can't quickly see what's booked vs TBD vs at risk.
- **Key quote:** "I just need to see all 11 stops, what I've paid, what I still owe, and how far the drive is."

**Persona 2: Hannah (Co-planner / Family)**
- **Role:** Co-planner — has opinions on specific stops (picked Camping Memling, wanted Swiss Alps originally), checks the plan on her phone
- **Goal:** Understand the plan without having to ask Daniel; want confidence the trip is well-organised
- **Frustration:** The plan changes (Switzerland removed, campsites full) and it's hard to stay current
- **Key quote:** "Can you just send me a link I can open on my phone that shows everything?"

---

## 3. The Project Squad — Real Team Mapping

| # | Name | Role | Mapped To |
|---|------|------|-----------|
| 1 | Leo Finch | Visual Designer | N/A |
| 2 | Dr. Lena Petrova | Design Engineer | N/A |
| 3 | Marcus Thorne | Senior Developer | N/A |
| 4 | Kira Sharma | Developer | Daniel Cork |
| 5 | Dr. Aris Thorne | Strategist | N/A |
| 6 | Rowan Vale | Craftsman | N/A |
| 7 | Elias Vance | Client / External Voice | The Cork Family |

---

## 4. Design Principles

**Design Principles**
- Phone-first: the campsites.html reference page must be usable on a phone with one hand at a campsite reception
- One glance = full picture: booking status, cost, ref, check-in time must all be visible without scrolling or tapping
- Warning visibility: urgent actions (preliminary bookings, outstanding payments) must be unmissable — red border, bold text, prominent placement
- British English throughout: dates as "18 July 2026", currency as €/£, spellings as colour/favourite/travelled

**Technical Principles**
- Static-first: the primary reference document (`public/campsites.html`) must work without a server — open from any device, no login required
- No new dependencies without discussion (per CLAUDE.md)
- Metric units: km not miles, per CLAUDE.md
- TypeScript strict mode throughout
- Tailwind CSS only — no inline styles in the Next.js app

---

## 5. Known Decisions

| Decision | Date | Rationale | Rejected Alternative |
|----------|------|-----------|----------------------|
| Dropped Switzerland (Interlaken) from route | 2026-03 | Luxembourg → Interlaken → Zell am See was a ~7h driving day, violating the 5h max rule. Not yet booked. | Keep Lazy Rancho — rejected because Switzerland stop was unbooked and creates a 7h day |
| Added Lake Constance (Lindau) as Stop 4 | 2026-03 | Stuttgart routing keeps all legs ≤5h; Lake Constance is a natural overnight between Luxembourg and Salzburg area | Colmar (France) as day break — rejected because it added a stop without overnight |
| Removed Switzerland/Liechtenstein from itinerary | 2026-03 | Route change makes CH/LI inaccessible without significant detour | Keep as optional drive-through — rejected because it adds 2h+ |
| Supabase as backend (replaced Sanity) | 2025 | PostgreSQL with typed queries, simpler than headless CMS for trip data | Sanity CMS — rejected, over-engineered for structured trip data |
| Mapbox GL JS for maps | 2025 | Best-in-class for custom route rendering and directions API | Google Maps — rejected, more expensive at scale |
| Static campsites.html as primary reference | 2026-03 | Works offline, no auth, shareable link, immediate — Next.js app requires Supabase creds not in workspace | Next.js app only — rejected because Supabase not configured in workspace |

---

## 6. Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | Next.js 15 (App Router) | TypeScript strict mode |
| Styling | Tailwind CSS 4 + Shadcn/ui | No inline styles |
| Maps | Mapbox GL JS v3 + Directions API | Access token: NEXT_PUBLIC_MAPBOX_TOKEN |
| Database | Supabase (PostgreSQL) | Queries in lib/supabase/queries.ts |
| Hosting | Vercel | |
| Static reference | public/campsites.html | CDN Mapbox, no server required |
| Language | TypeScript (strict) | |

---

## 7. Open Questions (Sprint Backlog Seeds)

**Feature questions**
- How does Daniel update a booking status and ref after receiving a confirmation email, without editing raw HTML?
- How does the family share a live view of the current trip status with each other (without a login)?
- How do we handle the trip on the road — offline access, driving directions handoff to Google Maps/Apple Maps?
- Should the Next.js app be the primary interface, and campsites.html generated from it?

**Technical questions**
- Can we auto-generate campsites.html from Supabase trip data (so updates flow through one place)?
- Should Supabase RLS be set up so the trip page is publicly readable without a login?
- Is the Mapbox Directions API waypoint limit (25) a constraint for longer trips?
- How do we handle the trip going offline — service worker, cached HTML?

---

## 8. Constraints

**Timeline:** Trip departs 17 July 2026 (~4.5 months). All campsites must be booked by June 2026. Koblenz preliminary reservation (Ref 114170) must be confirmed within 3 days or it cancels.

**Budget:** Personal project — minimise running costs. Supabase free tier, Vercel free tier. Mapbox free tier (~50k map loads/month).

**Regulatory / compliance:** None. Personal family use only.

**Team:** Daniel Cork — solo developer. Claude Code as pair programmer.

**Existing systems:** Supabase project already set up (URL and anon key in production Vercel env vars, not in local workspace). Mapbox token: `pk.eyJ1IjoiYnlzaXh0ZWVuIiwiYSI6ImNta3U5amtndTF0NDgzZnNlMmlwdjEwdjkifQ.PWuMX7VkQqP-L6IYTGeyGA`. Existing deployment at https://dexter-f1.netlify.app/ (older plan, useful as reference).

---

## 9. Sprint Plan

**User journey map**

| # | Moment | Primary User | Sprint Type | Priority |
|---|--------|-------------|-------------|----------|
| 0 | Foundation — establish shared context | All | Sprint 000 | Must |
| 1 | Daniel sees all booking statuses at a glance | Daniel | Lite Sprint | Must |
| 2 | Daniel books remaining campsites (Stops 4, 5, 10) | Daniel | Research Spike | Must |
| 3 | Family opens a shareable trip overview on their phones | Hannah | Full Sprint | Must |
| 4 | Trip is on the road — offline access and nav handoff | Daniel | Spike | Should |
| 5 | Next.js app becomes the primary interface (replaces HTML) | Daniel | Full Sprint | Could |

**Sprint cadence:** Ad hoc — run when a decision or design question blocks forward progress.

**Definition of done:** All Must campsites booked, all outstanding payments tracked, trip page works on mobile, Koblenz confirmation sent.

---

## Notes

- The campsites.html file is the **primary artefact** right now. The Next.js app (localhost:3004) can't connect to Supabase in the local workspace.
- The Koblenz booking (Ref 114170) is the most urgent action — preliminary reservation, 3-day confirm window.
- Camping Bissen (Luxembourg) has a payment due 14 March 2026 (€14.70) — imminent.
- Switzerland was removed from the route in March 2026 to fix a 7-hour driving day. Lake Constance/Lindau is the replacement Stop 4.
- Stops 4 (Lake Constance) and 5 (Salzburg/Zell am See area) are still unbooked — all originally considered options (Seecamp, Woferlgut, Grubhof) are full.
