import { NextResponse } from 'next/server';
import { fetchSocrata, DATASETS, type SocrataFloodEvent, type SocrataSensorMetadata } from '@/lib/nyc-opendata';

// Per-district flood event counts over the last 30 days.
// "Flood event" = any record in the NYC Open Data flood-events dataset (already
// definition-aligned with the FloodNet ≥50mm threshold the rest of the dashboard uses).
// Sensor → district mapping comes from the existing sensor metadata `council_district` field —
// no spatial join required. PRD: prd_council_district_overlay.md D7.

const DAYS = 30;

interface FloodCountResponse {
    counts: Record<string, number>; // district number (string) -> event count
    windowDays: number;
    totalEvents: number;
    asOf: string;
}

export async function GET(): Promise<NextResponse<FloodCountResponse | { error: string }>> {
    try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - DAYS);
        // Socrata floating timestamps don't accept timezone — strip the Z.
        const cutoffStr = cutoff.toISOString().replace('Z', '');

        const [events, sensors] = await Promise.all([
            fetchSocrata<SocrataFloodEvent>(DATASETS.floodEvents, {
                '$where': `flood_start_time > '${cutoffStr}'`,
                '$order': 'flood_start_time DESC',
                '$limit': '5000',
            }),
            fetchSocrata<SocrataSensorMetadata>(DATASETS.sensorMetadata, {
                '$limit': '500',
            }),
        ]);

        // sensor_id -> council_district
        const sensorToDistrict = new Map<string, string>();
        for (const s of sensors) {
            if (s.sensor_id && s.council_district) {
                sensorToDistrict.set(s.sensor_id, s.council_district);
            }
        }

        // Aggregate event count per district. A sensor without a known council_district
        // contributes nothing — we'd rather miss a count than mis-attribute it.
        const counts: Record<string, number> = {};
        for (const event of events) {
            const district = sensorToDistrict.get(event.sensor_id);
            if (!district) continue;
            counts[district] = (counts[district] ?? 0) + 1;
        }

        return NextResponse.json({
            counts,
            windowDays: DAYS,
            totalEvents: events.length,
            asOf: new Date().toISOString(),
        }, {
            headers: {
                // 1 hour cache — open question in PRD recommended 1h as plenty for this use case.
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600',
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Council Districts flood-counts error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
