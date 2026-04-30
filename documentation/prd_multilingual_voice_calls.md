# Multilingual Voice Calls & Transcript Accuracy - PRD

## Overview
When the system places a welfare-check call to a flood-affected resident today, **it always speaks English** — even if the resident registered as a Bengali or Spanish speaker. The resident's preferred language is captured during intake, but the calling system isn't using it: every welfare check goes out in English, and the system writes down (transcribes) the resident's answer as if it were English too.

Importantly, **the existing call is not a fixed script.** It's an AI-driven conversation that adapts to the resident: it asks water-depth follow-ups when flooding is mentioned, asks about support if the resident has health conditions on file, steers chatty residents back to safety questions, and writes its own free-text summary of the conversation when reporting status to the dashboard. Whatever we ship for multilingual must keep all of that working — just in the resident's language.

Four phases: (1) route the call's **voice**, the **AI's output language**, and the **speech-to-text language** to the resident's preferred language for **English, Spanish, Bengali, and Mandarin** — matching Phase 1 of the [multilingual intake PRD](./prd_multilingual_intake.md) so a resident registered in any of those four gets a call back in the same language they were intook in — and prove the transcription side works by having a native speaker read three test answers aloud and measuring how accurately the system understood them; (2) extend the same support to **Korean and Haitian Creole**; (3) repeat the accuracy test under realistic background noise (rain on a roof, sirens outside, an indoor TV); (4) [P2] have native speakers rate how natural the system's voice sounds in their language and swap voices that score poorly.

---

## 1. User Stories

### As a Resident
- I want the welfare-check call to speak to me in my preferred language, so I understand the question and can answer correctly
- I want to have a real back-and-forth conversation — the AI asking follow-ups when something I said needs clarifying, not just reading a fixed list of questions — in my own language
- I want my spoken answer ("I'm okay" / "water is coming in") to be written down correctly even if I respond in a non-English language
- I want my answer to be written down correctly even if there's background noise — rain, wind, a TV — because that's what real flood conditions sound like

### As a Liaison
- I want confidence that a "Safe" status from a Bengali-speaking resident is as reliable as one from an English-speaking resident, so I'm not deprioritizing non-English residents by accident
- I want to read the resident's answer in English when I'm reviewing the call, so I don't need to read Bengali, Mandarin, Korean, or Haitian Creole myself to understand what they said
- I want the original-language version of the answer kept alongside the English translation, so a fluent reviewer can double-check the translation if anything looks off
- I want to know how accurate transcripts are for each language, so I can flag low-confidence transcripts for manual review

### As a CBO Coordinator
- I want a one-line metric per language ("Mandarin transcripts matched the intended answer with 92% word accuracy on clean audio, 87% under noise") I can show funders and partners

---

## 2. Functional Requirements

### Phase 1 — Speak & Listen in the Resident's Language (English / Spanish / Bengali / Mandarin)

These four languages mirror Phase 1 of the [multilingual intake PRD](./prd_multilingual_intake.md), so a resident registered in any of them gets a welfare-check call back in the same language they were intook in.

**Approach:** keep the existing AI-driven conversation (water-depth follow-ups, health-conditions probe, conversational steering, free-text summary) and add language routing across the three layers a call has — what the system speaks with (voice), what the AI thinks and replies in (output language), and what the system listens for (speech-to-text). We are **not** replacing the AI with a fixed script.

**Voice and provider selection:** see [voice model research](./voice_model_research.md) for the per-language voice ID recommendations, the ElevenLabs free-tier limits, and the provider × language support matrix that this phase relies on.

| # | Requirement | Status |
|---|-------------|--------|
| V1 | When a welfare-check call goes out, the call is routed to the resident's preferred language across **all three layers** of the call: (a) the **voice** the system speaks with, (b) the **language the AI generates its questions and replies in**, and (c) the **language the system listens for** when writing down the resident's answer. All four Phase 1 languages route through ElevenLabs (no additional providers needed); per-language voice IDs come from the [voice model research](./voice_model_research.md). If a resident's preferred language isn't supported yet, all three fall back to English. | Todo |
| V2 | **When the resident speaks back, the system stores two versions of what they said:** (1) the **original-language transcript** — a Bengali speaker's answer captured as Bengali text, exactly as spoken — kept as the source of truth for proofing, and (2) an **English translation** of that transcript so a liaison can review the call without reading every supported language. Both versions are saved against the call record. | Todo |
| V3 | **The AI is instructed to converse only in the resident's preferred language** — its greeting, its safety question, its follow-up questions, its closing line, and the free-text summary it writes back to the dashboard. **Any hardcoded lines spoken outside the AI** (today, the opening "Hi, this is Flood Voice calling for {name}..." line) **exist in a translated version** for English, Spanish, Bengali, and Mandarin. | Todo |
| V4 | **The existing AI behaviors continue to work in non-English languages:** the water-depth follow-up ("ankle deep? knee deep?"), the health-conditions contextual probe (offering support if the resident has conditions on file), the conversational steering (handling chatty or confused residents), and the `reportStatus` function call with a free-text summary. None of these is dropped to gain multilingual support. | Todo |
| V5 | **Three reference answers exist per language** for the transcription accuracy test, covering the full range of what a resident might actually say: a **calm answer** ("I'm okay, water is on the street but not in my home"), an **uncertain answer** ("I'm not sure, the basement has some water but I can move upstairs"), and a **distress answer** ("Help, I'm trapped, water is coming up fast"). These represent what the resident says, not what the system says. Stored under `documentation/transcription_tests/`. | Todo |
| V6 | **A native speaker takes a real test welfare-check call** in their language and reads each of the three reference answers aloud as their response to the AI's questions. The system records the call. | Todo |
| V7 | **For each test call, the original-language transcript (from V2) is compared word-for-word against the reference answer the speaker read.** The result is logged as a **transcription accuracy score** — 100% means the system captured every word of the resident's speech correctly. The system's own questions are *not* part of this comparison (the AI's wording varies call to call, by design). The English translation is spot-checked for sense by a fluent reviewer but is not the basis for the accuracy score. | Todo |
| V8 | **A human reviewer listens to each test recording and confirms two things:** (a) the call actually went out in the right language — voice + AI output — and (b) the AI's adaptive behaviors from V4 (follow-ups, contextual probes, steering) actually fired in the new language, not just the greeting line. | Todo |
| V9 | **Each language has a minimum transcription accuracy bar** to be considered ready for production: **≥85% for English and Spanish**, **≥75% for Bengali and Mandarin**. These are starting numbers; we revisit them once we see real test results. | Todo |

**Why this shape:** Today's call relies on an AI model (GPT-4o-mini) to adapt to each resident — asking water-depth probes when flooding is mentioned, offering support when health conditions are on file, summarizing the call in its own words for the dashboard. Replacing that with a fixed script to gain multilingual support would be a real regression. Instead, we route language across the three layers and let the AI do its work in the new language. The accuracy test focuses on the riskiest layer for non-English residents — **speech-to-text on the resident's voice** — because that's what determines whether a "Safe" status is trustworthy. AI question fidelity is a softer concern verified by human review (V8), not a numeric threshold.

**On the accuracy bars in V9:** Speech-to-text software handles English and Spanish better than Bengali or Mandarin today, simply because more training data is available for the more widely spoken languages. So we start with a slightly higher bar for English/Spanish and a slightly lower bar for Bengali/Mandarin. Once the first real numbers come in, we tighten the bars based on what's actually achievable.

---

### Phase 2 — Add Korean & Haitian Creole

| # | Requirement | Status |
|---|-------------|--------|
| V10 | **Korean and Haitian Creole are added to the supported-language list** — the call speaks them, the AI converses in them, and the system writes down resident answers in them. The same V1–V4 standards (three-layer routing, dynamic AI behavior preserved) apply. | Todo |
| V11 | **The translated hardcoded lines from V3 are extended to Korean and Haitian Creole.** | Todo |
| V12 | **Haitian Creole TTS is not supported by any major commercial provider** — confirmed in the [voice model research](./voice_model_research.md#4-the-haitian-creole-gap) (ElevenLabs, Azure, Google Cloud, and Amazon Polly all lack it). Pick one of three options before Phase 2 voice work begins: (a) defer ht voice and fall back to English on calls, (b) integrate a specialty/open-source provider via Vapi's custom TTS path, or (c) route ht-preferred residents to a human callback by a CBO volunteer. | Todo |
| V13 | **Three reference answers (calm / uncertain / distress) are written in Korean and Haitian Creole** and added under `documentation/transcription_tests/`. | Todo |
| V14 | **A native Korean speaker and a native Haitian Creole speaker take the same test as V6** — taking a real welfare-check call and reading each reference answer aloud — and results are logged alongside the Phase 1 numbers. | Todo |
| V15 | **Korean and Haitian Creole each start with an accuracy bar of ≥75% on clean audio**, revisited once real numbers come in. | Todo |

**Why split out:** Korean and Haitian Creole carry higher technical risk than the four Phase 1 languages — Haitian Creole in particular is patchily supported across speech-recognition providers. Splitting it out lets Phase 1 ship without that uncertainty resolved.

---

### Phase 3 — Accuracy Under Background Noise

| # | Requirement | Status |
|---|-------------|--------|
| V16 | **The three-answer test is repeated for each language under three real-world noise conditions:** heavy rain audio playing nearby, an indoor TV/radio at conversation volume, and sirens. The speaker is physically in the noise environment so the phone microphone picks it up the same way it would during a real flood. | Todo |
| V17 | **Accuracy under each noise condition is recorded** alongside the clean-audio baseline, broken out by language × noise type × reference answer. | Todo |
| V18 | **Acceptable drop in accuracy under noise: no more than 15 percentage points** below the clean baseline for that language. Any combination that drops further is flagged for fixing. | Todo |
| V19 | **If any combination fails the threshold, the call platform's noise-suppression and silence-detection settings are tried**, and results are recorded. | Todo |

**Why:** Real flood conditions mean rain on metal roofs, sirens outside, indoor TVs left on. Studio-clean numbers are misleading. This phase produces the metric we'd actually quote to a city partner.

---

### Phase 4 [P2] — Voice Naturalness Review

| # | Requirement | Status |
|---|-------------|--------|
| V20 | **For each language, 2–3 native speakers listen to a 30-second recording of the call speaking their language** and rate it 1–5 on naturalness — does it sound like a real person, is the pacing right, is the accent authentic. | Todo |
| V21 | **The average naturalness rating is recorded per language.** Any language scoring **below 3.5** triggers an audition of alternative voices and a re-rating round. | Todo |
| V22 | **Once a language reaches an average rating of ≥3.5, its voice selection is locked in.** | Todo |

**Why:** Marked P2 — accuracy first, accent second. A robotic-sounding Bengali voice that transcribes correctly is still useful in a flood emergency. The reverse is not.

---

## 3. Out of Scope

- Replacing the AI-driven conversation with fixed scripts — explicitly rejected; we keep the existing adaptive behavior and route language around it
- Detecting mid-call that a resident is answering in a different language than they registered — assume the language captured during intake is correct
- The keypad-based emergency button (the "press 2 for emergency" instruction itself) — kept short and consistent across languages for now
- Re-running historical English-only call recordings through a multilingual transcriber retroactively
- Cloning the canvasser's own voice for the welfare-check call

---

## 4. Data Model Changes

### Phase 1
**Small schema change required.** Today, each call has one transcript field. V2 needs two: the original-language transcript and the English translation. Add a second field on the call record (`transcript_english` alongside the existing `transcript`) so both versions can be stored and displayed side by side. Migration file: `docs/migration_multilingual_transcripts.sql`. Existing recordings field is unchanged.

### Phase 2
No database changes.

### Phase 3
No database changes. Noise-test results live in a documentation file, not the database.

### Phase 4
No database changes.

---

## 5. Build Order

```
Phase 1 — Three-layer language routing (voice + AI + STT) for en/es/bn/zh, AI behavior preserved, 3-answer transcription accuracy baseline
  └── Phase 2 — Add ko + ht to all three layers and the baseline
        └── Phase 3 — Re-run baseline under realistic background noise across all 6 languages
              └── Phase 4 [P2] — Native-speaker naturalness review + voice swaps
```

---

## 6. Open Questions

- **One voice per language confirmed.** No single ElevenLabs voice handles all six languages well; per-language voice IDs come from the [voice model research](./voice_model_research.md#3-per-language-voice-recommendations). All four Phase 1 languages stay on ElevenLabs — Azure was considered for Bengali dialect fit but is held in reserve as a fallback only if the ElevenLabs Bengali voice fails native-speaker review.
- **How is the English translation in V2 produced?** Same provider as the speech-to-text (one round trip), or a separate translation step after the original-language transcript is captured? Affects cost and latency. Either way, the original-language transcript is the source of truth — the English version is for liaison readability.
- **Does the AI follow a "respond only in {{language}}" instruction reliably**, or do we need to translate the system prompt itself per language? Cheap to test by spot-checking a few calls per language; choice has implications for prompt maintenance.
- **Haitian Creole TTS gap.** Confirmed unsupported by every major provider; see [voice model research §4](./voice_model_research.md#4-the-haitian-creole-gap) for the three options and the recommended path (human callback via CBO volunteer).
- **Free-tier ceiling for production.** ElevenLabs free covers ~15–20 calls/month and has no commercial license; production rollout requires at least the $5/mo Starter tier. See [voice model research §5](./voice_model_research.md#5-free-tier-limits).
- **Recruiting one native speaker per language is the slow part of this PRD.** Who owns sourcing the speakers, and is the CBO partner network the right channel?
- **Phase 3 noise setup:** physical noise sources next to the speaker (more realistic — what a real call would sound like) vs. mixing noise into a clean recording afterwards (more reproducible — easier to re-run). Recommendation: physical for the first pass; switch to mixed if we need to re-run cheaply.
