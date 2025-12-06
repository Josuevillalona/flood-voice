import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeTranscript } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const { callId } = await request.json();

        if (!callId) {
            return NextResponse.json({ error: 'Missing callId' }, { status: 400 });
        }

        // 1. Fetch Transcript
        const { data: log, error } = await supabase
            .from('call_logs')
            .select('transcript, summary')
            .eq('id', callId)
            .single();

        if (error || !log) {
            return NextResponse.json({ error: 'Call log not found' }, { status: 404 });
        }

        const transcript = log.transcript || log.summary; // Fallback to summary if no raw transcript
        if (!transcript) {
            return NextResponse.json({ error: 'No text to analyze' }, { status: 400 });
        }

        // 2. Perform AI Analysis
        console.log(`Analyzing call ${callId}...`);
        const analysis = await analyzeTranscript(transcript);

        if (!analysis) {
            return NextResponse.json({ error: 'AI Analysis Failed' }, { status: 500 });
        }

        // 3. Save Results
        const { error: updateError } = await supabase
            .from('call_logs')
            .update({
                tags: analysis.tags,
                sentiment_score: analysis.sentiment_score,
                key_topics: analysis.key_topics,
                processed_at: new Date().toISOString()
            })
            .eq('id', callId);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, analysis });

    } catch (error: any) {
        console.error('Analysis API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
