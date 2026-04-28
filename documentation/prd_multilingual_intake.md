# Multilingual Intake Form - PRD

## Overview
Resident intake form already toggles between English / Spanish / Bengali / Mandarin, but the audit (`intake_language_audit.md`) surfaced one real submission bug, one cross-session UX gap, missing tab coverage for Korean and Haitian Creole, and tablet ergonomics that don't survive 6 tabs at current sizing. Two phases: fix-and-fortify the existing 4-language toggle (correctness, persistence, tablet legibility, dictionary de-duplication), then extend the toggle to all 6 PDF-spec languages.

---

## 1. User Stories

### As a Canvasser
- I want to set the form to the resident's language once and have it stay that way for the next intake I do, so I'm not re-picking "বাংলা" 30 times in a Bengali-speaking neighborhood
- I want every label, placeholder, and error to display in the selected language — not just section headers — so the resident sees nothing in English unexpectedly
- I want labels and tap targets large enough to use comfortably on a tablet held at arms-length while the resident reads along
- I want to switch language mid-form without losing the data I've already entered (works today — preserve in regressions)

### As a Resident being canvassed
- I want to read along on the canvasser's tablet in my own language, including the consent paragraph in Section 6 that I'm legally agreeing to
- I want my submitted preferred-language to actually save correctly so future welfare-check calls reach me in my language

---

## 2. Functional Requirements

### Phase 1 — Fix & Fortify Existing 4 Languages

| # | Requirement | Status |
|---|-------------|--------|
| L1 | Fix invalid language-code submission on standalone page (`src/app/dashboard/intake/page.tsx:237`): replace `slice(0,2)` derivation with explicit `PREF_LANG_CODES` map matching the dialog's approach | Todo |
| L2 | Translate the hardcoded `"Type full name"` placeholder (`intake/page.tsx:407`, `resident-intake-dialog.tsx:482`) — add `signaturePlaceholder` key to `T` for all 4 languages | Todo |
| L3 | Persist canvasser-selected language across intake sessions: store last selected `lang` in `localStorage` under `floodvoice.intakeLang`; rehydrate on page mount and on dialog open instead of hardcoding `'en'` (`resident-intake-dialog.tsx:191`) | Todo |
| L4 | Preserve mid-form language switch behavior (already works) — add a regression test or manual verification step that switching tabs after partial entry does not clear `form` state | Todo |
| L5 | Tablet readability pass: bump section-header / helper-text from `text-[11px]` to `text-sm`, inputs from `text-[13px]` to `text-base`, radio/checkbox tap area from 14px to 24px (with 44px+ label hit area), input vertical padding from `py-1.5` to `py-2.5` | Todo |
| L6 | Replace native `alert()` validation (`intake/page.tsx:226`, `resident-intake-dialog.tsx:218`) with inline banner above the submit button, translated for all supported languages | Todo |
| L7 | Extract the duplicated `T` and `TAB_LABEL` objects into a single shared module (e.g., `src/lib/intake-translations.ts`) consumed by both the page and the dialog — eliminates drift | Todo |
| L8 | Verify Section 6 consent paragraph for legal review in en/es/bn/zh — flag any string not yet reviewed by a human translator | Todo |

**Why:** The existing 4-language toggle is mostly correct in *content* but wrong in 3 places that bite users: the standalone page submits broken language codes, the dialog forgets your choice every time, and one English placeholder leaks through every translation. Tablet ergonomics matter because the canvasser uses this in the field — and we can't ship Phase 2 (more tabs) on top of a layout that's already tight.

---

### Phase 2 — Add Korean & Haitian Creole Tabs

| # | Requirement | Status |
|---|-------------|--------|
| L9 | Add `ko` and `ht` entries to the shared translation module from L7, covering the full key set (no fallbacks to English) | Todo |
| L10 | Extend `LANG_CODES` and the tab toggle UI to render 6 tabs (en / es / bn / zh / ko / ht) in both the page and dialog | Todo |
| L11 | Tab toggle remains usable at 6 tabs on a 768px-wide tablet without truncation or wrap — may require shorter tab labels (e.g., "Kreyòl" instead of "Haitian Creole") or a horizontal scroll affordance | Todo |
| L12 | Section 5 "Preferred language" checkbox set already includes `ko` and `ht` — verify no change needed and that submitted code matches the new tab code (post-L1 fix) | Todo |
| L13 | Consent paragraph (Section 6) reviewed by a human translator for ko and ht before merge | Todo |

**Why:** The resident-preference field already offers Korean and Haitian Creole, and the PDF spec lists them. The actual gap is tab coverage — and Phase 1's tablet pass is what makes 6 tabs viable.

---

## 3. Out of Scope

- IVR / Vapi voice-call translation (welfare-check call still goes out in English regardless of `preferred_language` — separate PRD)
- Migrating from inline translation objects to a full i18n library (`next-intl`, `react-i18next`) — defer until a 3rd surface needs translations beyond intake
- RTL layout support (none of the 6 target languages are RTL)
- Auto-detecting browser/device language
- A 7th "Other" option in the canvasser tab — the resident-preference checkbox keeps it; the canvasser tab does not need it

---

## 4. Data Model Changes

### Phase 1
No schema changes. `residents.language` and `residents.preferred_languages` already exist.

### Phase 2
No schema changes. `language` column already accepts 2-letter codes; `ko` and `ht` are valid values.

---

## 5. Build Order

```
Phase 1 — Fix & fortify en/es/bn/zh (correctness, persistence, tablet UX, dedupe)
  └── Phase 2 — Add ko + ht tabs (depends on shared translation module from L7 and tablet sizing from L5)
```

---

## 6. Open Questions

- Tab labels at 6-tab width: do we use native short labels ("Kreyòl", "한국어") or accept horizontal scroll? Decide during L11.
- Who is the human translator for the Korean and Haitian Creole consent paragraph (L13)? Same person who did es/bn/zh, or do we need new resources?
- Should the canvasser's persisted language (L3) be per-canvasser (account-scoped, server-side) or per-device (`localStorage`)? Starting with `localStorage` for simplicity — revisit if canvassers share tablets.
- Does "language from last section persists to next" also imply we should auto-set the *resident's* preferred_language checkbox to match the canvasser's selected tab? Currently they're independent — flag as a potential UX simplification.
