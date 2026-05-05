import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const VAPI_URL = 'https://api.vapi.ai/call';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;

// Per-language voice config — see documentation/voice_model_research.md §3 for selection rationale.
// Bengali voice ID is TBD pending Voice Library audition; bn falls back to en until added.
const LANG_TO_VOICE: Record<string, { provider: string; voiceId: string; model?: string }> = {
    en: { provider: "11labs", voiceId: "sarah" }, // Generic friendly voice (current default)
    es: { provider: "11labs", voiceId: "3ttovAt5bt3Kk38UGIob", model: "eleven_flash_v2_5" }, // Alma — neutral Latin American
    zh: { provider: "11labs", voiceId: "kAIqZ7fZv234ClKXwzDx", model: "eleven_flash_v2_5" }, // Susan — clear & calm
    // bn: TBD — audition Bengali Voice Library, then add here.
};

// Per-language transcriber language code (Deepgram Nova-3 supports all four Phase 1 languages).
const LANG_TO_STT: Record<string, string> = {
    en: "en",
    es: "es",
    zh: "zh",
    bn: "bn",
};

// Per-language hardcoded greeting (the firstMessage spoken before the AI takes over).
// {name} is replaced with resident.name at call time.
const LANG_TO_GREETING: Record<string, string> = {
    en: "Hi, this is Flood Voice calling for {name}. We are checking on your safety.",
    es: "Hola, soy Flood Voice. Llamamos a {name} para verificar su seguridad.",
    zh: "您好，这里是 Flood Voice。我们正在联系 {name}，确认您的安全状况。",
    // bn: TBD — pair with bn voice rollout.
};

// Human-readable language name injected into the system prompt as {{language}}.
const LANG_TO_DISPLAY: Record<string, string> = {
    en: "English",
    es: "Spanish",
    zh: "Mandarin Chinese",
    bn: "Bengali",
};

// The "Brain" of the Voice Agent
// Note: This must be nested inside an 'assistant' object in the call payload.
// Voice and transcriber are set per-call based on resident.language; see ASSISTANT_CONFIG usage below.
const ASSISTANT_CONFIG = {
    model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are 'Flood Voice', a calm and helpful disaster response assistant.

IMPORTANT: Conduct this entire call in {{language}}. Speak only {{language}} for every greeting, question, follow-up, and closing line. If the resident replies in a different language, gently continue responding in {{language}}.

Your Goal: Verify the resident's safety and collect details about local flooding conditions.

Resident Context:
{{context_info}}

Conversation Flow:
1. **Safety First**: "Hi, this is Flood Voice calling for {{name}}. We are checking on your safety. Are you in any immediate danger?"
   - **IF DANGER** (Trapped, medical emergency, rising water):
     - Instruct them to hang up and call 911 immediately.
     - Call function 'reportStatus("distress", "[Details]")'.
     - End call.

2. **Investigation** (If Safe):
   - "Glad to hear you are safe. We are tracking flood levels. Is there any active flooding around your building right now?"
   - **Refine Details**:
     - "How deep would you say the water is? Ankle deep? Knee deep?"
     - "Is the water entering your home or basement?"
     - **Contextual Follow-up**: If they have health conditions or mobility issues (see Context), ask if they have support or need assistance moving.

3. **Close**:
   - "Thank you for that information. I've updated your status. Please stay safe."
   - Call function 'reportStatus("safe", "[Summary of flooding conditions]")'.

Style Guide:
- Be empathetic but efficient.
- If they are chatty, kindly steer back to safety questions.
- If they sound confused, reassure them this is a standard community check-in.
- The example phrasings above are in English for the prompt's clarity — translate them naturally into {{language}} when speaking. Do not read them verbatim in English.`
            }
        ],
        functions: [
            {
                name: "reportStatus",
                description: "Report the safety status and flooding conditions to the dashboard.",
                parameters: {
                    type: "object",
                    properties: {
                        status: { type: "string", enum: ["safe", "distress"] },
                        summary: { type: "string", description: "A summary of the resident's situation and flooding details (e.g., 'Safe, but basement flooding 2 inches')." }
                    },
                    required: ["status", "summary"]
                }
            }
        ]
    }
};

// Helper: Ensure phone number is E.164 compliant
const formatPhoneNumber = (phone: string) => {
    // Remove non-digit chars
    const cleaned = phone.replace(/\D/g, '');

    // If it's 10 digits (US standard), add +1
    if (cleaned.length === 10) return `+1${cleaned}`;

    // If it starts with 1 and is 11 digits, add +
    if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;

    // If already has + (was stripped above but checked here logic-wise) -> just return +cleaned
    // Simpler: assume if <10 it's invalid, if >15 invalid.
    return `+${cleaned}`;
};

export async function POST(request: Request) {
    try {
        if (!VAPI_PRIVATE_KEY) {
            return NextResponse.json({ error: 'Missing VAPI_PRIVATE_KEY' }, { status: 500 });
        }

        // Parse optional target body
        let targetResidentId = null;
        try {
            const body = await request.json();
            targetResidentId = body.targetResidentId;
        } catch (e) {
            // No body provided, assume bulk triggering is intent (or standard POST)
        }

        // 1. Build Query
        let query = supabase
            .from('residents')
            .select('*')
            .neq('status', 'unresponsive') // Don't spam unresponsive by default
            .neq('status', 'safe'); // Don't call those already confirmed safe

        if (targetResidentId) {
            console.log(`Targeting single resident: ${targetResidentId}`);
            query = query.eq('id', targetResidentId);
        }

        const { data: residents, error } = await query;

        if (error || !residents) {
            return NextResponse.json({ error: 'Failed to fetch residents' }, { status: 500 });
        }

        if (residents.length === 0) {
            console.warn(`[VAPI-TRIGGER] Query returned 0 residents. Targeted id=${targetResidentId ?? '(none)'}. Resident may have status='safe' or 'unresponsive', which the query filters out.`);
            return NextResponse.json({ message: 'No eligible residents found to call.' }, { status: 200 });
        }

        console.log(`Triggering calls for ${residents.length} resident(s)...`);

        // 2. Loop and Call Vapi
        const callPromises = residents.map(async (resident) => {
            // Skip if no phone (sanity check)
            if (!resident.phone_number) {
                console.warn(`[VAPI-TRIGGER] Skipping ${resident.id} — no phone_number on record`);
                return null;
            }

            const formattedPhone = formatPhoneNumber(resident.phone_number);

            // Construct Context String
            const contextParts = [];
            if (resident.age) contextParts.push(`Age: ${resident.age}`);
            if (resident.language) contextParts.push(`Language: ${resident.language}`);
            if (resident.address) contextParts.push(`Address: ${resident.address}`);
            if (resident.health_conditions) contextParts.push(`Health Conditions: ${resident.health_conditions}`);
            const contextInfo = contextParts.length > 0 ? contextParts.join('. ') : "No specific context available.";

            // Resolve language config — fall back to English if resident.language is unset or not yet supported (e.g. bn, ko, ht).
            const langCode = (resident.language && LANG_TO_VOICE[resident.language]) ? resident.language : 'en';
            const voice = LANG_TO_VOICE[langCode];
            const sttLanguage = LANG_TO_STT[langCode];
            const greeting = LANG_TO_GREETING[langCode].replace('{name}', resident.name);
            const displayLanguage = LANG_TO_DISPLAY[langCode];

            const payload = {
                phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
                customer: {
                    number: formattedPhone,
                },
                assistant: {
                    ...ASSISTANT_CONFIG,
                    voice,
                    transcriber: {
                        provider: 'deepgram',
                        model: 'nova-3',
                        language: sttLanguage,
                    },
                    firstMessage: greeting,
                },
                assistantOverrides: {
                    variableValues: {
                        name: resident.name,
                        context_info: contextInfo,
                        language: displayLanguage,
                    }
                },
                // Metadata for tracking in webhook
                metadata: {
                    residentId: resident.id,
                    podId: resident.liaison_id,
                    language: langCode, // For webhook to know what language to translate from when storing transcripts
                }
            };

            // Update local status to 'pending'/'calling' — but preserve 'distress' so manual flags aren't wiped
            if (resident.status !== 'distress') {
                await supabase.from('residents').update({ status: 'pending' }).eq('id', resident.id);
            }

            const response = await fetch(VAPI_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[VAPI-TRIGGER] Vapi rejected call for ${resident.id} (status ${response.status}):`, errText);
                // Return structured error for dashboard to display
                try {
                    const jsonErr = JSON.parse(errText);
                    return { residentId: resident.id, success: false, error: JSON.stringify(jsonErr) };
                } catch {
                    return { residentId: resident.id, success: false, error: errText };
                }
            }

            const result = await response.json();
            console.log(`[VAPI-TRIGGER] Vapi accepted call for ${resident.id} (lang=${langCode}, vapiId=${result.id})`);
            return { residentId: resident.id, vapiId: result.id, success: true };
        });

        const results = await Promise.all(callPromises);

        return NextResponse.json({
            message: `Triggered ${results.length} calls`,
            results
        });

    } catch (err: any) {
        console.error("Trigger Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
