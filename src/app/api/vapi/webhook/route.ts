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

        // We only care about function calls (reports) and call status updates
        if (message.type === 'function-call') {
            const functionCall = message.functionCall;
            if (functionCall.name === 'reportStatus') {
                const args = JSON.parse(functionCall.parameters);
                const { status, summary } = args;

                const callMetadata = payload.message.call?.metadata || {}; // Where we stored residentId
                const residentId = callMetadata.residentId;

                if (residentId) {
                    console.log(`Received Report for ${residentId}: ${status}`);

                    // 1. Update Resident Status
                    await supabase
                        .from('residents')
                        .update({ status: status })
                        .eq('id', residentId);

                    // 2. Log the Call
                    await supabase.from('call_logs').insert({
                        resident_id: residentId,
                        vapi_call_id: payload.message.call?.id,
                        summary: summary,
                        risk_label: status
                    });

                    // 3. Trigger Alert if Distress
                    if (status === 'distress') {
                        // Fetch Liaison's Telegram ID
                        const { data: resident } = await supabase.from('residents').select('*, profiles(telegram_chat_id, org_name)').eq('id', residentId).single();

                        if (resident && resident.profiles?.telegram_chat_id) {
                            await sendTelegramAlert(resident.profiles.telegram_chat_id, resident.name, summary);
                        }
                    }
                }
            }
        } else if (message.type === 'end-of-call-report') {
            const analysis = message.analysis;
            const summary = analysis?.summary || "Call completed (No summary generated).";
            const callMetadata = payload.message.call?.metadata || {};
            const residentId = callMetadata.residentId;

            if (residentId) {
                console.log(`End of Call Report for ${residentId}: ${summary}`);

                // Check if we already logged this via function call to avoid duplicates?
                // For MVP, simple insert is safer to ensure visibility. 
                // We can use the 'vapi_call_id' to deduplicate if needed, 
                // but let's just insert for now so the user SEES something.

                // Determine risk from summary if possible, or default to 'pending'/'safe'
                // Simple heuristic: if summary contains "danger" or "help", mark distress? 
                // Better: keep it 'safe' or 'pending' unless explicitly flagged.
                // Actually, let's just log it.

                await supabase.from('call_logs').insert({
                    resident_id: residentId,
                    vapi_call_id: payload.message.call?.id,
                    summary: summary,
                    risk_label: 'safe' // Default to safe if no explicit distress flag
                });

                // Also update resident to 'safe' if they were pending? 
                // Maybe not, we don't want to overwrite a 'distress' status.
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Webhook Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
