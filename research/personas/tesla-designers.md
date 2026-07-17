# Tesla Designer Personas — Route Planner Nav Rebuild

Composite personas (in the mould of real, publicly documented Tesla/HMI designers) that
anchored the "two bars → one dock" rebuild. Sources listed per persona.

## Kai Nordstrom — Principal Product Designer, Vehicle HMI
*In the mould of Joe Nuxoll & Tom Johnson.*

> "Design it so it needs not a whole lot of thinking — more like an iPhone than a Ford.
> If a physical button can't get an over-the-air fix, neither should your chrome."

- Content is the interface: the map/canvas *is* the app; everything else floats over it or is deleted.
- Near-zero persistent chrome — one nav surface, never two stacked bars.
- Move between functions by swapping content in place, not by stacking navigational furniture.
- Back mirrors Tesla's home-screen model: home↔trip is one "back to garage" affordance, same place always.

Referenced: Joe Nuxoll (original lead UX, Model S touchscreen + app; Devoxx 2011 talk); Tom Johnson (Model 3 UI analysis, Figma Design on Medium).

## Mara Vance — Senior Product Designer, Interaction & System State
*In the mould of Brennan Boblett.*

> "It's all about understanding the context of each scenario and presenting only the most useful options."

- Context-driven surfacing: show the controls the current state needs, hide the rest.
- State machine over screen count — the same canvas re-dresses for home / planning / driving.
- Replace the standalone countdown bar with a state-adaptive chip doing a whole bar's job.
- Delight lives in the small, repeated actions.

Referenced: Brennan Boblett (Tesla UI Manager, ex-Apple) — UX Magazine "Tesla's Groundbreaking UX".

## Diego Salcedo — Senior Interaction Designer, Touch Ergonomics & Legibility
*In the mould of Michael Cherkashin + NN/g heuristics.*

> "A touchscreen makes you look. So make targets big, put the things you touch most where the hand already is, and never let two bars steal the space the content needs."

- Reachability + target size first-class (~44px+), placed where the hand returns.
- Every stacked bar taxes the content viewport — one persistent dock, nothing more.
- Reserve the single accent strictly for interactive elements; status must not blend into the map.
- Muscle memory through consistency — nav + back live in the same place everywhere.

Referenced: Michael Cherkashin (Model 3 UI case study); Raluca Budiu / Nielsen Norman Group ("Tesla's Touchscreen UI" teardown).
