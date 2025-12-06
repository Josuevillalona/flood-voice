'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Phone, CheckCircle, Droplets } from 'lucide-react';
import { FloodNetGraph } from '@/components/floodnet-graph';

// Mock Data for MVP visualization
const MOCK_STATS = {
    totalResidents: 42,
    safe: 38,
    distress: 1,
    pending: 3,
    floodLevel: 'Moderate' // Low, Moderate, High
};

export default function DashboardHome() {
    const [isCalling, setIsCalling] = useState(false);

    const handleTrigger = async () => {
        setIsCalling(true);
        try {
            const res = await fetch('/api/vapi/trigger', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                // Check if any specific call failed in the batch
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
                    <p className="text-slate-400">Live monitoring of Pod #104 (East Elmhurst)</p>
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
                    className="glass-panel p-6 rounded-xl border-l-4 border-yellow-500"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm font-medium">Flood Risk</span>
                        <Droplets className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">Moderate</div>
                    <div className="text-xs text-yellow-500/80">Sensor depth: 4.2 in</div>
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
                    <div className="text-3xl font-bold text-white mb-1">{MOCK_STATS.distress}</div>
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
                    <div className="text-3xl font-bold text-white mb-1">{MOCK_STATS.pending}</div>
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
                    <div className="text-3xl font-bold text-white mb-1">{MOCK_STATS.safe}</div>
                    <div className="text-xs text-green-500/80">{Math.round((MOCK_STATS.safe / MOCK_STATS.totalResidents) * 100)}% coverage</div>
                </motion.div>
            </div>

            {/* Live Feed & Data Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: FloodNet Graph */}
                <div className="lg:col-span-2">
                    <FloodNetGraph />
                </div>

                {/* Right: Live Triage Feed (Placeholder for now) */}
                <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col">
                    <div className="border-b border-white/5 pb-4 mb-4 flex justify-between items-center">
                        <h3 className="font-semibold text-lg text-white">Live Logs</h3>
                        <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs font-bold tracking-wider">0 Events</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-center text-slate-500 text-sm">
                        <p>Waiting for trigger...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
