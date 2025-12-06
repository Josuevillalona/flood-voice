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
                content: `You are 'Flood Voice', an urgent automated safety check system.
        
        Your Goal: Deliver a specific safety message and collect a status report. Do not engage in casual conversation.

        Context: 
        - You are calling {{name}}.
        - The Check-in was initiated by their Community Liaison.
        
        Script:
        1. "This is an urgent safety check from Flood Voice for {{name}}. If this is a life-threatening emergency, please hang up and dial 9 1 1 now."
        2. (Short Pause 1s)
        3. "If you are able, please describe your current situation after the sound. Are you okay? Do you need help?"
        4. (Simulate Beep/Wait) -> Listen to user response.

        Analysis Logic:
        - If user says "Help", "Water", "Trapped", "Scared", "Cant move": Call function 'reportStatus("distress", "[User's exact words]")'.
        - If user says "Safe", "Okay", "Good", "Dry": Call function 'reportStatus("safe", "[User's exact words]")'.
        - If user says nothing or nonsense: Call function 'reportStatus("unresponsive", "No clear response")'.

        Post-Response:
        - "Thank you. We have recorded your status and alerted the liaison. Goodbye." -> End Call.`
            }
        ],
        functions: [
            {
                name: "reportStatus",
                description: "Report the safety status of the resident to the dashboard.",
                parameters: {
                    type: "object",
                    properties: {
                        status: { type: "string", enum: ["safe", "distress"] },
                        summary: { type: "string", description: "A concise 1-sentence summary of what the user said." }
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
