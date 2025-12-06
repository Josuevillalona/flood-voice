import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const VAPI_URL = 'https://api.vapi.ai/call';
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;

// The "Brain" of the Voice Agent
// Note: This must be nested inside an 'assistant' object in the call payload
const ASSISTANT_CONFIG = {
    model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
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
    // console.error(`Vapi Error for ${resident.name}:`, errText);
    // Return structured error for dashboard to display
    try {
        const jsonErr = JSON.parse(errText);
        return { residentId: resident.id, success: false, error: JSON.stringify(jsonErr) };
    } catch {
        return { residentId: resident.id, success: false, error: errText };
    }
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
