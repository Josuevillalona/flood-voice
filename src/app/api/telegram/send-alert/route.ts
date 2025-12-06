import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendDistressAlert } from '@/lib/telegram';

export async function POST(request: Request) {
    try {
        const { residentId, residentName, source } = await request.json();

        if (!residentId || !residentName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get the resident's liaison_id
        const { data: resident } = await supabase
            .from('residents')
            .select('liaison_id')
            .eq('id', residentId)
            .single();

        if (!resident) {
            return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
        }

        // Get liaison's Telegram chat ID
        const { data: profile } = await supabase
            .from('profiles')
            .select('telegram_chat_id')
            .eq('id', resident.liaison_id)
            .single();

        if (!profile?.telegram_chat_id) {
            return NextResponse.json({
                error: 'Liaison does not have Telegram configured',
                message: 'Alert not sent - no telegram_chat_id found'
            }, { status: 200 });
        }

        // Send the alert
        await sendDistressAlert(profile.telegram_chat_id, residentName, residentId);

        return NextResponse.json({
            success: true,
            message: `Alert sent to Telegram (${source || 'unknown'} trigger)`
        });

    } catch (error: any) {
        console.error('Send alert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
