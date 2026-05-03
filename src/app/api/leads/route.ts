import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { name, role, company, email, collaborate } = body;

    if (!name?.trim() || !email?.trim()) {
        return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('leads').insert({
        name: name.trim(),
        role: role?.trim() || null,
        company: company?.trim() || null,
        email: email.trim().toLowerCase(),
        collaborate: collaborate?.trim() || null,
    });

    if (error) {
        console.error('leads insert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
