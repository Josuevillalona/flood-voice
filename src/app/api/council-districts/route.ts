import { NextResponse } from 'next/server';

// NYC City Council Districts — 51 polygons, shoreline-clipped.
// Dataset: https://data.cityofnewyork.us/dataset/City-Council-Districts/872g-cjhh
// (The older yusd-j4xi ID was decommissioned; 872g-cjhh is the current shoreline-clipped dataset.)
// Each feature has a `coundist` property (district number, 1–51).
// Socrata's geospatial export returns ready-to-render GeoJSON in a single response —
// no pagination needed (unlike FEMA's NFHL which has thousands of features).
const COUNCIL_DISTRICTS_URL =
    'https://data.cityofnewyork.us/api/geospatial/872g-cjhh?method=export&format=GeoJSON';

export async function GET() {
    try {
        const response = await fetch(COUNCIL_DISTRICTS_URL, {
            next: { revalidate: 86400 }, // 24h — districts don't change
        });

        if (!response.ok) {
            throw new Error(`NYC Open Data error: ${response.status} ${response.statusText}`);
        }

        const geojson = await response.json();

        return NextResponse.json(geojson, {
            headers: {
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Council Districts Proxy Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
