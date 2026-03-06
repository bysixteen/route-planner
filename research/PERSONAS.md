# Route Planner — User Personas

**Last updated:** 2026-03-05 — Sprint 000 (Foundation)
**Next review:** Sprint 002

> **Note:** These are the project's *user* personas — the real people who will use the product. They are distinct from the Project Squad personas (the nine archetypes in `.squad/project-squad.md`).

---

## Persona 1: Daniel — The Trip Planner

**Role:** Primary planner. Researches routes, manages bookings, monitors outstanding payments, maintains the reference documents.
**Goal:** Get all 11 campsite stops confirmed before July 2026. Never miss a payment deadline. Have a single reference that shows the full trip status at a glance.
**Frustrations:**
- Booking confirmations are scattered across multiple emails and sites (Booking.com, direct campsite sites, KNAUS, Château du Gandspette)
- The plan keeps changing (Switzerland removed, campsites full) and the reference files need manual updating each time
- Can't quickly see what's confirmed vs TBD vs at risk without reading through everything
- The Next.js app can't connect to Supabase locally, so he's working from the static HTML page
**Key quote:** "I just need to see all 11 stops, what I've paid, what I still owe, how long each drive is, and what I need to do today."

**Urgent actions right now (March 2026):**
- Confirm Koblenz preliminary reservation (Ref 114170) within 3 days
- Pay Camping Bissen balance — €14.70 by 14 March 2026
- Book Lake Constance campsite (Stop 4, 21–23 Jul)
- Book Salzburg/Zell am See campsite (Stop 5, 23–24 Jul)

---

## Persona 2: Hannah — The Co-planner

**Role:** Co-planner and family member. Has opinions on key stops (picked Camping Memling, originally wanted Swiss Alps). Checks the plan on her phone.
**Goal:** Understand the current plan without having to ask Daniel. Confidence that the trip is well-organised and all important things are handled.
**Frustrations:**
- The plan changes (Switzerland was in, now it's out; Seecamp was Stop 5, now it's unknown) and she doesn't always know the current state
- Needs a version she can open on her phone that doesn't require a login or an explanation
- Wants to see the route visually — not just a list of names
**Key quote:** "Can you just send me a link I can open on my phone that shows everything?"

---

## Persona 3: The Kids (Passengers)

**Role:** Passengers. The trip is for them too.
**Goal:** Know what's happening each day — where are we sleeping, what are we doing, how long is the drive.
**Frustrations:** "Are we nearly there yet?" — the classic.
**Key quote:** "How many nights until the race?"

*Note: This persona is low-priority for the current sprint — designing for Daniel and Hannah covers their needs by proxy.*
