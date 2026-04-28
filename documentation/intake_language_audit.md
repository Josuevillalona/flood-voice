# Intake Form — Multilingual Audit

**Date:** 2026-04-27
**Scope:** `src/app/dashboard/intake/page.tsx` (standalone page) and `src/components/resident-intake-dialog.tsx` (dialog used from residents page).
**PDF reference spec:** `documentation/FloodVoice_RegistrationForm_English_Spanish.pdf` (6 languages: en, es, bn, zh, ko, ht).

---

## State of play

- Canvasser-facing **tab toggle** exists and switches all section headers, labels, radios, consent text, success messages — for **4 languages only**: English, Spanish, Bengali, Mandarin.
- Translations for those 4 are **substantively complete** (no obvious untranslated strings inside the `T` dictionary).
- DB schema already supports the full language set: `residents.language` and `residents.preferred_languages` (`docs/schema.sql:25`, `docs/migration_intake_form.sql:29`).
- Resident-facing **"Preferred language"** checkboxes (Section 5) already list all 7 options (en/es/bn/zh/ko/ht/other).

---

## Gaps

### 1. Tab toggle missing 2 languages (highest visibility gap)
- `LANG_CODES = ['en','es','bn','zh']` — `resident-intake-dialog.tsx:155`
- Tab list `['en','es','bn','zh']` — `intake/page.tsx:281`
- **Korean and Haitian Creole** have no canvasser tab — yet are offered as resident preferences and listed on the PDF spec.

### 2. Hardcoded English placeholder in all 4 languages
- `placeholder="Type full name"` on the signature field — `resident-intake-dialog.tsx:482`, `intake/page.tsx:407`.
- Stays English even when the rest of the form is in Bengali/Mandarin.

### 3. Submission bug: standalone page emits invalid language codes
- `intake/page.tsx:237`: `language: form.preferredLangs[0]?.toLowerCase().slice(0, 2) || 'en'`
- Derives the code by slicing the **label** (e.g., `"Bengali" → "be"`, `"Mandarin" → "ma"`, `"Haitian Creole" → "ha"`, `"Korean" → "ko"` — only Korean is correct by accident). Schema expects `bn`, `zh`, `ht`, etc.
- The dialog gets this right via an explicit `PREF_LANG_CODES` map (`resident-intake-dialog.tsx:158`). The page does not.

### 4. Dialog resets language to English on every reopen
- `resident-intake-dialog.tsx:191`: `setLang('en')` runs every time the modal opens.
- A canvasser working a Bengali-speaking neighborhood has to re-pick "বাংলা" for every resident.
- Mid-form, the language *is* preserved (single state across all sections) — this issue is cross-intake, not cross-section.

### 5. Tablet readability and ergonomics
- Form widths cap at `max-w-xl` (~576px) — fine on iPad portrait (768px).
- Type sizes too small for held-at-arms-length canvassing: section headers `text-[11px]`, helper text `text-[11px]`, inputs `text-[13px]` / `text-xs`.
- Tap targets below Apple HIG 44pt minimum: radios and checkboxes are `w-[14px] h-[14px]`; inputs are `py-1.5` (~30px tall).
- 4 tabs at current width ≈ 144px each (workable). **6 tabs ≈ 96px each** — "Haitian Creole" / "Mandarin" labels will truncate or wrap.
- Validation uses native `alert()` — disruptive on touch; an inline banner would be better.

### 6. Two divergent copies of the translation dictionary
- `T` and `TAB_LABEL` are duplicated between the page and the dialog. Any translation fix has to be made twice — drift risk is real.
- Already one drift point: page has `langs: ['English', 'Español', 'Bengali', ...]` while the dialog has the same — but the page derives codes via `slice` (bug above) instead of an explicit map.

### 7. Minor PDF-vs-code wording deltas (low priority)
- PDF: "If yes, please describe (mobility, vision, hearing, etc.)" → code: just "Please describe".
- PDF: "Borough / ZIP code" preserved in Spanish; code does same — acceptable, NYC-specific term.

---

## What's NOT a gap (verified)

- Mid-form language switch preserves all entered fields — single `lang` state, separate `form` state, no reset on tab change. (Both files.)
- All 4 supported-language `T` entries cover the same key set — no missing translations within the supported set.
- DB schema and Vapi metadata pipeline already accept the full language code set; no migration needed for ko/ht.

---

## Headline numbers

| | Count |
|---|---|
| Languages required by PDF spec | 6 |
| Languages in canvasser tab toggle | 4 |
| Languages with complete tab translations | 4 |
| Translation files / objects to maintain | 2 (drift risk) |
| Confirmed bugs | 1 (invalid language codes from standalone page) |
| Hardcoded English strings inside translated form | 1 (`Type full name` placeholder) |
