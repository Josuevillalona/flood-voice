# 311 Flooding Calls Overlay (Mock Data) - PRD

## Overview
Add a new toggleable "311 Calls" map overlay alongside the existing FEMA Zones and the planned Council Districts overlays (PRD #3). The overlay paints each council district as a heatmap by the number of flooding-related 311 calls received in the last 30 days, and feeds that same count into the council-district hover panel so a user can read both flood events (sensor-derived) and 311 calls (resident-reported) side by side. For now the data is **mocked** — generated deterministically so demos are repeatable — with the data fetch wrapped in a single function so swapping to real NYC Open Data 311 later is a one-line change. Three phases: (1) generate the mock dataset and an API endpoint for it; (2) add the toggleable heatmap layer to the map; (3) wire the per-district 311 count into the council-district hover panel.

---

## 1. User Stories

### As a Liaison or CBO Coordinator
- I want to see at a glance which districts are getting the most flooding-related 311 calls right now, so I can prioritize outreach where residents are already raising the alarm
- I want to compare 311 call volume against sensor-detected flood events for the same district, so I can spot mismatches — districts where residents are calling but sensors aren't triggering, or vice versa
- I want to be able to turn the 311 overlay off when I'm focused on something else, the same way I can toggle FEMA zones today

### As a CBO Coordinator
- I want a number I can show partners ("District 9 had 47 flooding-related 311 calls last month") rather than describing the gradient on the map

### As a Demo Audience
- I want to see realistic-looking 311 data on the map even before the live NYC Open Data integration ships, so the feature can be evaluated and refined now

---

## 2. Functional Requirements

### Phase 1 — Mock 311 Dataset & Endpoint

| # | Requirement | Status |
|---|-------------|--------|
| C1 | A mock dataset of flooding-related 311 calls is generated covering all 51 NYC City Council Districts, with realistic spread: a handful of high-volume districts (≥40 calls), most mid-volume (5–25), a few near-zero. Distribution roughly tracks low-elevation / coastal districts to look plausible. | Todo |
| C2 | Each mock call has: district, complaint type (drawn from the real NYC 311 flooding-complaint vocabulary — "Sewer Backup," "Street Flooding," "Catch Basin Clogged/Flooding," "Hydrant Open"), timestamp within the last 30 days, and a rough lat/lng inside that district's bounds. | Todo |
| C3 | The dataset is **deterministic** — generated from a fixed seed — so the same numbers show on every page load until the seed is changed. Demos don't accidentally show different counts each time. | Todo |
| C4 | A new API endpoint `/api/calls311` returns the mock data on request. The endpoint accepts an optional `?days=N` parameter (default 30). | Todo |
| C5 | Every response from `/api/calls311` is clearly tagged as mock data — both in the response body (`source: "mock"`) and in any UI that consumes it ("MOCK DATA" badge somewhere visible on the overlay) — so demos and screenshots can't accidentally claim real data. | Todo |
| C6 | The function that fetches the data is structured so swapping to a real NYC Open Data 311 fetch later is a single-file, one-line change. (Implementation note for the engineer, not a separate user-facing requirement.) | Todo |

**Why mock first:** Real NYC Open Data 311 integration is a multi-step thing on its own (auth, rate limits, complaint-type filtering, deduping). Mock data lets us design the overlay UX and the hover panel now and validate them with real users, then drop in real data without touching the UI.

---

### Phase 2 — Toggleable Heatmap Overlay on the Map

| # | Requirement | Status |
|---|-------------|--------|
| C7 | A new "311 Calls" toggle button is added to the map's overlay controls, next to FEMA Zones and Council Districts. Clicking it turns the 311 heatmap on or off. | Todo |
| C8 | When the 311 overlay is turned on, **the Council Districts polygons are also rendered** automatically (since 311 data is shown per district). Turning the 311 overlay off does not turn the Council Districts overlay off — it only disables 311 coloring. | Todo |
| C9 | Each district is shaded by 311 call count over the last 30 days, using a **relative gradient**: the district with the most 311 calls is darkest, the district with the fewest is lightest, others fall on the gradient between them. | Todo |
| C10 | The 311 heatmap uses a **visually distinct color family** from the council-district flood-event gradient (PRD #3) — e.g., orange/yellow for 311 if districts use green for events — so a user can tell at a glance which metric is being shown. | Todo |
| C11 | If both the council-district event-count gradient and the 311 heatmap could conceivably be on at the same time, the UI picks one as the active gradient (most recently toggled wins) and grays out the other in the legend. No "two gradients on at once" mode. | Todo |
| C12 | A small "MOCK DATA" badge is visible somewhere on the map (e.g., in the legend) whenever the 311 overlay is on, until real-data integration replaces it. | Todo |

**Why:** The whole point of a heatmap is the at-a-glance hotspot read. Reusing the council-district polygons keeps the visual vocabulary consistent (anyone who learned the council-district overlay already knows how this one works). Color separation prevents the user from confusing 311-call density with sensor-event density.

---

### Phase 3 — District Hover Panel Integration

| # | Requirement | Status |
|---|-------------|--------|
| C13 | When the user hovers (or taps, on tablet) a district while the 311 overlay is on, the hover panel from PRD #3 picks up two new lines: **311 calls in last 30 days** (count) and **most common complaint type** (e.g., "Catch Basin Clogged/Flooding — 18 calls"). | Todo |
| C14 | If the council-districts overlay is on but 311 is off, the panel shows the regular flood-event detail and *does not* show 311 lines. Conversely if 311 is on but flood-event coloring isn't relevant, the panel shows 311 lines and a quieter version of the flood-event lines. | Todo |
| C15 | If a district has zero 311 calls in the window, the panel says "No flooding-related 311 calls in last 30 days" rather than showing a 0. | Todo |

**Why:** The heatmap answers "where is 311 activity concentrated." The hover detail answers "what kind of flooding are residents reporting in this specific district." Together they're more useful than either alone.

---

## 3. Out of Scope

- Real NYC Open Data 311 integration — explicitly deferred to a separate PRD once UX is validated on mock data
- 311 call resolution / SLA tracking (was the call closed, how long did it take, did DEP visit)
- Allowing residents to file new 311 calls from inside Flood Voice
- Cross-correlating 311 calls with sensor readings (e.g., "calls that came in within 2 hours of a nearby sensor triggering") — interesting, but a separate analytics PRD
- Filtering by complaint type within the overlay (e.g., "show only Catch Basin calls") — not in scope for a v1 demo
- Per-call drill-down (clicking a single call to see address, status, timestamp)
- Historical analytics beyond 30 days

---

## 4. Data Model Changes

### Phase 1
No schema changes. The mock dataset lives entirely in the API route — no DB table needed for mocked data.

### Phase 2
No schema changes.

### Phase 3
No schema changes.

---

## 5. Build Order

```
Phase 1 — Mock 311 dataset + API endpoint
  └── Phase 2 — Heatmap overlay on the map (heatmap is the "tab")
        └── Phase 3 — Hover panel integration (depends on PRD #3 hover panel)
```

---

## 6. Open Questions

- **"Tab" interpretation:** is the 311 view a **map overlay toggle** (treated this way in this PRD) or a **separate dashboard page** with a list/table view? The map overlay reads more naturally with the other deliverables in this PRD; if a list view is also wanted, that's a small add-on.
- **Complaint types that count as "flooding":** the PRD lists Sewer Backup / Street Flooding / Catch Basin Clogged/Flooding / Hydrant Open, drawn from real NYC 311 categories. Worth confirming the canonical list with a CBO partner — there may be other categories (e.g., "Plumbing" subtypes) that should be in or out.
- **Color choice for the heatmap (C10):** orange/yellow is one option; sticking with a single neutral gradient and using legend labels to disambiguate is another. Recommendation: distinct color, but worth a UX gut-check.
- **Both overlays on at once (C11):** "most recently toggled wins" is the simplest rule. If users actually want to see both side-by-side, a small map-corner toggle ("color by: events / 311 calls") is a cleaner alternative.
- **Mock data realism:** should districts with known flood vulnerability (Rockaway, South Street Seaport, low-lying Brooklyn) get higher mock counts to make demos more credible? Or is uniformly random distribution fine for v1?
