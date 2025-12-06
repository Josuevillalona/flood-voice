import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const VAPI_URL = 'https://api.vapi.ai/call';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;

// The "Brain" of the Voice Agent
const ASSISTANT_CONFIG = {
    model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are 'Flood Voice', a calm and helpful disaster response assistant.

Your Goal: Verify the resident's safety and collect details about local flooding conditions.

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

3. **Close**:
   - "Thank you for that information. I've updated your status. Please stay safe."
   - Call function 'reportStatus("safe", "[Summary of flooding conditions]")'.

Style Guide:
- Be empathetic but efficient.
- If they are chatty, kindly steer back to safety questions.
- If they sound confused, reassure them this is a standard community check-in.`
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
    },
    voice: {
        provider: "11labs",
        voiceId: "sarah" // Generic friendly voice
    }
};

export async function POST(request: Request) {
    try {
        if (!VAPI_PRIVATE_KEY) {
            return NextResponse.json({ error: 'Missing VAPI_PRIVATE_KEY' }, { status: 500 });
        }

        // 1. Fetch Residents (Simulated "Pod" fetch)
        // In real app, we'd fetch based on the logged-in user's Pod ID
        const { data: residents, error } = await supabase
            .from('residents')
            .select('*')
            .neq('status', 'unresponsive'); // Don't spam unresponsive for now

        if (error || !residents) {
            return NextResponse.json({ error: 'Failed to fetch residents' }, { status: 500 });
        }

        console.log(`Triggering calls for ${residents.length} residents...`);

        // 2. Loop and Call Vapi
        const callPromises = residents.map(async (resident) => {
            // Skip if no phone (sanity check)
            if (!resident.phone_number) return null;

            const payload = {
                ...ASSISTANT_CONFIG,
                phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
                customer: {
                    number: resident.phone_number,
                },
                assistantOverrides: {
                    variableValues: {
                        name: resident.name
                    }
                },
                // Metadata for tracking in webhook
                metadata: {
                    residentId: resident.id,
                    podId: resident.liaison_id
                }
            };

            // Update local status to 'pending'/'calling'
            await supabase.from('residents').update({ status: 'pending' }).eq('id', resident.id);

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
                console.error(`Vapi Error for ${resident.name}:`, errText);
                return { residentId: resident.id, success: false, error: errText };
            }

            const result = await response.json();
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
