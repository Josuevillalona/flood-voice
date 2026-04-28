# FEMA Risk Zones Overlay — Polish Pass - PRD

## Overview
The FEMA flood-risk-zones overlay is already built and toggleable on the dashboard map (`src/components/flood-map.tsx`), but in practice it's hard to see and hard to interpret: fill colors are too translucent against the dark map style so polygons render as ghost outlines, three of the five zone classes (AO, AH, A) get no visible outline at all, the legend lists only two of the five, and clicking or hovering a zone does nothing. Two phases: (1) make the overlay actually visible and complete the legend; (2) add a hover/tap panel that explains what each zone means in plain language and shows the resident or canvasser whether they're standing in a high-risk area.

---

## 1. User Stories

### As a Liaison or CBO Coordinator
- I want to see at a glance which neighborhoods FEMA has classified as high flood risk, so I know where to prioritize canvassing
- I want every FEMA zone class on the map to have a visible color and a legend entry, not just the two most common ones, so I'm not silently missing risk information
- I want to click or hover a zone and read in plain English what the risk classification means, so I don't have to memorize FEMA jargon like "VE" or "AE"

### As a Resident
- I want to find my address on the map and immediately see whether it falls inside a FEMA flood zone, so I know whether the welfare-check program is especially relevant for me

### As a Demo Audience (funders, city partners)
- I want the FEMA layer to look credible and intentional when the team turns it on during a demo — not a faint wash that looks like a rendering bug

---

## 2. Functional Requirements

### Phase 1 — Make the Overlay Actually Visible & Complete the Legend

| # | Requirement | Status |
|---|-------------|--------|
| F1 | When the FEMA Zones layer is turned on, every zone class — VE, AE, AO, AH, A — renders with a fill color that is **clearly visible against the dark map style** (target: easily readable from across the room during a demo). | Todo |
| F2 | Every zone class has a **visible outline** in addition to its fill, so zone boundaries are distinguishable even where fills overlap or sit next to each other. | Todo |
| F3 | The on-map legend lists every zone class the layer renders (VE, AE, AO, AH, A), each with a one-line plain-language description (e.g., "AE — 1% annual flood chance," "VE — coastal high-velocity wave zone," "AO — shallow flooding"). No silent zones. | Todo |
| F4 | Color choices for each zone are documented inline so they survive future styling work, and the highest-risk zones (VE, then AE) read as more alarming than the lower-risk ones (A) — the visual hierarchy matches the risk hierarchy. | Todo |
| F5 | The FEMA Zones toggle button visually reflects whether the layer is currently on (already partially true) and shows a loading state while the GeoJSON is fetching. | Todo |
| F6 | The layer remains usable when the planned **Council Districts** overlay (PRD #3) is also turned on — fills and outlines don't merge into an unreadable wash. Specific styling decisions (e.g., FEMA fills get priority, district overlay gets thinner outlines) are documented. | Todo |

**Why:** A layer that's technically toggled on but visually invisible is worse than no layer — users assume the feature is broken or missing. This phase is what makes the existing FEMA overlay actually do its job.

---

### Phase 2 — Hover / Tap Panel on a Zone

| # | Requirement | Status |
|---|-------------|--------|
| F7 | Hovering (or tapping, on tablet) a FEMA zone polygon highlights it and opens a small panel showing: zone class (e.g., "AE"), one-line plain-language description (e.g., "1% annual chance of flooding — high risk"), and the typical insurance / risk implication in one sentence. | Todo |
| F8 | The panel adapts when the user's cursor is over an area where two FEMA zones overlap or sit on each other's boundary — it lists both, not just whichever rendered last. | Todo |
| F9 | If a sensor pin sits inside the hovered zone, the panel shows the count of sensors in that zone segment (small bonus signal: "3 FloodNet sensors here"). | Todo |
| F10 | On tablet, tapping a zone opens the panel; tapping elsewhere closes it. The pattern matches the council-district hover panel (PRD #3) so users learn one interaction across both overlays. | Todo |

**Why:** The legend tells you what the colors mean once. The hover panel tells you what *this specific spot* means right now. That's the difference between a static map graphic and an interactive risk tool.

---

## 3. Out of Scope

- Replacing the underlying FEMA dataset with a different source (e.g., NFHL revisions, state flood maps, FEMA National Risk Index) — separate decision, separate PRD if pursued
- Address lookup ("type my address, tell me my zone") — separate feature, belongs in a future PRD
- Editing or annotating zones — we treat FEMA's published data as authoritative
- Per-zone historical analytics (e.g., "AE zones in this neighborhood have flooded 4 times in 2 years") — that's where the council-district overlay (PRD #3) does the heavy lifting; FEMA is a static reference layer
- Toggling individual zone classes on/off independently (showing only AE, hiding AO, etc.) — overengineering for current scope

---

## 4. Data Model Changes

### Phase 1
No schema changes. FEMA zone GeoJSON is fetched from the existing proxy endpoint and not stored locally.

### Phase 2
No schema changes. Zone descriptions are static reference text held in a small map keyed by zone class.

---

## 5. Build Order

```
Phase 1 — Visibility, complete legend, coexistence with council districts overlay
  └── Phase 2 — Hover/tap panel with plain-language zone explanation
```

---

## 6. Open Questions

- **Light vs dark map style:** the visibility problem is largely about fill opacity on the dark base map. If a future PRD adds a light map style, the fill opacities chosen for F1 may need a per-style variant. Worth flagging now so we don't paint ourselves into a corner.
- **Plain-language descriptions:** who writes the one-liners for F3 and F7? FEMA's own glossary is the safe source, but the wording is dense — we may want a CBO-side reviewer to make it readable for residents.
- **Order of overlays when both FEMA and Council Districts are on (F6):** does FEMA sit above or below the council-district overlay? Recommendation: FEMA below (it's the static reference), districts above (the dynamic data layer). Confirm.
- **Sensor count inside zone (F9):** nice-to-have or table-stakes? If implementation is heavy (point-in-polygon at hover time), defer to a follow-up.
