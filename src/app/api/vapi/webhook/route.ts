import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramAlert(chatId: string, residentName: string, summary: string) {
    if (!TELEGRAM_BOT_TOKEN || !chatId) return;

    const text = `🚨 **DISTRESS ALERT**\n\n**${residentName}** needs help!\n\n📝 *Summary:* "${summary}"\n\n[Check Dashboard](https://floodvoice.vercel.app/dashboard)`;

    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.error("Telegram Alert Failed:", e);
    }
}

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const { message } = payload;

        // 1. Handle Function Calls (Immediate Distress Reporting)
        if (message.type === 'function-call') {
            const functionCall = message.functionCall;
            if (functionCall.name === 'reportStatus') {
                const args = JSON.parse(functionCall.parameters);
                const { status, summary } = args;

                const callMetadata = payload.message.call?.metadata || {};
                const residentId = callMetadata.residentId;

                if (residentId) {
                    console.log(`Received Function Report for ${residentId}: ${status}`);

                    // Update Resident Status
                    await supabase
                        .from('residents')
                        .update({ status: status })
                        .eq('id', residentId);

                    // Log the Call
                    await supabase.from('call_logs').insert({
                        resident_id: residentId,
                        vapi_call_id: payload.message.call?.id,
                        summary: summary,
                        risk_label: status
                    });

                    // Trigger Alert if Distress
                    if (status === 'distress') {
                        const { data: resident } = await supabase.from('residents').select('*, profiles(telegram_chat_id, org_name)').eq('id', residentId).single();

                        if (resident && resident.profiles?.telegram_chat_id) {
                            await sendTelegramAlert(resident.profiles.telegram_chat_id, resident.name, summary);
                        }
                    }
                }
            }
        }
        // 2. Handle End of Call Report (Final Summary & Artifacts)
        else if (message.type === 'end-of-call-report') {
            const analysis = message.analysis;
            const summary = analysis?.summary || "Call completed.";

            // Extract Artifacts
            const artifact = message.artifact || {};
            const recordingUrl = artifact.recordingUrl || null;
            const transcript = artifact.transcript || null;

            const callMetadata = payload.message.call?.metadata || {};
            const residentId = callMetadata.residentId;

            if (residentId) {
                console.log(`End of Call Report for ${residentId}: ${summary}`);

                // Insert Log with Artifacts
                // Note: This might create a duplicate log if 'reportStatus' also fired. 
                // For a robust system, we would upsert based on vapi_call_id, but simple insert is OK for MVP visibility.
                await supabase.from('call_logs').insert({
                    resident_id: residentId,
                    vapi_call_id: payload.message.call?.id,
                    summary: summary,
                    risk_label: 'safe', // Default to safe unless we parse analysis
                    recording_url: recordingUrl,
                    transcript: transcript
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Webhook Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
