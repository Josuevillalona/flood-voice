'use client';

import { useEffect, useState, useCallback } from 'react';
import { Phone, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type PriorityResident = {
    callId: string;
    residentId: string;
    residentName: string;
    residentPhone: string;
    residentStatus: string;
    sentimentScore: number;
    tags: string[];
    keyTopics: string;
    callTime: string;
};

type PriorityData = {
    topPriority: PriorityResident[];
    summary: {
        totalCalls: number;
        analyzedCalls: number;
        avgScore: number;
    };
};

const scoreBadge = (score: number) => {
    if (score >= 8) return { bg: '#C4622D',              color: '#fff',    pulse: true  };
    if (score >= 6) return { bg: '#E8A030',              color: '#fff',    pulse: false };
    return              { bg: 'rgba(232,160,48,.15)',  color: '#E8A030', pulse: false };
};

const CARD: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(61,79,88,.06), 0 4px 12px rgba(61,79,88,.06)',
    overflow: 'hidden',
};

export function PriorityQueue({ limit = 10 }: { limit?: number }) {
    const [data, setData] = useState<PriorityData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/analytics/priority');
            if (!res.ok) throw new Error('Failed to fetch priority data');
            setData(await res.json());
            setError(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    if (isLoading) {
        return (
            <div style={CARD}>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ height: '56px', background: 'rgba(61,79,88,.06)', borderRadius: '8px' }} />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={CARD}>
                <p style={{ padding: '1.25rem', fontFamily: 'var(--font-noto)', fontSize: '12px', color: '#C4622D' }}>
                    Error: {error}
                </p>
            </div>
        );
    }

    const residents = data?.topPriority.slice(0, limit) || [];

    return (
        <div style={CARD}>
            {/* Header */}
            <div style={{ padding: '.875rem 1.25rem', borderBottom: '1px solid rgba(61,79,88,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C4622D', animation: 'pulse-teal 2s infinite' }} />
                    <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: 700, color: '#3D4F58' }}>
                        Priority Queue
                    </span>
                </div>
                <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.35)', letterSpacing: '.06em' }}>
                    {residents.length} need attention
                </span>
            </div>

            {/* List */}
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {residents.length === 0 ? (
                    <div style={{ padding: '2rem 1.25rem', textAlign: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(42,144,96,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem' }}>
                            <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '16px', color: '#1A6B7C' }}>✓</span>
                        </div>
                        <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: 600, color: '#3D4F58', marginBottom: '4px' }}>All residents stable</p>
                        <p style={{ fontFamily: 'var(--font-noto)', fontSize: '11px', color: 'rgba(61,79,88,.4)' }}>No critical cases requiring attention</p>
                    </div>
                ) : (
                    residents.map((resident, index) => {
                        const badge = scoreBadge(resident.sentimentScore);
                        const isTopCritical = index === 0 && resident.sentimentScore >= 8;
                        return (
                            <div
                                key={resident.callId}
                                style={{
                                    padding: '.875rem 1.25rem',
                                    borderBottom: '1px solid rgba(61,79,88,.05)',
                                    background: isTopCritical ? 'rgba(196,98,45,.03)' : 'transparent',
                                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                                }}
                            >
                                {/* Score badge */}
                                <div style={{
                                    flexShrink: 0, width: '38px', height: '38px', borderRadius: '8px',
                                    background: badge.bg, color: badge.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: 'var(--font-jakarta)', fontSize: '15px', fontWeight: 800,
                                    animation: badge.pulse ? 'pulse-teal 2s infinite' : 'none',
                                }}>
                                    {resident.sentimentScore}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                        <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: 600, color: '#3D4F58', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {resident.residentName}
                                        </span>
                                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.4)', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
                                            <Clock size={9} />
                                            {formatDistanceToNow(new Date(resident.callTime), { addSuffix: true })}
                                        </span>
                                    </div>

                                    {resident.keyTopics && (
                                        <p style={{ fontFamily: 'var(--font-noto)', fontSize: '11px', color: 'rgba(61,79,88,.5)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 4px' }}>
                                            &ldquo;{resident.keyTopics}&rdquo;
                                        </p>
                                    )}

                                    {resident.tags.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                            {resident.tags.slice(0, 3).map(tag => (
                                                <span key={tag} style={{
                                                    fontFamily: 'var(--font-plex-mono)', fontSize: '9px', letterSpacing: '.03em',
                                                    padding: '1px 6px', borderRadius: '8px',
                                                    background: 'rgba(61,79,88,.07)', color: 'rgba(61,79,88,.5)',
                                                }}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Quick call */}
                                {resident.residentPhone && (
                                    <a
                                        href={`tel:${resident.residentPhone}`}
                                        style={{ flexShrink: 0, padding: '7px', borderRadius: '8px', background: 'rgba(26,107,124,.08)', color: '#1A6B7C', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'background .15s' }}
                                        onClick={(e) => e.stopPropagation()}
                                        title={`Call ${resident.residentName}`}
                                    >
                                        <Phone size={14} />
                                    </a>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
