import { NextResponse } from 'next/server';
import { fetchSocrata, DATASETS, type SocrataFloodEvent } from '@/lib/nyc-opendata';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sensorId = searchParams.get('sensor_id');
    const limit = searchParams.get('limit') || '50';
    const days = searchParams.get('days') || '365';

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Socrata floating timestamps don't accept timezone — strip the Z
    const timestamp = daysAgo.toISOString().replace('Z', '');
    let where = `flood_start_time > '${timestamp}'`;
    if (sensorId) {
      where += ` AND sensor_id='${sensorId}'`;
    }

    const events = await fetchSocrata<SocrataFloodEvent>(DATASETS.floodEvents, {
      '$where': where,
      '$order': 'flood_start_time DESC',
      '$limit': limit,
    });

    return NextResponse.json(events, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Failed to fetch flood events from NYC Open Data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flood events' },
      { status: 500 }
    );
  }
}
