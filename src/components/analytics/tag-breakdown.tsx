'use client';

import { useEffect, useState, useCallback } from 'react';
import { Activity, Utensils, Zap, Home, Brain, Droplets, FileText, CheckCircle2 } from 'lucide-react';

type TagData = { tag: string; count: number; percentage: number };
type ApiResponse = { tagDistribution: TagData[] };

const TAG_CFG: Record<string, { color: string; icon: React.ElementType }> = {
    'Medical':          { color: '#C4622D', icon: Activity },
    'Evacuation':       { color: '#C4622D', icon: Home },
    'Mental Health':    { color: 'rgba(196,98,45,.65)', icon: Brain },
    'Food/Water':       { color: '#1A6B7C', icon: Utensils },
    'Power':            { color: '#E8A030', icon: Zap },
    'Property Damage':  { color: '#E8A030', icon: Droplets },
    'Safe':             { color: '#1A6B7C', icon: CheckCircle2 },
};
const DEFAULT_CFG = { color: '#3D4F58', icon: FileText };

const CARD: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    boxShadow: '0 1px 3px rgba(61,79,88,.06), 0 4px 12px rgba(61,79,88,.06)',
};

export function TagBreakdown() {
    const [tags, setTags] = useState<TagData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/analytics/priority');
            if (!res.ok) throw new Error('Failed');
            const json: ApiResponse = await res.json();
            setTags(json.tagDistribution || []);
        } catch (err) {
            console.error('TagBreakdown:', err);
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
                <div style={{ height: '8px', background: 'rgba(61,79,88,.08)', borderRadius: '4px', marginBottom: '1rem', width: '45%' }} />
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: '20px', background: 'rgba(61,79,88,.06)', borderRadius: '4px', marginBottom: '.5rem' }} />
                ))}
            </div>
        );
    }

    const maxCount = Math.max(...tags.map(t => t.count), 1);

    return (
        <div style={CARD}>
            <div style={{ fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: 700, color: '#3D4F58', marginBottom: '1rem' }}>
                Top Concerns
            </div>

            {tags.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.3)', textAlign: 'center', padding: '1rem 0', letterSpacing: '.06em' }}>
                    NO TAGS RECORDED YET
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {tags.slice(0, 6).map((tag) => {
                        const cfg = TAG_CFG[tag.tag] || DEFAULT_CFG;
                        const Icon = cfg.icon;
                        const widthPct = (tag.count / maxCount) * 100;

                        return (
                            <div key={tag.tag}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                                        <Icon size={12} style={{ color: cfg.color, flexShrink: 0 }} />
                                        <span style={{ fontFamily: 'var(--font-noto)', fontSize: '12px', color: '#3D4F58' }}>{tag.tag}</span>
                                    </div>
                                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '11px', fontWeight: 500, color: cfg.color }}>{tag.count}</span>
                                </div>
                                <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(61,79,88,.07)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', borderRadius: '2px', background: cfg.color, width: `${widthPct}%`, opacity: 0.75, transition: 'width .5s' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
