import { NextResponse } from 'next/server';
import { fetchSocrata, DATASETS, type SocrataSensorMetadata } from '@/lib/nyc-opendata';

export async function GET() {
  try {
    const sensors = await fetchSocrata<SocrataSensorMetadata>(DATASETS.sensorMetadata, {
      '$limit': '200',
    });

    return NextResponse.json(sensors, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Failed to fetch sensor metadata from NYC Open Data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sensor metadata' },
      { status: 500 }
    );
  }
}
