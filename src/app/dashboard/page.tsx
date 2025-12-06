'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Phone, CheckCircle, Droplets } from 'lucide-react';
import { FloodNetGraph } from '@/components/floodnet-graph';
import { CallLogFeed } from '@/components/call-log-feed';
import { supabase } from '@/lib/supabase';

export default function DashboardHome() {
    const [isCalling, setIsCalling] = useState(false);

    // Real Data State
    const [stats, setStats] = useState({
        totalResidents: 0,
        safe: 0,
        distress: 0,
        pending: 0,
        floodDepth: 0.0,
        floodRisk: 'Low' as 'Low' | 'Moderate' | 'High'
    });

    useEffect(() => {
        fetchStats();

        // Subscription for Resident Updates
        const channel = supabase
            .channel('dashboard-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'residents' }, () => {
                fetchResidentCounts();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchStats = async () => {
        await Promise.all([fetchResidentCounts(), fetchFloodData()]);
    };

    const fetchResidentCounts = async () => {
        const { data: residents } = await supabase.from('residents').select('status');

        if (residents) {
            const total = residents.length;
            const safe = residents.filter(r => r.status === 'safe' || r.status === 'unaffected').length;
            const distress = residents.filter(r => r.status === 'distress').length;
            const pending = total - safe - distress; // Catch-all for other statuses

            setStats(prev => ({
                ...prev,
                totalResidents: total,
                safe,
                distress,
                pending
            }));
        }
    };

    const fetchFloodData = async () => {
        try {
            const res = await fetch('/api/floodnet/history?deployment_id=dev_id_nyc_floodnet_deployment_1');
            const data = await res.json();

            // Get latest reading
            if (data && data.length > 0) {
                const latest = data[data.length - 1]; // Assuming sorted by time asc
                const depth = latest.value || 0;

                let risk: 'Low' | 'Moderate' | 'High' = 'Low';
                if (depth > 4) risk = 'Moderate';
                if (depth > 8) risk = 'High';

                setStats(prev => ({ ...prev, floodDepth: depth, floodRisk: risk }));
            }
        } catch (e) {
            console.error("Failed to fetch live flood data:", e);
        }
    };

    const handleTrigger = async () => {
        setIsCalling(true);
        try {
            const res = await fetch('/api/vapi/trigger', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                const failures = data.results?.filter((r: any) => !r.success) || [];
                if (failures.length > 0) {
                    alert(`Failed to call ${failures.length} resident(s). Error: ${failures[0].error}`);
                } else {
                    alert(`Emergency Check-in initiated for ${data.results?.length || 0} residents.`);
                }
            } else {
                alert(`Failed to trigger calls: ${data.error || 'Unknown error'}`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`Network error: ${e.message}`);
        }
        setIsCalling(false);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Command Center</h1>
                    <p className="text-slate-400">Real-time resident monitoring & flood alerts</p>
                </div>

                <button
                    onClick={handleTrigger}
                    disabled={isCalling}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg font-semibold transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <AlertTriangle className="w-5 h-5" />
                    {isCalling ? 'Initiating...' : 'Trigger Emergency Check-in'}
                </button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Flood Risk Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className={
                        `glass-panel p-6 rounded-xl border-l-4 transition-colors duration-500 ` +
                        (stats.floodRisk === 'High' ? 'border-red-500 bg-red-900/10' :
                            stats.floodRisk === 'Moderate' ? 'border-yellow-500' : 'border-blue-500')
                    }
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm font-medium">Flood Risk</span>
                        <Droplets className={"w-5 h-5 " + (stats.floodRisk === 'High' ? 'text-red-500' : stats.floodRisk === 'Moderate' ? 'text-yellow-500' : 'text-blue-500')} />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.floodRisk}</div>
                    <div className="text-xs text-slate-400 opacity-80">Sensor depth: {stats.floodDepth.toFixed(2)} in</div>
                </motion.div>

                {/* Distress Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="glass-panel p-6 rounded-xl border-l-4 border-red-500 bg-red-500/5"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-red-300 text-sm font-medium">In Distress</span>
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.distress}</div>
                    <div className="text-xs text-red-400">Requires immediate attention</div>
                </motion.div>

                {/* Pending Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="glass-panel p-6 rounded-xl border-l-4 border-slate-600"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm font-medium">Pending Response</span>
                        <Phone className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.pending}</div>
                    <div className="text-xs text-slate-500">Call active / Retrying</div>
                </motion.div>

                {/* Safe Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="glass-panel p-6 rounded-xl border-l-4 border-green-500"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm font-medium">Confirmed Safe</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.safe}</div>
                    <div className="text-xs text-green-500/80">
                        {stats.totalResidents > 0 ? Math.round((stats.safe / stats.totalResidents) * 100) : 0}% coverage
                    </div>
                </motion.div>
            </div>

            {/* Live Feed & Data Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: FloodNet Graph */}
                <div className="lg:col-span-2">
                    <FloodNetGraph />
                </div>

                {/* Right: Live Triage Feed */}
                <div className="glass-panel rounded-xl border border-white/5 flex flex-col h-[600px] overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5 flex-shrink-0">
                        <h3 className="text-sm font-semibold text-white">Live Call Feed</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                        <CallLogFeed />
                    </div>
                </div>
            </div>
        </div>
    );
}
