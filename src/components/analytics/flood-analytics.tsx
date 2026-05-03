'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapPin, Flame, Waves, ArrowUp, ArrowDown, Clock, Droplets } from 'lucide-react';

type BoroughData  = { borough: string; events: number; avgDepth: number; avgDuration: number };
type HotspotData  = { sensorId: string; name: string; borough: string; events: number; maxDepth: number; avgDuration: number };
type TidalSide    = { events: number; avgDepth: number; avgDuration: number; avgOnset: number; avgDrain: number };
type TidalData    = { tidal: TidalSide; nonTidal: TidalSide; sensorCount: { tidal: number; nonTidal: number } };
type AnalyticsData = {
    totalEvents: number; totalSensors: number;
    boroughFrequency: BoroughData[];
    hotspots: HotspotData[];
    tidalComparison: TidalData;
};

const BOROUGH_COLOR: Record<string, string> = {
    'Brooklyn':      '#1A6B7C',
    'Queens':        '#E8A030',
    'Manhattan':     '#C4622D',
    'Bronx':         '#2A8FA4',
    'Staten Island': '#3D4F58',
};

function formatDuration(mins: number): string {
    if (mins < 60) return `${Math.round(mins)}m`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const rankColor  = (i: number) => i === 0 ? '#C4622D' : i === 1 ? '#E8A030' : i === 2 ? 'rgba(232,160,48,.6)' : 'rgba(61,79,88,.4)';
const eventColor = (n: number) => n >= 10 ? '#C4622D' : n >= 5 ? '#E8A030' : 'rgba(61,79,88,.45)';

const CARD: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(61,79,88,.06), 0 4px 12px rgba(61,79,88,.06)',
};
const TITLE: React.CSSProperties = { fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: 700, color: '#3D4F58' };
const META:  React.CSSProperties = { fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.35)', letterSpacing: '.05em' };

export function FloodAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/floodnet/opendata/analytics');
            if (!res.ok) throw new Error('Failed');
            setData(await res.json());
        } catch (err) {
            console.error('FloodAnalytics:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 300000);
        return () => clearInterval(id);
    }, [fetchData]);

    if (isLoading) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={CARD}>
                        <div style={{ height: '8px', background: 'rgba(61,79,88,.08)', borderRadius: '4px', marginBottom: '1rem', width: '60%' }} />
                        {[1, 2, 3].map(j => (
                            <div key={j} style={{ height: '20px', background: 'rgba(61,79,88,.05)', borderRadius: '4px', marginBottom: '.5rem' }} />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    if (!data) return null;

    const maxBoroughEvents = Math.max(...data.boroughFrequency.map(b => b.events), 1);
    const tidalTotal = data.tidalComparison.tidal.events + data.tidalComparison.nonTidal.events;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>

            {/* Borough Flood Frequency */}
            <div style={CARD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
                    <MapPin size={14} style={{ color: '#1A6B7C', flexShrink: 0 }} />
                    <span style={TITLE}>Borough Flood Frequency</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {data.boroughFrequency.map((b) => {
                        const color = BOROUGH_COLOR[b.borough] || '#3D4F58';
                        return (
                            <div key={b.borough}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.25rem' }}>
                                    <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '12px', fontWeight: 600, color }}>{b.borough}</span>
                                    <span style={META}>{b.events} events</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(61,79,88,.07)', borderRadius: '3px', overflow: 'hidden', marginBottom: '.2rem' }}>
                                    <div style={{ height: '100%', borderRadius: '3px', background: color, width: `${(b.events / maxBoroughEvents) * 100}%`, transition: 'width .5s' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '.75rem' }}>
                                    <span style={META}>Depth: {b.avgDepth}&quot;</span>
                                    <span style={META}>Duration: {formatDuration(b.avgDuration)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {data.boroughFrequency.length === 0 && (
                    <p style={{ ...META, textAlign: 'center', padding: '1rem 0', textTransform: 'uppercase', letterSpacing: '.08em' }}>No data available</p>
                )}
                <div style={{ marginTop: '1rem', paddingTop: '.75rem', borderTop: '1px solid rgba(61,79,88,.07)' }}>
                    <span style={META}>{data.totalEvents} total events · {data.totalSensors} sensors</span>
                </div>
            </div>

            {/* Hotspot Sensors */}
            <div style={CARD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
                    <Flame size={14} style={{ color: '#E8A030', flexShrink: 0 }} />
                    <span style={TITLE}>Flood Hotspots</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.375rem', maxHeight: '320px', overflowY: 'auto' }}>
                    {data.hotspots.map((h, i) => (
                        <div key={h.sensorId} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.5rem .625rem', background: 'rgba(61,79,88,.04)', borderRadius: '8px' }}>
                            <span style={{
                                width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'var(--font-plex-mono)', fontSize: '9px', fontWeight: 700,
                                background: `${rankColor(i)}20`, color: rankColor(i),
                            }}>
                                {i + 1}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: 'var(--font-jakarta)', fontSize: '12px', fontWeight: 600, color: '#3D4F58', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {h.name}
                                </div>
                                <div style={META}>{h.borough} · Max: {h.maxDepth}&quot; · {formatDuration(h.avgDuration)}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '12px', fontWeight: 700, color: eventColor(h.events) }}>{h.events}</span>
                                <span style={META}>events</span>
                            </div>
                        </div>
                    ))}
                </div>
                {data.hotspots.length === 0 && (
                    <p style={{ ...META, textAlign: 'center', padding: '1rem 0', textTransform: 'uppercase' }}>No data available</p>
                )}
            </div>

            {/* Tidal vs Non-Tidal */}
            <div style={CARD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
                    <Waves size={14} style={{ color: '#1A6B7C', flexShrink: 0 }} />
                    <span style={TITLE}>Tidal vs Non-Tidal</span>
                </div>
                {tidalTotal === 0 ? (
                    <p style={{ ...META, textAlign: 'center', padding: '1rem 0', textTransform: 'uppercase' }}>No data available</p>
                ) : (
                    <>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ ...META, marginBottom: '.375rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Event Distribution</div>
                            <div style={{ display: 'flex', height: '22px', borderRadius: '20px', overflow: 'hidden', background: 'rgba(61,79,88,.07)' }}>
                                {data.tidalComparison.tidal.events > 0 && (
                                    <div style={{ width: `${(data.tidalComparison.tidal.events / tidalTotal) * 100}%`, background: '#1A6B7C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', fontWeight: 700, color: '#fff' }}>
                                            {data.tidalComparison.tidal.events}
                                        </span>
                                    </div>
                                )}
                                {data.tidalComparison.nonTidal.events > 0 && (
                                    <div style={{ width: `${(data.tidalComparison.nonTidal.events / tidalTotal) * 100}%`, background: 'rgba(61,79,88,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', fontWeight: 700, color: '#fff' }}>
                                            {data.tidalComparison.nonTidal.events}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.375rem' }}>
                                <span style={{ ...META, color: '#2A8FA4' }}>Tidal ({data.tidalComparison.sensorCount.tidal} sensors)</span>
                                <span style={META}>Non-tidal ({data.tidalComparison.sensorCount.nonTidal} sensors)</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.375rem' }}>
                            {([
                                { label: 'Avg Depth',    Icon: Droplets, tidal: `${data.tidalComparison.tidal.avgDepth}"`,            nonTidal: `${data.tidalComparison.nonTidal.avgDepth}"`,            tidalWorse: data.tidalComparison.tidal.avgDepth > data.tidalComparison.nonTidal.avgDepth },
                                { label: 'Avg Duration', Icon: Clock,    tidal: formatDuration(data.tidalComparison.tidal.avgDuration), nonTidal: formatDuration(data.tidalComparison.nonTidal.avgDuration), tidalWorse: data.tidalComparison.tidal.avgDuration > data.tidalComparison.nonTidal.avgDuration },
                                { label: 'Avg Onset',    Icon: ArrowUp,  tidal: formatDuration(data.tidalComparison.tidal.avgOnset),   nonTidal: formatDuration(data.tidalComparison.nonTidal.avgOnset),   tidalWorse: data.tidalComparison.tidal.avgOnset < data.tidalComparison.nonTidal.avgOnset },
                                { label: 'Avg Drain',    Icon: ArrowDown,tidal: formatDuration(data.tidalComparison.tidal.avgDrain),   nonTidal: formatDuration(data.tidalComparison.nonTidal.avgDrain),   tidalWorse: data.tidalComparison.tidal.avgDrain > data.tidalComparison.nonTidal.avgDrain },
                            ] as const).map(({ label, Icon, tidal, nonTidal, tidalWorse }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.375rem .5rem', background: 'rgba(61,79,88,.04)', borderRadius: '6px' }}>
                                    <Icon size={11} style={{ color: 'rgba(61,79,88,.3)', flexShrink: 0 }} />
                                    <span style={{ ...META, width: '68px', flexShrink: 0, textTransform: 'uppercase' }}>{label}</span>
                                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '11px', fontWeight: 500, color: tidalWorse ? '#2A8FA4' : 'rgba(42,143,164,.45)' }}>{tidal}</span>
                                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '11px', fontWeight: 500, color: !tidalWorse ? '#3D4F58' : 'rgba(61,79,88,.35)' }}>{nonTidal}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.875rem', paddingTop: '.625rem', borderTop: '1px solid rgba(61,79,88,.07)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1A6B7C' }} />
                                <span style={META}>Tidal</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(61,79,88,.35)' }} />
                                <span style={META}>Non-tidal</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
