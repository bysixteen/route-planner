# Sprint 000 — Foundation

**Date:** 2026-03-05
**Status:** Complete
**Personas:** All

---

## What We Did

This sprint established shared context and resolved the most pressing planning issues for the Hungarian GP 2026 road trip.

### Decisions Made

1. **Route revised — Switzerland removed.** Luxembourg → Interlaken → Zell am See was a ~7h driving day, violating the 5h maximum. Interlaken (Lazy Rancho) was not yet booked (opens 2 April 2026). Route revised to go via Stuttgart + overnight at Lake Constance (Lindau area).

2. **Stop 4 → Lake Constance (Lindau, Germany).** ~3.5h from Luxembourg, ~2.5h from Salzburg area. Both within the 5h limit.

3. **Camping status updated.** 5 confirmed, 1 preliminary (Koblenz ⚠️), 5 still to book.

### Work Completed

- `public/campsites.html` — map updated with new STOPS array (Lake Constance as Stop 4), drive time colour coding (green/amber/red), legend
- `public/campsites.html` — all 6 confirmed bookings updated with refs, check-in/out times, costs, payment status
- `public/campsites.html` — progress bar, outstanding decisions, cost summary, route section all updated
- `CAMPSITES.md` — full rewrite with new route, all booking data, driving day summary table
- `public/hungarian-gp-2026.ics` — Apple Calendar file with all 14 events, download button added
- `app/trip/[id]/page.tsx` — per-segment drive times added between stop cards
- `components/map/trip-map.tsx` — map marker popups now show drive time to next stop

### Urgent Actions (carry forward)

1. ⚠️ **Confirm Koblenz** (Ref 114170) within 3 days — preliminary reservation will auto-cancel
2. ⚠️ **Pay Camping Bissen balance** — €14.70 by 14 March 2026
3. **Book Lake Constance campsite** (Lindau area, 21–23 Jul)
4. **Book Salzburg/Zell am See campsite** (23–24 Jul) — Seecamp/Woferlgut/Grubhof all full, try Camping Bad Neunbrunnen am Walksee

---

## Dissent Recorded

See `research/dissent-register.md` for two dissenting views logged by Elias Vance (Switzerland removal, static HTML fragility).
