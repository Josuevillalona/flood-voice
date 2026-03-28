'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { History, ChevronDown, ChevronUp, Clock, ArrowDown, ArrowUp, Waves } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';
import type { SocrataFloodEvent } from '@/lib/nyc-opendata';

function formatDuration(mins: number): string {
    if (mins < 60) return `${Math.round(mins)}m`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
}

function depthColor(inches: number): string {
    if (inches > 24) return 'text-red-400';
    if (inches > 12) return 'text-orange-400';
    if (inches > 4) return 'text-yellow-400';
    return 'text-green-400';
}

function depthBg(inches: number): string {
    if (inches > 24) return 'bg-red-500';
    if (inches > 12) return 'bg-orange-500';
    if (inches > 4) return 'bg-yellow-500';
    return 'bg-green-500';
}

function parseProfileData(event: SocrataFloodEvent) {
    try {
        const depths: number[] = typeof event.flood_profile_depth_inches === 'string'
            ? JSON.parse(event.flood_profile_depth_inches)
            : event.flood_profile_depth_inches || [];
        const times: number[] = typeof event.flood_profile_time_secs === 'string'
            ? JSON.parse(event.flood_profile_time_secs)
            : event.flood_profile_time_secs || [];

        return depths.map((depth, i) => ({
            time: Math.round((times[i] || 0) / 60), // convert to minutes
            depth: Number(depth.toFixed(2)),
        }));
    } catch {
        return [];
    }
}

export function FloodEventHistory() {
    const [events, setEvents] = useState<SocrataFloodEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<SocrataFloodEvent | null>(null);
    const [daysFilter, setDaysFilter] = useState<number>(90);

    const fetchEvents = useCallback(async () => {
        try {
            const res = await fetch(`/api/floodnet/opendata/events?days=${daysFilter}&limit=50`);
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();
            setEvents(json);
        } catch (err) {
            console.error('FloodEventHistory fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [daysFilter]);

    useEffect(() => {
        setIsLoading(true);
        fetchEvents();
        const interval = setInterval(fetchEvents, 300000);
        return () => clearInterval(interval);
    }, [fetchEvents]);

    if (isLoading) {
        return (
            <Card className="bg-slate-900/80 border-slate-800 p-4">
                <div className="animate-pulse">
                    <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                        <div className="h-8 bg-slate-800 rounded"></div>
                        <div className="h-8 bg-slate-800 rounded"></div>
                        <div className="h-8 bg-slate-800 rounded"></div>
                    </div>
                </div>
            </Card>
        );
    }

    // Compute summary stats
    const totalEvents = events.length;
    const avgDuration = totalEvents > 0
        ? events.reduce((sum, e) => sum + parseFloat(e.duration_mins || '0'), 0) / totalEvents
        : 0;
    const avgMaxDepth = totalEvents > 0
        ? events.reduce((sum, e) => sum + parseFloat(e.max_depth_inches || '0'), 0) / totalEvents
        : 0;

    const profileData = selectedEvent ? parseProfileData(selectedEvent) : [];

    return (
        <Card className="bg-slate-900/80 border-slate-800 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-sky-400" />
                    <h4 className="text-sm font-semibold text-white">Flood Events</h4>
                    <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                        NYC Open Data
                    </span>
                </div>
                <select
                    value={daysFilter}
                    onChange={(e) => setDaysFilter(parseInt(e.target.value))}
                    className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>6 months</option>
                    <option value={365}>1 year</option>
                </select>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-800/60 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-white">{totalEvents}</div>
                    <div className="text-[10px] text-slate-500">Events</div>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-white">{formatDuration(avgDuration)}</div>
                    <div className="text-[10px] text-slate-500">Avg Duration</div>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2 text-center">
                    <div className={cn("text-lg font-bold", depthColor(avgMaxDepth))}>
                        {avgMaxDepth.toFixed(1)}&quot;
                    </div>
                    <div className="text-[10px] text-slate-500">Avg Max Depth</div>
                </div>
            </div>

            {/* Event List */}
            {totalEvents === 0 ? (
                <div className="text-center py-6">
                    <Waves className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">No flood events in the last {daysFilter} days</p>
                </div>
            ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                    {events.map((event, i) => {
                        const maxDepth = parseFloat(event.max_depth_inches || '0');
                        const duration = parseFloat(event.duration_mins || '0');
                        const isSelected = selectedEvent === event;

                        return (
                            <div key={`${event.sensor_id}-${event.flood_start_time}-${i}`}>
                                <button
                                    onClick={() => setSelectedEvent(isSelected ? null : event)}
                                    className={cn(
                                        "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors",
                                        isSelected
                                            ? "bg-slate-700/80 ring-1 ring-sky-500/50"
                                            : "bg-slate-800/40 hover:bg-slate-800/80"
                                    )}
                                >
                                    <div className={cn("w-1.5 h-8 rounded-full flex-shrink-0", depthBg(maxDepth))} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-white truncate">
                                            {event.sensor_name}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                            {formatRelativeTime(event.flood_start_time)} · {formatDuration(duration)}
                                        </div>
                                    </div>
                                    <div className={cn("text-xs font-bold flex-shrink-0", depthColor(maxDepth))}>
                                        {maxDepth.toFixed(1)}&quot;
                                    </div>
                                    {isSelected
                                        ? <ChevronUp className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                        : <ChevronDown className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                    }
                                </button>

                                {/* Expanded Detail Panel */}
                                {isSelected && (
                                    <div className="mt-1 p-3 bg-slate-800/60 rounded-lg border border-slate-700/50">
                                        {/* Timing Details */}
                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                            <div className="flex items-center gap-1.5">
                                                <ArrowUp className="w-3 h-3 text-orange-400" />
                                                <div>
                                                    <div className="text-[10px] text-slate-500">Onset</div>
                                                    <div className="text-xs font-medium text-white">
                                                        {formatDuration(parseFloat(event.onset_time_mins || '0'))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <ArrowDown className="w-3 h-3 text-sky-400" />
                                                <div>
                                                    <div className="text-[10px] text-slate-500">Drain</div>
                                                    <div className="text-xs font-medium text-white">
                                                        {formatDuration(parseFloat(event.drain_time_mins || '0'))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                <div>
                                                    <div className="text-[10px] text-slate-500">Total</div>
                                                    <div className="text-xs font-medium text-white">
                                                        {formatDuration(parseFloat(event.duration_mins || '0'))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Severity Duration Breakdown */}
                                        <div className="flex gap-1 mb-3">
                                            {[
                                                { label: '>4"', mins: event.duration_above_4_inches_mins, color: 'bg-yellow-500/20 text-yellow-400' },
                                                { label: '>12"', mins: event.duration_above_12_inches_mins, color: 'bg-orange-500/20 text-orange-400' },
                                                { label: '>24"', mins: event.duration_above_24_inches_mins, color: 'bg-red-500/20 text-red-400' },
                                            ].map(({ label, mins, color }) => {
                                                const val = parseFloat(mins || '0');
                                                if (val === 0) return null;
                                                return (
                                                    <span key={label} className={cn("text-[10px] px-1.5 py-0.5 rounded", color)}>
                                                        {label}: {formatDuration(val)}
                                                    </span>
                                                );
                                            })}
                                        </div>

                                        {/* Flood Profile Chart */}
                                        {profileData.length > 0 && (
                                            <div className="h-[120px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={profileData}>
                                                        <defs>
                                                            <linearGradient id="floodProfileGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                                                        <XAxis
                                                            dataKey="time"
                                                            tick={{ fill: '#64748b', fontSize: 9 }}
                                                            tickFormatter={(v) => `${v}m`}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <YAxis
                                                            tick={{ fill: '#64748b', fontSize: 9 }}
                                                            tickFormatter={(v) => `${v}"`}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            width={30}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: '#1e293b',
                                                                border: '1px solid #334155',
                                                                borderRadius: '8px',
                                                                fontSize: '11px',
                                                            }}
                                                            labelFormatter={(v) => `${v} min`}
                                                            formatter={(v: number) => [`${v}"`, 'Depth']}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="depth"
                                                            stroke="#38bdf8"
                                                            strokeWidth={1.5}
                                                            fill="url(#floodProfileGradient)"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* Timestamp */}
                                        <div className="text-[10px] text-slate-600 mt-2">
                                            {new Date(event.flood_start_time).toLocaleString()} — {new Date(event.flood_end_time).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
