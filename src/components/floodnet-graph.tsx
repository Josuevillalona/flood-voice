'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Droplets, RefreshCw, MapPin, TrendingUp, Search, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFlooding } from '@/contexts/flooding-context';

const C_TEAL  = '#1A6B7C';
const C_TERRA = '#C4622D';
const C_AMBER = '#E8A030';

export function FloodNetGraph({ className }: { className?: string }) {
    const [data, setData]                       = useState<any[]>([]);
    const [sensors, setSensors]                 = useState<any[]>([]);
    const [selectedSensor, setSelectedSensor]   = useState('simply-solid-cub');
    const [timeRange, setTimeRange]             = useState('24h');
    const [isLoading, setIsLoading]             = useState(true);
    const [error, setError]                     = useState('');
    const [sensorSearch, setSensorSearch]       = useState('');
    const [isDropdownOpen, setIsDropdownOpen]   = useState(false);
    const [hasAutoSelected, setHasAutoSelected] = useState(false);

    const flooding         = useFlooding();
    const floodingSensors  = flooding.floodingSensors;

    useEffect(() => { fetchSensors(); }, []);

    useEffect(() => {
        if (floodingSensors.length > 0 && !hasAutoSelected) {
            setSelectedSensor(floodingSensors[0].id);
            setHasAutoSelected(true);
        }
    }, [floodingSensors, hasAutoSelected]);

    useEffect(() => { if (selectedSensor) fetchData(selectedSensor, timeRange); }, [selectedSensor, timeRange]);

    const fetchSensors = async () => {
        try {
            const res = await fetch('/api/floodnet/sensors');
            if (res.ok) { const d = await res.json(); setSensors(d.deployments || []); }
        } catch (e) { console.error('Failed to load sensors', e); }
    };

    const downsampleData = (rawData: any[], targetPoints = 150) => {
        if (rawData.length <= targetPoints) return rawData;
        const bucketSize = Math.ceil(rawData.length / targetPoints);
        const sampled = [];
        for (let i = 0; i < rawData.length; i += bucketSize) {
            const bucket  = rawData.slice(i, i + bucketSize);
            const maxItem = bucket.reduce((prev, curr) => parseFloat(curr.depth) > parseFloat(prev.depth) ? curr : prev, bucket[0]);
            sampled.push(maxItem);
        }
        return sampled;
    };

    const fetchData = async (sensorId: string, range: string) => {
        setIsLoading(true); setError('');
        try {
            const now = new Date(), start = new Date();
            if (range === '7d') start.setDate(now.getDate() - 7);
            else if (range === '30d') start.setDate(now.getDate() - 30);
            else start.setHours(now.getHours() - 24);

            const res = await fetch(`/api/floodnet/history?${new URLSearchParams({ id: sensorId, start: start.toISOString(), end: now.toISOString() })}`);
            if (!res.ok) throw new Error('Failed to load sensor data');

            const rawData = await res.json();
            const items   = rawData.depth_data || (Array.isArray(rawData) ? rawData : []);

            let processed = items.map((item: any) => ({
                time:    new Date(item.time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' }),
                depth:   (item.depth_proc_mm * 0.0393701).toFixed(2),
                rawTime: item.time,
            }));

            if (processed.length === 0) {
                const points = range === '24h' ? 24 : range === '7d' ? 7 : 15;
                const step   = (now.getTime() - start.getTime()) / points;
                processed = Array.from({ length: points + 1 }, (_, i) => {
                    const d = new Date(start.getTime() + i * step);
                    return { time: d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' }), depth: '0.00', rawTime: d.toISOString() };
                });
            }

            processed.sort((a: any, b: any) => new Date(a.rawTime).getTime() - new Date(b.rawTime).getTime());
            setData(downsampleData(processed));
        } catch (err: any) {
            console.error(err); setError(err.message || 'Sensor offline');
        }
        setIsLoading(false);
    };

    const currentDepth = data.length > 0 ? parseFloat(data[data.length - 1].depth) : 0;
    const maxDepth     = data.length > 0 ? data.reduce((max, item) => Math.max(max, parseFloat(item.depth)), 0) : 0;
    const isDanger     = currentDepth > 4;
    const strokeColor  = isDanger ? C_TERRA : C_TEAL;

    const formatName = (name: string) => {
        if (!name) return name;
        return name
            .replace(/^Q\s*-\s*/,  'Queens - ')
            .replace(/^BK\s*-\s*/, 'Brooklyn - ')
            .replace(/^BX\s*-\s*/, 'Bronx - ')
            .replace(/^M\s*-\s*/,  'Manhattan - ')
            .replace(/^SI\s*-\s*/, 'Staten Island - ');
    };

    const META: React.CSSProperties = { fontFamily: 'var(--font-plex-mono)', fontSize: '9px', color: 'rgba(61,79,88,.4)', letterSpacing: '.06em', textTransform: 'uppercase' };

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Flooding sensor quick-select banner */}
            {floodingSensors.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.75rem', padding: '.5rem .75rem', background: 'rgba(232,160,48,.08)', borderRadius: '8px', border: '1px solid rgba(232,160,48,.2)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontFamily: 'var(--font-jakarta)', fontSize: '11px', fontWeight: 700, color: C_AMBER }}>
                        <Waves size={11} />
                        Flooding now:
                    </span>
                    {floodingSensors.slice(0, 3).map(sensor => (
                        <button
                            key={sensor.id}
                            onClick={() => setSelectedSensor(sensor.id)}
                            style={{
                                padding: '2px 8px', borderRadius: '6px', border: '1px solid',
                                fontFamily: 'var(--font-jakarta)', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                ...(selectedSensor === sensor.id
                                    ? { background: C_AMBER, borderColor: C_AMBER, color: '#fff' }
                                    : { background: 'rgba(232,160,48,.1)', borderColor: 'rgba(232,160,48,.3)', color: C_AMBER }
                                ),
                            }}
                        >
                            {formatName(sensor.name).split(' - ')[1]?.substring(0, 15) || sensor.name.substring(0, 15)}… {sensor.depth_in}″
                        </button>
                    ))}
                    {floodingSensors.length > 3 && (
                        <span style={{ ...META, color: 'rgba(61,79,88,.4)' }}>+{floodingSensors.length - 3} more</span>
                    )}
                </div>
            )}

            {/* Controls row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem' }}>
                    {/* Droplets icon */}
                    <div style={{ padding: '6px', borderRadius: '8px', background: isDanger ? 'rgba(196,98,45,.1)' : 'rgba(26,107,124,.1)', flexShrink: 0 }}>
                        <Droplets size={16} style={{ color: isDanger ? C_TERRA : C_TEAL }} />
                    </div>

                    <div>
                        {/* Sensor selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                            <MapPin size={11} style={{ color: 'rgba(61,79,88,.35)', flexShrink: 0 }} />
                            <div style={{ position: 'relative' }}>
                                <Search size={10} style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(61,79,88,.35)', pointerEvents: 'none', zIndex: 1 }} />
                                <input
                                    type="text"
                                    placeholder={sensors.find(s => s.deployment_id === selectedSensor)?.name
                                        ? formatName(sensors.find(s => s.deployment_id === selectedSensor)?.name).substring(0, 20) + '…'
                                        : 'Select sensor…'}
                                    value={sensorSearch}
                                    onChange={e => setSensorSearch(e.target.value)}
                                    onClick={() => setIsDropdownOpen(true)}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                                    style={{
                                        width: '165px', paddingLeft: '22px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px',
                                        fontFamily: 'var(--font-noto)', fontSize: '11px', color: '#3D4F58',
                                        background: 'rgba(61,79,88,.05)', border: '1px solid rgba(61,79,88,.1)',
                                        borderRadius: '6px', outline: 'none', boxSizing: 'border-box' as const,
                                    }}
                                />
                                {isDropdownOpen && (
                                    <div style={{
                                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '230px', maxHeight: '240px',
                                        overflowY: 'auto', background: '#fff', border: '1px solid rgba(61,79,88,.12)',
                                        borderRadius: '10px', boxShadow: '0 4px 16px rgba(61,79,88,.12)', zIndex: 50,
                                    }}>
                                        {sensors
                                            .filter(s => sensorSearch === '' || s.name.toLowerCase().includes(sensorSearch.toLowerCase()) || s.deployment_id.toLowerCase().includes(sensorSearch.toLowerCase()))
                                            .map(s => (
                                                <button
                                                    key={s.deployment_id}
                                                    onMouseDown={e => { e.preventDefault(); setSelectedSensor(s.deployment_id); setSensorSearch(''); setIsDropdownOpen(false); }}
                                                    style={{
                                                        width: '100%', textAlign: 'left', padding: '7px 12px',
                                                        fontFamily: 'var(--font-noto)', fontSize: '11px', cursor: 'pointer', border: 'none',
                                                        background: selectedSensor === s.deployment_id ? 'rgba(26,107,124,.08)' : 'transparent',
                                                        color: selectedSensor === s.deployment_id ? C_TEAL : '#3D4F58',
                                                        transition: 'background .1s',
                                                    }}
                                                    onMouseEnter={e => { if (selectedSensor !== s.deployment_id) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(61,79,88,.04)'; }}
                                                    onMouseLeave={e => { if (selectedSensor !== s.deployment_id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                                                >
                                                    {formatName(s.name)}
                                                </button>
                                            ))}
                                        {sensors.filter(s => sensorSearch === '' || s.name.toLowerCase().includes(sensorSearch.toLowerCase())).length === 0 && (
                                            <div style={{ padding: '8px 12px', fontFamily: 'var(--font-noto)', fontSize: '11px', color: 'rgba(61,79,88,.4)' }}>No sensors found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <span style={{ color: 'rgba(61,79,88,.15)', fontSize: '14px' }}>|</span>

                            {/* Time range */}
                            <select
                                value={timeRange}
                                onChange={e => setTimeRange(e.target.value)}
                                style={{
                                    fontFamily: 'var(--font-jakarta)', fontSize: '11px', fontWeight: 600,
                                    color: C_TEAL, background: 'transparent', border: 'none', outline: 'none',
                                    cursor: 'pointer', appearance: 'none' as const,
                                }}
                            >
                                <option value="24h">Last 24h</option>
                                <option value="7d">Last 7 days</option>
                                <option value="30d">Last 30 days</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stats + refresh */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-jakarta)', fontSize: '1.4rem', fontWeight: 800, color: isDanger ? C_TERRA : '#3D4F58', letterSpacing: '-.03em', lineHeight: 1 }}>
                            {isLoading ? '—' : currentDepth}<span style={{ fontFamily: 'var(--font-noto)', fontSize: '11px', color: 'rgba(61,79,88,.4)', fontWeight: 400, marginLeft: '2px' }}>in</span>
                        </div>
                        <div style={{ ...META, marginTop: '2px' }}>Current</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', fontFamily: 'var(--font-jakarta)', fontSize: '1.4rem', fontWeight: 800, color: C_TEAL, letterSpacing: '-.03em', lineHeight: 1 }}>
                            {isLoading ? '—' : maxDepth.toFixed(2)}<span style={{ fontFamily: 'var(--font-noto)', fontSize: '11px', color: 'rgba(61,79,88,.4)', fontWeight: 400, marginLeft: '2px' }}>in</span>
                        </div>
                        <div style={{ ...META, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                            <TrendingUp size={9} /> Peak
                        </div>
                    </div>

                    <button
                        onClick={() => fetchData(selectedSensor, timeRange)}
                        disabled={isLoading}
                        style={{ padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(61,79,88,.35)', borderRadius: '6px' }}
                        title="Refresh"
                    >
                        <RefreshCw size={13} className={cn(isLoading && 'animate-spin')} />
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                {isLoading && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(247,244,239,.7)', zIndex: 10, backdropFilter: 'blur(2px)', borderRadius: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: '10px', color: C_TEAL, letterSpacing: '.08em' }}>SYNCING…</span>
                    </div>
                )}

                {error ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.75rem', textAlign: 'center', padding: '1rem' }}>
                        <Droplets size={24} style={{ color: 'rgba(61,79,88,.2)' }} />
                        <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '13px', fontWeight: 600, color: '#3D4F58' }}>Sensor data unavailable</p>
                        <p style={{ fontFamily: 'var(--font-noto)', fontSize: '12px', color: 'rgba(61,79,88,.45)', maxWidth: '240px', lineHeight: 1.6 }}>
                            The FloodNet API is temporarily unreachable. Data will auto-refresh.
                        </p>
                        <button
                            onClick={() => fetchData(selectedSensor, timeRange)}
                            style={{ fontFamily: 'var(--font-jakarta)', fontSize: '12px', fontWeight: 600, color: C_TEAL, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor={strokeColor} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(61,79,88,.07)" vertical={false} />
                            <XAxis
                                dataKey="time"
                                tick={{ fill: 'rgba(61,79,88,.4)', fontSize: 10, fontFamily: 'var(--font-plex-mono)' }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                tick={{ fill: 'rgba(61,79,88,.4)', fontSize: 10, fontFamily: 'var(--font-plex-mono)' }}
                                tickLine={false}
                                axisLine={false}
                                unit=" in"
                            />
                            <Tooltip
                                contentStyle={{ background: '#fff', border: '1px solid rgba(61,79,88,.12)', borderRadius: '8px', fontSize: '11px', color: '#3D4F58', boxShadow: '0 2px 8px rgba(61,79,88,.1)' }}
                                itemStyle={{ color: strokeColor, fontFamily: 'var(--font-plex-mono)', fontWeight: 500 }}
                                labelStyle={{ color: 'rgba(61,79,88,.5)', fontFamily: 'var(--font-plex-mono)', fontSize: '10px' }}
                                formatter={(value: any) => [`${value} in`, 'Depth']}
                            />
                            <Area
                                type="monotone"
                                dataKey="depth"
                                stroke={strokeColor}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorDepth)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
