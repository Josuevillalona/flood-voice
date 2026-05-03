'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type WeekData = { week: string; weekStart: string; avgScore: number; callCount: number; criticalCount: number };
type TrendData = {
    weeklyTrend: WeekData[];
    insight: string;
    summary: { totalWeeks: number; totalCalls: number };
};

const barColor = (s: number) =>
    s >= 7 ? '#C4622D' : s >= 5 ? '#E8A030' : s >= 3 ? 'rgba(232,160,48,.45)' : '#1A6B7C';

const CARD: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    boxShadow: '0 1px 3px rgba(61,79,88,.06), 0 4px 12px rgba(61,79,88,.06)',
};

export function TrendSparkline({ weeks = 4 }: { weeks?: number }) {
    const [data, setData] = useState<TrendData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/analytics/trends');
            if (!res.ok) throw new Error('Failed');
            setData(await res.json());
        } catch (err) {
            console.error('TrendSparkline:', err);
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
            <div style={CARD}>
                <div style={{ height: '8px', background: 'rgba(61,79,88,.08)', borderRadius: '4px', marginBottom: '1rem', width: '50%' }} />
                <div style={{ height: '48px', background: 'rgba(61,79,88,.06)', borderRadius: '4px' }} />
            </div>
        );
    }

    const trend = data?.weeklyTrend.slice(-weeks) || [];
    const insight = (data?.insight || 'No trend data available').replace(/[\u{1F000}-\u{1FFFF}]|[☀-➿]/gu, '').trim();

    const isWorsening = insight.toLowerCase().includes('up');
    const isImproving = insight.toLowerCase().includes('down');
    const TrendIcon = isWorsening ? TrendingUp : isImproving ? TrendingDown : Minus;
    const trendColor = isWorsening ? '#C4622D' : isImproving ? '#1A6B7C' : 'rgba(61,79,88,.4)';

    const maxScore = Math.max(...trend.map(w => w.avgScore), 10);
    const minScore = Math.min(...trend.map(w => w.avgScore), 0);
    const range = maxScore - minScore || 1;

    const insightStyle: React.CSSProperties = isWorsening
        ? { background: '#FDF3E0', borderLeft: '3px solid #E8A030', color: '#3D4F58' }
        : isImproving
        ? { background: '#E8F4F7', borderLeft: '3px solid #1A6B7C', color: '#3D4F58' }
        : { background: 'rgba(61,79,88,.05)', color: 'rgba(61,79,88,.55)' };

    return (
        <div style={CARD}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.875rem' }}>
                <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: 700, color: '#3D4F58' }}>
                    4-Week Trend
                </span>
                <TrendIcon size={14} style={{ color: trendColor }} />
            </div>

            {trend.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.3)', textAlign: 'center', padding: '1rem 0', letterSpacing: '.06em' }}>
                    INSUFFICIENT DATA
                </p>
            ) : (
                <>
                    <div style={{ height: '48px', display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '.75rem' }}>
                        {trend.map((week, i) => {
                            const heightPct = ((week.avgScore - minScore) / range) * 100;
                            const isLatest = i === trend.length - 1;
                            return (
                                <div key={week.weekStart} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div
                                        style={{
                                            width: '100%',
                                            height: `${Math.max(heightPct, 10)}%`,
                                            background: barColor(week.avgScore),
                                            borderRadius: '3px 3px 0 0',
                                            outline: isLatest ? '2px solid rgba(61,79,88,.15)' : 'none',
                                            outlineOffset: '1px',
                                            transition: 'height .3s',
                                        }}
                                        title={`${week.week}: ${week.avgScore}/10`}
                                    />
                                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.4)' }}>
                                        {week.week.replace('Week ', 'W')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ ...insightStyle, fontSize: '11px', fontFamily: 'var(--font-noto)', padding: '.5rem .625rem', borderRadius: '6px', lineHeight: 1.5 }}>
                        {insight}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.75rem', paddingTop: '.625rem', borderTop: '1px solid rgba(61,79,88,.07)' }}>
                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.35)', letterSpacing: '.04em' }}>
                            {data?.summary.totalCalls || 0} calls analyzed
                        </span>
                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.35)', letterSpacing: '.04em' }}>
                            {trend.length} weeks
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}
