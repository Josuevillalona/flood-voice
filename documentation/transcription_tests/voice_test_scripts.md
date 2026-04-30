# Voice Test Scripts — Resident Reference Answers

## Purpose
These scripts are what a **native speaker reads aloud during a test welfare-check call** to measure how accurately the system writes down (transcribes) the resident's speech. They cover the full range of what a resident might actually say:

- **Calm answer** — the resident is fine, water is around but not threatening. Should classify as `safe`.
- **Uncertain answer** — the resident is hedging, water is encroaching, situation could go either way. Tests the AI's ability to follow up and the transcript's ability to capture nuance.
- **Distress answer** — the resident is in immediate danger. Should classify as `distress` and trigger the emergency hand-off.

Per the multilingual voice calls PRD (V5–V7), the **original-language transcript** the system produces is compared word-for-word against the script the speaker read; the resulting accuracy % is logged in `voice_accuracy_baseline.md` alongside this folder.

These are **not** what the system says — the system uses an AI-driven conversation with adaptive follow-ups. These are only what the resident reads back as their answer.

---

## English (en)

### Calm
> I'm okay, water is on the street but not in my home.

### Uncertain
> I'm not sure, the basement has some water but I can move upstairs.

### Distress
> Help, I'm trapped, water is coming up fast.

---

## Spanish (es)

> **Status:** To be authored / reviewed by a native Spanish speaker before use in real testing. The English versions above are the reference; these should preserve meaning, register (informal/conversational), and approximate length, **not** be word-for-word literal translations.

### Calm
> _TBD — native speaker to author_

### Uncertain
> _TBD — native speaker to author_

### Distress
> _TBD — native speaker to author_

---

## Bengali (bn)

> **Status:** To be authored by a native Bengali speaker before use in real testing. Note: Bengali in NYC is predominantly Bangladeshi (Standard / Dhaka dialect) — confirm with speaker that vocabulary matches the dialect spoken by the resident population we're calling.

### Calm
> _TBD — native speaker to author_

### Uncertain
> _TBD — native speaker to author_

### Distress
> _TBD — native speaker to author_

---

## Mandarin (zh)

> **Status:** To be authored by a native Mandarin speaker before use in real testing. Confirm: Simplified vs. Traditional script for the written transcript comparison (Simplified is more common among NYC Mandarin speakers; this matters for the word-for-word comparison in V7).

### Calm
> _TBD — native speaker to author_

### Uncertain
> _TBD — native speaker to author_

### Distress
> _TBD — native speaker to author_

---

## Korean (ko) — Phase 2

> **Status:** Authored in Phase 2 (V13). To be authored by a native Korean speaker.

### Calm
> _TBD — native speaker to author_

### Uncertain
> _TBD — native speaker to author_

### Distress
> _TBD — native speaker to author_

---

## Haitian Creole (ht) — Phase 2

> **Status:** Authored in Phase 2 (V13). To be authored by a native Haitian Creole speaker. Note: Haitian Creole orthography varies — confirm with speaker which spelling convention to use for the word-for-word comparison.

### Calm
> _TBD — native speaker to author_

### Uncertain
> _TBD — native speaker to author_

### Distress
> _TBD — native speaker to author_

---

## How to use this file

1. A native speaker fills in the three answers for their language above.
2. They take a real test welfare-check call (V6 / V14) and read each of the three answers aloud as their response when the AI asks the safety question.
3. The transcript captured by the system is compared word-for-word against the answer they read.
4. Accuracy % per (language × answer) is logged in `voice_accuracy_baseline.md`.
5. For Phase 3 (noise testing), the same answers are reused — the speaker reads them while standing in a noise environment (rain audio, TV, sirens).
