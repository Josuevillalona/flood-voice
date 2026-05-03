import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    const hasAccess = req.cookies.get('fv_access')?.value === '1';
    if (!hasAccess) {
        const url = req.nextUrl.clone();
        url.pathname = '/';
        url.searchParams.set('locked', '1');
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'],
};
