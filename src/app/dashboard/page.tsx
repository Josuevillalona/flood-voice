'use client';

import { useState, useEffect } from 'react';
import { Droplets } from 'lucide-react';
import { FloodNetGraph } from '@/components/floodnet-graph';
import { FloodMap } from '@/components/flood-map';
import { FloodingDetected } from '@/components/flooding-detected';
import { UrgencyBreakdown, TagBreakdown, TrendSparkline, FloodEventHistory, FloodAnalytics } from '@/components/analytics';
import { supabase } from '@/lib/supabase';
import { useFlooding } from '@/contexts/flooding-context';

export default function DashboardHome() {
    const flooding = useFlooding();

    const maxFloodDepth = flooding.floodingSensors.length > 0
        ? Math.max(...flooding.floodingSensors.map(s => s.depth_in))
        : 0;

    const floodRisk: 'Low' | 'Moderate' | 'High' =
        maxFloodDepth > 8 ? 'High' : maxFloodDepth > 4 ? 'Moderate' : 'Low';

    const [stats, setStats] = useState({ totalResidents: 0, safe: 0, distress: 0, pending: 0 });

    useEffect(() => {
        fetchResidentCounts();
        const channel = supabase
            .channel('dashboard-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'residents' }, fetchResidentCounts)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchResidentCounts = async () => {
        const { data: residents } = await supabase.from('residents').select('status');
        if (residents) {
            const total = residents.length;
            const safe = residents.filter(r => r.status === 'safe' || r.status === 'unaffected').length;
            const distress = residents.filter(r => r.status === 'distress').length;
            setStats({ totalResidents: total, safe, distress, pending: total - safe - distress });
        }
    };

    return (
        <div>
            {/* Page header */}
            <div className="db-ph">
                <div>
                    <div className="db-ph-title">Command Center</div>
                    <div className="db-ph-sub">Real-time resident monitoring &amp; flood alerts</div>
                </div>
                <button className="db-ph-btn">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Trigger Check-in
                </button>
            </div>

            {/* Stat cards */}
            <div className="db-stat-grid">
                {/* Flood Risk */}
                <div className="db-stat-card teal">
                    <div className="db-stat-label">Flood Risk</div>
                    <div className="db-stat-value">{floodRisk === 'Moderate' ? 'Mod.' : floodRisk}</div>
                    <div className="db-stat-sub">
                        {flooding.floodingSensors.length > 0
                            ? `Max depth: ${maxFloodDepth.toFixed(1)} in`
                            : `${flooding.activeSensors} sensors clear`}
                    </div>
                </div>

                {/* Flooding Detected */}
                <FloodingDetected />

                {/* In Distress */}
                <div className="db-stat-card terra">
                    <div className="db-stat-label">In Distress</div>
                    <div className="db-stat-value">{stats.distress}</div>
                    <div className="db-stat-sub">Requires immediate callback</div>
                </div>

                {/* Pending */}
                <div className="db-stat-card slate">
                    <div className="db-stat-label">Pending Response</div>
                    <div className="db-stat-value">{stats.pending}</div>
                    <div className="db-stat-sub">Call active / retrying</div>
                </div>

                {/* Safe */}
                <div className="db-stat-card green">
                    <div className="db-stat-label">Confirmed Safe</div>
                    <div className="db-stat-value">{stats.safe}</div>
                    <div className="db-stat-sub">
                        {stats.totalResidents > 0
                            ? `${Math.round((stats.safe / stats.totalResidents) * 100)}% of pod covered`
                            : '—'}
                    </div>
                </div>
            </div>

            {/* Analytics section */}
            <div style={{ marginBottom: '1rem' }}>
                <div className="db-section-head">
                    <div className="db-section-dot" />
                    <span className="db-section-title">Narrative to Numbers</span>
                    <span className="db-section-meta">AI-analyzed call insights</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>
                    {/* Left: Map + Graph */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="db-card">
                            <div className="db-card-head">
                                <span className="db-card-title">
                                    <span className="db-card-title-dot" />
                                    Flood Sensor Network
                                </span>
                                <span className="db-card-meta">85 sensors · NYC</span>
                            </div>
                            <FloodMap className="h-[400px]" />
                        </div>

                        <div className="db-card">
                            <div className="db-card-head">
                                <span className="db-card-title">
                                    <Droplets size={13} style={{ color: '#1A6B7C' }} />
                                    Water Level History
                                </span>
                                <span className="db-card-meta">FloodNet · Live</span>
                            </div>
                            <div style={{ padding: '1rem', height: '350px' }}>
                                <FloodNetGraph />
                            </div>
                        </div>
                    </div>

                    {/* Right: Analytics */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <UrgencyBreakdown />
                        <TagBreakdown />
                        <TrendSparkline weeks={4} />
                    </div>
                </div>

                <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <FloodAnalytics />
                    <FloodEventHistory />
                </div>
            </div>
        </div>
    );
}
