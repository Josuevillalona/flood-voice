import { NextResponse } from 'next/server';

// FEMA NFHL (National Flood Hazard Layer) — Flood Hazard Zones, layer 28.
// Host moved from /gis/nfhl/rest/ to /arcgis/rest/ — old URL now 404s.
const FEMA_HOST = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query';

// NYC bounding box: lon_min, lat_min, lon_max, lat_max.
const NYC_BBOX = '-74.26,40.47,-73.69,40.93';

// Server-side filter to SFHA (Special Flood Hazard Area) zones we render.
// Skips X (low-risk) and OPEN WATER, which would otherwise eat the per-page budget.
const SFHA_WHERE = "FLD_ZONE IN ('VE','AE','AO','AH','A')";

// Geometry simplification tolerance in degrees (~50m at NYC latitude). Invisible
// at city/borough zoom and shrinks the response from ~16MB to ~650KB per page.
const SIMPLIFY_TOLERANCE = '0.0005';

// ArcGIS REST caps each query response to ~2,000 features. NYC has ~2,800 SFHA
// features, so we paginate via resultOffset until the server stops setting
// `exceededTransferLimit`.
const PAGE_SIZE = 2000;

type Feature = { geometry: unknown; properties: { FLD_ZONE?: string } };
type FeatureCollection = { features: Feature[]; exceededTransferLimit?: boolean };

function pageUrl(offset: number): string {
    const params = new URLSearchParams({
        where: SFHA_WHERE,
        geometry: NYC_BBOX,
        geometryType: 'esriGeometryEnvelope',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'FLD_ZONE,ZONE_SUBTY',
        returnGeometry: 'true',
        maxAllowableOffset: SIMPLIFY_TOLERANCE,
        f: 'geojson',
        resultOffset: String(offset),
        resultRecordCount: String(PAGE_SIZE),
    });
    return `${FEMA_HOST}?${params.toString()}`;
}

export async function GET() {
    try {
        const allFeatures: Feature[] = [];
        let offset = 0;
        // Hard cap on pages so a server-side bug can't loop forever.
        for (let page = 0; page < 5; page++) {
            const response = await fetch(pageUrl(offset), {
                next: { revalidate: 86400 },
            });

            if (!response.ok) {
                throw new Error(`FEMA API Error: ${response.status} ${response.statusText}`);
            }

            const geojson = (await response.json()) as FeatureCollection;
            const features = geojson.features ?? [];
            allFeatures.push(...features);

            // Server signals more pages with `exceededTransferLimit: true`.
            if (!geojson.exceededTransferLimit || features.length === 0) break;
            offset += PAGE_SIZE;
        }

        const filtered = {
            type: 'FeatureCollection',
            features: allFeatures.filter(f => f.geometry && f.properties?.FLD_ZONE),
        };

        return NextResponse.json(filtered, {
            headers: {
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('FEMA Zones Proxy Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
