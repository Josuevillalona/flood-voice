'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, FileText, Activity, Zap, Droplets, Utensils, Home, Brain, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type CallLog = {
    id: string;
    created_at: string;
    recording_url: string;
    transcript: string;
    summary: string;
    resident_id: string;
    resident: { name: string };
    tags: string[];
    sentiment_score: number;
    key_topics: string;
};

type TagConfig = {
    color: string;
    bg: string;
    icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
    short: string;
};

const TAG_CFG: Record<string, TagConfig> = {
    'Medical':         { color: '#C4622D',             bg: 'rgba(196,98,45,.12)',  icon: Activity, short: 'Med'  },
    'Evacuation':      { color: '#C4622D',             bg: 'rgba(196,98,45,.12)',  icon: Home,     short: 'Evac' },
    'Mental Health':   { color: 'rgba(196,98,45,.8)',  bg: 'rgba(196,98,45,.08)', icon: Brain,    short: 'MH'   },
    'Food/Water':      { color: '#1A6B7C',             bg: 'rgba(26,107,124,.1)',  icon: Utensils, short: 'Food' },
    'Power':           { color: '#E8A030',             bg: 'rgba(232,160,48,.12)', icon: Zap,      short: 'Pwr'  },
    'Property Damage': { color: '#E8A030',             bg: 'rgba(232,160,48,.12)', icon: Droplets, short: 'Prop' },
    'Safe':            { color: '#1A6B7C',             bg: 'rgba(26,107,124,.1)',  icon: FileText, short: 'Safe' },
};

const getTagConfig = (tag: string): TagConfig =>
    TAG_CFG[tag] ?? { color: 'rgba(61,79,88,.5)', bg: 'rgba(61,79,88,.07)', icon: FileText, short: tag.slice(0, 4) };

const scoreStyle = (score: number) => {
    if (score >= 8) return { borderColor: '#C4622D',              badgeBg: '#C4622D',              badgeColor: '#fff',    pulse: true  };
    if (score >= 6) return { borderColor: '#E8A030',              badgeBg: '#E8A030',              badgeColor: '#fff',    pulse: false };
    if (score >= 4) return { borderColor: 'rgba(232,160,48,.5)',  badgeBg: 'rgba(232,160,48,.15)', badgeColor: '#E8A030', pulse: false };
    return              { borderColor: '#1A6B7C',              badgeBg: 'rgba(26,107,124,.1)',  badgeColor: '#1A6B7C', pulse: false };
};

export function CallLogFeed({ limit = 10 }: { limit?: number }) {
    const [logs, setLogs] = useState<CallLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        const { data } = await supabase
            .from('call_logs')
            .select('id, created_at, recording_url, transcript, summary, resident_id, tags, sentiment_score, key_topics, resident:residents(name)')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (data) setLogs(data as unknown as CallLog[]);
        setIsLoading(false);
    }, [limit]);

    useEffect(() => {
        fetchLogs();
        const subscription = supabase
            .channel('call_logs_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'call_logs' }, () => fetchLogs())
            .subscribe();
        return () => { subscription.unsubscribe(); };
    }, [fetchLogs]);

    if (isLoading) return (
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '11px', color: 'rgba(61,79,88,.35)', letterSpacing: '.06em' }}>
            Scanning feed...
        </p>
    );

    if (logs.length === 0) return (
        <p style={{ fontFamily: 'var(--font-noto)', fontSize: '13px', color: 'rgba(61,79,88,.4)', textAlign: 'center', padding: '2rem 0' }}>
            No recent calls recorded.
        </p>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {logs.map((log) => {
                const score = log.sentiment_score ?? 0;
                const s = scoreStyle(score);
                const isExpanded = expandedId === log.id;

                return (
                    <div
                        key={log.id}
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        style={{
                            background: '#fff',
                            borderRadius: '8px',
                            borderLeft: `3px solid ${score > 0 ? s.borderColor : 'rgba(61,79,88,.1)'}`,
                            boxShadow: '0 1px 3px rgba(61,79,88,.06)',
                            cursor: 'pointer',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Compact row */}
                        <div style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                    <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: 600, color: '#3D4F58', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {log.resident?.name || 'Unknown'}
                                    </span>
                                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.4)', whiteSpace: 'nowrap' }}>
                                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                    {score > 0 && (
                                        <span style={{
                                            fontFamily: 'var(--font-plex-mono)', fontSize: '11px', fontWeight: 700,
                                            padding: '2px 8px', borderRadius: '12px',
                                            background: s.badgeBg, color: s.badgeColor,
                                            animation: s.pulse ? 'pulse-teal 2s infinite' : 'none',
                                        }}>
                                            {score}
                                        </span>
                                    )}
                                    <ChevronDown size={14} style={{ color: 'rgba(61,79,88,.35)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                                </div>
                            </div>

                            {(log.key_topics || (log.tags && log.tags.length > 0)) && (
                                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {log.key_topics && (
                                        <p style={{ fontFamily: 'var(--font-noto)', fontSize: '11px', color: 'rgba(61,79,88,.5)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                                            &ldquo;{log.key_topics}&rdquo;
                                        </p>
                                    )}
                                    {log.tags && log.tags.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {log.tags.map(tag => {
                                                const cfg = getTagConfig(tag);
                                                const Icon = cfg.icon;
                                                return (
                                                    <span key={tag} style={{
                                                        fontFamily: 'var(--font-plex-mono)', fontSize: '9px', letterSpacing: '.04em',
                                                        padding: '2px 8px', borderRadius: '10px',
                                                        background: cfg.bg, color: cfg.color,
                                                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                                                    }} title={tag}>
                                                        <Icon size={10} />
                                                        {cfg.short}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Expanded panel */}
                        {isExpanded && (
                            <div onClick={(e) => e.stopPropagation()} style={{ borderTop: '1px solid rgba(61,79,88,.07)', background: 'rgba(61,79,88,.02)', padding: '1rem' }}>
                                {log.recording_url && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(61,79,88,.4)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Play size={9} /> Call Recording
                                        </div>
                                        <audio controls style={{ width: '100%', height: '32px' }} src={log.recording_url} />
                                    </div>
                                )}
                                <div>
                                    <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(61,79,88,.4)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <FileText size={9} /> Full Transcript
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '11px', color: '#3D4F58', lineHeight: 1.7, padding: '.75rem', background: 'rgba(61,79,88,.03)', borderRadius: '6px', maxHeight: '240px', overflowY: 'auto', border: '1px solid rgba(61,79,88,.06)' }}>
                                        {log.transcript || 'Transcript not available.'}
                                    </div>
                                </div>
                                {(!log.sentiment_score || log.sentiment_score === 0) && (
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(61,79,88,.07)', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            style={{ fontFamily: 'var(--font-jakarta)', fontSize: '11px', fontWeight: 600, padding: '4px 12px', background: 'rgba(26,107,124,.1)', color: '#1A6B7C', border: '1px solid rgba(26,107,124,.2)', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const btn = e.currentTarget;
                                                btn.disabled = true;
                                                const orig = btn.textContent;
                                                btn.textContent = 'Analyzing...';
                                                try {
                                                    const response = await fetch('/api/analyze-call', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ callId: log.id }),
                                                    });
                                                    const result = await response.json();
                                                    if (!response.ok) throw new Error(result.error || 'Analysis failed');
                                                    if (result.success && result.analysis) {
                                                        setLogs(prev => prev.map(l =>
                                                            l.id === log.id
                                                                ? { ...l, tags: result.analysis.tags, sentiment_score: result.analysis.sentiment_score, key_topics: result.analysis.key_topics }
                                                                : l
                                                        ));
                                                    }
                                                } catch (err: unknown) {
                                                    const msg = err instanceof Error ? err.message : 'Unknown error';
                                                    alert(`Analysis Failed: ${msg}`);
                                                } finally {
                                                    btn.disabled = false;
                                                    btn.textContent = orig;
                                                }
                                            }}
                                        >
                                            <Brain size={11} />
                                            Analyze with Gemini
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
