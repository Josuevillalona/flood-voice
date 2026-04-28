# Council District Map Overlay - PRD

## Overview
Add a toggleable NYC City Council District overlay to the existing dashboard map (`src/components/flood-map.tsx`). The overlay reuses the same pattern as the existing FEMA zones layer: a dedicated button turns districts on and off, the polygons scale automatically as the user zooms, and each district gets an always-visible label showing how many flood events it's seen in the last 30 days. Hovering a district opens a small panel with deeper detail — number of sensors that triggered and the highest flood depth recorded in the district, both over the last 30 days. Three phases: (1) static polygon overlay with toggle and zoom-scaling, (2) always-visible per-district flood-event count, (3) hover panel with sensor and depth detail.

---

## 1. User Stories

### As a Liaison or CBO Coordinator
- I want to see City Council Districts drawn on the map so I can talk to elected officials about flooding by their district
- I want a single number per district that tells me at a glance which areas have had the most flooding lately, so I can prioritize where to canvass and which CBO partners to push resources toward
- I want to hover over a district and see how many sensors triggered and the worst flood depth it saw in the last 30 days, without having to click into a separate dashboard
- I want to be able to turn the district overlay off when I'm focused on individual sensors, so it doesn't clutter the map

### As a Resident or Public Viewer
- I want to see at a glance whether my district has been a flood hotspot recently, so I know how seriously to take warnings

---

## 2. Functional Requirements

### Phase 1 — Toggleable District Overlay

| # | Requirement | Status |
|---|-------------|--------|
| D1 | A new "Council Districts" button is added to the map's overlay controls (next to the existing FEMA Zones button). Clicking it turns the district overlay on or off. | Todo |
| D2 | When turned on, the map shows the boundaries of all 51 NYC City Council Districts, sourced from NYC Open Data. | Todo |
| D3 | District polygons scale automatically as the user zooms in and out — they stay aligned to the underlying geography at every zoom level. | Todo |
| D4 | District polygons render with a translucent fill and a clear outline, styled so they don't visually clash with the existing FEMA zones layer if both are turned on at the same time. | Todo |
| D5 | The overlay loads on demand (only when the user first turns it on), and remembers its on/off state for the rest of the session. | Todo |

**Why:** The FEMA zones overlay already follows this exact pattern, and reusing it keeps the map controls predictable for users. Phase 1 ships a working overlay even if the data layer (Phase 2) takes longer.

---

### Phase 2 — Always-Visible Flood-Event Count Per District

| # | Requirement | Status |
|---|-------------|--------|
| D6 | Each district shows a label in the center with the **district name** and the **number of flood events recorded in that district over the last 30 days**, rendered like the reference screenshot ("Yorkville 3,145"). | Todo |
| D7 | A "flood event" uses the existing FloodNet definition already in the codebase: a sensor reading of ≥50mm (~2 inches) depth. The 30-day window slides — recomputed each time the user opens the map. | Todo |
| D8 | District labels are hidden below a city-wide zoom threshold (around borough-level zoom) and appear once the user zooms in further — avoids 51 overlapping labels at full-city view. | Todo |
| D9 | Districts are color-graded by event count using a **relative gradient**: the district with the highest count in the last 30 days is the darkest, the district with the lowest is the lightest, others fall on the gradient between them. The scale is recomputed each time the layer loads, so hotspots always stand out regardless of overall flood activity. | Todo |
| D10 | If the FloodNet API is unreachable, districts still draw with their names but no counts; a small notice on the map indicates "flood event data unavailable." | Todo |

**Why:** A polygon with no number on it is wallpaper. The whole point of this overlay is letting a coordinator scan the city and instantly see where flooding is concentrated — which means the count has to be on the map without any interaction.

---

### Phase 3 — Hover Panel with Sensor & Depth Detail

| # | Requirement | Status |
|---|-------------|--------|
| D11 | Hovering a district highlights it (slightly darker fill) and opens a small panel anchored to the cursor showing: district name, **sensors triggered in last 30 days**, **highest flood depth recorded in last 30 days** (in inches and millimeters), and the count from D6 for context. | Todo |
| D12 | "Sensors triggered" is a count of distinct sensors located in that district that recorded at least one ≥50mm reading in the last 30 days. The mapping from sensor → district uses FloodNet's existing `council_district` metadata field (no spatial join needed). | Todo |
| D13 | "Highest flood depth" is the single largest depth reading across all sensors in the district within the 30-day window, with the date and sensor name shown alongside. | Todo |
| D14 | Hover behavior also works on tap for tablet users — tapping a district opens the same panel and stays open until the user taps elsewhere. | Todo |
| D15 | If a district has zero sensors or zero events, the panel says "No sensors in this district" or "No flood events in last 30 days" rather than showing zeros without context. | Todo |

**Why:** The summary count from Phase 2 answers "where is flooding happening." The hover panel answers "how bad is it." Splitting them lets Phase 2 ship as a useful product on its own; Phase 3 layers in detail without blocking Phase 2.

---

## 3. Out of Scope

- Historical analytics beyond 30 days (e.g., year-over-year district trends) — the existing `/dashboard/intelligence` page covers longer-range analytics
- Per-district resident pod views (which residents live in which district) — separate PRD
- Editing or correcting district boundaries — we trust the NYC Open Data source
- Other administrative boundaries (community districts, ZIP codes, school districts) — district-level scope is set; other boundaries can follow the same pattern in future PRDs
- Click-through to a dedicated per-district drill-down page

---

## 4. Data Model Changes

### Phase 1
No schema changes. Polygon data is fetched on demand from NYC Open Data and not stored locally.

### Phase 2
No schema changes. Flood-event counts are computed from existing FloodNet sensor readings. We may add a small in-memory cache in the API route to avoid hammering FloodNet on every map load — implementation detail, not schema.

### Phase 3
No schema changes. Sensor → district mapping uses the `council_district` field already returned by FloodNet's sensor metadata.

---

## 5. Build Order

```
Phase 1 — Polygons on the map, toggleable, zoom-scaling
  └── Phase 2 — Always-visible flood-event count per district
        └── Phase 3 — Hover panel with sensors + max depth
```

---

## 6. Open Questions

- **Source of truth for "flood events":** the codebase has two candidate sources — FloodNet sensor readings ≥50mm (already used in `flooding-count/route.ts`) and NYC Open Data's flood-events dataset (which has explicit start/end times and max depths). Recommendation: stick with FloodNet for consistency with the rest of the dashboard, but worth confirming.
- **Caching:** the 30-day flood-event count per district doesn't need to be real-time. Recomputing once per hour seems plenty. Confirm acceptable.
- **Tablet hover (D14):** "tap to open, tap elsewhere to close" is the standard pattern, but if both Council Districts and FEMA zones are on, taps need to disambiguate. Worth a UX pass during Phase 3.
