import { NextResponse } from 'next/server';
import { fetchSocrata, DATASETS, type SocrataFloodEvent, type SocrataSensorMetadata } from '@/lib/nyc-opendata';

export async function GET() {
  try {
    // Fetch both datasets in parallel
    const [events, sensors] = await Promise.all([
      fetchSocrata<SocrataFloodEvent>(DATASETS.floodEvents, {
        '$limit': '5000',
        '$order': 'flood_start_time DESC',
      }),
      fetchSocrata<SocrataSensorMetadata>(DATASETS.sensorMetadata, {
        '$limit': '200',
      }),
    ]);

    // Build sensor lookup by sensor_id
    const sensorLookup = new Map<string, SocrataSensorMetadata>();
    for (const s of sensors) {
      sensorLookup.set(s.sensor_id, s);
    }

    // --- Borough Flood Frequency ---
    const boroughStats: Record<string, { events: number; totalDepth: number; totalDuration: number }> = {};
    for (const event of events) {
      const meta = sensorLookup.get(event.sensor_id);
      const borough = meta?.borough || inferBoroughFromName(event.sensor_name);
      if (!borough) continue;

      if (!boroughStats[borough]) {
        boroughStats[borough] = { events: 0, totalDepth: 0, totalDuration: 0 };
      }
      boroughStats[borough].events++;
      boroughStats[borough].totalDepth += parseFloat(event.max_depth_inches || '0');
      boroughStats[borough].totalDuration += parseFloat(event.duration_mins || '0');
    }

    const boroughFrequency = Object.entries(boroughStats)
      .map(([borough, stats]) => ({
        borough,
        events: stats.events,
        avgDepth: stats.events > 0 ? +(stats.totalDepth / stats.events).toFixed(2) : 0,
        avgDuration: stats.events > 0 ? +(stats.totalDuration / stats.events).toFixed(1) : 0,
      }))
      .sort((a, b) => b.events - a.events);

    // --- Hotspot Sensors ---
    const sensorStats: Record<string, { name: string; events: number; maxDepth: number; totalDuration: number; borough: string }> = {};
    for (const event of events) {
      const id = event.sensor_id;
      const meta = sensorLookup.get(id);

      if (!sensorStats[id]) {
        sensorStats[id] = {
          name: event.sensor_name,
          events: 0,
          maxDepth: 0,
          totalDuration: 0,
          borough: meta?.borough || inferBoroughFromName(event.sensor_name) || 'Unknown',
        };
      }
      sensorStats[id].events++;
      const depth = parseFloat(event.max_depth_inches || '0');
      if (depth > sensorStats[id].maxDepth) sensorStats[id].maxDepth = depth;
      sensorStats[id].totalDuration += parseFloat(event.duration_mins || '0');
    }

    const hotspots = Object.entries(sensorStats)
      .map(([sensorId, stats]) => ({
        sensorId,
        name: stats.name,
        borough: stats.borough,
        events: stats.events,
        maxDepth: +stats.maxDepth.toFixed(2),
        avgDuration: stats.events > 0 ? +(stats.totalDuration / stats.events).toFixed(1) : 0,
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10);

    // --- Tidal vs Non-Tidal ---
    const tidalStats = { events: 0, totalDepth: 0, totalDuration: 0, totalOnset: 0, totalDrain: 0 };
    const nonTidalStats = { events: 0, totalDepth: 0, totalDuration: 0, totalOnset: 0, totalDrain: 0 };

    for (const event of events) {
      const meta = sensorLookup.get(event.sensor_id);
      // Skip if we can't determine tidal status
      if (!meta) continue;

      const isTidal = meta.tidally_influenced?.toLowerCase() === 'yes';
      const target = isTidal ? tidalStats : nonTidalStats;

      target.events++;
      target.totalDepth += parseFloat(event.max_depth_inches || '0');
      target.totalDuration += parseFloat(event.duration_mins || '0');
      target.totalOnset += parseFloat(event.onset_time_mins || '0');
      target.totalDrain += parseFloat(event.drain_time_mins || '0');
    }

    const tidalComparison = {
      tidal: {
        events: tidalStats.events,
        avgDepth: tidalStats.events > 0 ? +(tidalStats.totalDepth / tidalStats.events).toFixed(2) : 0,
        avgDuration: tidalStats.events > 0 ? +(tidalStats.totalDuration / tidalStats.events).toFixed(1) : 0,
        avgOnset: tidalStats.events > 0 ? +(tidalStats.totalOnset / tidalStats.events).toFixed(1) : 0,
        avgDrain: tidalStats.events > 0 ? +(tidalStats.totalDrain / tidalStats.events).toFixed(1) : 0,
      },
      nonTidal: {
        events: nonTidalStats.events,
        avgDepth: nonTidalStats.events > 0 ? +(nonTidalStats.totalDepth / nonTidalStats.events).toFixed(2) : 0,
        avgDuration: nonTidalStats.events > 0 ? +(nonTidalStats.totalDuration / nonTidalStats.events).toFixed(1) : 0,
        avgOnset: nonTidalStats.events > 0 ? +(nonTidalStats.totalOnset / nonTidalStats.events).toFixed(1) : 0,
        avgDrain: nonTidalStats.events > 0 ? +(nonTidalStats.totalDrain / nonTidalStats.events).toFixed(1) : 0,
      },
      sensorCount: {
        tidal: sensors.filter(s => s.tidally_influenced?.toLowerCase() === 'yes').length,
        nonTidal: sensors.filter(s => s.tidally_influenced?.toLowerCase() !== 'yes').length,
      },
    };

    return NextResponse.json({
      totalEvents: events.length,
      totalSensors: sensors.length,
      boroughFrequency,
      hotspots,
      tidalComparison,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Failed to compute flood analytics:', error);
    return NextResponse.json(
      { error: 'Failed to compute flood analytics' },
      { status: 500 }
    );
  }
}

function inferBoroughFromName(name: string): string | undefined {
  const prefix = name.trim().split(/\s*-\s*/)[0]?.toLowerCase();
  const map: Record<string, string> = {
    bk: 'Brooklyn',
    q: 'Queens',
    m: 'Manhattan',
    bx: 'Bronx',
    si: 'Staten Island',
  };
  return prefix ? map[prefix] : undefined;
}
