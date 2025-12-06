import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Test: Select SPECIFIC new columns to check if migration ran
        const { data, error } = await supabase
            .from('call_logs')
            .select('id, tags, sentiment_score')
            .limit(1);

        return NextResponse.json({
            status: error ? 'Migration Missing?' : 'Migration OK',
            error,
            data
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
