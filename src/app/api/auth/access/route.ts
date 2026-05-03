import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'fv_access';
const MAX_AGE = 60 * 60 * 8; // 8 hours

export async function POST(req: NextRequest) {
    const { password } = await req.json();
    const expected = process.env.DASHBOARD_PASSWORD;

    if (!expected) {
        // No password set — allow through (dev/staging convenience)
        const res = NextResponse.json({ ok: true });
        res.cookies.set(COOKIE, '1', { httpOnly: true, sameSite: 'lax', maxAge: MAX_AGE, path: '/' });
        return res;
    }

    if (password !== expected) {
        return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, '1', { httpOnly: true, sameSite: 'lax', maxAge: MAX_AGE, path: '/' });
    return res;
}
