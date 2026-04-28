# Multilingual Voice Calls & Transcript Accuracy - PRD

## Overview
Welfare-check calls today go out in English regardless of `resident.language` — Vapi is hardcoded to ElevenLabs voice `"sarah"` and language is only injected as a context line in the LLM prompt, never into TTS or STT config (`src/app/api/vapi/trigger/route.ts:62–65`, `:133`). Four phases: (1) route voice + STT to the resident's language for **English / Spanish / Bengali / Mandarin** and run a 3-script (good / medium / bad path) accuracy baseline read by a native speaker into a test call; (2) extend the same routing and 3-script baseline to **Korean and Haitian Creole**; (3) re-run the baseline under simulated background noise; (4) [P2] human-grade voice naturalness per language and swap underperformers.

---

## 1. User Stories

### As a Resident
- I want the welfare-check call to speak to me in my preferred language, so I understand the question and can answer correctly
- I want my spoken answer ("I'm okay" / "water is coming in") to be transcribed correctly even if I respond in a non-English language
- I want my answer to be transcribed correctly even if there's background noise — rain, wind, a TV — because that's what real flood conditions sound like

### As a Liaison
- I want confidence that a "Safe" status from a Bengali-speaking resident is as reliable as one from an English-speaking resident, so I'm not deprioritizing non-English residents by accident
- I want to know the measured accuracy floor per language, so I can flag low-confidence transcripts for manual review

### As a CBO Coordinator
- I want a one-line metric per language ("Mandarin transcripts matched intended script with 92% word accuracy on clean audio, 87% under noise") I can show funders and partners

---

## 2. Functional Requirements

### Phase 1 — Voice Routing + 3-Script Baseline (en / es / bn / zh)

| # | Requirement | Status |
|---|-------------|--------|
| V1 | When a welfare-check call goes out, the prompter speaks to the resident **in the preferred language captured during intake**. If a resident's preferred language isn't supported yet, the call falls back to English. | Todo |
| V2 | When the resident speaks back, the system transcribes their response **in that same preferred language** — a Bengali speaker's answer is captured as Bengali text, not as English-misheard noise. | Todo |
| V3 | Every line the prompter says — the greeting, the safety question, the "press 2 for emergency" instruction — is fully translated for English, Spanish, Bengali, and Mandarin. No language is partially translated. | Todo |
| V4 | Three reference scripts exist per language for accuracy testing: **good path** ("I'm okay, water is on the street but not in my home"), **medium path** ("I'm not sure, the basement has some water but I can move upstairs"), **bad path** ("Help, I'm trapped, water is coming up fast"). Stored in `documentation/voice_test_scripts.md`. | Todo |
| V5 | A native speaker takes a test welfare-check call in their language and reads each of the 3 scripts aloud as their response. The system captures the transcript for each call. | Todo |
| V6 | For each test call, the captured transcript is compared word-for-word against the script the speaker read. The result is logged as a **transcription accuracy %** (100% means the system captured every word correctly). Results land in `documentation/voice_accuracy_baseline.md`. | Todo |
| V7 | A human reviewer listens to each test recording and confirms the prompter actually spoke the right language. Catches cases where the transcript looks fine but the call went out in the wrong language. | Todo |
| V8 | Each language has a minimum transcription accuracy bar before it's considered production-ready: **≥85% for English and Spanish**, **≥75% for Bengali and Mandarin**. Targets are revisited once the baseline numbers come in — they're a starting point, not a contract. | Todo |

**Why this shape:** Calls go out in English today regardless of the resident's intake-recorded language, so V1–V3 unblock everything else. The 3-script good/medium/bad design is the lightest test that covers the full risk-classification range (Safe → ambiguous → Distress) and produces a real number, not a vibe. Having a human read into a real phone is more representative of field conditions than synthetic audio injection and faster to set up.

**On the accuracy bars in V8:** Word-by-word transcription gets harder for languages with smaller training data (Bengali, Mandarin) than for English/Spanish. We're setting a higher bar for the better-supported languages and a slightly lower one for the others, then revisiting once we see real numbers. ("WER" / Word Error Rate is the underlying metric — accuracy % is just `100 − WER` reframed for readability.)

---

### Phase 2 — Korean & Haitian Creole

| # | Requirement | Status |
|---|-------------|--------|
| V9 | Korean and Haitian Creole join the supported-language list — the prompter speaks them, and the system transcribes resident responses in them. | Todo |
| V10 | The translated prompts from V3 extend to Korean and Haitian Creole. | Todo |
| V11 | If our voice or transcription provider doesn't support Haitian Creole well enough, an alternative provider is evaluated before that language is considered ruled in. (Korean is well covered by major providers; Haitian Creole is the bigger risk.) | Todo |
| V12 | Three reference scripts (good / medium / bad path) are authored in Korean and Haitian Creole and appended to `voice_test_scripts.md`. | Todo |
| V13 | A native Korean speaker and a native Haitian Creole speaker run the same test as V5 — taking a test welfare-check call and reading each script aloud. Results are appended to `voice_accuracy_baseline.md`. | Todo |
| V14 | Korean and Haitian Creole each have a starting accuracy bar of **≥75% on clean audio**, revisited after the baseline lands. | Todo |

**Why split out:** Korean and Haitian Creole have higher technical risk than the Phase 1 four — Haitian Creole in particular is patchily supported across speech-recognition providers. Splitting lets Phase 1 ship without that uncertainty resolved.

---

### Phase 3 — Accuracy Under Background Noise

| # | Requirement | Status |
|---|-------------|--------|
| V15 | The 3-script test is repeated for each language under three real-world noise conditions: heavy rain audio playing nearby, an indoor TV/radio at conversation volume, and sirens. The speaker is physically in the noise environment so the phone microphone picks it up the same way it would in a real flood. | Todo |
| V16 | Noise-condition transcription accuracy is recorded alongside the clean baseline, broken out by language × noise profile × script path. | Todo |
| V17 | Acceptable degradation threshold: accuracy under noise must drop **no more than 15 percentage points** below the clean baseline for that language. Any language × noise combination that drops further is flagged. | Todo |
| V18 | If any combination fails the threshold, the noise-suppression and silence-detection settings the call platform exposes are evaluated, the most promising are tried, and the results are recorded. | Todo |

**Why:** Real flood conditions mean rain on metal roofs, sirens outside, indoor TVs left on. Clean-studio numbers are misleading. This phase produces the metric we'd actually quote to a city partner.

---

### Phase 4 [P2] — Voice Naturalness Review

| # | Requirement | Status |
|---|-------------|--------|
| V19 | For each language, 2–3 native speakers listen to a 30-second recording of the welfare-check prompter speaking their language and rate it 1–5 on naturalness — does it sound like a real person, is the pacing right, is the accent authentic. | Todo |
| V20 | Mean naturalness ratings are recorded per language. Any language scoring **below 3.5** triggers an audition of alternative voices and a re-rating round. | Todo |
| V21 | Once a language reaches a mean rating of ≥3.5, its voice selection is locked in. | Todo |

**Why:** Marked P2 — accuracy first, accent second. A robotic-sounding Bengali voice that transcribes correctly is still useful in a flood emergency. The inverse is not.

---

## 3. Out of Scope

- Real-time language detection mid-call (e.g., resident answers in a different language than registered) — assume `resident.language` is correct
- Translating LLM-generated dynamic responses (e.g., follow-up questions from the agent) — Phase 1 ships scripted prompts only
- IVR DTMF translation (the "press 2 for emergency" prompt) — assume DTMF labels are language-agnostic
- Re-running historical English-only `call_logs` through a multilingual transcriber retroactively
- Voice-cloning the canvasser's own voice for the welfare check

---

## 4. Data Model Changes

### Phase 1
No schema changes. Existing `call_logs.transcript` and `call_logs.recording_url` already store transcripts and recordings in any script.

### Phase 2
No schema changes.

### Phase 3
No schema changes. Noise-test results live in `voice_accuracy_baseline.md`, not the database.

### Phase 4
No schema changes.

---

## 5. Build Order

```
Phase 1 — Voice + STT routing + 3-script baseline (en/es/bn/zh)
  └── Phase 2 — Add ko + ht to routing and baseline
        └── Phase 3 — Noise-condition re-runs across all 6 languages
              └── Phase 4 [P2] — Native-speaker naturalness review + voice swaps
```

---

## 6. Open Questions

- Does our voice provider have a single voice that handles all 6 languages well, or do we need a different voice per language? Affects how much work V1 and V9 actually are.
- Haitian Creole speech recognition is the biggest unknown — most providers cover Korean cleanly, but Haitian Creole is patchy. We may need a fallback transcriber for that one language.
- Recruiting one native speaker per language is the slow part of this PRD. Who owns sourcing, and is the CBO partner network the right channel?
- Phase 3 noise rig — physical noise sources next to the speaker (more realistic) vs. post-mixing noise into a clean recording (more reproducible). Recommendation: physical for the first pass, post-mix later if we need to re-run cheaply.
