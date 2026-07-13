# Route Planner — Design Intent

A family road-trip planner rebuilt in the **Tesla cockpit** design language: a
monochrome dark canvas, a single volt-blue accent, geometric type with
weight-driven hierarchy, and glanceable data. The map is the canvas; information
floats over it in glass panels. Dark only (a light theme is applied for print).

Inspiration: Tesla touchscreen UI — dark monochrome nav, floating cards, the
Energy graph, and range/trip readouts.

## Colour

Defined in `app/globals.css`. Hierarchy comes from elevation + weight, not colour.

| Role | Token | Value | Use |
|---|---|---|---|
| Canvas | `--background` (void) | `#0B0C0E` | Page + behind the map |
| Panel | `--card` | `#16181B` | Floating cards, rail, chips |
| Raised | `--muted` (panel-2) | `#1F2226` | Insets, stat wells |
| Line | `--border` | `#2A2E33` | Hairline dividers |
| Ink | `--foreground` | `#F5F6F7` | Primary text |
| Ink dim | `--muted-foreground` | `#8A9099` | Labels, secondary |
| **Accent** | `--primary` / `--highlight` (volt) | `#3E6AE1` | Route, primary, "Next", focus |
| Alert | `--destructive` / health-bad | `#E31937` | Over drive-limit, warnings |
| Good | `--health-good` | `#2FBF71` | Booked, within limit |
| Warn | `--health-warn` | `#E8B23A` | Not booked, near limit |

**Volt is the one accent.** Everything else is greyscale + the three status
colours. Health colours encode driving time vs `maxDrivingMinutes`:
good `< 4h`, warn `≤ limit`, bad `> limit`.

## Type

One geometric family, Gotham-style, hierarchy by weight.

| Role | Family | Notes |
|---|---|---|
| Display / numerals | **Manrope** (`--font-display`, `.font-display`) | Big **thin** stat numbers, titles. `tabular-nums`. |
| Body | Geist (`--font-sans`) | Supporting text. |
| Data | Geist Mono (`.coordinate`) | Coordinates, refs. |

## Signature — the Drive Energy graph

`components/trip/drive-energy-graph.tsx`. Tesla's energy chart, reframed as
**driving effort per day**: a volt area-line across the days, the daily
drive-limit as a dashed threshold, points glowing green/amber/red against it.
The one memorable element; everything around it stays quiet.

## Layout

- **Cockpit** (default trip view) — dark map canvas fills the screen; a floating
  **glass rail** (`.glass`) holds range-style stats, the Drive Energy graph, and
  a tap-to-focus stop list. Left rail on desktop, bottom sheet on mobile.
- **Itinerary** — the full day-by-day timeline (numbered spine, per-stop dark map
  thumbnails, payment balance, vignette docs) for detail + print.
- **Map** style: Mapbox `dark-v11`, route as a glowing volt line.

## Components

shadcn/ui re-skinned via tokens. `Button variant="highlight"` = volt.
`Badge variant="booked|unbooked|highlight"` for status.

## Principles

- Map is the canvas; chrome floats and stays minimal.
- Glanceable first: big thin numbers, one accent, generous negative space.
- Both personas served: driver gets the energy graph, payment balance, print;
  passenger gets the Next-stop focus + one-tap Satnav/booking copy.
- Print flips to ink-on-paper (see `@media print` in `globals.css`).
