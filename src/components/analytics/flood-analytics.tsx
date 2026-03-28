'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, Flame, Waves, ArrowUp, ArrowDown, Clock, Droplets, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

type BoroughData = {
    borough: string;
    events: number;
    avgDepth: number;
    avgDuration: number;
};

type HotspotData = {
    sensorId: string;
    name: string;
    borough: string;
    events: number;
    maxDepth: number;
    avgDuration: number;
};

type TidalData = {
    tidal: { events: number; avgDepth: number; avgDuration: number; avgOnset: number; avgDrain: number };
    nonTidal: { events: number; avgDepth: number; avgDuration: number; avgOnset: number; avgDrain: number };
    sensorCount: { tidal: number; nonTidal: number };
};

type AnalyticsData = {
    totalEvents: number;
    totalSensors: number;
    boroughFrequency: BoroughData[];
    hotspots: HotspotData[];
    tidalComparison: TidalData;
};

const BOROUGH_COLORS: Record<string, string> = {
    'Brooklyn': 'bg-blue-500',
    'Queens': 'bg-purple-500',
    'Manhattan': 'bg-amber-500',
    'Bronx': 'bg-emerald-500',
    'Staten Island': 'bg-rose-500',
};

const BOROUGH_TEXT_COLORS: Record<string, string> = {
    'Brooklyn': 'text-blue-400',
    'Queens': 'text-purple-400',
    'Manhattan': 'text-amber-400',
    'Bronx': 'text-emerald-400',
    'Staten Island': 'text-rose-400',
};

function formatDuration(mins: number): string {
    if (mins < 60) return `${Math.round(mins)}m`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function FloodAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/floodnet/opendata/analytics');
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error('FloodAnalytics fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 300000);
        return () => clearInterval(interval);
    }, [fetchData]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[0, 1, 2].map(i => (
                    <Card key={i} className="bg-slate-900/80 border-slate-800 p-4">
                        <div className="animate-pulse">
                            <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
                            <div className="space-y-2">
                                <div className="h-6 bg-slate-800 rounded"></div>
                                <div className="h-6 bg-slate-800 rounded"></div>
                                <div className="h-6 bg-slate-800 rounded"></div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    if (!data) return null;

    const maxBoroughEvents = Math.max(...data.boroughFrequency.map(b => b.events), 1);
    const maxHotspotEvents = Math.max(...data.hotspots.map(h => h.events), 1);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Borough Flood Frequency */}
            <Card className="bg-slate-900/80 border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-sky-400" />
                    <h4 className="text-sm font-semibold text-white">Borough Flood Frequency</h4>
                </div>

                <div className="space-y-3">
                    {data.boroughFrequency.map((b) => (
                        <div key={b.borough}>
                            <div className="flex items-center justify-between mb-1">
                                <span className={cn("text-xs font-medium", BOROUGH_TEXT_COLORS[b.borough] || 'text-slate-300')}>
                                    {b.borough}
                                </span>
                                <span className="text-xs text-slate-400">{b.events} events</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500", BOROUGH_COLORS[b.borough] || 'bg-slate-500')}
                                    style={{ width: `${(b.events / maxBoroughEvents) * 100}%` }}
                                />
                            </div>
                            <div className="flex gap-3 mt-1">
                                <span className="text-[10px] text-slate-500">
                                    Avg depth: {b.avgDepth}&quot;
                                </span>
                                <span className="text-[10px] text-slate-500">
                                    Avg duration: {formatDuration(b.avgDuration)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {data.boroughFrequency.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">No data available</p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500">
                        {data.totalEvents} total events across {data.totalSensors} sensors
                    </span>
                </div>
            </Card>

            {/* Hotspot Sensors */}
            <Card className="bg-slate-900/80 border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <h4 className="text-sm font-semibold text-white">Flood Hotspots</h4>
                </div>

                <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                    {data.hotspots.map((h, i) => (
                        <div
                            key={h.sensorId}
                            className="flex items-center gap-2 p-2 bg-slate-800/40 rounded-lg"
                        >
                            <span className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                                i === 0 ? "bg-red-500/20 text-red-400" :
                                i === 1 ? "bg-orange-500/20 text-orange-400" :
                                i === 2 ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-slate-700 text-slate-400"
                            )}>
                                {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-white truncate">{h.name}</div>
                                <div className="text-[10px] text-slate-500">
                                    {h.borough} · Max: {h.maxDepth}&quot; · Avg: {formatDuration(h.avgDuration)}
                                </div>
                            </div>
                            <div className="flex flex-col items-end flex-shrink-0">
                                <span className={cn(
                                    "text-xs font-bold",
                                    h.events >= 10 ? "text-red-400" :
                                    h.events >= 5 ? "text-orange-400" : "text-yellow-400"
                                )}>
                                    {h.events}
                                </span>
                                <span className="text-[9px] text-slate-600">events</span>
                            </div>
                        </div>
                    ))}
                </div>

                {data.hotspots.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">No data available</p>
                )}
            </Card>

            {/* Tidal vs Non-Tidal */}
            <Card className="bg-slate-900/80 border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Waves className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-semibold text-white">Tidal vs Non-Tidal</h4>
                </div>

                {(data.tidalComparison.tidal.events === 0 && data.tidalComparison.nonTidal.events === 0) ? (
                    <p className="text-xs text-slate-500 text-center py-4">No data available</p>
                ) : (
                    <>
                        {/* Event Count Comparison */}
                        <div className="mb-4">
                            <div className="text-[10px] text-slate-500 mb-1.5">Event Distribution</div>
                            <div className="flex h-6 rounded-full overflow-hidden bg-slate-800">
                                {data.tidalComparison.tidal.events > 0 && (
                                    <div
                                        className="bg-cyan-500 flex items-center justify-center"
                                        style={{
                                            width: `${(data.tidalComparison.tidal.events / (data.tidalComparison.tidal.events + data.tidalComparison.nonTidal.events)) * 100}%`
                                        }}
                                    >
                                        <span className="text-[9px] font-bold text-white">
                                            {data.tidalComparison.tidal.events}
                                        </span>
                                    </div>
                                )}
                                {data.tidalComparison.nonTidal.events > 0 && (
                                    <div
                                        className="bg-slate-500 flex items-center justify-center"
                                        style={{
                                            width: `${(data.tidalComparison.nonTidal.events / (data.tidalComparison.tidal.events + data.tidalComparison.nonTidal.events)) * 100}%`
                                        }}
                                    >
                                        <span className="text-[9px] font-bold text-white">
                                            {data.tidalComparison.nonTidal.events}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-[10px] text-cyan-400">
                                    Tidal ({data.tidalComparison.sensorCount.tidal} sensors)
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    Non-tidal ({data.tidalComparison.sensorCount.nonTidal} sensors)
                                </span>
                            </div>
                        </div>

                        {/* Metric Comparison Table */}
                        <div className="space-y-2">
                            {[
                                {
                                    label: 'Avg Depth',
                                    icon: Droplets,
                                    tidal: `${data.tidalComparison.tidal.avgDepth}"`,
                                    nonTidal: `${data.tidalComparison.nonTidal.avgDepth}"`,
                                    tidalWorse: data.tidalComparison.tidal.avgDepth > data.tidalComparison.nonTidal.avgDepth,
                                },
                                {
                                    label: 'Avg Duration',
                                    icon: Clock,
                                    tidal: formatDuration(data.tidalComparison.tidal.avgDuration),
                                    nonTidal: formatDuration(data.tidalComparison.nonTidal.avgDuration),
                                    tidalWorse: data.tidalComparison.tidal.avgDuration > data.tidalComparison.nonTidal.avgDuration,
                                },
                                {
                                    label: 'Avg Onset',
                                    icon: ArrowUp,
                                    tidal: formatDuration(data.tidalComparison.tidal.avgOnset),
                                    nonTidal: formatDuration(data.tidalComparison.nonTidal.avgOnset),
                                    tidalWorse: data.tidalComparison.tidal.avgOnset < data.tidalComparison.nonTidal.avgOnset,
                                },
                                {
                                    label: 'Avg Drain',
                                    icon: ArrowDown,
                                    tidal: formatDuration(data.tidalComparison.tidal.avgDrain),
                                    nonTidal: formatDuration(data.tidalComparison.nonTidal.avgDrain),
                                    tidalWorse: data.tidalComparison.tidal.avgDrain > data.tidalComparison.nonTidal.avgDrain,
                                },
                            ].map(({ label, icon: Icon, tidal, nonTidal, tidalWorse }) => (
                                <div key={label} className="flex items-center gap-2 p-2 bg-slate-800/40 rounded-lg">
                                    <Icon className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                    <span className="text-[10px] text-slate-400 w-16 flex-shrink-0">{label}</span>
                                    <div className="flex-1 flex justify-between">
                                        <span className={cn(
                                            "text-xs font-medium",
                                            tidalWorse ? "text-cyan-400" : "text-cyan-400/60"
                                        )}>
                                            {tidal}
                                        </span>
                                        <span className={cn(
                                            "text-xs font-medium",
                                            !tidalWorse ? "text-slate-300" : "text-slate-300/60"
                                        )}>
                                            {nonTidal}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="flex justify-between mt-3 pt-2 border-t border-slate-800">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                                <span className="text-[10px] text-slate-500">Tidal</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-slate-500" />
                                <span className="text-[10px] text-slate-500">Non-tidal</span>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
