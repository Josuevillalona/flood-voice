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
| L1 | When a resident's registration is submitted, the **preferred language is saved correctly** so future welfare-check calls go out in the right language. (Today, on one of the two intake screens, picking Bengali or Mandarin saves an invalid value to the database — silently breaking the resident's language preference.) | Todo |
| L2 | **Every piece of text inside a form field**, including hint text like "Type full name" beneath the signature line, appears in the selected language — not English. | Todo |
| L3 | When a canvasser finishes one resident's intake and starts another, **the form opens in the language they last used**, not English. They don't have to re-pick "বাংলা" for every resident in a Bengali-speaking neighborhood. | Todo |
| L4 | **Switching languages partway through an intake never clears data already entered.** This works today; the requirement is to make sure it stays working. | Todo |
| L5 | On a tablet held at arm's length, **every label and helper text is easily readable**, and every tap target — radio buttons, checkboxes, input fields — is **large enough to hit reliably with a finger**, not a stylus. | Todo |
| L6 | **The translated form labels are stored in one shared file** instead of being copy-pasted into two. So fixing a typo in the Spanish word for "Date of birth," or rewording a Bengali label, only has to happen once. (Today the standalone intake page and the dialog version each carry their own copy of every translated label, and they can silently drift apart. No live translation is involved — all the text is pre-written and static.) | Todo |
| L7 | **The Section 6 consent paragraph has been reviewed by a human translator** in every supported language. No machine translation, since this is what the resident is legally agreeing to. | Todo |

**Why:** The existing 4-language toggle gets the visible content roughly right but breaks in three places that bite users: one of the intake screens silently saves the wrong language code, the form forgets the canvasser's chosen language between residents, and one English hint text leaks through every translation. Tablet legibility matters because the canvasser uses this in the field — and adding two more languages (Phase 2) on top of an already-tight layout would only make it worse.

---

### Phase 2 — Add Korean & Haitian Creole Tabs

| # | Requirement | Status |
|---|-------------|--------|
| L8 | **Korean and Haitian Creole are added as full languages.** Every label, button, hint text, error message, and consent paragraph is translated. No English leaks through anywhere. | Todo |
| L9 | **All 6 language tabs** (English, Spanish, Bengali, Mandarin, Korean, Haitian Creole) appear at the top of the form, and the canvasser can switch to any of them with one tap. | Todo |
| L10 | **All 6 tabs fit on a tablet screen without truncation.** Long names use shorter native versions where needed ("Kreyòl" instead of "Haitian Creole", "한국어" instead of "Korean") so nothing gets cut off. | Todo |
| L11 | The "Preferred language" checkboxes in Section 5 already offer all 6 languages — confirm they still work, and that picking Korean or Haitian Creole as a resident's preference saves the right value. | Todo |
| L12 | **Korean and Haitian Creole consent paragraphs are reviewed by a human translator** before they ship. Same legal-accuracy standard as the other languages (L7). | Todo |

**Why:** The resident-preference checkboxes (Section 5) already list Korean and Haitian Creole, so a canvasser working with a Korean speaker today can record their language preference — but can't actually present the rest of the form in their language. Phase 2 closes that gap. The tablet legibility work in Phase 1 is what makes fitting 6 tabs across the top feasible without crowding.

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
  └── Phase 2 — Add ko + ht tabs (depends on shared translation module from L6 and tablet sizing from L5)
```

---

## 6. Open Questions

- **Who reviews the consent paragraph translations?** A human translator is required for legal accuracy (L7, L12). Is the existing translator who did Spanish / Bengali / Mandarin available for Korean and Haitian Creole, or do we need to source new ones? This is the slowest part of the PRD.
- **Where does the canvasser's last-used language get remembered (L3)?** Saved on the tablet itself (so the language preference travels with that device, but not across devices), or saved against the canvasser's account (so it follows them to any device they sign in on). Saving on the tablet is simpler; the account-level choice matters if canvassers share tablets between shifts.
- **Should picking the form language also auto-check the resident's matching "Preferred language" checkbox** in Section 5? Today the canvasser tab and the resident-preference checkbox are independent — a canvasser switching to Bengali doesn't automatically mark the resident as a Bengali speaker. Flagging as a possible UX simplification, but not assumed.
