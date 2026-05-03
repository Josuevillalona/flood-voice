'use client';

import { useEffect, useState, useCallback } from 'react';

type UrgencyData = {
    urgencyBreakdown: {
        critical: number;
        elevated: number;
        moderate: number;
        stable: number;
    };
    summary: {
        totalCalls: number;
        analyzedCalls: number;
        avgScore: number;
    };
};

const URGENCY = [
    { key: 'critical',  label: 'Critical',  color: '#C4622D' },
    { key: 'elevated',  label: 'Elevated',  color: '#E8A030' },
    { key: 'moderate',  label: 'Moderate',  color: 'rgba(232,160,48,.45)' },
    { key: 'stable',    label: 'Stable',    color: '#1A6B7C' },
] as const;

const scoreColor = (s: number) =>
    s >= 7 ? '#C4622D' : s >= 5 ? '#E8A030' : s >= 3 ? 'rgba(232,160,48,.7)' : '#1A6B7C';

const CARD: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    boxShadow: '0 1px 3px rgba(61,79,88,.06), 0 4px 12px rgba(61,79,88,.06)',
};

export function UrgencyBreakdown() {
    const [data, setData] = useState<UrgencyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/analytics/priority');
            if (!res.ok) throw new Error('Failed');
            setData(await res.json());
        } catch (err) {
            console.error('UrgencyBreakdown:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 30000);
        return () => clearInterval(id);
    }, [fetchData]);

    if (isLoading) {
        return (
            <div style={CARD}>
                <div style={{ height: '8px', background: 'rgba(61,79,88,.08)', borderRadius: '4px', marginBottom: '1rem', width: '55%' }} />
                <div style={{ height: '28px', background: 'rgba(61,79,88,.06)', borderRadius: '20px' }} />
            </div>
        );
    }

    const breakdown = data?.urgencyBreakdown || { critical: 0, elevated: 0, moderate: 0, stable: 0 };
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return (
        <div style={CARD}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: 700, color: '#3D4F58' }}>
                    Urgency Distribution
                </span>
                {data?.summary && (
                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.35)', letterSpacing: '.06em' }}>
                        {data.summary.analyzedCalls} calls
                    </span>
                )}
            </div>

            {/* Stacked bar */}
            {total > 0 ? (
                <div style={{ height: '24px', borderRadius: '20px', overflow: 'hidden', display: 'flex', background: 'rgba(61,79,88,.06)', marginBottom: '1rem' }}>
                    {URGENCY.map(({ key, color }) => {
                        const val = breakdown[key as keyof typeof breakdown];
                        const pct = (val / total) * 100;
                        if (pct === 0) return null;
                        return (
                            <div key={key} style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width .5s' }}
                                title={`${key}: ${val}`} />
                        );
                    })}
                </div>
            ) : (
                <div style={{ height: '24px', borderRadius: '20px', background: 'rgba(61,79,88,.06)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.3)', letterSpacing: '.06em' }}>NO DATA YET</span>
                </div>
            )}

            {/* Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                {URGENCY.map(({ key, label, color }) => {
                    const val = breakdown[key as keyof typeof breakdown];
                    return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color, flexShrink: 0 }} />
                            <span style={{ fontFamily: 'var(--font-noto)', fontSize: '11px', color: 'rgba(61,79,88,.55)', flex: 1 }}>{label}</span>
                            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '11px', fontWeight: 500, color }}>
                                {val}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Avg score */}
            {data?.summary && (
                <div style={{ marginTop: '.875rem', paddingTop: '.75rem', borderTop: '1px solid rgba(61,79,88,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.4)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                        Avg Distress Score
                    </span>
                    <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '1.1rem', fontWeight: 800, color: scoreColor(data.summary.avgScore), letterSpacing: '-.03em' }}>
                        {data.summary.avgScore}/10
                    </span>
                </div>
            )}
        </div>
    );
}
