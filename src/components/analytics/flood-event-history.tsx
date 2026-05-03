'use client';

import { useEffect, useState, useCallback } from 'react';
import { History, ChevronDown, ChevronUp, Clock, ArrowDown, ArrowUp, Waves } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { SocrataFloodEvent } from '@/lib/nyc-opendata';

function formatDuration(mins: number): string {
    if (mins < 60) return `${Math.round(mins)}m`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatRelativeTime(dateStr: string): string {
    const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7)  return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
}

const depthColor = (in_: number) =>
    in_ > 24 ? '#C4622D' : in_ > 12 ? '#E8A030' : in_ > 4 ? 'rgba(232,160,48,.65)' : '#1A6B7C';

function parseProfileData(event: SocrataFloodEvent) {
    try {
        const depths: number[] = typeof event.flood_profile_depth_inches === 'string'
            ? JSON.parse(event.flood_profile_depth_inches)
            : event.flood_profile_depth_inches || [];
        const times: number[] = typeof event.flood_profile_time_secs === 'string'
            ? JSON.parse(event.flood_profile_time_secs)
            : event.flood_profile_time_secs || [];
        return depths.map((depth, i) => ({ time: Math.round((times[i] || 0) / 60), depth: Number(depth.toFixed(2)) }));
    } catch { return []; }
}

const CARD: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(61,79,88,.06), 0 4px 12px rgba(61,79,88,.06)',
};
const META: React.CSSProperties = { fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.35)', letterSpacing: '.05em' };

const SEVERITY_BADGES = [
    { label: '>4"',  key: 'duration_above_4_inches_mins'  as keyof SocrataFloodEvent, bg: 'rgba(232,160,48,.12)',  color: 'rgba(232,160,48,.9)' },
    { label: '>12"', key: 'duration_above_12_inches_mins' as keyof SocrataFloodEvent, bg: 'rgba(196,98,45,.12)',   color: '#C4622D' },
    { label: '>24"', key: 'duration_above_24_inches_mins' as keyof SocrataFloodEvent, bg: 'rgba(196,98,45,.2)',    color: '#B85020' },
];

export function FloodEventHistory() {
    const [events, setEvents]           = useState<SocrataFloodEvent[]>([]);
    const [isLoading, setIsLoading]     = useState(true);
    const [selectedEvent, setSelected]  = useState<SocrataFloodEvent | null>(null);
    const [daysFilter, setDaysFilter]   = useState<number>(90);

    const fetchEvents = useCallback(async () => {
        try {
            const res = await fetch(`/api/floodnet/opendata/events?days=${daysFilter}&limit=50`);
            if (!res.ok) throw new Error('Failed');
            setEvents(await res.json());
        } catch (err) {
            console.error('FloodEventHistory:', err);
        } finally {
            setIsLoading(false);
        }
    }, [daysFilter]);

    useEffect(() => {
        setIsLoading(true);
        fetchEvents();
        const id = setInterval(fetchEvents, 300000);
        return () => clearInterval(id);
    }, [fetchEvents]);

    if (isLoading) {
        return (
            <div style={CARD}>
                <div style={{ height: '8px', background: 'rgba(61,79,88,.08)', borderRadius: '4px', marginBottom: '1rem', width: '40%' }} />
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: '36px', background: 'rgba(61,79,88,.05)', borderRadius: '6px', marginBottom: '.375rem' }} />
                ))}
            </div>
        );
    }

    const totalEvents = events.length;
    const avgDuration = totalEvents > 0 ? events.reduce((s, e) => s + parseFloat(e.duration_mins || '0'), 0) / totalEvents : 0;
    const avgMaxDepth = totalEvents > 0 ? events.reduce((s, e) => s + parseFloat(e.max_depth_inches || '0'), 0) / totalEvents : 0;
    const profileData = selectedEvent ? parseProfileData(selectedEvent) : [];

    return (
        <div style={CARD}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <History size={14} style={{ color: '#1A6B7C', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: 700, color: '#3D4F58' }}>Flood Events</span>
                    <span style={{ ...META, background: 'rgba(61,79,88,.06)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        NYC Open Data
                    </span>
                </div>
                <select
                    value={daysFilter}
                    onChange={(e) => setDaysFilter(parseInt(e.target.value))}
                    style={{
                        fontFamily: 'var(--font-plex-mono)', fontSize: '10px', color: '#3D4F58',
                        background: 'rgba(61,79,88,.05)', border: '1px solid rgba(61,79,88,.12)',
                        borderRadius: '6px', padding: '3px 8px', outline: 'none', cursor: 'pointer',
                    }}
                >
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>6 months</option>
                    <option value={365}>1 year</option>
                </select>
            </div>

            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.5rem', marginBottom: '1rem' }}>
                {[
                    { label: 'Events',       value: totalEvents,                      color: '#3D4F58' },
                    { label: 'Avg Duration', value: formatDuration(avgDuration),      color: '#3D4F58' },
                    { label: 'Avg Max Depth',value: `${avgMaxDepth.toFixed(1)}"`,     color: depthColor(avgMaxDepth) },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'rgba(61,79,88,.04)', borderRadius: '8px', padding: '.5rem', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-jakarta)', fontSize: '1.1rem', fontWeight: 800, color, letterSpacing: '-.03em', lineHeight: 1 }}>
                            {value}
                        </div>
                        <div style={{ ...META, marginTop: '.2rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Event list */}
            {totalEvents === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <Waves size={28} style={{ color: 'rgba(61,79,88,.2)', margin: '0 auto .5rem' }} />
                    <p style={{ ...META, textTransform: 'uppercase', letterSpacing: '.08em' }}>No flood events in the last {daysFilter} days</p>
                </div>
            ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                    {events.map((event, i) => {
                        const maxDepth = parseFloat(event.max_depth_inches || '0');
                        const duration = parseFloat(event.duration_mins || '0');
                        const isSelected = selectedEvent === event;

                        return (
                            <div key={`${event.sensor_id}-${event.flood_start_time}-${i}`}>
                                <button
                                    onClick={() => setSelected(isSelected ? null : event)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '.5rem',
                                        padding: '.5rem .625rem', borderRadius: '8px', textAlign: 'left',
                                        cursor: 'pointer', border: 'none', transition: 'background .15s',
                                        background: isSelected ? 'rgba(26,107,124,.08)' : 'rgba(61,79,88,.04)',
                                        outline: isSelected ? '1px solid rgba(26,107,124,.2)' : 'none',
                                    }}
                                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(61,79,88,.08)'; }}
                                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(61,79,88,.04)'; }}
                                >
                                    <div style={{ width: '4px', height: '32px', borderRadius: '2px', flexShrink: 0, background: depthColor(maxDepth) }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontFamily: 'var(--font-jakarta)', fontSize: '12px', fontWeight: 600, color: '#3D4F58', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {event.sensor_name}
                                        </div>
                                        <div style={{ ...META }}>
                                            {formatRelativeTime(event.flood_start_time)} · {formatDuration(duration)}
                                        </div>
                                    </div>
                                    <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '11px', fontWeight: 700, color: depthColor(maxDepth), flexShrink: 0 }}>
                                        {maxDepth.toFixed(1)}&quot;
                                    </span>
                                    {isSelected
                                        ? <ChevronUp size={12} style={{ color: 'rgba(61,79,88,.35)', flexShrink: 0 }} />
                                        : <ChevronDown size={12} style={{ color: 'rgba(61,79,88,.35)', flexShrink: 0 }} />
                                    }
                                </button>

                                {isSelected && (
                                    <div style={{ marginTop: '.25rem', padding: '.875rem', background: 'rgba(61,79,88,.03)', borderRadius: '8px', border: '1px solid rgba(61,79,88,.08)' }}>
                                        {/* Timing row */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.5rem', marginBottom: '.75rem' }}>
                                            {[
                                                { icon: ArrowUp,   label: 'Onset', val: event.onset_time_mins,  color: '#E8A030' },
                                                { icon: ArrowDown, label: 'Drain', val: event.drain_time_mins,  color: '#1A6B7C' },
                                                { icon: Clock,     label: 'Total', val: event.duration_mins,    color: 'rgba(61,79,88,.45)' },
                                            ].map(({ icon: Icon, label, val, color }) => (
                                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.375rem' }}>
                                                    <Icon size={11} style={{ color, flexShrink: 0 }} />
                                                    <div>
                                                        <div style={{ ...META, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
                                                        <div style={{ fontFamily: 'var(--font-jakarta)', fontSize: '12px', fontWeight: 600, color: '#3D4F58' }}>
                                                            {formatDuration(parseFloat(val || '0'))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Severity badges */}
                                        <div style={{ display: 'flex', gap: '.375rem', marginBottom: '.75rem', flexWrap: 'wrap' }}>
                                            {SEVERITY_BADGES.map(({ label, key, bg, color }) => {
                                                const val = parseFloat((event[key] as string) || '0');
                                                if (val === 0) return null;
                                                return (
                                                    <span key={label} style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: bg, color, letterSpacing: '.04em' }}>
                                                        {label}: {formatDuration(val)}
                                                    </span>
                                                );
                                            })}
                                        </div>

                                        {/* Flood profile chart */}
                                        {profileData.length > 0 && (
                                            <div style={{ height: '110px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={profileData}>
                                                        <defs>
                                                            <linearGradient id="floodProfileGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%"  stopColor="#1A6B7C" stopOpacity={0.2} />
                                                                <stop offset="95%" stopColor="#1A6B7C" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(61,79,88,.08)" />
                                                        <XAxis dataKey="time" tick={{ fill: 'rgba(61,79,88,.4)', fontSize: 9 }} tickFormatter={(v) => `${v}m`} axisLine={false} tickLine={false} />
                                                        <YAxis tick={{ fill: 'rgba(61,79,88,.4)', fontSize: 9 }} tickFormatter={(v) => `${v}"`} axisLine={false} tickLine={false} width={28} />
                                                        <Tooltip
                                                            contentStyle={{ background: '#fff', border: '1px solid rgba(61,79,88,.12)', borderRadius: '8px', fontSize: '11px', color: '#3D4F58', boxShadow: '0 2px 8px rgba(61,79,88,.1)' }}
                                                            labelFormatter={(v) => `${v} min`}
                                                            formatter={(v: number) => [`${v}"`, 'Depth']}
                                                        />
                                                        <Area type="monotone" dataKey="depth" stroke="#1A6B7C" strokeWidth={1.5} fill="url(#floodProfileGradient)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        <div style={{ ...META, marginTop: '.625rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                                            {new Date(event.flood_start_time).toLocaleString()} — {new Date(event.flood_end_time).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
