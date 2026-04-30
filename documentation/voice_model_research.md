# Voice Model Research — Multilingual Welfare-Check Calls

Research backing the [Multilingual Voice Calls PRD](./prd_multilingual_voice_calls.md). Captures provider × language support, voice recommendations per language, free-tier limits, and the Haitian Creole gap. Last updated: 2026-04.

---

## 1. TL;DR

- **Phase 1 languages (en / es / bn / zh) are all supported by ElevenLabs.** Stay on the existing provider, route voice ID per language. **No additional provider setup needed for Phase 1.**
- **Korean is supported by ElevenLabs.** Phase 2 ko work is voice selection only.
- **Haitian Creole is unsupported by every major commercial TTS provider** — ElevenLabs, Azure, Google Cloud, and Amazon Polly all lack it. This is a real Phase 2 blocker, not just a risk. See §4 for options.
- **Bengali on ElevenLabs is supported** including Bangladeshi/Dhaka dialect. The community Voice Library has fewer Bengali voices than Spanish/Mandarin (audition the available ones), but ElevenLabs is the default path. Azure has dedicated Bangladeshi-dialect voices and is mentioned in §3 as an *optional* fallback if native-speaker review of the ElevenLabs voice fails — not a recommended starting point.
- **ElevenLabs free tier covers development and accuracy testing comfortably (~15–20 calls/month) but not production rollout** — 10k credits/month, no commercial license. Plan for Starter ($5/mo, commercial license + 30k credits) at a minimum before launching to real residents.

---

## 2. Provider × Language Support Matrix

| Language | ElevenLabs | Azure | Google Cloud | Amazon Polly |
|---|---|---|---|---|
| English (en) | ✓ | ✓ | ✓ | ✓ |
| Spanish (es) | ✓ | ✓ | ✓ | ✓ |
| Bengali (bn) | ✓ (general) | ✓ (`bn-BD-*` Bangladeshi dialect, `bn-IN-*` Indian) | ✓ | ✗ |
| Mandarin (zh) | ✓ | ✓ | ✓ | ✓ |
| Korean (ko) | ✓ | ✓ | ✓ | ✓ |
| **Haitian Creole (ht)** | **✗** | **✗** | **✗** | **✗** |

Sources: [ElevenLabs language list](https://elevenlabs.io/languages), [Azure Speech language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support), [Google Cloud TTS voice list](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types), [Amazon Polly voices](https://docs.aws.amazon.com/polly/latest/dg/available-voices.html).

---

## 3. Per-Language Voice Recommendations

All voice IDs below are **starting points** — final selection should be ratified by a native speaker per V8 of the PRD (the human review step). All recommendations skew toward calm, conversational, female voices for tonal consistency with the existing English `sarah` voice.

### English (en)

Current: `sarah` on ElevenLabs.

| Voice | ID | Notes |
|---|---|---|
| Sarah (current) | `EXAVITQu4vr4xnSDxMaL` | "Generic friendly voice" per `route.ts:64`. Older default voice. Fine to keep. |
| **Rachel** (alternative) | `21m00Tcm4TlvDq8ikWAM` | Most popular conversational female voice in the library, pairs well tonally with the Latin-American Spanish picks below. |

### Spanish (es)

| Voice | ID | Notes |
|---|---|---|
| **Alma — Warm, Clear and Friendly** | `3ttovAt5bt3Kk38UGIob` | **Top pick.** Neutral Latin American accent — beats Castilian for NYC's predominantly Caribbean/Mexican Spanish-speaking population. "Clear and friendly, for conversational experiences." |
| Serena AI | `IOyj8WtBHdke2FjQgGAr` | Colombian, mid-twenties, smooth and calm. Strong second. |
| Elena | `meyBySCAtUDmCr3eJJ1C` | Neutral accent, "friendly and trustworthy." |
| Lina — Carefree & Friendly | `VmejBeYhbrcTPwDniox7` | Colombian, warm/conversational. |
| Sofía — Natural and Soft | `b2htR0pMe28pYwCY9gnP` | Medellín-Colombian, soft — possibly too soft for emergency context. |

Source: [json2video — ElevenLabs Spanish voices](https://json2video.com/ai-voices/elevenlabs/languages/spanish/).

### Mandarin (zh)

| Voice | ID | Notes |
|---|---|---|
| **Susan** | `kAIqZ7fZv234ClKXwzDx` | **Top pick.** "Clear & calm," very clean delivery. Most appropriate for an emergency check-in. |
| Sage | `APSIkVZudNbPAwyPoeVO` | Warm, soothing, calm/grounded. |
| Yun | `YxbjaPemDJV2xlfvkiIG` | Elegant, gentle. |
| Zi Yue | `5qr5FEpvZGzmVOPBS55W` | Gentle, delicate, soft tone. |
| Coco Li | `Ca5bKgudqKJzq8YRFoAz` | Young, **Shanghai-accented** — non-standard accent in an emergency context; pass. |

Source: [json2video — ElevenLabs Mandarin voices](https://json2video.com/ai-voices/elevenlabs/languages/chinese/).

### Bengali (bn)

ElevenLabs supports Bengali including Bangladeshi (Dhaka), West Bengal, Chittagonian, and Sylheti dialects via Eleven v3 / Multilingual v2. The catch is that the **community Voice Library has fewer Bengali voices** than Spanish or Mandarin — third-party voice catalogs (json2video, BeyondWords, etc.) don't surface specific Bengali voice IDs the way they do for European languages, because most Bengali Voice Library entries aren't curated/professional clones.

**Recommended path (no extra provider setup):**

1. Audition directly at [elevenlabs.io/voice-library](https://elevenlabs.io/voice-library) → filter by Bengali. Expect roughly 3–10 voices. Pick the best Bangladeshi/Dhaka-accented female voice and set it as the `bn` voice ID in the `LANG_TO_VOICE` map (§6).
2. Validate quality during the V8 native-speaker review step. If quality is acceptable, lock it in.

**Fallback (only if ElevenLabs Bengali fails native-speaker review):**

If a native Bengali speaker reviewing the test calls says the ElevenLabs Bengali voice is unintelligible or strongly off-dialect, **then** consider adding Azure as a second TTS provider just for Bengali. Vapi supports per-call provider switching, so this is feasible without ripping out ElevenLabs. Azure's Bangladeshi-specific voices:

- `bn-BD-NabanitaNeural` (Female, Bangladeshi)
- `bn-BD-PradeepNeural` (Male, Bangladeshi)
- `bn-IN-TanishaaNeural` / `bn-IN-BashkarNeural` (Indian — fallback only)

Azure adds an extra API key, billing setup, and configuration surface — **don't take this on speculatively.** Only invoke this fallback if ElevenLabs Bengali demonstrably fails the V8 review.

### Korean (ko) — Phase 2

ElevenLabs supports Korean. Specific voice IDs not yet researched — audition during Phase 2 voice selection. Native Korean speaker confirms during V14.

### Haitian Creole (ht) — Phase 2 — see §4

No commercial TTS provider supports it. Decision needed before Phase 2 voice work begins.

---

## 4. The Haitian Creole Gap

ElevenLabs, Azure, Google Cloud, and Amazon Polly **all** lack Haitian Creole TTS. The PRD's V12 ("evaluate alternative provider") originally assumed an alternative existed — it does not, at least not among major Vapi-integrated providers.

Three real options:

### Option 1 — Defer ht voice indefinitely
- Keep Haitian Creole as an **intake-only language** (resident can register and have their preference recorded; the Section 5 checkbox already supports it).
- Welfare-check call falls back to English for ht-preferred residents.
- **Cost:** zero engineering. **Cost to the resident:** they hear English when they wanted Haitian Creole — partial regression on the program's promise.

### Option 2 — Specialty / open-source provider
- **ReadSpeaker** reportedly has a Haitian Creole voice (commercial, not free).
- **Coqui TTS** open-source has community models for Haitian Creole; quality varies.
- Both require integrating via [Vapi's custom TTS path](https://docs.vapi.ai/customization/custom-voices/custom-tts) — non-trivial engineering.
- **Cost:** medium-to-high engineering, unknown quality, possibly recurring license fees.

### Option 3 — Human callback for Haitian Creole
- For ht-preferred residents, the system flags the resident for a manual welfare-check call by a CBO volunteer or canvasser fluent in Haitian Creole, instead of placing an automated call.
- **Cost:** zero engineering for the call itself; requires a flag/queue for "needs human callback."
- **Best fit for a community-based program** — the ht-speaking community in NYC is concentrated and a CBO partner likely already has volunteers.

**Recommendation:** Option 3 (human callback) for the first ht rollout. Option 2 reconsidered later if the volume justifies it.

---

## 5. Free Tier Limits

### ElevenLabs (current provider)

- **10,000 credits/month** (~10k characters of TTS output)
- **No commercial license** on free — production deployment is technically out-of-bounds
- Conversational AI runs out when credits do; **no usage-based overage on free**
- All models accessible (Multilingual v2, Flash v2.5, v3) and Voice Library fully browsable

**Realistic call math:** a 30-second welfare-check generates ~600–800 characters of TTS for the system's side. Free tier ≈ **15–20 calls/month** before cutoff. Fine for development and accuracy testing (V5–V7); insufficient for production rollout.

### Free-tier alternatives (if cost matters at scale)

| Provider | Free allowance | Notes |
|---|---|---|
| Google Cloud TTS | 4M chars/month (Standard), 1M (Neural2/WaveNet) | Most generous. No Haitian Creole, no Bangladeshi-specific Bengali. |
| Amazon Polly | 5M chars/month | First 12 months only. No Bengali, no Haitian Creole. |
| Azure | 0.5M chars/month (Neural) | First 12 months only. Has Bangladeshi Bengali (`bn-BD-*`). |

**For Phase 1 production:** budget for ~$5/month ElevenLabs Starter (commercial license + 30k credits) at minimum. If volume grows beyond ~50 calls/month, move to Creator ($22/month, 100k credits + usage-based overage).

### Model selection

ElevenLabs has three relevant models:

| Model | Languages | Latency | Use |
|---|---|---|---|
| **Flash v2.5** | 32 | Low (~75ms) | **Default for live phone calls.** What we need for the welfare check. |
| Multilingual v2 | 29 | Medium | Older, higher-quality alternative |
| Eleven v3 | 74 | Higher | Best quality, but latency unsuitable for real-time conversation |

**Recommendation:** Flash v2.5 for the welfare-check use case. Verify all four Phase 1 languages render acceptably on Flash specifically (most do; bn quality is the most uncertain).

---

## 6. Implementation Sketch

The current code at `src/app/api/vapi/trigger/route.ts:62-65` hardcodes voice + provider:

```ts
voice: {
    provider: "11labs",
    voiceId: "sarah" // Generic friendly voice
}
```

Phase 1 V1 needs this to vary per `resident.language`. Suggested map:

```ts
const LANG_TO_VOICE: Record<string, { provider: string; voiceId: string; model?: string }> = {
  en: { provider: '11labs', voiceId: 'EXAVITQu4vr4xnSDxMaL', model: 'eleven_flash_v2_5' }, // Sarah, current
  es: { provider: '11labs', voiceId: '3ttovAt5bt3Kk38UGIob', model: 'eleven_flash_v2_5' }, // Alma
  zh: { provider: '11labs', voiceId: 'kAIqZ7fZv234ClKXwzDx', model: 'eleven_flash_v2_5' }, // Susan
  bn: { provider: '11labs', voiceId: 'TBD',                  model: 'eleven_flash_v2_5' }, // Audition Bengali Voice Library; fallback to Azure only if native-speaker review fails (§3)
  ko: { provider: '11labs', voiceId: 'TBD',                  model: 'eleven_flash_v2_5' }, // Phase 2
  // ht: no provider — fallback to en or human callback per §4
};

const voiceConfig = LANG_TO_VOICE[resident.language] ?? LANG_TO_VOICE.en;
```

In addition to TTS routing, V1 also requires the AI's output language and the speech-to-text language to match. For Vapi:
- **AI output language:** instruct the model in the system prompt (`"respond only in {{language}}"`) or pass language code in the assistant config
- **Speech-to-text:** Vapi's `transcriber` config takes a language code; needs to match the resident's language

Per-call switching is supported by Vapi natively — see [Vapi multilingual docs](https://docs.vapi.ai/customization/multilingual).

---

## 7. Open Questions for Native-Speaker Review

These ratify or override the recommendations above. Owners: native-speaker reviewers recruited per V6 of the PRD.

- **Spanish:** is Alma's neutral LatAm accent the right choice for NYC's Spanish-speaking population (predominantly Dominican, Puerto Rican, Mexican)? Or does a Caribbean/Mexican-specific voice land better?
- **Mandarin:** is Susan's accent acceptable to NYC's Mandarin-speaking population? Mainland-Standard vs. Taiwan vs. other.
- **Bengali:** is the ElevenLabs Bengali voice (selected from Voice Library audition) acceptable for Bangladeshi/Dhaka speakers? If yes, lock it in. If a native reviewer says no, *then* consider the Azure fallback — but not before.
- **Korean (Phase 2):** does our usual ElevenLabs default sound natural? Or does a Korean-specific voice from a Korean-tuned provider beat it?

---

## 8. Sources

- [ElevenLabs language list (74 langs)](https://elevenlabs.io/languages)
- [ElevenLabs Pricing](https://elevenlabs.io/pricing)
- [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)
- [ElevenLabs models overview](https://elevenlabs.io/docs/overview/models)
- [Azure Speech language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support)
- [Google Cloud TTS voice list](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types)
- [Amazon Polly voices](https://docs.aws.amazon.com/polly/latest/dg/available-voices.html)
- [Vapi multilingual docs](https://docs.vapi.ai/customization/multilingual)
- [Vapi custom TTS integration](https://docs.vapi.ai/customization/custom-voices/custom-tts)
- [json2video — ElevenLabs Spanish voices](https://json2video.com/ai-voices/elevenlabs/languages/spanish/)
- [json2video — ElevenLabs Mandarin voices](https://json2video.com/ai-voices/elevenlabs/languages/chinese/)
