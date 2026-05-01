import { NextResponse } from 'next/server';

// NYC City Council Districts — 51 polygons, shoreline-clipped.
// Dataset: https://data.cityofnewyork.us/City-Government/City-Council-Districts/yusd-j4xi
// Socrata's geospatial export returns ready-to-render GeoJSON in a single response —
// no pagination needed (unlike FEMA's NFHL which has thousands of features).
const COUNCIL_DISTRICTS_URL =
    'https://data.cityofnewyork.us/api/geospatial/yusd-j4xi?method=export&format=GeoJSON';

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
